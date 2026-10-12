import { Markdown } from "@get-bb/plugin-sdk/app";
import type { Content, FollowUp } from "./model.js";

// Absolute paths live on the thread's host; bb serves them through its host-files route.
export function mediaUrl(threadId: string, src: string): string {
  if (/^https:\/\//i.test(src)) return src;
  return `/api/v1/threads/${encodeURIComponent(threadId)}/host-files/${src.slice(1).split("/").map(encodeURIComponent).join("/")}`;
}

// Images and screenshots the agent attached, linked to full size.
export function Media({ media, threadId }: { media?: Content["media"]; threadId: string }) {
  if (!media?.length) return null;
  return <div className="iac-media" data-count={media.length}>
    {media.map((image) => <a key={image.src} className="iac-figure" href={mediaUrl(threadId, image.src)} target="_blank" rel="noreferrer" title={image.caption ?? image.alt}>
      <img src={mediaUrl(threadId, image.src)} alt={image.alt} loading="lazy" />
      {image.caption && <span className="iac-caption">{image.caption}</span>}
    </a>)}
  </div>;
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
