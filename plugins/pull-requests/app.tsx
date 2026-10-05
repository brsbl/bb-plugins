import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown,
  Circle, CircleHelp, Clock, ExternalLink, FileCode2, Github, GitMerge, GitPullRequest,
  GitPullRequestClosed, GitPullRequestDraft, Link2, Loader2, MessageCircle,
  Pin, PinOff, Plus, RefreshCw, Search, Unlink, X, XCircle, type LucideIcon,
} from "lucide-react";
import {
  definePluginApp, experimental_useSidebarThreads, Markdown, useBbNavigate, useRealtime,
  useRealtimeConnectionState, useRpc, type PluginNavPanelProps, type PluginSidebarThread,
} from "@get-bb/plugin-sdk/app";
import { CHANGED, type Changes, type Listing, type PullRequestItem, type Snapshot, type ThreadChoice, type rpcContract } from "./contract";
import { githubNeedsAttention } from "./core";
import { InboxMenu, type Sort } from "./inbox-menu";
import "./app.css";

type Rpc = ReturnType<typeof useRpc<typeof rpcContract>>;
type Group = "history";
type Tab = "summary" | "changes";
type Presentation = { icon: LucideIcon; label: string; tone?: "success" | "danger" | "warning" | "muted" | "purple"; spin?: boolean };
type ThreadContext = { threads: ThreadChoice[]; hosts: { id: string; name: string; connected: boolean }[]; nextCursor: string | null };
type Preview = { token: string; snapshot: Snapshot; reader: { login: string; hostId: string }; thread: ThreadChoice };
const session = { query: "", author: "", reviewer: "", sort: "updated" as Sort, collapsed: ["history"] as Group[], scrollTop: 0 };
const EMPTY_COVERAGE: Listing["coverage"] = { running: false, checked: 0, total: 0, unavailable: 0, incomplete: false, lastDiscoveryAt: null, includesArchived: false };

function message(error: unknown): string { return error instanceof Error ? error.message : String(error); }
function age(value: string | null): string {
  if (!value || !Number.isFinite(Date.parse(value))) return "Not checked";
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}
function safeUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined; } catch { return undefined; }
}
function githubFresh(item: PullRequestItem, now: number): boolean {
  return item.sourceState === "available" && item.snapshot !== null && now - Date.parse(item.snapshot.fetchedAt) <= 60_000;
}
function threadPresentation(thread?: PluginSidebarThread, archived = false): Presentation {
  if (!thread) return { icon: archived ? Clock : CircleHelp, label: archived ? "Archived thread" : "Thread activity unavailable", tone: "muted" };
  if (thread.hasPendingInteraction || thread.indicator === "waiting-for-input") return { icon: MessageCircle, label: thread.indicatorLabel ?? "Waiting for your input", tone: "warning" };
  if (thread.indicator === "unread-error" || thread.indicator === "queued-failed" || thread.status === "error") return { icon: AlertCircle, label: thread.indicatorLabel ?? "Thread error", tone: "danger" };
  if (["active", "starting", "stopping"].includes(thread.status) || Object.values(thread.activity).some((count) => count > 0)) return { icon: Loader2, label: thread.indicatorLabel ?? "Thread working", spin: true };
  if (thread.runtimeStatus === "waiting-for-host") return { icon: Clock, label: "Waiting for machine", tone: "warning" };
  return { icon: Circle, label: thread.isArchived ? "Archived thread" : "Thread idle", tone: "muted" };
}
function lifecycle(snapshot: Pick<Snapshot, "state"> | null): Presentation {
  if (!snapshot) return { icon: CircleHelp, label: "Pull request status unavailable", tone: "muted" };
  switch (snapshot.state) {
    case "open": return { icon: GitPullRequest, label: "Open pull request", tone: "success" };
    case "draft": return { icon: GitPullRequestDraft, label: "Draft pull request", tone: "muted" };
    case "merged": return { icon: GitMerge, label: "Merged pull request", tone: "purple" };
    case "closed": return { icon: GitPullRequestClosed, label: "Closed pull request", tone: "danger" };
  }
}
function checksPresentation(snapshot: Snapshot): Presentation {
  const checks = snapshot.checks;
  const suffix = checks.complete ? "" : "; results incomplete";
  switch (checks.state) {
    case "passing": return { icon: CheckCircle2, label: `${checks.passing} of ${checks.total} checks passing${suffix}`, tone: "success" };
    case "failing": return { icon: XCircle, label: `${checks.failing} failing checks${suffix}`, tone: "danger" };
    case "pending": return { icon: Clock, label: `${checks.pending} pending checks${suffix}`, tone: "warning" };
    case "none": return { icon: Circle, label: "No checks reported", tone: "muted" };
    case "unknown": return { icon: CircleHelp, label: `Checks unknown${suffix}`, tone: "muted" };
  }
}
function reviewPresentation(value: Snapshot["review"]): Presentation {
  switch (value) {
    case "approved": return { icon: CheckCircle2, label: "Review approved", tone: "success" };
    case "changes-requested": return { icon: XCircle, label: "Changes requested", tone: "danger" };
    case "required": return { icon: Clock, label: "Review required", tone: "warning" };
    case "none": return { icon: Circle, label: "No review decision", tone: "muted" };
    case "unknown": return { icon: CircleHelp, label: "Review status unknown", tone: "muted" };
  }
}
function mergePresentation(value: Snapshot["mergeability"]): Presentation {
  switch (value) {
    case "mergeable": return { icon: CheckCircle2, label: "No merge conflicts", tone: "success" };
    case "conflicts": return { icon: AlertTriangle, label: "Merge conflicts", tone: "danger" };
    case "blocked": return { icon: Clock, label: "Merge blocked by repository requirements", tone: "warning" };
    case "unknown": return { icon: CircleHelp, label: "Mergeability unknown", tone: "muted" };
  }
}
function needsThread(thread?: PluginSidebarThread): boolean {
  return !!thread && (thread.hasPendingInteraction || ["waiting-for-input", "unread-error", "queued-failed"].includes(thread.indicator) || thread.status === "error");
}
export function needsAttention(item: PullRequestItem, threads: ReadonlyMap<string, PluginSidebarThread>, now: number): boolean {
  if (!item.snapshot || !["open", "draft"].includes(item.snapshot.state)) return false;
  if (item.links.some((link) => needsThread(threads.get(link.threadId)))) return true;
  return githubFresh(item, now) && githubNeedsAttention(item.snapshot);
}
function parseSelection(subPath: string): { id: string | null; tab: Tab } {
  const [encoded, tab] = subPath.split("/");
  try { return { id: encoded ? decodeURIComponent(encoded) : null, tab: tab === "changes" ? "changes" : "summary" }; }
  catch { return { id: null, tab: "summary" }; }
}

/** Status labels remain available to touch and keyboard users, without text badges. */
function StatusIcon({ icon: Icon, label, tone = "muted", spin, count }: Presentation & { count?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const button = useRef<HTMLButtonElement>(null);
  const tooltip = useRef<HTMLSpanElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelLeave = () => { if (leaveTimer.current) clearTimeout(leaveTimer.current); };
  const leave = () => { cancelLeave(); if (!pinned && document.activeElement !== button.current) leaveTimer.current = setTimeout(() => setOpen(false), 140); };
  const id = useId();
  const show = () => {
    cancelLeave();
    const rect = button.current?.getBoundingClientRect();
    if (rect) setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - 300)), top: rect.bottom > window.innerHeight - 80 ? Math.max(8, rect.top - 60) : rect.bottom + 5 });
    setOpen(true);
  };
  useEffect(() => () => cancelLeave(), []);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: Event) => {
      if (event.type === "keydown" && (event as KeyboardEvent).key !== "Escape") return;
      if (event.type === "keydown") { event.preventDefault(); event.stopPropagation(); }
      if (event.type === "pointerdown" && (button.current?.contains(event.target as Node) || tooltip.current?.contains(event.target as Node))) return;
      setOpen(false); setPinned(false);
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", dismiss);
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", dismiss, true);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", dismiss); window.removeEventListener("resize", dismiss); window.removeEventListener("scroll", dismiss, true); };
  }, [open]);
  return <>
    <button ref={button} type="button" className={`pr-status pr-tone-${tone}`} aria-label={label} aria-describedby={open ? id : undefined}
      onMouseEnter={show} onMouseLeave={leave}
      onFocus={show} onBlur={() => { setOpen(false); setPinned(false); }}
      onClick={(event) => { event.stopPropagation(); if (pinned) { setOpen(false); setPinned(false); } else { show(); setPinned(true); } }}>
      <Icon aria-hidden="true" className={spin ? "pr-spin" : undefined} size={16} strokeWidth={1.8} />{count !== undefined && <span className="pr-status-count">{count}</span>}
    </button>
    {open && createPortal(<span ref={tooltip} role="tooltip" id={id} className="pr-plugin-tooltip" style={position} onMouseEnter={cancelLeave} onMouseLeave={leave}>{label}</span>, button.current?.closest("dialog") ?? document.body)}
  </>;
}
function IconButton({ icon: Icon, label, onClick, disabled, active, spin }: { icon: LucideIcon; label: string; onClick(): void; disabled?: boolean; active?: boolean; spin?: boolean }) {
  return <button type="button" className={`pr-icon-button${active ? " pr-is-active" : ""}`} aria-label={label} title={label} disabled={disabled} onClick={onClick}><Icon aria-hidden="true" size={16} strokeWidth={1.8} className={spin ? "pr-spin" : undefined} /></button>;
}
function External({ href, children, className = "" }: { href: string | null | undefined; children: ReactNode; className?: string }) {
  const url = safeUrl(href);
  return url ? <a href={url} className={className} target="_blank" rel="noopener noreferrer">{children}</a> : <span className={className}>{children}</span>;
}
function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="pr-empty"><GitPullRequest size={28} strokeWidth={1.3} aria-hidden="true" /><h2>{title}</h2>{children && <p>{children}</p>}</div>;
}
// Match bb's DelayedLoading: keep the shell stable, reveal placeholders after 200ms.
function Loading({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => setVisible(true), 200); return () => window.clearTimeout(timer); }, []);
  return <div className="pr-loading" role="status" aria-busy="true" aria-label={label}>{visible && <div aria-hidden="true"><div /><div /><div /></div>}</div>;
}

export function PullRequestsPanel({ subPath }: PluginNavPanelProps) {
  const rpc = useRpc<typeof rpcContract>();
  const navigate = useBbNavigate();
  const sidebar = experimental_useSidebarThreads();
  const connection = useRealtimeConnectionState();
  const [items, setItems] = useState<PullRequestItem[]>([]);
  const [detail, setDetail] = useState<PullRequestItem | null>(null);
  const [coverage, setCoverage] = useState(EMPTY_COVERAGE);
  const [context, setContext] = useState<ThreadContext>({ threads: [], hosts: [], nextCursor: null });
  const [contextEpoch, setContextEpoch] = useState(0);
  const [author, setAuthor] = useState(session.author);
  const [reviewer, setReviewer] = useState(session.reviewer);
  const [sort, setSort] = useState<Sort>(session.sort);
  const [collapsed, setCollapsed] = useState<Group[]>(session.collapsed);
  const [query, setQuery] = useState(session.query);
  const [booting, setBooting] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [detailFailure, setDetailFailure] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [pageLimit, setPageLimit] = useState(1);
  const [clock, setClock] = useState(Date.now());
  const [linking, setLinking] = useState<{ url?: string } | null>(null);
  const [undo, setUndo] = useState<{ token: string; title: string } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const readGeneration = useRef(0);
  const detailGeneration = useRef(0);
  const detailEpoch = useRef(0);
  const detailRequest = useRef<{ id: string; epoch: number; promise: Promise<void> } | null>(null);
  const mounted = useRef(true);
  const selection = parseSelection(subPath);
  const selectedId = useRef(selection.id); selectedId.current = selection.id;
  const liveThreads = useMemo(() => new Map(sidebar.threads.filter((thread) => !thread.isHidden).map((thread) => [thread.id, thread])), [sidebar.threads]);
  const hiddenThreads = useMemo(() => new Set(sidebar.threads.filter((thread) => thread.isHidden).map((thread) => thread.id)), [sidebar.threads]);
  const choices = useMemo(() => {
    const all = new Map(context.threads.filter((thread) => !hiddenThreads.has(thread.id)).map((thread) => [thread.id, thread]));
    for (const thread of liveThreads.values()) all.set(thread.id, { id: thread.id, title: thread.displayTitle, projectId: thread.projectId, environmentId: thread.environment?.id ?? null, hostId: thread.host?.id ?? null, archived: thread.isArchived });
    return all;
  }, [context.threads, hiddenThreads, liveThreads]);
  const visibleItems = useMemo(() => items.map((item) => ({ ...item, links: item.links.filter((link) => !hiddenThreads.has(link.threadId)) })).filter((item) => item.links.length > 0 || item.discoveredFromGitHub), [items, hiddenThreads]);
  const selectedValue = detail?.id === selection.id ? detail : visibleItems.find((item) => item.id === selection.id) ?? null;
  const selected = selectedValue ? { ...selectedValue, links: selectedValue.links.filter((link) => !hiddenThreads.has(link.threadId)) } : null;
  const detailLoading = !!selection.id && detail?.id !== selection.id && detailFailure !== selection.id;
  const loadDetail = useCallback((id: string): Promise<void> => {
    const pending = detailRequest.current;
    if (pending?.id === id) {
      if (pending.epoch === detailEpoch.current) return pending.promise;
      // Refresh invalidates the pending response. Read again once it settles;
      // coalesce other callers into that trailing read instead of overlapping it.
      return pending.promise.then(() => { if (mounted.current && selectedId.current === id) return loadDetail(id); });
    }
    const epoch = detailEpoch.current;
    const generation = ++detailGeneration.current;
    setDetailFailure(null);
    const current = () => mounted.current && generation === detailGeneration.current && epoch === detailEpoch.current && selectedId.current === id;
    const promise = rpc.call("show", { id }).then((item) => {
      if (current()) setDetail(item);
    }).catch((reason) => {
      if (!current()) return;
      setDetail(null); setDetailFailure(id);
      setItems((items) => items.map((item) => item.id === id ? { ...item, snapshot: null, sourceState: "unavailable", sourceMessage: message(reason) } : item));
      setError(message(reason));
    }).finally(() => { if (detailRequest.current?.promise === promise) detailRequest.current = null; });
    detailRequest.current = { id, epoch, promise };
    return promise;
  }, [rpc]);
  const load = useCallback(async () => {
    const generation = ++readGeneration.current;
    setListLoading(true);
    try {
      const all: PullRequestItem[] = [];
      let cursor: string | undefined;
      let result: Listing | null = null;
      for (let page = 0; page < pageLimit; page++) {
        result = await rpc.call("list", { view: "all", limit: 100, ...(cursor ? { cursor } : {}) });
        all.push(...result.items); cursor = result.nextCursor ?? undefined;
        if (!cursor) break;
      }
      if (!mounted.current || generation !== readGeneration.current || !result) return;
      const byId = new Map(all.map((item) => [item.id, item]));
      setItems([...byId.values()]);
      setCoverage(result.coverage); setTotal(result.total); setNextCursor(result.nextCursor);
      const requestedId = selectedId.current;
      if (requestedId) {
        // Revoke private content immediately when the summary reports lost access.
        const summary = byId.get(requestedId);
        if (summary && !summary.snapshot) {
          ++detailGeneration.current; detailRequest.current = null;
          setDetail(summary);
        }
        void loadDetail(requestedId);
      }
    } finally { if (mounted.current && generation === readGeneration.current) { setBooting(false); setListLoading(false); } }
  }, [rpc, pageLimit, loadDetail]);
  const loadContext = useCallback(async () => {
    const result = await rpc.call("context", {});
    if (mounted.current) { setContext((current) => ({ ...result, threads: [...new Map([...current.threads, ...result.threads].map((thread) => [thread.id, thread])).values()] })); setContextEpoch((value) => value + 1); }
  }, [rpc]);
  const linkedIdsKey = [...new Set([...items, ...(detail ? [detail] : [])].flatMap((item) => item.links.map((link) => link.threadId)))].sort().join(",");
  useEffect(() => {
    const ids = linkedIdsKey ? linkedIdsKey.split(",") : [];
    if (!ids.length) return;
    let cancelled = false;
    void (async () => {
      const found: ThreadChoice[] = [];
      for (let index = 0; index < ids.length; index += 100) {
        const result = await rpc.call("context", { threadIds: ids.slice(index, index + 100) });
        if (cancelled) return;
        found.push(...result.threads);
      }
      if (!cancelled) setContext((current) => ({ ...current, threads: [...current.threads.filter((thread) => !ids.includes(thread.id)), ...found] }));
    })().catch((reason) => { if (!cancelled) setError(message(reason)); });
    return () => { cancelled = true; };
  }, [linkedIdsKey, contextEpoch, rpc]);
  const refresh = useCallback(async (discover: boolean, id?: string) => {
    setRefreshing(true); setError(null);
    try {
      const next = await rpc.call("refresh", { discover, includeArchived: false, ...(id ? { id } : {}) });
      if (mounted.current) setCoverage(next);
      ++detailEpoch.current;
      await load();
      if (discover) await loadContext();
    } catch (reason) { if (mounted.current) setError(message(reason)); }
    finally { if (mounted.current) setRefreshing(false); }
  }, [rpc, load, loadContext]);
  const refreshRef = useRef(refresh); refreshRef.current = refresh;
  const loadRef = useRef(load); loadRef.current = load;
  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    // Discovery emits many invalidations. Let the cached list render first,
    // otherwise its first response can be superseded until discovery goes quiet.
    void loadRef.current().catch((reason) => { if (mounted.current) setError(message(reason)); }).finally(() => {
      if (!cancelled) void refreshRef.current(true);
    });
    const timer = window.setInterval(() => { setClock(Date.now()); if (document.visibilityState === "visible") void refreshRef.current(true); }, 60_000);
    const visibility = () => { if (document.visibilityState === "visible") { setClock(Date.now()); void refreshRef.current(true); } };
    document.addEventListener("visibilitychange", visibility);
    return () => { cancelled = true; mounted.current = false; ++readGeneration.current; ++detailGeneration.current; window.clearInterval(timer); document.removeEventListener("visibilitychange", visibility); };
  }, [loadContext]);
  useEffect(() => { if (pageLimit > 1) void load().catch((reason) => setError(message(reason))); }, [pageLimit, load]);
  const wasConnected = useRef(false);
  useEffect(() => { if (connection === "connected") { if (wasConnected.current) { ++detailEpoch.current; void loadRef.current().catch((reason) => setError(message(reason))); } wasConnected.current = true; } }, [connection]);
  useRealtime(CHANGED, () => { ++detailEpoch.current; void loadRef.current().catch((reason) => setError(message(reason))); });
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = session.scrollTop; }, []);
  useEffect(() => { Object.assign(session, { query, author, reviewer, sort, collapsed }); }, [query, author, reviewer, sort, collapsed]);
  useEffect(() => {
    ++detailGeneration.current;
    detailRequest.current = null;
    setDetail(null);
    if (selection.id) void loadDetail(selection.id);
  }, [selection.id, loadDetail]);
  const select = (id: string | null, tab: Tab = "summary") => navigate.toPluginPanel("requests", { subPath: id ? `${id}/${tab}` : "" });
  const sameLogin = (left: string | null | undefined, right: string | null | undefined) => !!left && !!right && left.toLowerCase() === right.toLowerCase();
  const authoredByMe = (item: PullRequestItem) => sameLogin(item.snapshot?.author, item.reader?.login);
  const requestedFromMe = (item: PullRequestItem) => (item.snapshot?.requestedReviewers ?? []).some((login) => sameLogin(login, item.reader?.login));
  const authors = [...new Set(visibleItems.flatMap((item) => item.snapshot?.author ? [item.snapshot.author] : []))].sort();
  const reviewers = [...new Set(visibleItems.flatMap((item) => item.snapshot?.requestedReviewers ?? []))].sort();
  const filtered = visibleItems.filter((item) => {
    const snapshot = item.snapshot;
    if (author && !(author === "@me" ? authoredByMe(item) : sameLogin(snapshot?.author, author))) return false;
    if (reviewer && !(reviewer === "@me" ? requestedFromMe(item) : snapshot?.requestedReviewers?.some((login) => sameLogin(login, reviewer)))) return false;
    const haystack = [snapshot?.title, snapshot?.repository, snapshot?.number, snapshot?.headBranch, snapshot?.baseBranch, item.url, ...item.links.map((link) => choices.get(link.threadId)?.title ?? "")].join(" ").toLocaleLowerCase();
    return haystack.includes(query.trim().toLocaleLowerCase());
  }).sort((a, b) => {
    const time = (item: PullRequestItem) => Date.parse(item.snapshot?.updatedAt ?? "") || 0;
    return (sort === "title" ? (a.snapshot?.title ?? "").localeCompare(b.snapshot?.title ?? "") : sort === "oldest" ? time(a) - time(b) : time(b) - time(a)) || a.id.localeCompare(b.id);
  });
  const isHistory = (item: PullRequestItem) => ["merged", "closed"].includes(item.snapshot?.state ?? "");
  const pinned = filtered.filter((item) => item.pinned);
  const active = filtered.filter((item) => !item.pinned && !isHistory(item));
  const history = filtered.filter((item) => !item.pinned && isHistory(item));
  const hasFilters = !!(query || author || reviewer);
  const resetFilters = () => { setQuery(""); setAuthor(""); setReviewer(""); };
  const mutate = async (action: () => Promise<PullRequestItem>) => { try { await action(); if (mounted.current) { await load(); setError(null); } } catch (reason) { if (mounted.current) setError(message(reason)); } };
  const onUnlink = async (item: PullRequestItem, threadId: string) => {
    try { const result = await rpc.call("unlink", { id: item.id, threadId }); if (result.undoToken) setUndo({ token: result.undoToken, title: choices.get(threadId)?.title ?? "Thread" }); await load(); }
    catch (reason) { setError(message(reason)); }
  };
  const renderRow = (item: PullRequestItem) => {
    const snapshot = item.snapshot;
    const fresh = githubFresh(item, clock);
    const blocking = snapshot?.mergeability === "conflicts" ? mergePresentation("conflicts") : snapshot?.review === "changes-requested" ? reviewPresentation("changes-requested") : snapshot?.mergeability === "blocked" && githubNeedsAttention(snapshot) && snapshot.checks.state !== "failing" ? { icon: AlertTriangle, label: "Merge blocked; repository requirements need attention", tone: "warning" as const } : null;
    const threadsNeedingInput = item.links.filter((link) => needsThread(liveThreads.get(link.threadId)));
    const working = item.links.map((link) => liveThreads.get(link.threadId)).find((thread) => thread && ["active", "starting", "stopping"].includes(thread.status));
    const githubStatus = !fresh ? { icon: Clock, label: item.sourceMessage ?? `GitHub status last checked ${age(snapshot?.fetchedAt ?? null)}`, tone: "muted" as const } : blocking ?? (snapshot && snapshot.checks.state !== "none" ? checksPresentation(snapshot) : null);
    const threadStatus = threadsNeedingInput.length > 0 ? { ...threadPresentation(liveThreads.get(threadsNeedingInput[0]!.threadId)), label: `${threadsNeedingInput.length} ${threadsNeedingInput.length === 1 ? "thread needs" : "threads need"} attention` } : working ? threadPresentation(working) : null;
    const status = threadsNeedingInput.length > 0 ? threadStatus : fresh && (blocking || snapshot?.checks.state === "failing") ? githubStatus : threadStatus ?? githubStatus;
    return <div className={`pr-row${selection.id === item.id ? " pr-row-selected" : ""}`} key={item.id}>
      <StatusIcon {...lifecycle(snapshot)} />
      <button type="button" className="pr-row-title" onClick={() => select(item.id)} aria-current={selection.id === item.id ? "page" : undefined} title={snapshot ? `${snapshot.title} · ${snapshot.repository} #${snapshot.number}` : item.url}>{snapshot?.title ?? "Pull request unavailable"}</button>
      <div className="pr-row-statuses">{status && <StatusIcon {...status} label={[githubStatus?.label, threadStatus?.label].filter(Boolean).join(" · ")} />}</div>
      <time className="pr-row-time" dateTime={snapshot?.updatedAt} title={snapshot ? `Updated ${new Date(snapshot.updatedAt).toLocaleString()}` : undefined}>{snapshot ? age(snapshot.updatedAt).replace(" ago", "").replace("just now", "now") : "—"}</time>
    </div>;
  };
  const renderSection = (id: Group, label: string, items: PullRequestItem[]) => items.length > 0 && <section className="pr-list-group">
    <button className="pr-group-title" type="button" aria-expanded={!collapsed.includes(id)} aria-controls={`pr-group-${id}`} onClick={() => setCollapsed((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])}>{label}<ChevronDown size={14} className={collapsed.includes(id) ? "pr-collapsed" : undefined} aria-hidden="true" /></button>
    {!collapsed.includes(id) && <div id={`pr-group-${id}`}>{items.map(renderRow)}</div>}
  </section>;
  return <main className={`pr-plugin${selection.id ? " pr-has-selection" : ""}`}>
    <aside className="pr-sidebar" aria-label="Pull requests">
      <header className="pr-list-header"><h1>Pull Requests</h1>
        <InboxMenu author={author} reviewer={reviewer} sort={sort} authors={authors} reviewers={reviewers}
          onAuthor={setAuthor} onReviewer={setReviewer} onSort={setSort}
          reviewerDataIncomplete={visibleItems.some((item) => item.snapshot && !item.snapshot.reviewRequestsComplete)} />
      </header>
      <form className="pr-list-toolbar" onSubmit={(event) => { event.preventDefault(); const known = visibleItems.find((item) => item.url === query.trim().replace(/[?#].*$/, "")); if (known) select(known.id); else if (/^https:\/\/github\.com\//i.test(query.trim())) setLinking({ url: query.trim() }); }}><label className="pr-search"><Search size={17} aria-hidden="true" /><input aria-label="Search pull requests" placeholder="Search or paste a PR link" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <IconButton icon={X} label="Clear search" onClick={() => setQuery("")} />}</label></form>
      {hasFilters && <div className="pr-active-filters"><span>{filtered.length} matching pull requests</span><button type="button" className="pr-text-button" onClick={resetFilters}>Clear</button></div>}
      <div ref={listRef} className="pr-list-scroll" onScroll={(event) => { session.scrollTop = event.currentTarget.scrollTop; }}>
        {pinned.map(renderRow)}
        {active.map(renderRow)}
        {renderSection("history", "Merged and closed", history)}
        {filtered.length === 0 && (booting || (!hasFilters && visibleItems.length === 0 && coverage.running) ? <Loading label="Discovering pull requests" /> : <div className="pr-list-empty"><p>{hasFilters ? "No matching pull requests" : "No pull requests found"}</p><small>{hasFilters ? "Try another search or filter." : "Your authored pull requests and review requests on GitHub appear here."}</small>{!hasFilters && <button className="pr-text-button" type="button" onClick={() => setLinking({})}>Link a pull request</button>}</div>)}
        {nextCursor && <button className="pr-load-more" type="button" disabled={listLoading} onClick={() => setPageLimit((current) => current + 1)}>{listLoading ? "Loading more…" : `Load more · ${items.length} of ${total}`}</button>}
      </div>
      <div className="pr-list-footer">
        <span title={nextCursor ? `Filters and sorting apply to ${items.length} loaded pull requests.` : undefined}>{nextCursor ? `${items.length} of ${total} loaded` : `${visibleItems.length} pull requests`}</span>
        <span className="pr-sync-status" role="status">{coverage.running ? "Syncing…" : coverage.unavailable > 0 ? `${coverage.unavailable} source${coverage.unavailable === 1 ? "" : "s"} unavailable` : coverage.incomplete ? "Partial coverage" : filtered.some((item) => !isHistory(item) && !githubFresh(item, clock)) ? "Cached" : ""}</span>
        <IconButton icon={RefreshCw} label="Refresh pull requests" disabled={refreshing} spin={refreshing} onClick={() => void refresh(true)} />
      </div>
    </aside>
    <section className="pr-detail" aria-label="Pull request detail">
      {error && <div className="pr-error" role="alert"><AlertTriangle size={16} /><span>{error}</span><button className="pr-text-button" type="button" onClick={() => void refresh(true)}>Retry</button><IconButton icon={X} label="Dismiss error" onClick={() => setError(null)} /></div>}
      {selected ? <PullRequestDetail key={selected.id} item={selected} loading={detailLoading} tab={selection.tab} now={clock} context={context} choices={choices} liveThreads={liveThreads} rpc={rpc} onBack={() => select(null)} onTab={(tab) => select(selected.id, tab)} onThread={(id) => navigate.toThread(id)} onUpdate={mutate} onRefresh={() => void refresh(false, selected.id)} onLink={() => setLinking({ url: selected.url })} onUnlink={(threadId) => void onUnlink(selected, threadId)} /> : selection.id ? detailLoading ? <div className="pr-empty"><Loading label="Loading pull request details" /><button type="button" className="pr-text-button" onClick={() => select(null)}>Back to pull requests</button></div> : <Empty title="Pull request unavailable"><button type="button" className="pr-text-button" onClick={() => select(null)}>Back to pull requests</button></Empty> : <Empty title="Select a pull request">Choose one from the sidebar to review its changes.</Empty>}
    </section>
    {undo && <div className="pr-undo" role="status"><span>Removed link to {undo.title}</span><button type="button" onClick={() => void mutate(async () => { const restored = await rpc.call("undo", { token: undo.token }); setUndo(null); return restored; })}>Undo</button><IconButton icon={X} label="Dismiss undo" onClick={() => setUndo(null)} /></div>}
    {linking && <LinkDialog rpc={rpc} initialUrl={linking.url ?? ""} choices={[...choices.values()]} hosts={context.hosts} onClose={() => setLinking(null)} onLinked={(item) => { setLinking(null); select(item.id); void load().catch((reason) => setError(message(reason))); }} />}
  </main>;
}

function PullRequestDetail({ item, loading, tab, now, context, choices, liveThreads, rpc, onBack, onTab, onThread, onUpdate, onRefresh, onLink, onUnlink }: {
  item: PullRequestItem; loading: boolean; tab: Tab; now: number; context: ThreadContext; choices: ReadonlyMap<string, ThreadChoice>; liveThreads: ReadonlyMap<string, PluginSidebarThread>; rpc: Rpc;
  onBack(): void; onTab(tab: Tab): void; onThread(id: string): void; onUpdate(action: () => Promise<PullRequestItem>): Promise<void>; onRefresh(): void; onLink(): void; onUnlink(threadId: string): void;
}) {
  const snapshot = item.snapshot;
  const [sourceHost, setSourceHost] = useState(item.reader?.hostId ?? "");
  const [sourceBusy, setSourceBusy] = useState(false);
  const origins = item.links.filter((link) => link.origin);
  const preferred = item.links.find((link) => link.threadId === item.preferredThreadId) ?? (origins.length === 1 ? origins[0] : undefined) ?? (item.links.length === 1 ? item.links[0] : undefined);
  const [manage, setManage] = useState(false);
  const threadsSection = useRef<HTMLElement>(null);
  const pendingThreadFocus = useRef(false);
  const revealThreads = () => {
    threadsSection.current?.focus({ preventScroll: true });
    threadsSection.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  useEffect(() => {
    if (tab === "summary" && pendingThreadFocus.current) {
      pendingThreadFocus.current = false;
      revealThreads();
    }
  }, [tab]);
  const openThread = () => {
    if (preferred && choices.has(preferred.threadId)) { onThread(preferred.threadId); return; }
    if (tab === "summary") revealThreads();
    else { pendingThreadFocus.current = true; onTab("summary"); }
  };
  useEffect(() => { setSourceHost(item.reader?.hostId ?? ""); setManage(false); }, [item.id, item.reader?.hostId]);
  const sourceName = context.hosts.find((host) => host.id === item.reader?.hostId)?.name ?? "Source machine";
  return <>
    <div className="pr-detail-toolbar">
      <button type="button" className="pr-back" onClick={onBack}><ArrowLeft size={15} />Pull requests</button>
      <nav className="pr-detail-tabs" aria-label="Pull request detail">
        <button type="button" aria-current={tab === "summary" ? "page" : undefined} onClick={() => onTab("summary")}>Summary</button>
        <button type="button" aria-current={tab === "changes" ? "page" : undefined} onClick={() => onTab("changes")}>Changes{snapshot && <span className="pr-diff-total"><span className="pr-tone-success">+{snapshot.additions}</span><span className="pr-tone-danger">−{snapshot.deletions}</span></span>}</button>
      </nav>
      <div className="pr-toolbar-actions">
        <div className="pr-action-group"><IconButton icon={item.pinned ? PinOff : Pin} label={item.pinned ? "Unpin pull request" : "Pin pull request"} active={item.pinned} onClick={() => void onUpdate(() => rpc.call("pin", { id: item.id, pinned: !item.pinned }))} />{item.links.length > 0 && <External className="pr-icon-link" href={item.url}><Github size={16} aria-hidden="true" /><span className="pr-sr-only">Open pull request on GitHub</span></External>}</div>
        {item.links.length ? <button className="pr-button pr-button-primary" type="button" onClick={openThread}>{preferred && choices.has(preferred.threadId) ? "Open thread" : "Choose thread"}<ArrowRight size={14} /></button> : <External className="pr-button pr-button-primary" href={item.url}>Open on GitHub<ExternalLink size={14} /></External>}
      </div>
    </div>
    <div className="pr-detail-scroll">
      {(!githubFresh(item, now) || item.sourceMessage) && <div className="pr-source-notice"><StatusIcon icon={item.sourceState === "denied" || item.sourceState === "auth-changed" ? AlertTriangle : Clock} tone="warning" label={item.sourceState.replaceAll("-", " ")} /><span>{item.sourceMessage ?? `GitHub status last checked ${age(snapshot?.fetchedAt ?? null)}.`}{snapshot && " Showing the last known snapshot."}</span><button type="button" className="pr-text-button" onClick={onRefresh}>Retry</button></div>}
      {tab === "changes" ? <ChangesView key={`${item.id}:${item.reader?.hostId ?? ""}:${item.reader?.accountId ?? ""}:${item.sourceState}:${snapshot?.headSha ?? "unavailable"}`} item={item} rpc={rpc} /> : <div className="pr-summary">
        <header className="pr-detail-heading">
          <div className="pr-detail-meta"><StatusIcon {...lifecycle(snapshot)} /><span className="pr-pill">{snapshot ? `${snapshot.repository} #${snapshot.number}` : "Pull request"}</span></div>
          <h1>{snapshot?.title ?? "Pull request unavailable"}</h1>
          {snapshot && <><div className="pr-author-line"><span className={snapshot.author ? "pr-pill" : "pr-author"}>{snapshot.author ? `@${snapshot.author}` : "Unknown author"}</span><span>updated <time dateTime={snapshot.updatedAt} title={new Date(snapshot.updatedAt).toLocaleString()}>{age(snapshot.updatedAt)}</time></span></div>
          <details className="pr-branches"><summary aria-label="Branches"><code className="pr-pill" title={snapshot.headBranch}>{snapshot.headBranch}</code><ArrowRight size={13} aria-hidden="true" /><code className="pr-pill" title={snapshot.baseBranch}>{snapshot.baseBranch}</code><ChevronDown size={13} aria-hidden="true" /></summary><dl><dt>From</dt><dd><code className="pr-pill">{snapshot.headBranch}</code></dd><dt>Into</dt><dd><code className="pr-pill">{snapshot.baseBranch}</code></dd></dl></details></>}
        </header>
        {loading ? <aside className="pr-status-rail"><Loading label="Loading pull request status" /></aside> : snapshot && <SummaryStatusRail snapshot={snapshot} url={item.url} />}
        <div className="pr-summary-main">
        {snapshot ? <section className="pr-description" aria-label="Description">{loading ? <Loading label="Loading pull request details" /> : snapshot.body ? <Markdown content={snapshot.body} className="pr-markdown" /> : <p className="pr-muted">No description provided.</p>}</section> : <p className="pr-unavailable">This source cannot currently read the pull request. Verify its GitHub access below.</p>}
        <section className="pr-threads" ref={threadsSection} tabIndex={-1} aria-label="Related threads"><div className="pr-section-heading"><h2>Threads <span>{item.links.length}</span></h2>{item.links.length > 0 && <button type="button" className="pr-text-button" aria-expanded={manage} onClick={() => setManage(!manage)}>{manage ? "Done" : "Manage threads"}</button>}</div>{item.links.map((link) => {
          const thread = choices.get(link.threadId);
          const live = liveThreads.get(link.threadId);
          const labels = [link.origin && "Originating thread", item.preferredThreadId === link.threadId && "Preferred", thread?.archived && "Archived"].filter(Boolean);
          return <div className="pr-related-thread" key={link.threadId}><StatusIcon {...threadPresentation(live, thread?.archived)} /><div className="pr-related-thread-content"><button type="button" className="pr-thread-link" disabled={!thread} onClick={() => onThread(link.threadId)}>{live?.displayTitle ?? thread?.title ?? "Unavailable thread"}</button>{labels.length > 0 && <span className="pr-thread-evidence">{labels.join(" · ")}</span>}</div>{manage && <><IconButton icon={Check} label={item.preferredThreadId === link.threadId ? "Clear preferred thread" : "Use as preferred thread"} active={item.preferredThreadId === link.threadId} onClick={() => void onUpdate(() => rpc.call("prefer", { id: item.id, threadId: item.preferredThreadId === link.threadId ? null : link.threadId }))} /><IconButton icon={Unlink} label={`Remove link to ${thread?.title ?? link.threadId}`} onClick={() => onUnlink(link.threadId)} /></>}</div>;
        })}{(manage || !item.links.length) && <button className="pr-text-button pr-add-thread" type="button" onClick={onLink}><Plus size={14} />{item.links.length ? "Link another thread" : "Link thread"}</button>}</section>
        <details className="pr-source"><summary>Connection details<ChevronDown size={14} aria-hidden="true" /></summary><div><dl><dt>GitHub account</dt><dd>{item.reader ? <span className="pr-pill">@{item.reader.login}</span> : "Not verified"}</dd><dt>Machine</dt><dd>{sourceName}</dd><dt>Last checked</dt><dd>{age(item.lastAttemptAt)}</dd>{snapshot && <><dt>Revision</dt><dd><code>{snapshot.headSha.slice(0, 7)}</code></dd></>}</dl><label>Source machine<select value={sourceHost} onChange={(event) => setSourceHost(event.target.value)}><option value="" disabled>Select a machine</option>{context.hosts.map((host) => <option key={host.id} value={host.id} disabled={!host.connected}>{host.name}{host.connected ? "" : " · offline"}</option>)}</select></label><button type="button" className="pr-button" disabled={!sourceHost || sourceBusy} onClick={() => { setSourceBusy(true); void onUpdate(() => rpc.call("source", { id: item.id, hostId: sourceHost })).finally(() => setSourceBusy(false)); }}>{sourceBusy ? "Verifying…" : "Verify source"}</button></div></details>
        </div>
      </div>}
    </div>
  </>;
}

function SummaryStatusRail({ snapshot, url }: { snapshot: Snapshot; url: string }) {
  const [allChecks, setAllChecks] = useState(false);
  const checks = allChecks ? snapshot.checks.items : snapshot.checks.items.slice(0, 6);
  const merge = mergePresentation(snapshot.mergeability);
  const review = reviewPresentation(snapshot.review);
  const checkStatus = checksPresentation(snapshot);
  return <aside className="pr-status-rail" aria-label="Pull request status">
    <section><h2>Merge</h2><div className="pr-rail-status"><StatusIcon {...merge} /><span>{merge.label}</span>{snapshot.queued && <StatusIcon icon={Clock} label="In merge queue" tone="warning" />}{snapshot.autoMerge && <StatusIcon icon={GitMerge} label="Auto-merge enabled on GitHub" />}</div></section>
    <section><h2>Reviews</h2><div className="pr-rail-status"><StatusIcon {...review} /><span>{review.label}</span></div>{snapshot.requestedReviewers && snapshot.requestedReviewers.length > 0 && <div className="pr-requested-reviewer"><span>Requested:</span>{snapshot.requestedReviewers.map((reviewer) => <span className="pr-pill" key={reviewer}>@{reviewer}</span>)}</div>}{snapshot.reviewRequestsComplete === false && <p className="pr-muted">Reviewer list incomplete.</p>}</section>
    <section><h2>Checks</h2><details className="pr-checks"><summary><checkStatus.icon size={16} className={`pr-tone-${checkStatus.tone}`} aria-hidden="true" /><span>{snapshot.checks.state === "none" && !snapshot.checks.complete ? "Check results incomplete" : checkStatus.label}</span><ChevronDown size={14} aria-hidden="true" /></summary><div className="pr-checks-list">
      {checks.map((check, index) => <div className="pr-check-line" key={`${check.name}:${index}`}><StatusIcon icon={check.state === "passing" ? CheckCircle2 : check.state === "failing" ? XCircle : check.state === "pending" ? Clock : check.state === "neutral" ? Circle : CircleHelp} label={`${check.name}: ${check.state}`} tone={check.state === "passing" ? "success" : check.state === "failing" ? "danger" : check.state === "pending" ? "warning" : "muted"} /><External href={check.url}>{check.name}</External></div>)}
      {snapshot.checks.items.length > 6 && <button type="button" className="pr-text-button" aria-expanded={allChecks} onClick={() => setAllChecks(!allChecks)}>{allChecks ? "Show fewer checks" : `View ${snapshot.checks.items.length - 6} more checks`}</button>}
      <External href={`${url}/checks`} className="pr-subtle-link">Open checks on GitHub<ExternalLink size={12} /></External>
    </div></details></section>
    {snapshot.stack.state === "available" && snapshot.stack.items.length > 0 && <section className="pr-stack"><details><summary>Stack <span>{snapshot.stack.items.length} pull requests</span><ChevronDown size={14} aria-hidden="true" /></summary>{snapshot.stack.items.map((entry) => <div key={entry.url}><StatusIcon {...lifecycle(["open", "draft", "merged", "closed"].includes(entry.state.toLowerCase()) ? { state: entry.state.toLowerCase() as Snapshot["state"] } : null)} /><External href={entry.url}>{entry.title}<span>#{entry.number}</span></External></div>)}</details></section>}
  </aside>;
}

function ChangesView({ item, rpc }: { item: PullRequestItem; rpc: Rpc }) {
  const [changes, setChanges] = useState<Changes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [file, setFile] = useState("");
  useEffect(() => {
    if (!item.snapshot) return;
    let cancelled = false; setLoading(true);
    void rpc.call("changes", { id: item.id }).then((result) => { if (result.headSha !== item.snapshot?.headSha) throw new Error("The pull request head changed. Refresh the pull request to read its current changes."); if (!cancelled) { setChanges(result); setFile(result.files[0]?.path ?? ""); setError(null); } }).catch((reason) => { if (!cancelled) setError(message(reason)); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [item.id, item.snapshot?.headSha, rpc, attempt]);
  if (!item.snapshot) return <Empty title="Changes unavailable">Verify the source in Summary to read this pull request.</Empty>;
  if (loading) return <div className="pr-changes-loading"><Loading label="Loading changes" /></div>;
  if (error) return <div className="pr-error" role="alert"><span>{error}</span><button type="button" className="pr-text-button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></div>;
  if (!changes) return null;
  const selected = changes.files.find((entry) => entry.path === file);
  return <div className="pr-changes"><div className="pr-changes-revision"><span>{changes.total} changed files</span><External href={`${item.url}/files`} className="pr-subtle-link">Open on GitHub<ExternalLink size={12} /></External></div>{(changes.truncated || changes.message) && <p className="pr-source-notice">{changes.message ?? `Showing ${changes.files.length} of ${changes.total} files. Open GitHub for the full diff.`}</p>}<div className="pr-changes-layout"><nav aria-label="Changed files" className="pr-file-list">{changes.files.map((entry) => {
    const separator = entry.path.lastIndexOf("/");
    const directory = entry.path.slice(0, separator + 1);
    const name = entry.path.slice(separator + 1);
    return <button type="button" key={entry.path} title={entry.path} aria-label={entry.path} onClick={() => setFile(entry.path)} aria-current={file === entry.path ? "page" : undefined}><FileCode2 size={15} aria-hidden="true" /><span className="pr-file-name"><strong>{name}</strong>{directory && <span dir="rtl"><bdi dir="ltr">{directory}</bdi></span>}</span><small><span className="pr-tone-success">+{entry.additions}</span><span className="pr-tone-danger">−{entry.deletions}</span></small></button>;
  })}</nav><section className="pr-patch" aria-label="File changes">{selected ? <><header><code>{selected.path}</code>{selected.previousPath && <small>Renamed from <code>{selected.previousPath}</code></small>}</header>{selected.patch ? <pre>{selected.patch.split("\n").map((line, index) => <span key={index} className={line.startsWith("+") && !line.startsWith("+++") ? "pr-diff-add" : line.startsWith("-") && !line.startsWith("---") ? "pr-diff-remove" : line.startsWith("@@") ? "pr-diff-hunk" : undefined}>{line || " "}</span>)}</pre> : <p className="pr-muted">No text patch available for this file. <External href={`${item.url}/files`}>Open the file on GitHub.</External></p>}</> : <p className="pr-muted">No changed files returned.</p>}</section></div></div>;
}

function LinkDialog({ rpc, initialUrl, choices, hosts, onClose, onLinked }: { rpc: Rpc; initialUrl: string; choices: ThreadChoice[]; hosts: ThreadContext["hosts"]; onClose(): void; onLinked(item: PullRequestItem): void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [threadId, setThreadId] = useState("");
  const [threadQuery, setThreadQuery] = useState("");
  const [options, setOptions] = useState(choices);
  const [selectedThread, setSelectedThread] = useState<ThreadChoice | null>(null);
  const [threadCursor, setThreadCursor] = useState<string | null>(null);
  const [threadLoading, setThreadLoading] = useState(true);
  const [threadSearchError, setThreadSearchError] = useState<string | null>(null);
  const searchGeneration = useRef(0);
  const [hostId, setHostId] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  useEffect(() => { dialog.current?.showModal(); return () => { ++generation.current; }; }, []);
  const loadThreads = async (query: string, cursor: string | undefined, request: number) => {
    setThreadLoading(true); setThreadSearchError(null);
    let next = cursor;
    try {
      // The service filters each page, so an empty page is not the end of search.
      // Bound each batch and let the user continue from the next real cursor.
      for (let page = 0; page < 5; page++) {
        const result = await rpc.call("context", { query, ...(next ? { cursor: next } : {}) });
        if (searchGeneration.current !== request) return;
        setOptions((current) => [...new Map([...current, ...result.threads].map((thread) => [thread.id, thread])).values()]);
        setThreadCursor(result.nextCursor);
        if (!result.nextCursor) break;
        next = result.nextCursor;
      }
    } catch (reason) {
      if (searchGeneration.current === request) {
        setThreadCursor(next ?? null);
        setThreadSearchError(message(reason));
      }
    } finally { if (searchGeneration.current === request) setThreadLoading(false); }
  };
  useEffect(() => {
    const request = ++searchGeneration.current;
    setOptions([]); setThreadCursor(null); setThreadLoading(true); setThreadSearchError(null);
    const timer = window.setTimeout(() => { void loadThreads(threadQuery, undefined, request); }, 180);
    return () => { ++searchGeneration.current; window.clearTimeout(timer); };
  }, [threadQuery, rpc]);
  const threadOptions = selectedThread && !options.some((thread) => thread.id === selectedThread.id) ? [selectedThread, ...options] : options;
  const invalidate = () => { ++generation.current; setPreview(null); setError(null); setBusy(false); };
  const inspect = async () => {
    const request = ++generation.current; setBusy(true); setError(null);
    try { const result = await rpc.call("preview", { url, threadId, ...(hostId ? { hostId } : {}) }); if (generation.current === request) setPreview(result); }
    catch (reason) { if (generation.current === request) setError(message(reason)); }
    finally { if (generation.current === request) setBusy(false); }
  };
  return <dialog ref={dialog} className="pr-link-dialog" onCancel={onClose} onClick={(event) => { if (event.target === dialog.current) onClose(); }}><form onSubmit={(event) => { event.preventDefault(); void inspect(); }}><header><h2>Link pull request</h2><IconButton icon={X} label="Close link dialog" onClick={onClose} /></header><p>Connect an existing GitHub pull request to a bb thread.</p><label>Pull request URL<input autoFocus type="url" required value={url} placeholder="https://github.com/owner/repo/pull/123" onChange={(event) => { invalidate(); setUrl(event.target.value); }} /></label><label>Find thread<input type="search" value={threadQuery} placeholder="Search threads" onChange={(event) => { invalidate(); setThreadQuery(event.target.value); }} /></label><label>Thread<select required value={threadId} onChange={(event) => { invalidate(); setThreadId(event.target.value); setSelectedThread(threadOptions.find((thread) => thread.id === event.target.value) ?? null); }}><option value="">Choose a thread</option>{threadOptions.map((thread) => <option key={thread.id} value={thread.id}>{thread.title}{thread.archived ? " · archived" : ""}</option>)}</select></label><div aria-live="polite"><p className="pr-muted">{threadLoading ? "Searching threads…" : threadSearchError ? `Thread search interrupted: ${threadSearchError}` : threadCursor ? `${options.length} matching threads found · more threads to search` : `${options.length} matching threads · search complete`}</p>{!threadLoading && (threadCursor || threadSearchError) && <button type="button" className="pr-text-button" onClick={() => void loadThreads(threadQuery, threadCursor ?? undefined, searchGeneration.current)}>{threadSearchError ? "Retry thread search" : "Search more threads"}</button>}</div><details><summary>Source machine</summary><label className="pr-sr-only" htmlFor="pr-link-host">Source machine</label><select id="pr-link-host" value={hostId} onChange={(event) => { invalidate(); setHostId(event.target.value); }}><option value="">Use the thread’s machine</option>{hosts.filter((host) => host.connected).map((host) => <option key={host.id} value={host.id}>{host.name}</option>)}</select></details>{error && <p className="pr-error" role="alert">{error}</p>}{preview && <div className="pr-link-preview"><div><StatusIcon {...lifecycle(preview.snapshot)} /><strong>{preview.snapshot.title}</strong></div><p>{preview.snapshot.repository} #{preview.snapshot.number}</p><p><MessageCircle size={14} />{preview.thread.title}</p><small>Verified as @{preview.reader.login}</small></div>}<footer><button type="button" className="pr-button" onClick={onClose}>Cancel</button>{preview ? <button type="button" className="pr-button pr-button-primary" disabled={busy} onClick={() => { const request = ++generation.current; setBusy(true); void rpc.call("link", { token: preview.token }).then((item) => { if (generation.current === request) onLinked(item); }).catch((reason) => { if (generation.current === request) setError(message(reason)); }).finally(() => { if (generation.current === request) setBusy(false); }); }}>{busy ? "Linking…" : "Link pull request"}</button> : <button type="submit" className="pr-button pr-button-primary" disabled={busy || !threadId || !url.trim()}>{busy ? "Checking…" : "Preview link"}</button>}</footer></form></dialog>;
}

export default definePluginApp((app) => {
  app.slots.navPanel({ id: "requests", title: "Pull Requests", icon: "GitPullRequest", path: "requests", component: PullRequestsPanel });
});
