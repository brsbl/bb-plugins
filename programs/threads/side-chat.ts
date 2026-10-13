import { useEffect, useMemo, useRef, useState } from "react";
import { useBbNavigate, useSdk, type ThreadChatMessageAction } from "@get-bb/plugin-sdk/app";
import { toast } from "sonner";
import { z } from "zod";

const createdSideChat = z.object({ threadId: z.string().min(1) });

/** Reuse Side chat's creation and ownership rules, then open its normal thread page. */
export function useSideChatActions(enabled: boolean): ThreadChatMessageAction[] {
  const { plugins } = useSdk();
  const { toThread } = useBbNavigate();
  const [available, setAvailable] = useState(false);
  const opening = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const refresh = () => {
      void plugins.list({ signal: controller.signal }).then(
        ({ plugins: installed }) => {
          if (!controller.signal.aborted) setAvailable(installed.some((plugin) => plugin.id === "side-chat" && plugin.enabled && plugin.status === "running"));
        },
        () => { if (!controller.signal.aborted) setAvailable(false); },
      );
    };
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      controller.abort();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, plugins]);

  return useMemo<ThreadChatMessageAction[]>(() => !enabled || !available ? [] : [{
    id: "reply-in-side-chat",
    title: "Reply in side chat",
    icon: "SideChat",
    async run(message) {
      if (opening.current) return;
      opening.current = true;
      try {
        const { threadId } = await plugins.callRpc({
          pluginId: "side-chat",
          method: "createSideChat",
          input: { sourceThreadId: message.threadId, sourceSeqEnd: message.sourceSeqEnd, anchorText: message.text },
          outputSchema: createdSideChat,
        });
        toThread(threadId);
      } catch (error) {
        toast.error(`Failed to start side chat: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        opening.current = false;
      }
    },
  }], [available, enabled, plugins, toThread]);
}
