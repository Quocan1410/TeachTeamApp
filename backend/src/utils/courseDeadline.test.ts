import {
  assertCourseAcceptsApplications,
  getCourseApplicationWindow,
} from "./courseDeadline";
import { Course } from "../entities/Course";

function course(partial: Partial<Course>): Course {
  return {
    courseCode: "MARK1001",
    ...partial,
  } as Course;
}

describe("getCourseApplicationWindow", () => {
  const now = new Date("2026-06-01T00:00:00.000Z");

  it("treats a missing deadline as open", () => {
    expect(getCourseApplicationWindow(course({}), now)).toEqual({
      applicationDeadline: null,
      isApplicationOpen: true,
      closesInMs: null,
    });
  });

  it("marks a future deadline as open", () => {
    const window = getCourseApplicationWindow(
      course({ applicationDeadline: new Date("2026-07-01T00:00:00.000Z") }),
      now
    );
    expect(window.isApplicationOpen).toBe(true);
    expect(window.closesInMs).toBeGreaterThan(0);
  });

  it("marks a past deadline as closed", () => {
    const window = getCourseApplicationWindow(
      course({ applicationDeadline: new Date("2026-05-01T00:00:00.000Z") }),
      now
    );
    expect(window.isApplicationOpen).toBe(false);
    expect(window.closesInMs).toBe(0);
  });
});

describe("assertCourseAcceptsApplications", () => {
  const now = new Date("2026-06-01T00:00:00.000Z");

  it("allows open courses", () => {
    expect(
      assertCourseAcceptsApplications(
        course({ applicationDeadline: new Date("2026-07-01T00:00:00.000Z") }),
        now
      )
    ).toEqual({ ok: true });
  });

  it("rejects closed courses", () => {
    expect(
      assertCourseAcceptsApplications(
        course({ applicationDeadline: new Date("2026-05-01T00:00:00.000Z") }),
        now
      )
    ).toEqual({
      ok: false,
      message: "Applications for MARK1001 are closed.",
    });
  });
});
