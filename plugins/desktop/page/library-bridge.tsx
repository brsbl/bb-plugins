import { experimental_useSidebarThreads as useSidebarThreads, useComposer, useRealtime } from "@get-bb/plugin-sdk/app";
import { useEffect, useRef, useSyncExternalStore } from "react";
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
  /** The bridge's element inside the message box, to tell which box a click or keystroke belongs to. */
  anchor: HTMLElement | null;
  /** A thread window on the Desktop, as opposed to the page's own message box. */
  inWindow: boolean;
  /** Shown in "Send to …". */
  label: string;
}

/** Every message box on screen: the page's own, and each thread window's. */
const targets: ComposerTarget[] = [];
/** The message box the user last clicked or typed in. */
let active: ComposerTarget | null = null;
const targetListeners = new Set<() => void>();
const libraryListeners = new Set<(kind: LibraryKind) => void>();

function emitTarget() {
  for (const listener of targetListeners) listener();
}

export function onLibraryChange(listener: (kind: LibraryKind) => void): () => void {
  libraryListeners.add(listener);
  return () => libraryListeners.delete(listener);
}

/** Where Send to thread writes: the active box while it is still on screen, else the page's own. */
function currentTarget(): ComposerTarget | null {
  if (active !== null && targets.includes(active)) return active;
  return targets.filter((target) => !target.inWindow).at(-1) ?? targets.at(-1) ?? null;
}

/** "Send to “Quick question”", naming where Send to thread will write. */
export function useSendLabel(): string {
  return useSyncExternalStore(
    (listener) => {
      targetListeners.add(listener);
      return () => targetListeners.delete(listener);
    },
    () => {
      const target = currentTarget();
      return target === null ? "Send to thread" : `Send to ${target.label}`;
    },
  );
}

function depth(node: Node | null): number {
  let count = 0;
  for (let current = node; current !== null; current = current.parentNode) count += 1;
  return count;
}

/** How deep the nearest element holding both nodes sits; deeper means the two are closer together. */
function closeness(a: Node, b: Node): number {
  let shared: Node | null = a;
  while (shared !== null && !shared.contains(b)) shared = shared.parentNode;
  return depth(shared);
}

/**
 * Follows the user's attention: clicking into a thread window, or into a page's message box, makes that the box Send
 * to thread writes to. Note pads and Paint never change it, since that is where the user clicks Send.
 */
function trackActive(event: Event) {
  const element = event.target instanceof Element ? event.target : null;
  if (element === null || element.closest(".bbd-notes-layer, .bbd-paint")) return;
  const window = element.closest(".bbd-window");
  let next: ComposerTarget | null = null;
  if (window !== null) {
    next = targets.find((target) => target.inWindow && target.anchor !== null && window.contains(target.anchor)) ?? null;
  } else if (element.closest("[contenteditable=true], textarea") !== null) {
    let best = -1;
    for (const target of targets) {
      if (target.inWindow || target.anchor === null) continue;
      const score = closeness(element, target.anchor);
      if (score > best) {
        best = score;
        next = target;
      }
    }
  }
  if (next !== null && next !== active) {
    active = next;
    emitTarget();
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("focusin", trackActive, true);
  document.addEventListener("pointerdown", trackActive, true);
}

/**
 * Puts a note pad or Paint picture into the active message box as an @-mention the agent reads when the message is
 * sent.
 */
export function sendToThread(item: { kind: "notes" | "pictures"; id: string; label: string }): boolean {
  const target = currentTarget();
  if (target === null) {
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
  toast(`Added ${item.label} to ${target.label}`);
  return true;
}

/** Lives inside every message box, through a composer customization, so Send to thread can write to that box. */
export function ComposerBridge() {
  const composer = useComposer();
  const { threads } = useSidebarThreads();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const scope = composer.scope;
  const threadId = scope.kind === "new-thread" ? null : scope.kind === "side-chat" ? scope.childThreadId : scope.threadId;
  const title = threadId === null ? null : (threads.find((thread) => thread.id === threadId)?.displayTitle ?? null);
  const label = scope.kind === "new-thread" ? "new thread" : `“${title ?? "this thread"}”`;
  const target = useRef<ComposerTarget>({ composer, anchor: null, inWindow: false, label });
  target.current.composer = composer;

  useEffect(() => {
    const entry = target.current;
    entry.anchor = anchorRef.current;
    entry.inWindow = anchorRef.current?.closest(".bbd-window") != null;
    targets.push(entry);
    // A thread window that just opened is where the user is working.
    if (entry.inWindow) active = entry;
    emitTarget();
    return () => {
      const index = targets.indexOf(entry);
      if (index !== -1) targets.splice(index, 1);
      if (active === entry) active = null;
      emitTarget();
    };
  }, []);

  useEffect(() => {
    if (target.current.label === label) return;
    target.current.label = label;
    emitTarget();
  }, [label]);

  return <span ref={anchorRef} hidden aria-hidden data-bbd-composer-bridge={scope.kind} />;
}

/**
 * Lives where the plugin renders inside bb (the Desktop and each thread's header) and tells code outside bb's tree,
 * such as the note pad layer, when notes or pictures change.
 */
export function LibrarySync() {
  useRealtime(LIBRARY_CHANNEL, (payload) => {
    const kind = (payload as { kind?: unknown } | null)?.kind;
    if (kind !== "notes" && kind !== "pictures") return;
    for (const listener of libraryListeners) listener(kind);
  });
  return null;
}
