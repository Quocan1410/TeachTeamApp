import { MigrationInterface, QueryRunner } from "typeorm";

const TABLES = [
    "users",
    "roles",
    "courses",
    "course_assignments",
    "applications",
    "selected_candidates",
    "notifications",
    "application_drafts",
    "refresh_tokens",
];

const FK_COLUMNS: Array<{
    table: string;
    column: string;
    map: string;
    nullable: boolean;
}> = [
    { table: "course_assignments", column: "lecturerId", map: "users", nullable: false },
    { table: "course_assignments", column: "courseId", map: "courses", nullable: false },
    { table: "applications", column: "candidateId", map: "users", nullable: false },
    { table: "applications", column: "courseId", map: "courses", nullable: false },
    { table: "applications", column: "roleId", map: "roles", nullable: false },
    { table: "applications", column: "commentedBy", map: "users", nullable: true },
    { table: "applications", column: "rankedBy", map: "users", nullable: true },
    { table: "applications", column: "reviewedBy", map: "users", nullable: true },
    { table: "selected_candidates", column: "applicationId", map: "applications", nullable: false },
    { table: "selected_candidates", column: "selectedById", map: "users", nullable: false },
    { table: "notifications", column: "userId", map: "users", nullable: false },
    { table: "application_drafts", column: "candidateId", map: "users", nullable: false },
    { table: "application_drafts", column: "courseId", map: "courses", nullable: false },
    { table: "application_drafts", column: "roleId", map: "roles", nullable: false },
    { table: "refresh_tokens", column: "userId", map: "users", nullable: false },
];

const USER_KEYS = new Set([
    "userId",
    "candidateId",
    "lecturerId",
    "selectedById",
    "commentedBy",
    "rankedBy",
    "reviewedBy",
    "createdBy",
    "authorId",
]);

type IdMap = Map<number, string>;

function mapForKey(
    key: string,
    maps: { users: IdMap; courses: IdMap; roles: IdMap; applications: IdMap }
): IdMap | null {
    if (USER_KEYS.has(key)) return maps.users;
    if (key === "courseId") return maps.courses;
    if (key === "roleId") return maps.roles;
    if (key === "applicationId") return maps.applications;
    return null;
}

function asJson(value: unknown): unknown {
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }
    return value;
}

function rewriteReactionUserIds(value: unknown, users: IdMap): unknown {
    if (!value || typeof value !== "object" || Array.isArray(value)) return value;
    const out: Record<string, Record<string, string[]>> = {};
    for (const [messageId, byEmoji] of Object.entries(
        value as Record<string, unknown>
    )) {
        if (!byEmoji || typeof byEmoji !== "object" || Array.isArray(byEmoji)) {
            continue;
        }
        const nextEmoji: Record<string, string[]> = {};
        for (const [emoji, ids] of Object.entries(
            byEmoji as Record<string, unknown>
        )) {
            if (!Array.isArray(ids)) continue;
            nextEmoji[emoji] = ids.map((id) =>
                typeof id === "number" ? users.get(id) ?? String(id) : String(id)
            );
        }
        out[messageId] = nextEmoji;
    }
    return out;
}

function rewriteJsonIds(
    value: unknown,
    maps: { users: IdMap; courses: IdMap; roles: IdMap; applications: IdMap }
): unknown {
    if (Array.isArray(value)) {
        return value.map((item) => rewriteJsonIds(item, maps));
    }
    if (!value || typeof value !== "object") return value;
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        if (typeof child === "number" && Number.isInteger(child)) {
            const mapped = mapForKey(key, maps)?.get(child);
            out[key] = mapped ?? child;
            continue;
        }
        if (Array.isArray(child) && child.every((item) => typeof item === "number")) {
            const mappedList = mapForKey(key, maps);
            out[key] = mappedList
                ? child.map((item) => mappedList.get(item as number) ?? item)
                : child;
            continue;
        }
        out[key] = rewriteJsonIds(child, maps);
    }
    return out;
}

export class UseUuidPrimaryKeys1749200008000 implements MigrationInterface {
    name = "UseUuidPrimaryKeys1749200008000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const table of TABLES) {
            await queryRunner.query(
                `CREATE TABLE \`_uuid_${table}\` (old_id INT NOT NULL PRIMARY KEY, new_id CHAR(36) NOT NULL)`
            );
            await queryRunner.query(
                `INSERT INTO \`_uuid_${table}\` (old_id, new_id) SELECT id, UUID() FROM \`${table}\``
            );
        }

        const loadMap = async (table: string): Promise<IdMap> => {
            const rows = (await queryRunner.query(
                `SELECT old_id, new_id FROM \`_uuid_${table}\``
            )) as Array<{ old_id: number; new_id: string }>;
            return new Map(rows.map((row) => [Number(row.old_id), row.new_id]));
        };
        const maps = {
            users: await loadMap("users"),
            courses: await loadMap("courses"),
            roles: await loadMap("roles"),
            applications: await loadMap("applications"),
        };

        const applications = (await queryRunner.query(
            "SELECT id, correspondenceMessages, messageReactions FROM applications"
        )) as Array<{
            id: number;
            correspondenceMessages: unknown;
            messageReactions: unknown;
        }>;
        for (const row of applications) {
            if (!row.correspondenceMessages && !row.messageReactions) continue;
            await queryRunner.query(
                "UPDATE applications SET correspondenceMessages = ?, messageReactions = ? WHERE id = ?",
                [
                    row.correspondenceMessages
                        ? JSON.stringify(
                              rewriteJsonIds(asJson(row.correspondenceMessages), maps)
                          )
                        : null,
                    row.messageReactions
                        ? JSON.stringify(
                              rewriteReactionUserIds(
                                  asJson(row.messageReactions),
                                  maps.users
                              )
                          )
                        : null,
                    row.id,
                ]
            );
        }

        const notifications = (await queryRunner.query(
            "SELECT id, metadata FROM notifications WHERE metadata IS NOT NULL"
        )) as Array<{ id: number; metadata: unknown }>;
        for (const row of notifications) {
            await queryRunner.query(
                "UPDATE notifications SET metadata = ? WHERE id = ?",
                [JSON.stringify(rewriteJsonIds(asJson(row.metadata), maps)), row.id]
            );
        }

        const indexRows = (await queryRunner.query(`
            SELECT TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX, COLUMN_NAME, NON_UNIQUE
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME <> 'PRIMARY'
            ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
        `)) as Array<{
            TABLE_NAME: string;
            INDEX_NAME: string;
            SEQ_IN_INDEX: number;
            COLUMN_NAME: string;
            NON_UNIQUE: number;
        }>;
        const touchedColumns = new Set(
            FK_COLUMNS.map((item) => `${item.table}.${item.column}`)
        );
        const indexes = new Map<
            string,
            { table: string; name: string; unique: boolean; columns: string[] }
        >();
        for (const row of indexRows) {
            const key = `${row.TABLE_NAME}.${row.INDEX_NAME}`;
            const current = indexes.get(key) ?? {
                table: row.TABLE_NAME,
                name: row.INDEX_NAME,
                unique: Number(row.NON_UNIQUE) === 0,
                columns: [],
            };
            current.columns[Number(row.SEQ_IN_INDEX) - 1] = row.COLUMN_NAME;
            indexes.set(key, current);
        }
        const indexesToRestore = [...indexes.values()].filter((index) =>
            index.columns.some((column) =>
                touchedColumns.has(`${index.table}.${column}`)
            )
        );

        const foreignKeys = (await queryRunner.query(`
            SELECT TABLE_NAME, CONSTRAINT_NAME
            FROM information_schema.REFERENTIAL_CONSTRAINTS
            WHERE CONSTRAINT_SCHEMA = DATABASE()
        `)) as Array<{ TABLE_NAME: string; CONSTRAINT_NAME: string }>;
        for (const foreignKey of foreignKeys) {
            await queryRunner.query(
                `ALTER TABLE \`${foreignKey.TABLE_NAME}\` DROP FOREIGN KEY \`${foreignKey.CONSTRAINT_NAME}\``
            );
        }

        for (const index of indexesToRestore) {
            await queryRunner.query(
                `ALTER TABLE \`${index.table}\` DROP INDEX \`${index.name}\``
            );
        }

        for (const item of FK_COLUMNS) {
            await queryRunner.query(
                `ALTER TABLE \`${item.table}\` ADD COLUMN \`${item.column}_uuid\` CHAR(36) NULL`
            );
            await queryRunner.query(
                `UPDATE \`${item.table}\` t
                 JOIN \`_uuid_${item.map}\` m ON t.\`${item.column}\` = m.old_id
                 SET t.\`${item.column}_uuid\` = m.new_id`
            );
            await queryRunner.query(
                `ALTER TABLE \`${item.table}\` DROP COLUMN \`${item.column}\``
            );
            await queryRunner.query(
                `ALTER TABLE \`${item.table}\` CHANGE \`${item.column}_uuid\` \`${item.column}\` CHAR(36) ${item.nullable ? "NULL" : "NOT NULL"}`
            );
        }

        for (const table of TABLES) {
            await queryRunner.query(
                `ALTER TABLE \`${table}\` MODIFY \`id\` INT NOT NULL`
            );
            await queryRunner.query(
                `ALTER TABLE \`${table}\` DROP PRIMARY KEY`
            );
            await queryRunner.query(
                `ALTER TABLE \`${table}\` ADD COLUMN \`id_uuid\` CHAR(36) NULL`
            );
            await queryRunner.query(
                `UPDATE \`${table}\` t
                 JOIN \`_uuid_${table}\` m ON t.id = m.old_id
                 SET t.id_uuid = m.new_id`
            );
            await queryRunner.query(`ALTER TABLE \`${table}\` DROP COLUMN \`id\``);
            await queryRunner.query(
                `ALTER TABLE \`${table}\` CHANGE \`id_uuid\` \`id\` CHAR(36) NOT NULL`
            );
            await queryRunner.query(
                `ALTER TABLE \`${table}\` ADD PRIMARY KEY (\`id\`)`
            );
        }

        for (const index of indexesToRestore) {
            const columns = index.columns.map((column) => `\`${column}\``).join(", ");
            const unique = index.unique ? "UNIQUE " : "";
            await queryRunner.query(
                `CREATE ${unique}INDEX \`${index.name}\` ON \`${index.table}\` (${columns})`
            );
        }

        const foreignKeySql = [
            "ALTER TABLE `course_assignments` ADD CONSTRAINT `FK_course_assignments_lecturer` FOREIGN KEY (`lecturerId`) REFERENCES `users`(`id`) ON DELETE CASCADE",
            "ALTER TABLE `course_assignments` ADD CONSTRAINT `FK_course_assignments_course` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE",
            "ALTER TABLE `applications` ADD CONSTRAINT `FK_applications_candidate` FOREIGN KEY (`candidateId`) REFERENCES `users`(`id`) ON DELETE CASCADE",
            "ALTER TABLE `applications` ADD CONSTRAINT `FK_applications_course` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE",
            "ALTER TABLE `applications` ADD CONSTRAINT `FK_applications_role` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE",
            "ALTER TABLE `applications` ADD CONSTRAINT `FK_applications_commentedBy` FOREIGN KEY (`commentedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL",
            "ALTER TABLE `applications` ADD CONSTRAINT `FK_applications_rankedBy` FOREIGN KEY (`rankedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL",
            "ALTER TABLE `applications` ADD CONSTRAINT `FK_applications_reviewedBy` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL",
            "ALTER TABLE `selected_candidates` ADD CONSTRAINT `FK_selected_candidates_application` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE CASCADE",
            "ALTER TABLE `selected_candidates` ADD CONSTRAINT `FK_selected_candidates_selectedBy` FOREIGN KEY (`selectedById`) REFERENCES `users`(`id`) ON DELETE CASCADE",
            "ALTER TABLE `notifications` ADD CONSTRAINT `FK_notifications_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE",
            "ALTER TABLE `application_drafts` ADD CONSTRAINT `FK_application_drafts_candidate` FOREIGN KEY (`candidateId`) REFERENCES `users`(`id`) ON DELETE CASCADE",
            "ALTER TABLE `application_drafts` ADD CONSTRAINT `FK_application_drafts_course` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE",
            "ALTER TABLE `application_drafts` ADD CONSTRAINT `FK_application_drafts_role` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE",
            "ALTER TABLE `refresh_tokens` ADD CONSTRAINT `FK_refresh_tokens_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE",
        ];
        for (const sql of foreignKeySql) {
            await queryRunner.query(sql);
        }

        for (const table of TABLES) {
            await queryRunner.query(`DROP TABLE \`_uuid_${table}\``);
        }
    }

    public async down(): Promise<void> {
        throw new Error("UUID primary keys are not reverted");
    }
}
