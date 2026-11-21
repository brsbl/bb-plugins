// The panel's side of @moss-multi/editor's file bridge: every call goes to the
// note's host through the plugin's RPC, external changes arrive over realtime
// and from the watch renewals, and media URLs carry the note's id.
import type { PluginRpcClient } from "@get-bb/plugin-sdk";
import type { NoteChanged, rpcContract } from "./contract";
import type * as Moss from "./vendor/moss-editor.contract.js";

/** Bytes per upload call; equal to contract.ts's ASSET_CHUNK_BYTES, which the panel does not import. */
export const UPLOAD_CHUNK_BYTES = 2 * 1024 * 1024;
/** How often an open editor renews its watch. The host lets one lapse after 60 seconds. */
export const WATCH_RENEW_MS = 15_000;
/** contract.ts's NOTE_CHANGED_CHANNEL, for the panel, which does not import the contract's schemas. */
export const EDITOR_NOTE_CHANGED = "editor-note-changed";

/** A realtime `editor-note-changed` payload, or null for anything else. */
export function asNoteChanged(payload: unknown): NoteChanged | null {
  if (!payload || typeof payload !== "object") return null;
  const { hostId, noteId, change } = payload as Record<string, unknown>;
  const kind = change && typeof change === "object" ? (change as { kind?: unknown }).kind : undefined;
  return typeof hostId === "string" && typeof noteId === "string" && (kind === "changed" || kind === "removed")
    ? (payload as NoteChanged)
    : null;
}

export interface EditorBridgeOptions {
  rpc: Pick<PluginRpcClient<typeof rpcContract>, "call">;
  hostId: string;
  /** The plugin route that serves note media. */
  assetRoute: string;
  /** The origin URLs are issued for, so a pasted URL from elsewhere is never taken for one of ours. */
  origin?: string;
  chunkBytes?: number;
  renewMs?: number;
}

export interface EditorBridge extends Moss.MossEditorBridge {
  /** Hands a realtime `editor-note-changed` payload to the watchers of its note. */
  deliver(payload: NoteChanged): void;
  /** Checks every watched note now, as when the panel regains focus or its connection returns. */
  refresh(): void;
  dispose(): void;
}

function base64(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

function uploadId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const ASSET_REF = /^assets\/[^/\\\0]+$/;

/**
 * A copy of a value the editor made, in this realm. The editor runs in its own
 * frame, so its objects carry that frame's Object.prototype, and bb's RPC client
 * refuses anything that is not a plain object of this realm.
 */
export function fromFrame<T>(value: T): T {
  return structuredClone(value);
}

export function createEditorBridge(options: EditorBridgeOptions): EditorBridge {
  const { rpc, hostId, assetRoute } = options;
  const chunkBytes = options.chunkBytes ?? UPLOAD_CHUNK_BYTES;
  const renewMs = options.renewMs ?? WATCH_RENEW_MS;
  const origin = options.origin ?? globalThis.location?.origin ?? "http://bb.invalid";
  const routePath = new URL(assetRoute, origin).pathname;

  interface Watch {
    listeners: Set<(change: Moss.MossExternalChange) => void>;
    /** The last change delivered, so a repeat is not delivered again. */
    last: string | null;
    timer: ReturnType<typeof setInterval>;
  }
  const watches = new Map<string, Watch>();

  function notify(noteId: string, change: Moss.MossExternalChange): void {
    const watch = watches.get(noteId);
    if (!watch) return;
    const serialized = JSON.stringify(change);
    if (serialized === watch.last) return;
    watch.last = serialized;
    for (const listener of watch.listeners) listener(change);
  }

  async function renew(noteId: string): Promise<void> {
    try {
      notify(noteId, await rpc.call("editorWatch", { hostId, noteId }));
    } catch {
      // The host is unreachable for now; the next renewal tries again.
    }
  }

  return {
    api: 1,
    features: [],

    read: (noteId) => rpc.call("editorRead", { hostId, noteId }),
    readCompanion: (noteId, relativePath) => rpc.call("editorReadCompanion", { hostId, noteId, relativePath }),
    write: (noteId, write) => rpc.call("editorWrite", { hostId, noteId, write: fromFrame(write) }),

    watch(noteId, listener) {
      let watch = watches.get(noteId);
      if (watch === undefined) {
        watch = { listeners: new Set(), last: null, timer: setInterval(() => void renew(noteId), renewMs) };
        watches.set(noteId, watch);
        // Never from inside `watch` itself.
        setTimeout(() => void renew(noteId), 0);
      }
      const current = watch;
      current.listeners.add(listener);
      return () => {
        current.listeners.delete(listener);
        if (current.listeners.size === 0 && watches.get(noteId) === current) {
          clearInterval(current.timer);
          watches.delete(noteId);
        }
      };
    },

    deliver(payload) {
      if (payload.hostId === hostId) notify(payload.noteId, payload.change);
    },

    refresh() {
      for (const noteId of watches.keys()) void renew(noteId);
    },

    dispose() {
      for (const watch of watches.values()) clearInterval(watch.timer);
      watches.clear();
    },

    assets: {
      async put(noteId, { name, data, mimeType }) {
        const upload = uploadId();
        let offset = 0;
        // At least one call, so even an empty file reaches the host's checks.
        do {
          const part = new Uint8Array(await data.slice(offset, offset + chunkBytes).arrayBuffer());
          const staged = await rpc.call("editorAssetChunk", { hostId, noteId, upload, offset, data: base64(part) });
          if (staged.kind !== "staged") return staged;
          offset += part.length;
        } while (offset < data.size);
        return rpc.call("editorAssetCommit", { hostId, noteId, upload, name, mimeType, size: data.size });
      },

      copyFromNote: (noteId, copy) => rpc.call("editorAssetCopy", { hostId, noteId, ...fromFrame(copy) }),

      url(noteId, ref) {
        const trimmed = ref.trim();
        // Web media keeps its own URL; note-local files stream from the note's host.
        if (/^(?:https?:|data:image\/)/i.test(trimmed)) return trimmed;
        if (trimmed === "" || /^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null;
        return `${assetRoute}?${new URLSearchParams({ host: hostId, id: noteId, ref: trimmed }).toString()}`;
      },

      parseUrl(url) {
        let parsed: URL;
        try {
          parsed = new URL(url, origin);
        } catch {
          return null;
        }
        if (parsed.origin !== new URL(origin).origin || parsed.pathname !== routePath) return null;
        const noteId = parsed.searchParams.get("id");
        const ref = parsed.searchParams.get("ref");
        // Only media this host's notes hold can be copied into a note on it.
        if (parsed.searchParams.get("host") !== hostId || !noteId || !ref || !ASSET_REF.test(ref)) return null;
        return { noteId, ref: ref as Moss.MossAssetRef };
      },
    },
  };
}
