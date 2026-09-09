import path from "node:path";
import { fail, log, parseArgs, requireArg } from "./lib/cli.mjs";
import { readConfig } from "./lib/config.mjs";
import { formatCsv } from "./lib/csv.mjs";
import { listFiles, readJsonl, writeJsonl, writeText } from "./lib/io.mjs";
import { readIssues } from "./lib/issues.mjs";
import { readObservations } from "./lib/observations.mjs";
import { feedbackTopics, readClassifiedRecords } from "./lib/records.mjs";
import { CONFIDENCES, KINDS, NON_PRODUCT_AREAS, SENTIMENTS, loadTaxonomy } from "./lib/taxonomy.mjs";

const USAGE = "node merge-batches.mjs --run <dir> --mode classify|resolve";
const SYMPTOM_LIMIT = 120;
const RESOLUTION_STATUSES = new Set(["shipped", "closed-no-pr", "tracked-open", "untracked", "unclear"]);
const RESOLUTION_COLUMNS = [
  "topic",
  "area",
  "kind",
  "source",
  "date",
  "people",
  "status",
  "ref",
  "ref_date",
  "confidence",
  "note",
  "symptom",
  "url",
];

function readResults(directory) {
  const files = listFiles(directory, ".jsonl");
  if (files.length === 0) fail(`No result files in ${directory}`);
  return files.flatMap((file) => readJsonl(file).map((line) => ({ file: path.basename(file), line })));
}

function collectUnique(results, keyName, keyOf) {
  const byKey = new Map();
  const problems = [];
  for (const { file, line } of results) {
    const key = keyOf(line);
    if (typeof key !== "string" || !key) {
      problems.push(`${file}: a line has no ${keyName}`);
    } else if (byKey.has(key)) {
      problems.push(`${key} appears in both ${byKey.get(key).file} and ${file}`);
    } else {
      byKey.set(key, { file, line });
    }
  }
  return { byKey, problems };
}

function countBy(items, keyOf) {
  const counts = new Map();
  for (const item of items) counts.set(keyOf(item), (counts.get(keyOf(item)) ?? 0) + 1);
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

function reportProblems(problems, limit = 25) {
  if (problems.length === 0) return;
  const shown = problems.slice(0, limit).join("\n  ");
  fail(`${problems.length} validation problems:\n  ${shown}${problems.length > limit ? "\n  ..." : ""}`);
}

function runClassify(runDir) {
  const taxonomy = loadTaxonomy();
  const allowedAreas = new Set([...taxonomy.v1Areas, ...NON_PRODUCT_AREAS]);
  const observations = readObservations(runDir);
  const results = readResults(path.join(runDir, "classification", "results"));
  const { byKey, problems } = collectUnique(results, "id", (line) => line.id);
  const observationIds = new Set(observations.map((observation) => observation.id));
  for (const [id, { file, line }] of byKey) {
    if (!observationIds.has(id)) problems.push(`${file}: unknown observation id ${id}`);
    if (!KINDS.has(line.kind)) problems.push(`${id}: invalid kind ${JSON.stringify(line.kind)}`);
    if (!allowedAreas.has(line.area)) problems.push(`${id}: invalid area ${JSON.stringify(line.area)}`);
    if (!SENTIMENTS.has(line.sentiment)) problems.push(`${id}: invalid sentiment ${JSON.stringify(line.sentiment)}`);
    if (!CONFIDENCES.has(line.confidence)) problems.push(`${id}: invalid confidence ${JSON.stringify(line.confidence)}`);
    if (line.cluster !== undefined && line.cluster !== null && typeof line.cluster !== "string") {
      problems.push(`${id}: cluster must be a string`);
    }
  }
  const missing = observations.filter((observation) => !byKey.has(observation.id));
  if (missing.length) {
    const first = missing.slice(0, 5).map((observation) => observation.id).join(", ");
    problems.push(`${missing.length} observations have no result (first: ${first})`);
  }
  reportProblems(problems);
  const merged = observations.map((observation) => {
    const { line } = byKey.get(observation.id);
    return {
      id: observation.id,
      kind: line.kind,
      area: line.area,
      cluster: (line.cluster ?? "").trim(),
      sentiment: line.sentiment,
      confidence: line.confidence,
    };
  });
  writeJsonl(path.join(runDir, "classification.jsonl"), merged);
  const fileCount = new Set(results.map((result) => result.file)).size;
  log(`merged ${merged.length} results from ${results.length} lines in ${fileCount} files`);
  log(`kinds: ${JSON.stringify(countBy(merged, (record) => record.kind))}`);
  log(`areas: ${JSON.stringify(countBy(merged, (record) => record.area))}`);
  log(`sentiment: ${JSON.stringify(countBy(merged, (record) => record.sentiment))}`);
  log(`confidence: ${JSON.stringify(countBy(merged, (record) => record.confidence))}`);
}

function normalizeRef(ref) {
  const text = String(ref ?? "").trim();
  return /^\d+$/.test(text) ? `#${text}` : text;
}

function validateRef(ref, topic, issueNumbers, problems) {
  if (ref === "") return;
  const issueMatch = ref.match(/^#(\d+)$/);
  if (issueMatch) {
    if (!issueNumbers.has(Number(issueMatch[1]))) problems.push(`${topic}: ref ${ref} is not in github/issues.json`);
    return;
  }
  if (!/^[0-9a-f]{7,40}$/.test(ref)) {
    problems.push(`${topic}: ref ${JSON.stringify(ref)} is neither #<issue> nor a 7-40 character hex sha`);
  }
}

function githubResolution(issue, config) {
  if (!issue) return { status: "unclear", ref: "", ref_date: "" };
  const closedBeforeAsOf = issue.closedMs !== null && issue.closedMs < config.asOfMs;
  if (!closedBeforeAsOf) return { status: "tracked-open", ref: `#${issue.number}`, ref_date: "" };
  return {
    status: issue.closedByPrCount > 0 ? "shipped" : "closed-no-pr",
    ref: `#${issue.number}`,
    ref_date: issue.closedAt.slice(0, 10),
  };
}

function discordResolution(line) {
  return {
    status: line.status,
    ref: normalizeRef(line.ref),
    ref_date: String(line.ref_date ?? "").trim(),
    confidence: line.confidence,
    note: String(line.note ?? "").trim(),
  };
}

function runResolve(runDir) {
  const config = readConfig(runDir);
  const taxonomy = loadTaxonomy();
  const records = readClassifiedRecords(runDir, config, taxonomy);
  const issueByNumber = new Map(readIssues(runDir).map((issue) => [issue.number, issue]));
  const issueNumbers = new Set(issueByNumber.keys());
  const topics = feedbackTopics(records);
  const discordTopics = new Set(topics.filter((topic) => topic.source === "discord").map((topic) => topic.topic));
  const results = readResults(path.join(runDir, "resolution", "results"));
  const { byKey, problems } = collectUnique(results, "topic", (line) => line.topic);
  for (const [topic, { file, line }] of byKey) {
    if (!discordTopics.has(topic)) problems.push(`${file}: ${topic} is not a Discord feedback topic in the window`);
    if (!RESOLUTION_STATUSES.has(line.status)) problems.push(`${topic}: invalid status ${JSON.stringify(line.status)}`);
    if (!CONFIDENCES.has(line.confidence)) problems.push(`${topic}: invalid confidence ${JSON.stringify(line.confidence)}`);
    const refDate = String(line.ref_date ?? "").trim();
    if (refDate && !/^\d{4}-\d{2}-\d{2}$/.test(refDate)) {
      problems.push(`${topic}: ref_date ${JSON.stringify(refDate)} is not YYYY-MM-DD`);
    }
    validateRef(normalizeRef(line.ref), topic, issueNumbers, problems);
  }
  const missing = [...discordTopics].filter((topic) => !byKey.has(topic));
  if (missing.length) {
    problems.push(`${missing.length} Discord topics have no result (first: ${missing.slice(0, 5).join(", ")})`);
  }
  reportProblems(problems);
  const rows = topics.map((topic) => {
    const resolution =
      topic.source === "github"
        ? { ...githubResolution(issueByNumber.get(topic.issueNumber), config), confidence: "high", note: "GitHub issue state" }
        : discordResolution(byKey.get(topic.topic).line);
    return {
      topic: topic.topic,
      area: topic.area,
      kind: topic.kind,
      source: topic.source,
      date: topic.date,
      people: topic.people,
      ...resolution,
      symptom: Array.from(topic.symptom).slice(0, SYMPTOM_LIMIT).join(""),
      url: topic.url,
    };
  });
  writeText(path.join(runDir, "resolution.csv"), formatCsv(RESOLUTION_COLUMNS, rows));
  log(`wrote ${rows.length} topics (${discordTopics.size} Discord, ${rows.length - discordTopics.size} GitHub)`);
  log(`status: ${JSON.stringify(countBy(rows, (row) => row.status))}`);
}

const args = parseArgs(process.argv.slice(2));
const runDir = requireArg(args, "run", USAGE);
const mode = requireArg(args, "mode", USAGE);
if (mode === "classify") runClassify(runDir);
else if (mode === "resolve") runResolve(runDir);
else fail(`Unknown --mode ${mode}. Usage: ${USAGE}`);
