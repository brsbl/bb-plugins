import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
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
import { startTestServer, testLogger } from "../../helpers/test-app.js";

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
      appVersion: "0.39.0",
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
        selector: { kind: "ref", ref: "main", refKind: "branch" },
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

    persistedManifest.engines.bbPluginSdk = "^0.4.8";
    persistedManifest.devDependencies["@get-bb/plugin-sdk"] = "0.4.8";
    await writeFile(
      join(sourceRepo, "package.json"),
      `${JSON.stringify(persistedManifest, null, 2)}\n`,
    );
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
  }, 30_000);
});

it.each(["fresh install", "upgrade from 0.1.3"])(
  "loads a bundled Thread Organizer tag without registry access: %s", async (scenario) => {
  const repository = pluginRepository;
  if (!repository) throw new Error("BB_PLUGIN_COMPAT_REPOSITORY is required");
  const moduleUrl = pathToFileURL(resolve(repository, "tooling/publish-install-refs.mjs")).href;
  const { prepareVersionedRelease, assertVersionTagUnchanged } = await import(moduleUrl);
  const release = await prepareVersionedRelease("thread-organizer");
  expect((await prepareVersionedRelease("thread-organizer")).commit).toBe(release.commit);
  expect(() => assertVersionTagUnchanged(release, release.commit)).not.toThrow();
  expect(() => assertVersionTagUnchanged(release, release.sourceRevision))
    .toThrow(/already exists with different contents/);

  const fixture = await mkdtemp(join(tmpdir(), "organizer-version-install-"));
  const remote = join(fixture, "release.git");
  await git(repository, ["init", "--bare", remote]);
  await git(remote, ["fetch", "--no-tags", repository, release.commit]);
  await git(remote, ["tag", release.tag, release.commit]);
  const previous = {
    npm_config_cache: process.env.npm_config_cache,
    npm_config_registry: process.env.npm_config_registry,
    npm_config_fetch_retries: process.env.npm_config_fetch_retries,
  };
  process.env.npm_config_cache = join(fixture, "npm-cache");
  process.env.npm_config_registry = "http://127.0.0.1:9";
  process.env.npm_config_fetch_retries = "0";
  let server: Awaited<ReturnType<typeof startTestServer>> | undefined;
  try {
    server = await startTestServer({ appVersion: "0.39.0" });
    server.pluginService.bindSdk({ baseUrl: server.baseUrl });
    const source = `git:${remote}@semver:thread-organizer/:^0.1.2`;
    const rpc = async (method: string, input: unknown = {}) => {
      const response = await fetch(
        `${server!.baseUrl}/api/v1/plugins/thread-organizer/rpc/${method}`,
        { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) },
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
      return body.result;
    };
    let savedConfig;
    if (scenario === "upgrade from 0.1.3") {
      // Recreate a working persisted installation from the actual shipped
      // artifact, rather than reinstalling its now-broken dependency range.
      const previousRevision = "97a6610a914a637f1e7f082e24ebc5862ca05ec7";
      await git(remote, ["fetch", "--no-tags", "https://github.com/brsbl/bb-plugins.git", previousRevision]);
      await git(remote, ["tag", "thread-organizer/v0.1.3", previousRevision]);
      const legacyCheckout = join(fixture, "installed-0.1.3");
      await git(fixture, ["clone", "--quiet", "--no-checkout", remote, legacyCheckout]);
      await git(legacyCheckout, ["checkout", previousRevision, "--", "plugins/thread-organizer"]);
      upsertInstalledPlugin(server.db, {
        id: "thread-organizer",
        source,
        provenance: { kind: "direct" },
        sourceIntent: {
          kind: "git", url: remote, subdirectory: "plugins/thread-organizer",
          selector: { kind: "range", range: "^0.1.2", tagPrefix: "thread-organizer/", resolvedTag: "thread-organizer/v0.1.3" },
        },
        exactResolution: { kind: "git", commit: previousRevision },
        updateState: {
          lastCheckAt: null, availableCompatibleVersion: null,
          newestIncompatibleVersion: null, statusDetail: null,
        },
        activeArtifactId: null,
        rootDir: join(legacyCheckout, "plugins/thread-organizer"),
        version: "0.1.3", enabled: true,
      });
      await server.pluginService.reload("thread-organizer");
      expect(server.pluginService.list()).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: "thread-organizer", version: "0.1.3", status: "running" }),
      ]));
      const config = await rpc("getConfig");
      savedConfig = await rpc("saveConfig", {
        version: config.version, baseRevision: config.revision,
        stages: config.stages.map(({ sectionId, ...stage }: Record<string, unknown>) => ({
          ...stage, rule: "Preserve this custom workflow rule across the upgrade.",
        })),
      });
      await expect(server.pluginService.checkForUpdates("thread-organizer")).resolves.toEqual([
        expect.objectContaining({ id: "thread-organizer", outcome: "update-available" }),
      ]);
      await expect(server.pluginService.applyUpdate("thread-organizer")).resolves.toMatchObject({
        ok: true, result: { applied: true },
      });
    } else {
      await server.pluginService.install(source, { kind: "subdirectory", path: "plugins/thread-organizer" });
    }
    const installed = server.pluginService.list().find((entry) => entry.id === "thread-organizer")!;
    expect(installed.status, installed.statusDetail ?? undefined).toBe("running");
    expect(installed).toMatchObject({
      id: "thread-organizer", version: release.plugin.manifest.version,
    });
    const manifest = JSON.parse(await readFile(join(installed.rootDir, "package.json"), "utf8"));
    expect(manifest.dependencies).toBeUndefined();
    expect(manifest.devDependencies).toBeUndefined();
    await expect(readFile(join(installed.rootDir, "node_modules/@hugeicons/core-free-icons/package.json")))
      .rejects.toMatchObject({ code: "ENOENT" });
    expect(getInstalledPluginRegistration(server.db, "thread-organizer"))
      .toMatchObject({ gitResolvedCommit: release.commit });
    const config = await rpc("getConfig");
    expect(config).toMatchObject({ version: 2 });
    if (savedConfig) expect(config).toEqual(savedConfig);
  } finally {
    if (server) {
      await server.pluginService.stop();
      await server.close();
    }
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await rm(fixture, { recursive: true, force: true });
  }
}, 180_000);
