import {
  appendDecisionAutoMessage,
  buildRejectionAutoMessage,
  buildSelectionAutoMessage,
} from "./decisionCorrespondence";
import type { Application } from "../entities/Application";

describe("decisionCorrespondence", () => {
  it("builds selection and rejection copy", () => {
    const application = {
      course: { courseCode: "MARK1001" },
      role: { roleName: "tutor" },
    } as Application;
    expect(buildSelectionAutoMessage(application)).toContain("MARK1001");
    expect(buildSelectionAutoMessage(application)).toContain("Tutor");
    expect(buildRejectionAutoMessage(application)).toContain("not be moving forward");
  });

  it("appends an auto message once", () => {
    const application = {
      course: { courseCode: "MARK1001" },
      role: { roleName: "lab_assistant" },
      correspondenceMessages: [],
    } as unknown as Application;

    expect(appendDecisionAutoMessage(application, "lecturer-1", "selected")).toBe(
      true
    );
    expect(appendDecisionAutoMessage(application, "lecturer-1", "selected")).toBe(
      false
    );
    expect(application.reviewedBy).toBe("lecturer-1");
  });
});
