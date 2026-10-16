// Waiting on you: one drawer above the prompt box listing what this thread needs from the user.
// The chrome copies bb's prompt-stack card, header row, collapse row and count pill, which the SDK does not export.
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { experimental_Icon as Icon, useBbNavigate, useComposer, useRealtime, useRpc } from "@get-bb/plugin-sdk/app";
import type { rpcContract } from "./server.js";
import { actionLabel, type Item, type WaitingItem } from "./model.js";
import { ActionCard } from "./app.js";
import { cn } from "./lib/utils.js";

const OPEN_EVENT = "inline-action-cards:open-waiting";
type Target = { threadId: string; id: string };
const keyOf = (item: Target) => `${item.threadId}:${item.id}`;

/** Opens an item in the drawer, for example from its line in the timeline. */
export function openWaiting(threadId: string, id: string) {
  window.dispatchEvent(new CustomEvent<Target>(OPEN_EVENT, { detail: { threadId, id } }));
}

const HEADER_CLASS = "group/disclosure flex min-h-8 w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-none px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-state-hover focus-visible:bg-state-hover focus-visible:outline-none";
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
  return <div className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-subtle-foreground">
    {item.content.priority === "urgent" && <><span className="shrink-0 text-destructive-text">Urgent</span><span aria-hidden>·</span></>}
    {item.earlier && <><span className="min-w-0 truncate" title={`You answered an earlier version: ${item.earlier}`}>Asked again · you said “{item.earlier}”</span><span aria-hidden>·</span></>}
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

function Answer({ item, now, focus, onAnswered }: { item: WaitingItem; now: number; focus: boolean; onAnswered: (item: Item) => void }) {
  const body = useRef<HTMLDivElement>(null);
  // Opened on purpose, the card takes focus so its number keys work; opened by default, focus stays where it was.
  useEffect(() => {
    if (!focus) return;
    const frame = requestAnimationFrame(() => body.current?.querySelector<HTMLElement>("input:not(:disabled), textarea:not([readonly])")?.focus());
    return () => cancelAnimationFrame(frame);
  }, [focus, item.id]);
  return <div ref={body} className="max-h-[60vh] overflow-y-auto overscroll-contain px-3 pb-2 pt-2 max-sm:max-h-[calc(33dvh-2.5rem)]">
    <div className="min-w-0 px-0.5">
      <p className="break-words text-xs font-medium text-foreground">
        {item.content.priority === "urgent" && <span className="font-normal text-destructive-text sm:hidden">Urgent · </span>}{questionOf(item)}
      </p>
      {/* A phone keeps the answer in view: urgency moves into the question and the age line goes, unless it says the question was asked again. */}
      <div className={cn(!item.earlier && "max-sm:hidden")}><Meta item={item} now={now} /></div>
    </div>
    <div className="mt-1.5">
      <ActionCard key={keyOf(item)} id={item.id} threadId={item.threadId} surface="drawer" initialItem={item}
        onItem={(next) => { if (next.revision > item.revision && delivered(next)) onAnswered(next); }} />
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
  if (attempt.action === "answer") return attempt.note ? attempt.note.length <= 40 ? attempt.note : `${attempt.note.slice(0, 39).trimEnd()}…` : "your answer";
  return attempt.choice?.label ?? actionLabel(item, attempt.action);
}

const collapsedThreads = new Set<string>();

export function WaitingBanner() {
  const { scope } = useComposer();
  return scope.kind === "thread" ? <ThreadWaiting key={scope.threadId} threadId={scope.threadId} /> : null;
}

function ThreadWaiting({ threadId }: { threadId: string }) {
  const rpc = useRpc<typeof rpcContract>();
  const navigate = useBbNavigate();
  const [items, setItems] = useState<WaitingItem[]>([]);
  // Open by default, like bb's own question; collapsing holds for this thread until the page reloads.
  const [expanded, setExpandedState] = useState(() => !collapsedThreads.has(threadId));
  const setExpanded = (next: boolean) => { setExpandedState(next); if (next) collapsedThreads.delete(threadId); else collapsedThreads.add(threadId); };
  const [openKey, setOpenKey] = useState<string | null>(null);
  // Whether the user opened the current item themselves, so it may take focus.
  const [chosen, setChosen] = useState(false);
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
      const next = await rpc.call("waiting", { threadId });
      if (version !== request.current) return;
      // A just-answered item can outlive one refresh while its send settles; forget it once the server agrees.
      const listed = new Set(next.map(keyOf));
      for (const key of answered.current) if (!listed.has(key)) answered.current.delete(key);
      setItems(next.filter((item) => !answered.current.has(keyOf(item))));
      setNow(Date.now());
    } catch { /* Keep the last list; the next refresh retries. */ }
  }, [rpc, threadId]);
  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 4000);
    return () => { request.current++; clearInterval(timer); };
  }, [load]);
  useRealtime("items", () => void load());
  useEffect(() => {
    const open = (event: Event) => {
      const target = (event as CustomEvent<Target>).detail;
      if (target.threadId !== threadId) return;
      setExpanded(true); setOpenKey(keyOf(target)); setNotice(null); setChosen(true);
    };
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, [threadId]);
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
  // The last answer stays visible as a confirmation until the notice times out.
  if (!items.length) return <section aria-label="Waiting on you"
    className="relative z-10 -mb-5 flex min-h-0 flex-col overflow-hidden rounded-xl rounded-b-none border border-b-0 border-border bg-surface-raised-solid pb-3 shadow-lift">
    <p role="status" className={cn(HEADER_CLASS, "cursor-default hover:bg-transparent")}>
      <Icon name="Check" className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 truncate text-muted-foreground">{notice}</span>
    </p>
  </section>;
  // A single item opens straight to its answer; with several, the list comes first.
  const single = items.length === 1;
  const openIndex = single ? 0 : items.findIndex((item) => keyOf(item) === openKey);
  const open = openIndex >= 0 ? items[openIndex]! : null;
  const top = items[0]!;
  const back = !single && !!open && expanded;
  const toggle = () => { pendingFocus.current = expanded || single ? null : "collapse"; setChosen(!expanded); setExpanded(!expanded); setOpenKey(null); };
  const onAnswered = (item: Item) => {
    answered.current.add(keyOf(item));
    setItems((current) => current.filter((candidate) => keyOf(candidate) !== keyOf(item)));
    setNotice(`Sent “${sentLabel(item)}”`);
    setOpenKey(null);
    void load();
  };
  const step = (offset: 1 | -1) => { setChosen(true); setOpenKey(keyOf(items[(openIndex + offset + items.length) % items.length]!)); };
  return <section aria-label="Waiting on you"
    onKeyDown={(event) => { if (event.key === "Escape" && expanded) { event.stopPropagation(); pendingFocus.current = "trigger"; setExpanded(false); setOpenKey(null); } }}
    className="relative z-10 -mb-5 flex min-h-0 flex-col overflow-hidden rounded-xl rounded-b-none border border-b-0 border-border bg-surface-raised-solid pb-3 shadow-lift">
    <header className={cn("flex shrink-0 items-center", expanded && "border-b border-border/35")}>
      <button ref={triggerRef} type="button" aria-expanded={expanded} aria-controls={listId}
        onClick={back ? () => setOpenKey(null) : toggle} className={HEADER_CLASS}>
        {back && <Icon name="ChevronLeft" className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />}
        <Icon name="CircleQuestion" className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span className={cn("shrink-0 font-normal text-muted-foreground", !expanded && "max-sm:sr-only")}>Waiting on you</span>
        {expanded && !single && !back && <span className="shrink-0 tabular-nums text-subtle-foreground">· {items.length}</span>}
        {!expanded && <span className="min-w-0 truncate">
          <span aria-hidden className="text-subtle-foreground max-sm:hidden">· </span>
          {top.content.priority === "urgent" && <span className="text-destructive-text">Urgent · </span>}{questionOf(top)}
        </span>}
        {!expanded && <span className="ml-auto mr-px flex shrink-0 items-center gap-1.5">
          {!single && <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-surface-recessed px-1 text-2xs leading-none tabular-nums text-subtle-foreground">{items.length}</span>}
          <Icon name="ChevronDown" className="size-3.5 text-muted-foreground" aria-hidden />
        </span>}
      </button>
      {expanded && (back
        ? <div className="flex shrink-0 items-center pr-2 text-xs">
          <button type="button" aria-label="Previous" onClick={() => step(-1)} className={STEP_CLASS}><Icon name="ChevronLeft" className="size-3.5" aria-hidden /></button>
          <span className="whitespace-nowrap tabular-nums text-subtle-foreground">{openIndex + 1} of {items.length}</span>
          <button type="button" aria-label="Next" onClick={() => step(1)} className={STEP_CLASS}><Icon name="ChevronRight" className="size-3.5" aria-hidden /></button>
        </div>
        : <button type="button" onClick={() => navigate.toPluginPanel("log")}
          className="shrink-0 rounded-md px-1.5 py-1 text-xs text-subtle-foreground hover:bg-state-hover hover:text-foreground focus-visible:bg-state-hover focus-visible:outline-none">
          Decision log
        </button>)}
      {expanded && <button ref={collapseRef} type="button" aria-expanded="true" aria-controls={listId} aria-label="Collapse waiting on you"
        onClick={() => { pendingFocus.current = "trigger"; setExpanded(false); setOpenKey(null); }} className={cn(STEP_CLASS, "mr-2")}>
        <Icon name="ChevronUp" className="size-3.5" aria-hidden />
      </button>}
    </header>
    <div id={listId} hidden={!expanded} className="min-h-0 pb-2">
      {notice && !open && <p role="status" className="flex items-center gap-1.5 border-b border-border/35 px-3 py-1.5 text-xs text-subtle-foreground">
        <Icon name="Check" className="size-3 shrink-0" aria-hidden /><span className="min-w-0 truncate">{notice}</span>
      </p>}
      {open ? <Answer item={open} now={now} focus={chosen} onAnswered={onAnswered} />
        : <ul className="max-h-80 overflow-y-auto overscroll-contain pt-1 max-sm:max-h-[calc(33dvh-2.5rem)]">
          {items.map((item) => <Row key={keyOf(item)} item={item} now={now} onOpen={() => { setChosen(true); setOpenKey(keyOf(item)); }} />)}
        </ul>}
    </div>
  </section>;
}
