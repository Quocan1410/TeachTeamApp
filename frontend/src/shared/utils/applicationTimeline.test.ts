import {
  buildApplicationTimeline,
  canCandidateSendCorrespondence,
  canLecturerSendCorrespondence,
  candidateOfferPending,
  getCorrespondenceClosedNotice,
} from "./applicationTimeline";
import type { ApplicationResponse } from "@/shared/services/applicationService";

describe("buildApplicationTimeline", () => {
  it("starts with submission and includes correspondence", () => {
    const application = {
      appliedAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-04T00:00:00.000Z",
      isWithdrawn: false,
      correspondenceMessages: [
        {
          id: "m1",
          authorRole: "lecturer",
          authorId: "l1",
          body: "Hello",
          createdAt: "2026-01-02T00:00:00.000Z",
        },
        {
          id: "m2",
          authorRole: "candidate",
          authorId: "c1",
          body: "Thanks",
          createdAt: "2026-01-03T00:00:00.000Z",
        },
      ],
    } as unknown as ApplicationResponse;

    const items = buildApplicationTimeline(application);
    expect(items[0]).toMatchObject({ id: "submitted", kind: "system" });
    expect(items.map((i) => i.id)).toEqual(["submitted", "m1", "m2"]);
    expect(items[1].kind).toBe("lecturer");
    expect(items[2].kind).toBe("candidate");
  });

  it("appends withdrawn system event", () => {
    const application = {
      appliedAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-04T00:00:00.000Z",
      withdrawnAt: "2026-01-05T00:00:00.000Z",
      isWithdrawn: true,
      correspondenceMessages: [],
    } as unknown as ApplicationResponse;

    const items = buildApplicationTimeline(application);
    expect(items.at(-1)).toMatchObject({
      id: "withdrawn",
      kind: "system",
      title: "Application withdrawn",
    });
  });

  it("re-exports correspondence policy helpers", () => {
    const fresh = {
      appliedAt: new Date().toISOString(),
      status: "pending",
      isWithdrawn: false,
    } as ApplicationResponse;
    expect(canCandidateSendCorrespondence(fresh)).toBe(true);
    expect(canLecturerSendCorrespondence(fresh)).toBe(true);
    expect(candidateOfferPending(fresh)).toBe(false);
    expect(getCorrespondenceClosedNotice()).toBeNull();
  });
});
