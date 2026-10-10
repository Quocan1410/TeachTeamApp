import { buildLecturerApplicationProcessFlow } from "./lecturerProcessFlow";
import type { ApplicationResponse } from "@/shared/services/applicationService";

function app(
  overrides: Partial<ApplicationResponse> = {}
): ApplicationResponse {
  return {
    id: "a1",
    appliedAt: "2026-01-01T00:00:00.000Z",
    status: "pending",
    isWithdrawn: false,
    isShortlisted: false,
    rank: null,
    ...overrides,
  } as ApplicationResponse;
}

describe("buildLecturerApplicationProcessFlow", () => {
  it("starts at screening for pending applications", () => {
    const flow = buildLecturerApplicationProcessFlow(app());
    expect(flow.steps.find((s) => s.id === "pending")?.state).toBe("current");
    expect(flow.progressCaption).toMatch(/Shortlist or decline/);
  });

  it("moves to ranking when shortlisted", () => {
    const flow = buildLecturerApplicationProcessFlow(
      app({ isShortlisted: true })
    );
    expect(flow.steps.find((s) => s.id === "ranking")?.state).toBe("current");
  });

  it("handles ranked, selected, rejected, withdrawn, and blocked", () => {
    expect(
      buildLecturerApplicationProcessFlow(app({ rank: 1 })).progressCaption
    ).toMatch(/Ready for final decision/);

    expect(
      buildLecturerApplicationProcessFlow(app({ status: "selected", rank: 1 }))
        .steps.find((s) => s.id === "decision")?.label
    ).toBe("Selected");

    expect(
      buildLecturerApplicationProcessFlow(app({ status: "rejected" }))
        .progressCaption
    ).toMatch(/Declined/);

    expect(
      buildLecturerApplicationProcessFlow(app({ isWithdrawn: true }))
        .steps.find((s) => s.id === "decision")?.label
    ).toBe("Withdrawn");

    expect(
      buildLecturerApplicationProcessFlow(
        app({ candidate: { isBlocked: true } as ApplicationResponse["candidate"] })
      ).steps.find((s) => s.id === "decision")?.label
    ).toBe("Blocked");
  });
});
