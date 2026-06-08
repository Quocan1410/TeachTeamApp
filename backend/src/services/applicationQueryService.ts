import { Brackets } from "typeorm";
import { AppDataSource } from "../config/database";
import { Application } from "../entities/Application";
import { CourseAssignment } from "../entities/CourseAssignment";
import { User, UserType } from "../entities/User";
import {
    normalizePagination,
    paginatedResult,
    type PaginatedResult,
} from "../utils/pagination";

export type LecturerApplicationFilters = {
    candidateName?: string;
    roleType?: string;
    availability?: string;
    skills?: string;
    courseCode?: string;
    status?: string;
    page?: string | number;
    pageSize?: string | number;
    sortBy?: string;
    sortDir?: string;
};

export class ApplicationQueryService {
    private applicationRepository = AppDataSource.getRepository(Application);
    private userRepository = AppDataSource.getRepository(User);
    private courseAssignmentRepository =
        AppDataSource.getRepository(CourseAssignment);

    async getLecturerApplicationsPaginated(
        lecturerId: number,
        filters: LecturerApplicationFilters,
        attachShortlistFlags: <T extends Application>(
            applications: T[]
        ) => Promise<Array<T & { isShortlisted: boolean }>>
    ): Promise<
        | { ok: false; status: number; message: string }
        | { ok: true; data: PaginatedResult<Application & { isShortlisted: boolean }> }
        | { ok: true; empty: true; message: string }
    > {
        const lecturer = await this.userRepository.findOne({
            where: { id: lecturerId, userType: UserType.LECTURER },
        });

        if (!lecturer) {
            return {
                ok: false,
                status: 403,
                message: "Only lecturers can access applications",
            };
        }

        const courseAssignments = await this.courseAssignmentRepository.find({
            where: { lecturerId },
            relations: ["course"],
        });

        const assignedCourseIds = courseAssignments.map((ca) => ca.courseId);

        if (assignedCourseIds.length === 0) {
            return {
                ok: true,
                empty: true,
                message: "No courses assigned to this lecturer",
            };
        }

        const {
            candidateName,
            roleType,
            availability,
            skills,
            courseCode,
            status = "all",
        } = filters;

        const queryBuilder = this.applicationRepository
            .createQueryBuilder("application")
            .leftJoinAndSelect("application.candidate", "candidate")
            .leftJoinAndSelect("application.commentedByUser", "commentedByUser")
            .leftJoinAndSelect("application.course", "course")
            .leftJoinAndSelect("course.courseAssignments", "courseAssignment")
            .leftJoinAndSelect("courseAssignment.lecturer", "courseLecturer")
            .leftJoinAndSelect("application.role", "role")
            .where("application.courseId IN (:...courseIds)", {
                courseIds: assignedCourseIds,
            });

        if (candidateName) {
            queryBuilder.andWhere(
                new Brackets((sub) => {
                    sub
                        .where(
                            "LOWER(candidate.firstName) LIKE LOWER(:name)",
                            { name: `%${candidateName}%` }
                        )
                        .orWhere(
                            "LOWER(candidate.lastName) LIKE LOWER(:name)",
                            { name: `%${candidateName}%` }
                        )
                        .orWhere(
                            "LOWER(CONCAT(candidate.firstName, ' ', candidate.lastName)) LIKE LOWER(:name)",
                            { name: `%${candidateName}%` }
                        );
                })
            );
        }

        if (roleType && roleType !== "all") {
            queryBuilder.andWhere("role.roleName = :roleType", { roleType });
        }

        if (availability && availability !== "all") {
            queryBuilder.andWhere(
                "JSON_UNQUOTE(JSON_EXTRACT(application.availability, '$.type')) = :availability",
                { availability }
            );
        }

        if (skills) {
            queryBuilder.andWhere(
                "LOWER(application.skills) LIKE LOWER(:skills)",
                { skills: `%${skills}%` }
            );
        }

        if (courseCode && courseCode !== "all") {
            queryBuilder.andWhere("course.courseCode = :courseCode", {
                courseCode,
            });
        }

        if (status && status !== "all") {
            queryBuilder.andWhere("application.status = :status", { status });
        }

        const sortBy = String(filters.sortBy || "appliedAt");
        const sortDir =
            String(filters.sortDir || "desc").toLowerCase() === "asc"
                ? "ASC"
                : "DESC";
        const sortColumnMap: Record<string, string> = {
            appliedAt: "application.appliedAt",
            status: "application.status",
            candidateName: "candidate.lastName",
            courseCode: "course.courseCode",
        };
        const orderColumn = sortColumnMap[sortBy] ?? "application.appliedAt";
        queryBuilder.orderBy(orderColumn, sortDir);

        const { page, pageSize, skip } = normalizePagination({
            page: filters.page,
            pageSize: filters.pageSize,
        });

        queryBuilder.skip(skip).take(pageSize);

        const [applications, totalCount] =
            await queryBuilder.getManyAndCount();
        const applicationsWithShortlist =
            await attachShortlistFlags(applications);

        return {
            ok: true,
            data: paginatedResult(
                applicationsWithShortlist,
                totalCount,
                page,
                pageSize
            ),
        };
    }
}
