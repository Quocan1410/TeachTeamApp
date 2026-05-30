import type { Course } from "@/shared/services/applicationService";
import { formatLecturerDisplayName } from "@/shared/utils/personDisplayName";

type CourseWithAssignments = Course & {
  courseAssignments?: Array<{
    lecturer?: {
      firstName?: string;
      lastName?: string;
      email?: string;
    };
  }>;
};

export function getCourseLecturerPlainName(course: Course): string | null {
  const assignments = (course as CourseWithAssignments).courseAssignments;
  if (!assignments?.length) return null;

  const lecturer = assignments[0]?.lecturer;
  if (!lecturer) return null;

  const name = [lecturer.firstName, lecturer.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || lecturer.email || null;
}

export function getCourseLecturerDisplayName(course: Course): string | null {
  const assignments = (course as CourseWithAssignments).courseAssignments;
  if (!assignments?.length) return null;

  const lecturer = assignments[0]?.lecturer;
  if (!lecturer) return null;

  const plain = getCourseLecturerPlainName(course);
  if (!plain) return null;

  return formatLecturerDisplayName(
    { ...lecturer, userType: "lecturer" },
    plain
  );
}

/** Formatted lecturer name for UI (Mr./Ms./Dr. + name). */
export function getCourseLecturerName(course: Course): string | null {
  return getCourseLecturerDisplayName(course);
}
