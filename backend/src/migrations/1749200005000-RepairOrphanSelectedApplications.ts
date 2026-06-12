import { MigrationInterface, QueryRunner } from "typeorm";

export class RepairOrphanSelectedApplications1749200005000
    implements MigrationInterface
{
    name = "RepairOrphanSelectedApplications1749200005000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Demo seed marked some applications SELECTED without a rank, which
        // consumes tutor/lab slots but never appears on the Rankings tab.
        await queryRunner.query(`
            UPDATE applications
            SET status = 'pending'
            WHERE status = 'selected'
              AND (\`rank\` IS NULL OR \`rank\` <= 0)
              AND isWithdrawn = 0
        `);

        await queryRunner.query(`
            UPDATE applications a
            INNER JOIN courses c ON c.id = a.courseId
            SET a.rankedForCourse = c.courseCode
            WHERE a.\`rank\` > 0
              AND (a.rankedForCourse IS NULL OR a.rankedForCourse != c.courseCode)
        `);
    }

    public async down(): Promise<void> {
        // Irreversible data repair — no rollback.
    }
}
