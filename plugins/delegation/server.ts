import { cliCommand, defineCli, PluginCliError, type BbPluginApi } from "@get-bb/plugin-sdk";
import { CHANGED, rpcContract } from "./contract.js";
import {
  DEFAULTS, SETTING_KEYS, effectiveSettings, isSettingKey, parseSettingValue, readOverrides,
  type DelegationSettings, type SettingKey, type SettingsOverrides,
} from "./settings.js";
import { archiveCascade, formatCascade, formatChildren, listAll, summarizeChildren, unarchived } from "./threads.js";

const SETTINGS_KEY = "settings";

export default function plugin(bb: BbPluginApi): void {
  // The raw stored object, kept whole so keys from another plugin version survive a save.
  async function stored(): Promise<Record<string, unknown>> {
    const value = await bb.storage.kv.get<unknown>(SETTINGS_KEY);
    return value !== null && typeof value === "object" && !Array.isArray(value) ? { ...value as Record<string, unknown> } : {};
  }
  async function overrides(): Promise<SettingsOverrides> {
    return readOverrides(await stored());
  }
  // One writer at a time, so concurrent saves from the form and the CLI don't drop a field.
  let queue: Promise<unknown> = Promise.resolve();
  function save(values: SettingsOverrides, reset: readonly string[] = []): Promise<DelegationSettings> {
    const run = queue.then(async () => {
      const next: Record<string, unknown> = { ...await stored(), ...values };
      for (const key of reset) if (isSettingKey(key)) delete next[key];
      // Storing only what differs from a default lets later default changes reach the user.
      for (const key of SETTING_KEYS) if (next[key] === DEFAULTS[key]) delete next[key];
      await bb.storage.kv.set(SETTINGS_KEY, next);
      const settings = effectiveSettings(next);
      bb.realtime.publish(CHANGED, settings);
      return settings;
    });
    queue = run.catch(() => undefined);
    return run;
  }

  bb.rpc.register(rpcContract, {
    async getSettings() { return effectiveSettings(await overrides()); },
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
  function formatSettings(settings: DelegationSettings, stored: SettingsOverrides): string {
    return SETTING_KEYS.map((key) => `${key}\t${JSON.stringify(settings[key])}${key in stored ? "" : "\t(default)"}`).join("\n");
  }

  bb.cli.register(defineCli({
    name: "delegation",
    summary: "Read Delegation settings, list a lead's workers, and see what archiving a thread takes with it",
    commands: {
      settings: cliCommand({
        summary: "Print the effective Delegation settings the skills follow",
        options: { json: options.json },
        async run(input) {
          const stored = await overrides();
          const settings = effectiveSettings(stored);
          return { exitCode: 0, stdout: input.options.json ? JSON.stringify(settings) : formatSettings(settings, stored) };
        },
      }),
      set: cliCommand({
        summary: "Change one Delegation setting",
        positionals: [
          { name: "key", required: true, description: "Setting name, as listed by `bb delegation settings`" },
          { name: "value", required: true, description: "New value; booleans take true or false" },
        ],
        options: { json: options.json },
        async run(input) {
          const key = settingKey(input.positionals.key);
          let values: SettingsOverrides;
          try { values = parseSettingValue(key, input.positionals.value); } catch {
            throw new PluginCliError(`"${input.positionals.value}" isn't a valid ${key}.`, { code: "invalid_value", hint: `Default: ${JSON.stringify(DEFAULTS[key])}.` });
          }
          const settings = await save(values);
          return { exitCode: 0, stdout: input.options.json ? JSON.stringify(settings) : `${key}\t${JSON.stringify(settings[key])}` };
        },
      }),
      reset: cliCommand({
        summary: "Return one Delegation setting to its default",
        positionals: [{ name: "key", required: true, description: "Setting name" }],
        options: { json: options.json },
        async run(input) {
          const key = settingKey(input.positionals.key);
          const settings = await save({}, [key]);
          return { exitCode: 0, stdout: input.options.json ? JSON.stringify(settings) : `${key}\t${JSON.stringify(settings[key])}\t(default)` };
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
