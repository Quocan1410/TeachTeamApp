jest.mock("@/shared/styles/applicationStatus.module.css", () => {
  const styles = new Proxy(
    {},
    {
      get: (_target, prop: string | symbol) => String(prop),
    }
  );
  return { __esModule: true, default: styles };
});

import {
  applicationHasLecturerReview,
  getApplicationStatusClassName,
  getApplicationStatusLabel,
  resolveApplicationStatusDisplay,
} from "./applicationStatus";

describe("getApplicationStatusLabel", () => {
  it("returns the visible status label in priority order", () => {
    expect(getApplicationStatusLabel("pending", true)).toBe("Withdrawn");
    expect(getApplicationStatusLabel("pending", false, true)).toBe("Blocked");
    expect(getApplicationStatusLabel("selected")).toBe("Selected");
    expect(getApplicationStatusLabel("rejected")).toBe("Not selected");
    expect(getApplicationStatusLabel("pending", false, false, false, true)).toBe(
      "Ranked"
    );
    expect(getApplicationStatusLabel("pending", false, false, true)).toBe(
      "Shortlisted"
    );
    expect(
      getApplicationStatusLabel("pending", false, false, false, false, true)
    ).toBe("Reviewed");
    expect(getApplicationStatusLabel("pending")).toBe("Pending");
  });
});

describe("applicationHasLecturerReview", () => {
  it("detects review markers", () => {
    expect(applicationHasLecturerReview({ reviewedAt: "2026-01-01" })).toBe(
      true
    );
    expect(applicationHasLecturerReview({ comment: "Looks good" })).toBe(true);
    expect(applicationHasLecturerReview({})).toBe(false);
  });
});

describe("resolveApplicationStatusDisplay", () => {
  it("exposes ranking only to lecturers", () => {
    expect(
      resolveApplicationStatusDisplay(
        "pending",
        { rank: 1, isShortlisted: true },
        "lecturer"
      )
    ).toMatchObject({ isRanked: true, isShortlisted: false });

    expect(
      resolveApplicationStatusDisplay(
        "pending",
        { rank: 1, comment: "Reviewed" },
        "candidate"
      )
    ).toMatchObject({ isRanked: false, isReviewed: true });
  });
});

describe("getApplicationStatusClassName", () => {
  it("returns a badge class for each status", () => {
    expect(getApplicationStatusClassName("pending", true)).toContain(
      "withdrawn"
    );
    expect(getApplicationStatusClassName("selected")).toContain("selected");
    expect(getApplicationStatusClassName("rejected")).toContain("rejected");
    expect(getApplicationStatusClassName("pending")).toContain("pending");
  });
});
