import {
  CORRESPONDENCE_INACTIVITY_MS,
  canExchangeCorrespondence,
  getLastCorrespondenceActivityAt,
  isCorrespondenceInactive,
} from "./correspondencePolicy";
import type { Application } from "../entities/Application";

describe("correspondencePolicy", () => {
  it("uses appliedAt when there are no messages", () => {
    const appliedAt = new Date("2026-01-01T00:00:00.000Z");
    expect(
      getLastCorrespondenceActivityAt({ appliedAt } as Application).toISOString()
    ).toBe(appliedAt.toISOString());
  });

  it("uses the last message timestamp", () => {
    const application = {
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
    } as unknown as Application;
    expect(getLastCorrespondenceActivityAt(application).toISOString()).toBe(
      "2026-01-03T00:00:00.000Z"
    );
  });

  it("detects inactivity and blocks withdrawn or blocked chats", () => {
    const old = {
      appliedAt: new Date(Date.now() - CORRESPONDENCE_INACTIVITY_MS - 1000),
    } as Application;
    expect(isCorrespondenceInactive(old)).toBe(true);
    expect(canExchangeCorrespondence(old)).toBe(false);
    expect(
      canExchangeCorrespondence({ isWithdrawn: true } as Application)
    ).toBe(false);
    expect(
      canExchangeCorrespondence({
        candidate: { isBlocked: true },
        appliedAt: new Date(),
      } as Application)
    ).toBe(false);
    expect(
      canExchangeCorrespondence({ appliedAt: new Date() } as Application)
    ).toBe(true);
  });
});
