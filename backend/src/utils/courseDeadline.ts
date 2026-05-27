import { Course } from "../entities/Course";

export interface CourseApplicationWindow {
    applicationDeadline: string | null;
    isApplicationOpen: boolean;
    closesInMs: number | null;
}

export const getCourseApplicationWindow = (
    course: Course,
    now: Date = new Date()
): CourseApplicationWindow => {
    if (!course.applicationDeadline) {
        return {
            applicationDeadline: null,
            isApplicationOpen: true,
            closesInMs: null,
        };
    }

    const deadline = new Date(course.applicationDeadline);
    const closesInMs = deadline.getTime() - now.getTime();

    return {
        applicationDeadline: deadline.toISOString(),
        isApplicationOpen: closesInMs > 0,
        closesInMs: closesInMs > 0 ? closesInMs : 0,
    };
};

export const assertCourseAcceptsApplications = (
    course: Course,
    now: Date = new Date()
): { ok: true } | { ok: false; message: string } => {
    const window = getCourseApplicationWindow(course, now);
    if (!window.isApplicationOpen) {
        return {
            ok: false,
            message: `Applications for ${course.courseCode} are closed.`,
        };
    }
    return { ok: true };
};
