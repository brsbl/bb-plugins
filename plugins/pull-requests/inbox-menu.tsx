import { useEffect, useRef } from "react";
import { ArrowDownAZ, Clock, Folder, History, List, MoreHorizontal, Rows3, type LucideIcon } from "lucide-react";

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

const SORTS: { value: Sort; label: string; icon: LucideIcon }[] = [{ value: "updated", label: "Recently updated", icon: Clock }, { value: "oldest", label: "Oldest updated", icon: History }, { value: "title", label: "Title A–Z", icon: ArrowDownAZ }];
const GROUPS: { value: GroupBy; label: string; icon: LucideIcon }[] = [{ value: "none", label: "No grouping", icon: List }, { value: "project", label: "Project", icon: Folder }, { value: "section", label: "Section", icon: Rows3 }];
/** A compact icon toggle group; each choice keeps its full name for assistive tech and as a tooltip. */
function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string; icon: LucideIcon }[]; onChange(value: T): void }) {
  return <div className="pr-option-row"><span>{label}</span><div className="pr-segmented" role="radiogroup" aria-label={label}>
    {options.map(({ value: option, label: name, icon: Icon }) => <button key={option} type="button" role="radio" aria-checked={value === option} aria-label={name} title={name} onClick={() => onChange(option)}><Icon size={15} aria-hidden="true" /></button>)}
  </div></div>;
}

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
      <label className="pr-option-row"><span>Author</span><select aria-label="Author" value={author} onChange={(event) => onAuthor(event.target.value)}><option value="">All authors</option><option value="@me">Me</option>{people(authors, author, me).map((login) => <option key={login} value={login}>{login}</option>)}</select></label>
      <label className="pr-option-row"><span>Reviewer</span><select aria-label="Reviewer" value={reviewer} onChange={(event) => onReviewer(event.target.value)}><option value="">Anyone</option><option value="@me">Me</option>{people(reviewers, reviewer, me).map((login) => <option key={login} value={login}>{login}</option>)}</select></label>
      <Segmented label="Sort by" value={sort} options={SORTS} onChange={onSort} />
      <Segmented label="Group by" value={groupBy} options={GROUPS} onChange={onGroupBy} />
      {active && <button type="button" className="pr-text-button" onClick={() => { onAuthor(DEFAULT_AUTHOR); onReviewer(""); }}>Clear filters</button>}
      {reviewer && reviewerDataIncomplete && <p className="pr-options-note">Some reviewer data is incomplete. Refresh to update it.</p>}
    </div>
  </details>;
}
