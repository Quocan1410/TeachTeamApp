import type { EntityManager, Repository } from "typeorm";
import { Application, ApplicationStatus } from "../entities/Application";

type RoleName = "tutor" | "lab_assistant";

export async function countActiveSelectedForRole(
    applicationRepository: Repository<Application> | EntityManager,
    courseId: number,
    roleName: RoleName,
    excludeApplicationId?: number
): Promise<number> {
    const repo =
        "getRepository" in applicationRepository
            ? applicationRepository.getRepository(Application)
            : applicationRepository;

    const query = repo
        .createQueryBuilder("application")
        .innerJoin("application.role", "role")
        .where("application.courseId = :courseId", { courseId })
        .andWhere("application.roleId = role.id")
        .andWhere("role.roleName = :roleName", { roleName })
        .andWhere("application.status = :status", {
            status: ApplicationStatus.SELECTED,
        })
        .andWhere("application.isWithdrawn = :isWithdrawn", {
            isWithdrawn: false,
        });

    if (excludeApplicationId !== undefined) {
        query.andWhere("application.id != :applicationId", {
            applicationId: excludeApplicationId,
        });
    }

    return query.getCount();
}
