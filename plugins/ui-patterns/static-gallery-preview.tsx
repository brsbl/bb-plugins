import type { AtlasEntry } from "./providers/schema.js";

type PreviewKind =
  | "choice"
  | "collection"
  | "feedback"
  | "field"
  | "message"
  | "navigation"
  | "overlay"
  | "control";

const keywordGroups: readonly [PreviewKind, readonly string[]][] = [
  ["message", ["assistant", "attachment", "branch", "composer", "message", "suggestion", "thread"]],
  ["overlay", ["command", "context menu", "dialog", "drawer", "hover card", "menu", "modal", "popover", "sheet", "tooltip"]],
  ["field", ["autocomplete", "combobox", "date picker", "field", "form", "input", "otp", "search", "select", "textarea"]],
  ["choice", ["checkbox", "radio", "slider", "switch", "toggle"]],
  ["navigation", ["breadcrumb", "menubar", "navigation", "pagination", "sidebar", "tabs"]],
  ["feedback", ["alert", "empty", "error", "meter", "progress", "skeleton", "spinner", "toast"]],
  ["collection", ["accordion", "calendar", "card", "carousel", "chart", "list", "table", "tree"]],
];

export function staticPreviewKind(entry: AtlasEntry): PreviewKind {
  const text = [entry.name, ...entry.aliases].join(" ").toLocaleLowerCase();
  return keywordGroups.find(([, keywords]) =>
    keywords.some((keyword) => text.includes(keyword)),
  )?.[0] ?? "control";
}

function PreviewShape({ kind }: { kind: PreviewKind }) {
  if (kind === "message") {
    return (
      <div className="grid w-full gap-2">
        <span className="h-6 w-2/3 rounded-lg bg-muted" />
        <span className="ml-auto h-6 w-1/2 rounded-lg bg-foreground/15" />
        <span className="mt-1 h-8 rounded-lg border border-border bg-background" />
      </div>
    );
  }
  if (kind === "overlay") {
    return (
      <div className="grid h-24 w-full place-items-center rounded-lg border border-border/70 bg-muted/40 p-3">
        <span className="grid h-14 w-3/4 content-center gap-2 rounded-md border border-border bg-background px-3 shadow-sm">
          <span className="h-2 w-2/3 rounded-full bg-foreground/20" />
          <span className="h-2 w-full rounded-full bg-muted" />
        </span>
      </div>
    );
  }
  if (kind === "field") {
    return (
      <div className="grid w-full gap-2">
        <span className="h-2 w-1/3 rounded-full bg-foreground/20" />
        <span className="h-9 rounded-md border border-border bg-background" />
        <span className="ml-auto h-7 w-20 rounded-md bg-foreground/15" />
      </div>
    );
  }
  if (kind === "choice") {
    return (
      <div className="grid w-full gap-3">
        {["w-3/4", "w-2/3", "w-4/5"].map((width) => (
          <span key={width} className="flex items-center gap-2">
            <span className="size-4 rounded border border-border bg-background" />
            <span className={`h-2 rounded-full bg-foreground/20 ${width}`} />
          </span>
        ))}
      </div>
    );
  }
  if (kind === "navigation") {
    return (
      <div className="grid w-full gap-3">
        <span className="flex gap-2 border-b border-border pb-2">
          <span className="h-3 w-14 rounded-full bg-foreground/30" />
          <span className="h-3 w-12 rounded-full bg-muted-foreground/15" />
          <span className="h-3 w-16 rounded-full bg-muted-foreground/15" />
        </span>
        <span className="h-12 rounded-md bg-muted/60" />
      </div>
    );
  }
  if (kind === "feedback") {
    return (
      <div className="grid w-full gap-3 rounded-lg border border-border bg-background p-3">
        <span className="flex items-center gap-2">
          <span className="size-5 rounded-full bg-foreground/15" />
          <span className="h-2 w-1/2 rounded-full bg-foreground/25" />
        </span>
        <span className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <span className="block h-full w-2/3 rounded-full bg-foreground/20" />
        </span>
      </div>
    );
  }
  if (kind === "collection") {
    return (
      <div className="grid w-full grid-cols-3 gap-2">
        {[0, 1, 2].map((index) => (
          <span key={index} className="grid h-20 content-end rounded-md border border-border bg-background p-2">
            <span className="h-2 rounded-full bg-foreground/20" />
          </span>
        ))}
      </div>
    );
  }
  return (
    <span className="grid h-9 min-w-24 place-items-center rounded-md bg-foreground/15 px-5">
      <span className="h-2 w-12 rounded-full bg-foreground/30" />
    </span>
  );
}

export function StaticGalleryPreview({ entry }: { entry: AtlasEntry }) {
  const kind = staticPreviewKind(entry);
  return (
    <div
      className="grid h-40 place-items-center border-t border-border bg-muted/20 p-5"
      data-static-gallery-preview=""
      data-static-preview-kind={kind}
      aria-hidden="true"
    >
      <PreviewShape kind={kind} />
    </div>
  );
}
