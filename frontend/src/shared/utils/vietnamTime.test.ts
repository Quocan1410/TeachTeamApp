import {
  dateKey,
  formatAppliedDateDivider,
  formatConversationTimestamp,
  formatDateDivider,
  formatFullTimestamp,
  vietnamDateKey,
  vietnamTodayKey,
  vietnamYear,
} from "./vietnamTime";

describe("vietnamTime helpers", () => {
  it("returns calendar keys and year in Vietnam timezone", () => {
    const fixed = new Date("2026-06-01T03:00:00.000Z");
    expect(vietnamTodayKey(fixed)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(vietnamYear(fixed)).toBe(2026);
    expect(vietnamDateKey("2026-06-01T03:00:00.000Z")).toMatch(
      /^\d{4}-\d{2}-\d{2}$/
    );
    expect(dateKey("2026-06-01T03:00:00.000Z")).toBe(
      vietnamDateKey("2026-06-01T03:00:00.000Z")
    );
  });

  it("formats conversation timestamps for today and older days", () => {
    const now = new Date();
    const todayIso = now.toISOString();
    expect(formatConversationTimestamp(todayIso)).toMatch(/\d/);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatConversationTimestamp(yesterday.toISOString())).toMatch(
      /Yesterday/
    );

    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    expect(formatConversationTimestamp(threeDaysAgo.toISOString())).toMatch(
      /d ago/
    );

    const old = "2025-01-10T08:00:00.000Z";
    expect(formatConversationTimestamp(old)).toMatch(/·/);
  });

  it("formats dividers and full timestamps", () => {
    const iso = "2026-03-15T10:30:00.000Z";
    expect(formatDateDivider(iso)).toMatch(/15/);
    expect(formatAppliedDateDivider(iso)).toMatch(/·/);
    expect(formatFullTimestamp(iso)).toMatch(/2026/);
  });
});
