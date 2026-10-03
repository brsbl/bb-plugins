import { recentPaths } from "./recent-files.js";
import { randomUUID } from "node:crypto";
import { cliCommand, defineCli, PluginCliError, type BbPluginApi } from "@get-bb/plugin-sdk";
import { CHANGED, MAX_PINS, hostContract, pinsSchema, rpcContract, type Pin, type Reference } from "./contract.js";

export default function plugin(bb: BbPluginApi): void {
  const host = bb.hosts.experimental_client({ contract: hostContract });
  const undos = new Map<string, { threadId: string; pin: Pin; index: number; expires: number }>();
  // All read-modify-write operations share a queue so CLI/UI writes cannot lose pins.
  let writes = Promise.resolve();
  const serialize = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = writes.then(operation);
    writes = result.then(() => undefined, () => undefined);
    return result;
  };
  const key = (threadId: string) => `thread:${threadId}:pins:v1`;
  const read = async (threadId: string): Promise<Pin[]> =>
    pinsSchema.parse((await bb.storage.kv.get(key(threadId))) ?? []);
  const save = async (threadId: string, pins: Pin[]) => {
    await bb.storage.kv.set(key(threadId), pins);
    bb.realtime.publish(CHANGED, { threadId });
  };
  const thread = async (threadId: string) => {
    const result = await bb.sdk.threads.get({ threadId });
    if (result.deletedAt !== null) throw new Error("This thread has been deleted.");
    return result;
  };
  const threadHost = async (threadId: string): Promise<string | null> => {
    const target = await thread(threadId);
    if (!target.environmentId) return null;
    const environment = await bb.sdk.environments.get({ environmentId: target.environmentId });
    return environment.hostId;
  };
  const list = async (threadId: string) => {
    await thread(threadId);
    await writes;
    return { pins: await read(threadId) };
  };
  const pin = async (threadId: string, hostId: string, path: string, cwd?: string, signal?: AbortSignal) => {
    await thread(threadId);
    const file = await host.call("resolveFile", { path, ...(cwd ? { cwd } : {}) }, { hostId, signal });
    return serialize(async () => {
      await thread(threadId);
      const pins = await read(threadId);
      const existing = pins.find((item) => item.hostId === hostId && item.path === file.path);
      if (existing) return existing;
      if (pins.length >= MAX_PINS) throw new Error(`A thread can hold up to ${MAX_PINS} pins. Unpin a file first.`);
      const entry: Pin = { id: randomUUID(), hostId, ...file, createdAt: new Date().toISOString() };
      await save(threadId, [...pins, entry]);
      return entry;
    });
  };
  const unpin = (threadId: string, pinId: string) => serialize(async () => {
    await thread(threadId);
    const pins = await read(threadId);
    const remaining = pins.filter((item) => item.id !== pinId);
    if (remaining.length === pins.length) return { removed: false };
    await save(threadId, remaining);
    return { removed: true };
  });

  bb.rpc.register(rpcContract, {
    recent: async ({ threadId }) => {
      const target = await thread(threadId);
      if (!target.environmentId) return { files: [] };
      const environment = await bb.sdk.environments.get({ environmentId: target.environmentId });
      if (!environment.path) return { files: [] };
      const events = await bb.sdk.threads.events.list({
        threadId, order: "desc", limit: "100",
        types: ["item/completed", "client/turn/requested", "client/thread/start"],
      });
      const paths = recentPaths(events);
      if (!paths.length) return { files: [] };
      const { files } = await host.call("recentFiles", { paths, cwd: environment.path }, { hostId: environment.hostId }).catch(() => ({ files: [] }));
      await writes;
      const pins = await read(threadId);
      return { files: files.filter((file) => !pins.some((pin) => pin.hostId === environment.hostId && pin.path === file.path))
        .slice(0, 12).map((file) => ({ ...file, hostId: environment.hostId })) };
    },
    move: ({ threadId, pinId, overId }) => serialize(async () => {
      await thread(threadId);
      const pins = await read(threadId);
      const from = pins.findIndex((pin) => pin.id === pinId);
      const to = pins.findIndex((pin) => pin.id === overId);
      if (from < 0 || to < 0) throw new Error("These pins changed. Try again.");
      if (from !== to) {
        pins.splice(to, 0, pins.splice(from, 1)[0]!);
        await save(threadId, pins);
      }
      return { pins };
    }),
    inspect: async ({ threadId }) => {
      const { pins } = await list(threadId);
      const hosts = await bb.sdk.hosts.list();
      const result: Reference[] = [];
      for (const hostId of new Set(pins.map((pin) => pin.hostId))) {
        const owned = pins.filter((pin) => pin.hostId === hostId);
        const machine = hosts.find((item) => item.id === hostId);
        const facts = machine?.status === "connected"
          ? await host.call("inspect", { paths: owned.map((pin) => pin.path) }, { hostId }).catch(() => null)
          : null;
        for (const pinned of owned) {
          const fact = facts?.files.find((file) => file.path === pinned.path);
          result.push({ ...pinned, hostName: machine?.name ?? hostId, status: fact?.status ?? "unavailable", moss: fact?.moss ?? false });
        }
      }
      return { pins: pins.map((pin) => result.find((item) => item.id === pin.id)!) };
    },
    search: async ({ threadId, hostId, query }) => {
      const target = await thread(threadId);
      const environment = target.environmentId ? await bb.sdk.environments.get({ environmentId: target.environmentId }) : null;
      const root = environment?.hostId === hostId && environment.path ? environment.path : (await host.call("home", {}, { hostId })).path;
      if (!query.trim()) return { root, paths: [], truncated: false };
      const result = await bb.sdk.files.listPaths({ hostId, path: root, query: query.trim(), includeFiles: true, includeDirectories: false, limit: 20 });
      return { root, paths: result.paths.map(({ path, name }) => ({ path: `${root.replace(/[\\/]$/, "")}/${path}`, name })), truncated: result.truncated };
    },
    remove: ({ threadId, pinId }) => serialize(async () => {
      await thread(threadId);
      const pins = await read(threadId);
      const index = pins.findIndex((pin) => pin.id === pinId);
      if (index < 0) return { undoToken: null };
      await save(threadId, pins.filter((pin) => pin.id !== pinId));
      for (const [token, undo] of undos) if (undo.expires < Date.now()) undos.delete(token);
      if (undos.size >= 100) undos.delete(undos.keys().next().value!);
      const undoToken = randomUUID();
      undos.set(undoToken, { threadId, pin: pins[index]!, index, expires: Date.now() + 60_000 });
      return { undoToken };
    }),
    undo: ({ threadId, undoToken }) => serialize(async () => {
      await thread(threadId);
      const undo = undos.get(undoToken);
      if (!undo || undo.threadId !== threadId || undo.expires < Date.now()) throw new Error("Undo has expired. Pin the file again.");
      const pins = await read(threadId);
      const existing = pins.find((pin) => pin.id === undo.pin.id || (pin.hostId === undo.pin.hostId && pin.path === undo.pin.path));
      if (existing) { undos.delete(undoToken); return existing; }
      if (pins.length >= MAX_PINS) throw new Error("Unpin another file before restoring this pin.");
      pins.splice(Math.min(undo.index, pins.length), 0, undo.pin);
      await save(threadId, pins);
      undos.delete(undoToken);
      return undo.pin;
    }),
    repin: async ({ threadId, pinId, hostId, path }) => {
      await thread(threadId);
      const file = await host.call("resolveFile", { path }, { hostId });
      return serialize(async () => {
        await thread(threadId);
        const pins = await read(threadId);
        const index = pins.findIndex((pin) => pin.id === pinId);
        if (index < 0) throw new Error("This file is no longer pinned.");
        const existing = pins.find((pin) => pin.id !== pinId && pin.hostId === hostId && pin.path === file.path);
        const replacement = existing ?? { ...pins[index]!, hostId, ...file };
        if (existing) pins.splice(index, 1); else pins[index] = replacement;
        await save(threadId, pins);
        return replacement;
      });
    },
    openMossNote: async ({ threadId, pinId }) => {
      const { pins } = await list(threadId);
      const pinned = pins.find((item) => item.id === pinId);
      if (!pinned) throw new Error("This file is no longer pinned.");
      return host.call("openMossNote", { path: pinned.path }, { hostId: pinned.hostId });
    },
    list: ({ threadId }) => list(threadId),
    context: async ({ threadId }) => ({
      defaultHostId: await threadHost(threadId),
      hosts: (await bb.sdk.hosts.list()).map(({ id, name, status }) => ({ id, name, connected: status === "connected" })),
    }),
    pin: ({ threadId, hostId, path }) => pin(threadId, hostId, path),
    unpin: ({ threadId, pinId }) => unpin(threadId, pinId),
  });
  bb.events.on("thread.idle", ({ thread }) => bb.realtime.publish("recent-changed", { threadId: thread.id }));
  bb.events.on("message.dispatched", ({ entry }) => bb.realtime.publish("recent-changed", { threadId: entry.threadId }));
  bb.events.on("thread.deleted", ({ thread: deleted }) => serialize(async () => {
    for (const [token, undo] of undos) if (undo.threadId === deleted.id) undos.delete(token);
    await bb.storage.kv.delete(key(deleted.id));
    bb.realtime.publish(CHANGED, { threadId: deleted.id });
  }));

  const options = {
    thread: { type: "string", description: "Target thread; defaults to the current thread" },
    json: { type: "boolean", description: "Emit JSON" },
  } as const;
  function target(explicit: string | undefined, current: string | undefined) {
    const value = explicit ?? current;
    if (!value) throw new PluginCliError("A thread is required.", { code: "thread_required", hint: "Pass --thread <thread-id>." });
    return value;
  }
  bb.cli.register(defineCli({
    name: "file-pins",
    summary: "Pin local files to threads",
    commands: {
      pin: cliCommand({
        summary: "Pin a file on its owning host",
        positionals: [{ name: "path", required: true, description: "Absolute, ~/ or invoking-directory-relative file path" }],
        options: { ...options, machine: { type: "string", aliases: ["host"], description: "File host ID; defaults to the invoking thread host, then target thread host" } },
        async run(input, ctx) {
          const threadId = target(input.options.thread, ctx.threadId);
          const hostId = input.options.machine ?? await threadHost(ctx.threadId ?? threadId);
          if (!hostId) throw new PluginCliError("A file host is required.", { code: "host_required", hint: "Pass --machine <host-id>." });
          // A cwd belongs only to the invoking thread's host, never an arbitrary selected host.
          const invokingHost = ctx.threadId ? await threadHost(ctx.threadId) : null;
          const cwd = invokingHost === hostId ? ctx.cwd : undefined;
          const result = await pin(threadId, hostId, input.positionals.path, cwd, ctx.signal);
          return { exitCode: 0, stdout: input.options.json ? JSON.stringify(result) : `Pinned ${result.path}\n${result.id}` };
        },
      }),
      unpin: cliCommand({
        summary: "Remove a pin by ID without changing its file (works while the host is offline)",
        positionals: [{ name: "id", required: true, description: "Pin ID from list" }],
        options,
        async run(input, ctx) {
          const result = await unpin(target(input.options.thread, ctx.threadId), input.positionals.id);
          return { exitCode: 0, stdout: input.options.json ? JSON.stringify(result) : result.removed ? "File unpinned." : "Pin was already absent." };
        },
      }),
      list: cliCommand({
        summary: "List this thread's pinned files and host IDs",
        options,
        async run(input, ctx) {
          const result = await list(target(input.options.thread, ctx.threadId));
          return { exitCode: 0, stdout: input.options.json ? JSON.stringify(result) : result.pins.map((item) => `${item.id}\t${item.hostId}\t${item.path}`).join("\n") || "No files pinned." };
        },
      }),
    },
  }));
}
