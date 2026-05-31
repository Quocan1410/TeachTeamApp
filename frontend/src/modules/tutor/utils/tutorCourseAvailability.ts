import type {
  ApplicationResponse,
  Course,
  Role,
} from "@/shared/services/applicationService";

export function courseHasApplied(
  courseId: number,
  applications: ApplicationResponse[]
): boolean {
  return applications.some((app) => app.courseId === courseId);
}

/** Whether the course still accepts new applications (deadline + backend flag). */
export function isCourseApplicationWindowOpen(course: Course): boolean {
  if (course.isApplicationOpen === false) {
    return false;
  }

  if (course.closesInMs != null && course.closesInMs <= 0) {
    return false;
  }

  return true;
}

export function getRoleOpenSlots(course: Course, role: Role): number {
  if (!isCourseApplicationWindowOpen(course)) {
    return 0;
  }

  if (role.roleName === "tutor") {
    return course.availableTutors ?? course.maxTutors ?? 0;
  }

  return course.availableLabAssistants ?? course.maxLabAssistants ?? 0;
}

export function canApplyToRole(
  course: Course,
  role: Role,
  applications: ApplicationResponse[]
): boolean {
  if (!isCourseApplicationWindowOpen(course)) {
    return false;
  }

  const hasApplied = applications.some(
    (app) => app.courseId === course.id && app.roleId === role.id
  );

  if (hasApplied) {
    return false;
  }

  return getRoleOpenSlots(course, role) > 0;
}

export function courseHasOpenPositions(
  course: Course,
  roles: Role[]
): boolean {
  return roles.some((role) => getRoleOpenSlots(course, role) > 0);
}

/** Closed for new applications (includes courses you already applied to). */
export function isClosedCourse(course: Course, roles: Role[]): boolean {
  if (!isCourseApplicationWindowOpen(course)) {
    return true;
  }

  return !courseHasOpenPositions(course, roles);
}

export function isAvailableCourseForCandidate(
  course: Course,
  roles: Role[],
  applications: ApplicationResponse[]
): boolean {
  return roles.some((role) => canApplyToRole(course, role, applications));
}

export function getTutorDashboardStats(
  courses: Course[],
  roles: Role[],
  applications: ApplicationResponse[]
) {
  const availableCourses = courses.filter((course) =>
    isAvailableCourseForCandidate(course, roles, applications)
  ).length;

  let openPositions = 0;
  courses.forEach((course) => {
    roles.forEach((role) => {
      if (canApplyToRole(course, role, applications)) {
        openPositions += 1;
      }
    });
  });

  return {
    totalCourses: courses.length,
    availableCourses,
    totalApplications: applications.length,
    openPositions,
    closedCourses: courses.filter((course) => isClosedCourse(course, roles))
      .length,
  };
}
