import path from "node:path";
import { fail } from "./cli.mjs";
import { readJson } from "./io.mjs";

function closedByPrCount(raw) {
  const value = raw.closedByPullRequestsReferences;
  if (typeof value === "number") return value;
  if (value && typeof value.totalCount === "number") return value.totalCount;
  return 0;
}

export function readIssues(runDir) {
  const raw = readJson(path.join(runDir, "github", "issues.json"));
  const list = Array.isArray(raw) ? raw : raw.issues;
  if (!Array.isArray(list)) fail("github/issues.json must be an array of issues");
  return list.map((issue, index) => {
    if (!Number.isInteger(issue.number) || !issue.createdAt) fail(`issue ${index} is missing number or createdAt`);
    const createdMs = Date.parse(issue.createdAt);
    const closedMs = issue.closedAt ? Date.parse(issue.closedAt) : null;
    if (Number.isNaN(createdMs) || Number.isNaN(closedMs)) fail(`issue #${issue.number} has an invalid date`);
    return {
      number: issue.number,
      title: issue.title ?? "",
      state: String(issue.state ?? (closedMs ? "CLOSED" : "OPEN")).toLowerCase(),
      createdAt: issue.createdAt,
      createdMs,
      closedAt: issue.closedAt ?? null,
      closedMs,
      author: typeof issue.author === "string" ? issue.author : issue.author?.login ?? "",
      authorAssociation: issue.authorAssociation ?? null,
      body: issue.body ?? "",
      closedByPrCount: closedByPrCount(issue),
      agentFiled: (issue.body ?? "").includes("AGENT GENERATED"),
    };
  });
}

