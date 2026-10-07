import type { BbPluginApi } from "@get-bb/plugin-sdk";

import { createCli } from "./cli";
import { spacesRpc } from "./contract";
import { createService } from "./service";

const RECONCILE_INTERVAL_MS = 60_000;

function waitFor(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise<void>((resolveWait) => {
    if (signal.aborted) {
      resolveWait();
      return;
    }
    const done = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolveWait();
    };
    const timer = setTimeout(done, ms);
    signal.addEventListener("abort", done, { once: true });
  });
}

export default function plugin(bb: BbPluginApi): void {
  const service = createService(bb);

  bb.rpc.register(spacesRpc, service.rpc);
  bb.agents.configure((context) => service.agentConfiguration(context));
  bb.ui.registerMentionProvider(service.mentionProvider);
  bb.cli.register(createCli(service));

  for (const event of [
    "thread.created",
    "thread.active",
    "thread.failed",
    "thread.archived",
    "thread.unarchived",
    "thread.deleted",
    "interaction.pending",
  ] as const) {
    bb.events.on(event, ({ thread }) => service.touch(thread));
  }
  bb.events.on("thread.idle", ({ thread, lastAssistantText }) => service.onIdle(thread, lastAssistantText));

  // Section moves, renames, reads, and answered questions have no lifecycle event; bb reports them as thread changes.
  let unsubscribe = () => {};
  try {
    unsubscribe = bb.sdk.subscribe({ event: "thread:changed", callback: (event) => service.onThreadChanged(event) });
  } catch (error) {
    bb.log.warn(`Spaces can't follow thread changes live, so it relies on its periodic pass: ${String(error)}`);
  }

  // Learns current members, then catches anything the events missed, such as a thread dragged in while a refresh failed.
  bb.background.service("reconcile", {
    async start(signal) {
      await service.start();
      while (!signal.aborted) {
        await waitFor(RECONCILE_INTERVAL_MS, signal);
        if (signal.aborted) break;
        try {
          await service.periodic();
        } catch (error) {
          bb.log.warn(`Spaces periodic pass failed: ${String(error)}`);
        }
      }
    },
  });

  bb.onDispose(async () => {
    unsubscribe();
    await service.dispose();
  });
  bb.log.info("Spaces loaded");
}
