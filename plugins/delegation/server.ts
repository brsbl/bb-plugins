import { cliCommand, defineCli, PluginCliError, type BbPluginApi } from "@get-bb/plugin-sdk";
import { CHANGED, rpcContract } from "./contract.js";
import {
  FALLBACKS, SETTING_KEYS, isSettingKey, parseSettingValue, resolve, settingsSchema, sourceSchema,
  type DelegationState, type SettingKey, type SettingsOverrides,
} from "./settings.js";
import { archiveCascade, formatCascade, formatChildren, listAll, summarizeChildren, unarchived } from "./threads.js";

const OVERRIDES_KEY = "settings";
const SOURCES_KEY = "sources";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export default function plugin(bb: BbPluginApi): void {
  // Raw stored objects, kept whole so keys from another plugin version survive a save.
  async function raw(key: string): Promise<Record<string, unknown>> {
    const value = await bb.storage.kv.get<unknown>(key);
    return isRecord(value) ? { ...value } : {};
  }
  async function state(): Promise<DelegationState> {
    return resolve(await raw(OVERRIDES_KEY), await raw(SOURCES_KEY));
  }
  // One writer at a time, so concurrent saves from the form and the CLI don't drop a field.
  let queue: Promise<unknown> = Promise.resolve();
  function serialize(write: () => Promise<void>): Promise<DelegationState> {
    const run = queue.then(async () => {
      await write();
      const next = await state();
      bb.realtime.publish(CHANGED, next);
      return next;
    });
    queue = run.catch(() => undefined);
    return run;
  }
  function save(values: SettingsOverrides, reset: readonly string[] = []): Promise<DelegationState> {
    return serialize(async () => {
      const next: Record<string, unknown> = { ...await raw(OVERRIDES_KEY), ...values };
      for (const key of reset) if (isSettingKey(key)) delete next[key];
      await bb.storage.kv.set(OVERRIDES_KEY, next);
    });
  }
  function recordSource(key: SettingKey | null, entry: unknown): Promise<DelegationState> {
    return serialize(async () => {
      const stored = await raw(SOURCES_KEY);
      const values: Record<string, unknown> = isRecord(stored.values) ? { ...stored.values } : {};
      if (key === null) for (const name of Object.keys(values)) delete values[name];
      else if (entry === undefined) delete values[key];
      else values[key] = entry;
      await bb.storage.kv.set(SOURCES_KEY, { ...stored, values, checkedAt: Date.now() });
    });
  }

  bb.rpc.register(rpcContract, {
    async getState() { return state(); },
    async saveSettings({ values, reset }) { return save(values, reset); },
  });

  const options = {
    thread: { type: "string", description: "Lead thread; defaults to the current thread" },
    json: { type: "boolean", description: "Emit JSON" },
  } as const;
  function target(explicit: string | undefined, current: string | undefined) {
    const value = explicit ?? current;
    if (!value) throw new PluginCliError("A thread is required.", { code: "thread_required", hint: "Pass --thread <thread-id>." });
    return value;
  }
  function settingKey(value: string): SettingKey {
    if (isSettingKey(value)) return value;
    throw new PluginCliError(`Unknown setting "${value}".`, { code: "unknown_setting", hint: `Settings: ${SETTING_KEYS.join(", ")}.` });
  }
  function formatSettings(current: DelegationState): string {
    return SETTING_KEYS.map((key) => {
      const entry = current.explain[key]!;
      const origin = entry.origin === "source" ? `from ${entry.source}` : entry.origin;
      const ignored = entry.ignoredOverride !== undefined ? `\t(override ${JSON.stringify(entry.ignoredOverride)} ignored)` : "";
      return `${key}\t${JSON.stringify(entry.value)}\t${origin}${ignored}`;
    }).join("\n");
  }
  function invalid(key: SettingKey, value: string): never {
    throw new PluginCliError(`"${value}" isn't a valid ${key}.`, { code: "invalid_value", hint: `Fallback: ${JSON.stringify(FALLBACKS[key])}.` });
  }

  bb.cli.register(defineCli({
    name: "delegation",
    summary: "Read Delegation settings and their sources, list a lead's workers, and see what archiving a thread takes with it",
    commands: {
      settings: cliCommand({
        summary: "Print the effective Delegation settings the skills follow; --explain adds where each comes from",
        options: { json: options.json, explain: { type: "boolean", description: "Include each value's origin and quoted source" } },
        async run(input) {
          const current = await state();
          if (!input.options.json) return { exitCode: 0, stdout: formatSettings(current) };
          return { exitCode: 0, stdout: JSON.stringify(input.options.explain ? current : current.settings) };
        },
      }),
      set: cliCommand({
        summary: "Save an override for one setting; a recorded source still wins",
        positionals: [
          { name: "key", required: true, description: "Setting name, as listed by `bb delegation settings`" },
          { name: "value", required: true, description: "New value; booleans take true or false" },
        ],
        options: { json: options.json },
        async run(input) {
          const key = settingKey(input.positionals.key);
          let values: SettingsOverrides;
          try { values = parseSettingValue(key, input.positionals.value); } catch { invalid(key, input.positionals.value); }
          const next = await save(values);
          if (input.options.json) return { exitCode: 0, stdout: JSON.stringify(next.settings) };
          const entry = next.explain[key]!;
          const note = entry.origin === "source" ? `\tsaved, but ${entry.source} sets ${JSON.stringify(entry.value)} and wins` : "";
          return { exitCode: 0, stdout: `${key}\t${JSON.stringify(next.settings[key])}${note}` };
        },
      }),
      reset: cliCommand({
        summary: "Remove the override for one setting",
        positionals: [{ name: "key", required: true, description: "Setting name" }],
        options: { json: options.json },
        async run(input) {
          const key = settingKey(input.positionals.key);
          const next = await save({}, [key]);
          return { exitCode: 0, stdout: input.options.json ? JSON.stringify(next.settings) : `${key}\t${JSON.stringify(next.settings[key])}\t${next.explain[key]!.origin}` };
        },
      }),
      sources: cliCommand({
        summary: "Print the values recorded from the user's instructions, with their quotes",
        options: { json: options.json },
        async run(input) {
          const current = await state();
          const entries = SETTING_KEYS.filter((key) => current.explain[key]!.origin === "source");
          if (input.options.json) return { exitCode: 0, stdout: JSON.stringify({ checkedAt: current.checkedAt, sources: Object.fromEntries(entries.map((key) => [key, current.explain[key]])) }) };
          if (current.checkedAt === null) return { exitCode: 0, stdout: "No sources recorded yet. Use the delegation-defaults skill." };
          const lines = entries.map((key) => { const entry = current.explain[key]!; return `${key}\t${JSON.stringify(entry.value)}\t${entry.source}\t"${entry.quote}"`; });
          return { exitCode: 0, stdout: [`Checked ${new Date(current.checkedAt).toISOString()}`, ...lines].join("\n") };
        },
      }),
      record: cliCommand({
        summary: "Record the value the user's instructions set for one setting, with the file and exact quote",
        positionals: [
          { name: "key", required: true, description: "Setting name" },
          { name: "value", required: true, description: "The value those instructions imply" },
        ],
        options: {
          json: options.json,
          from: { type: "string", description: "Where the rule lives, such as ~/.bb/AGENTS.md or skill:spawn (required)" },
          quote: { type: "string", description: "The user's exact words (required)" },
          note: { type: "string", description: "Which other source disagrees, and why this one wins" },
        },
        async run(input) {
          const key = settingKey(input.positionals.key);
          let value: unknown;
          try { value = parseSettingValue(key, input.positionals.value)[key]; } catch { invalid(key, input.positionals.value); }
          const entry = sourceSchema.safeParse({ value, source: input.options.from, quote: input.options.quote, ...(input.options.note ? { note: input.options.note } : {}) });
          if (!entry.success || !settingsSchema.shape[key].safeParse(value).success) {
            throw new PluginCliError("A source needs --from and --quote.", { code: "invalid_source", hint: "Quote the user's words exactly, from the file named in --from." });
          }
          const next = await recordSource(key, entry.data);
          return { exitCode: 0, stdout: input.options.json ? JSON.stringify(next.explain[key]) : `${key}\t${JSON.stringify(next.settings[key])}\tfrom ${entry.data.source}` };
        },
      }),
      forget: cliCommand({
        summary: "Remove one recorded source, or every one with --all",
        positionals: [{ name: "key", required: false, description: "Setting name" }],
        options: { all: { type: "boolean", description: "Remove every recorded source" } },
        async run(input) {
          if (!input.options.all && !input.positionals.key) throw new PluginCliError("Name a setting or pass --all.", { code: "key_required" });
          const next = await recordSource(input.options.all ? null : settingKey(input.positionals.key!), undefined);
          return { exitCode: 0, stdout: input.options.all ? "Forgot every source." : `${input.positionals.key}\t${JSON.stringify(next.settings[input.positionals.key as SettingKey])}\t${next.explain[input.positionals.key!]!.origin}` };
        },
      }),
      children: cliCommand({
        summary: "List a lead's workers, most urgent first: needs-input, error, host-offline, retry-queued, working, idle",
        options,
        async run(input, ctx) {
          const threadId = target(input.options.thread, ctx.threadId);
          const rows = await listAll(bb.sdk.threads.list, { parentThreadId: threadId, includeHidden: true, signal: ctx.signal });
          const children = summarizeChildren(unarchived(rows));
          return { exitCode: 0, stdout: input.options.json ? JSON.stringify({ threadId, children }) : formatChildren(children) };
        },
      }),
      cascade: cliCommand({
        summary: "List every thread `bb thread archive` would also archive: children, lifecycle-owned threads, and hidden forks, recursively",
        options,
        async run(input, ctx) {
          const threadId = target(input.options.thread, ctx.threadId);
          const rows = await listAll(bb.sdk.threads.list, { includeHidden: true, signal: ctx.signal });
          const threads = archiveCascade(threadId, rows);
          return { exitCode: 0, stdout: input.options.json ? JSON.stringify({ threadId, threads }) : formatCascade(threadId, threads) };
        },
      }),
    },
  }));
}
