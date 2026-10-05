import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cliCommand, defineCli, PluginCliError, type BbPluginApi } from "@get-bb/plugin-sdk";
import { CHANGED, MAX_PINS, PIN_MENTION, hostContract, moreSchema, pinsSchema, rpcContract, type Pin, type Reference } from "./contract.js";

// The shipped skill is the one source of the pinning instructions; the composer pill sends it to the agent.
const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const SKILL_PATH = join(basename(MODULE_DIR) === "dist" ? dirname(MODULE_DIR) : MODULE_DIR, "skills", "file-pins", "SKILL.md");
/** How long inspect waits on a host before answering with that host's last known statuses. */
const HOST_CHECK_MS = 3_000;
type Status = Reference["status"];

export default function plugin(bb: BbPluginApi): void {
  const host = bb.hosts.experimental_client({ contract: hostContract });
  const undos = new Map<string, { threadId: string; pin: Pin; index: number; more: boolean; expires: number }>();
  // All read-modify-write operations share a queue so CLI/UI writes cannot lose pins.
  let writes = Promise.resolve();
  const serialize = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = writes.then(operation);
    writes = result.then(() => undefined, () => undefined);
    return result;
  };
  const key = (threadId: string) => `thread:${threadId}:pins:v1`;
  const moreKey = (threadId: string) => `thread:${threadId}:more:v1`;
  // Folder the removed file picker remembered per thread; still cleared with the thread.
  const legacyScopeKey = (threadId: string) => `thread:${threadId}:scope:v1`;
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
  const pin = async (threadId: string, hostId: string, path: string, cwd?: string, signal?: AbortSignal) => {
    await thread(threadId);
    const file = await host.call("resolveFile", { path, ...(cwd ? { cwd } : {}) }, { hostId, signal });
    return serialize(async () => {
      await thread(threadId);
      const pins = await read(threadId);
      const existing = pins.find((item) => item.hostId === hostId && item.path === file.path);
      if (existing) return existing;
      if (pins.length >= MAX_PINS) throw new Error(`A thread can hold up to ${MAX_PINS} pins. Remove a file first.`);
      const entry: Pin = { id: randomUUID(), hostId, ...file, createdAt: new Date().toISOString() };
      await save(threadId, [...pins, entry]);
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

  // A busy host can take many seconds to answer. Inspect waits briefly, then answers with
  // each file's last known status; a late answer that changes one refreshes the waiting threads.
  const known = new Map<string, Status>();
  const checks = new Map<string, { done: Promise<void>; waiting: Set<string> }>();
  const statusKey = (hostId: string, path: string) => `${hostId}\0${path}`;
  const check = async (threadId: string, hostId: string, paths: string[]) => {
    const request = statusKey(hostId, paths.join("\0"));
    let pending = checks.get(request);
    if (!pending) {
      const waiting = new Set<string>();
      const done = host.call("inspect", { paths }, { hostId }).then(
        (facts) => facts.files.map((file) => [file.path, file.status] as const),
        () => paths.map((path) => [path, "unavailable"] as const),
      ).then((facts) => {
        let changed = false;
        for (const [path, status] of facts) {
          changed ||= known.get(statusKey(hostId, path)) !== status;
          known.set(statusKey(hostId, path), status);
        }
        checks.delete(request);
        if (changed) for (const waiter of waiting) bb.realtime.publish(CHANGED, { threadId: waiter });
      });
      pending = { done, waiting };
      checks.set(request, pending);
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const answered = await Promise.race([
      pending.done.then(() => true),
      new Promise<false>((resolve) => { timer = setTimeout(() => resolve(false), HOST_CHECK_MS); }),
    ]);
    clearTimeout(timer);
    if (!answered) pending.waiting.add(threadId);
    return new Map(paths.map((path) => [path, known.get(statusKey(hostId, path)) ?? "unavailable"]));
  };

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
      await Promise.all([...new Set(pins.map((pin) => pin.hostId))].map(async (hostId) => {
        const owned = pins.filter((pin) => pin.hostId === hostId);
        const machine = hosts.find((item) => item.id === hostId);
        const statuses = machine?.status === "connected" ? await check(threadId, hostId, owned.map((pin) => pin.path)) : null;
        for (const pinned of owned) {
          result.push({ ...pinned, hostName: machine?.name ?? hostId, status: statuses?.get(pinned.path) ?? "unavailable" });
        }
      }));
      return { pins: pins.map((pin) => result.find((item) => item.id === pin.id)!), more: await readMore(threadId, pins), threadHostId: await threadHost(threadId) };
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
    pin: async ({ threadId, hostId, path }) => {
      // Relative paths resolve against the thread's workspace on its own machine.
      const environment = await environmentOf(threadId);
      const base = environment?.hostId === hostId && environment.path ? environment.path : undefined;
      return pin(threadId, hostId, path, base);
    },
    unpin: ({ threadId, pinId }) => removePin(threadId, pinId),
  });
  // Only the composer's pin button inserts this pill, so it never appears in the @ menu.
  bb.ui.registerMentionProvider({
    id: PIN_MENTION.provider, label: PIN_MENTION.label, search: () => [],
    async resolve(itemId) {
      if (itemId !== PIN_MENTION.id) throw new Error("This pill is out of date. Use the pin button again.");
      return { context: (await readFile(SKILL_PATH, "utf8")).replace(/^---\n[\s\S]*?\n---\n/, "").trim() };
    },
  });
  bb.events.on("thread.deleted", ({ thread: deleted }) => serialize(async () => {
    for (const [token, undo] of undos) if (undo.threadId === deleted.id) undos.delete(token);
    await bb.storage.kv.delete(key(deleted.id));
    await bb.storage.kv.delete(moreKey(deleted.id));
    await bb.storage.kv.delete(legacyScopeKey(deleted.id));
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
