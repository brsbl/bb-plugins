import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AtSign,
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronsUpDown,
  CircleDot,
  CircleX,
  GitPullRequest,
  MessageSquare,
  MessageSquareMore,
  RefreshCw,
  Search,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { definePluginApp, useRpc } from "@bb/plugin-sdk/app";

import type { ActivityKind, GithubNotificationItem, ResourceKind } from "./core";
import type { NotificationsPayload, rpcContract } from "./server";

type ResourceFilter = "all" | ResourceKind;
type ActivityFilter = "all" | ActivityKind;
type StatusFilter = "all" | "open" | "resolved";
type SortKey = "resource" | "updated";
type SortDirection = "asc" | "desc";

const ACTIVITY_FILTERS: readonly { value: ActivityFilter; label: string }[] = [
  { value: "all", label: "All updates" },
  { value: "comment", label: "Comments" },
  { value: "mention", label: "Mentions" },
  { value: "review", label: "Reviews" },
  { value: "approved", label: "Approvals" },
  { value: "changes-requested", label: "Changes requested" },
];

export function filterAndSortNotifications(args: {
  activity: ActivityFilter;
  direction: SortDirection;
  items: GithubNotificationItem[];
  query: string;
  resource: ResourceFilter;
  sort: SortKey;
  status: StatusFilter;
}): GithubNotificationItem[] {
  const query = args.query.trim().toLocaleLowerCase();
  const filtered = args.items.filter((item) => {
    if (args.resource !== "all" && item.resourceKind !== args.resource) return false;
    if (args.activity !== "all" && item.activityKind !== args.activity) return false;
    if (args.status === "open" && item.resolved) return false;
    if (args.status === "resolved" && !item.resolved) return false;
    if (query.length === 0) return true;
    return [
      item.activity,
      item.actor ?? "",
      item.number.toString(),
      item.repo,
      item.resourceKind === "pr" ? "pull request pr" : "issue",
      item.title,
    ].some((value) => value.toLocaleLowerCase().includes(query));
  });
  const valueFor = (item: GithubNotificationItem): string | number => {
    switch (args.sort) {
      case "resource":
        return `${item.title} ${item.repo} ${item.resourceKind} ${item.number}`;
      case "updated":
        return Date.parse(item.updatedAt);
    }
  };
  return [...filtered].sort((left, right) => {
    const leftValue = valueFor(left);
    const rightValue = valueFor(right);
    const result =
      typeof leftValue === "number" && typeof rightValue === "number"
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue));
    return args.direction === "asc" ? result : -result;
  });
}

function relativeTime(value: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - Date.parse(value)) / 1_000));
  if (seconds < 60) return "now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
    new Date(value),
  );
}

function updatePresentation(kind: GithubNotificationItem["activityKind"]): {
  icon: LucideIcon;
  iconClass: string;
  label: string;
  verb: string;
} {
  switch (kind) {
    case "approved":
      return {
        icon: CheckCircle2,
        iconClass: "text-success",
        label: "Approved",
        verb: "approved",
      };
    case "changes-requested":
      return {
        icon: CircleX,
        iconClass: "text-destructive-text",
        label: "Changes requested",
        verb: "requested changes",
      };
    case "mention":
      return {
        icon: AtSign,
        iconClass: "text-warning-text",
        label: "Mention",
        verb: "mentioned you",
      };
    case "review":
      return {
        icon: MessageSquareMore,
        iconClass: "text-foreground",
        label: "Review",
        verb: "reviewed",
      };
    case "comment":
      return {
        icon: MessageSquare,
        iconClass: "text-muted-foreground",
        label: "Comment",
        verb: "commented",
      };
  }
}

function NotificationLink({ item }: { item: GithubNotificationItem }) {
  const update = updatePresentation(item.activityKind);
  const actor = item.actor ? `@${item.actor}` : "Someone";
  const ResourceIcon = item.resourceKind === "pr" ? GitPullRequest : CircleDot;
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block min-w-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`${item.resourceKind === "pr" ? "Pull request" : "Issue"} ${item.repo} number ${item.number}: ${item.title}. ${actor} ${update.verb}`}
    >
      <span
        className={`line-clamp-2 min-w-0 text-sm font-medium leading-5 group-hover:underline ${
          item.resolved ? "text-muted-foreground" : "text-foreground"
        }`}
      >
        {item.title}
      </span>
      <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
        <ResourceIcon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.75} />
        <span className="font-medium text-foreground">
          {item.resourceKind === "pr" ? "PR" : "Issue"} #{item.number}
        </span>
        <span aria-hidden>·</span>
        <span className="truncate">{item.repo}</span>
      </span>
    </a>
  );
}

function LatestUpdate({ item }: { item: GithubNotificationItem }) {
  const update = updatePresentation(item.activityKind);
  const UpdateIcon = update.icon;
  const actor = item.actor ? `@${item.actor}` : "Someone";
  return (
    <div className="flex min-w-0 items-center gap-2 text-sm">
      <span className="flex min-w-0 items-center gap-2">
        <span className="inline-flex max-w-40 shrink items-center gap-1 rounded-full bg-muted/35 py-0.5 pl-0.5 pr-1.5 text-xs font-normal text-muted-foreground">
          <ActorAvatar avatarUrl={item.avatarUrl} />
          <span className="truncate">{actor}</span>
        </span>
        <span
          className={`group/status relative inline-flex shrink-0 items-center ${update.iconClass}`}
          aria-label={update.label}
          role="img"
          tabIndex={0}
          title={update.label}
        >
          <UpdateIcon aria-hidden="true" className="size-4" strokeWidth={1.75} />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-sm transition-opacity group-hover/status:opacity-100 group-focus/status:opacity-100"
          >
            {update.label}
          </span>
        </span>
      </span>
      <UpdatedTime value={item.updatedAt} />
    </div>
  );
}

function ActorAvatar({ avatarUrl }: { avatarUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="grid size-5 shrink-0 place-content-center overflow-hidden rounded-full bg-muted/70">
      {avatarUrl && !failed ? (
        <img
          src={avatarUrl}
          alt=""
          className="aspect-square size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <UserRound
          aria-hidden="true"
          className="size-3 text-muted-foreground"
          strokeWidth={1.75}
        />
      )}
    </span>
  );
}

function UpdatedTime({ value }: { value: string }) {
  const fullDate = new Date(value).toLocaleString();
  return (
    <span
      className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted-foreground"
      title={`Updated ${fullDate}`}
      aria-label={`Updated ${fullDate}`}
    >
      {relativeTime(value)}
    </span>
  );
}

function ResolveCheckbox({
  disabled,
  item,
  onToggle,
}: {
  disabled: boolean;
  item: GithubNotificationItem;
  onToggle(): void;
}) {
  const label = item.resolved ? "Reopen" : "Resolve";
  return (
    <label
      className={`group/resolve relative grid size-7 place-content-center rounded-md transition-colors hover:bg-accent ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        aria-label={`${label}: ${item.title}`}
        checked={item.resolved}
        disabled={disabled}
        onChange={onToggle}
        title={label}
        className="peer size-4 cursor-inherit appearance-none rounded-[4px] border border-muted-foreground/50 bg-background transition-colors hover:border-foreground/60 checked:border-success checked:bg-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
      />
      <Check
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 text-background opacity-0 transition-opacity peer-checked:opacity-100"
        strokeWidth={2.5}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-full z-20 mt-1 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-sm transition-opacity group-hover/resolve:opacity-100 peer-focus-visible:opacity-100"
      >
        {label}
      </span>
    </label>
  );
}

function SortHeader({
  active,
  ariaLabel,
  direction,
  label,
  onSort,
}: {
  active: boolean;
  ariaLabel?: string;
  direction: SortDirection;
  label: string;
  onSort(): void;
}) {
  return (
    <button
      type="button"
      onClick={onSort}
      className="inline-flex items-center gap-1 rounded-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`${ariaLabel ?? `Sort by ${label}`}${active ? `, ${direction === "asc" ? "ascending" : "descending"}` : ""}`}
    >
      {label}
      {active ? (
        direction === "asc" ? (
          <ArrowUp aria-hidden="true" className="size-3" />
        ) : (
          <ArrowDown aria-hidden="true" className="size-3" />
        )
      ) : (
        <ChevronsUpDown aria-hidden="true" className="size-3 text-muted-foreground/55" />
      )}
    </button>
  );
}

function GitHubActivityPanel() {
  const rpc = useRpc<typeof rpcContract>();
  const [payload, setPayload] = useState<NotificationsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingResolvedIds, setPendingResolvedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [query, setQuery] = useState("");
  const [resourceFilter, setResourceFilter] = useState<ResourceFilter>("all");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("updated");
  const [direction, setDirection] = useState<SortDirection>("desc");

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      setPayload(await rpc.call("listNotifications", { force }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setLoading(false);
    }
  }, [rpc]);

  useEffect(() => {
    void load();
  }, [load]);

  const items = useMemo(
    () =>
      filterAndSortNotifications({
        activity: activityFilter,
        direction,
        items: payload?.items ?? [],
        query,
        resource: resourceFilter,
        sort,
        status: statusFilter,
      }),
    [activityFilter, direction, payload, query, resourceFilter, sort, statusFilter],
  );
  const hasFilters =
    query.length > 0 ||
    resourceFilter !== "all" ||
    activityFilter !== "all" ||
    statusFilter !== "all";
  const setSortKey = (next: SortKey) => {
    if (sort === next) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSort(next);
      setDirection(next === "updated" ? "desc" : "asc");
    }
  };
  const clearFilters = () => {
    setQuery("");
    setResourceFilter("all");
    setActivityFilter("all");
    setStatusFilter("all");
  };
  const toggleResolved = async (item: GithubNotificationItem) => {
    if (pendingResolvedIds.has(item.id)) return;
    const resolved = !item.resolved;
    setResolveError(null);
    setPendingResolvedIds((current) => new Set(current).add(item.id));
    setPayload((current) =>
      current === null
        ? current
        : {
            ...current,
            items: current.items.map((candidate) =>
              candidate.id === item.id
                ? { ...candidate, resolved }
                : candidate,
            ),
          },
    );
    try {
      await rpc.call("setNotificationResolved", { id: item.id, resolved });
    } catch {
      setPayload((current) =>
        current === null
          ? current
          : {
              ...current,
              items: current.items.map((candidate) =>
                candidate.id === item.id
                  ? { ...candidate, resolved: item.resolved }
                  : candidate,
              ),
            },
      );
      setResolveError("Couldn’t update resolved state. Try again.");
    } finally {
      setPendingResolvedIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
  };
  return (
    <main className="github-activity-surface @container h-full overflow-y-auto bg-background p-4 md:p-5">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-5 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">
              Comments and reviews on PRs and issues you authored{payload ? ` as @${payload.login}` : ""}.
            </p>
          </div>
          <button
            type="button"
            aria-label="Refresh GitHub activity"
            title="Refresh GitHub activity"
            onClick={() => void load(true)}
            disabled={loading}
            className="grid size-8 shrink-0 place-content-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw aria-hidden="true" className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          <label className="relative min-w-56 flex-1">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by title, repo, or person"
              aria-label="Filter GitHub activity"
              className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="relative w-36 shrink-0">
            <CheckCircle2 aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              aria-label="Filter by status"
              className="h-9 w-full appearance-none rounded-md border border-input bg-background pl-8 pr-8 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </label>
          <label className="relative w-40 shrink-0">
            <GitPullRequest aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={resourceFilter}
              onChange={(event) => setResourceFilter(event.target.value as ResourceFilter)}
              aria-label="Filter by resource type"
              className="h-9 w-full appearance-none rounded-md border border-input bg-background pl-8 pr-8 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All items</option>
              <option value="pr">Pull requests</option>
              <option value="issue">Issues</option>
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </label>
          <label className="relative w-44 shrink-0">
            <MessageSquare aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={activityFilter}
              onChange={(event) => setActivityFilter(event.target.value as ActivityFilter)}
              aria-label="Filter by update type"
              className="h-9 w-full appearance-none rounded-md border border-input bg-background pl-8 pr-8 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {ACTIVITY_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>{filter.label}</option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </label>
          <span className="px-1 text-xs tabular-nums text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>

        {resolveError ? (
          <p role="alert" className="mb-3 text-sm text-destructive-text">
            {resolveError}
          </p>
        ) : null}

        {error && payload !== null ? (
          <div
            role="alert"
            className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning/25 bg-warning/5 px-3 py-2"
          >
            <p className="text-sm text-foreground">
              <span className="font-medium">Couldn’t refresh GitHub activity.</span>{" "}
              <span className="text-muted-foreground">Showing the last loaded results.</span>
            </p>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-sm font-medium text-foreground hover:bg-accent"
              onClick={() => void load(true)}
            >
              Retry
            </button>
          </div>
        ) : null}

        {error && payload === null ? (
          <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">Couldn’t load GitHub activity</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <button type="button" className="mt-3 rounded-md border border-border px-2.5 py-1.5 text-sm font-medium text-foreground hover:bg-accent" onClick={() => void load(true)}>
              Try again
            </button>
          </div>
        ) : payload !== null && items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-sm font-medium text-foreground">
              {hasFilters ? "No matching activity" : "No comments or reviews to triage"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasFilters
                ? "Try a different search or clear the filters."
                : "New activity on GitHub PRs and issues you authored will appear here."}
            </p>
            {hasFilters ? (
              <button type="button" className="mt-3 rounded-md border border-border px-2.5 py-1.5 text-sm font-medium text-foreground hover:bg-accent" onClick={clearFilters}>
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div>
              <table className="github-activity-table w-full table-fixed border-collapse text-left">
                <colgroup className="github-activity-colgroup @max-[36rem]:hidden">
                  <col className="w-[10%]" />
                  <col className="w-[54%]" />
                  <col className="w-[36%]" />
                </colgroup>
                <thead className="border-b border-border bg-muted/35 text-xs">
                  <tr className="github-activity-header-row @max-[36rem]:grid @max-[36rem]:grid-cols-[3.5rem_minmax(0,1fr)]">
                    <th scope="col" className="github-activity-status-header px-3 py-2.5 text-muted-foreground @max-[36rem]:row-span-2">
                      Status
                    </th>
                    <th scope="col" className="github-activity-item-header px-3 py-2.5 @max-[36rem]:col-start-2 @max-[36rem]:row-start-1">
                      <SortHeader label="Item" active={sort === "resource"} direction={direction} onSort={() => setSortKey("resource")} />
                    </th>
                    <th scope="col" className="github-activity-update-header px-3 py-2.5 @max-[36rem]:col-start-2 @max-[36rem]:row-start-1 @max-[36rem]:justify-self-end">
                      <SortHeader
                        label="Activity"
                        ariaLabel="Sort Activity by time"
                        active={sort === "updated"}
                        direction={direction}
                        onSort={() => setSortKey("updated")}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody className="github-activity-body divide-y divide-border @max-[36rem]:block @max-[36rem]:divide-y-0">
                  {loading && payload === null
                    ? [0, 1, 2, 3, 4].map((index) => (
                        <tr key={index} aria-label="Loading GitHub activity" className="github-activity-row @max-[36rem]:grid @max-[36rem]:grid-cols-[3.5rem_minmax(0,1fr)] @max-[36rem]:border-b @max-[36rem]:border-border @max-[36rem]:last:border-b-0">
                          {[0, 1, 2].map((cell) => (
                            <td
                              key={cell}
                              className={`px-3 py-3 ${
                                cell === 0
                                  ? "github-activity-status-cell @max-[36rem]:row-span-2"
                                  : cell === 1
                                    ? "github-activity-item-cell @max-[36rem]:col-start-2 @max-[36rem]:row-start-1 @max-[36rem]:pb-1"
                                    : "github-activity-update-cell @max-[36rem]:col-start-2 @max-[36rem]:row-start-2 @max-[36rem]:pt-0"
                              }`}
                            >
                              <div className="h-4 animate-pulse rounded bg-muted" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : items.map((item) => (
                        <tr
                          key={item.id}
                          data-resolved={item.resolved ? "true" : "false"}
                          className={`github-activity-row align-top transition-colors hover:bg-accent/30 @max-[36rem]:grid @max-[36rem]:grid-cols-[3.5rem_minmax(0,1fr)] @max-[36rem]:border-b @max-[36rem]:border-border @max-[36rem]:last:border-b-0 ${
                            item.resolved ? "bg-muted/15" : ""
                          }`}
                        >
                          <td className="github-activity-status-cell px-3 py-2.5 @max-[36rem]:row-span-2">
                            <ResolveCheckbox
                              disabled={pendingResolvedIds.has(item.id)}
                              item={item}
                              onToggle={() => void toggleResolved(item)}
                            />
                          </td>
                          <td className="github-activity-item-cell px-3 py-3 @max-[36rem]:col-start-2 @max-[36rem]:row-start-1 @max-[36rem]:pb-1">
                            <NotificationLink item={item} />
                          </td>
                          <td className="github-activity-update-cell px-3 py-3 @max-[36rem]:col-start-2 @max-[36rem]:row-start-2 @max-[36rem]:pt-0">
                            <LatestUpdate item={item} />
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default definePluginApp((app) => {
  app.slots.navPanel({
    id: "activity",
    title: "GitHub Activity",
    icon: "Github",
    path: "activity",
    component: GitHubActivityPanel,
  });
});
