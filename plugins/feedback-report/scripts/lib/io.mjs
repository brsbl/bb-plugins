import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail } from "./cli.mjs";

export function readText(filePath) {
  try {
    return readFileSync(filePath, "utf8");
  } catch (error) {
    return fail(`Cannot read ${filePath}: ${error.message}`);
  }
}

export function readJson(filePath) {
  try {
    return JSON.parse(readText(filePath));
  } catch (error) {
    return fail(`Invalid JSON in ${filePath}: ${error.message}`);
  }
}

export function readJsonl(filePath) {
  const records = [];
  readText(filePath)
    .split("\n")
    .forEach((line, index) => {
      if (!line.trim()) return;
      try {
        records.push(JSON.parse(line));
      } catch (error) {
        fail(`Invalid JSON on line ${index + 1} of ${filePath}: ${error.message}`);
      }
    });
  return records;
}

export function writeJsonl(filePath, records) {
  writeText(filePath, records.map((record) => JSON.stringify(record)).join("\n") + (records.length ? "\n" : ""));
}

export function writeJson(filePath, value) {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function writeText(filePath, text) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, text);
}

export function listFiles(directory, extension) {
  try {
    return readdirSync(directory)
      .filter((name) => name.endsWith(extension))
      .sort()
      .map((name) => path.join(directory, name));
  } catch (error) {
    return fail(`Cannot list ${directory}: ${error.message}`);
  }
}
