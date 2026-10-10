import {
  canApplyToRole,
  courseHasApplied,
  courseHasOpenPositions,
  getRoleOpenSlots,
  getTutorDashboardStats,
  isAvailableCourseForCandidate,
  isClosedCourse,
  isCourseApplicationWindowOpen,
} from "./tutorCourseAvailability";
import type {
  ApplicationResponse,
  Course,
  Role,
} from "@/shared/services/applicationService";

const tutorRole = { id: "r-tutor", roleName: "tutor" } as Role;
const labRole = { id: "r-lab", roleName: "lab_assistant" } as Role;

function course(overrides: Partial<Course> = {}): Course {
  return {
    id: "c1",
    isApplicationOpen: true,
    closesInMs: 60_000,
    availableTutors: 2,
    availableLabAssistants: 1,
    maxTutors: 2,
    maxLabAssistants: 1,
    ...overrides,
  } as Course;
}

describe("tutorCourseAvailability", () => {
  it("detects applied courses and open windows", () => {
    const apps = [{ courseId: "c1" }] as ApplicationResponse[];
    expect(courseHasApplied("c1", apps)).toBe(true);
    expect(courseHasApplied("c2", apps)).toBe(false);
    expect(isCourseApplicationWindowOpen(course())).toBe(true);
    expect(
      isCourseApplicationWindowOpen(course({ isApplicationOpen: false }))
    ).toBe(false);
    expect(isCourseApplicationWindowOpen(course({ closesInMs: 0 }))).toBe(
      false
    );
  });

  it("computes open slots and apply eligibility", () => {
    const open = course();
    expect(getRoleOpenSlots(open, tutorRole)).toBe(2);
    expect(getRoleOpenSlots(open, labRole)).toBe(1);
    expect(getRoleOpenSlots(course({ closesInMs: -1 }), tutorRole)).toBe(0);

    expect(canApplyToRole(open, tutorRole, [])).toBe(true);
    expect(
      canApplyToRole(open, tutorRole, [
        { courseId: "c1", roleId: "r-tutor" },
      ] as ApplicationResponse[])
    ).toBe(false);
    expect(
      canApplyToRole(course({ availableTutors: 0, maxTutors: 0 }), tutorRole, [])
    ).toBe(false);
  });

  it("summarizes dashboard stats", () => {
    const courses = [
      course({ id: "c1" }),
      course({ id: "c2", isApplicationOpen: false }),
    ];
    const roles = [tutorRole, labRole];
    expect(courseHasOpenPositions(courses[0], roles)).toBe(true);
    expect(isClosedCourse(courses[1], roles)).toBe(true);
    expect(isAvailableCourseForCandidate(courses[0], roles, [])).toBe(true);

    const stats = getTutorDashboardStats(courses, roles, []);
    expect(stats.totalCourses).toBe(2);
    expect(stats.availableCourses).toBe(1);
    expect(stats.closedCourses).toBe(1);
    expect(stats.openPositions).toBeGreaterThan(0);
  });
});
