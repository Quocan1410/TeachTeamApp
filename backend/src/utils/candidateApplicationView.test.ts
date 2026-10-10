import {
  sanitizeApplicationForCandidate,
  sanitizeApplicationsForCandidate,
} from "./candidateApplicationView";
import type { Application } from "../entities/Application";

describe("sanitizeApplicationForCandidate", () => {
  it("removes lecturer-only ranking fields", () => {
    const application = {
      id: "1",
      rank: 2,
      rankedBy: "lecturer",
      rankedAt: new Date(),
      rankedForCourse: "MARK1001",
      rankedByUser: {},
      lecturerNotes: "private",
      isShortlisted: true,
      courseId: "c1",
    } as unknown as Application;

    const sanitized = sanitizeApplicationForCandidate(application);
    expect(sanitized).not.toHaveProperty("rank");
    expect(sanitized).not.toHaveProperty("lecturerNotes");
    expect(sanitized).not.toHaveProperty("isShortlisted");
    expect(sanitized.courseId).toBe("c1");
  });

  it("maps a list of applications", () => {
    const list = sanitizeApplicationsForCandidate([
      { id: "1", rank: 1 } as unknown as Application,
    ]);
    expect(list).toHaveLength(1);
    expect(list[0]).not.toHaveProperty("rank");
  });
});
