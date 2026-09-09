import { describe, expect, it } from "vitest";
import { discordResolutionTiming } from "./resolution-timing.mjs";

const at = (timestamp) => Date.parse(timestamp);
const feedback = (topic, timestamp, overrides = {}) => ({ topic, source: "discord", isFeedback: true, timestampMs: at(timestamp), ...overrides });
const resolved = (topic, ref, overrides = {}) => ({ topic, ref, source: "discord", status: "shipped", ...overrides });
const asOfMs = at("2026-09-09T18:00:00Z");

describe("Discord resolution timing", () => {
  it("uses the first feedback timestamp once per topic and actual issue or commit timestamps", () => {
    const result = discordResolutionTiming({
      asOfMs,
      community: [
        feedback("issue", "2026-08-13T12:00:00Z"),
        feedback("issue", "2026-08-12T12:00:00Z"),
        feedback("issue", "2026-08-11T00:00:00Z", { isFeedback: false }),
        feedback("issue", "2026-08-10T00:00:00Z", { source: "github" }),
        feedback("commit", "2026-08-12T12:00:00Z"),
      ],
      resolution: [resolved("issue", "#12", { status: "closed-no-pr", ref_date: "2026-08-30" }), resolved("commit", "abcdef1")],
      issues: [{ number: 12, closedMs: at("2026-08-13T18:00:00Z") }],
      ledger: [{ sha: "abcdef1234", date: "2026-08-14T17:00:00-07:00" }],
    });
    expect(result).toEqual({ median_days: 1.9, sample_size: 2 });
  });

  it("excludes predating, out-of-window, missing, and ambiguous matches from the median", () => {
    const topics = ["valid", "predating", "cutoff", "open", "missing", "ambiguous", "invalid", "undated", "unmatched"];
    const result = discordResolutionTiming({
      asOfMs,
      community: topics.map((topic) => feedback(topic, "2026-09-01T00:00:00Z")),
      resolution: [
        resolved("valid", "#1"), resolved("predating", "#2"), resolved("cutoff", "#3"),
        resolved("open", "#1", { status: "tracked-open" }), resolved("missing", "#99"),
        resolved("ambiguous", "abcdef0"), resolved("invalid", "not-a-ref"),
        resolved("undated", "1234567"), resolved("unmatched", ""),
        resolved("no-feedback", "#1"), resolved("valid", "#1", { source: "github" }),
      ],
      issues: [
        { number: 1, closedMs: at("2026-09-03T00:00:00Z") },
        { number: 2, closedMs: at("2026-08-31T23:59:59Z") },
        { number: 3, closedMs: asOfMs },
      ],
      ledger: [
        { sha: "abcdef0111", date: "2026-09-02T00:00:00Z" },
        { sha: "abcdef0222", date: "2026-09-02T00:00:00Z" },
        { sha: "1234567890", date: "invalid" },
      ],
    });
    expect(result).toEqual({ median_days: 2, sample_size: 1 });
  });

  it("distinguishes a zero duration from an unavailable median and accepts full commit references", () => {
    const input = {
      asOfMs,
      community: [feedback("same-time", "2026-09-01T00:00:00Z")],
      resolution: [resolved("same-time", "abcdef1234567890abcdef1234567890abcdef12")],
      issues: [],
      ledger: [{ sha: "abcdef1234", date: "2026-09-01T00:00:00Z" }],
    };
    expect(discordResolutionTiming(input)).toEqual({ median_days: 0, sample_size: 1 });
    expect(discordResolutionTiming({ ...input, ledger: [] })).toEqual({ median_days: null, sample_size: 0 });
  });
});
