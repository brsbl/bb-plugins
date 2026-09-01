import { execFile } from "node:child_process";
import { access, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Branch the plugin keeps its own corpus checkout on. */
export const CORPUS_BRANCH = "doctrine-corpus";
/** Directory, inside the plugin data directory, holding that checkout. */
export const CORPUS_DIRECTORY = "corpus";

export interface CorpusCheckout {
  /** Git repository that publishes the rule corpus. */
  repositoryRoot: string;
  /** Worktree the plugin owns, reads from, and commits into. */
  path: string;
  /** Branch rule changes are published to. */
  baseBranch: string;
  /** Rules directory, relative to the worktree root. */
  rulesPath: string;
}

async function git(cwd: string, ...args: string[]): Promise<string> {
  const result = await execFileAsync("git", ["-C", cwd, ...args], {
    encoding: "utf8",
  });
  return result.stdout.trim();
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * The plugin's own data directory, derived from the SQLite file bb opens for
 * it. bb owns that directory, so the corpus checkout lives and dies with the
 * plugin instead of sitting in a source tree waiting to be deleted.
 */
export function pluginDataDirectory(databasePath: string): string {
  return dirname(databasePath);
}

/**
 * Resolves the repository that publishes a rule corpus. Returns null when the
 * path is not inside a git repository — the normal case for an install from
 * the marketplace, which reads the rules it shipped with.
 */
export async function resolveRepositoryRoot(
  path: string,
): Promise<string | null> {
  try {
    return await git(path, "rev-parse", "--show-toplevel");
  } catch {
    return null;
  }
}

/** The branch a repository publishes from, falling back to `main`. */
export async function resolveBaseBranch(
  repositoryRoot: string,
): Promise<string> {
  try {
    const head = await git(
      repositoryRoot,
      "symbolic-ref",
      "--short",
      "refs/remotes/origin/HEAD",
    );
    const branch = head.replace(/^origin\//, "");
    return branch.length > 0 ? branch : "main";
  } catch {
    return "main";
  }
}

/**
 * Creates the corpus checkout when it is missing and repairs it when it was
 * deleted out from under the plugin, so a removed directory is a recoverable
 * state rather than an install that silently stops learning.
 */
export async function ensureCheckout(checkout: CorpusCheckout): Promise<void> {
  const { repositoryRoot, path, baseBranch } = checkout;
  if (await exists(join(path, ".git"))) return;
  // A worktree whose directory vanished stays registered and blocks re-adding
  // the same path, so clear those records first.
  await git(repositoryRoot, "worktree", "prune").catch(() => undefined);
  await rm(path, { recursive: true, force: true });
  await mkdir(dirname(path), { recursive: true });
  await git(repositoryRoot, "fetch", "--quiet", "origin", baseBranch).catch(
    () => undefined,
  );
  const startPoint = await git(
    repositoryRoot,
    "rev-parse",
    "--verify",
    `origin/${baseBranch}`,
  ).catch(() => "HEAD");
  await git(
    repositoryRoot,
    "worktree",
    "add",
    "--force",
    "-B",
    CORPUS_BRANCH,
    path,
    startPoint,
  );
}

export type CorpusState =
  /** Rules are being edited right now; leave the checkout alone. */
  | "writing"
  /** Committed rules that have not reached the published branch yet. */
  | "unpublished"
  /** Nothing of its own in flight; safe to fast-forward. */
  | "published";

async function succeeds(
  operation: () => Promise<unknown>,
): Promise<boolean> {
  try {
    await operation();
    return true;
  } catch {
    return false;
  }
}

/**
 * Distinguishes the corpus having rules of its own from the published branch
 * simply having moved ahead. Commit ancestry alone is not enough — a batch
 * lands as a squash that shares no history with the commit here, which
 * ancestry would report as unpublished forever and republish every cycle — so
 * a checkout carrying local commits is only unpublished while its rules still
 * differ from the ones on the published branch.
 */
export async function readState(
  checkout: CorpusCheckout,
): Promise<CorpusState> {
  const { path, baseBranch, rulesPath } = checkout;
  if ((await git(path, "status", "--porcelain=v1", "-uall")).length > 0) {
    return "writing";
  }
  const merged = await succeeds(() =>
    git(path, "merge-base", "--is-ancestor", "HEAD", `origin/${baseBranch}`),
  );
  if (merged) return "published";
  const sameRules = await succeeds(() =>
    git(path, "diff", "--quiet", `origin/${baseBranch}`, "HEAD", "--", rulesPath),
  );
  return sameRules ? "published" : "unpublished";
}

/**
 * Brings the corpus in line with what has actually been published. Only
 * fast-forwards once its own rules have landed, so a refresh can never discard
 * a batch that is still in flight.
 */
export async function refreshCheckout(
  checkout: CorpusCheckout,
): Promise<boolean> {
  await ensureCheckout(checkout);
  const { repositoryRoot, path, baseBranch } = checkout;
  await git(repositoryRoot, "fetch", "--quiet", "origin", baseBranch);
  if ((await readState(checkout)) !== "published") return false;
  const before = await git(path, "rev-parse", "HEAD");
  await git(path, "reset", "--hard", "--quiet", `origin/${baseBranch}`);
  return before !== (await git(path, "rev-parse", "HEAD"));
}

interface OpenPullRequest {
  number: number;
  url: string;
  mergeStateStatus: string;
  createdAt: string;
}

async function openPullRequest(
  path: string,
  branch: string,
): Promise<OpenPullRequest | null> {
  const result = await execFileAsync(
    "gh",
    [
      "pr",
      "list",
      "--head",
      branch,
      "--state",
      "open",
      "--json",
      "number,url,mergeStateStatus,createdAt",
    ],
    { cwd: path, encoding: "utf8" },
  );
  const parsed = JSON.parse(result.stdout) as OpenPullRequest[];
  return parsed[0] ?? null;
}

export interface StalledPublication {
  url: string;
  /** Why GitHub will not merge it: BLOCKED, BEHIND, DIRTY, and so on. */
  reason: string;
  ageHours: number;
}

/**
 * Reports a batch that was published but is not merging. Auto-merge waits
 * indefinitely and nobody is watching the queue, so an unresolved review
 * comment or a failing check would otherwise stop the corpus learning without
 * ever saying so.
 */
export async function readStalledPublication(
  checkout: CorpusCheckout,
  stallAfterHours = 6,
): Promise<StalledPublication | null> {
  if ((await readState(checkout)) !== "unpublished") return null;
  const head = await git(checkout.path, "rev-parse", "--short", "HEAD");
  const pullRequest = await openPullRequest(checkout.path, `doctrine/${head}`);
  if (!pullRequest) return null;
  const ageHours =
    (Date.now() - Date.parse(pullRequest.createdAt)) / (60 * 60 * 1_000);
  if (ageHours < stallAfterHours) return null;
  return {
    url: pullRequest.url,
    reason: pullRequest.mergeStateStatus,
    ageHours: Math.round(ageHours),
  };
}

/**
 * Publishes committed rules as a pull request that merges itself once the
 * repository's required checks pass: rules reach the corpus only after CI has
 * validated them, and nobody has to watch the queue for that to happen.
 *
 * Safe to call repeatedly for the same batch — a publish that fails part way
 * is retried on the next cycle rather than stranding the rules.
 */
export async function publishCheckout(
  checkout: CorpusCheckout,
): Promise<string | null> {
  const { path, baseBranch } = checkout;
  if ((await readState(checkout)) !== "unpublished") return null;
  const head = await git(path, "rev-parse", "--short", "HEAD");
  const branch = `doctrine/${head}`;
  await git(path, "push", "--quiet", "--force-with-lease", "origin", `HEAD:refs/heads/${branch}`);
  if (!(await openPullRequest(path, branch))) {
    await execFileAsync(
      "gh",
      [
        "pr",
        "create",
        "--head",
        branch,
        "--base",
        baseBranch,
        "--title",
        "doctrine: publish harvested rules",
        "--body",
        "Rules harvested from bb thread feedback by the Design Doctrine plugin.\n\nMerges itself once the repository's required checks pass.",
      ],
      { cwd: path, encoding: "utf8" },
    );
  }
  await execFileAsync("gh", ["pr", "merge", branch, "--auto", "--squash"], {
    cwd: path,
    encoding: "utf8",
  });
  return branch;
}
