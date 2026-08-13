import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";
import {
  AtSign,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronsUpDown,
  Clock3,
  CircleDot,
  CircleX,
  Eye,
  GitPullRequest,
  MessageSquare,
  RefreshCw,
  Search,
  type LucideIcon,
} from "lucide-react";
import { definePluginApp, useBbNavigate, useRpc } from "@bb/plugin-sdk/app";

import type { ActivityKind, GithubNotificationItem, ResourceKind } from "./core";
import type { NotificationsPayload, rpcContract } from "./server";

type ResourceFilter = "all" | ResourceKind;
type ActivityFilter = "all" | ActivityKind;
type SortKey = "activity" | "resource" | "updated";
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
}): GithubNotificationItem[] {
  const query = args.query.trim().toLocaleLowerCase();
  const filtered = args.items.filter((item) => {
    if (args.resource !== "all" && item.resourceKind !== args.resource) return false;
    if (args.activity !== "all" && item.activityKind !== args.activity) return false;
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
      case "activity":
        return `${item.activity} ${item.actor ?? ""}`;
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
        iconClass: "bg-success/10 text-success",
        label: "Approved",
        verb: "approved",
      };
    case "changes-requested":
      return {
        icon: CircleX,
        iconClass: "bg-destructive/10 text-destructive-text",
        label: "Changes requested",
        verb: "requested changes",
      };
    case "mention":
      return {
        icon: AtSign,
        iconClass: "bg-warning/10 text-warning-text",
        label: "Mention",
        verb: "mentioned you",
      };
    case "review":
      return {
        icon: Eye,
        iconClass: "bg-accent text-foreground",
        label: "Review",
        verb: "reviewed",
      };
    case "comment":
      return {
        icon: MessageSquare,
        iconClass: "bg-muted text-muted-foreground",
        label: "Comment",
        verb: "commented",
      };
  }
}

function NotificationLink({ item }: { item: GithubNotificationItem }) {
  const navigate = useBbNavigate() as ReturnType<typeof useBbNavigate> & {
    openBrowserTab?: (options: { url: string }) => boolean;
  };
  const update = updatePresentation(item.activityKind);
  const actor = item.actor ? `@${item.actor}` : "Someone";
  const ResourceIcon = item.resourceKind === "pr" ? GitPullRequest : CircleDot;
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey &&
      navigate.openBrowserTab?.({ url: item.url })
    ) {
      event.preventDefault();
    }
  };
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="group block min-w-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`${item.resourceKind === "pr" ? "Pull request" : "Issue"} ${item.repo} number ${item.number}: ${item.title}. ${actor} ${update.verb}`}
    >
      <span className="line-clamp-2 min-w-0 text-sm font-medium leading-5 text-foreground group-hover:underline">
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
  return (
    <div className="flex min-w-0 items-center gap-2 text-sm">
      <span
        className={`group/status relative grid size-6 shrink-0 place-content-center rounded-md ${update.iconClass}`}
        aria-label={update.label}
      >
        <UpdateIcon aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-sm transition-opacity group-hover/status:opacity-100"
        >
          {update.label}
        </span>
      </span>
      <span className="max-w-36 shrink truncate rounded-full bg-muted/75 px-2 py-0.5 text-xs font-medium text-foreground">
        {item.actor ? `@${item.actor}` : "Someone"}
      </span>
      <span className="min-w-0 truncate text-muted-foreground">{update.verb}</span>
    </div>
  );
}

function UpdatedTime({ value }: { value: string }) {
  const fullDate = new Date(value).toLocaleString();
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs tabular-nums text-muted-foreground"
      title={`Updated ${fullDate}`}
      aria-label={`Updated ${fullDate}`}
    >
      <Clock3 aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
      {relativeTime(value)}
    </span>
  );
}

function SortHeader({
  active,
  direction,
  label,
  onSort,
}: {
  active: boolean;
  direction: SortDirection;
  label: string;
  onSort(): void;
}) {
  return (
    <button
      type="button"
      onClick={onSort}
      className="inline-flex items-center gap-1 rounded-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Sort by ${label}${active ? `, ${direction === "asc" ? "ascending" : "descending"}` : ""}`}
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
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [resourceFilter, setResourceFilter] = useState<ResourceFilter>("all");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
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
      }),
    [activityFilter, direction, payload, query, resourceFilter, sort],
  );
  const hasFilters =
    query.length > 0 || resourceFilter !== "all" || activityFilter !== "all";
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
  };
  return (
    <main className="h-full overflow-y-auto bg-background p-4 md:p-5">
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

        {error ? (
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] table-fixed border-collapse text-left">
                <colgroup>
                  <col className="w-[52%]" />
                  <col className="w-[36%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead className="border-b border-border bg-muted/35 text-xs">
                  <tr>
                    <th scope="col" className="px-3 py-2.5">
                      <SortHeader label="Item" active={sort === "resource"} direction={direction} onSort={() => setSortKey("resource")} />
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      <SortHeader label="Latest update" active={sort === "activity"} direction={direction} onSort={() => setSortKey("activity")} />
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      <SortHeader label="Updated" active={sort === "updated"} direction={direction} onSort={() => setSortKey("updated")} />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading && payload === null
                    ? [0, 1, 2, 3, 4].map((index) => (
                        <tr key={index} aria-label="Loading GitHub activity">
                          {[0, 1, 2].map((cell) => (
                            <td key={cell} className="px-3 py-3">
                              <div className="h-4 animate-pulse rounded bg-muted" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : items.map((item) => (
                        <tr key={item.id} className="align-top transition-colors hover:bg-accent/30">
                          <td className="px-3 py-3">
                            <NotificationLink item={item} />
                          </td>
                          <td className="px-3 py-3">
                            <LatestUpdate item={item} />
                          </td>
                          <td className="px-3 py-3">
                            <UpdatedTime value={item.updatedAt} />
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
