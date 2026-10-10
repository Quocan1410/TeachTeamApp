import { canExchangeCorrespondence } from "./correspondencePolicy";
import type { Application } from "../entities/Application";

describe("correspondencePolicy", () => {
  it("blocks withdrawn or blocked chats and allows open ones", () => {
    expect(
      canExchangeCorrespondence({ isWithdrawn: true } as Application)
    ).toBe(false);
    expect(
      canExchangeCorrespondence({
        candidate: { isBlocked: true },
        appliedAt: new Date("2020-01-01T00:00:00.000Z"),
      } as Application)
    ).toBe(false);
    expect(
      canExchangeCorrespondence({
        appliedAt: new Date("2020-01-01T00:00:00.000Z"),
      } as Application)
    ).toBe(true);
  });
});
