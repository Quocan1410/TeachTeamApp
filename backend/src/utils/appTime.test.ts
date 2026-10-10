import { APP_TIMEZONE, getAppTimestamp, getAppTimezoneLabel } from "./appTime";

describe("appTime", () => {
  it("exposes the Vietnam timezone constants", () => {
    expect(APP_TIMEZONE).toBe("Asia/Ho_Chi_Minh");
    expect(getAppTimezoneLabel()).toContain("Asia/Ho_Chi_Minh");
  });

  it("returns an ISO timestamp", () => {
    expect(getAppTimestamp()).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
