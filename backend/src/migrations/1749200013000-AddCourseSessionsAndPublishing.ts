import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCourseSessionsAndPublishing1749200013000
    implements MigrationInterface
{
    name = "AddCourseSessionsAndPublishing1749200013000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!(await queryRunner.hasColumn("courses", "studentsPerClass"))) {
            await queryRunner.query(
                "ALTER TABLE `courses` ADD `studentsPerClass` int NOT NULL DEFAULT 15"
            );
        }
        if (!(await queryRunner.hasColumn("courses", "isPublished"))) {
            await queryRunner.query(
                "ALTER TABLE `courses` ADD `isPublished` tinyint NOT NULL DEFAULT 0"
            );
        }

        const sessionsTable = await queryRunner.getTable("course_sessions");
        if (!sessionsTable) {
            await queryRunner.query(`
                CREATE TABLE \`course_sessions\` (
                    \`id\` varchar(36) NOT NULL,
                    \`courseId\` varchar(36) NOT NULL,
                    \`sessionType\` varchar(20) NOT NULL,
                    \`dayOfWeek\` tinyint NOT NULL,
                    \`startTime\` varchar(8) NOT NULL,
                    \`endTime\` varchar(8) NOT NULL,
                    \`location\` varchar(120) NULL,
                    \`capacity\` int NULL,
                    \`sortOrder\` int NOT NULL DEFAULT 0,
                    \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                    INDEX \`IDX_course_sessions_course_day_start\` (\`courseId\`, \`dayOfWeek\`, \`startTime\`),
                    PRIMARY KEY (\`id\`),
                    CONSTRAINT \`FK_course_sessions_course\` FOREIGN KEY (\`courseId\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE
                ) ENGINE=InnoDB
            `);
        }

        const requestsTable = await queryRunner.getTable(
            "course_change_requests"
        );
        if (!requestsTable) {
            await queryRunner.query(`
                CREATE TABLE \`course_change_requests\` (
                    \`id\` varchar(36) NOT NULL,
                    \`courseId\` varchar(36) NOT NULL,
                    \`requestedById\` varchar(36) NOT NULL,
                    \`requestType\` varchar(20) NOT NULL,
                    \`payload\` json NOT NULL,
                    \`status\` varchar(20) NOT NULL DEFAULT 'pending',
                    \`adminNote\` text NULL,
                    \`resolvedById\` varchar(36) NULL,
                    \`resolvedAt\` datetime NULL,
                    \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    INDEX \`IDX_course_change_requests_course_status\` (\`courseId\`, \`status\`),
                    PRIMARY KEY (\`id\`),
                    CONSTRAINT \`FK_course_change_requests_course\` FOREIGN KEY (\`courseId\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE,
                    CONSTRAINT \`FK_course_change_requests_requester\` FOREIGN KEY (\`requestedById\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
                ) ENGINE=InnoDB
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const requestsTable = await queryRunner.getTable(
            "course_change_requests"
        );
        if (requestsTable) {
            await queryRunner.query("DROP TABLE \`course_change_requests\`");
        }
        const sessionsTable = await queryRunner.getTable("course_sessions");
        if (sessionsTable) {
            await queryRunner.query("DROP TABLE \`course_sessions\`");
        }
        if (await queryRunner.hasColumn("courses", "isPublished")) {
            await queryRunner.query(
                "ALTER TABLE \`courses\` DROP COLUMN \`isPublished\`"
            );
        }
        if (await queryRunner.hasColumn("courses", "studentsPerClass")) {
            await queryRunner.query(
                "ALTER TABLE \`courses\` DROP COLUMN \`studentsPerClass\`"
            );
        }
    }
}
