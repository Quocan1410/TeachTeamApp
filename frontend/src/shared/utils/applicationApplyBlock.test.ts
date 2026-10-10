import { getApplicationApplyBlockMessage } from "./applicationApplyBlock";

describe("getApplicationApplyBlockMessage", () => {
  it("explains a withdrawn application", () => {
    expect(
      getApplicationApplyBlockMessage({ isWithdrawn: true } as never)
    ).toMatch(/withdrew/i);
  });

  it("explains an existing application", () => {
    expect(
      getApplicationApplyBlockMessage({
        role: { roleName: "tutor" },
        course: { courseCode: "MARK1001" },
      } as never)
    ).toContain("MARK1001");
  });
});
