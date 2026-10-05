import { useEffect, useRef } from "react";
import { MoreHorizontal } from "lucide-react";

export type Sort = "updated" | "oldest" | "title";
export type GroupBy = "none" | "project" | "section";
export const DEFAULT_AUTHOR = "@me";
type Props = {
  author: string; reviewer: string; sort: Sort; groupBy: GroupBy; authors: string[]; reviewers: string[]; me: string | null;
  reviewerDataIncomplete: boolean;
  onAuthor(value: string): void; onReviewer(value: string): void; onSort(value: Sort): void; onGroupBy(value: GroupBy): void;
};
/** "Me" already covers the signed-in account, so it is not repeated by login. */
const people = (values: string[], selected: string, me: string | null) => [...new Set([...values, ...(selected && selected !== "@me" ? [selected] : [])])]
  .filter((login) => login.toLowerCase() !== me?.toLowerCase());

export function InboxMenu({ author, reviewer, sort, groupBy, authors, reviewers, me, reviewerDataIncomplete, onAuthor, onReviewer, onSort, onGroupBy }: Props) {
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
  const active = author !== DEFAULT_AUTHOR || !!reviewer;
  return <details ref={root} className="pr-list-options">
    <summary className={`pr-icon-button${active ? " pr-is-active" : ""}`} aria-label="Filters and sort" title="Filters and sort"><MoreHorizontal size={19} aria-hidden="true" /></summary>
    <div className="pr-options-panel">
      <label>Author<select value={author} onChange={(event) => onAuthor(event.target.value)}><option value="">All authors</option><option value="@me">Me</option>{people(authors, author, me).map((login) => <option key={login} value={login}>{login}</option>)}</select></label>
      <label>Reviewer<select value={reviewer} onChange={(event) => onReviewer(event.target.value)}><option value="">Anyone</option><option value="@me">Me</option>{people(reviewers, reviewer, me).map((login) => <option key={login} value={login}>{login}</option>)}</select></label>
      <label>Sort by<select value={sort} onChange={(event) => onSort(event.target.value as Sort)}><option value="updated">Recently updated</option><option value="oldest">Oldest updated</option><option value="title">Title A–Z</option></select></label>
      <label>Group by<select value={groupBy} onChange={(event) => onGroupBy(event.target.value as GroupBy)}><option value="none">None</option><option value="project">Project</option><option value="section">Section</option></select></label>
      {active && <button type="button" className="pr-text-button" onClick={() => { onAuthor(DEFAULT_AUTHOR); onReviewer(""); }}>Clear filters</button>}
      {reviewer && reviewerDataIncomplete && <p className="pr-options-note">Some reviewer data is incomplete. Refresh to update it.</p>}
    </div>
  </details>;
}
