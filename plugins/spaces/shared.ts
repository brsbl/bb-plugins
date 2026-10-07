// Constants and pure helpers shared by the Spaces server, app, and tests. No SDK imports, so the app bundle can
// import this at runtime.

export const PLUGIN_ID = "spaces";

/** Server publishes `{ sectionIds }` here whenever a Space or one of its members changes. */
export const REALTIME_CHANNEL = "spaces";

/** The `threadPanelAction` id of the Space tab. */
export const PANEL_ACTION_ID = "space";

/** The mention provider id for @-mentioning a Space. */
export const MENTION_PROVIDER_ID = "space";

/** Thread Organizer's plugin id and the RPC method it serves to Spaces. */
export const ORGANIZER_PLUGIN_ID = "thread-organizer";
export const ORGANIZER_SPACES_METHOD = "spacesSupport";
/** Thread Organizer renames a Space through its stage title, since section names follow stage titles. */
export const ORGANIZER_RENAME_METHOD = "renameSpace";

/** bb's bundled sidebar list, which owns the `hiddenGroups` (More) preference. */
export const THREAD_LIST_PLUGIN_ID = "thread-list";

/** How many idle members the panel shows before folding the rest into "N more idle". */
export const IDLE_PREVIEW_COUNT = 3;

/** Longest latest-output excerpt the server sends, in characters. */
export const EXCERPT_MAX_LENGTH = 280;

/**
 * Where a member sorts in the Space tab, most urgent first.
 * - needs-you: waiting on input, or failed and not yet read
 * - working: running a turn
 * - new: unread output
 * - idle: everything else that isn't archived
 * - archived: archived members, folded at the bottom
 */
export const MEMBER_GROUPS = ["needs-you", "working", "new", "idle", "archived"] as const;
export type MemberGroup = (typeof MEMBER_GROUPS)[number];

export const MEMBER_GROUP_LABELS: Record<MemberGroup, string> = {
  "needs-you": "Needs you",
  working: "Working",
  new: "New output",
  idle: "Idle",
  archived: "Archived",
};

export interface MemberStateInput {
  archived: boolean;
  hasPendingInteraction: boolean;
  failed: boolean;
  running: boolean;
  isUnread: boolean;
}

/** One rule for every surface: the server snapshot, the live panel, and the More controller. */
export function memberGroup(state: MemberStateInput): MemberGroup {
  if (state.archived) return "archived";
  if (state.hasPendingInteraction) return "needs-you";
  if (state.failed && state.isUnread) return "needs-you";
  if (state.running) return "working";
  if (state.isUnread) return "new";
  return "idle";
}

/** A Space has news, and should come out of More, when any live member needs you or has unread output. */
export function spaceHasNews(groups: readonly MemberGroup[]): boolean {
  return groups.some((group) => group === "needs-you" || group === "new");
}

/** The sidebar `hiddenGroups` key for a section. */
export function hiddenGroupKey(sectionId: string): string {
  return `section:${sectionId}`;
}

/** Turn agent Markdown into one plain line for a card excerpt. */
export function plainExcerpt(markdown: string, maxLength = EXCERPT_MAX_LENGTH): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/@thread:(thr_[a-z0-9]+)/gi, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Thread Organizer's `spacesSupport` answer: it understands Spaces, and which sections are its inboxes. */
export interface OrganizerSpacesSupport {
  version: 1;
  inboxSectionIds: string[];
  /** Sections whose Thread Organizer entry prompt pauses while they are a Space. */
  entryPromptSectionIds: string[];
}
