import { seedDefaultCourses } from "./courses";
import { seedDefaultRoles } from "./roles";
import { seedDefaultLecturersAndAssignments } from "./defaultLecturers";
import { seedDevDataset } from "./devDataset";

/** Idempotent seed: roles, courses, lecturers, dev candidates & applications. */
export async function runAllSeeds(): Promise<void> {
    await seedDefaultRoles();
    await seedDefaultCourses();
    await seedDefaultLecturersAndAssignments();
    await seedDevDataset();
}
