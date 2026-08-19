import { execFile } from "node:child_process";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createConnection,
  getInstalledPluginRegistration,
  migrate,
  upsertInstalledPlugin,
  type DbConnection,
} from "@bb/db";
import { PLUGIN_SDK_VERSION } from "@bb/domain";
import type { Logger } from "@bb/logger";
import {
  createPluginService,
  type PluginService,
} from "../../../src/services/plugins/plugin-service.js";
import { testLogger } from "../../helpers/test-app.js";

type PersistedScaffold = {
  provenance: {
    repository: string;
    release: string;
    commit: string;
    sdkSourceCommit: string;
  };
  options: {
    slug: string;
    name: string;
    description: string;
  };
  files: Record<string, string>;
};

const logger = testLogger as unknown as Logger;
const run = promisify(execFile);
const pluginRepository = process.env.BB_PLUGIN_COMPAT_REPOSITORY;

async function git(cwd: string, args: string[]): Promise<string> {
  return (await run("git", args, { cwd })).stdout.trim();
}

async function commit(cwd: string, message: string): Promise<string> {
  await git(cwd, ["add", "-A"]);
  await git(cwd, ["commit", "-qm", message]);
  return git(cwd, ["rev-parse", "HEAD"]);
}

describe("persisted 0.4.6 scaffold upgrade", () => {
  let db: DbConnection;
  let service: PluginService;
  let workDir: string;

  beforeEach(async () => {
    if (!pluginRepository) {
      throw new Error("BB_PLUGIN_COMPAT_REPOSITORY is required");
    }
    db = createConnection(":memory:");
    migrate(db);
    workDir = await mkdtemp(join(tmpdir(), "bb-plugin-sdk-compat-"));
    service = createPluginService({
      db,
      hub: {
        getDaemonSessionIdForHost: () => null,
        notifyPluginSignal: () => 0,
        notifySystem: () => {},
      },
      logger,
      dataDir: join(workDir, "data"),
      appVersion: "0.0.34",
      loadTimeoutMs: 2_000,
      stabilizationWindowMs: 0,
      afterArtifactPromoted: async () => {},
    });
  });

  afterEach(async () => {
    await service?.stop();
    db?.$client.close();
    if (workDir) await rm(workDir, { recursive: true, force: true });
  });

  it("loads a persisted scaffold and applies its tracked branch update", async () => {
    expect(PLUGIN_SDK_VERSION).toBe("0.4.8");

    const fixturePath = resolve(
      pluginRepository!,
      "tooling/compatibility/persisted-scaffold-0.4.6.json",
    );
    const fixture = JSON.parse(
      await readFile(fixturePath, "utf8"),
    ) as PersistedScaffold;
    expect(fixture.provenance).toEqual({
      repository: "https://github.com/get-bb/bb",
      release: "desktop-v0.38.0",
      commit: "45145e51af36b4bd1346a9d2e73d7612d250ba4f",
      sdkSourceCommit: "45145e51af36b4bd1346a9d2e73d7612d250ba4f",
    });

    const sourceRepo = join(workDir, "source");
    await mkdir(sourceRepo, { recursive: true });
    await git(sourceRepo, ["init", "-q", "-b", "main"]);
    await git(sourceRepo, ["config", "user.email", "test@example.com"]);
    await git(sourceRepo, ["config", "user.name", "Test"]);
    for (const [name, contents] of Object.entries(fixture.files)) {
      await writeFile(join(sourceRepo, name), contents);
    }
    const previousCommit = await commit(sourceRepo, "persisted 0.4.6 scaffold");

    const legacyRoot = join(
      workDir,
      "data",
      "plugins",
      "git",
      "scaffold-upgrade",
    );
    await mkdir(dirname(legacyRoot), { recursive: true });
    await git(dirname(legacyRoot), [
      "clone",
      "--quiet",
      sourceRepo,
      legacyRoot,
    ]);
    upsertInstalledPlugin(db, {
      id: "scaffold-upgrade",
      source: `git:${sourceRepo}@main`,
      provenance: { kind: "direct" },
      sourceIntent: {
        kind: "git",
        url: sourceRepo,
        subdirectory: null,
        requestedRef: "main",
        refKind: "branch",
      },
      exactResolution: { kind: "git", commit: previousCommit },
      updateState: {
        lastCheckAt: null,
        availableCompatibleVersion: null,
        newestIncompatibleVersion: null,
        statusDetail: null,
      },
      activeArtifactId: null,
      rootDir: legacyRoot,
      version: "0.1.0",
      enabled: true,
    });
    await service.reload("scaffold-upgrade");
    expect(service.list()).toMatchObject([
      { id: "scaffold-upgrade", rootDir: legacyRoot, status: "running" },
    ]);

    const generatedRoot = join(workDir, "generated");
    const generatorUrl = pathToFileURL(
      resolve(pluginRepository!, "tooling/create-plugin.mjs"),
    ).href;
    const { scaffoldPlugin } = (await import(generatorUrl)) as {
      scaffoldPlugin(options: Record<string, unknown>): Promise<{
        directory: string;
      }>;
    };
    const generated = await scaffoldPlugin({
      ...fixture.options,
      output: generatedRoot,
      repositoryRoot: pluginRepository,
      skipInstall: true,
      skipVerify: true,
    });
    const candidateManifest = JSON.parse(
      await readFile(join(generated.directory, "package.json"), "utf8"),
    );
    const persistedManifest = JSON.parse(fixture.files["package.json"]!);
    expect(persistedManifest.engines).toEqual({
      bb: ">=0.38",
      bbPluginSdk: ">=0.4.6",
    });
    expect(persistedManifest.devDependencies["@get-bb/plugin-sdk"]).toBe(
      "0.4.6",
    );
    expect(candidateManifest.engines.bbPluginSdk).toBe("^0.4.8");
    expect(candidateManifest.devDependencies["@get-bb/plugin-sdk"]).toBe(
      "file:../../tooling/vendor/get-bb-plugin-sdk-0.4.8.tgz",
    );

    await cp(generated.directory, sourceRepo, { recursive: true, force: true });
    await writeFile(
      join(sourceRepo, "server.ts"),
      'export default function plugin(bb: any) { bb.log.info("updated on 0.4.8"); }\n',
    );
    const candidateCommit = await commit(sourceRepo, "tracked scaffold update");

    await expect(service.checkForUpdates("scaffold-upgrade")).resolves.toEqual([
      expect.objectContaining({
        id: "scaffold-upgrade",
        outcome: "update-available",
        candidate: expect.objectContaining({
          version: candidateCommit,
          display: expect.stringContaining(candidateCommit.slice(0, 12)),
        }),
      }),
    ]);
    await expect(
      service.applyUpdate("scaffold-upgrade"),
    ).resolves.toMatchObject({
      ok: true,
      result: { applied: true },
    });

    expect(
      getInstalledPluginRegistration(db, "scaffold-upgrade"),
    ).toMatchObject({
      id: "scaffold-upgrade",
      source: `git:${sourceRepo}@main`,
      version: "0.1.0",
      gitResolvedCommit: candidateCommit,
      activeArtifactId: expect.any(String),
    });
    expect(service.list()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "scaffold-upgrade", status: "running" }),
      ]),
    );
  });
});
