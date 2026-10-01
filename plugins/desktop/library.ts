/**
 * Note pads and Paint pictures kept by the Desktop plugin's server, so agents can read them through @-mentions and
 * tools. Shared by the server and the app.
 */

export interface StickyNote {
  id: string;
  text: string;
  side: "left" | "right";
  x: number;
  y: number;
  width: number;
  height: number;
  tone: number;
  /** Saved note pads keep a Desktop icon and survive closing. */
  saved?: boolean;
  /** A saved note pad whose window is closed; its Desktop icon reopens it. */
  hidden?: boolean;
  /** When the note last changed, in ms; the newer copy wins when two devices edit it. */
  updatedAt?: number;
}

export interface PictureSummary {
  id: string;
  name: string;
  width: number;
  height: number;
  /** Pictures drawn in Paint are PNG; pictures an agent made start as SVG until Paint saves them. */
  format: "png" | "svg";
  updatedAt: number;
}

export interface Picture extends PictureSummary {
  mimeType: string;
  dataBase64: string;
}

/** Mention providers, as registered with `bb.ui.registerMentionProvider`. */
export const NOTE_MENTIONS = "notes";
export const PICTURE_MENTIONS = "pictures";

/** The realtime channel for library changes; desktop thread changes keep their own `changed` channel. */
export const LIBRARY_CHANNEL = "library";
export type LibraryKind = "notes" | "pictures";

export const NOTE_DEFAULTS = { side: "right", x: 16, y: 72, width: 360, height: 260, tone: 0 } as const;

/** The note's first line, like a saved file name. */
export function noteTitle(text: string): string {
  return text.trim().split("\n")[0]?.trim().slice(0, 40) || "Untitled";
}

/**
 * A picture mention carries where its message is going, `<pictureId>@<threadId or projectId>`, because a mention
 * resolves from its id alone and the picture is attached to that thread's project.
 */
export function pictureMentionId(pictureId: string, target: { threadId?: string | null; projectId?: string | null }): string {
  const scope = target.threadId ?? target.projectId ?? null;
  return scope === null ? pictureId : `${pictureId}@${scope}`;
}

export function parsePictureMentionId(itemId: string): { pictureId: string; threadId: string | null; projectId: string | null } {
  const at = itemId.indexOf("@");
  if (at === -1) return { pictureId: itemId, threadId: null, projectId: null };
  const pictureId = itemId.slice(0, at);
  const scope = itemId.slice(at + 1);
  return scope.startsWith("thr_")
    ? { pictureId, threadId: scope, projectId: null }
    : { pictureId, threadId: null, projectId: scope };
}
