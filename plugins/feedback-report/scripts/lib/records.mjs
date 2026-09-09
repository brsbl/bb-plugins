import path from "node:path";
import { fail } from "./cli.mjs";
import { weekIndexOf } from "./config.mjs";
import { readJsonl } from "./io.mjs";
import { readObservations, topicOf } from "./observations.mjs";
import { FEEDBACK_KINDS, themeOf, v2AreaOf } from "./taxonomy.mjs";

export function readClassification(runDir) {
  const filePath = path.join(runDir, "classification.jsonl");
  const byId = new Map();
  for (const line of readJsonl(filePath)) {
    if (byId.has(line.id)) fail(`${filePath} classifies ${line.id} more than once`);
    byId.set(line.id, line);
  }
  return byId;
}

export function readClassifiedRecords(runDir, config, taxonomy) {
  const observations = readObservations(runDir);
  const classification = readClassification(runDir);
  const records = observations.map((observation) => {
    const label = classification.get(observation.id);
    if (!label) fail(`classification.jsonl has no result for ${observation.id}`);
    const cluster = label.cluster ?? "";
    const areaV2 = v2AreaOf(taxonomy, label.area, cluster);
    return {
      ...observation,
      topic: topicOf(observation),
      week: weekIndexOf(observation.timestampMs, config),
      collaborator: config.collaborators.has(observation.reporterUsername),
      kind: label.kind,
      area: label.area,
      cluster,
      sentiment: label.sentiment,
      confidence: label.confidence,
      areaV2,
      theme: themeOf(taxonomy, label.area, areaV2),
      isFeedback: FEEDBACK_KINDS.has(label.kind),
    };
  });
  const observationIds = new Set(observations.map((observation) => observation.id));
  for (const id of classification.keys()) {
    if (!observationIds.has(id)) fail(`classification.jsonl has an unknown id ${id}`);
  }
  return records;
}

export function communityRecordsInWindow(records) {
  return records.filter((record) => record.week !== null && !record.collaborator);
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

export function feedbackTopics(records) {
  const topics = new Map();
  const byTopic = groupBy(records, (record) => record.topic);
  for (const record of communityRecordsInWindow(records)) {
    if (!record.isFeedback || topics.has(record.topic)) continue;
    const people = new Set(
      communityRecordsInWindow(byTopic.get(record.topic)).filter((item) => item.isFeedback).map((item) => item.reporterId),
    );
    topics.set(record.topic, {
      topic: record.topic,
      area: record.areaV2,
      kind: record.kind,
      source: record.source,
      date: record.date,
      people: people.size,
      symptom: record.symptom,
      url: record.url,
      issueNumber: record.issueNumber,
      messages: byTopic.get(record.topic),
    });
  }
  return [...topics.values()];
}

