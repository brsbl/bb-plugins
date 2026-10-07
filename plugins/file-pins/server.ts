import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cliCommand, defineCli, PluginCliError, type BbPluginApi } from "@get-bb/plugin-sdk";
import { IconService, createIconCache } from "@brsbl/bb-website-icons";
import { CHANGED, MAX_PINS, PIN_MENTION, hostContract, isUrlPin, moreSchema, pinsSchema, rpcContract, type FilePin, type Pin, type Reference, type UrlPin } from "./contract.js";
import { fetchPrState, githubPullRequest, isFresh, prKey, PR_STATES, type PrState, type PullRequestRef } from "./pr-state.js";
import { looksLikeUrl, parseWebUrl, urlPinName } from "./url-pin.js";

// The shipped skill is the one source of the pinning instructions; the composer pill sends it to the agent.
const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const SKILL_PATH = join(basename(MODULE_DIR) === "dist" ? dirname(MODULE_DIR) : MODULE_DIR, "skills", "file-pins", "SKILL.md");
const PROACTIVE_PIN_INSTRUCTIONS =
  "Without being asked, pin the few links central to this thread's work with `bb file-pins pin <url> --title \"<title>\"`: the PR you open or drive, the issue or ticket being worked, the spec or design doc, and a dev site or dashboard you hand the user (local dev or story server, its shared URL, or a deployed preview). Remove a dev site's pin when you retire its server. Load the file-pins skill for the guardrails before pinning.";

// A URL pin is its exact normalized URL; a file pin is its host and canonical path.
function samePin(a: Pin, b: Pin): boolean {
  if (isUrlPin(a) || isUrlPin(b)) return isUrlPin(a) && isUrlPin(b) && a.url === b.url;
  return a.hostId === b.hostId && a.path === b.path;
}

export default function plugin(bb: BbPluginApi): void {
  const host = bb.hosts.experimental_client({ contract: hostContract });
  // Compact Links' resolver: only a pinned URL's public HTTPS origin is contacted, cached in this plugin's database.
  const icons = new IconService(createIconCache(bb));
  bb.onDispose(() => icons.setEnabled(false));
  const undos = new Map<string, { threadId: string; pin: Pin; index: number; more: boolean; expires: number }>();
  // One cached state per PR across threads; GitHub is asked only when it is stale, one request per PR at a time.
  const prChecks = new Map<string, Promise<PrState | null>>();
  const prState = async (pr: PullRequestRef): Promise<PrState | null> => {
    const cacheKey = `pr:v1:${prKey(pr)}`;
    const cached = await bb.storage.kv.get(cacheKey) as { state: PrState | null; checkedAt: number } | undefined;
    const known = cached && typeof cached.checkedAt === "number" && (cached.state === null || PR_STATES.includes(cached.state)) ? cached : undefined;
    if (known && isFresh(known, Date.now())) return known.state;
    let check = prChecks.get(cacheKey);
    if (!check) {
      check = fetchPrState(pr).then(async (state) => {
        await bb.storage.kv.set(cacheKey, { state, checkedAt: Date.now() });
        return state;
      }, () => known?.state ?? null).finally(() => prChecks.delete(cacheKey));
      prChecks.set(cacheKey, check);
    }
    return check;
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
      const entry: FilePin = { id: randomUUID(), hostId, ...file, createdAt: new Date().toISOString() };
      return add(threadId, pins, entry);
    });
  };
  const pinUrl = async (threadId: string, input: string, title?: string) => {
    const url = parseWebUrl(input);
    if (!url) throw new Error("Only http(s) URLs can be pinned.");
    await thread(threadId);
    return serialize(async () => {
      await thread(threadId);
      const entry: UrlPin = { id: randomUUID(), kind: "url", url, name: urlPinName(url, title), createdAt: new Date().toISOString() };
      return add(threadId, await read(threadId), entry);
    }).then((entry) => {
      // Look the state up as the PR is pinned, so its icon is right the first time the strip shows it.
      const pr = githubPullRequest(entry.url);
      if (pr) void prState(pr);
      return entry;
    });
  };
  // Duplicates are idempotent; file and URL pins share one capacity.
  const add = async <T extends Pin>(threadId: string, pins: Pin[], entry: T): Promise<T> => {
    const existing = pins.find((item) => samePin(item, entry));
    if (existing) return existing as T;
    if (pins.length >= MAX_PINS) throw new Error(`A thread can hold up to ${MAX_PINS} pins. Remove one first.`);
    await save(threadId, [...pins, entry]);
    return entry;
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
      const result: Reference[] = pins.filter(isUrlPin);
      const files = pins.filter((pin): pin is FilePin => !isUrlPin(pin));
      for (const hostId of new Set(files.map((pin) => pin.hostId))) {
        const owned = files.filter((pin) => pin.hostId === hostId);
        const machine = hosts.find((item) => item.id === hostId);
        const facts = machine?.status === "connected"
          ? await host.call("inspect", { paths: owned.map((pin) => pin.path) }, { hostId }).catch(() => null)
          : null;
        for (const pinned of owned) {
          const fact = facts?.files.find((file) => file.path === pinned.path);
          result.push({ ...pinned, hostName: machine?.name ?? hostId, status: fact?.status ?? "unavailable" });
        }
      }
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
      const existing = pins.find((pin) => pin.id === undo.pin.id || samePin(pin, undo.pin));
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
        const current = pins[index];
        if (!current || isUrlPin(current)) throw new Error("This file is no longer pinned.");
        const existing = pins.find((pin) => pin.id !== pinId && !isUrlPin(pin) && pin.hostId === hostId && pin.path === file.path);
        const replacement = existing ?? { ...current, hostId, ...file };
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
    pinUrl: ({ threadId, url, title }) => pinUrl(threadId, url, title),
    icon: async ({ threadId, pinId }) => {
      const pinned = (await list(threadId)).pins.find((pin) => pin.id === pinId);
      return { dataUrl: pinned && isUrlPin(pinned) ? await icons.get(new URL(pinned.url).origin) : null };
    },
    prState: async ({ threadId, pinId }) => {
      const pinned = (await list(threadId)).pins.find((pin) => pin.id === pinId);
      const pr = pinned && isUrlPin(pinned) ? githubPullRequest(pinned.url) : null;
      return { state: pr ? await prState(pr) : null };
    },
    unpin: ({ threadId, pinId }) => removePin(threadId, pinId),
  });
  // Skills load on demand, so this always-on line points agents at the skill's proactive link-pinning rule.
  bb.agents.contributeInstructions(() => PROACTIVE_PIN_INSTRUCTIONS);
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
    summary: "Pin local files and links to threads",
    commands: {
      pin: cliCommand({
        summary: "Pin a file on its owning host, or an http(s) URL",
        positionals: [{ name: "path", required: true, description: "Absolute, ~/ or invoking-directory-relative file path, or an http(s) URL" }],
        options: {
          ...options,
          machine: { type: "string", aliases: ["host"], description: "File host ID; defaults to the invoking thread host, then target thread host" },
          title: { type: "string", description: "Label for a URL pin, such as the page title; defaults to the site and a short path" },
        },
        async run(input, ctx) {
          const threadId = target(input.options.thread, ctx.threadId);
          if (looksLikeUrl(input.positionals.path)) {
            const result = await pinUrl(threadId, input.positionals.path, input.options.title);
            return { exitCode: 0, stdout: input.options.json ? JSON.stringify(result) : `Pinned ${result.url}\n${result.id}` };
          }
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
        summary: "Remove a pin from the thread by ID without changing the file (works while the host is offline)",
        positionals: [{ name: "id", required: true, description: "Pin ID from list" }],
        options,
        async run(input, ctx) {
          const result = await removePin(target(input.options.thread, ctx.threadId), input.positionals.id);
          return { exitCode: 0, stdout: input.options.json ? JSON.stringify(result) : result.removed ? "Pin removed from the thread." : "Pin was already absent." };
        },
      }),
      list: cliCommand({
        summary: "List this thread's pins: files with their host IDs, and URLs",
        options,
        async run(input, ctx) {
          const result = await list(target(input.options.thread, ctx.threadId));
          return { exitCode: 0, stdout: input.options.json ? JSON.stringify(result) : result.pins.map((item) => isUrlPin(item) ? `${item.id}\turl\t${item.url}` : `${item.id}\t${item.hostId}\t${item.path}`).join("\n") || "Nothing pinned." };
        },
      }),
    },
  }));
}
