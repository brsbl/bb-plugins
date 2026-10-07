// bb's thread status glyph, mirrored from thread-list's ThreadStatusGlyph: the same icons, tones, and motion, with the
// host's accessible label on every glyph so status never rests on color alone.
import { experimental_Icon as Icon } from "@get-bb/plugin-sdk/app";

import type { GlyphKind } from "./model";

const WORKING_ACTIVITY_ICONS: Partial<Record<GlyphKind, string>> = {
  workflow: "Workflow",
  "background-agent": "UserRoundPlus",
  "background-command": "Terminal",
  "plan-mode": "ListTodo",
  goal: "Target",
};

const WAITING_ICONS: Partial<Record<GlyphKind, string>> = {
  "waiting-for-input": "CircleQuestion",
  "queued-waiting": "Clock",
};

const WORKING_TONE = "text-muted-foreground/50";

export function StatusGlyph({ kind, label }: { kind: GlyphKind; label: string | null }) {
  const a11y = label ? { "aria-label": label } : { "aria-hidden": true };
  switch (kind) {
    case "archived":
      return <Icon name="Archive" className="size-4 text-muted-foreground" {...a11y} />;
    case "unread-error":
    case "queued-failed":
    case "failed":
      return <Icon name="CircleX" className="size-4 text-destructive" {...a11y} />;
    case "waiting-for-input":
    case "queued-waiting":
      return <Icon name={WAITING_ICONS[kind] ?? "CircleQuestion"} className="size-4 text-muted-foreground/75" {...a11y} />;
    case "workflow":
    case "background-agent":
    case "background-command":
    case "plan-mode":
    case "goal":
      return (
        <Icon
          name={WORKING_ACTIVITY_ICONS[kind] ?? "Workflow"}
          className={`size-4 animate-shine-icon ${WORKING_TONE}`}
          {...a11y}
        />
      );
    case "runtime":
      return <Icon name="Loading" className={`size-4 animate-spin motion-reduce:animate-none ${WORKING_TONE}`} {...a11y} />;
    case "working-draft":
      return <Icon name="Edit" className={`size-4 animate-shine-icon ${WORKING_TONE}`} {...a11y} />;
    case "draft":
      return <Icon name="Edit" className="size-4 text-muted-foreground" {...a11y} />;
    case "unread-success":
      return <span role="img" className="size-[5px] rounded-full bg-muted-foreground/60" {...a11y} />;
    default:
      return null;
  }
}
