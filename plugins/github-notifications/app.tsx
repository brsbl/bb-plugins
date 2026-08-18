import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  GitPullRequest,
  MessageSquare,
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
  { value: "all", label: "All activity" },
  { value: "comment", label: "Comments" },
  { value: "mention", label: "Mentions" },
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

function activityPresentation(kind: GithubNotificationItem["activityKind"]): {
  className: string;
  icon: LucideIcon;
  label: string;
} {
  switch (kind) {
    case "mention":
      return {
        className: "text-warning-text",
        icon: AtSign,
        label: "Mention",
      };
    case "comment":
      return {
        className: "text-muted-foreground",
        icon: MessageSquare,
        label: "Comment",
      };
  }
}

function resourcePresentation(kind: ResourceKind): {
  className: string;
  icon: LucideIcon;
  label: string;
} {
  return kind === "pr"
    ? { className: "text-muted-foreground", icon: GitPullRequest, label: "Pull request" }
    : { className: "text-muted-foreground", icon: CircleDot, label: "Issue" };
}

function TaxonomyIcon({
  className,
  icon: Icon,
  label,
}: {
  className: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <span
      className={`group/taxonomy relative inline-flex items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      aria-label={label}
      role="img"
      tabIndex={0}
      title={label}
    >
      <Icon aria-hidden="true" className="size-4" strokeWidth={1.75} />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-sm transition-opacity group-hover/taxonomy:opacity-100 group-focus/taxonomy:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}

function NotificationLink({ item }: { item: GithubNotificationItem }) {
  const resource = resourcePresentation(item.resourceKind);
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-w-0 items-start gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        className={`mt-0.5 inline-flex shrink-0 ${resource.className}`}
        aria-label={resource.label}
        role="img"
        title={resource.label}
      >
        <resource.icon aria-hidden="true" className="size-4" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`line-clamp-2 min-w-0 text-sm font-medium leading-5 group-hover:underline lg:line-clamp-1 ${
            item.resolved ? "text-muted-foreground" : "text-foreground"
          }`}
        >
          {item.title}
        </span>
        <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs leading-4 text-muted-foreground">
          <span className="font-medium text-foreground">#{item.number}</span>
          <span
            className="github-activity-inline-repo inline-flex min-w-0 items-center gap-1.5 lg:hidden"
          >
            <span>·</span>
            <span className="truncate">{item.repo}</span>
          </span>
          <LatestUpdate item={item} className="xl:hidden" />
        </span>
      </span>
    </a>
  );
}

function LatestUpdate({
  className = "",
  item,
}: {
  className?: string;
  item: GithubNotificationItem;
}) {
  const actor = item.actor ? `@${item.actor}` : "Someone";
  return (
    <span
      className={`flex min-w-0 items-center gap-1.5 text-xs ${className}`}
    >
      <span className="inline-flex max-w-40 shrink items-center gap-1 rounded-full bg-muted/35 py-0.5 pl-0.5 pr-1.5 font-normal text-muted-foreground">
        <ActorAvatar avatarUrl={item.avatarUrl} />
        <span className="truncate">{actor}</span>
      </span>
      <UpdatedTime value={item.updatedAt} />
    </span>
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
  onToggle(control: HTMLInputElement): void;
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
        data-resolve-control="true"
        onChange={(event) => onToggle(event.currentTarget)}
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
  const statusFilterRef = useRef<HTMLSelectElement>(null);

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
  const toggleResolved = async (
    item: GithubNotificationItem,
    control: HTMLInputElement,
  ) => {
    if (pendingResolvedIds.has(item.id)) return;
    const resolved = !item.resolved;
    const controls = Array.from(
      control
        .closest("table")
        ?.querySelectorAll<HTMLInputElement>("[data-resolve-control='true']") ??
        [],
    );
    const controlIndex = controls.indexOf(control);
    const focusAfterRemoval =
      controls[controlIndex + 1] ??
      controls[controlIndex - 1] ??
      statusFilterRef.current;
    setResolveError(null);
    setPendingResolvedIds((current) => new Set(current).add(item.id));
    try {
      if (payload === null) return;
      await rpc.call("setNotificationResolved", {
        eventKey: item.eventKey ?? null,
        id: item.id,
        identityKey: payload.identityKey,
        resolved,
        updatedAt: item.updatedAt,
      });
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
      if (
        (statusFilter === "open" && resolved) ||
        (statusFilter === "resolved" && !resolved)
      ) {
        queueMicrotask(() => focusAfterRemoval?.focus());
      }
    } catch {
      setResolveError("Couldn’t update resolved state. Try again.");
      setTimeout(() => control.focus(), 0);
    } finally {
      setPendingResolvedIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
  };
  return (
    <main className="github-activity-surface h-full overflow-y-auto bg-background p-4 md:p-5">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-5 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">
              Comments and mentions on PRs and issues you authored{payload ? ` as @${payload.login}` : ""}.
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
              ref={statusFilterRef}
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
          <div role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">Couldn’t load GitHub activity</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <button type="button" className="mt-3 rounded-md border border-border px-2.5 py-1.5 text-sm font-medium text-foreground hover:bg-accent" onClick={() => void load(true)}>
              Try again
            </button>
          </div>
        ) : payload !== null && items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-sm font-medium text-foreground">
              {hasFilters ? "No matching activity" : "No comments or mentions to triage"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasFilters
                ? "Try a different search or clear the filters."
                : "New comments and mentions on GitHub PRs and issues you authored will appear here."}
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
                <colgroup className="github-activity-colgroup">
                  <col className="w-[3.75rem]" />
                  <col className="w-16" />
                  <col />
                  <col className="hidden w-40 lg:table-column" />
                  <col className="hidden w-[14rem] xl:table-column" />
                </colgroup>
                <thead className="border-b border-border bg-muted/35 text-xs">
                  <tr className="github-activity-header-row">
                    <th scope="col" className="github-activity-status-header px-3 py-2.5 text-muted-foreground">
                      Status
                    </th>
                    <th scope="col" className="github-activity-update-header px-2 py-2.5 text-center text-muted-foreground">
                      Activity
                    </th>
                    <th scope="col" aria-label="Resource" className="github-activity-resource-header px-3 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <SortHeader label="Resource" active={sort === "resource"} direction={direction} onSort={() => setSortKey("resource")} />
                        <span className="xl:hidden">
                          <SortHeader
                            label="Recent"
                            ariaLabel="Sort by time"
                            active={sort === "updated"}
                            direction={direction}
                            onSort={() => setSortKey("updated")}
                          />
                        </span>
                      </div>
                    </th>
                    <th scope="col" className="github-activity-repo-header hidden px-3 py-2.5 font-medium text-muted-foreground lg:table-cell">
                      Repo
                    </th>
                    <th scope="col" className="github-activity-from-header hidden px-3 py-2.5 xl:table-cell">
                      <SortHeader
                        label="From"
                        ariaLabel="Sort by time"
                        active={sort === "updated"}
                        direction={direction}
                        onSort={() => setSortKey("updated")}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody className="github-activity-body divide-y divide-border">
                  {loading && payload === null
                    ? [0, 1, 2, 3, 4].map((index) => (
                        <tr key={index} aria-label="Loading GitHub activity" className="github-activity-row">
                          {[0, 1, 2, 3, 4].map((cell) => (
                            <td
                              key={cell}
                              className={`px-3 py-3 ${
                                cell === 0
                                  ? "github-activity-status-cell"
                                : cell === 1
                                      ? "github-activity-update-cell"
                                    : cell === 2
                                      ? "github-activity-resource-cell"
                                      : cell === 3
                                        ? "github-activity-repo-cell hidden lg:table-cell"
                                        : "github-activity-from-cell hidden xl:table-cell"
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
                          className={`github-activity-row align-top transition-colors hover:bg-accent/30 ${
                            item.resolved ? "bg-muted/15" : ""
                          }`}
                        >
                          <td className="github-activity-status-cell px-3 py-2.5">
                            <ResolveCheckbox
                              disabled={pendingResolvedIds.has(item.id)}
                              item={item}
                              onToggle={(control) =>
                                void toggleResolved(item, control)
                              }
                            />
                          </td>
                          <td className="github-activity-update-cell px-2 py-2.5 text-center">
                            <TaxonomyIcon {...activityPresentation(item.activityKind)} />
                          </td>
                          <td className="github-activity-resource-cell px-3 py-2.5">
                            <NotificationLink item={item} />
                          </td>
                          <td className="github-activity-repo-cell hidden px-3 py-2.5 text-xs text-muted-foreground lg:table-cell">
                            <span className="block truncate" title={item.repo}>{item.repo}</span>
                          </td>
                          <td className="github-activity-from-cell hidden px-3 py-2.5 xl:table-cell">
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
