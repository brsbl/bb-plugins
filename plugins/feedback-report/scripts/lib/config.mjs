import path from "node:path";
import { fail } from "./cli.mjs";
import { readJson } from "./io.mjs";

export const DAY_MS = 86400 * 1000;
export const WEEK_MS = 7 * DAY_MS;

export function readConfig(runDir) {
  const config = readJson(path.join(runDir, "config.json"));
  for (const key of ["asOf", "weeks", "periodStart", "repository", "collaborators"]) {
    if (config[key] === undefined || config[key] === null) fail(`config.json is missing ${key}`);
  }
  const asOfMs = Date.parse(config.asOf);
  const periodStartMs = Date.parse(config.periodStart);
  const weeks = Number(config.weeks);
  if (Number.isNaN(asOfMs)) fail(`config.json asOf is not a date: ${config.asOf}`);
  if (Number.isNaN(periodStartMs)) fail(`config.json periodStart is not a date: ${config.periodStart}`);
  if (!Number.isInteger(weeks) || weeks < 1) fail(`config.json weeks must be a positive integer: ${config.weeks}`);
  if (asOfMs - periodStartMs !== weeks * WEEK_MS) {
    fail(`config.json periodStart must be exactly ${weeks} weeks before asOf`);
  }
  if (!Array.isArray(config.collaborators) || !config.collaborators.every((name) => typeof name === "string")) {
    fail("config.json collaborators must be an array of strings");
  }
  return {
    runId: config.runId ?? `${config.asOf.slice(0, 10)}_${weeks}w`,
    asOf: config.asOf,
    asOfMs,
    periodStart: config.periodStart,
    periodStartMs,
    weeks,
    repository: config.repository,
    collaborators: new Set(config.collaborators),
  };
}

export function weekIndexOf(timestampMs, config) {
  if (timestampMs < config.periodStartMs || timestampMs >= config.asOfMs) return null;
  return Math.floor((timestampMs - config.periodStartMs) / WEEK_MS);
}

export function weekLabels(config) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return Array.from({ length: config.weeks }, (_, index) => {
    const start = new Date(config.periodStartMs + index * WEEK_MS);
    const end = new Date(config.periodStartMs + (index + 1) * WEEK_MS);
    const startText = `${months[start.getUTCMonth()]} ${start.getUTCDate()}`;
    const endText =
      start.getUTCMonth() === end.getUTCMonth()
        ? String(end.getUTCDate())
        : `${months[end.getUTCMonth()]} ${end.getUTCDate()}`;
    return `${startText}–${endText}`;
  });
}
