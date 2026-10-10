import {
  CORRESPONDENCE_INACTIVITY_MS,
  canCandidateSendCorrespondence,
  canExchangeCorrespondence,
  canLecturerSendCorrespondence,
  candidateOfferPending,
  getCorrespondenceClosedNotice,
  getLastCorrespondenceActivityAt,
  isCorrespondenceInactive,
} from "./correspondencePolicy";
import type { ApplicationResponse } from "@/shared/services/applicationService";

function app(
  overrides: Partial<ApplicationResponse> = {}
): ApplicationResponse {
  return {
    id: "a1",
    appliedAt: new Date().toISOString(),
    status: "pending",
    isWithdrawn: false,
    ...overrides,
  } as ApplicationResponse;
}

describe("correspondencePolicy", () => {
  it("uses appliedAt when there are no messages", () => {
    const appliedAt = "2026-01-01T00:00:00.000Z";
    expect(getLastCorrespondenceActivityAt(app({ appliedAt })).toISOString()).toBe(
      appliedAt
    );
  });

  it("uses the last message timestamp", () => {
    const application = app({
      appliedAt: "2026-01-01T00:00:00.000Z",
      correspondenceMessages: [
        {
          id: "1",
          authorRole: "candidate",
          authorId: "c1",
          body: "Hi",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "2",
          authorRole: "lecturer",
          authorId: "l1",
          body: "Hello",
          createdAt: "2026-01-03T00:00:00.000Z",
        },
      ],
    });
    expect(getLastCorrespondenceActivityAt(application).toISOString()).toBe(
      "2026-01-03T00:00:00.000Z"
    );
  });

  it("blocks inactive, withdrawn, and blocked chats", () => {
    const old = app({
      appliedAt: new Date(
        Date.now() - CORRESPONDENCE_INACTIVITY_MS - 1000
      ).toISOString(),
    });
    expect(isCorrespondenceInactive(old)).toBe(true);
    expect(canExchangeCorrespondence(old)).toBe(false);
    expect(canExchangeCorrespondence(app({ isWithdrawn: true }))).toBe(false);
    expect(
      canExchangeCorrespondence(
        app({ candidate: { isBlocked: true } as ApplicationResponse["candidate"] })
      )
    ).toBe(false);
    expect(canExchangeCorrespondence(app())).toBe(true);
  });

  it("handles offer pending and send permissions", () => {
    const pendingOffer = app({
      status: "selected",
      offerResponse: "pending",
    });
    expect(candidateOfferPending(pendingOffer)).toBe(true);
    expect(canCandidateSendCorrespondence(pendingOffer)).toBe(false);
    expect(canCandidateSendCorrespondence(app())).toBe(true);
    expect(canLecturerSendCorrespondence(app())).toBe(true);
    expect(
      canLecturerSendCorrespondence(app({ isWithdrawn: true }))
    ).toBe(false);
  });

  it("returns closed notice only for inactive open chats", () => {
    const inactive = app({
      appliedAt: new Date(
        Date.now() - CORRESPONDENCE_INACTIVITY_MS - 1000
      ).toISOString(),
    });
    expect(getCorrespondenceClosedNotice(inactive)).toMatch(/5 days/);
    expect(getCorrespondenceClosedNotice(app({ isWithdrawn: true }))).toBeNull();
    expect(getCorrespondenceClosedNotice(app())).toBeNull();
  });
});
