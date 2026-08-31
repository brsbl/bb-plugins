import { execFile } from "node:child_process";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  type CorpusSource,
  materializeRules,
  openPublication,
  pluginDataDirectory,
  publishedRulesId,
  resolveBaseBranch,
  resolveRepositoryRoot,
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

  it("extracts the published rules as plain files with no git metadata", async () => {
    const id = await materializeRules(source, null);

    expect(id).toBe(await publishedRulesId(source));
    expect(
      await exists(join(source.readPath, "rules", "interaction", "ddr_001.md")),
    ).toBe(true);
    // Nothing commits here, so there is no branch to reset and nothing to lose.
    expect(await exists(join(source.readPath, ".git"))).toBe(false);
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
});
