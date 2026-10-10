import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { Markdown } from "@get-bb/plugin-sdk/app";
import type { Content, FollowUp } from "./model.js";
import { ActionButton } from "./controls.js";

// Absolute paths live on the thread's host; bb serves them through its host-files route.
export function mediaUrl(threadId: string, src: string): string {
  if (/^https:\/\//i.test(src)) return src;
  return `/api/v1/threads/${encodeURIComponent(threadId)}/host-files/${src.slice(1).split("/").map(encodeURIComponent).join("/")}`;
}

// Context is bounded; a clipped preview opens in place when clicked.
export function Evidence({ content, threadId }: { content: Content; threadId: string }) {
  const { context, media } = content;
  if (!context && !media?.length) return null;
  return <div className="iac-evidence">
    {context && <Clipped><Markdown content={context} className="iac-context" /></Clipped>}
    {media && <div className="iac-media" data-count={media.length}>
      {media.map((image) => <a key={image.src} className="iac-figure" href={mediaUrl(threadId, image.src)} target="_blank" rel="noreferrer" title={image.caption ?? image.alt}>
        <img src={mediaUrl(threadId, image.src)} alt={image.alt} loading="lazy" />
        {image.caption && <span className="iac-caption">{image.caption}</span>}
      </a>)}
    </div>}
  </div>;
}

function Clipped({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [clipped, setClipped] = useState(false);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || open || typeof ResizeObserver === "undefined") return;
    const measure = () => setClipped(node.scrollHeight > node.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [open]);
  const expand = () => setOpen(true);
  return <div ref={ref} className="iac-clip" data-open={open || undefined} data-clipped={clipped && !open ? true : undefined}
    {...(clipped && !open ? {
      role: "button", tabIndex: 0, "aria-expanded": false, "aria-label": "Show all context",
      onClick: expand, onKeyDown: (event: KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); expand(); } },
    } : {})}>{children}</div>;
}

export function FollowUps({ items }: { items: FollowUp[] }) {
  if (!items.length) return null;
  return <ol className="iac-followups" aria-label="Follow-ups">
    {items.map((entry) => <li key={entry.commentId}>
      <p className="iac-ask">{entry.note}</p>
      {entry.answer ? <Markdown content={entry.answer} className="iac-answer" /> : <p className="iac-answer iac-muted iac-waiting">Waiting for an answer…</p>}
    </li>)}
  </ol>;
}

// A sticky note: the comment that rides along with an answer.
export function NoteIcon({ className = "iac-note-icon" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 20.5H7A2.5 2.5 0 0 1 4.5 18V6A2.5 2.5 0 0 1 7 3.5h10A2.5 2.5 0 0 1 19.5 6v9.5z" /><path d="M14.5 20.5v-3a2 2 0 0 1 2-2h3M8.5 8.5h7M8.5 12h4" /></svg>;
}
