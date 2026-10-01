export type ThreadTabKind = "browser" | "terminal";

/** What a window shows. Persisted verbatim in `bb-desktop:windows:v1`, so fields are a stored contract. */
export type WindowSpec =
  | { kind: "finder"; key: string }
  | { kind: "thread"; threadId: string }
  | { kind: "panel"; threadId: string }
  | { kind: "buddy-list"; threadId: string }
  | { kind: "thread-tab"; threadId: string; tab: ThreadTabKind; tabId: string }
  | { kind: "threads" }
  | { kind: "recycle-bin" }
  | { kind: "more" }
  | { kind: "minesweeper" }
  | { kind: "solitaire" }
  | { kind: "pinball" }
  | { kind: "command-prompt" }
  | { kind: "paint" }
  | { kind: "internet-explorer" }
  | { kind: "app"; key: string }
  | { kind: "new-folder" }
  | { kind: "media-player" }
  | { kind: "new-thread"; groupKey: string | null };

export type WindowKind = WindowSpec["kind"];
export type SpecOf<K extends WindowKind> = Extract<WindowSpec, { kind: K }>;

/** One window per id: opening a spec whose id is already open focuses that window instead. */
export function windowId(spec: WindowSpec): string {
  switch (spec.kind) {
    case "finder":
      return `finder:${spec.key}`;
    case "thread":
    case "panel":
    case "buddy-list":
      return `${spec.kind}:${spec.threadId}`;
    case "thread-tab":
      return `thread-tab:${spec.tabId}`;
    case "new-thread":
      return `new-thread:${spec.groupKey ?? "desktop"}`;
    case "app":
      return `app:${spec.key}`;
    default:
      return spec.kind;
  }
}

/** The thread a window belongs to, if any; archiving a thread closes all of them. */
export function threadIdOf(spec: WindowSpec): string | null {
  return spec.kind === "thread" || spec.kind === "panel" || spec.kind === "buddy-list" || spec.kind === "thread-tab" ? spec.threadId : null;
}

const SIMPLE_KINDS: ReadonlySet<string> = new Set([
  "threads",
  "recycle-bin",
  "more",
  "minesweeper",
  "solitaire",
  "pinball",
  "command-prompt",
  "paint",
  "internet-explorer",
  "media-player",
] satisfies WindowKind[]);

/**
 * Reads a stored spec. Form windows (`new-folder`, `new-thread`) are deliberately not restored,
 * so they are dropped here and never persisted.
 */
export function parseSpec(value: unknown): WindowSpec | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const text = (key: string) => (typeof record[key] === "string" ? (record[key] as string) : null);
  const kind = record.kind;
  switch (kind) {
    case "finder":
    case "app": {
      const key = text("key");
      return key === null ? null : { kind, key };
    }
    case "thread":
    case "panel":
    case "buddy-list": {
      const threadId = text("threadId");
      return threadId === null ? null : { kind, threadId };
    }
    case "thread-tab": {
      const threadId = text("threadId");
      const tabId = text("tabId");
      const tab = record.tab;
      return threadId === null || tabId === null || (tab !== "browser" && tab !== "terminal")
        ? null
        : { kind, threadId, tab, tabId };
    }
    default:
      return typeof kind === "string" && SIMPLE_KINDS.has(kind) ? ({ kind } as WindowSpec) : null;
  }
}
