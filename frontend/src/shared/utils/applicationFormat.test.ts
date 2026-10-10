import { formatAppliedDate, formatRoleLabel } from "./applicationFormat";

describe("formatRoleLabel", () => {
  it("maps known role names", () => {
    expect(formatRoleLabel("tutor")).toBe("Tutor");
    expect(formatRoleLabel("lab_assistant")).toBe("Lab Assistant");
  });
});

describe("formatAppliedDate", () => {
  it("formats an ISO date in Vietnam locale", () => {
    const label = formatAppliedDate("2026-03-15T10:00:00.000Z");
    expect(label).toMatch(/15/);
    expect(label).toMatch(/2026/);
  });
});
