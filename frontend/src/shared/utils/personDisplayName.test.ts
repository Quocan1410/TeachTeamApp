import {
  formatCandidateDisplayName,
  formatLecturerDisplayName,
  formatPersonDisplayName,
  getUserDisplayName,
  joinPersonName,
  splitDisplayName,
  stripHonorificFromDisplayName,
  formatApplicationApplicantDisplayName,
} from "./personDisplayName";

describe("personDisplayName", () => {
  it("joins first and last name, then falls back to email", () => {
    expect(joinPersonName({ firstName: "Eden", lastName: "Coverage" })).toBe(
      "Eden Coverage"
    );
    expect(joinPersonName({ email: "eden@candidate.edu.au" })).toBe(
      "eden@candidate.edu.au"
    );
  });

  it("strips and formats honorifics", () => {
    expect(stripHonorificFromDisplayName("Dr. Jane Morrison")).toBe(
      "Jane Morrison"
    );
    expect(
      formatPersonDisplayName({
        firstName: "Jane",
        lastName: "Morrison",
        honorific: "Dr.",
      })
    ).toBe("Dr. Jane Morrison");
    expect(
      formatLecturerDisplayName({ firstName: "Jane", lastName: "Morrison" })
    ).toBe("Dr. Jane Morrison");
    expect(
      formatCandidateDisplayName({ firstName: "Eden", lastName: "Coverage" })
    ).toBe("Mr. Eden Coverage");
    expect(getUserDisplayName({ firstName: "Alex", lastName: "Nguyen" })).toBe(
      "Mr. Alex Nguyen"
    );
  });

  it("splits a display name into leading and rest", () => {
    expect(splitDisplayName("Dr. Jane Morrison")).toEqual({
      leading: "Dr.",
      rest: "Jane Morrison",
    });
    expect(splitDisplayName("Eden Coverage")).toEqual({
      leading: "Eden",
      rest: "Coverage",
    });
  });

  it("prefers the candidate on an application", () => {
    expect(
      formatApplicationApplicantDisplayName({
        candidate: { firstName: "Eden", lastName: "Coverage" },
      })
    ).toBe("Mr. Eden Coverage");
    expect(formatApplicationApplicantDisplayName({})).toBeNull();
  });
});
