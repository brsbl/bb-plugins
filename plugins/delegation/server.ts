import { cliCommand, defineCli, PluginCliError, type BbPluginApi } from "@get-bb/plugin-sdk";
import { SETTINGS } from "./settings.js";
import { archiveCascade, formatCascade, formatChildren, listAll, summarizeChildren } from "./threads.js";

export default function plugin(bb: BbPluginApi): void {
  bb.settings.define(SETTINGS);

  const options = {
    thread: { type: "string", description: "Lead thread; defaults to the current thread" },
    json: { type: "boolean", description: "Emit JSON" },
  } as const;
  function target(explicit: string | undefined, current: string | undefined) {
    const value = explicit ?? current;
    if (!value) throw new PluginCliError("A thread is required.", { code: "thread_required", hint: "Pass --thread <thread-id>." });
    return value;
  }

  bb.cli.register(defineCli({
    name: "delegation",
    summary: "See a lead thread's workers and what archiving a thread would take with it",
    commands: {
      children: cliCommand({
        summary: "List a lead's workers, most urgent first: needs-input, error, host-offline, retry-queued, working, idle",
        options,
        async run(input, ctx) {
          const threadId = target(input.options.thread, ctx.threadId);
          const rows = await listAll(bb.sdk.threads.list, { parentThreadId: threadId, includeHidden: true, signal: ctx.signal });
          const children = summarizeChildren(rows);
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
