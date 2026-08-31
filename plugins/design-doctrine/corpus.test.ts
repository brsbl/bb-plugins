import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  CORPUS_BRANCH,
  type CorpusCheckout,
  ensureCheckout,
  pluginDataDirectory,
  readState,
  refreshCheckout,
  resolveBaseBranch,
  resolveRepositoryRoot,
} from "./corpus";

const execFileAsync = promisify(execFile);
const RULES_PATH = join("plugins", "design-doctrine", "rules");

async function git(cwd: string, ...args: string[]): Promise<string> {
  const result = await execFileAsync("git", ["-C", cwd, ...args], {
    encoding: "utf8",
  });
  return result.stdout.trim();
}

async function writeRule(root: string, name: string): Promise<void> {
  const path = join(root, RULES_PATH, "interaction");
  await mkdir(path, { recursive: true });
  await writeFile(join(path, name), `# ${name}\n`, "utf8");
}

describe("doctrine corpus checkout", () => {
  let workspace: string;
  let repository: string;
  let checkout: CorpusCheckout;

  beforeEach(async () => {
    workspace = await mkdtemp(join(tmpdir(), "doctrine-corpus-"));
    const origin = join(workspace, "origin.git");
    repository = join(workspace, "repository");
    await execFileAsync("git", ["init", "--quiet", "--bare", "-b", "main", origin]);
    await execFileAsync("git", ["clone", "--quiet", origin, repository]);
    await git(repository, "config", "user.email", "doctrine@example.test");
    await git(repository, "config", "user.name", "Doctrine");
    await writeRule(repository, "ddr_001.md");
    await git(repository, "add", "-A");
    await git(repository, "commit", "--quiet", "-m", "seed");
    await git(repository, "push", "--quiet", "origin", "main");
    checkout = {
      repositoryRoot: repository,
      path: join(workspace, "data", "corpus"),
      baseBranch: "main",
      rulesPath: RULES_PATH,
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

  it("creates the checkout on its own branch at the published head", async () => {
    await ensureCheckout(checkout);

    expect(await git(checkout.path, "rev-parse", "--abbrev-ref", "HEAD")).toBe(
      CORPUS_BRANCH,
    );
    expect(await git(checkout.path, "rev-parse", "HEAD")).toBe(
      await git(repository, "rev-parse", "origin/main"),
    );
    expect(await readState(checkout)).toBe("published");
  });

  it("recreates a checkout that was deleted underneath it", async () => {
    await ensureCheckout(checkout);
    await rm(checkout.path, { recursive: true, force: true });

    await ensureCheckout(checkout);

    expect(await readState(checkout)).toBe("published");
  });

  it("distinguishes rules being written from rules awaiting publication", async () => {
    await ensureCheckout(checkout);

    await writeRule(checkout.path, "ddr_002.md");
    expect(await readState(checkout)).toBe("writing");

    await git(checkout.path, "config", "user.email", "doctrine@example.test");
    await git(checkout.path, "config", "user.name", "Doctrine");
    await git(checkout.path, "add", "-A");
    await git(checkout.path, "commit", "--quiet", "-m", "doctrine: add rule");
    expect(await readState(checkout)).toBe("unpublished");
  });

  it("keeps unpublished rules through a refresh", async () => {
    await ensureCheckout(checkout);
    await writeRule(checkout.path, "ddr_002.md");
    await git(checkout.path, "config", "user.email", "doctrine@example.test");
    await git(checkout.path, "config", "user.name", "Doctrine");
    await git(checkout.path, "add", "-A");
    await git(checkout.path, "commit", "--quiet", "-m", "doctrine: add rule");

    expect(await refreshCheckout(checkout)).toBe(false);
    expect(await readState(checkout)).toBe("unpublished");
  });

  it("fast-forwards to rules that have been published", async () => {
    await ensureCheckout(checkout);
    await writeRule(repository, "ddr_003.md");
    await git(repository, "add", "-A");
    await git(repository, "commit", "--quiet", "-m", "doctrine: publish rule");
    await git(repository, "push", "--quiet", "origin", "main");

    expect(await refreshCheckout(checkout)).toBe(true);
    expect(await git(checkout.path, "rev-parse", "HEAD")).toBe(
      await git(repository, "rev-parse", "origin/main"),
    );
  });

  it("treats a squashed publication as published rather than republishing it", async () => {
    await ensureCheckout(checkout);
    await writeRule(checkout.path, "ddr_002.md");
    await git(checkout.path, "config", "user.email", "doctrine@example.test");
    await git(checkout.path, "config", "user.name", "Doctrine");
    await git(checkout.path, "add", "-A");
    await git(checkout.path, "commit", "--quiet", "-m", "doctrine: add rule");

    // The same rules reach main as an unrelated squash commit.
    await writeRule(repository, "ddr_002.md");
    await git(repository, "add", "-A");
    await git(repository, "commit", "--quiet", "-m", "doctrine: squashed");
    await git(repository, "push", "--quiet", "origin", "main");
    await git(repository, "fetch", "--quiet", "origin", "main");

    expect(await readState(checkout)).toBe("published");
    expect(await refreshCheckout(checkout)).toBe(true);
  });
});
