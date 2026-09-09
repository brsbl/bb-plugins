import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`);
    values[key] = value;
    index += 1;
  }
  return values;
}

const args = parseArgs(process.argv.slice(2));
const runDir = args.run;
if (!runDir) throw new Error("Usage: node prepare.mjs --run <run-directory>");

const discord = JSON.parse(await readFile(path.join(runDir, "raw", "discord.json"), "utf8"));
const github = JSON.parse(await readFile(path.join(runDir, "raw", "github.json"), "utf8"));
const asOf = discord.asOf;
if (!asOf || asOf !== github.asOf) throw new Error("Raw source asOf values do not match");

const subtractDays = (iso, days) => new Date(Date.parse(iso) - days * 86400000).toISOString();
const twoWeekStart = subtractDays(asOf, 14);
const fourWeekStart = subtractDays(asOf, 28);
const previousTwoWeekStart = subtractDays(asOf, 28);
const previousFourWeekStart = subtractDays(asOf, 56);
const inWindow = (timestamp, start, end = asOf) => timestamp && timestamp >= start && timestamp < end;
const reporterKey = (source, id) => `${source}:${id ?? "unknown"}`;
const fingerprint = (text) =>
  createHash("sha256")
    .update(
      text
        .toLowerCase()
        .replace(/https?:\/\/\S+/g, "<url>")
        .replace(/<@!?\d+>/g, "<user>")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .digest("hex")
    .slice(0, 20);

await mkdir(path.join(runDir, "working"), { recursive: true });

const channelById = new Map(discord.manifest.map((item) => [item.id, item]));
const threadById = new Map(discord.threads.map((item) => [item.id, item]));
const issueByNumber = new Map(github.issues.map((item) => [item.number, item]));
const observations = [];
const statusEvents = [];

function discordChannelName(message) {
  const direct = channelById.get(message.channelId);
  if (direct) return direct.name;
  const thread = threadById.get(message.channelId);
  return channelById.get(thread?.parentId)?.name ?? "unknown";
}

function hintForText(text, labels = [], channel = "") {
  if (/\b(crash|broken|bug|fails?|failure|error|regression|doesn['’]t work|not working)\b/i.test(text)) {
    return "bug-candidate";
  }
  if (/\b(workaround|hack|scripted|plugin|manually|manual step)\b/i.test(text)) {
    return "workaround-candidate";
  }
  if (/\b(please add|feature request|would love|wish|need|missing|support for|can we|could we|should have)\b/i.test(text)) {
    return "request-candidate";
  }
  if (labels.some((label) => /bug/i.test(label)) || /bug/i.test(channel)) return "bug-candidate";
  if (labels.some((label) => /feature|enhancement|request/i.test(label))) return "request-candidate";
  return "general-feedback-candidate";
}

for (const message of discord.messages) {
  const text = [
    message.content,
    ...(message.embeds ?? []).flatMap((embed) => [embed.title, embed.description]),
  ]
    .filter(Boolean)
    .join("\n\n")
    .trim();
  if (message.authorBot || !text) continue;
  const thread = threadById.get(message.channelId);
  const channel = discordChannelName(message);
  observations.push({
    observationId: `discord-message-${message.id}`,
    source: "discord",
    sourceType: thread ? "thread-message" : "channel-message",
    sourceId: message.id,
    parentSourceId: thread ? thread.id : message.channelId,
    timestamp: message.timestamp,
    editedTimestamp: message.editedTimestamp,
    reporterId: reporterKey("discord", message.authorId),
    reporterUsername: message.authorGlobalName ?? message.authorUsername,
    authorAssociation: null,
    channel,
    title: thread?.name ?? null,
    text,
    hint: hintForText(text, [], channel),
    labels: [],
    engagement: {
      reactionCount: (message.reactions ?? []).reduce((sum, item) => sum + item.count, 0),
    },
    exactFingerprint: fingerprint(text),
    url: message.url,
  });
}

for (const issue of github.issues) {
  if (issue.userType !== "Bot" && issue.createdAt < asOf) {
    const text = [issue.title, issue.body].filter(Boolean).join("\n\n").trim();
    if (text) {
      observations.push({
        observationId: `github-issue-${issue.id}`,
        source: "github",
        sourceType: "issue",
        sourceId: String(issue.id),
        parentSourceId: String(issue.number),
        timestamp: issue.createdAt,
        editedTimestamp: issue.updatedAt,
        reporterId: reporterKey("github", issue.userId),
        reporterUsername: issue.username,
        authorAssociation: issue.authorAssociation,
        channel: "issues",
        title: issue.title,
        text,
        hint: hintForText(text, issue.labels),
        labels: issue.labels,
        engagement: { reactionCount: issue.reactions?.total_count ?? 0 },
        exactFingerprint: fingerprint(text),
        url: issue.htmlUrl,
        issueNumber: issue.number,
        issueState: issue.state,
      });
    }
  }
  if (issue.closedAt && issue.closedAt < asOf) {
    statusEvents.push({
      source: "github",
      type: "closed",
      issueNumber: issue.number,
      timestamp: issue.closedAt,
      url: issue.htmlUrl,
    });
  }
}

for (const comment of github.comments) {
  if (comment.userType === "Bot" || !comment.body.trim() || comment.createdAt >= asOf) continue;
  const issue = issueByNumber.get(comment.issueNumber);
  if (!issue) continue;
  observations.push({
    observationId: `github-comment-${comment.id}`,
    source: "github",
    sourceType: "issue-comment",
    sourceId: String(comment.id),
    parentSourceId: String(comment.issueNumber),
    timestamp: comment.createdAt,
    editedTimestamp: comment.updatedAt,
    reporterId: reporterKey("github", comment.userId),
    reporterUsername: comment.username,
    authorAssociation: comment.authorAssociation,
    channel: "issues",
    title: issue.title,
    text: comment.body,
    hint: hintForText(comment.body, issue.labels),
    labels: issue.labels,
    engagement: { reactionCount: comment.reactions?.total_count ?? 0 },
    exactFingerprint: fingerprint(comment.body),
    url: comment.htmlUrl,
    issueNumber: comment.issueNumber,
    issueState: issue.state,
  });
}

for (const event of github.timeline) {
  if (!event.createdAt || event.createdAt >= asOf) continue;
  if (["reopened", "closed", "transferred", "converted_to_discussion"].includes(event.event)) {
    statusEvents.push({
      source: "github",
      type: event.event,
      issueNumber: event.issueNumber,
      timestamp: event.createdAt,
      actorId: event.actorId,
      actorUsername: event.actorUsername,
      url: issueByNumber.get(event.issueNumber)?.htmlUrl ?? null,
    });
  }
}

observations.sort((left, right) => left.timestamp.localeCompare(right.timestamp));
statusEvents.sort((left, right) => left.timestamp.localeCompare(right.timestamp));

const exactGroups = new Map();
for (const observation of observations) {
  const key = `${observation.source}:${observation.reporterId}:${observation.parentSourceId}:${observation.exactFingerprint}`;
  const group = exactGroups.get(key) ?? [];
  group.push(observation.observationId);
  exactGroups.set(key, group);
}
const exactDuplicateGroups = [...exactGroups.entries()]
  .filter(([, ids]) => ids.length > 1)
  .map(([key, observationIds]) => ({ key, observationIds }));

function countWindow(items, start, end = asOf) {
  const selected = items.filter((item) => inWindow(item.timestamp, start, end));
  return {
    observations: selected.length,
    discordReporters: new Set(
      selected.filter((item) => item.source === "discord").map((item) => item.reporterId),
    ).size,
    githubReporters: new Set(
      selected.filter((item) => item.source === "github").map((item) => item.reporterId),
    ).size,
    engagement: selected.reduce((sum, item) => sum + (item.engagement?.reactionCount ?? 0), 0),
  };
}

function windowCounts(items) {
  return {
    current2w: countWindow(items, twoWeekStart),
    previous2w: countWindow(items, previousTwoWeekStart, twoWeekStart),
    current4w: countWindow(items, fourWeekStart),
    previous4w: countWindow(items, previousFourWeekStart, fourWeekStart),
    allTime: countWindow(items, discord.historyStart ?? github.historyStart),
  };
}

const discordThreadGroups = new Map();
const discordDirect = [];
for (const observation of observations.filter((item) => item.source === "discord")) {
  if (observation.sourceType === "thread-message") {
    const group = discordThreadGroups.get(observation.parentSourceId) ?? [];
    group.push(observation);
    discordThreadGroups.set(observation.parentSourceId, group);
  } else {
    discordDirect.push({
      artifactId: observation.observationId,
      channel: observation.channel,
      title: observation.text.slice(0, 100),
      hint: observation.hint,
      timestamp: observation.timestamp,
      reporterUsername: observation.reporterUsername,
      text: observation.text,
      url: observation.url,
      windows: windowCounts([observation]),
    });
  }
}

const discordThreads = [...discordThreadGroups.entries()].map(([threadId, items]) => {
  const thread = threadById.get(threadId);
  const parent = channelById.get(thread?.parentId);
  const sorted = items.slice().sort((left, right) => left.timestamp.localeCompare(right.timestamp));
  return {
    artifactId: `discord-thread-${threadId}`,
    threadId,
    channel: parent?.name ?? sorted[0]?.channel ?? "unknown",
    title: thread?.name ?? sorted[0]?.title ?? "(untitled)",
    firstAt: sorted[0]?.timestamp ?? null,
    lastAt: sorted.at(-1)?.timestamp ?? null,
    firstText: sorted[0]?.text ?? "",
    recentTexts: sorted.slice(-4).map((item) => ({
      timestamp: item.timestamp,
      reporterUsername: item.reporterUsername,
      text: item.text,
      url: item.url,
    })),
    url: sorted[0]?.url ?? null,
    windows: windowCounts(items),
  };
});

const githubGroups = new Map();
for (const observation of observations.filter((item) => item.source === "github")) {
  const group = githubGroups.get(observation.issueNumber) ?? [];
  group.push(observation);
  githubGroups.set(observation.issueNumber, group);
}
const githubIssues = [...githubGroups.entries()].map(([issueNumber, items]) => {
  const issue = issueByNumber.get(issueNumber);
  const sorted = items.slice().sort((left, right) => left.timestamp.localeCompare(right.timestamp));
  return {
    artifactId: `github-issue-${issueNumber}`,
    issueNumber,
    title: issue?.title ?? sorted[0]?.title ?? "(untitled)",
    state: issue?.state ?? null,
    labels: issue?.labels ?? [],
    authorAssociation: issue?.authorAssociation ?? null,
    body: issue?.body ?? "",
    firstAt: sorted[0]?.timestamp ?? null,
    lastAt: sorted.at(-1)?.timestamp ?? null,
    recentComments: sorted
      .filter((item) => item.sourceType === "issue-comment")
      .slice(-4)
      .map((item) => ({
        timestamp: item.timestamp,
        reporterUsername: item.reporterUsername,
        authorAssociation: item.authorAssociation,
        text: item.text,
        url: item.url,
      })),
    url: issue?.htmlUrl ?? sorted[0]?.url ?? null,
    windows: windowCounts(items),
  };
});

const stopWords = new Set(
  "the a an and or but if then to of in on for with is are was were be been being this that it its i we you they my our your can could should would will just not no yes from as at by have has had do does did about into when how what why who which more some any all than also very get got getting use using used".split(" "),
);
const terms = new Map();
for (const observation of observations.filter((item) => inWindow(item.timestamp, fourWeekStart))) {
  const words = observation.text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9_-]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !stopWords.has(word) && !/^\d+$/.test(word));
  for (const word of new Set(words)) terms.set(word, (terms.get(word) ?? 0) + 1);
}

const windows = {
  asOf,
  twoWeekStart,
  fourWeekStart,
  previousTwoWeekStart,
  previousFourWeekStart,
};
const prepared = {
  runId: discord.runId,
  generatedAt: new Date().toISOString(),
  preparerVersion: "2.0.0-draft",
  windows,
  observations,
  statusEvents,
  exactDuplicateGroups,
  githubReactions: github.reactions,
};
await writeFile(
  path.join(runDir, "working", "normalized-observations.json"),
  `${JSON.stringify(prepared, null, 2)}\n`,
);

const digest = {
  runId: discord.runId,
  generatedAt: new Date().toISOString(),
  windows,
  corpus: windowCounts(observations),
  discordThreads: discordThreads.sort(
    (left, right) =>
      right.windows.current4w.discordReporters - left.windows.current4w.discordReporters ||
      right.windows.current4w.observations - left.windows.current4w.observations,
  ),
  discordDirectMessages: discordDirect
    .filter((item) => item.timestamp >= previousFourWeekStart)
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp)),
  githubIssues: githubIssues.sort(
    (left, right) =>
      right.windows.current4w.githubReporters - left.windows.current4w.githubReporters ||
      right.windows.current4w.observations - left.windows.current4w.observations,
  ),
  topTerms4w: [...terms.entries()]
    .map(([term, count]) => ({ term, observations: count }))
    .sort((left, right) => right.observations - left.observations)
    .slice(0, 200),
};
await writeFile(
  path.join(runDir, "working", "digest.json"),
  `${JSON.stringify(digest, null, 2)}\n`,
);

console.log(
  JSON.stringify({
    windows,
    observations: observations.length,
    current2w: digest.corpus.current2w,
    current4w: digest.corpus.current4w,
    allTime: digest.corpus.allTime,
    discordThreads: digest.discordThreads.length,
    discordDirectMessagesInComparisonRange: digest.discordDirectMessages.length,
    githubIssues: digest.githubIssues.length,
    exactDuplicateGroups: exactDuplicateGroups.length,
  }),
);
