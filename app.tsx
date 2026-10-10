import { useCallback, useEffect, useId, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown,
  Circle, CircleHelp, Clock, ExternalLink, FileCode2, Github, GitMerge, GitPullRequest,
  GitPullRequestClosed, GitPullRequestDraft, Layers, Link2, MessageCircle,
  Pin, PinOff, Plus, RefreshCw, Search, Unlink, X, XCircle, type LucideIcon,
} from "lucide-react";
import {
  definePluginApp, experimental_Icon, experimental_useSidebarThreads, Markdown, useBbNavigate, useRealtime,
  useRealtimeConnectionState, useRpc, type PluginNavPanelProps, type PluginSidebarThread,
} from "@get-bb/plugin-sdk/app";
import { CHANGED, type Changes, type Listing, type PullRequestItem, type Snapshot, type ThreadChoice, type rpcContract } from "./contract";
import { dependencyGroups, dependencyStatus, filterGroups, githubFresh, isHistory, ownerThread, projectFor, statusOf, type DependencyGroup, type Entry, type StatusFilter } from "./hierarchy";
import { DEFAULT_AUTHOR, DEFAULT_STATUS, InboxMenu, type GroupBy, type Sort } from "./inbox-menu";
import "./app.css";

type Rpc = ReturnType<typeof useRpc<typeof rpcContract>>;
type Group = string;
type Tab = "summary" | "changes";
type StatusGlyph = ComponentType<{ size?: number; strokeWidth?: number; className?: string; "aria-hidden"?: boolean | "true" }>;
type Presentation = { icon: StatusGlyph; label: string; tone?: "success" | "danger" | "warning" | "muted" | "purple"; spin?: boolean };
type ThreadContext = { threads: ThreadChoice[]; hosts: { id: string; name: string; connected: boolean }[]; nextCursor: string | null };
type Preview = { token: string; snapshot: Snapshot; reader: { login: string; hostId: string }; thread: ThreadChoice };
const session = { query: "", author: DEFAULT_AUTHOR, reviewer: "", sort: "updated" as Sort, groupBy: "project" as GroupBy, status: DEFAULT_STATUS as StatusFilter, attention: false, collapsed: [] as Group[], scrollTop: 0 };
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
function AuthorTag({ author, avatarUrl }: { author: Snapshot["author"]; avatarUrl: Snapshot["authorAvatarUrl"] }) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const src = safeUrl(avatarUrl);
  return <span className="pr-author-tag"><span className="pr-author-avatar" aria-hidden="true">
    {src && src !== failedUrl ? <img src={src} alt="" width={20} height={20} referrerPolicy="no-referrer" onError={() => setFailedUrl(src)} /> : author?.slice(0, 1).toUpperCase() || "?"}
  </span>{author ? `@${author}` : "Unknown author"}</span>;
}
/** bb's own thread-working glyph, so plugin activity matches the sidebar. */
const BbIcon = experimental_Icon;
function WorkingIcon({ size = 16, className }: { size?: number; className?: string }) {
  return <BbIcon name="Loading" aria-hidden="true" className={["pr-working", className].filter(Boolean).join(" ")} style={{ width: size, height: size }} />;
}
function threadPresentation(thread?: PluginSidebarThread, archived = false): Presentation {
  if (!thread) return { icon: archived ? Clock : CircleHelp, label: archived ? "Archived thread" : "Thread activity unavailable", tone: "muted" };
  if (thread.hasPendingInteraction || thread.indicator === "waiting-for-input") return { icon: MessageCircle, label: thread.indicatorLabel ?? "Waiting for your input", tone: "warning" };
  if (thread.indicator === "unread-error" || thread.indicator === "queued-failed" || thread.status === "error") return { icon: AlertCircle, label: thread.indicatorLabel ?? "Thread error", tone: "danger" };
  if (["active", "starting", "stopping"].includes(thread.status) || Object.values(thread.activity).some((count) => count > 0)) return { icon: WorkingIcon, label: thread.indicatorLabel ?? "Thread working", spin: true };
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
/** One icon for a stack: any failure wins, then pending; history members do not count. */
function stackChecks(group: DependencyGroup): Presentation {
  const states = group.entries.flatMap(({ item }) => item?.snapshot && !isHistory(item) ? [item.snapshot.checks.state] : []);
  const count = (state: Snapshot["checks"]["state"]) => states.filter((value) => value === state).length;
  if (!states.length) return { icon: Circle, label: "No open pull requests", tone: "muted" };
  if (count("failing")) return { icon: XCircle, label: `${count("failing")} of ${states.length} pull requests failing checks`, tone: "danger" };
  if (count("pending")) return { icon: Clock, label: `${count("pending")} of ${states.length} pull requests with pending checks`, tone: "warning" };
  if (count("passing") && count("passing") + count("none") === states.length) return { icon: CheckCircle2, label: "Checks passing", tone: "success" };
  if (count("none") === states.length) return { icon: Circle, label: "No checks reported", tone: "muted" };
  return { icon: CircleHelp, label: "Checks unknown", tone: "muted" };
}
export function needsAttention(item: PullRequestItem, threads: ReadonlyMap<string, PluginSidebarThread>, now: number): boolean {
  return statusOf(item, threads, now).attention;
}
const STACK_PREFIX = "stack:";
function parseSelection(subPath: string): { id: string | null; stack: string | null; tab: Tab } {
  const [encoded, tab] = subPath.split("/");
  try {
    const value = encoded ? decodeURIComponent(encoded) : null;
    if (value?.startsWith(STACK_PREFIX)) return { id: null, stack: value.slice(STACK_PREFIX.length), tab: "summary" };
    return { id: value, stack: null, tab: tab === "changes" ? "changes" : "summary" };
  }
  catch { return { id: null, stack: null, tab: "summary" }; }
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
  return <div className="pr-loading" role="status" aria-busy="true" aria-label={label}>{visible && <><WorkingIcon className="pr-spin" /><span aria-hidden="true">{label}…</span></>}</div>;
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
  const [groupBy, setGroupBy] = useState<GroupBy>(session.groupBy);
  const [status, setStatus] = useState(session.status);
  const [attention, setAttention] = useState(session.attention);
  const [authors, setAuthors] = useState<string[]>([]);
  const [projectRepositories, setProjectRepositories] = useState<{ id: string; repository: string }[]>([]);
  const [collapsed, setCollapsed] = useState<Group[]>(session.collapsed);
  const [query, setQuery] = useState(session.query);
  const [booting, setBooting] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [detailFailure, setDetailFailure] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      if (current()) { setClock(Date.now()); setDetail(item); }
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
      const result = await rpc.call("inbox", {});
      if (!mounted.current || generation !== readGeneration.current) return;
      setClock(Date.now());
      const byId = new Map(result.items.map((item) => [item.id, item]));
      setItems([...byId.values()]);
      setCoverage(result.coverage); setAuthors(result.authors ?? []); setProjectRepositories(result.projects ?? []);
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
  }, [rpc, loadDetail]);
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
  const wasConnected = useRef(false);
  useEffect(() => { if (connection === "connected") { if (wasConnected.current) { ++detailEpoch.current; void loadRef.current().catch((reason) => setError(message(reason))); } wasConnected.current = true; } }, [connection]);
  useRealtime(CHANGED, () => { ++detailEpoch.current; void loadRef.current().catch((reason) => setError(message(reason))); });
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = session.scrollTop; }, []);
  useEffect(() => { Object.assign(session, { query, author, reviewer, sort, groupBy, status, attention, collapsed }); }, [query, author, reviewer, sort, groupBy, status, attention, collapsed]);
  useEffect(() => {
    ++detailGeneration.current;
    detailRequest.current = null;
    setDetail(null);
    if (selection.id) void loadDetail(selection.id);
  }, [selection.id, loadDetail]);
  const select = (id: string | null, tab: Tab = "summary") => navigate.toPluginPanel("requests", { subPath: id ? `${id}/${tab}` : "" });
  // Routes use the stack's first known member id; GitHub URLs contain path separators.
  const stackId = (group: DependencyGroup) => group.entries.find((entry) => entry.item)!.item!.id;
  const selectStack = (group: DependencyGroup) => navigate.toPluginPanel("requests", { subPath: `${STACK_PREFIX}${stackId(group)}` });
  const sameLogin = (left: string | null | undefined, right: string | null | undefined) => !!left && !!right && left.toLowerCase() === right.toLowerCase();
  // Matches the server's "@me" filter: rows hidden after access loss stay reachable for recovery.
  const authoredByMe = (item: PullRequestItem) => !item.snapshot || sameLogin(item.snapshot.author, item.reader?.login);
  const requestedFromMe = (item: PullRequestItem) => (item.snapshot?.requestedReviewers ?? []).some((login) => sameLogin(login, item.reader?.login));
  const reviewers = [...new Set(visibleItems.flatMap((item) => item.snapshot?.requestedReviewers ?? []))].sort();
  const matches = (item: PullRequestItem) => {
    const snapshot = item.snapshot;
    if (author && !(author === "@me" ? authoredByMe(item) : sameLogin(snapshot?.author, author))) return false;
    if (reviewer && !(reviewer === "@me" ? requestedFromMe(item) : snapshot?.requestedReviewers?.some((login) => sameLogin(login, reviewer)))) return false;
    const haystack = [snapshot?.title, snapshot?.repository, snapshot?.number, snapshot?.headBranch, snapshot?.baseBranch, item.url, ...item.links.map((link) => choices.get(link.threadId)?.title ?? "")].join(" ").toLocaleLowerCase();
    return haystack.includes(query.trim().toLocaleLowerCase());
  };
  const groups = useMemo(() => dependencyGroups(visibleItems, clock), [visibleItems, clock]);
  const statuses = new Map(groups.flatMap((group) => group.entries.flatMap((entry) => entry.item ? [[entry.item.id, statusOf(entry.item, liveThreads, clock, dependencyStatus(entry, group, clock), connection === "connected")] as const] : [])));
  const updatedAt = (group: DependencyGroup) => Math.max(...group.entries.map(({ item }) => Date.parse(item?.snapshot?.updatedAt ?? "") || 0));
  const filtered = filterGroups(groups, status, matches, attention, statuses).sort((a, b) => {
    const pin = (group: DependencyGroup) => group.entries.some(({ item }) => item?.pinned) ? 1 : 0;
    return pin(b) - pin(a) || (sort === "title" ? a.entries[0]!.title.localeCompare(b.entries[0]!.title) : sort === "oldest" ? updatedAt(a) - updatedAt(b) : updatedAt(b) - updatedAt(a)) || a.key.localeCompare(b.key);
  });
  const hasFilters = !!(query || status !== DEFAULT_STATUS || author !== DEFAULT_AUTHOR || reviewer || attention);
  const resetFilters = () => { setQuery(""); setStatus(DEFAULT_STATUS); setAuthor(DEFAULT_AUTHOR); setReviewer(""); setAttention(false); };
  const me = items.find((item) => item.reader)?.reader?.login ?? null;
  const groupOf = (group: DependencyGroup): { key: string; label: string } => {
    const item = group.entries.find((entry) => entry.item)?.item!;
    if (groupBy === "section") {
      const owner = ownerThread(item, choices);
      const linked = owner && liveThreads.get(owner.id);
      const section = linked?.sectionId ? sidebar.sections.find((entry) => entry.id === linked.sectionId) : undefined;
      return section ? { key: `section:${section.id}`, label: section.name } : { key: "section:~none", label: "No section" };
    }
    const projectId = projectFor(item, choices, projectRepositories);
    const project = projectId ? sidebar.projects.find((entry) => entry.id === projectId) : undefined;
    return projectId ? { key: `project:${projectId}`, label: project?.name ?? "Project unavailable" } : { key: `repository:${item.snapshot?.repository.toLowerCase() ?? "unknown"}`, label: item.snapshot?.repository ?? "Repository unavailable" };
  };
  const grouped = [...filtered.reduce((result, group) => {
    const { key, label } = groupOf(group);
    const section = result.get(key) ?? { key, label, groups: [] as DependencyGroup[] };
    section.groups.push(group); result.set(key, section); return result;
  }, new Map<string, { key: string; label: string; groups: DependencyGroup[] }>()).values()].sort((a, b) => a.label.localeCompare(b.label) || a.key.localeCompare(b.key));
  const mutate = async (action: () => Promise<PullRequestItem>) => { try { await action(); if (mounted.current) { await load(); setError(null); } } catch (reason) { if (mounted.current) setError(message(reason)); } };
  const onUnlink = async (item: PullRequestItem, threadId: string) => {
    try { const result = await rpc.call("unlink", { id: item.id, threadId }); if (result.undoToken) setUndo({ token: result.undoToken, title: choices.get(threadId)?.title ?? "Thread" }); await load(); }
    catch (reason) { setError(message(reason)); }
  };
  const toggle = (key: string) => setCollapsed((current) => current.includes(key) ? current.filter((value) => value !== key) : [...current, key]);
  const shortAge = (value: string) => age(value).replace(" ago", "").replace("just now", "now");
  const renderRow = (entry: Entry) => {
    const item = entry.item;
    if (!item) return <div className="pr-missing-member" key={entry.key} title="Not in the known list"><External href={entry.url}>#{entry.number} {entry.title}</External></div>;
    const snapshot = item.snapshot;
    return <div className={`pr-row${selection.id === item.id ? " pr-row-selected" : ""}`} key={item.id}>
      <StatusIcon {...lifecycle(snapshot)} />
      <button type="button" className="pr-row-title" onClick={() => select(item.id)} aria-current={selection.id === item.id ? "page" : undefined} title={snapshot ? `${snapshot.title} · ${snapshot.repository} #${snapshot.number}` : item.url}>{snapshot?.title ?? "Pull request unavailable"}</button>
      {item.pinned && <Pin size={12} aria-label="Pinned" className="pr-tone-muted" />}
      {snapshot && <span className="pr-row-checks"><StatusIcon {...checksPresentation(snapshot)} /></span>}
      <time className="pr-row-time" dateTime={snapshot?.updatedAt}>{snapshot ? shortAge(snapshot.updatedAt) : "—"}</time>
    </div>;
  };
  /** A stack is one sidebar row; its pull requests open in the detail pane. */
  const renderStackRow = (group: DependencyGroup) => {
    const active = selection.stack === stackId(group) || group.entries.some(({ item }) => item && item.id === selection.id);
    const time = updatedAt(group);
    const title = group.entries[0]!.title;
    return <div className={`pr-row${active ? " pr-row-selected" : ""}`} key={`stack:${group.key}`}>
      <StatusIcon icon={Layers} label={`${group.kind === "native" ? "GitHub stack" : "Branch dependencies"}: ${group.entries.map((entry) => `#${entry.number}`).join(" → ")}`} />
      <button type="button" className="pr-row-title" onClick={() => selectStack(group)} aria-current={selection.stack === stackId(group) ? "page" : undefined} aria-label={`${title}, stack of ${group.entries.length} pull requests`} title={title}>{title}<span className="pr-row-count">{group.entries.length}</span></button>
      {group.entries.some(({ item }) => item?.pinned) && <Pin size={12} aria-label="Pinned" className="pr-tone-muted" />}
      <span className="pr-row-checks"><StatusIcon {...stackChecks(group)} /></span>
      <time className="pr-row-time" dateTime={time ? new Date(time).toISOString() : undefined}>{time ? shortAge(new Date(time).toISOString()) : "—"}</time>
    </div>;
  };
  const renderGroup = (group: DependencyGroup) => group.kind === "single" ? renderRow(group.entries[0]!) : renderStackRow(group);
  const renderProject = (section: typeof grouped[number]) => {
    const open = !collapsed.includes(section.key);
    return <section className="pr-list-group" key={section.key}>
      <button className="pr-group-title" type="button" aria-expanded={open} aria-controls={`pr-group-${encodeURIComponent(section.key)}`} onClick={() => toggle(section.key)}><span className="pr-group-label">{section.label}</span></button>
      {open && <div id={`pr-group-${encodeURIComponent(section.key)}`}>{section.groups.map(renderGroup)}</div>}
    </section>;
  };
  const selectedStack = selection.stack ? groups.find((group) => group.kind !== "single" && stackId(group) === selection.stack) : undefined;
  return <main className={`pr-plugin${selection.id || selection.stack ? " pr-has-selection" : ""}`}>
    <aside className="pr-sidebar" aria-label="Pull requests">
      <header className="pr-list-header"><h1>Pull Requests</h1>
        <InboxMenu status={status} onStatus={setStatus} author={author} reviewer={reviewer} sort={sort} groupBy={groupBy} authors={authors} reviewers={reviewers} me={me}
          onAuthor={setAuthor} onReviewer={setReviewer} onSort={setSort} onGroupBy={setGroupBy}
          reviewerDataIncomplete={visibleItems.some((item) => item.snapshot && !item.snapshot.reviewRequestsComplete)} />
      </header>
      <form className="pr-list-toolbar" onSubmit={(event) => { event.preventDefault(); const known = visibleItems.find((item) => item.url === query.trim().replace(/[?#].*$/, "")); if (known) select(known.id); else if (/^https:\/\/github\.com\//i.test(query.trim())) setLinking({ url: query.trim() }); }}><label className="pr-search"><Search size={17} aria-hidden="true" /><input aria-label="Search pull requests" placeholder="Search or paste a PR link" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <IconButton icon={X} label="Clear search" onClick={() => setQuery("")} />}</label></form>
      <div className="pr-view-controls"><button type="button" aria-pressed={attention} onClick={() => setAttention((value) => !value)}>Needs attention</button></div>
      {hasFilters && <div className="pr-active-filters"><span>{listLoading ? "Loading complete list…" : `${filtered.length} matching groups`}</span><button type="button" className="pr-text-button" onClick={resetFilters}>Clear</button></div>}
      <div ref={listRef} className="pr-list-scroll" onScroll={(event) => { session.scrollTop = event.currentTarget.scrollTop; }}>
        {groupBy === "none" ? filtered.map(renderGroup) : grouped.map(renderProject)}
        {filtered.length === 0 && (booting || (!hasFilters && visibleItems.length === 0 && coverage.running) ? <Loading label="Discovering pull requests" /> : <div className="pr-list-empty"><p>{hasFilters ? "No known matching pull requests" : "No pull requests found"}</p><small>{hasFilters ? "Try another filter or refresh. Unknown statuses may still need attention." : "Your authored pull requests and review requests on GitHub appear here."}</small>{!hasFilters && <button className="pr-text-button" type="button" onClick={() => setLinking({})}>Link a pull request</button>}</div>)}

      </div>
      <div className="pr-list-footer">
        <span>{listLoading ? "Loading complete list…" : `${visibleItems.length} known pull requests`}</span>
        <span className="pr-sync-status" role="status">{coverage.running ? "Syncing…" : coverage.unavailable > 0 ? `${coverage.unavailable} source${coverage.unavailable === 1 ? "" : "s"} unavailable` : coverage.incomplete ? "Partial coverage" : visibleItems.some((item) => !isHistory(item) && !githubFresh(item, clock)) ? "Cached" : ""}</span>
        <IconButton icon={RefreshCw} label="Refresh pull requests" disabled={refreshing} spin={refreshing} onClick={() => void refresh(true)} />
      </div>
    </aside>
    <section className="pr-detail" aria-label="Pull request detail">
      {error && <div className="pr-error" role="alert"><AlertTriangle size={16} /><span>{error}</span><button className="pr-text-button" type="button" onClick={() => void refresh(true)}>Retry</button><IconButton icon={X} label="Dismiss error" onClick={() => setError(null)} /></div>}
      {selection.stack ? selectedStack ? <StackDetail group={selectedStack} onBack={() => select(null)}>{selectedStack.entries.map(renderRow)}</StackDetail> : listLoading && !items.length ? <div className="pr-empty"><Loading label="Loading stack" /></div> : <Empty title="Stack unavailable"><button type="button" className="pr-text-button" onClick={() => select(null)}>Back to pull requests</button></Empty>
        : selected ? <PullRequestDetail key={selected.id} item={selected} loading={detailLoading} tab={selection.tab} now={clock} context={context} choices={choices} liveThreads={liveThreads} rpc={rpc} onBack={() => select(null)} onTab={(tab) => select(selected.id, tab)} onThread={(id) => navigate.toThread(id)} onUpdate={mutate} onRefresh={() => void refresh(false, selected.id)} onLink={() => setLinking({ url: selected.url })} onUnlink={(threadId) => void onUnlink(selected, threadId)} /> : selection.id ? detailLoading ? <div className="pr-empty"><Loading label="Loading pull request details" /><button type="button" className="pr-text-button" onClick={() => select(null)}>Back to pull requests</button></div> : <Empty title="Pull request unavailable"><button type="button" className="pr-text-button" onClick={() => select(null)}>Back to pull requests</button></Empty> : <Empty title="Select a pull request">Choose one from the sidebar to review its changes.</Empty>}
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
        {item.links.length ? <button className="pr-button pr-button-primary" type="button" onClick={openThread}>{preferred && choices.has(preferred.threadId) ? "Open thread" : "View threads"}{preferred && choices.has(preferred.threadId) && <ArrowRight size={14} />}</button> : <External className="pr-button pr-button-primary" href={item.url}>Open on GitHub<ExternalLink size={14} /></External>}
      </div>
    </div>
    <div className="pr-detail-scroll">
      {(!githubFresh(item, now) || item.sourceMessage) && <div className="pr-source-notice"><StatusIcon icon={item.sourceState === "denied" || item.sourceState === "auth-changed" ? AlertTriangle : Clock} tone="warning" label={item.sourceState.replaceAll("-", " ")} /><span>{item.sourceMessage ?? `GitHub status last checked ${age(snapshot?.fetchedAt ?? null)}.`}{snapshot && " Showing the last known snapshot."}</span><button type="button" className="pr-text-button" onClick={onRefresh}>Retry</button></div>}
      {tab === "changes" ? <ChangesView key={`${item.id}:${item.reader?.hostId ?? ""}:${item.reader?.accountId ?? ""}:${item.sourceState}:${snapshot?.headSha ?? "unavailable"}`} item={item} rpc={rpc} /> : <div className="pr-summary">
        <header className="pr-detail-heading">
          <div className="pr-detail-meta"><StatusIcon {...lifecycle(snapshot)} /><span>{snapshot ? `${snapshot.repository} #${snapshot.number}` : "Pull request"}</span></div>
          <h1>{snapshot?.title ?? "Pull request unavailable"}</h1>
          {snapshot && <><div className="pr-author-line"><AuthorTag author={snapshot.author} avatarUrl={snapshot.authorAvatarUrl} /><span>updated <time dateTime={snapshot.updatedAt} title={new Date(snapshot.updatedAt).toLocaleString()}>{age(snapshot.updatedAt)}</time></span></div>
          <details className="pr-branches"><summary aria-label="Branches"><code title={snapshot.headBranch}>{snapshot.headBranch}</code><ArrowRight size={13} aria-hidden="true" /><code title={snapshot.baseBranch}>{snapshot.baseBranch}</code><ChevronDown size={13} aria-hidden="true" /></summary><dl><dt>From</dt><dd><code>{snapshot.headBranch}</code></dd><dt>Into</dt><dd><code>{snapshot.baseBranch}</code></dd></dl></details></>}
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
        <details className="pr-source"><summary>Connection details<ChevronDown size={14} aria-hidden="true" /></summary><div><dl><dt>GitHub account</dt><dd>{item.reader ? <span>@{item.reader.login}</span> : "Not verified"}</dd><dt>Machine</dt><dd>{sourceName}</dd><dt>Last checked</dt><dd>{age(item.lastAttemptAt)}</dd>{snapshot && <><dt>Revision</dt><dd><code>{snapshot.headSha.slice(0, 7)}</code></dd></>}</dl><label>Source machine<select value={sourceHost} onChange={(event) => setSourceHost(event.target.value)}><option value="" disabled>Select a machine</option>{context.hosts.map((host) => <option key={host.id} value={host.id} disabled={!host.connected}>{host.name}{host.connected ? "" : " · offline"}</option>)}</select></label><button type="button" className="pr-button" disabled={!sourceHost || sourceBusy} onClick={() => { setSourceBusy(true); void onUpdate(() => rpc.call("source", { id: item.id, hostId: sourceHost })).finally(() => setSourceBusy(false)); }}>{sourceBusy ? "Verifying…" : "Verify source"}</button></div></details>
        </div>
      </div>}
    </div>
  </>;
}

function StackDetail({ group, onBack, children }: { group: DependencyGroup; onBack(): void; children: ReactNode }) {
  const repository = group.entries.find((entry) => entry.item)?.item?.snapshot?.repository;
  return <>
    <div className="pr-detail-toolbar"><button type="button" className="pr-back" onClick={onBack}><ArrowLeft size={15} />Pull requests</button></div>
    <div className="pr-detail-scroll"><div className="pr-stack-detail">
      <header className="pr-detail-heading">
        <div className="pr-detail-meta"><Layers size={16} aria-hidden="true" /><span>{[repository, group.kind === "native" ? "GitHub stack" : "Branch dependencies", `${group.entries.length} pull requests`].filter(Boolean).join(" · ")}</span></div>
        <h1>{group.entries[0]!.title}</h1>
        {group.cached && <p className="pr-muted">Relationships are from cached GitHub data.</p>}
      </header>
      <div className="pr-stack-members" aria-label="Pull requests in this stack">{children}</div>
    </div></div>
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
    <section><h2>Reviews</h2><div className="pr-rail-status"><StatusIcon {...review} /><span>{review.label}</span></div>{snapshot.requestedReviewers && snapshot.requestedReviewers.length > 0 && <div className="pr-requested-reviewer"><span>Requested:</span>{snapshot.requestedReviewers.map((reviewer) => <span key={reviewer}>@{reviewer}</span>)}</div>}{snapshot.reviewRequestsComplete === false && <p className="pr-muted">Reviewer list incomplete.</p>}</section>
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
