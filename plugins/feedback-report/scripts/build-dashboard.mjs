import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DATA_PLACEHOLDER = "/*__DATA__*/";
const TEMPLATE_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "dashboard-template.html");
const REPORT_BLOCKS = ["meta", "weeks", "weekly", "areas", "themes", "totals"];
const REC_LENGTH = 8;
const HEADLINE_LENGTH = 4;

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

function fail(message) {
  process.stderr.write(`build-dashboard: ${message}\n`);
  process.exit(1);
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNumberOrNull(value) {
  return value === null || typeof value === "number";
}

function validateNarrative(narrative) {
  if (!Array.isArray(narrative.headlines)) return "narrative.json is missing headlines (array)";
  for (const [index, headline] of narrative.headlines.entries()) {
    const where = `narrative.json headlines[${index}]`;
    if (!Array.isArray(headline) || headline.length !== HEADLINE_LENGTH) return `${where} must be [kind, title, bullets, chart]`;
    const [kind, title, bullets, chart] = headline;
    if (typeof kind !== "string") return `${where} kind must be a string`;
    if (typeof title !== "string") return `${where} title must be a string`;
    if (!isStringArray(bullets)) return `${where} bullets must be an array of strings`;
    if (chart !== null && typeof chart !== "string") return `${where} chart must be a string or null`;
  }
  if (!Array.isArray(narrative.recs)) return "narrative.json is missing recs (array)";
  for (const [index, rec] of narrative.recs.entries()) {
    const where = `narrative.json recs[${index}]`;
    if (!Array.isArray(rec) || rec.length !== REC_LENGTH) {
      return `${where} must be [priority, title, area, people_pct, open_pct, close_pct, bullets, resolved_pct]`;
    }
    const [priority, title, area, peoplePct, openPct, closePct, bullets, resolvedPct] = rec;
    if (typeof priority !== "string") return `${where} priority must be a string`;
    if (typeof title !== "string") return `${where} title must be a string`;
    if (typeof area !== "string") return `${where} area must be a string`;
    if (!isNumberOrNull(peoplePct)) return `${where} people_pct must be a number`;
    if (!isNumberOrNull(openPct)) return `${where} open_pct must be a number`;
    if (!isNumberOrNull(closePct)) return `${where} close_pct must be a number`;
    if (!isStringArray(bullets)) return `${where} bullets must be an array of strings`;
    if (!isNumberOrNull(resolvedPct)) return `${where} resolved_pct must be a number or null`;
  }
  if (typeof narrative.rec_rule !== "string") return "narrative.json is missing rec_rule (string)";
  if (!isPlainObject(narrative.asks)) return "narrative.json is missing asks (object of area to [asks, status])";
  for (const [area, entry] of Object.entries(narrative.asks)) {
    if (!Array.isArray(entry) || entry.length !== 2 || !entry.every((item) => typeof item === "string")) {
      return `narrative.json asks["${area}"] must be [asks, status]`;
    }
  }
  if (typeof narrative.untracked_note !== "string") return "narrative.json is missing untracked_note (string)";
  return null;
}

function validateReport(report) {
  for (const block of REPORT_BLOCKS) {
    if (report[block] === undefined) return `report.json is missing ${block}`;
  }
  if (!isPlainObject(report.meta)) return "report.json meta must be an object";
  for (const key of ["asOf", "periodStart", "weeks", "repository"]) {
    if (report.meta[key] === undefined || report.meta[key] === null || report.meta[key] === "") return `report.json meta is missing ${key}`;
  }
  return null;
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") fail(`${file} not found`);
    fail(`${file} is not valid JSON: ${error.message}`);
  }
}

const args = parseArgs(process.argv.slice(2));
if (!args.run) fail("Usage: node build-dashboard.mjs --run <run-dir> [--out <file>]");
const runDir = path.resolve(args.run);
const outputFile = args.out ? path.resolve(args.out) : path.join(runDir, "dashboard.html");

const report = await readJson(path.join(runDir, "report.json"));
const narrative = await readJson(path.join(runDir, "narrative.json"));
const reportProblem = validateReport(report);
if (reportProblem) fail(reportProblem);
const narrativeProblem = validateNarrative(narrative);
if (narrativeProblem) fail(narrativeProblem);

const template = await readFile(TEMPLATE_FILE, "utf8");
if (!template.includes(DATA_PLACEHOLDER)) fail(`${TEMPLATE_FILE} has no ${DATA_PLACEHOLDER} placeholder`);
const data = { ...report, ...narrative };
const dataScript = `const DATA=${JSON.stringify(data).replace(/<\//g, "<\\/")};`;
const html = template.replace(DATA_PLACEHOLDER, () => dataScript);
await writeFile(outputFile, html);
process.stdout.write(`${outputFile}: ${html.length} bytes\n`);
