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

/** Bounds the dependency install and bundle rebuild a publication runs. */
const BUILD_TIMEOUT_MS = 10 * 60_000;

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

/** GitHub owner/repository identity encoded by a standard origin URL. */
export function githubRepositoryFromRemote(remote: string): string | null {
  const match = remote
    .trim()
    .match(
      /^(?:git@github\.com:|ssh:\/\/git@github\.com\/|https?:\/\/github\.com\/)([^\s]+)$/i,
    );
  if (!match) return null;
  const repository = match[1].replace(/\/$/, "").replace(/\.git$/i, "");
  return /^[^/]+\/[^/]+$/.test(repository) ? repository : null;
}

/** GitHub repository published by origin, or null for a non-GitHub remote. */
export async function resolveGitHubRepository(
  repositoryRoot: string,
): Promise<string | null> {
  try {
    return githubRepositoryFromRemote(
      await git(repositoryRoot, ["remote", "get-url", "origin"]),
    );
  } catch {
    return null;
  }
}

/** Commit currently recorded in the local origin tracking ref. */
export async function publishedBranchId(
  source: CorpusSource,
  signal?: AbortSignal,
): Promise<string> {
  return git(
    source.repositoryRoot,
    ["rev-parse", `refs/remotes/origin/${source.baseBranch}`],
    signal,
  );
}

/**
 * Commit currently published by origin without downloading any objects or
 * changing the local tracking ref.
 */
export async function remoteBranchId(
  source: CorpusSource,
  signal?: AbortSignal,
): Promise<string> {
  const ref = `refs/heads/${source.baseBranch}`;
  const output = await git(
    source.repositoryRoot,
    ["ls-remote", "--exit-code", "--refs", "origin", ref],
    signal,
  );
  const fields = output.split(/\s+/);
  if (
    fields.length !== 2 ||
    fields[1] !== ref ||
    !/^[0-9a-f]{40,64}$/i.test(fields[0])
  ) {
    throw new Error(`origin returned an invalid ${ref} identity`);
  }
  return fields[0];
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
  // A batch can take minutes to write, and the base branch keeps moving; replay
  // it onto the branch as it is now so the pull request never starts behind.
  const base = await fetchedCommit(source, source.baseBranch, signal);
  try {
    await git(directory, ["rebase", "--quiet", base], signal);
  } catch (error) {
    await git(directory, ["rebase", "--abort"], signal).catch(() => undefined);
    throw error;
  }
  await rebuildCommittedBundles(source, directory, signal);
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

/**
 * Rebuilds the plugin's committed bundles and folds any change into the head
 * commit. The app stylesheet is generated from every file in the plugin, rule
 * Markdown included, so adding or removing a rule can change it, and CI
 * rejects a committed bundle that no longer matches a fresh build. Installing
 * from the checkout's own lockfile makes the output match CI rather than
 * whatever the publishing repository last installed.
 */
async function rebuildCommittedBundles(
  source: CorpusSource,
  directory: string,
  signal?: AbortSignal,
): Promise<void> {
  const dist = join(source.prefix, "dist");
  if (!(await git(directory, ["ls-files", "--", dist], signal))) return;
  const options = {
    encoding: "utf8",
    timeout: BUILD_TIMEOUT_MS,
    maxBuffer: 16 * 1024 * 1024,
    signal,
  } as const;
  await execFileAsync(
    "npm",
    ["ci", "--ignore-scripts", "--prefer-offline", "--no-audit", "--no-fund", "--loglevel=error"],
    { ...options, cwd: directory },
  );
  await execFileAsync("npm", ["run", "build", "--silent"], {
    ...options,
    cwd: join(directory, source.prefix),
  });
  await git(directory, ["add", "--update", "--", dist], signal);
  if (await git(directory, ["diff", "--cached", "--name-only"], signal)) {
    await git(directory, ["commit", "--quiet", "--amend", "--no-edit"], signal);
  }
}

export interface OpenPublication {
  url: string;
  branch: string;
  mergeStateStatus: string;
  ageHours: number;
}

/**
 * Lists the doctrine pull requests this plugin opened that are still open. The
 * branch prefix alone is not proof: anyone can open a pull request from a fork
 * branch named `doctrine/...`, so only same-repository pull requests count,
 * which need push access to open. This lists pull requests directly rather than
 * through GitHub search, whose index can miss one opened seconds earlier and
 * let a second publication reuse its rule IDs.
 */
export async function readOpenPublications(
  source: CorpusSource,
  signal?: AbortSignal,
): Promise<OpenPublication[]> {
  const result = await execFileAsync(
    "gh",
    [
      "pr",
      "list",
      "--state",
      "open",
      "--limit",
      "200",
      "--json",
      "url,headRefName,mergeStateStatus,createdAt,isCrossRepository",
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
    isCrossRepository: boolean;
  }>;
  return rows
    .filter((row) => !row.isCrossRepository && row.headRefName.startsWith("doctrine/"))
    .map((row) => ({
      url: row.url,
      branch: row.headRefName,
      mergeStateStatus: row.mergeStateStatus,
      ageHours: (Date.now() - Date.parse(row.createdAt)) / (60 * 60 * 1_000),
    }));
}

/**
 * Merges the base branch into an open doctrine pull request. Strict branch
 * protection blocks auto-merge on a branch that has fallen behind, and nothing
 * else ever updates it, so the rules would wait forever.
 */
export async function updatePublicationBranch(
  source: CorpusSource,
  url: string,
  signal?: AbortSignal,
): Promise<void> {
  await execFileAsync("gh", ["pr", "update-branch", url], {
    cwd: source.repositoryRoot,
    encoding: "utf8",
    timeout: COMMAND_TIMEOUT_MS,
    signal,
  });
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
  return (await readOpenPublications(source, signal))
    .filter((row) => row.ageHours >= stallAfterHours)
    .map((row) => ({ ...row, ageHours: Math.round(row.ageHours) }));
}

const PUBLICATION_BRANCH_PATTERN = /^doctrine\/[A-Za-z0-9._-]+$/;

export type RuleWithdrawal =
  | { kind: "published" }
  | { kind: "unpublished" }
  | { kind: "withdrawn"; url: string; remainingRules: number };

async function fetchedCommit(
  source: CorpusSource,
  branch: string,
  signal?: AbortSignal,
): Promise<string> {
  const ref = `refs/remotes/origin/${branch}`;
  await git(
    source.repositoryRoot,
    ["fetch", "--quiet", "origin", `+refs/heads/${branch}:${ref}`],
    signal,
  );
  return git(source.repositoryRoot, ["rev-parse", "--verify", `${ref}^{commit}`], signal);
}

/** Rule files a commit adds relative to where it forked from `base`. */
async function addedRuleFiles(
  source: CorpusSource,
  base: string,
  head: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const output = await git(
    source.repositoryRoot,
    [
      "diff",
      "--name-only",
      "--no-renames",
      "--diff-filter=A",
      `${base}...${head}`,
      "--",
      `${source.prefix}/rules`,
    ],
    signal,
  );
  return output.split("\n").filter(Boolean);
}

async function pullRequestState(
  source: CorpusSource,
  url: string,
  signal?: AbortSignal,
): Promise<string> {
  const result = await execFileAsync("gh", ["pr", "view", url, "--json", "state"], {
    cwd: source.repositoryRoot,
    encoding: "utf8",
    timeout: COMMAND_TIMEOUT_MS,
    signal,
  });
  return (JSON.parse(result.stdout) as { state: string }).state;
}

async function ruleFileTitled(
  source: CorpusSource,
  commit: string,
  path: string,
  title: string,
  signal?: AbortSignal,
): Promise<boolean> {
  const content = await git(source.repositoryRoot, ["show", `${commit}:${path}`], signal).catch(
    () => "",
  );
  return content.split("\n").some((line) => line.trim() === `# ${title}`);
}

/**
 * Removes one unmerged rule from the open doctrine pull request that adds it,
 * committing from a throwaway checkout and pushing only to that pull request's
 * branch. The push is never forced, so a branch that moved since it was read
 * rejects it rather than losing someone else's commit. A rule already on the
 * base branch, or in a pull request that merged meanwhile, is reported as
 * published and nothing changes.
 */
export async function withdrawRuleFile(
  source: CorpusSource,
  rulePath: string,
  title: string,
  message: string,
  signal?: AbortSignal,
): Promise<RuleWithdrawal> {
  const { repositoryRoot, baseBranch, prefix, workPath } = source;
  const path = join(prefix, rulePath);
  await git(repositoryRoot, ["fetch", "--quiet", "origin", baseBranch], signal);
  const base = await publishedBranchId(source, signal);
  // Rule IDs can be reused after a publication fails, so a path alone does not
  // identify this proposal's rule; its title must match too.
  if (await ruleFileTitled(source, base, path, title, signal)) return { kind: "published" };

  for (const publication of await readOpenPublications(source, signal)) {
    if (!PUBLICATION_BRANCH_PATTERN.test(publication.branch)) continue;
    const head = await fetchedCommit(source, publication.branch, signal);
    if (!(await addedRuleFiles(source, base, head, signal)).includes(path)) continue;
    if (!(await ruleFileTitled(source, head, path, title, signal))) continue;
    const state = await pullRequestState(source, publication.url, signal);
    if (state === "MERGED") return { kind: "published" };
    if (state !== "OPEN") return { kind: "unpublished" };

    const directory = await mkdtemp(join(workPath, "cancel-"));
    try {
      await git(
        repositoryRoot,
        ["worktree", "add", "--detach", "--quiet", directory, head],
        signal,
      );
      await git(directory, ["rm", "--quiet", "--", path], signal);
      await git(directory, ["commit", "--quiet", "-m", message], signal);
      await rebuildCommittedBundles(source, directory, signal);
      await git(
        directory,
        ["push", "--quiet", "origin", `HEAD:refs/heads/${publication.branch}`],
        signal,
      );
      const withdrawn = await git(directory, ["rev-parse", "HEAD"], signal);
      return {
        kind: "withdrawn",
        url: publication.url,
        remainingRules: (await addedRuleFiles(source, base, withdrawn, signal)).length,
      };
    } finally {
      await git(
        repositoryRoot,
        ["worktree", "remove", "--force", directory],
        signal,
      ).catch(() => undefined);
      await rm(directory, { recursive: true, force: true });
    }
  }
  return { kind: "unpublished" };
}

/** Closes a doctrine pull request that no longer adds any rule, and deletes its branch. */
export async function closePublication(
  source: CorpusSource,
  url: string,
  comment: string,
  signal?: AbortSignal,
): Promise<void> {
  await execFileAsync(
    "gh",
    ["pr", "close", url, "--delete-branch", "--comment", comment],
    {
      cwd: source.repositoryRoot,
      encoding: "utf8",
      timeout: COMMAND_TIMEOUT_MS,
      signal,
    },
  );
}
