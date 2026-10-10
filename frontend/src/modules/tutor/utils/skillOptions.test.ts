import { availableSkills } from "./skillOptions";

describe("availableSkills", () => {
  it("lists common teaching skills", () => {
    expect(availableSkills).toContain("Java");
    expect(availableSkills).toContain("React");
    expect(availableSkills.length).toBeGreaterThan(5);
  });
});
