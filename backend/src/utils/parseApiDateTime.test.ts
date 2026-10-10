import { parseApiDateTime } from "./parseApiDateTime";

describe("parseApiDateTime", () => {
  it("returns Date instances unchanged", () => {
    const now = new Date("2026-01-02T03:04:05.000Z");
    expect(parseApiDateTime(now)).toBe(now);
  });

  it("parses timezone-aware strings as-is", () => {
    expect(parseApiDateTime("2026-01-02T03:04:05.000Z").toISOString()).toBe(
      "2026-01-02T03:04:05.000Z"
    );
  });

  it("treats naive MySQL datetimes as UTC", () => {
    expect(parseApiDateTime("2026-01-02 03:04:05").toISOString()).toBe(
      "2026-01-02T03:04:05.000Z"
    );
  });

  it("falls back to now for empty strings", () => {
    const before = Date.now();
    const parsed = parseApiDateTime("   ");
    expect(parsed.getTime()).toBeGreaterThanOrEqual(before - 1000);
  });
});
