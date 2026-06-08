import { MigrationInterface, QueryRunner, TableForeignKey } from "typeorm";

export class AddApplicationReviewForeignKey1749200002000
    implements MigrationInterface
{
    name = "AddApplicationReviewForeignKey1749200002000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("applications");
        const hasFk = table?.foreignKeys.some(
            (fk) => fk.name === "FK_applications_reviewedBy"
        );
        if (!hasFk) {
            await queryRunner.createForeignKey(
                "applications",
                new TableForeignKey({
                    name: "FK_applications_reviewedBy",
                    columnNames: ["reviewedBy"],
                    referencedTableName: "users",
                    referencedColumnNames: ["id"],
                    onDelete: "SET NULL",
                })
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("applications");
        const fk = table?.foreignKeys.find(
            (key) => key.name === "FK_applications_reviewedBy"
        );
        if (fk) {
            await queryRunner.dropForeignKey("applications", fk);
        }
    }
}
