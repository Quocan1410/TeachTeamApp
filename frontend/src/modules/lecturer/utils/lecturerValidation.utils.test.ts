import {
  formatValidationErrors,
  handleValidationNetworkError,
  retryValidation,
  sanitizeComment,
  validateCourseSelection,
  validateLecturerComment,
  validateLecturerFilters,
  validateLecturerFormSubmission,
  validateRankingOperation,
  validateStatusUpdate,
} from "./lecturerValidation.utils";

describe("validateLecturerComment", () => {
  it("requires a non-empty comment by default", () => {
    expect(validateLecturerComment("").isValid).toBe(false);
    expect(validateLecturerComment("Great applicant overall").isValid).toBe(true);
  });
});

describe("validateStatusUpdate", () => {
  it("requires an application id and valid status", () => {
    const result = validateStatusUpdate("", "selected", []);
    expect(result.isValid).toBe(false);
    expect(result.errors.applicationId).toBeTruthy();
    expect(result.errors.courses).toBeTruthy();
  });
});

describe("validateRankingOperation", () => {
  it("checks rank and course code format", () => {
    expect(validateRankingOperation("1", 1, "MARK1001").isValid).toBe(true);
    expect(validateRankingOperation("1", 0, "bad").isValid).toBe(false);
  });
});

describe("validateCourseSelection", () => {
  it("enforces min and available courses", () => {
    expect(validateCourseSelection([], ["A"]).isValid).toBe(false);
    expect(validateCourseSelection(["A"], ["A"]).isValid).toBe(true);
  });
});

describe("validateLecturerFilters", () => {
  it("rejects invalid status filters", () => {
    expect(validateLecturerFilters({ status: "nope" }).isValid).toBe(false);
    expect(validateLecturerFilters({ status: "pending" }).isValid).toBe(true);
  });
});

describe("helpers", () => {
  it("sanitizes comments and formats errors", () => {
    expect(sanitizeComment("  hello   world  ")).toBe("hello world");
    expect(sanitizeComment(null as unknown as string)).toBe("");
    expect(formatValidationErrors({ a: "One", b: "" })).toEqual(["One"]);
    expect(handleValidationNetworkError().hasNetworkError).toBe(true);
  });
});

describe("validateLecturerFormSubmission", () => {
  it("validates comment, status, and ranking actions", () => {
    expect(
      validateLecturerFormSubmission({
        applicationId: "1",
        action: "comment",
        comment: "Nice work overall",
      }).isValid
    ).toBe(true);

    expect(
      validateLecturerFormSubmission({
        applicationId: "1",
        action: "status",
        status: "selected",
        selectedCourses: ["MARK1001"],
      }).isValid
    ).toBe(true);

    expect(
      validateLecturerFormSubmission({
        applicationId: "1",
        action: "ranking",
        rank: 1,
        courseCode: "MARK1001",
      }).isValid
    ).toBe(true);

    expect(
      validateLecturerFormSubmission({
        applicationId: "",
        action: "comment",
      }).isValid
    ).toBe(false);
  });
});

describe("retryValidation", () => {
  it("retries network failures then succeeds", async () => {
    let attempts = 0;
    await expect(
      retryValidation(async () => {
        attempts += 1;
        if (attempts < 2) {
          const error = new Error("offline") as Error & { code: string };
          error.code = "NETWORK_ERROR";
          throw error;
        }
        return "ok";
      }, 3, 1)
    ).resolves.toBe("ok");
    expect(attempts).toBe(2);
  });
});
