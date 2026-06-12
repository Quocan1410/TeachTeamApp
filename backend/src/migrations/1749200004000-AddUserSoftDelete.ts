import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserSoftDelete1749200004000 implements MigrationInterface {
    name = "AddUserSoftDelete1749200004000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE `users` ADD `deletedAt` datetime(6) NULL"
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE `users` DROP COLUMN `deletedAt`"
        );
    }
}
