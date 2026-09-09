import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ISSUE_LOOKBACK_DAYS = 60;
const PAGE_SIZE = 100;
const SEARCH_RESULT_CAP = 1000;
const DAY_MS = 86400 * 1000;

const ISSUES_QUERY = `
query($owner: String!, $name: String!, $since: DateTime!, $after: String) {
  repository(owner: $owner, name: $name) {
    issues(first: ${PAGE_SIZE}, after: $after, states: [OPEN, CLOSED], filterBy: { since: $since }, orderBy: { field: UPDATED_AT, direction: ASC }) {
      pageInfo { hasNextPage endCursor }
      nodes {
        number
        title
        state
        createdAt
        closedAt
        authorAssociation
        author { login }
        body
        closedByPullRequestsReferences { totalCount }
      }
    }
  }
}`;

const MERGED_PRS_QUERY = `
query($search: String!, $after: String) {
  search(type: ISSUE, query: $search, first: ${PAGE_SIZE}, after: $after) {
    issueCount
    pageInfo { hasNextPage endCursor }
    nodes {
      ... on PullRequest {
        number
        title
        mergedAt
        baseRefName
        mergeCommit { oid }
        closingIssuesReferences(first: 50) { nodes { number } }
      }
    }
  }
}`;

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
  process.stderr.write(`github-state: ${message}\n`);
  process.exit(1);
}

function ensureGhReady() {
  try {
    execFileSync("gh", ["auth", "status", "--hostname", "github.com"], { stdio: ["ignore", "ignore", "pipe"] });
  } catch (error) {
    if (error.code === "ENOENT") fail("the gh CLI is not installed or not on PATH");
    fail(`gh is not authenticated for github.com: ${error.stderr?.toString().trim() || error.message}`);
  }
}

function graphql(query, variables) {
  const args = ["api", "graphql", "-f", `query=${query}`];
  for (const [key, value] of Object.entries(variables)) {
    if (value === null || value === undefined) continue;
    args.push("-f", `${key}=${value}`);
  }
  let output;
  try {
    output = execFileSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    fail(`gh api graphql failed: ${error.stderr?.toString().trim() || error.message}`);
  }
  const parsed = JSON.parse(output);
  if (parsed.errors?.length) fail(`GraphQL errors: ${parsed.errors.map((item) => item.message).join("; ")}`);
  return parsed.data;
}

function dateOnly(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function fetchIssues(owner, name, since) {
  const byNumber = new Map();
  let after = null;
  for (;;) {
    const data = graphql(ISSUES_QUERY, { owner, name, since, after });
    const connection = data.repository.issues;
    for (const node of connection.nodes) {
      byNumber.set(node.number, {
        number: node.number,
        title: node.title,
        state: node.state,
        createdAt: node.createdAt,
        closedAt: node.closedAt,
        authorAssociation: node.authorAssociation,
        author: node.author?.login ?? null,
        body: node.body ?? "",
        closedByPullRequestsReferences: { totalCount: node.closedByPullRequestsReferences?.totalCount ?? 0 },
      });
    }
    if (!connection.pageInfo.hasNextPage) break;
    after = connection.pageInfo.endCursor;
  }
  return [...byNumber.values()].sort((a, b) => a.number - b.number);
}

function fetchMergedPrsInRange(repository, fromMs, toMs, byNumber) {
  const search = `repo:${repository} is:pr is:merged merged:${dateOnly(fromMs)}..${dateOnly(toMs)}`;
  const first = graphql(MERGED_PRS_QUERY, { search, after: null });
  if (first.search.issueCount > SEARCH_RESULT_CAP) {
    if (toMs - fromMs < DAY_MS) fail(`more than ${SEARCH_RESULT_CAP} merged PRs on ${dateOnly(fromMs)}; the search API cannot list them all`);
    const midMs = fromMs + Math.floor((toMs - fromMs) / 2 / DAY_MS) * DAY_MS;
    fetchMergedPrsInRange(repository, fromMs, midMs, byNumber);
    fetchMergedPrsInRange(repository, midMs + DAY_MS, toMs, byNumber);
    return;
  }
  let connection = first.search;
  for (;;) {
    for (const node of connection.nodes) {
      if (node.number === undefined) continue;
      byNumber.set(node.number, {
        number: node.number,
        title: node.title,
        mergedAt: node.mergedAt,
        baseRefName: node.baseRefName,
        mergeCommit: { oid: node.mergeCommit?.oid ?? null },
        closingIssuesReferences: { nodes: node.closingIssuesReferences.nodes.map((issue) => ({ number: issue.number })) },
      });
    }
    if (!connection.pageInfo.hasNextPage) break;
    connection = graphql(MERGED_PRS_QUERY, { search, after: connection.pageInfo.endCursor }).search;
  }
}

function fetchMergedPrs(repository, periodStartMs, asOfMs) {
  const byNumber = new Map();
  fetchMergedPrsInRange(repository, periodStartMs, asOfMs, byNumber);
  return [...byNumber.values()]
    .filter((pr) => {
      const mergedMs = Date.parse(pr.mergedAt);
      return mergedMs >= periodStartMs && mergedMs < asOfMs;
    })
    .sort((a, b) => a.number - b.number);
}

const args = parseArgs(process.argv.slice(2));
if (!args.run) fail("Usage: node github-state.mjs --run <run-dir>");
const runDir = path.resolve(args.run);

const config = JSON.parse(await readFile(path.join(runDir, "config.json"), "utf8"));
for (const key of ["repository", "periodStart", "asOf"]) {
  if (!config[key]) fail(`config.json is missing ${key}`);
}
const [owner, name, ...rest] = config.repository.split("/");
if (!owner || !name || rest.length) fail(`config.json repository must be owner/name, got ${config.repository}`);
const periodStartMs = Date.parse(config.periodStart);
const asOfMs = Date.parse(config.asOf);
if (!Number.isFinite(periodStartMs) || !Number.isFinite(asOfMs) || periodStartMs >= asOfMs) {
  fail(`config.json has an invalid window: ${config.periodStart} to ${config.asOf}`);
}

ensureGhReady();

const issuesSince = new Date(periodStartMs - ISSUE_LOOKBACK_DAYS * DAY_MS).toISOString();
const issues = fetchIssues(owner, name, issuesSince);
const prs = fetchMergedPrs(config.repository, periodStartMs, asOfMs);

const githubDir = path.join(runDir, "github");
await mkdir(githubDir, { recursive: true });
const issuesFile = path.join(githubDir, "issues.json");
const prsFile = path.join(githubDir, "prs.json");
await writeFile(issuesFile, JSON.stringify(issues, null, 2) + "\n");
await writeFile(prsFile, JSON.stringify(prs, null, 2) + "\n");
process.stdout.write(`${issuesFile}: ${issues.length} issues updated since ${issuesSince}\n`);
process.stdout.write(`${prsFile}: ${prs.length} PRs merged in [${config.periodStart}, ${config.asOf})\n`);
