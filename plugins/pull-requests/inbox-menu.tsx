import { useEffect, useRef, useState, type ReactNode } from "react";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { ArrowDownUp, ArrowLeft, Check, ChevronRight, ListFilter, MoreHorizontal, UserRound, UsersRound, X, type LucideIcon } from "lucide-react";

export type Sort = "updated" | "oldest" | "title";
type Page = "root" | "filter" | "sort" | "author" | "reviewer";
type Choice = { value: string; label: string };
type Props = {
  author: string; reviewer: string; sort: Sort; authors: string[]; reviewers: string[];
  reviewerDataIncomplete: boolean;
  onAuthor(value: string): void; onReviewer(value: string): void; onSort(value: Sort): void;
};
const labels: Record<Page, string> = { root: "Filters and sort", filter: "Filter", sort: "Sort by", author: "Author", reviewer: "Reviewer" };
const parent = (page: Page): Page => page === "author" || page === "reviewer" ? "filter" : "root";
const people = (all: string, values: string[], selected: string): Choice[] => [
  { value: "", label: all }, { value: "@me", label: "Me" },
  ...[...new Set([...values, ...(selected && selected !== "@me" ? [selected] : [])])].map((value) => ({ value, label: value })),
];

/** Cascading menus on desktop; the same hierarchy drills into one panel on mobile. */
export function InboxMenu({ author, reviewer, sort, authors, reviewers, reviewerDataIncomplete, onAuthor, onReviewer, onSort }: Props) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<Page>("root");
  const [compact, setCompact] = useState(() => window.matchMedia?.("(max-width: 630px)").matches ?? false);
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia?.("(max-width: 630px)");
    if (!media) return;
    const update = () => { setCompact(media.matches); setOpen(false); setPage("root"); };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (compact && open) content.current?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus();
  }, [compact, open, page]);
  const active = !!(author || reviewer);
  const choices = (kind: "sort" | "author" | "reviewer") => {
    const items: Choice[] = kind === "sort" ? [{ value: "updated", label: "Recently updated" }, { value: "oldest", label: "Oldest updated" }, { value: "title", label: "Title A–Z" }]
      : kind === "author" ? people("All authors", authors, author) : people("Anyone", reviewers, reviewer);
    return <>
      <Menu.RadioGroup aria-label={labels[kind]} value={kind === "sort" ? sort : kind === "author" ? author : reviewer}
        onValueChange={(value) => kind === "sort" ? onSort(value as Sort) : kind === "author" ? onAuthor(value) : onReviewer(value)}>
        {items.map((item) => <Menu.RadioItem className="pr-menu-item pr-menu-choice" key={item.value} value={item.value}>
          <span>{item.label}</span><Menu.ItemIndicator className="pr-menu-check"><Check size={15} aria-hidden="true" /></Menu.ItemIndicator>
        </Menu.RadioItem>)}
      </Menu.RadioGroup>
      {kind === "reviewer" && reviewerDataIncomplete && <p className="pr-menu-note">Some reviewer data is incomplete. Refresh to update it.</p>}
    </>;
  };
  const branch = (target: Exclude<Page, "root">, Icon: LucideIcon, selected = false): ReactNode => {
    const title = <><Icon size={17} aria-hidden="true" /><span>{labels[target]}</span>{selected && <span className="pr-menu-dot" aria-hidden="true" />}<ChevronRight className="pr-menu-chevron" size={15} aria-hidden="true" /></>;
    if (compact) return <Menu.Item className="pr-menu-item" onSelect={(event) => { event.preventDefault(); setPage(target); }} onKeyDown={(event) => { if (event.key === "ArrowRight") { event.preventDefault(); setPage(target); } }}>{title}</Menu.Item>;
    return <Menu.Sub>
      <Menu.SubTrigger className="pr-menu-item">{title}</Menu.SubTrigger>
      <Menu.Portal><Menu.SubContent className="pr-inbox-menu" aria-label={labels[target]} sideOffset={5} collisionPadding={8}>{target === "filter" ? filters() : choices(target)}</Menu.SubContent></Menu.Portal>
    </Menu.Sub>;
  };
  const filters = (): ReactNode => <>
    {branch("author", UserRound, !!author)}
    {branch("reviewer", UsersRound, !!reviewer)}
    {active && <><Menu.Separator className="pr-menu-separator" /><Menu.Item className="pr-menu-item" onSelect={() => { onAuthor(""); onReviewer(""); }}><X size={17} aria-hidden="true" /><span>Clear filters</span></Menu.Item></>}
  </>;
  return <Menu.Root open={open} onOpenChange={(next) => { setOpen(next); if (!next) setPage("root"); }}>
    <Menu.Trigger className={`pr-icon-button${active ? " pr-is-active" : ""}`} aria-label="Filters and sort" title="Filters and sort"><MoreHorizontal size={19} aria-hidden="true" /></Menu.Trigger>
    <Menu.Portal><Menu.Content ref={content} className="pr-inbox-menu" aria-label={labels[page]} align="end" sideOffset={7} collisionPadding={8}
      onEscapeKeyDown={(event) => { if (compact && page !== "root") { event.preventDefault(); setPage(parent(page)); } }}
      onKeyDown={(event) => { if (compact && page !== "root" && event.key === "ArrowLeft") { event.preventDefault(); setPage(parent(page)); } }}>
      {compact && page !== "root" && <><Menu.Item className="pr-menu-item pr-menu-back" aria-label={`Back to ${labels[parent(page)]}`} onSelect={(event) => { event.preventDefault(); setPage(parent(page)); }}><ArrowLeft size={16} aria-hidden="true" /><span>{labels[page]}</span></Menu.Item><Menu.Separator className="pr-menu-separator" /></>}
      {page === "root" ? <>{branch("sort", ArrowDownUp)}{branch("filter", ListFilter, active)}</> : page === "filter" ? filters() : choices(page)}
    </Menu.Content></Menu.Portal>
  </Menu.Root>;
}
