import { MigrationInterface, QueryRunner } from "typeorm";

export class DropAnnouncementsTable1749200003000 implements MigrationInterface {
    name = "DropAnnouncementsTable1749200003000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE IF EXISTS `announcements`");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "CREATE TABLE `announcements` (`id` int NOT NULL AUTO_INCREMENT, `title` varchar(200) NOT NULL, `body` text NOT NULL, `audience` varchar(20) NOT NULL DEFAULT 'all', `startsAt` datetime NULL, `endsAt` datetime NULL, `isActive` tinyint NOT NULL DEFAULT 1, `createdBy` int NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        );
    }
}
