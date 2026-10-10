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
  buildApplicationProcessFlow,
  isConnectorAfterActive,
} from "./applicationProcessFlow";
import type { ApplicationResponse } from "@/shared/services/applicationService";

function app(
  overrides: Partial<ApplicationResponse> = {}
): ApplicationResponse {
  return {
    id: "a1",
    appliedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    status: "pending",
    isWithdrawn: false,
    ...overrides,
  } as ApplicationResponse;
}

describe("buildApplicationProcessFlow", () => {
  it("marks pending as current for fresh applications", () => {
    const flow = buildApplicationProcessFlow(app());
    expect(flow.steps.find((s) => s.id === "pending")?.state).toBe("current");
    expect(flow.progressCaption).toMatch(/review queue/);
    expect(flow.stepCount).toBe(4);
  });

  it("advances after lecturer review and chat", () => {
    const reviewed = buildApplicationProcessFlow(
      app({
        comment: "Looks good",
        commentedAt: "2026-01-02T00:00:00.000Z",
      })
    );
    expect(reviewed.steps.find((s) => s.id === "pending")?.state).toBe("done");
    expect(reviewed.steps.find((s) => s.id === "reviewed")?.state).toBe(
      "current"
    );
    expect(reviewed.progressCaption).toMatch(/reply in chat/);

    const replied = buildApplicationProcessFlow(
      app({
        comment: "Looks good",
        commentedAt: "2026-01-02T00:00:00.000Z",
        candidateResponse: "Thanks",
      })
    );
    expect(replied.progressCaption).toMatch(/you have replied/);
  });

  it("handles selected and withdrawn terminals", () => {
    const selected = buildApplicationProcessFlow(app({ status: "selected" }));
    expect(selected.steps.find((s) => s.id === "decision")?.label).toBe(
      "Selected"
    );
    expect(selected.steps.find((s) => s.id === "decision")?.state).toBe(
      "current"
    );
    expect(selected.progressCaption).toMatch(/selected/);

    const withdrawn = buildApplicationProcessFlow(app({ isWithdrawn: true }));
    expect(withdrawn.steps.find((s) => s.id === "decision")?.label).toBe(
      "Withdrawn"
    );
    expect(withdrawn.progressCaption).toMatch(/withdrew/);
  });

  it("labels rejected decisions", () => {
    const flow = buildApplicationProcessFlow(app({ status: "rejected" }));
    expect(flow.steps.find((s) => s.id === "decision")?.label).toBe(
      "Not selected"
    );
    expect(flow.progressCaption).toMatch(/Final outcome/);
  });

  it("exposes connector helper", () => {
    expect(isConnectorAfterActive("done")).toBe(true);
    expect(isConnectorAfterActive("bypassed")).toBe(true);
    expect(isConnectorAfterActive("current")).toBe(false);
  });
});
