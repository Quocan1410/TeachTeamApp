import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialBaseline1749200000000 implements MigrationInterface {
    name = "InitialBaseline1749200000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "CREATE TABLE `users` (`id` int NOT NULL AUTO_INCREMENT, `email` varchar(255) NOT NULL, `password` varchar(255) NOT NULL, `firstName` varchar(100) NOT NULL, `lastName` varchar(100) NOT NULL, `userType` varchar(20) NOT NULL, `honorific` varchar(10) NULL, `isBlocked` tinyint NOT NULL DEFAULT 0, `avatarUrl` varchar(512) NULL, `theme` varchar(10) NOT NULL DEFAULT 'dark', `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_97672ac88f789774dd47f7c8be` (`email`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        );
        await queryRunner.query(
            "CREATE TABLE `roles` (`id` int NOT NULL AUTO_INCREMENT, `roleName` varchar(50) NOT NULL, `description` text NULL, UNIQUE INDEX `IDX_992f24b9d80eb1312440ca577f` (`roleName`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        );
        await queryRunner.query(
            "CREATE TABLE `courses` (`id` int NOT NULL AUTO_INCREMENT, `courseCode` varchar(20) NOT NULL, `courseName` varchar(255) NOT NULL, `semester` varchar(50) NOT NULL, `description` text NULL, `maxTutors` int NOT NULL DEFAULT '5', `maxLabAssistants` int NOT NULL DEFAULT '3', `applicationDeadline` datetime NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_2a2fd7a82d6a1df5ce506dc81f` (`courseCode`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        );
        await queryRunner.query(
            "CREATE TABLE `course_assignments` (`id` int NOT NULL AUTO_INCREMENT, `lecturerId` int NOT NULL, `courseId` int NOT NULL, `assignedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_87529c47b304529d5915d02670` (`lecturerId`, `courseId`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        );
        await queryRunner.query(
            "CREATE TABLE `applications` (`id` int NOT NULL AUTO_INCREMENT, `candidateId` int NOT NULL, `courseId` int NOT NULL, `roleId` int NOT NULL, `status` varchar(20) NOT NULL DEFAULT 'pending', `availability` json NULL, `skills` text NULL, `experience` text NULL, `motivation` text NULL, `lecturerNotes` text NULL, `correspondenceMessages` json NULL, `candidateResponse` text NULL, `candidateRespondedAt` datetime NULL, `isWithdrawn` tinyint NOT NULL DEFAULT 0, `withdrawnAt` datetime NULL, `comment` text NULL, `commentedBy` int NULL, `commentedAt` datetime NULL, `messageReactions` json NULL, `rank` int NULL, `rankedBy` int NULL, `rankedAt` datetime NULL, `rankedForCourse` varchar(20) NULL, `offerResponse` varchar(20) NULL, `offerRespondedAt` datetime NULL, `reviewedAt` datetime NULL, `reviewedBy` int NULL, `appliedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_10ac2b8c520b932e7a504455a1` (`candidateId`, `courseId`, `roleId`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        );
        await queryRunner.query(
            "CREATE TABLE `selected_candidates` (`id` int NOT NULL AUTO_INCREMENT, `applicationId` int NOT NULL, `selectedById` int NOT NULL, `selectedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_ed8f7a429bb9b37c10039abacd` (`applicationId`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        );
        await queryRunner.query(
            "CREATE TABLE `notifications` (`id` int NOT NULL AUTO_INCREMENT, `userId` int NOT NULL, `type` varchar(50) NOT NULL, `title` varchar(255) NOT NULL, `message` text NOT NULL, `link` varchar(255) NULL, `metadata` json NULL, `read` tinyint NOT NULL DEFAULT 0, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        );
        await queryRunner.query(
            "CREATE TABLE `application_drafts` (`id` int NOT NULL AUTO_INCREMENT, `candidateId` int NOT NULL, `courseId` int NOT NULL, `roleId` int NOT NULL, `payload` json NOT NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_8dd9b7cbeb82b611f45680ab55` (`candidateId`, `courseId`, `roleId`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        );
        await queryRunner.query(
            "CREATE TABLE `announcements` (`id` int NOT NULL AUTO_INCREMENT, `title` varchar(200) NOT NULL, `body` text NOT NULL, `audience` varchar(20) NOT NULL DEFAULT 'all', `startsAt` datetime NULL, `endsAt` datetime NULL, `isActive` tinyint NOT NULL DEFAULT 1, `createdBy` int NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        );
        await queryRunner.query(
            "CREATE TABLE `password_reset_tokens` (`id` int NOT NULL AUTO_INCREMENT, `userId` int NOT NULL, `tokenHash` varchar(64) NOT NULL, `expiresAt` datetime NOT NULL, `usedAt` datetime NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_1143abb8c3fad8b06dd857a8c9` (`tokenHash`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        );
        await queryRunner.query(
            "CREATE TABLE `refresh_tokens` (`id` int NOT NULL AUTO_INCREMENT, `userId` int NOT NULL, `tokenHash` varchar(64) NOT NULL, `expiresAt` datetime NOT NULL, `revokedAt` datetime NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_c25bc63d248ca90e8dcc1d92d0` (`tokenHash`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        );
        await queryRunner.query(
            "CREATE TABLE `user_security_answers` (`id` int NOT NULL AUTO_INCREMENT, `userId` int NOT NULL, `questionId` varchar(32) NOT NULL, `answerHash` varchar(255) NOT NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_53b2f4c23a082a5fbd8bbe1f22` (`userId`, `questionId`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        );

        await queryRunner.query(
            "ALTER TABLE `course_assignments` ADD CONSTRAINT `FK_afcebdb8b020585379bfd466369` FOREIGN KEY (`lecturerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
        );
        await queryRunner.query(
            "ALTER TABLE `course_assignments` ADD CONSTRAINT `FK_0b9109a9fe4c01c07099a73143b` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
        );
        await queryRunner.query(
            "ALTER TABLE `applications` ADD CONSTRAINT `FK_a34254e3f2b3d20f07f8dbd6322` FOREIGN KEY (`candidateId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
        );
        await queryRunner.query(
            "ALTER TABLE `applications` ADD CONSTRAINT `FK_8456206441f962122f359031c6d` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
        );
        await queryRunner.query(
            "ALTER TABLE `applications` ADD CONSTRAINT `FK_6089e183bd8f0da82b133077dd3` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
        );
        await queryRunner.query(
            "ALTER TABLE `applications` ADD CONSTRAINT `FK_1b63a9e1ef5a643b4f4b5a46c33` FOREIGN KEY (`commentedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION"
        );
        await queryRunner.query(
            "ALTER TABLE `applications` ADD CONSTRAINT `FK_f4e480b4f8c3eb575030d05453b` FOREIGN KEY (`rankedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION"
        );
        await queryRunner.query(
            "ALTER TABLE `selected_candidates` ADD CONSTRAINT `FK_ed8f7a429bb9b37c10039abacd9` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
        );
        await queryRunner.query(
            "ALTER TABLE `selected_candidates` ADD CONSTRAINT `FK_9f6bb91fd6b00ba652254c1fa08` FOREIGN KEY (`selectedById`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
        );
        await queryRunner.query(
            "ALTER TABLE `notifications` ADD CONSTRAINT `FK_692a909ee0fa9383e7859f9b406` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
        );
        await queryRunner.query(
            "ALTER TABLE `application_drafts` ADD CONSTRAINT `FK_5a75720b38c103f10ce38274ad8` FOREIGN KEY (`candidateId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
        );
        await queryRunner.query(
            "ALTER TABLE `application_drafts` ADD CONSTRAINT `FK_9fc72b31c670fd21d68d4753728` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
        );
        await queryRunner.query(
            "ALTER TABLE `application_drafts` ADD CONSTRAINT `FK_0471f65d82e9e1d627faa066fe0` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
        );
        await queryRunner.query(
            "ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `FK_d6a19d4b4f6c62dcd29daa497e2` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
        );
        await queryRunner.query(
            "ALTER TABLE `refresh_tokens` ADD CONSTRAINT `FK_610102b60fea1455310ccd299de` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
        );
        await queryRunner.query(
            "ALTER TABLE `user_security_answers` ADD CONSTRAINT `FK_0859f65cb04d3b23eb3d68f3d57` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("SET FOREIGN_KEY_CHECKS = 0");
        const tables = [
            "user_security_answers",
            "refresh_tokens",
            "password_reset_tokens",
            "announcements",
            "application_drafts",
            "notifications",
            "selected_candidates",
            "applications",
            "course_assignments",
            "courses",
            "roles",
            "users",
        ];
        for (const table of tables) {
            await queryRunner.query(`DROP TABLE IF EXISTS \`${table}\``);
        }
        await queryRunner.query("SET FOREIGN_KEY_CHECKS = 1");
    }
}
