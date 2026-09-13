import { describe, expect, it } from "vitest";
import { formatRelativeTime, getRelativeTimeRefreshDelay } from "@/lib/relativeTime";

const NOW = Date.parse("2026-09-13T12:00:00.000Z");

describe("formatRelativeTime", () => {
  it("uses concise relative labels across time units", () => {
    expect(formatRelativeTime(new Date(NOW - 10_000), NOW)).toBe("Now");
    expect(formatRelativeTime(new Date(NOW - 60_000), NOW)).toBe("1 min ago");
    expect(formatRelativeTime(new Date(NOW - 15 * 60_000), NOW)).toBe("15 mins ago");
    expect(formatRelativeTime(new Date(NOW - 3 * 3_600_000), NOW)).toBe("3 hours ago");
    expect(formatRelativeTime(new Date(NOW - 24 * 3_600_000), NOW)).toBe("Yesterday");
    expect(formatRelativeTime(new Date(NOW - 3 * 86_400_000), NOW)).toBe("3 days ago");
    expect(formatRelativeTime(new Date(NOW - 2 * 7 * 86_400_000), NOW)).toBe("2 weeks ago");
    expect(formatRelativeTime(new Date(NOW - 3 * 30 * 86_400_000), NOW)).toBe("3 months ago");
    expect(formatRelativeTime(new Date(NOW - 2 * 365 * 86_400_000), NOW)).toBe("2 years ago");
  });

  it("clamps future and invalid timestamps to Now", () => {
    expect(formatRelativeTime(new Date(NOW + 4 * 60_000), NOW)).toBe("Now");
    expect(formatRelativeTime("not-a-timestamp", NOW)).toBe("Now");
  });
});

describe("getRelativeTimeRefreshDelay", () => {
  it("schedules the next meaningful minute boundary", () => {
    expect(getRelativeTimeRefreshDelay(new Date(NOW - 15_000), NOW)).toBe(45_000);
  });
});