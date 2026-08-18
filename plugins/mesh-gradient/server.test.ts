import { createFakePluginHost } from "@bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import { generateMeshGradient, toCss } from "./gradient.js";
import plugin, {
  renderTokens,
  savedGradientSchema,
  specKeyFor,
} from "./server.js";

async function loadPlugin() {
  const host = createFakePluginHost({ pluginId: "mesh-gradient" });
  plugin(host.bb);
  return host;
}

function saveInput(seed: number, style: "ocean" | "candy" | "sunset" = "ocean") {
  const spec = generateMeshGradient({ seed, style });
  return {
    name: `gradient ${seed}`,
    seed: spec.seed,
    style: spec.style,
    edited: false,
    points: spec.points,
  };
}

describe("mesh gradient backend", () => {
  it("saves, lists, and deletes gradients through rpc", async () => {
    const host = await loadPlugin();
    const savedResult = (await host.harness.behavior.callRpc(
      "saveGradient",
      saveInput(42),
    )) as { gradient: unknown; alreadySaved: boolean };
    const gradient = savedGradientSchema.parse(savedResult.gradient);
    expect(savedResult.alreadySaved).toBe(false);
    expect(gradient.points).toHaveLength(5);

    const listed = (await host.harness.behavior.callRpc("listSaved")) as {
      gradients: unknown[];
    };
    expect(listed.gradients).toHaveLength(1);

    const deleted = (await host.harness.behavior.callRpc("deleteGradient", {
      id: gradient.id,
    })) as { deleted: boolean };
    expect(deleted.deleted).toBe(true);
    const emptied = (await host.harness.behavior.callRpc("listSaved")) as {
      gradients: unknown[];
    };
    expect(emptied.gradients).toHaveLength(0);
    await host.harness.lifecycle.dispose();
  });

  it("dedupes saves with identical points", async () => {
    const host = await loadPlugin();
    const first = (await host.harness.behavior.callRpc(
      "saveGradient",
      saveInput(7),
    )) as { gradient: { id: string }; alreadySaved: boolean };
    const second = (await host.harness.behavior.callRpc("saveGradient", {
      ...saveInput(7),
      name: "different name, same artwork",
    })) as { gradient: { id: string }; alreadySaved: boolean };
    expect(second.alreadySaved).toBe(true);
    expect(second.gradient.id).toBe(first.gradient.id);
    const listed = (await host.harness.behavior.callRpc("listSaved")) as {
      gradients: unknown[];
    };
    expect(listed.gradients).toHaveLength(1);
    await host.harness.lifecycle.dispose();
  });

  it("migrates pre-editor records by regenerating their points", async () => {
    const host = await loadPlugin();
    await host.bb.storage.kv.set("saved/legacy-1", {
      id: "legacy-1",
      name: "old record",
      seed: 5,
      pointCount: 4,
      style: "ocean",
      createdAt: 10,
    });
    const listed = (await host.harness.behavior.callRpc("listSaved")) as {
      gradients: unknown[];
    };
    const migrated = savedGradientSchema.parse(listed.gradients[0]);
    expect(migrated.edited).toBe(false);
    expect(migrated.points).toEqual(
      generateMeshGradient({ seed: 5, pointCount: 4, style: "ocean" }).points,
    );
    expect(savedGradientSchema.parse(await host.bb.storage.kv.get("saved/legacy-1")))
      .toEqual(migrated);
    await host.harness.lifecycle.dispose();
  });

  it("exposes saved gradients through the @gradient mention provider", async () => {
    const host = await loadPlugin();
    const { gradient } = (await host.harness.behavior.callRpc(
      "saveGradient",
      saveInput(11, "candy"),
    )) as { gradient: { id: string; name: string } };
    const provider = host.harness.inspection.registrations.mentionProviders[0];
    expect(provider?.id).toBe("gradient");

    const items = await provider!.search({
      trigger: "@",
      query: "gradient 11",
      projectId: null,
      threadId: null,
    });
    expect(items).toMatchObject([{ id: gradient.id, title: "gradient 11" }]);

    // Typing the feature's own name must list the library, not filter it away.
    for (const query of ["gradient", "grad", "gradients", ""]) {
      const all = await provider!.search({
        trigger: "@",
        query,
        projectId: null,
        threadId: null,
      });
      expect(all, `query ${JSON.stringify(query)}`).toHaveLength(1);
    }
    const byStyle = await provider!.search({
      trigger: "@",
      query: "candy",
      projectId: null,
      threadId: null,
    });
    expect(byStyle).toHaveLength(1);
    const noMatch = await provider!.search({
      trigger: "@",
      query: "zzz",
      projectId: null,
      threadId: null,
    });
    expect(noMatch).toHaveLength(0);

    const resolved = await provider!.resolve(gradient.id);
    expect(resolved.context).toContain("use them verbatim");
    expect(resolved.context).toContain("background-image: radial-gradient(");
    expect(resolved.context).toContain(`bb mesh-gradient show ${gradient.id}`);

    await expect(provider!.resolve("missing-id")).rejects.toThrow(/deleted/);
    await host.harness.lifecycle.dispose();
  });

  it("generates deterministic CSS from the CLI", async () => {
    const host = await loadPlugin();
    const result = await host.harness.behavior.runCli([
      "generate",
      "--seed",
      "42",
      "--points",
      "4",
      "--style",
      "sunset",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(
      toCss(generateMeshGradient({ seed: 42, pointCount: 4, style: "sunset" })),
    );
    await host.harness.lifecycle.dispose();
  });

  it("shows a saved gradient by id or unique name", async () => {
    const host = await loadPlugin();
    const { gradient } = (await host.harness.behavior.callRpc(
      "saveGradient",
      saveInput(9),
    )) as { gradient: { id: string } };

    const byId = await host.harness.behavior.runCli(["show", gradient.id]);
    expect(byId.exitCode).toBe(0);
    expect(byId.stdout).toContain(
      toCss(generateMeshGradient({ seed: 9, style: "ocean" })),
    );

    const byName = await host.harness.behavior.runCli([
      "show",
      "gradient 9",
      "--format",
      "json",
    ]);
    expect(byName.exitCode).toBe(0);
    expect(JSON.parse(byName.stdout ?? "").seed).toBe(9);

    const missing = await host.harness.behavior.runCli(["show", "nope"]);
    expect(missing.exitCode).toBe(1);
    expect(missing.stderr).toContain("no saved gradient matches");
    await host.harness.lifecycle.dispose();
  });

  it("saves from the CLI, dedupes, and lists the result", async () => {
    const host = await loadPlugin();
    const saved = await host.harness.behavior.runCli([
      "save",
      "--seed",
      "9",
      "--style",
      "candy",
      "--name",
      "landing hero",
    ]);
    expect(saved.exitCode).toBe(0);
    expect(saved.stdout).toContain('saved "landing hero"');
    const again = await host.harness.behavior.runCli([
      "save",
      "--seed",
      "9",
      "--style",
      "candy",
    ]);
    expect(again.stdout).toContain('already saved as "landing hero"');
    const listed = await host.harness.behavior.runCli(["list"]);
    expect(listed.stdout).toContain("landing hero");
    expect(listed.stdout).toContain("seed=9");
    await host.harness.lifecycle.dispose();
  });

  it("fails with a usage error on bad flags or commands", async () => {
    const host = await loadPlugin();
    const badStyle = await host.harness.behavior.runCli([
      "generate",
      "--style",
      "plaid",
    ]);
    expect(badStyle.exitCode).toBe(1);
    expect(badStyle.stderr).toContain("--style must be one of");
    const badCommand = await host.harness.behavior.runCli(["paint"]);
    expect(badCommand.exitCode).toBe(1);
    expect(badCommand.stderr).toContain("usage: bb mesh-gradient");
    await host.harness.lifecycle.dispose();
  });

  it("renders tokens in each supported format with unique slugs", () => {
    const base = generateMeshGradient({ seed: 1, style: "ocean" });
    const other = generateMeshGradient({ seed: 2, style: "candy" });
    const gradients = [
      {
        id: "a",
        name: "Hero Background",
        seed: base.seed,
        style: base.style,
        edited: false,
        points: base.points,
        createdAt: 1,
      },
      {
        id: "b",
        name: "hero background",
        seed: other.seed,
        style: other.style,
        edited: false,
        points: other.points,
        createdAt: 2,
      },
    ];
    const css = renderTokens(gradients, "css");
    expect(css).toContain("--gradient-hero-background:");
    // Same slug twice would silently clobber one gradient.
    expect(css).toContain("--gradient-hero-background-2:");
    const ts = renderTokens(gradients, "ts");
    expect(ts).toContain('"hero-background":');
    expect(ts).toContain("export const gradients");
    const tailwind = renderTokens(gradients, "tailwind");
    expect(tailwind).toContain("backgroundImage");
    expect(tailwind).toContain('"hero-background"');
  });

  it("exports tokens into the thread's own worktree", async () => {
    const host = await loadPlugin();
    await host.harness.behavior.callRpc("saveGradient", saveInput(4));
    const writes: unknown[] = [];
    host.harness.sdk.stub("threads.get", async () => ({
      id: "thr_1",
      environmentId: "env_1",
    }));
    host.harness.sdk.stub("environments.get", async () => ({
      id: "env_1",
      hostId: "host_9",
      path: "/repo/checkout",
    }));
    host.harness.sdk.stub("files.mkdir", async () => ({ created: true }));
    host.harness.sdk.stub("files.write", async (args: unknown) => {
      writes.push(args);
      return { outcome: "written", sha256: "x", sizeBytes: 1 };
    });
    const result = (await host.harness.behavior.callRpc("exportTokens", {
      threadId: "thr_1",
      format: "css",
    })) as { path: string; gradientCount: number };
    expect(result).toMatchObject({ path: "styles/gradients.css", gradientCount: 1 });
    expect(writes[0]).toMatchObject({
      hostId: "host_9",
      path: "/repo/checkout/styles/gradients.css",
      rootPath: "/repo/checkout",
    });
    await host.harness.lifecycle.dispose();
  });

  it("refuses to export tokens without a thread", async () => {
    const host = await loadPlugin();
    await host.harness.behavior.callRpc("saveGradient", saveInput(4));
    await expect(
      host.harness.behavior.callRpc("exportTokens", {
        threadId: null,
        format: "css",
      }),
    ).rejects.toThrow();
    await host.harness.lifecycle.dispose();
  });

  it("uploads PNG exports as project attachments", async () => {
    const host = await loadPlugin();
    host.harness.sdk.stub("projects.attachments.upload", async () => ({
      path: "attachments/hero-og.png",
    }));
    const result = (await host.harness.behavior.callRpc("exportPng", {
      projectId: "proj_1",
      name: "Hero OG",
      base64: Buffer.from("not-really-a-png").toString("base64"),
    })) as { path: string; filename: string };
    expect(result.filename).toBe("hero-og.png");
    const call = host.harness.inspection.sdk.callsTo(
      "projects.attachments.upload",
    )[0];
    expect(call).toBeTruthy();
    await host.harness.lifecycle.dispose();
  });

  it("serves agents through the native tool", async () => {
    const host = await loadPlugin();
    const { gradient } = (await host.harness.behavior.callRpc(
      "saveGradient",
      saveInput(21, "sunset"),
    )) as { gradient: { id: string } };

    const generated = await host.harness.behavior.callAgentTool("mesh_gradient", {
      action: "generate",
      seed: 21,
      style: "sunset",
      format: "css",
    });
    expect(JSON.stringify(generated)).toContain("radial-gradient(");

    const custom = await host.harness.behavior.callAgentTool("mesh_gradient", {
      action: "generate",
      color: "#3366ff",
      format: "json",
    });
    expect(JSON.stringify(custom)).toContain("customColor");

    const shown = await host.harness.behavior.callAgentTool("mesh_gradient", {
      action: "show",
      ref: gradient.id,
    });
    expect(JSON.stringify(shown)).toContain("radial-gradient(");

    const missing = await host.harness.behavior.callAgentTool("mesh_gradient", {
      action: "show",
      ref: "nope",
    });
    expect(missing).toMatchObject({ isError: true });
    await host.harness.lifecycle.dispose();
  });

  it("generates from a custom color on the CLI", async () => {
    const host = await loadPlugin();
    const custom = await host.harness.behavior.runCli([
      "generate",
      "--seed",
      "12",
      "--color",
      "#3366ff",
      "--format",
      "json",
    ]);
    expect(JSON.parse(custom.stdout ?? "").style).toBe("custom");

    const badColor = await host.harness.behavior.runCli([
      "generate",
      "--color",
      "blue",
    ]);
    expect(badColor.exitCode).toBe(1);
    await host.harness.lifecycle.dispose();
  });

  it("prints the library as tokens from the CLI", async () => {
    const host = await loadPlugin();
    await host.harness.behavior.callRpc("saveGradient", saveInput(6));
    const tokens = await host.harness.behavior.runCli(["tokens"]);
    expect(tokens.exitCode).toBe(0);
    expect(tokens.stdout).toContain("--gradient-gradient-6:");
    const empty = await host.harness.behavior.runCli(["tokens", "--format", "ts"]);
    expect(empty.stdout).toContain("export const gradients");
    await host.harness.lifecycle.dispose();
  });

  it("keys specs by their points, not their provenance", () => {
    const a = generateMeshGradient({ seed: 3 });
    const b = generateMeshGradient({ seed: 3 });
    expect(specKeyFor(a.points)).toBe(specKeyFor(b.points));
    const moved = [{ ...a.points[0], x: a.points[0].x + 1 }, ...a.points.slice(1)];
    expect(specKeyFor(moved)).not.toBe(specKeyFor(a.points));
  });
});
