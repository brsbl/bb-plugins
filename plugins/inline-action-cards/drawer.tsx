// Waiting on you: one drawer above the prompt box listing everything agents need from the user, across threads.
// The chrome copies bb's prompt-stack card, header row, collapse row and count pill, which the SDK does not export.
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { experimental_Icon as Icon, useBbNavigate, useRealtime, useRpc } from "@get-bb/plugin-sdk/app";
import type { rpcContract } from "./server.js";
import { actionLabel, type Item, type WaitingItem } from "./model.js";
import { ActionCard } from "./app.js";
import { Button } from "./components/ui/button.js";
import { cn } from "./lib/utils.js";

const OPEN_EVENT = "inline-action-cards:open-waiting";
type Target = { threadId: string; id: string };
const keyOf = (item: Target) => `${item.threadId}:${item.id}`;

/** Opens an item in the drawer, for example from its line in the timeline. */
export function openWaiting(threadId: string, id: string) {
  window.dispatchEvent(new CustomEvent<Target>(OPEN_EVENT, { detail: { threadId, id } }));
}

const HEADER_CLASS = "group/disclosure flex min-h-8 w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-none px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-state-hover focus-visible:bg-state-hover focus-visible:outline-none";
const COLLAPSE_CLASS = "-mb-3 flex min-h-7.5 w-full cursor-pointer items-center justify-center rounded-none pb-3 text-muted-foreground transition-colors hover:bg-state-hover hover:text-foreground";
const STEP_CLASS = "flex size-6 shrink-0 items-center justify-center rounded-md text-subtle-foreground hover:bg-state-hover hover:text-foreground";

function age(updatedAt: string, now: number): string {
  const minutes = Math.max(0, Math.floor((now - Date.parse(updatedAt)) / 60_000));
  if (minutes < 60) return `${Math.max(minutes, 1)}m`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / (24 * 60))}d`;
}

function questionOf(item: Item): string {
  return item.content.type === "reply" ? `Reply to ${item.content.to[0]}: ${item.content.subject}` : item.content.question;
}

function Meta({ item, now }: { item: WaitingItem; now: number }) {
  return <div className="mt-0.5 flex min-w-0 items-center gap-1 text-2xs text-subtle-foreground">
    {item.content.priority === "urgent" && <><span className="shrink-0 text-destructive-text">Urgent</span><span aria-hidden>·</span></>}
    <span className="inline-flex min-w-0 items-center gap-1" title={`From ${item.threadTitle}`}>
      <Icon name="MessageSquare" className="size-3 shrink-0" aria-hidden />
      <span className="min-w-0 truncate">{item.threadTitle}</span>
    </span>
    <span aria-hidden>·</span>
    <time className="shrink-0 tabular-nums" dateTime={item.updatedAt}>{age(item.updatedAt, now)}</time>
  </div>;
}

function Row({ item, now, onOpen }: { item: WaitingItem; now: number; onOpen: () => void }) {
  const question = questionOf(item);
  return <li className="group/row relative border-b border-border/35 px-2.5 py-0.5 last:border-b-0">
    <button type="button" onClick={onOpen} aria-label={`Answer: ${question}`}
      className="flex w-full min-w-0 items-center gap-1.5 rounded-md py-1.5 pl-0.5 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-foreground" title={question}>{question}</p>
        <Meta item={item} now={now} />
      </div>
      <span className="flex shrink-0 items-center text-xs text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100 [@media(hover:none)]:opacity-100">
        <Icon name="ChevronRight" className="size-3.5" aria-hidden />
      </span>
    </button>
  </li>;
}

function Answer({ item, index, total, now, onStep, onAnswered }: {
  item: WaitingItem; index: number; total: number; now: number; onStep: (offset: 1 | -1) => void; onAnswered: (item: Item) => void;
}) {
  const navigate = useBbNavigate();
  return <div className="px-3 pb-2 pt-2">
    <div className="flex min-w-0 items-start justify-between gap-2">
      <div className="min-w-0 flex-1 px-0.5">
        <p className="break-words text-xs text-foreground">{questionOf(item)}</p>
        <Meta item={item} now={now} />
      </div>
      <div className="-mr-1.5 flex shrink-0 items-center text-xs">
        <Button type="button" variant="ghost" size="sm" className="h-6 gap-1 px-1.5 text-xs font-normal text-muted-foreground" title="Open the thread" onClick={() => navigate.toThread(item.threadId)}>
          Open thread<Icon name="ArrowUpRight" className="size-3.5" aria-hidden />
        </Button>
        {total > 1 && <>
          <button type="button" aria-label="Previous" onClick={() => onStep(-1)} className={STEP_CLASS}><Icon name="ChevronLeft" className="size-3.5" aria-hidden /></button>
          <span className="whitespace-nowrap tabular-nums text-subtle-foreground">{index + 1} of {total}</span>
          <button type="button" aria-label="Next" onClick={() => onStep(1)} className={STEP_CLASS}><Icon name="ChevronRight" className="size-3.5" aria-hidden /></button>
        </>}
      </div>
    </div>
    <div className="mt-1.5">
      <ActionCard key={keyOf(item)} id={item.id} threadId={item.threadId} surface="drawer" initialItem={item}
        onItem={(next) => { if (delivered(next)) onAnswered(next); }} />
    </div>
  </div>;
}

// Sent to the agent, or settled; a prepared answer that failed to send stays open with its error.
function delivered(item: Item): boolean {
  return item.state === "succeeded" || item.state === "failed" || (item.state === "pending" && !!(item.attempt?.sentAt || item.attempt?.claimed));
}

function sentLabel(item: Item): string {
  const attempt = item.attempt;
  if (!attempt) return "your answer";
  if (attempt.action === "answer") return attempt.note && attempt.note.length <= 40 ? attempt.note : "your answer";
  return attempt.choice?.label ?? actionLabel(item, attempt.action);
}

export function WaitingBanner() {
  const rpc = useRpc<typeof rpcContract>();
  const [items, setItems] = useState<WaitingItem[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const answered = useRef(new Set<string>());
  const request = useRef(0);
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const collapseRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<"trigger" | "collapse" | null>(null);
  const load = useCallback(async () => {
    const version = ++request.current;
    try {
      const next = await rpc.call("waiting", {});
      if (version !== request.current) return;
      // A just-answered item can outlive one refresh while its send settles; forget it once the server agrees.
      const listed = new Set(next.map(keyOf));
      for (const key of answered.current) if (!listed.has(key)) answered.current.delete(key);
      setItems(next.filter((item) => !answered.current.has(keyOf(item))));
      setNow(Date.now());
    } catch { /* Keep the last list; the next refresh retries. */ }
  }, [rpc]);
  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 4000);
    return () => { request.current++; clearInterval(timer); };
  }, [load]);
  useRealtime("items", () => void load());
  useEffect(() => {
    const open = (event: Event) => {
      const target = (event as CustomEvent<Target>).detail;
      setExpanded(true); setOpenKey(keyOf(target)); setNotice(null);
    };
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 8000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const target = pendingFocus.current === "collapse" ? collapseRef.current : pendingFocus.current === "trigger" ? triggerRef.current : null;
    pendingFocus.current = null;
    target?.focus();
  }, [expanded]);
  if (!items.length && !notice) return null;
  const openIndex = items.findIndex((item) => keyOf(item) === openKey);
  const open = openIndex >= 0 ? items[openIndex]! : null;
  const top = items[0];
  const toggle = () => { pendingFocus.current = expanded ? null : "collapse"; setExpanded(!expanded); setOpenKey(null); };
  const onAnswered = (item: Item) => {
    answered.current.add(keyOf(item));
    const source = items.find((candidate) => keyOf(candidate) === keyOf(item));
    setItems((current) => current.filter((candidate) => keyOf(candidate) !== keyOf(item)));
    setNotice(`Sent “${sentLabel(item)}” to ${source?.threadTitle ?? "its thread"}`);
    setOpenKey(null);
    void load();
  };
  return <section aria-label="Waiting on you"
    className="relative z-10 -mb-5 flex min-h-0 flex-col overflow-hidden rounded-xl rounded-b-none border border-b-0 border-border bg-surface-raised-solid pb-3 shadow-lift">
    <header className="shrink-0">
      <button ref={triggerRef} type="button" aria-expanded={expanded} aria-controls={listId}
        onClick={open ? () => setOpenKey(null) : toggle}
        className={cn(HEADER_CLASS, expanded && "border-b border-border/35")}>
        {open && <Icon name="ChevronLeft" className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />}
        <Icon name="CircleQuestion" className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="shrink-0 font-normal">Waiting on you</span>
        {!expanded && (top
          ? <span className="min-w-0 truncate text-2xs text-subtle-foreground">
            {top.content.priority === "urgent" && <span className="text-destructive-text">Urgent · </span>}{questionOf(top)}
          </span>
          : notice && <span className="min-w-0 truncate text-2xs text-subtle-foreground">{notice}</span>)}
        <span className="ml-auto mr-px flex w-6 shrink-0 justify-center px-0">
          <span className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-surface-recessed px-1 text-2xs leading-none tabular-nums text-subtle-foreground">{items.length}</span>
        </span>
      </button>
    </header>
    <div id={listId} hidden={!expanded} className="min-h-0">
      {open ? <Answer item={open} index={openIndex} total={items.length} now={now} onAnswered={onAnswered}
        onStep={(offset) => setOpenKey(keyOf(items[(openIndex + offset + items.length) % items.length]!))} />
        : <>
          {notice && <p role="status" className="flex items-center gap-1.5 border-b border-border/35 px-3 py-1.5 text-2xs text-subtle-foreground">
            <Icon name="Check" className="size-3 shrink-0" aria-hidden /><span className="min-w-0 truncate">{notice}</span>
          </p>}
          <ul className="max-h-80 overflow-y-auto overscroll-contain pt-1">
            {items.map((item) => <Row key={keyOf(item)} item={item} now={now} onOpen={() => setOpenKey(keyOf(item))} />)}
          </ul>
          <button ref={collapseRef} type="button" aria-expanded="true" aria-controls={listId} aria-label="Collapse waiting on you"
            onClick={() => { pendingFocus.current = "trigger"; setExpanded(false); setOpenKey(null); }} className={COLLAPSE_CLASS}>
            <Icon name="ChevronUp" className="size-3.5" aria-hidden />
          </button>
        </>}
    </div>
  </section>;
}
