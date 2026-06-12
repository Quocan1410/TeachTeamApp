import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncRankedForCourseWithApplication1749200006000
    implements MigrationInterface
{
    name = "SyncRankedForCourseWithApplication1749200006000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE applications a
            INNER JOIN courses c ON c.id = a.courseId
            SET a.rankedForCourse = c.courseCode
            WHERE a.\`rank\` > 0
              AND (a.rankedForCourse IS NULL OR a.rankedForCourse != c.courseCode)
        `);
    }

    public async down(): Promise<void> {
        // Irreversible data repair.
    }
}
