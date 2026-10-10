import {
  canCandidateSendCorrespondence,
  canExchangeCorrespondence,
  canLecturerSendCorrespondence,
  candidateOfferPending,
  getCorrespondenceClosedNotice,
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
  it("blocks withdrawn and blocked chats, not by age", () => {
    expect(
      canExchangeCorrespondence(
        app({ appliedAt: "2020-01-01T00:00:00.000Z" })
      )
    ).toBe(true);
    expect(canExchangeCorrespondence(app({ isWithdrawn: true }))).toBe(false);
    expect(
      canExchangeCorrespondence(
        app({ candidate: { isBlocked: true } as ApplicationResponse["candidate"] })
      )
    ).toBe(false);
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

  it("never shows a 5-day inactivity closed notice", () => {
    expect(
      getCorrespondenceClosedNotice(
        app({ appliedAt: "2020-01-01T00:00:00.000Z" })
      )
    ).toBeNull();
    expect(getCorrespondenceClosedNotice(app({ isWithdrawn: true }))).toBeNull();
  });
});
