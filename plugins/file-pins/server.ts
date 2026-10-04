import { randomUUID } from "node:crypto";
import { cliCommand, defineCli, PluginCliError, type BbPluginApi } from "@get-bb/plugin-sdk";
import { CHANGED, MAX_PINS, hostContract, moreSchema, pinsSchema, rpcContract, scopeSchema, type Pin, type Reference, type Scope } from "./contract.js";

export default function plugin(bb: BbPluginApi): void {
  const host = bb.hosts.experimental_client({ contract: hostContract });
  const undos = new Map<string, { threadId: string; pin: Pin; index: number; more: boolean; expires: number }>();
  // Machine lookups that may hit a sleeping or unreachable host give up quickly.
  const HOST_TIMEOUT = 2_000;
  const timeBoxed = <T>(work: Promise<T>) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("The machine did not respond.")), HOST_TIMEOUT); });
    return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
  };
  const joinPath = (root: string, path: string) => `${root.replace(/[\\/]$/, "")}/${path}`;
  const connectedHost = async (hostId: string) => {
    const machine = (await bb.sdk.hosts.list()).find((item) => item.id === hostId);
    if (machine?.status !== "connected") throw new Error(`${machine?.name ?? "This machine"} is offline.`);
  };
  // All read-modify-write operations share a queue so CLI/UI writes cannot lose pins.
  let writes = Promise.resolve();
  const serialize = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = writes.then(operation);
    writes = result.then(() => undefined, () => undefined);
    return result;
  };
  const key = (threadId: string) => `thread:${threadId}:pins:v1`;
  const moreKey = (threadId: string) => `thread:${threadId}:more:v1`;
  const scopeKey = (threadId: string) => `thread:${threadId}:scope:v1`;
  const lastScopeKey = "scope:last:v1";
  const environmentOf = async (threadId: string) => {
    const target = await thread(threadId);
    return target.environmentId ? bb.sdk.environments.get({ environmentId: target.environmentId }) : null;
  };
  const read = async (threadId: string): Promise<Pin[]> =>
    pinsSchema.parse((await bb.storage.kv.get(key(threadId))) ?? []);
  const readMore = async (threadId: string, pins: Pin[]): Promise<string[]> =>
    moreSchema.parse((await bb.storage.kv.get(moreKey(threadId))) ?? []).filter((id) => pins.some((pin) => pin.id === id));
  const save = async (threadId: string, pins: Pin[], more?: string[]) => {
    await bb.storage.kv.set(key(threadId), pins);
    if (more) await bb.storage.kv.set(moreKey(threadId), more);
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
  const without = async (threadId: string, pins: Pin[], pinId: string) => {
    const more = await readMore(threadId, pins);
    await save(threadId, pins.filter((item) => item.id !== pinId), more.filter((id) => id !== pinId));
    return more.includes(pinId);
  };
  const pin = async (threadId: string, hostId: string, path: string, cwd?: string, signal?: AbortSignal, unpinned = false) => {
    await thread(threadId);
    const file = await host.call("resolveFile", { path, ...(cwd ? { cwd } : {}) }, { hostId, signal });
    return serialize(async () => {
      await thread(threadId);
      const pins = await read(threadId);
      const existing = pins.find((item) => item.hostId === hostId && item.path === file.path);
      if (existing) return existing;
      if (pins.length >= MAX_PINS) throw new Error(`A thread can hold up to ${MAX_PINS} pins. Remove a file first.`);
      const entry: Pin = { id: randomUUID(), hostId, ...file, createdAt: new Date().toISOString() };
      await save(threadId, [...pins, entry], unpinned ? [...await readMore(threadId, pins), entry.id] : undefined);
      return entry;
    });
  };
  const removePin = (threadId: string, pinId: string) => serialize(async () => {
    await thread(threadId);
    const pins = await read(threadId);
    if (!pins.some((item) => item.id === pinId)) return { removed: false };
    await without(threadId, pins, pinId);
    return { removed: true };
  });

  bb.rpc.register(rpcContract, {
    arrange: ({ threadId, order, more }) => serialize(async () => {
      await thread(threadId);
      const pins = await read(threadId);
      const arranged = order.map((pinId) => pins.find((pin) => pin.id === pinId));
      if (order.length !== pins.length || new Set(order).size !== pins.length || arranged.some((pin) => !pin) || more.some((pinId) => !order.includes(pinId))) {
        throw new Error("These pins changed. Try again.");
      }
      const next = { pins: arranged as Pin[], more: [...new Set(more)] };
      await save(threadId, next.pins, next.more);
      return next;
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
          result.push({ ...pinned, hostName: machine?.name ?? hostId, status: fact?.status ?? "unavailable" });
        }
      }
      return { pins: pins.map((pin) => result.find((item) => item.id === pin.id)!), more: await readMore(threadId, pins) };
    },
    search: async ({ threadId, hostId, root: chosen, query }) => {
      const environment = await environmentOf(threadId);
      await connectedHost(hostId);
      const root = chosen ?? (environment?.hostId === hostId && environment.path ? environment.path : (await timeBoxed(host.call("home", {}, { hostId }))).path);
      const text = query.trim();
      if (!text) return { root, paths: [], truncated: false };
      const result = await bb.sdk.files.listPaths({ hostId, path: root, query: text, includeFiles: true, includeDirectories: false, limit: 20 });
      return { root, paths: result.paths.map(({ path, name }) => ({ path: joinPath(root, path), name })), truncated: result.truncated };
    },
    directory: async ({ threadId, hostId, path }) => {
      await thread(threadId);
      await connectedHost(hostId);
      return bb.sdk.hosts.directory({ hostId, ...(path ? { path } : {}) });
    },
    setScope: async ({ threadId, scope }) => {
      await thread(threadId);
      await bb.storage.kv.set(scopeKey(threadId), scope);
      await bb.storage.kv.set(lastScopeKey, scope);
      return { scope };
    },
    remove: ({ threadId, pinId }) => serialize(async () => {
      await thread(threadId);
      const pins = await read(threadId);
      const index = pins.findIndex((pin) => pin.id === pinId);
      if (index < 0) return { undoToken: null };
      const more = await without(threadId, pins, pinId);
      for (const [token, undo] of undos) if (undo.expires < Date.now()) undos.delete(token);
      if (undos.size >= 100) undos.delete(undos.keys().next().value!);
      const undoToken = randomUUID();
      undos.set(undoToken, { threadId, pin: pins[index]!, index, more, expires: Date.now() + 60_000 });
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
      const more = await readMore(threadId, pins);
      pins.splice(Math.min(undo.index, pins.length), 0, undo.pin);
      await save(threadId, pins, undo.more ? [...more, undo.pin.id] : more);
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
    list: ({ threadId }) => list(threadId),
    context: async ({ threadId }) => {
      const environment = await environmentOf(threadId);
      const hosts = (await bb.sdk.hosts.list()).map(({ id, name, status }) => ({ id, name, connected: status === "connected" }));
      let scope: Scope | null = null;
      for (const key of [lastScopeKey, scopeKey(threadId)]) {
        const saved = scopeSchema.safeParse(await bb.storage.kv.get(key));
        if (saved.success && hosts.some((item) => item.id === saved.data.hostId)) {
          scope = saved.data;
          break;
        }
      }
      if (!scope && environment?.path) scope = { hostId: environment.hostId, path: environment.path };
      const homeHost = environment?.hostId ?? hosts.find((item) => item.connected)?.id;
      if (!scope && homeHost) scope = await timeBoxed(host.call("home", {}, { hostId: homeHost })).then(({ path }) => ({ hostId: homeHost, path }), () => null);
      return { defaultHostId: environment?.hostId ?? null, hosts, scope };
    },
    pin: async ({ threadId, hostId, path, cwd, unpinned }) => {
      // Relative paths resolve against the chosen scope, else the thread's workspace on its own machine.
      const environment = await environmentOf(threadId);
      const base = cwd ?? (environment?.hostId === hostId && environment.path ? environment.path : undefined);
      return pin(threadId, hostId, path, base, undefined, unpinned);
    },
    unpin: ({ threadId, pinId }) => removePin(threadId, pinId),
  });
  bb.events.on("thread.deleted", ({ thread: deleted }) => serialize(async () => {
    for (const [token, undo] of undos) if (undo.threadId === deleted.id) undos.delete(token);
    await bb.storage.kv.delete(key(deleted.id));
    await bb.storage.kv.delete(moreKey(deleted.id));
    await bb.storage.kv.delete(scopeKey(deleted.id));
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
      remove: cliCommand({
        summary: "Remove a file from the thread by pin ID without changing the file (works while the host is offline)",
        positionals: [{ name: "id", required: true, description: "Pin ID from list" }],
        options,
        async run(input, ctx) {
          const result = await removePin(target(input.options.thread, ctx.threadId), input.positionals.id);
          return { exitCode: 0, stdout: input.options.json ? JSON.stringify(result) : result.removed ? "File removed from the thread." : "Pin was already absent." };
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
