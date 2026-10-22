import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCourseCoverImageUrl1749200014000 implements MigrationInterface {
    name = "AddCourseCoverImageUrl1749200014000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const columns = await queryRunner.query(
            `SHOW COLUMNS FROM \`courses\` LIKE 'coverImageUrl'`
        );
        if (!columns.length) {
            await queryRunner.query(
                `ALTER TABLE \`courses\` ADD \`coverImageUrl\` varchar(512) NULL`
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const columns = await queryRunner.query(
            `SHOW COLUMNS FROM \`courses\` LIKE 'coverImageUrl'`
        );
        if (columns.length) {
            await queryRunner.query(
                `ALTER TABLE \`courses\` DROP COLUMN \`coverImageUrl\``
            );
        }
    }
}
