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

// One field for a comment: it rides along with the decision, or Ask sends it now as a follow-up.
export function CommentField({ value, onChange, onAsk, onClose, disabled, busy, inputRef }: {
  value: string; onChange: (value: string) => void; onAsk: () => void; onClose: () => void;
  disabled: boolean; busy: boolean; inputRef: Ref<HTMLTextAreaElement>;
}) {
  return <div className="iac-note-entry">
    <textarea className="iac-note-field" ref={inputRef} aria-label="Comment" placeholder="Comment on your answer, or ask a question" value={value} rows={1} maxLength={1000} disabled={busy}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Escape") { event.preventDefault(); onClose(); }
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && value.trim()) { event.preventDefault(); onAsk(); }
      }} />
    <ActionButton className="iac-ask-button" disabled={disabled || !value.trim()} onClick={onAsk}>Ask</ActionButton>
  </div>;
}
