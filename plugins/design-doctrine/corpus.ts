import { execFile } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readlink,
  rename,
  rm,
  symlink,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Bounds every git and gh call so a hung remote cannot wedge the caller. */
const COMMAND_TIMEOUT_MS = 60_000;

export interface CorpusSource {
  /** Git repository that publishes the rule corpus. */
  repositoryRoot: string;
  /** Branch rules are published on. */
  baseBranch: string;
  /** The plugin's directory within that repository, e.g. plugins/design-doctrine. */
  prefix: string;
  /** Directory the published rules are extracted into for reading. */
  readPath: string;
  /** Directory publication worktrees are created under. */
  workPath: string;
}

async function git(
  cwd: string,
  args: string[],
  signal?: AbortSignal,
): Promise<string> {
  const result = await execFileAsync("git", ["-C", cwd, ...args], {
    encoding: "utf8",
    timeout: COMMAND_TIMEOUT_MS,
    signal,
  });
  return result.stdout.trim();
}

/**
 * The plugin's own data directory, derived from the SQLite file bb opens for
 * it. Everything this module materializes lives there, so it belongs to bb
 * rather than to a source tree somebody might delete.
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
    return await git(path, ["rev-parse", "--show-toplevel"]);
  } catch {
    return null;
  }
}

/** The branch a repository publishes from, falling back to `main`. */
export async function resolveBaseBranch(
  repositoryRoot: string,
): Promise<string> {
  try {
    const head = await git(repositoryRoot, [
      "symbolic-ref",
      "--short",
      "refs/remotes/origin/HEAD",
    ]);
    const branch = head.replace(/^origin\//, "");
    return branch.length > 0 ? branch : "main";
  } catch {
    return "main";
  }
}

/**
 * Identity of the published rules: the git tree hash of the rules directory on
 * the base branch. Comparing it is exact and costs one `rev-parse`, so the read
 * copy is only rewritten when the rules genuinely changed.
 */
export async function publishedRulesId(
  source: CorpusSource,
  signal?: AbortSignal,
): Promise<string> {
  // `ls-tree` prints nothing when the directory is absent and fails only on a
  // genuine error, so "no rules published yet" stays distinguishable from "git
  // is broken" — collapsing the two would publish or serve the wrong thing.
  return git(
    source.repositoryRoot,
    [
      "ls-tree",
      "--object-only",
      `origin/${source.baseBranch}`,
      "--",
      `${source.prefix}/rules`,
    ],
    signal,
  );
}

/**
 * Extracts the published rules into the read copy, replacing it atomically so
 * a reader never observes a half-written corpus. Returns the id it wrote, or
 * null when the copy was already current.
 *
 * The read copy is plain files with no git metadata: nothing commits here, so
 * there is no branch to reset and nothing to lose by rebuilding it.
 */
export async function materializeRules(
  source: CorpusSource,
  currentId: string | null,
  signal?: AbortSignal,
): Promise<string | null> {
  const { repositoryRoot, baseBranch, prefix, readPath } = source;
  await git(repositoryRoot, ["fetch", "--quiet", "origin", baseBranch], signal);
  const publishedId = await publishedRulesId(source, signal);
  if (publishedId === currentId) return null;

  // Build the new copy beside the old one under a content-addressed name, then
  // move a symlink onto it. Renaming a symlink is one atomic step, so a search
  // running at that instant sees either the whole old corpus or the whole new
  // one — swapping the directories themselves would leave a window with no
  // rules directory at all.
  const target = `${readPath}.${publishedId.length > 0 ? publishedId : "empty"}`;
  await rm(target, { recursive: true, force: true });
  await mkdir(join(target, "rules"), { recursive: true });
  if (publishedId.length > 0) {
    await execFileAsync(
      "sh",
      [
        "-c",
        'set -e; git -C "$1" archive --format=tar "$2" | tar -x -C "$3"',
        "sh",
        repositoryRoot,
        publishedId,
        join(target, "rules"),
      ],
      { encoding: "utf8", timeout: COMMAND_TIMEOUT_MS, signal },
    );
  }

  const previous = await readlink(readPath).catch(() => null);
  const pending = `${readPath}.pending`;
  await rm(pending, { recursive: true, force: true });
  await symlink(target, pending);
  if (previous === null) {
    // Upgrading from a real directory left by an earlier version: it has to go
    // before a symlink can take its place.
    await rm(readPath, { recursive: true, force: true });
  }
  await rename(pending, readPath);
  if (previous && previous !== target) {
    await rm(previous, { recursive: true, force: true });
  }
  return publishedId;
}

export interface Publication {
  /** The plugin directory to read, write, and commit rules in. */
  root: string;
  /**
   * Publishes the batch when `committed`, then always removes the worktree.
   * Returns the pull request URL, or null when nothing was published.
   */
  finish(committed: boolean): Promise<string | null>;
}

/**
 * Opens a throwaway checkout of the published branch for one batch of rules.
 *
 * Nothing outside this worktree is touched and nothing survives the batch, so
 * a failure cannot strand rules, reset a branch, or collide with a concurrent
 * batch. The caller must always call `finish`.
 */
export async function openPublication(
  source: CorpusSource,
  signal?: AbortSignal,
): Promise<Publication> {
  const { repositoryRoot, baseBranch, prefix, workPath } = source;
  await git(repositoryRoot, ["fetch", "--quiet", "origin", baseBranch], signal);
  const directory = await mkdtemp(join(workPath, "publish-"));
  await git(
    repositoryRoot,
    ["worktree", "add", "--detach", "--quiet", directory, `origin/${baseBranch}`],
    signal,
  );

  return {
    root: join(directory, prefix),
    async finish(committed) {
      try {
        if (!committed) return null;
        return await publish(source, directory, signal);
      } finally {
        await git(
          repositoryRoot,
          ["worktree", "remove", "--force", directory],
          signal,
        ).catch(() => undefined);
        await rm(directory, { recursive: true, force: true });
      }
    },
  };
}

async function publish(
  source: CorpusSource,
  directory: string,
  signal?: AbortSignal,
): Promise<string | null> {
  const head = await git(directory, ["rev-parse", "--short", "HEAD"], signal);
  const branch = `doctrine/${head}`;
  await git(
    directory,
    ["push", "--quiet", "origin", `HEAD:refs/heads/${branch}`],
    signal,
  );
  try {
    const created = await execFileAsync(
      "gh",
      [
        "pr",
        "create",
        "--head",
        branch,
        "--base",
        source.baseBranch,
        "--title",
        "doctrine: publish harvested rules",
        "--body",
        "Rules harvested from bb thread feedback by the Design Doctrine plugin.\n\nMerges itself once the repository's required checks pass.",
      ],
      { cwd: directory, encoding: "utf8", timeout: COMMAND_TIMEOUT_MS, signal },
    );
    await execFileAsync("gh", ["pr", "merge", branch, "--auto", "--squash"], {
      cwd: directory,
      encoding: "utf8",
      timeout: COMMAND_TIMEOUT_MS,
      signal,
    });
    return created.stdout.trim().split("\n").filter(Boolean).pop() ?? branch;
  } catch (error) {
    // Leave no branch behind that nothing is going to merge; the batch stays
    // unwritten in the plugin's database and a later drain retries it whole.
    await git(
      directory,
      ["push", "--quiet", "--delete", "origin", branch],
      signal,
    ).catch(() => undefined);
    throw error;
  }
}

export interface OpenPublication {
  url: string;
  branch: string;
  mergeStateStatus: string;
  ageHours: number;
}

/**
 * Reports doctrine pull requests that are open but not merging. Auto-merge
 * waits indefinitely, so without this a failing check or an unresolved comment
 * stops the corpus learning without ever saying so.
 */
export async function readStalledPublications(
  source: CorpusSource,
  stallAfterHours = 6,
  signal?: AbortSignal,
): Promise<OpenPublication[]> {
  const result = await execFileAsync(
    "gh",
    [
      "pr",
      "list",
      "--state",
      "open",
      "--search",
      "head:doctrine/",
      "--json",
      "url,headRefName,mergeStateStatus,createdAt",
    ],
    {
      cwd: source.repositoryRoot,
      encoding: "utf8",
      timeout: COMMAND_TIMEOUT_MS,
      signal,
    },
  );
  const rows = JSON.parse(result.stdout) as Array<{
    url: string;
    headRefName: string;
    mergeStateStatus: string;
    createdAt: string;
  }>;
  return rows
    .map((row) => ({
      url: row.url,
      branch: row.headRefName,
      mergeStateStatus: row.mergeStateStatus,
      ageHours: (Date.now() - Date.parse(row.createdAt)) / (60 * 60 * 1_000),
    }))
    .filter((row) => row.ageHours >= stallAfterHours)
    .map((row) => ({ ...row, ageHours: Math.round(row.ageHours) }));
}
