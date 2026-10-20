import { execFile } from "node:child_process";
import {
  access,
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  type CorpusSource,
  closePublication,
  directPublicationBase,
  githubRepositoryFromRemote,
  materializeRules,
  openPublication,
  pluginDataDirectory,
  publishedBranchId,
  publishedRulesId,
  remoteBranchId,
  resolveBaseBranch,
  resolveRepositoryRoot,
  withdrawRuleFile,
} from "./corpus";

const execFileAsync = promisify(execFile);
const PREFIX = join("plugins", "design-doctrine");

async function git(cwd: string, ...args: string[]): Promise<string> {
  const result = await execFileAsync("git", ["-C", cwd, ...args], {
    encoding: "utf8",
  });
  return result.stdout.trim();
}

async function commitRule(root: string, name: string): Promise<void> {
  const directory = join(root, PREFIX, "rules", "interaction");
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, name), `# ${name}\n`, "utf8");
  await git(root, "add", "-A");
  await git(root, "commit", "--quiet", "-m", `add ${name}`);
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

describe("doctrine corpus", () => {
  let workspace: string;
  let repository: string;
  let source: CorpusSource;

  beforeEach(async () => {
    workspace = await mkdtemp(join(tmpdir(), "doctrine-corpus-"));
    const origin = join(workspace, "origin.git");
    repository = join(workspace, "repository");
    const data = join(workspace, "data");
    await mkdir(data, { recursive: true });
    await execFileAsync("git", ["init", "--quiet", "--bare", "-b", "main", origin]);
    await execFileAsync("git", ["clone", "--quiet", origin, repository]);
    await git(repository, "config", "user.email", "doctrine@example.test");
    await git(repository, "config", "user.name", "Doctrine");
    await commitRule(repository, "ddr_001.md");
    await git(repository, "push", "--quiet", "origin", "main");
    source = {
      repositoryRoot: repository,
      baseBranch: "main",
      prefix: PREFIX,
      readPath: join(data, "rules-cache"),
      workPath: data,
    };
  });

  afterEach(async () => {
    await rm(workspace, { recursive: true, force: true });
  });

  it("derives the plugin data directory from its database file", () => {
    expect(pluginDataDirectory("/data/plugins/design-doctrine/data.db")).toBe(
      "/data/plugins/design-doctrine",
    );
  });

  it("reports no repository outside a git checkout", async () => {
    expect(await resolveRepositoryRoot(workspace)).toBeNull();
    expect(await resolveBaseBranch(workspace)).toBe("main");
  });

  it("recognizes standard GitHub origin URLs", () => {
    expect(githubRepositoryFromRemote("git@github.com:brsbl/bb-plugins.git")).toBe(
      "brsbl/bb-plugins",
    );
    expect(
      githubRepositoryFromRemote("https://github.com/brsbl/bb-plugins.git"),
    ).toBe("brsbl/bb-plugins");
    expect(
      githubRepositoryFromRemote("ssh://git@github.com/brsbl/bb-plugins.git"),
    ).toBe("brsbl/bb-plugins");
    expect(githubRepositoryFromRemote("git@example.com:brsbl/bb-plugins.git")).toBeNull();
  });

  it("probes the remote branch without updating the local tracking ref", async () => {
    const localBefore = await publishedBranchId(source);
    const publisher = join(workspace, "publisher");
    await execFileAsync("git", ["clone", "--quiet", join(workspace, "origin.git"), publisher]);
    await git(publisher, "config", "user.email", "publisher@example.test");
    await git(publisher, "config", "user.name", "Publisher");
    await commitRule(publisher, "ddr_002.md");
    await git(publisher, "push", "--quiet", "origin", "main");

    const remote = await remoteBranchId(source);

    expect(remote).not.toBe(localBefore);
    expect(await publishedBranchId(source)).toBe(localBefore);
  });

  it("extracts the published rules as plain files with no git metadata", async () => {
    const id = await materializeRules(source, null);

    expect(id).toBe(await publishedRulesId(source));
    expect(
      await exists(join(source.readPath, "rules", "interaction", "ddr_001.md")),
    ).toBe(true);
    // Nothing commits here, so there is no branch to reset and nothing to lose.
    expect(await exists(join(source.readPath, ".git"))).toBe(false);
  });

  it("swaps the read copy through a symlink so it is never absent", async () => {
    await materializeRules(source, null);
    expect((await lstat(source.readPath)).isSymbolicLink()).toBe(true);

    await commitRule(repository, "ddr_002.md");
    await git(repository, "push", "--quiet", "origin", "main");
    await materializeRules(source, await publishedRulesId(source).catch(() => null));

    // Still a symlink, and still resolves to a complete corpus.
    expect((await lstat(source.readPath)).isSymbolicLink()).toBe(true);
    expect(
      await exists(join(source.readPath, "rules", "interaction", "ddr_001.md")),
    ).toBe(true);
  });

  it("rebuilds the read copy only when the published rules change", async () => {
    const first = await materializeRules(source, null);

    expect(await materializeRules(source, first)).toBeNull();

    await commitRule(repository, "ddr_002.md");
    await git(repository, "push", "--quiet", "origin", "main");
    const second = await materializeRules(source, first);

    expect(second).not.toBe(first);
    expect(
      await exists(join(source.readPath, "rules", "interaction", "ddr_002.md")),
    ).toBe(true);
  });

  it("drops a rule that was removed upstream", async () => {
    await commitRule(repository, "ddr_002.md");
    await git(repository, "push", "--quiet", "origin", "main");
    const first = await materializeRules(source, null);
    await rm(join(repository, PREFIX, "rules", "interaction", "ddr_001.md"));
    await git(repository, "add", "-A");
    await git(repository, "commit", "--quiet", "-m", "remove rule");
    await git(repository, "push", "--quiet", "origin", "main");

    await materializeRules(source, first);

    expect(
      await exists(join(source.readPath, "rules", "interaction", "ddr_001.md")),
    ).toBe(false);
    expect(
      await exists(join(source.readPath, "rules", "interaction", "ddr_002.md")),
    ).toBe(true);
  });

  it("serves an empty corpus when nothing is published yet", async () => {
    await rm(join(repository, PREFIX, "rules", "interaction", "ddr_001.md"));
    await git(repository, "add", "-A");
    await git(repository, "commit", "--quiet", "-m", "remove every rule");
    await git(repository, "push", "--quiet", "origin", "main");

    expect(await publishedRulesId(source)).toBe("");
    await materializeRules(source, null);

    expect(await exists(join(source.readPath, "rules"))).toBe(true);
  });

  it("gives a batch a throwaway checkout of the published branch", async () => {
    const publication = await openPublication(source);

    expect(publication.root).toContain(PREFIX);
    expect(await git(publication.root, "rev-parse", "HEAD")).toBe(
      await git(repository, "rev-parse", "origin/main"),
    );

    await publication.finish(false);

    // The checkout is gone and left no worktree registration behind.
    expect(await exists(publication.root)).toBe(false);
    expect(await git(repository, "worktree", "list")).not.toContain("publish-");
  });

  it("removes the checkout even when nothing published", async () => {
    const publication = await openPublication(source);
    await writeFile(join(publication.root, "rules", "stray.md"), "x\n", "utf8");

    await publication.finish(false);

    expect(await exists(publication.root)).toBe(false);
  });

  it("keeps two concurrent batches in separate checkouts", async () => {
    const first = await openPublication(source);
    const second = await openPublication(source);

    expect(first.root).not.toBe(second.root);

    await first.finish(false);
    // Removing the first batch must not disturb the second.
    expect(await exists(second.root)).toBe(true);
    expect(await git(second.root, "rev-parse", "HEAD")).toBe(
      await git(repository, "rev-parse", "origin/main"),
    );

    await second.finish(false);
  });

  it("publishes a batch on top of the base branch as it is when the batch finishes", async () => {
    const publication = await openPublication(source);
    await commitRule(join(publication.root, "..", ".."), "ddr_002.md");
    const publisher = join(workspace, "publisher");
    await execFileAsync("git", ["clone", "--quiet", join(workspace, "origin.git"), publisher]);
    await git(publisher, "config", "user.email", "publisher@example.test");
    await git(publisher, "config", "user.name", "Publisher");
    await commitRule(publisher, "ddr_003.md");
    await git(publisher, "push", "--quiet", "origin", "main");
    const bin = join(workspace, "bin");
    await mkdir(bin);
    await writeFile(join(bin, "gh"), "#!/bin/sh\n", "utf8");
    await chmod(join(bin, "gh"), 0o755);
    const savedPath = process.env.PATH;
    process.env.PATH = `${bin}:${savedPath ?? ""}`;
    try {
      await publication.finish(true);
    } finally {
      process.env.PATH = savedPath;
    }

    const origin = join(workspace, "origin.git");
    const branch = (await git(origin, "branch", "--list", "doctrine/*")).replace(/^\*?\s*/, "");
    expect(await git(origin, "rev-parse", `${branch}^`)).toBe(await git(origin, "rev-parse", "main"));
    expect(await git(origin, "log", "-1", "--format=%s", branch)).toBe("add ddr_002.md");
  });

  it.each([false, true])("publishes direct rules with provenance and pending approval (stacked: %s)", async (stacked) => {
    const parents = stacked ? ["https://github.com/example/rules/pull/42"] : [];
    let publicationSource = source;
    if (stacked) {
      await git(repository, "checkout", "-b", "doctrine/parent");
      await commitRule(repository, "ddr_005.md");
      await git(repository, "push", "origin", "doctrine/parent");
      await git(repository, "checkout", "main");
      publicationSource = { ...source, baseBranch: "doctrine/parent" };
    }
    const publication = await openPublication(publicationSource, undefined, {
      originThreadId: "thr_origin", title: "Plain actions before submenus", parents, trustedBranch: "main",
    });
    if (stacked) {
      expect(await exists(join(publication.root, "rules/interaction/ddr_005.md"))).toBe(true);
      // A parent moving after validation cannot inject executable content into
      // the build or replace the catalog the reviewer actually inspected.
      await git(repository, "checkout", "doctrine/parent");
      await writeFile(join(repository, "package.json"), '{"scripts":{"build":"exit 1"}}');
      await git(repository, "add", "package.json");
      await git(repository, "commit", "-m", "parent moved after review");
      await git(repository, "push", "origin", "doctrine/parent");
      await git(repository, "checkout", "main");
    }
    await commitRule(join(publication.root, "..", ".."), "ddr_002.md");
    const bin = join(workspace, "bin");
    const log = join(workspace, "gh-log");
    await mkdir(bin);
    await writeFile(join(bin, "gh"), '#!/bin/sh\nprintf "%s\\n" "$@" >> "$DIRECT_GH_LOG"\nprintf "https://github.com/example/rules/pull/1\\n"\n');
    await chmod(join(bin, "gh"), 0o755);
    const savedPath = process.env.PATH;
    process.env.PATH = `${bin}:${savedPath ?? ""}`;
    process.env.DIRECT_GH_LOG = log;
    try {
      expect(await publication.finish(true)).toBe("https://github.com/example/rules/pull/1");
    } finally {
      process.env.PATH = savedPath;
      delete process.env.DIRECT_GH_LOG;
    }
    const calls = await readFile(log, "utf8");
    expect(calls).toContain("doctrine: Plain actions before submenus");
    expect(calls).toContain("BB-Thread-ID: thr_origin");
    expect(calls).not.toContain("--auto");
    expect(calls).not.toContain("--squash");
    if (stacked) {
      const branches = (await git(join(workspace, "origin.git"), "for-each-ref", "--format=%(refname:short)", "refs/heads/doctrine/")).split("\n");
      const published = branches.find((branch) => branch !== "doctrine/parent")!;
      expect(await git(join(workspace, "origin.git"), "ls-tree", published, "package.json")).toBe("");
      expect(calls).toContain("--base\ndoctrine/parent\n");
      expect(calls).toContain("stack\nlink\nhttps://github.com/example/rules/pull/42\nhttps://github.com/example/rules/pull/1");
      expect(await git(repository, "rev-parse", "origin/main")).not.toBe(await git(repository, "rev-parse", "origin/doctrine/parent"));
    }
  });

  it.each(["package.json", "rule-symlink"])("rejects untrusted pending content before opening a build checkout: %s", async (content) => {
    await git(repository, "checkout", "-b", "doctrine/unsafe");
    if (content === "package.json") {
      await writeFile(join(repository, "package.json"), '{"scripts":{"build":"exit 1"}}');
    } else {
      await symlink("../../../package.json", join(repository, PREFIX, "rules/interaction/unsafe.md"));
    }
    await git(repository, "add", "-A");
    await git(repository, "commit", "-m", "unapproved build changes");
    await git(repository, "push", "origin", "doctrine/unsafe");
    await expect(openPublication({ ...source, baseBranch: "doctrine/unsafe" }, undefined, {
      originThreadId: "thr_origin", title: "Rule", parents: ["parent"], trustedBranch: "main",
    })).rejects.toThrow("executable or non-rule content");
    expect(await git(repository, "worktree", "list")).not.toContain("publish-");
  });

  it("selects the whole pending chain as a direct rule's reviewed base", () => {
    const parent = { url: "parent", branch: "doctrine/parent", baseBranch: "main", ageHours: 1, mergeStateStatus: "CLEAN" };
    const child = { ...parent, url: "child", branch: "doctrine/child", baseBranch: parent.branch };
    expect(directPublicationBase(source, [child, parent])).toEqual({
      source: { ...source, baseBranch: child.branch }, parents: [parent.url, child.url],
    });
    expect(() => directPublicationBase(source, [parent, { ...child, baseBranch: "main" }])).toThrow("do not form one chain");
    expect(() => directPublicationBase(source, [{ ...child, baseBranch: "missing" }])).toThrow("do not form one chain");
  });

  describe("withdrawing a rule from its open pull request", () => {
    const FAKE_GH = `#!/bin/sh
echo "$*" >> "$FAKE_GH_LOG"
case "$1 $2" in
  "pr list") printf '%s' "$FAKE_GH_LIST" ;;
  "pr view") printf '{"state":"%s"}' "$FAKE_GH_STATE" ;;
esac
`;
    const savedPath = process.env.PATH;
    let origin: string;
    let log: string;

    async function openPullRequest(branch: string, ...rules: string[]): Promise<void> {
      await git(repository, "checkout", "--quiet", "-b", branch, "origin/main");
      for (const rule of rules) await commitRule(repository, rule);
      await git(repository, "push", "--quiet", "origin", branch);
      await git(repository, "checkout", "--quiet", "main");
    }

    async function branchRules(branch: string): Promise<string[]> {
      return (await git(origin, "ls-tree", "--name-only", branch, `${PREFIX}/rules/interaction/`))
        .split("\n")
        .map((path) => path.slice(path.lastIndexOf("/") + 1));
    }

    beforeEach(async () => {
      origin = join(workspace, "origin.git");
      log = join(workspace, "gh.log");
      const bin = join(workspace, "bin");
      await mkdir(bin);
      await writeFile(join(bin, "gh"), FAKE_GH, "utf8");
      await chmod(join(bin, "gh"), 0o755);
      await openPullRequest("doctrine/first", "ddr_002.md", "ddr_003.md");
      await openPullRequest("doctrine/other", "ddr_004.md");
      const createdAt = new Date().toISOString();
      process.env.PATH = `${bin}:${process.env.PATH ?? ""}`;
      process.env.FAKE_GH_LOG = log;
      process.env.FAKE_GH_STATE = "OPEN";
      process.env.FAKE_GH_LIST = JSON.stringify(
        ["other", "first"].map((name) => ({
          url: `https://github.com/example/doctrine/pull/${name}`,
          headRefName: `doctrine/${name}`,
          mergeStateStatus: "BLOCKED",
          createdAt,
          isCrossRepository: false,
        })),
      );
    });

    afterEach(() => {
      process.env.PATH = savedPath;
      delete process.env.FAKE_GH_LOG;
      delete process.env.FAKE_GH_STATE;
      delete process.env.FAKE_GH_LIST;
    });

    it("removes the rule from only the branch that adds it, then reports when nothing is left", async () => {
      const main = await git(origin, "rev-parse", "main");
      const other = await git(origin, "rev-parse", "doctrine/other");

      expect(
        await withdrawRuleFile(source, "rules/interaction/ddr_002.md", "ddr_002.md", "doctrine: cancel ddr_002"),
      ).toEqual({
        kind: "withdrawn",
        url: "https://github.com/example/doctrine/pull/first",
        remainingRules: 1,
      });
      expect(await branchRules("doctrine/first")).toEqual(["ddr_001.md", "ddr_003.md"]);
      expect(await git(origin, "log", "-1", "--format=%s", "doctrine/first")).toBe(
        "doctrine: cancel ddr_002",
      );

      expect(
        await withdrawRuleFile(source, "rules/interaction/ddr_003.md", "ddr_003.md", "doctrine: cancel ddr_003"),
      ).toMatchObject({ kind: "withdrawn", remainingRules: 0 });
      expect(await branchRules("doctrine/first")).toEqual(["ddr_001.md"]);
      await closePublication(
        source,
        "https://github.com/example/doctrine/pull/first",
        "Nothing left to publish.",
      );
      expect(await readFile(log, "utf8")).toContain(
        "pr close https://github.com/example/doctrine/pull/first --delete-branch --comment Nothing left to publish.",
      );

      expect(await git(origin, "rev-parse", "main")).toBe(main);
      expect(await git(origin, "rev-parse", "doctrine/other")).toBe(other);
      expect(await git(repository, "worktree", "list")).not.toContain("cancel-");
    });

    it.each(["ancestor", "leaf"])("withdraws the owning layer and inherited copies (%s)", async (target) => {
      await git(repository, "checkout", "-b", "doctrine/child", "origin/doctrine/other");
      await commitRule(repository, "ddr_005.md");
      await git(repository, "push", "origin", "doctrine/child");
      await git(repository, "checkout", "main");
      const rows = JSON.parse(process.env.FAKE_GH_LIST!);
      rows.unshift({ ...rows[0], url: "https://github.com/example/doctrine/pull/child", headRefName: "doctrine/child", baseRefName: "doctrine/other" });
      process.env.FAKE_GH_LIST = JSON.stringify(rows);
      const ancestor = target === "ancestor";
      const name = ancestor ? "ddr_004.md" : "ddr_005.md";
      const result = await withdrawRuleFile(source, `rules/interaction/${name}`, name, "cancel rule");
      expect(result).toEqual({ kind: "withdrawn", url: `https://github.com/example/doctrine/pull/${ancestor ? "other" : "child"}`, remainingRules: 0 });
      expect(await branchRules("doctrine/other")).toEqual(ancestor ? ["ddr_001.md"] : ["ddr_001.md", "ddr_004.md"]);
      expect(await branchRules("doctrine/child")).toEqual(ancestor ? ["ddr_001.md", "ddr_005.md"] : ["ddr_001.md", "ddr_004.md"]);
      if (result.kind !== "withdrawn") throw new Error("Expected withdrawal");
      await closePublication(source, result.url, "Nothing left");
      const calls = await readFile(log, "utf8");
      if (ancestor) {
        expect(calls).toContain("pr edit https://github.com/example/doctrine/pull/child --base main");
        expect(calls.indexOf("pr edit")).toBeLessThan(calls.indexOf("pr close"));
      } else {
        expect(calls).not.toContain("pr edit");
      }
    });

    it("changes nothing for a published, merged, or unpublished rule", async () => {
      const first = await git(origin, "rev-parse", "doctrine/first");
      const other = await git(origin, "rev-parse", "doctrine/other");

      expect(
        await withdrawRuleFile(source, "rules/interaction/ddr_001.md", "ddr_001.md", "doctrine: cancel ddr_001"),
      ).toEqual({ kind: "published" });
      expect(
        await withdrawRuleFile(source, "rules/interaction/ddr_009.md", "ddr_009.md", "doctrine: cancel ddr_009"),
      ).toEqual({ kind: "unpublished" });
      expect(
        await withdrawRuleFile(source, "rules/interaction/ddr_004.md", "A reused ID", "doctrine: cancel ddr_004"),
      ).toEqual({ kind: "unpublished" });
      expect(
        await withdrawRuleFile(source, "rules/interaction/ddr_001.md", "A reused ID", "doctrine: cancel ddr_001"),
      ).toEqual({ kind: "unpublished" });
      process.env.FAKE_GH_STATE = "MERGED";
      expect(
        await withdrawRuleFile(source, "rules/interaction/ddr_004.md", "ddr_004.md", "doctrine: cancel ddr_004"),
      ).toEqual({ kind: "published" });

      expect(await git(origin, "rev-parse", "doctrine/first")).toBe(first);
      expect(await git(origin, "rev-parse", "doctrine/other")).toBe(other);
      expect(await readFile(log, "utf8")).not.toContain("pr close");
    });
  });
});
