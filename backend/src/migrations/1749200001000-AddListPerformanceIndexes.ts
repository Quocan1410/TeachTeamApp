import { MigrationInterface, QueryRunner } from "typeorm";

export class AddListPerformanceIndexes1749200001000
    implements MigrationInterface
{
    name = "AddListPerformanceIndexes1749200001000";

    private async ensureIndex(
        queryRunner: QueryRunner,
        tableName: string,
        indexName: string,
        columns: string
    ): Promise<void> {
        const table = await queryRunner.getTable(tableName);
        const exists = table?.indices.some((idx) => idx.name === indexName);
        if (!exists) {
            await queryRunner.query(
                `CREATE INDEX \`${indexName}\` ON \`${tableName}\` (${columns})`
            );
        }
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.ensureIndex(
            queryRunner,
            "users",
            "IDX_users_userType_createdAt",
            "`userType`, `createdAt`"
        );
        await this.ensureIndex(
            queryRunner,
            "users",
            "IDX_users_isBlocked",
            "`isBlocked`"
        );
        await this.ensureIndex(
            queryRunner,
            "applications",
            "IDX_applications_status_appliedAt",
            "`status`, `appliedAt`"
        );
        await this.ensureIndex(
            queryRunner,
            "notifications",
            "IDX_notifications_userId_createdAt",
            "`userId`, `createdAt`"
        );
        await this.ensureIndex(
            queryRunner,
            "announcements",
            "IDX_announcements_isActive_createdAt",
            "`isActive`, `createdAt`"
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "DROP INDEX `IDX_announcements_isActive_createdAt` ON `announcements`"
        );
        await queryRunner.query(
            "DROP INDEX `IDX_notifications_userId_createdAt` ON `notifications`"
        );
        await queryRunner.query(
            "DROP INDEX `IDX_applications_status_appliedAt` ON `applications`"
        );
        await queryRunner.query(
            "DROP INDEX `IDX_users_isBlocked` ON `users`"
        );
        await queryRunner.query(
            "DROP INDEX `IDX_users_userType_createdAt` ON `users`"
        );
    }
}
