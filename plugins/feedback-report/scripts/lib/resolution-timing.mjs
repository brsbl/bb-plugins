import { DAY_MS } from "./config.mjs";
import { median, roundToTenth } from "./rounding.mjs";

export function discordResolutionTiming({ resolution, community, issues, ledger, asOfMs }) {
  const firstFeedback = new Map();
  for (const record of community) {
    if (record.source !== "discord" || !record.isFeedback) continue;
    firstFeedback.set(record.topic, Math.min(firstFeedback.get(record.topic) ?? Infinity, record.timestampMs));
  }
  const issueByNumber = new Map(issues.map((issue) => [issue.number, issue]));
  const durations = [];
  for (const row of resolution) {
    if (row.source !== "discord" || !["shipped", "closed-no-pr"].includes(row.status)) continue;
    if (!row.ref) continue;
    const start = firstFeedback.get(row.topic);
    if (start === undefined) continue;
    const issueRef = row.ref.match(/^#(\d+)$/);
    let end = null;
    if (issueRef) {
      end = issueByNumber.get(Number(issueRef[1]))?.closedMs ?? null;
    } else if (/^[0-9a-f]{7,40}$/.test(row.ref)) {
      const matches = ledger.filter((commit) => commit.sha.startsWith(row.ref) || row.ref.startsWith(commit.sha));
      if (matches.length === 1) end = Date.parse(matches[0].date);
    }
    if (end === null || !Number.isFinite(end) || end < start || end >= asOfMs) continue;
    durations.push((end - start) / DAY_MS);
  }
  const days = median(durations);
  return { median_days: days === null ? null : roundToTenth(days), sample_size: durations.length };
}
