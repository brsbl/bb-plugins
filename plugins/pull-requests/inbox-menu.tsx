import { useEffect, useRef } from "react";
import { MoreHorizontal } from "lucide-react";

export type Sort = "updated" | "oldest" | "title";
type Props = {
  author: string; reviewer: string; sort: Sort; authors: string[]; reviewers: string[];
  reviewerDataIncomplete: boolean;
  onAuthor(value: string): void; onReviewer(value: string): void; onSort(value: Sort): void;
};
const people = (values: string[], selected: string) => [...new Set([...values, ...(selected && selected !== "@me" ? [selected] : [])])];

export function InboxMenu({ author, reviewer, sort, authors, reviewers, reviewerDataIncomplete, onAuthor, onReviewer, onSort }: Props) {
  const root = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const dismiss = (event: Event) => {
      const menu = root.current;
      if (!menu?.open) return;
      if (event.type === "keydown") {
        if ((event as KeyboardEvent).key !== "Escape") return;
        menu.open = false;
        menu.querySelector("summary")?.focus();
      } else if (!menu.contains(event.target as Node)) menu.open = false;
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", dismiss);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", dismiss); };
  }, []);
  const active = !!(author || reviewer);
  return <details ref={root} className="pr-list-options">
    <summary className={`pr-icon-button${active ? " pr-is-active" : ""}`} aria-label="Filters and sort" title="Filters and sort"><MoreHorizontal size={19} aria-hidden="true" /></summary>
    <div className="pr-options-panel">
      <label>Author<select value={author} onChange={(event) => onAuthor(event.target.value)}><option value="">All authors</option><option value="@me">Me</option>{people(authors, author).map((login) => <option key={login} value={login}>{login}</option>)}</select></label>
      <label>Reviewer<select value={reviewer} onChange={(event) => onReviewer(event.target.value)}><option value="">Anyone</option><option value="@me">Me</option>{people(reviewers, reviewer).map((login) => <option key={login} value={login}>{login}</option>)}</select></label>
      <label>Sort by<select value={sort} onChange={(event) => onSort(event.target.value as Sort)}><option value="updated">Recently updated</option><option value="oldest">Oldest updated</option><option value="title">Title A–Z</option></select></label>
      {active && <button type="button" className="pr-text-button" onClick={() => { onAuthor(""); onReviewer(""); }}>Clear filters</button>}
      {reviewer && reviewerDataIncomplete && <p className="pr-options-note">Some reviewer data is incomplete. Refresh to update it.</p>}
    </div>
  </details>;
}
