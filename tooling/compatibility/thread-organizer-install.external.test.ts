import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { getInstalledPluginRegistration } from "@bb/db";
import { startTestServer } from "../../helpers/test-app.js";

it("installs Thread Organizer from its Git subdirectory on Linux", async () => {
  const revision = process.env.BB_PLUGIN_INSTALL_COMMIT;
  const repository = process.env.BB_PLUGIN_COMPAT_REPOSITORY;
  if (!revision || !repository) throw new Error("Plugin source inputs are required");
  const manifest = JSON.parse(
    await readFile(join(repository, "plugins/thread-organizer/package.json"), "utf8"),
  );
  const npmCache = await mkdtemp(join(tmpdir(), "organizer-install-npm-"));
  const previousCache = process.env.npm_config_cache;
  process.env.npm_config_cache = npmCache;
  const server = await startTestServer({ appVersion: "0.39.0" });
  server.pluginService.bindSdk({ baseUrl: server.baseUrl });
  try {
    const installed = await server.pluginService.install(
      `git:https://github.com/brsbl/bb-plugins.git@${revision}`,
      { kind: "subdirectory", path: "plugins/thread-organizer" },
    );
    expect(installed.status, installed.statusDetail ?? undefined).toBe("running");
    expect(installed).toMatchObject({
      id: "thread-organizer",
      version: manifest.version,
      status: "running",
    });
    const icons = JSON.parse(await readFile(
      join(installed.rootDir, "node_modules/@hugeicons/core-free-icons/package.json"),
      "utf8",
    ));
    expect(icons.version).toBe("4.2.2");
    expect(getInstalledPluginRegistration(server.db, "thread-organizer"))
      .toMatchObject({ gitResolvedCommit: revision });

    const response = await fetch(
      `${server.baseUrl}/api/v1/plugins/thread-organizer/rpc/getConfig`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, result: { version: 2 } });
  } finally {
    await server.pluginService.stop();
    await server.close();
    if (previousCache === undefined) delete process.env.npm_config_cache;
    else process.env.npm_config_cache = previousCache;
    await rm(npmCache, { recursive: true, force: true });
  }
}, 180_000);
