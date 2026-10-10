import {
  getCourseLecturerDisplayName,
  getCourseLecturerName,
  getCourseLecturerPlainName,
} from "./courseLecturer";
import type { Course } from "@/shared/services/applicationService";

function courseWithLecturer(
  lecturer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }
): Course {
  return {
    id: "c1",
    courseAssignments: lecturer
      ? [{ lecturer }]
      : [],
  } as unknown as Course;
}

describe("courseLecturer", () => {
  it("returns null when there is no lecturer assignment", () => {
    expect(getCourseLecturerPlainName(courseWithLecturer())).toBeNull();
    expect(getCourseLecturerDisplayName(courseWithLecturer())).toBeNull();
    expect(getCourseLecturerName(courseWithLecturer())).toBeNull();
  });

  it("prefers full name then email", () => {
    expect(
      getCourseLecturerPlainName(
        courseWithLecturer({ firstName: "Jane", lastName: "Doe" })
      )
    ).toBe("Jane Doe");
    expect(
      getCourseLecturerPlainName(
        courseWithLecturer({ email: "jane@rmit.edu.vn" })
      )
    ).toBe("jane@rmit.edu.vn");
  });

  it("formats a display name for UI", () => {
    const name = getCourseLecturerDisplayName(
      courseWithLecturer({ firstName: "Jane", lastName: "Doe" })
    );
    expect(name).toBeTruthy();
    expect(getCourseLecturerName(courseWithLecturer({ firstName: "Jane" }))).toBe(
      getCourseLecturerDisplayName(courseWithLecturer({ firstName: "Jane" }))
    );
  });
});
