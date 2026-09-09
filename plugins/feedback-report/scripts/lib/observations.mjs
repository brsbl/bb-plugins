import path from "node:path";
import { fail } from "./cli.mjs";
import { readJson } from "./io.mjs";

function firstLine(text) {
  return text.split("\n")[0].trim();
}

function normalizeObservation(raw, index) {
  const id = raw.itemId ?? raw.observationId;
  const text = raw.sourceText ?? raw.text ?? "";
  const timestamp = raw.timestamp;
  if (!id || !timestamp || !raw.source || !raw.sourceType) {
    fail(`normalized observation ${index} is missing itemId, timestamp, source, or sourceType`);
  }
  const timestampMs = Date.parse(timestamp);
  if (Number.isNaN(timestampMs)) fail(`observation ${id} has an invalid timestamp: ${timestamp}`);
  const isGithub = raw.source === "github";
  return {
    id,
    source: raw.source,
    sourceType: raw.sourceType,
    text,
    symptom: raw.symptom ?? firstLine(text),
    title: raw.title ?? (raw.sourceType === "issue" ? firstLine(text) : null),
    reporterId: raw.reporterId ?? "unknown",
    reporterUsername: raw.reporterUsername ?? "",
    authorAssociation: raw.authorAssociation ?? null,
    timestamp,
    timestampMs,
    date: raw.date ?? timestamp.slice(0, 10),
    channel: raw.channel ?? "",
    parentSourceId: String(raw.parentSourceId ?? ""),
    sourceId: String(raw.sourceId ?? ""),
    issueNumber: isGithub ? Number(raw.issueNumber ?? raw.parentSourceId) : null,
    labels: Array.isArray(raw.labels) ? raw.labels : [],
    url: raw.url ?? "",
    agentFiled: isGithub && text.includes("AGENT GENERATED"),
  };
}

export function readObservations(runDir) {
  const raw = readJson(path.join(runDir, "working", "normalized-observations.json"));
  const list = Array.isArray(raw) ? raw : raw.observations;
  if (!Array.isArray(list)) fail("working/normalized-observations.json must be an array of records");
  const observations = list.map(normalizeObservation);
  observations.sort((left, right) => left.timestampMs - right.timestampMs || left.id.localeCompare(right.id));
  return observations;
}

export function topicOf(observation) {
  if (observation.source === "github") return `gh#${observation.issueNumber}`;
  if (observation.sourceType === "thread-message") return `dc-thread-${observation.parentSourceId}`;
  return `dc-msg-${observation.sourceId}`;
}

export function truncate(text, limit) {
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}
