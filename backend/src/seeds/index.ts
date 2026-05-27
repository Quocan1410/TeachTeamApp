import { seedDefaultCourses } from "./courses";
import { seedDefaultRoles } from "./roles";
import { seedDefaultLecturersAndAssignments } from "./defaultLecturers";
import { seedDevDataset } from "./devDataset";
import { seedAnnouncements } from "./announcements";
import { seedCompleteDataset } from "./completeDataset";

/** Idempotent seed: fills every backend table with dev data. */
export async function runAllSeeds(): Promise<void> {
    await seedDefaultRoles();
    await seedDefaultCourses();
    await seedDefaultLecturersAndAssignments();
    await seedDevDataset();
    await seedCompleteDataset();
    await seedAnnouncements();
}
