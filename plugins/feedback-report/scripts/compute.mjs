import path from "node:path";
import { fail, log, parseArgs, requireArg } from "./lib/cli.mjs";
import { DAY_MS, readConfig, weekIndexOf, weekLabels } from "./lib/config.mjs";
import { parseCsvRecords } from "./lib/csv.mjs";
import { readText, writeJson } from "./lib/io.mjs";
import { readIssues } from "./lib/issues.mjs";
import { readLedger } from "./lib/ledger.mjs";
import { communityRecordsInWindow, readClassifiedRecords } from "./lib/records.mjs";
import { median, percent, roundHalfEven, roundToTenth } from "./lib/rounding.mjs";
import { loadTaxonomy } from "./lib/taxonomy.mjs";

const USAGE = "node compute.mjs --run <dir>";
const AGING_DAYS = 14;
const P1_PEOPLE_PCT = 14;
const P2_PEOPLE_PCT = 9;
const CLOSE_RATE_FLOOR = 60;
const AGING_SHARE_FLOOR = 40;
const STATUS_BUCKET = {
  shipped: "resolved",
  "closed-no-pr": "resolved",
  "tracked-open": "open",
  untracked: "untracked",
  unclear: "unclear",
  pending: "pending",
};

function uniqueCount(items, keyOf) {
  return new Set(items.map(keyOf)).size;
}

function topicCount(records) {
  return uniqueCount(records, (record) => record.topic);
}

function reporterCount(records) {
  return uniqueCount(records, (record) => record.reporterId);
}

function feedbackStats(records, weeks) {
  const feedback = records.filter((record) => record.isFeedback);
  const half = Math.floor(weeks / 2);
  const prior = topicCount(feedback.filter((record) => record.week < half));
  const latest = topicCount(feedback.filter((record) => record.week >= half));
  const band = 2 * Math.sqrt(prior + latest);
  return {
    topics: topicCount(feedback),
    people: reporterCount(feedback),
    bugs: topicCount(feedback.filter((record) => record.kind === "bug")),
    requests: topicCount(feedback.filter((record) => record.kind === "request")),
    positive: records.filter((record) => record.sentiment === "positive").length,
    negative: records.filter((record) => record.sentiment === "negative").length,
    weeklyTopics: Array.from({ length: weeks }, (_, week) => topicCount(feedback.filter((record) => record.week === week))),
    delta: latest - prior,
    band: roundHalfEven(band),
    signal: Math.abs(latest - prior) > band,
  };
}

function weekStats(records, week) {
  const inWeek = records.filter((record) => record.week === week);
  const feedback = inWeek.filter((record) => record.isFeedback);
  const bugs = topicCount(feedback.filter((record) => record.kind === "bug"));
  const requests = topicCount(feedback.filter((record) => record.kind === "request"));
  return {
    topics: topicCount(feedback),
    people: reporterCount(feedback),
    bugs,
    requests,
    agent: topicCount(feedback.filter((record) => record.agentFiled)),
    req_pct: percent(requests, Math.max(1, bugs + requests)),
    pos: reporterCount(inWeek.filter((record) => record.sentiment === "positive")),
    neg: reporterCount(inWeek.filter((record) => record.sentiment === "negative")),
  };
}

function communityIssuesInWindow(issues, config, areaByIssue) {
  return issues
    .filter((issue) => !config.collaborators.has(issue.author) && weekIndexOf(issue.createdMs, config) !== null)
    .map((issue) => ({
      ...issue,
      areaV2: areaByIssue.get(issue.number) ?? null,
      openedWeek: weekIndexOf(issue.createdMs, config),
      closedBeforeAsOf: issue.closedMs !== null && issue.closedMs < config.asOfMs,
      daysOpen: Math.floor((config.asOfMs - issue.createdMs) / DAY_MS),
      daysToClose: issue.closedMs === null ? null : (issue.closedMs - issue.createdMs) / DAY_MS,
    }));
}

function closureStats(issues) {
  const closed = issues.filter((issue) => issue.closedBeforeAsOf);
  const open = issues.filter((issue) => !issue.closedBeforeAsOf);
  const closeDays = median(closed.map((issue) => issue.daysToClose));
  return {
    opened: issues.length,
    close_pct: percent(closed.length, issues.length),
    closed_by_pr_pct: percent(closed.filter((issue) => issue.closedByPrCount > 0).length, closed.length),
    median_days: closeDays === null ? null : roundToTenth(closeDays),
    open: open.length,
    aging: open.filter((issue) => issue.daysOpen >= AGING_DAYS).length,
    openHuman: open.filter((issue) => !issue.agentFiled).length,
  };
}

function closedInWeek(issues, config, week) {
  return issues.filter((issue) => issue.closedBeforeAsOf && weekIndexOf(issue.closedMs, config) === week).length;
}

function resolutionStats(rows) {
  const counts = { resolved: 0, open: 0, untracked: 0, unclear: 0, pending: 0 };
  for (const row of rows) counts[STATUS_BUCKET[row.status]] += 1;
  return {
    n: rows.length,
    resolved: counts.resolved,
    resolved_pr: rows.filter((row) => row.status === "shipped").length,
    open: counts.open,
    untracked: counts.untracked,
    unclear: counts.unclear,
    pending: counts.pending,
    resolved_pct: percent(counts.resolved, rows.length),
  };
}

function readResolution(runDir) {
  const rows = parseCsvRecords(readText(path.join(runDir, "resolution.csv")));
  rows.forEach((row, index) => {
    if (!STATUS_BUCKET[row.status]) fail(`resolution.csv row ${index + 2} has an unknown status ${JSON.stringify(row.status)}`);
    if (!row.area) fail(`resolution.csv row ${index + 2} has no area`);
  });
  return rows;
}

function priorityOf(area) {
  const lowCloseRate = area.close_pct !== null && area.close_pct < CLOSE_RATE_FLOOR;
  if (area.people_pct >= P1_PEOPLE_PCT && lowCloseRate) return "P1";
  if (area.people_pct >= P2_PEOPLE_PCT && (area.signal || (area.aging_pct ?? 0) >= AGING_SHARE_FLOOR)) return "P2";
  return "P3";
}

function readOf(area) {
  const priority = priorityOf(area);
  const lowCloseRate = area.close_pct !== null && area.close_pct < CLOSE_RATE_FLOOR;
  if (lowCloseRate && area.bugs > area.requests) {
    return { read_kind: "fix", read: `Fix: ${area.close_pct}% close rate and bugs outnumber requests` };
  }
  if (priority === "P1") {
    return { read_kind: "decide", read: `Recommend: P1, ${area.people_pct}% of people and ${area.close_pct}% close rate` };
  }
  if (priority === "P2") {
    const reason = area.signal ? "demand moved outside noise" : `${area.aging_pct}% of open issues aging`;
    return { read_kind: "decide", read: `Recommend: P2, ${reason}` };
  }
  if (area.signal) {
    const direction = area.delta > 0 ? "rising" : "falling";
    return { read_kind: "watch", read: `Watch: ${direction} outside noise (${area.delta} vs band ${area.band})` };
  }
  return { read_kind: "ok", read: "OK" };
}

function buildArea(areaName, theme, taxonomy, config, community, issues, resolution, totals) {
  const records = community.filter((record) => record.areaV2 === areaName);
  const areaIssues = issues.filter((issue) => issue.areaV2 === areaName);
  const stats = feedbackStats(records, config.weeks);
  const closure = closureStats(areaIssues);
  const area = {
    area: areaName,
    theme,
    short: taxonomy.short[areaName],
    topics: stats.topics,
    people: stats.people,
    people_pct: percent(stats.people, totals.people),
    bugs: stats.bugs,
    requests: stats.requests,
    req_pct: percent(stats.requests, Math.max(1, stats.topics)),
    positive: stats.positive,
    negative: stats.negative,
    opened: closure.opened,
    close_pct: closure.close_pct,
    median_days: closure.median_days,
    open: closure.open,
    open_pct: percent(closure.open, totals.open),
    aging: closure.aging,
    aging_pct: percent(closure.aging, closure.open),
    delta: stats.delta,
    band: stats.band,
    signal: stats.signal,
    weekly: stats.weeklyTopics,
    weeks: Array.from({ length: config.weeks }, (_, week) => {
      const stat = weekStats(records, week);
      return {
        topics: stat.topics,
        req_pct: stat.req_pct,
        pos: stat.pos,
        neg: stat.neg,
        opened: areaIssues.filter((issue) => issue.openedWeek === week).length,
        closed: areaIssues.filter((issue) => issue.openedWeek === week && issue.closedBeforeAsOf).length,
      };
    }),
    res: resolutionStats(resolution.filter((row) => row.area === areaName)),
  };
  return { ...area, ...readOf(area) };
}

function buildAreas(taxonomy, config, community, issues, resolution, totals) {
  return taxonomy.themes.flatMap((theme) =>
    taxonomy.areasByTheme[theme].map((areaName) =>
      buildArea(areaName, theme, taxonomy, config, community, issues, resolution, totals),
    ),
  );
}

function buildThemes(taxonomy, config, community, issues, ledger, totals) {
  const themed = community.filter((record) => taxonomy.themeOfV2Area.has(record.areaV2) || taxonomy.themeOfV1Area.has(record.area));
  const positiveTotal = themed.filter((record) => record.sentiment === "positive").length;
  const negativeTotal = themed.filter((record) => record.sentiment === "negative").length;
  return taxonomy.themes.map((theme) => {
    const records = community.filter((record) => record.theme === theme);
    const stats = feedbackStats(records, config.weeks);
    const commits = ledger.filter((commit) => taxonomy.themeOfV1Area.get(commit.area) === theme);
    const themeIssues = issues.filter((issue) => taxonomy.themeOfV2Area.get(issue.areaV2) === theme);
    return {
      theme,
      people: stats.people,
      people_pct: percent(stats.people, totals.people),
      commits: commits.length,
      commits_pct: percent(commits.length, ledger.length),
      open: closureStats(themeIssues).openHuman,
      topics: stats.topics,
      weekly_commits: Array.from({ length: config.weeks }, (_, week) => commits.filter((commit) => commit.week === week).length),
      positive: stats.positive,
      negative: stats.negative,
      praise_share: percent(stats.positive, positiveTotal),
      complaint_share: percent(stats.negative, negativeTotal),
    };
  });
}

function buildWeekly(config, labels, community, issues, ledger) {
  return labels.map((label, week) => {
    const stat = weekStats(community, week);
    const commits = ledger.filter((commit) => commit.week === week);
    return {
      week: label,
      topics: stat.topics,
      people: stat.people,
      bugs: stat.bugs,
      requests: stat.requests,
      agent: stat.agent,
      pos: stat.pos,
      neg: stat.neg,
      commits: commits.length,
      closing: commits.filter((commit) => commit.closesIssues !== "").length,
      opened: issues.filter((issue) => issue.openedWeek === week).length,
      closed: closedInWeek(issues, config, week),
    };
  });
}

function buildTotals(config, community, issues, ledger, resolution) {
  const stats = feedbackStats(community, config.weeks);
  const closure = closureStats(issues);
  const feedback = community.filter((record) => record.isFeedback);
  const openTopics = new Set(issues.filter((issue) => !issue.closedBeforeAsOf).map((issue) => `gh#${issue.number}`));
  const reporterTopicPairs = uniqueCount(feedback, (record) => `${record.reporterId} ${record.topic}`);
  const peopleWithOpen = reporterCount(feedback.filter((record) => openTopics.has(record.topic)));
  const res = resolutionStats(resolution);
  const discordRows = resolution.filter((row) => row.source === "discord");
  const discordResolved = discordRows.filter((row) => STATUS_BUCKET[row.status] === "resolved").length;
  return {
    topics: stats.topics,
    people: stats.people,
    open: closure.open,
    aging: closure.aging,
    close_pct: closure.close_pct,
    closed_by_pr_pct: closure.closed_by_pr_pct,
    median_days: closure.median_days,
    commits: ledger.length,
    reporters_per_open: stats.topics ? roundHalfEven((100 * reporterTopicPairs) / stats.topics) / 100 : null,
    people_with_open_pct: percent(peopleWithOpen, stats.people),
    res: {
      ...res,
      open_pct: percent(res.open, res.n),
      untracked_pct: percent(res.untracked, res.n),
      discord_resolved_pct: percent(discordResolved, discordRows.length),
    },
  };
}

function describeSources(records) {
  const discord = records.filter((record) => record.source === "discord");
  const channels = uniqueCount(discord, (record) => record.channel);
  const threads = uniqueCount(discord.filter((record) => record.sourceType === "thread-message"), (record) => record.parentSourceId);
  const issues = records.filter((record) => record.sourceType === "issue").length;
  const comments = records.filter((record) => record.sourceType === "issue-comment").length;
  return `${channels} Discord channels (${threads} threads, ${discord.length} messages) and ${issues} GitHub issues with ${comments} comments: ${records.length} records in total.`;
}

function describeDevelopment(ledger, config) {
  const pullRequests = uniqueCount(ledger.filter((commit) => commit.pr !== ""), (commit) => commit.pr);
  const closing = ledger.filter((commit) => commit.closesIssues !== "").length;
  return `${ledger.length} first-parent commits on origin/main from ${config.periodStart.slice(0, 10)} to ${config.asOf.slice(0, 10)}, ${pullRequests} merged pull requests, ${closing} commits closing an issue.`;
}

const args = parseArgs(process.argv.slice(2));
const runDir = requireArg(args, "run", USAGE);
const config = readConfig(runDir);
const taxonomy = loadTaxonomy();
const records = readClassifiedRecords(runDir, config, taxonomy);
const community = communityRecordsInWindow(records);
const areaByIssue = new Map(
  records.filter((record) => record.sourceType === "issue").map((record) => [record.issueNumber, record.areaV2]),
);
const issues = communityIssuesInWindow(readIssues(runDir), config, areaByIssue);
const ledger = readLedger(runDir);
const resolution = readResolution(runDir);
const labels = weekLabels(config);
const totals = buildTotals(config, community, issues, ledger, resolution);
const report = {
  meta: {
    runId: config.runId,
    asOf: config.asOf,
    weeks: config.weeks,
    periodStart: config.periodStart,
    repository: config.repository,
    generatedAt: new Date().toISOString(),
    definitionsVersion: "v2",
    method: {
      sources: describeSources(records),
      development: describeDevelopment(ledger, config),
      instrumentation: "",
      qc: "",
      source: "",
      moved_note: "",
    },
  },
  weeks: labels,
  weekly: buildWeekly(config, labels, community, issues, ledger),
  areas: buildAreas(taxonomy, config, community, issues, resolution, totals),
  themes: buildThemes(taxonomy, config, community, issues, ledger, totals),
  totals,
};
writeJson(path.join(runDir, "report.json"), report);
log(`wrote report.json: ${totals.topics} topics, ${totals.people} people, ${totals.open} open issues, ${totals.commits} commits`);
