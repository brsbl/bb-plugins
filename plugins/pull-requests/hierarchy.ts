import type { PluginSidebarThread } from "@get-bb/plugin-sdk/app";
import type { Listing, PullRequestItem, ThreadChoice } from "./contract";
import { parsePullRequestUrl } from "./core";

export type Category = "Needs you" | "Needs fixes" | "In progress" | "Waiting" | "Ready for decision" | "Unknown";
export type Status = { category: Category; reason: string; attention: boolean; cached: boolean; fixes: boolean };
export type Activity = Pick<PluginSidebarThread, "hasPendingInteraction" | "indicator" | "status" | "activity" | "runtimeStatus">;
export const isHistory = (item: PullRequestItem) => item.snapshot?.state === "merged" || item.snapshot?.state === "closed";
export function githubFresh(item: PullRequestItem, now: number): boolean {
  const age = now - Date.parse(item.snapshot?.fetchedAt ?? "");
  return item.sourceState === "available" && age >= 0 && age <= 60_000;
}
export function statusOf(item: PullRequestItem, threads: ReadonlyMap<string, Activity>, now: number, dependency?: { waiting?: string; uncertain?: string }, online = true): Status {
  const snapshot = item.snapshot, fresh = githubFresh(item, now) && online;
  const linked = item.links.flatMap((link) => threads.get(link.threadId) ?? []);
  const agentError = linked.some((thread) => thread.status === "error" || ["unread-error", "queued-failed"].includes(thread.indicator));
  const fixes = !isHistory(item) && (agentError || (fresh && !!snapshot && (snapshot.checks.state === "failing" || snapshot.mergeability === "conflicts" || snapshot.review === "changes-requested")));
  const result = (category: Category, reason: string): Status => ({ category, reason, attention: !isHistory(item) && (category === "Needs you" || fixes), cached: !fresh, fixes });
  if (isHistory(item)) return result("Unknown", snapshot!.state === "merged" ? "Merged" : "Closed");
  // Live bb questions outrank GitHub freshness and every other status.
  if (linked.some((thread) => thread.hasPendingInteraction || thread.indicator === "waiting-for-input")) return result("Needs you", "Agent needs your input");
  if (fresh && snapshot?.requestedReviewers?.some((login) => login.toLowerCase() === item.reader?.login.toLowerCase())) return result("Needs you", "Your review requested");
  if (agentError) return result("Needs fixes", "Agent error");
  if (!fresh || !snapshot) return result("Unknown", snapshot ? "GitHub status is cached" : "GitHub status unavailable");
  if (snapshot.checks.state === "failing") return result("Needs fixes", "Checks failed");
  if (snapshot.mergeability === "conflicts") return result("Needs fixes", "Merge conflicts");
  if (snapshot.review === "changes-requested") return result("Needs fixes", "Changes requested");
  if (linked.some((thread) => ["active", "starting", "stopping"].includes(thread.status) || Object.values(thread.activity).some((count) => count > 0))) return result("In progress", "Agent working");
  if (snapshot.state === "draft") return result("In progress", "Draft");
  if (dependency?.waiting) return result("Waiting", dependency.waiting);
  if (snapshot.checks.state === "pending") return result("Waiting", "Checks running");
  if (snapshot.queued) return result("Waiting", "In merge queue");
  if (snapshot.review === "required" || snapshot.requestedReviewers?.length) return result("Waiting", "Another review needed");
  if (snapshot.mergeability === "blocked") return result("Waiting", "Repository requirements");
  if (linked.some((thread) => thread.runtimeStatus === "waiting-for-host")) return result("Waiting", "Agent waiting for machine");
  if (dependency?.uncertain) return result("Unknown", dependency.uncertain);
  if (!snapshot.checks.complete || snapshot.checks.state === "unknown" || !snapshot.reviewRequestsComplete || snapshot.review === "unknown" || snapshot.mergeability === "unknown") return result("Unknown", "GitHub evidence incomplete");
  return result("Ready for decision", "No known GitHub blocker");
}

/** Preferred thread, unique origin, then unique repository mapping. Never a worker by array order. */
export function ownerThread(item: PullRequestItem, threads: ReadonlyMap<string, ThreadChoice>): ThreadChoice | undefined {
  const preferred = item.links.find((link) => link.threadId === item.preferredThreadId);
  if (preferred && threads.has(preferred.threadId)) return threads.get(preferred.threadId);
  const origins = item.links.filter((link) => link.origin);
  return origins.length === 1 ? threads.get(origins[0]!.threadId) : undefined;
}
export function projectFor(item: PullRequestItem, threads: ReadonlyMap<string, ThreadChoice>, mappings: NonNullable<Listing["projects"]>): string | undefined {
  const owner = ownerThread(item, threads);
  if (owner) return owner.projectId;
  const ids = new Set(mappings.filter((entry) => entry.repository.toLowerCase() === item.snapshot?.repository.toLowerCase()).map((entry) => entry.id));
  return ids.size === 1 ? [...ids][0] : undefined;
}

export type Entry = { key: string; item?: PullRequestItem; url: string; title: string; number: number; state: string; parent?: string; note?: string };
export type DependencyGroup = { key: string; kind: "native" | "branch" | "single"; entries: Entry[]; cached: boolean };
function urlKey(value: string): string { return parsePullRequestUrl(value).url.toLowerCase(); }
const branchKey = (repository: string, branch: string) => `${repository.toLowerCase()}:${branch}`;

/** Build before view/search/author filters. Native claims take precedence; inference is labeled separately. */
export function dependencyGroups(items: PullRequestItem[], now: number): DependencyGroup[] {
  const entries = new Map<string, Entry>();
  for (const item of items) entries.set(urlKey(item.url), { key: urlKey(item.url), item, url: item.url, title: item.snapshot?.title ?? "Pull request unavailable", number: item.snapshot?.number ?? parsePullRequestUrl(item.url).number, state: item.snapshot?.state ?? "unknown" });
  const claims: string[][] = [];
  const native = new Set<string>(), invalid = new Set<string>();
  for (const item of items) {
    if (item.snapshot?.stack.state !== "available") continue;
    const self = urlKey(item.url), members = item.snapshot.stack.items;
    let keys: string[];
    try { keys = members.map((member) => urlKey(member.url)); } catch { invalid.add(self); continue; }
    if (!keys.includes(self) || new Set(keys).size !== keys.length || members.some((member) => parsePullRequestUrl(member.url).owner.toLowerCase() + "/" + parsePullRequestUrl(member.url).repository.toLowerCase() !== item.snapshot!.repository.toLowerCase())) { invalid.add(self); continue; }
    for (const member of members) {
      const key = urlKey(member.url);
      native.add(key);
      if (!entries.has(key)) entries.set(key, { key, ...member, state: member.state.toLowerCase() });
    }
    claims.push(keys);
  }
  // Overlapping native claims must describe the same ordered stack, not competing snapshots.
  const signatures = new Map<string, string>();
  for (const claim of claims) for (const key of claim) {
    const signature = claim.join("|");
    if (entries.get(key)?.item?.snapshot?.stack.state === "none") invalid.add(key);
    if (signatures.has(key) && signatures.get(key) !== signature) invalid.add(key);
    signatures.set(key, signature);
  }
  for (let changed = true; changed;) {
    changed = false;
    for (const claim of claims) if (claim.some((key) => invalid.has(key))) for (const key of claim) if (!invalid.has(key)) { invalid.add(key); changed = true; }
  }
  for (const key of invalid) if (entries.has(key)) entries.get(key)!.note = "Native stack membership is ambiguous";
  const parents = new Map<string, string>();
  for (const claim of claims) if (!claim.some((key) => invalid.has(key))) for (let index = 1; index < claim.length; index++) parents.set(claim[index]!, claim[index - 1]!);
  const heads = new Map<string, string[]>();
  for (const [key, entry] of entries) {
    const snapshot = entry.item?.snapshot;
    if (!snapshot?.headRepository || snapshot.headRepository.toLowerCase() !== snapshot.repository.toLowerCase() || !snapshot.headBranch) continue;
    const branch = branchKey(snapshot.headRepository, snapshot.headBranch);
    heads.set(branch, [...heads.get(branch) ?? [], key]);
  }
  for (const [key, entry] of entries) {
    const snapshot = entry.item?.snapshot;
    if (!snapshot || native.has(key) || invalid.has(key)) continue;
    const candidates = heads.get(branchKey(snapshot.repository, snapshot.baseBranch)) ?? [];
    const unknownSource = items.some((other) => !other.snapshot?.headRepository && other.snapshot?.repository.toLowerCase() === snapshot.repository.toLowerCase() && other.snapshot?.headBranch === snapshot.baseBranch);
    if (unknownSource) entry.note = "Dependency source repository unknown";
    else if (candidates.length > 1) entry.note = "Branch dependency is ambiguous";
    else if (candidates.length === 1) {
      const parent = candidates[0]!;
      if (native.has(parent) || invalid.has(parent)) entry.note = `Branch targets #${entries.get(parent)!.number}; stack membership unconfirmed`;
      else parents.set(key, parent);
    } else if (!snapshot.headRepository) entry.note = "Branch source repository unknown";
  }
  // Remove cyclic edges; no arbitrary root or invented dependency order.
  const cyclic = new Set<string>();
  for (const start of parents.keys()) {
    const path: string[] = [], seen = new Map<string, number>();
    let key: string | undefined = start;
    while (key && parents.has(key)) {
      if (seen.has(key)) { for (const member of path.slice(seen.get(key)!)) cyclic.add(member); break; }
      seen.set(key, path.length); path.push(key); key = parents.get(key);
    }
  }
  for (const key of cyclic) { parents.delete(key); entries.get(key)!.note = "Dependency cycle; order unknown"; }
  const roots = new Map<string, Entry[]>();
  for (const [key, entry] of entries) {
    // A rejected native claim must not create ghost rows with unverified content.
    if (!entry.item && invalid.has(key)) continue;
    let root = key;
    while (parents.has(root)) root = parents.get(root)!;
    entry.parent = parents.get(key);
    roots.set(root, [...roots.get(root) ?? [], entry]);
  }
  return [...roots].flatMap(([root, members]) => {
    if (!members.some((member) => member.item)) return [];
    const ordered: Entry[] = [];
    const visit = (key: string) => {
      ordered.push(entries.get(key)!);
      for (const child of members.filter((member) => member.parent === key).sort((a, b) => a.number - b.number || a.key.localeCompare(b.key))) visit(child.key);
    };
    visit(root);
    const kind = members.length > 1 ? native.has(root) ? "native" : "branch" : "single";
    if (kind === "single" && !ordered[0]!.note && ordered[0]!.item?.snapshot?.stack.state === "unavailable") ordered[0]!.note = "Native stack unavailable";
    return [{ key: root, kind, entries: ordered, cached: members.some((member) => member.item && !githubFresh(member.item, now)) }];
  });
}

export function dependencyStatus(entry: Entry, group: DependencyGroup, now: number): { waiting?: string; uncertain?: string } {
  const parent = group.entries.find((member) => member.key === entry.parent);
  if (parent && (!parent.item || !githubFresh(parent.item, now) || parent.note)) return { uncertain: `Prerequisite #${parent.number} status unknown` };
  if (parent && parent.state !== "merged") return { waiting: `Prerequisite #${parent.number}${parent.state === "closed" ? " closed without merging" : " must merge first"}` };
  return entry.note ? { uncertain: entry.note } : {};
}
export function filterGroups(groups: DependencyGroup[], view: "active" | "history", matches: (item: PullRequestItem) => boolean, attention: boolean, statuses: ReadonlyMap<string, Status>): DependencyGroup[] {
  return groups.filter((group) => group.entries.some(({ item }) => item && (view === "history" ? isHistory(item) : !isHistory(item)) && matches(item)) && (!attention || group.entries.some(({ item }) => item && statuses.get(item.id)?.attention)));
}
export function attentionSummary(entries: Entry[], statuses: ReadonlyMap<string, Status>): string {
  const values = entries.flatMap(({ item }) => item && !isHistory(item) ? statuses.get(item.id) ?? [] : []);
  const you = values.filter((status) => status.category === "Needs you").length;
  const fixes = values.filter((status) => status.fixes).length;
  return [you ? `${you} needs you` : "", fixes ? `${fixes} needs fixes` : "", values.some((status) => status.category === "Unknown") ? "Status unknown" : ""].filter(Boolean).join(" · ");
}
