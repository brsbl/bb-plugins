import { existsSync } from "node:fs";
import path from "node:path";
import { fail, log, parseArgs, positiveInteger, requireArg } from "./lib/cli.mjs";
import { readConfig } from "./lib/config.mjs";
import { readIssues } from "./lib/issues.mjs";
import { readLedger } from "./lib/ledger.mjs";
import { writeJsonl, writeText } from "./lib/io.mjs";
import { readObservations, truncate } from "./lib/observations.mjs";
import { feedbackTopics, readClassifiedRecords } from "./lib/records.mjs";
import { loadTaxonomy } from "./lib/taxonomy.mjs";

const USAGE = "node make-batches.mjs --run <dir> --mode classify|resolve [--batches N]";
const ISSUE_TEXT_LIMIT = 1500;
const MESSAGE_TEXT_LIMIT = 600;
const THREAD_STARTER_LIMIT = 200;
const CHANNEL_CHUNK_SIZE = 60;
const SYMPTOM_LIMIT = 140;
const TOPIC_TEXT_LIMIT = 900;

function balanceGroups(groups, batchCount) {
  const batches = Array.from({ length: batchCount }, () => ({ chars: 0, groups: [] }));
  const bySize = [...groups].sort((left, right) => right.chars - left.chars || left.order.localeCompare(right.order));
  for (const group of bySize) {
    const target = batches.reduce((best, batch) => (batch.chars < best.chars ? batch : best), batches[0]);
    target.groups.push(group);
    target.chars += group.chars;
  }
  return batches.map((batch) => ({
    chars: batch.chars,
    lines: batch.groups
      .sort((left, right) => left.order.localeCompare(right.order))
      .flatMap((group) => group.lines),
  }));
}

function lineChars(line) {
  return JSON.stringify(line).length;
}

function makeGroup(order, lines) {
  return { order, lines, chars: lines.reduce((sum, line) => sum + lineChars(line), 0) };
}

function issueLine(observation) {
  return {
    id: observation.id,
    src: "github-issue",
    date: observation.date,
    author: observation.reporterUsername,
    assoc: observation.authorAssociation,
    labels: observation.labels,
    title: observation.title,
    text: truncate(observation.text, ISSUE_TEXT_LIMIT),
  };
}

function commentLine(observation, issueTitle) {
  return {
    id: observation.id,
    src: "github-comment",
    date: observation.date,
    author: observation.reporterUsername,
    assoc: observation.authorAssociation,
    labels: observation.labels,
    on_issue: `#${observation.issueNumber}: ${issueTitle}`,
    text: truncate(observation.text, MESSAGE_TEXT_LIMIT),
  };
}

function discordLine(observation, src, threadStarter) {
  const line = {
    id: observation.id,
    src,
    date: observation.date,
    author: observation.reporterUsername,
    channel: observation.channel,
  };
  if (threadStarter !== null) line.thread_starter = truncate(threadStarter, THREAD_STARTER_LIMIT);
  line.text = truncate(observation.text, MESSAGE_TEXT_LIMIT);
  return line;
}

function groupBy(items, keyOf) {
  const groups = new Map();
  for (const item of items) {
    const key = keyOf(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

function issueTitles(runDir) {
  if (!existsSync(path.join(runDir, "github", "issues.json"))) return new Map();
  return new Map(readIssues(runDir).map((issue) => [issue.number, issue.title]));
}

function classifyGroups(observations, runDir) {
  const groups = [];
  const knownTitles = issueTitles(runDir);
  for (const [issueNumber, items] of groupBy(observations.filter((o) => o.source === "github"), (o) => o.issueNumber)) {
    const issue = items.find((item) => item.sourceType === "issue");
    const title = issue?.title ?? knownTitles.get(issueNumber) ?? `#${issueNumber}`;
    const comments = items.filter((item) => item.sourceType !== "issue");
    const lines = [...(issue ? [issueLine(issue)] : []), ...comments.map((item) => commentLine(item, title))];
    groups.push(makeGroup(`${items[0].timestamp} gh#${issueNumber}`, lines));
  }
  const discord = observations.filter((o) => o.source === "discord");
  for (const [threadId, items] of groupBy(discord.filter((o) => o.sourceType === "thread-message"), (o) => o.parentSourceId)) {
    const starter = items[0];
    const lines = items.map((item) => discordLine(item, "discord-thread", item === starter ? null : starter.text));
    groups.push(makeGroup(`${starter.timestamp} dc-thread-${threadId}`, lines));
  }
  const channelMessages = discord.filter((o) => o.sourceType !== "thread-message");
  for (let start = 0; start < channelMessages.length; start += CHANNEL_CHUNK_SIZE) {
    const chunk = channelMessages.slice(start, start + CHANNEL_CHUNK_SIZE);
    const lines = chunk.map((item) => discordLine(item, "discord-channel", null));
    groups.push(makeGroup(`${chunk[0].timestamp} dc-chunk-${chunk[0].sourceId}`, lines));
  }
  return groups;
}

function taxonomyMarkdown(taxonomy) {
  const lines = ["# Classification taxonomy (v1 areas and clusters)", ""];
  for (const entry of taxonomy.v1) {
    const clusters = entry.clusters.length ? entry.clusters.join("; ") : "free-form (name the feature)";
    lines.push(`- **${entry.area}** — clusters: ${clusters}`);
  }
  lines.push("", `Areas outside the product taxonomy: General; Non-product; Unclear.`);
  return `${lines.join("\n")}\n`;
}

function writeBatches(directory, batches, label) {
  batches.forEach((batch, index) => {
    writeJsonl(path.join(directory, `batch-${index + 1}.jsonl`), batch.lines);
    log(`${label} batch-${index + 1}.jsonl: ${batch.lines.length} lines, ${batch.chars} chars`);
  });
}

function runClassify(runDir, batchCount) {
  const taxonomy = loadTaxonomy();
  const observations = readObservations(runDir);
  const groups = classifyGroups(observations, runDir);
  const batches = balanceGroups(groups, batchCount);
  const lineTotal = batches.reduce((sum, batch) => sum + batch.lines.length, 0);
  if (lineTotal !== observations.length) fail(`batched ${lineTotal} lines for ${observations.length} observations`);
  writeBatches(path.join(runDir, "classification", "batches"), batches, "classification");
  writeText(path.join(runDir, "classification", "taxonomy.md"), taxonomyMarkdown(taxonomy));
  log(`wrote ${groups.length} groups across ${batchCount} batches and classification/taxonomy.md`);
}

function topicLine(topic) {
  const text = topic.messages.map((message) => `${message.reporterUsername}: ${message.text}`).join("\n---\n");
  return {
    topic: topic.topic,
    area: topic.area,
    kind: topic.kind,
    date: topic.date,
    symptom: truncate(topic.symptom, SYMPTOM_LIMIT),
    text: truncate(text, TOPIC_TEXT_LIMIT),
  };
}

function runResolve(runDir, batchCount) {
  const config = readConfig(runDir);
  const taxonomy = loadTaxonomy();
  const records = readClassifiedRecords(runDir, config, taxonomy);
  const discordTopics = feedbackTopics(records).filter((topic) => topic.source === "discord");
  const groups = discordTopics.map((topic) => makeGroup(`${topic.date} ${topic.topic}`, [topicLine(topic)]));
  writeBatches(path.join(runDir, "resolution", "batches"), balanceGroups(groups, batchCount), "resolution");
  const ledger = readLedger(runDir);
  writeText(
    path.join(runDir, "resolution", "commits.txt"),
    ledger.map((commit) => `${commit.sha} ${commit.date.slice(0, 10)} ${commit.subject}`).join("\n") + "\n",
  );
  const issues = readIssues(runDir).sort((left, right) => left.number - right.number);
  const titleByIssue = new Map(records.filter((record) => record.sourceType === "issue").map((record) => [record.issueNumber, record.title]));
  writeText(
    path.join(runDir, "resolution", "issues.txt"),
    issues
      .map((issue) => {
        const state = issue.closedAt ? `closed ${issue.closedAt.slice(0, 10)}` : "open";
        return `#${issue.number} [${state}] ${issue.title || titleByIssue.get(issue.number) || ""}`;
      })
      .join("\n") + "\n",
  );
  log(`wrote ${discordTopics.length} Discord topics, ${ledger.length} commits, ${issues.length} issues`);
}

const args = parseArgs(process.argv.slice(2));
const runDir = requireArg(args, "run", USAGE);
const mode = requireArg(args, "mode", USAGE);
if (mode === "classify") runClassify(runDir, positiveInteger(args.batches ?? "8", "--batches"));
else if (mode === "resolve") runResolve(runDir, positiveInteger(args.batches ?? "5", "--batches"));
else fail(`Unknown --mode ${mode}. Usage: ${USAGE}`);
