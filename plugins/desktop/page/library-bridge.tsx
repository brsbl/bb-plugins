import { useComposer, useRealtime } from "@get-bb/plugin-sdk/app";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { LIBRARY_CHANNEL, PICTURE_MENTIONS, pictureMentionId, type LibraryKind } from "../library";

/** Calls one of the plugin's rpc methods from code outside bb's React tree, such as the note pad layer. */
export async function libraryCall<T>(method: string, input: unknown = null): Promise<T> {
  const response = await fetch(`/api/v1/plugins/desktop/rpc/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    credentials: "same-origin",
  });
  const body = (await response.json().catch(() => null)) as { ok?: boolean; result?: T; error?: { message?: string } } | null;
  if (body?.ok !== true) throw new Error(body?.error?.message ?? `Request failed (${response.status})`);
  return body.result as T;
}

interface ComposerTarget {
  composer: ReturnType<typeof useComposer>;
}

/** Composers the plugin can write to, newest last: the open thread's, or the new-thread composer on the home page. */
const targets: ComposerTarget[] = [];
const libraryListeners = new Set<(kind: LibraryKind) => void>();

export function onLibraryChange(listener: (kind: LibraryKind) => void): () => void {
  libraryListeners.add(listener);
  return () => libraryListeners.delete(listener);
}

/**
 * Puts a note pad or Paint picture into the message being written, as an @-mention the agent reads when the message
 * is sent.
 */
export function sendToThread(item: { kind: "notes" | "pictures"; id: string; label: string }): boolean {
  const target = targets.at(-1);
  if (target === undefined) {
    toast("Open a thread or the home page, then send it again.");
    return false;
  }
  const { composer } = target;
  const scope = composer.scope;
  const id =
    item.kind === PICTURE_MENTIONS
      ? pictureMentionId(item.id, {
          threadId: scope.kind === "new-thread" ? null : scope.kind === "side-chat" ? scope.childThreadId : scope.threadId,
          projectId: "projectId" in scope ? scope.projectId : null,
        })
      : item.id;
  composer.insertMention({ provider: item.kind, id, label: item.label });
  composer.focus();
  toast(`Added ${item.label} to your message`);
  return true;
}

/**
 * Lives wherever the plugin renders inside bb (the Desktop and each thread's header), so code outside bb's tree can
 * reach the current composer and hear when notes or pictures change.
 */
export function LibraryBridge() {
  const composer = useComposer();
  const target = useRef<ComposerTarget>({ composer });
  target.current.composer = composer;

  useEffect(() => {
    const entry = target.current;
    targets.push(entry);
    return () => {
      const index = targets.indexOf(entry);
      if (index !== -1) targets.splice(index, 1);
    };
  }, []);

  useRealtime(LIBRARY_CHANNEL, (payload) => {
    const kind = (payload as { kind?: unknown } | null)?.kind;
    if (kind !== "notes" && kind !== "pictures") return;
    for (const listener of libraryListeners) listener(kind);
  });

  return null;
}
