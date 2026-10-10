import {
  applicationHasLecturerReview,
  touchApplicationReviewed,
} from "./applicationReview";
import type { Application } from "../entities/Application";

describe("applicationHasLecturerReview", () => {
  it("detects reviewedAt, comment, or lecturer messages", () => {
    expect(
      applicationHasLecturerReview({
        reviewedAt: new Date(),
      } as Application)
    ).toBe(true);
    expect(
      applicationHasLecturerReview({
        comment: "Looks good",
      } as Application)
    ).toBe(true);
    expect(
      applicationHasLecturerReview({
        correspondenceMessages: [
          {
            id: "1",
            authorRole: "lecturer",
            authorId: "l1",
            body: "Hi",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      } as unknown as Application)
    ).toBe(true);
    expect(applicationHasLecturerReview({} as Application)).toBe(false);
  });
});

describe("touchApplicationReviewed", () => {
  it("sets reviewedAt once", () => {
    const application = {} as Application;
    expect(touchApplicationReviewed(application, "lecturer-1")).toBe(true);
    expect(application.reviewedAt).toBeInstanceOf(Date);
    expect(application.reviewedBy).toBe("lecturer-1");
    expect(touchApplicationReviewed(application, "lecturer-2")).toBe(false);
  });
});
