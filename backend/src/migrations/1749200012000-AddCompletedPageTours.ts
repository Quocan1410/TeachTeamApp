import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompletedPageTours1749200012000 implements MigrationInterface {
    name = "AddCompletedPageTours1749200012000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(
            "users",
            "completedPageTours"
        );
        if (!hasColumn) {
            await queryRunner.query(
                "ALTER TABLE `users` ADD `completedPageTours` json NULL"
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(
            "users",
            "completedPageTours"
        );
        if (hasColumn) {
            await queryRunner.query(
                "ALTER TABLE `users` DROP COLUMN `completedPageTours`"
            );
        }
    }
}
