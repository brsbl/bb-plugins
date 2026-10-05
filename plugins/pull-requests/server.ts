import { randomUUID } from "node:crypto";
import { cliCommand, defineCli, PluginCliError, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { CHANGED, hostContract, rpcContract, type Link, type PullRequestItem, type ReadResult, type SearchResult, type Reader, type Snapshot, type ThreadChoice } from "./contract.js";
import { githubRepository, mapConcurrent, parsePullRequestUrl, referencedThreadIds } from "./core.js";
import { createStore } from "./store.js";

type Thread = Pick<Awaited<ReturnType<BbPluginApi["sdk"]["threads"]["get"]>>, "id" | "title" | "titleFallback" | "projectId" | "environmentId" | "archivedAt" | "deletedAt" | "visibility">;
const PAGE = 100;
const now = () => new Date().toISOString();
function offsetFrom(cursor?: string) {
  if (!cursor) return 0;
  if (!/^\d{1,8}$/.test(cursor)) throw new Error("Invalid page cursor.");
  return Number(cursor);
}
export default function plugin(bb: BbPluginApi): void {
  const store = createStore(bb);
  const host = bb.hosts.experimental_client({ contract: hostContract });
  const lifetime = new AbortController();
  let networkActive = 0;
  const networkWaiters: Array<() => void> = [];
  async function network<T>(work: () => Promise<T>): Promise<T> {
    while (networkActive >= 4) await new Promise<void>((resolve) => networkWaiters.push(resolve));
    if (lifetime.signal.aborted) throw new Error("Pull Requests was disabled.");
    networkActive++;
    try { return await work(); } finally { networkActive--; networkWaiters.shift()?.(); }
  }
  const observedAccounts = new Map<string, { accountId: string | null; epoch: number }>();
  const hostInvalidations = new Map<string, number>();
  function invalidateHost(hostId: string, failure: Extract<ReadResult, { ok: false }> & { kind: "authentication-required" | "auth-changed" }) {
    hostInvalidations.set(hostId, (hostInvalidations.get(hostId) ?? 0) + 1);
    const observed = observedAccounts.get(hostId);
    observedAccounts.set(hostId, { accountId: null, epoch: (observed?.epoch ?? 0) + 1 });
    for (const reader of store.readersOnHost(hostId)) {
      connectionEpochs.set(connectionKey(reader), connectionEpoch(reader) + 1);
      store.invalidateConnection(reader, failure.kind, failure.message);
    }
    changed();
  }
  function verifyHostResult<T extends ReadResult | SearchResult>(result: T, hostId: string, epoch: number): T | Extract<ReadResult, { ok: false }> {
    assertLive();
    if (!result.ok && (result.kind === "authentication-required" || result.kind === "auth-changed")) {
      invalidateHost(hostId, { ...result, kind: result.kind });
      return result;
    }
    if (result.ok || result.accountId) {
      const accountId = result.accountId!;
      const observed = observedAccounts.get(hostId);
      if (observed && observed.epoch !== epoch && observed.accountId !== accountId) return { ok: false as const, kind: "auth-changed" as const, message: "The GitHub account changed during this read. Retry from the selected source." };
      observeAccount(hostId, accountId);
    }
    return result;
  }
  const readHost = (input: z.input<typeof hostContract.read.input>, options: { hostId: string; signal?: AbortSignal; timeoutMs?: number }) => network(async () => {
    const epoch = observedAccounts.get(options.hostId)?.epoch ?? 0;
    return verifyHostResult(await host.call("read", input, options), options.hostId, epoch);
  });
  const searchHost = (input: z.input<typeof hostContract.search.input>, hostId: string) => network(async () => {
    const epoch = observedAccounts.get(hostId)?.epoch ?? 0;
    return verifyHostResult(await host.call("search", input, { hostId, signal: lifetime.signal, timeoutMs: 90_000 }), hostId, epoch);
  });
  const changesHost = (input: z.input<typeof hostContract.changes.input>, options: { hostId: string; signal?: AbortSignal; timeoutMs?: number }) => network(() => host.call("changes", input, options));
  const lookupEnvironment = (environmentId: string) => network(() => bb.sdk.environments.pullRequest({ environmentId, signal: lifetime.signal }));
  const connectionEpochs = new Map<string, number>();
  const itemEpochs = new Map<string, number>();
  const inFlight = new Map<string, Promise<PullRequestItem>>();
  const environmentFlights = new Map<string, Promise<void>>();
  const discoveryReads = new Map<string, Promise<PullRequestItem>>();
  const refreshedInBatch = new Set<string>();
  let discovering = false;
  const previews = new Map<string, { snapshot: Snapshot; reader: Reader; thread: ThreadChoice; expires: number; evidence: Link["evidence"]; actor: string }>();
  const undos = new Map<string, { id: string; link: Link; expires: number }>();
  const coverage = { running: false, checked: 0, total: 0, unavailable: 0, incomplete: false, lastDiscoveryAt: null as string | null, includesArchived: false };
  let batch: Promise<void> | null = null;
  let rerunDiscovery = false;
  let rerunArchived = false;
  const changed = () => { if (!lifetime.signal.aborted) bb.realtime.publish(CHANGED, {}); };
  const assertLive = () => { if (lifetime.signal.aborted) throw new Error("Pull Requests was disabled. Reopen it to retry."); };
  const connectionKey = (reader: Reader) => `${reader.hostId}:${reader.accountId}`;
  const connectionEpoch = (reader: Reader) => connectionEpochs.get(connectionKey(reader)) ?? 0;
  const eligibleThread = async (threadId: string): Promise<Thread> => {
    const thread = await bb.sdk.threads.get({ threadId, signal: lifetime.signal });
    if (thread.deletedAt !== null || thread.visibility === "hidden") throw new Error("This thread is unavailable or hidden.");
    return thread;
  };
  const threadChoice = async (thread: Thread): Promise<ThreadChoice> => ({
    id: thread.id, title: thread.title ?? thread.titleFallback ?? "Untitled thread", projectId: thread.projectId,
    environmentId: thread.environmentId, hostId: thread.environmentId ? await bb.sdk.environments.get({ environmentId: thread.environmentId }).then((environment) => environment.hostId, () => null) : null,
    archived: thread.archivedAt !== null,
  });
  const connected = async (hostId: string) => {
    const machine = (await bb.sdk.hosts.list()).find((entry) => entry.id === hostId);
    if (!machine || machine.status !== "connected") throw new Error(`${machine?.name ?? "This machine"} is offline.`);
  };
  function fail(item: PullRequestItem, failure: Extract<ReadResult, { ok: false }>) {
    if (item.reader && (failure.kind === "auth-changed" || failure.kind === "authentication-required")) {
      invalidateHost(item.reader.hostId, { ...failure, kind: failure.kind });
    } else {
      if (failure.kind === "denied") itemEpochs.set(item.id, (itemEpochs.get(item.id) ?? 0) + 1);
      store.save({ ...store.get(item.id), snapshot: failure.kind === "denied" ? null : store.get(item.id).snapshot, sourceState: failure.kind === "unavailable" && item.snapshot ? "stale" : failure.kind, sourceMessage: failure.message, lastAttemptAt: now() });
    }
    changed();
  }
  function observeAccount(hostId: string, accountId: string) {
    const previous = observedAccounts.get(hostId);
    if (previous?.accountId !== accountId) observedAccounts.set(hostId, { accountId, epoch: (previous?.epoch ?? 0) + 1 });
    for (const reader of store.readersOnHost(hostId)) {
      if (reader.accountId === accountId) continue;
      connectionEpochs.set(connectionKey(reader), connectionEpoch(reader) + 1);
      store.invalidateConnection(reader, "auth-changed", "The GitHub account on this machine changed. Choose the read source explicitly to use the new account.");
      changed();
    }
  }
  async function refreshOne(id: string): Promise<PullRequestItem> {
    const running = inFlight.get(id);
    if (running) return running;
    const operation = (async () => {
      const item = store.get(id);
      if (coverage.running) refreshedInBatch.add(id);
      const reader = item.reader;
      if (!reader) return item;
      const epoch = connectionEpoch(reader), generation = itemEpochs.get(id) ?? 0;
      try {
        await connected(reader.hostId);
      } catch {
        if (!lifetime.signal.aborted && generation === (itemEpochs.get(id) ?? 0)) store.save({ ...store.get(id), sourceState: "offline", sourceMessage: "The read machine is offline. Reconnect it, then refresh.", lastAttemptAt: now() });
        changed(); return store.get(id);
      }
      const result = await readHost({ url: item.url, expectedAccountId: reader.accountId }, { hostId: reader.hostId, signal: lifetime.signal, timeoutMs: 90_000 }).catch(() => ({ ok: false as const, kind: "unavailable" as const, message: "The read machine did not finish its GitHub request. Retry." }));
      assertLive();
      if (epoch !== connectionEpoch(reader) || generation !== (itemEpochs.get(id) ?? 0)) return store.get(id);
      if (!result.ok) fail(item, result);
      else if (result.snapshot.nodeId !== item.snapshot?.nodeId && `github:${result.snapshot.nodeId}` !== item.id) fail(item, { ok: false, kind: "unavailable", message: "This URL now resolves to a different pull request. Relink it explicitly." });
      else { const current = store.upsert(result.snapshot, { ...reader, login: result.login }); changed(); await associateBodyThreads(current); changed(); }
      return store.get(id);
    })().finally(() => { if (inFlight.get(id) === operation) inFlight.delete(id); });
    inFlight.set(id, operation);
    return operation;
  }
  const makeLink = (thread: Pick<ThreadChoice, "id" | "environmentId">, evidence: Link["evidence"], actor: string, origin = false): Link => ({ threadId: thread.id, environmentId: thread.environmentId, evidence, origin, actor, createdAt: now() });
  async function associateBodyThreads(item: PullRequestItem) {
    const { snapshot, reader } = item;
    if (!snapshot || !reader) return;
    // Anyone who can open a PR in a project repository can write a description; only PRs the reader wrote or was asked to review may name threads.
    const same = (login: string | null | undefined) => !!login && login.toLowerCase() === reader.login.toLowerCase();
    if (!same(snapshot.author) && !(snapshot.requestedReviewers ?? []).some(same)) return;
    const epoch = connectionEpoch(reader), generation = itemEpochs.get(item.id) ?? 0;
    for (const threadId of referencedThreadIds(snapshot.body)) {
      if (item.links.some((link) => link.threadId === threadId)) continue;
      try {
        const thread = await eligibleThread(threadId);
        const current = store.get(item.id);
        if (lifetime.signal.aborted || epoch !== connectionEpoch(reader) || generation !== (itemEpochs.get(item.id) ?? 0) || current.snapshot?.body !== snapshot.body || current.reader?.hostId !== reader.hostId || current.reader.accountId !== reader.accountId) return;
        // A mention establishes an association, not origin or permission to access a thread.
        store.link(item.id, makeLink(thread, "body-marker", "discovery"));
      } catch { /* Ignore missing, hidden or deleted threads; keep existing associations. */ }
    }
  }
  async function visibleThreads(includeArchived = false) {
    const threads: Thread[] = [];
    let incomplete = false;
    // Each batch is bounded; completeness is explicit rather than an empty-inventory claim.
    for (const archived of includeArchived ? [false, true] : [false]) {
      for (let offset = 0; offset < 5_000; offset += PAGE) {
        const page = await bb.sdk.threads.list({ archived, includeHidden: false, limit: PAGE, offset, signal: lifetime.signal });
        threads.push(...page.filter((thread) => thread.visibility !== "hidden" && thread.deletedAt === null));
        if (page.length < PAGE) break;
        if (offset + PAGE === 5_000) incomplete = true;
      }
    }
    return { threads, incomplete };
  }
  async function discoverEnvironment(environmentId: string, candidateThreads?: Thread[]) {
    const running = environmentFlights.get(environmentId);
    if (running) return running;
    const operation = (async () => {
      const threads = candidateThreads ?? (await bb.sdk.threads.list({ environmentId, includeHidden: false, limit: PAGE, signal: lifetime.signal }));
      const visible = threads.filter((thread) => thread.deletedAt === null && thread.visibility !== "hidden");
      if (!visible.length) return;
      const environment = await bb.sdk.environments.get({ environmentId });
      await connected(environment.hostId);
      const discovered = await lookupEnvironment(environmentId);
      if (discovered.outcome === "unavailable") throw new Error("Environment PR discovery is unavailable.");
      if (discovered.outcome === "absent") return;
      const url = parsePullRequestUrl(discovered.pullRequest.url).url;
      let read = discoveryReads.get(url.toLowerCase());
      if (!read) {
        read = (async () => {
          const existing = store.byUrl(url);
          if (existing) return refreshOne(existing.id);
          const result = await readHost({ url }, { hostId: environment.hostId, signal: lifetime.signal, timeoutMs: 90_000 });
          assertLive();
          if (!result.ok) throw new Error(result.message);
          const verified = store.upsert(result.snapshot, { hostId: environment.hostId, accountId: result.accountId, login: result.login });
          if (coverage.running) refreshedInBatch.add(verified.id);
          return verified;
        })();
        discoveryReads.set(url.toLowerCase(), read);
      }
      let item: PullRequestItem;
      try { item = await read; } finally { if (!discovering) discoveryReads.delete(url.toLowerCase()); }
      for (const thread of visible) {
        try { const current = await eligibleThread(thread.id); store.link(item.id, makeLink(await threadChoice(current), "environment", "discovery")); } catch { /* Thread deleted or hidden during discovery. */ }
      }
      // A body convention can establish origin only when one accessible thread independently resolves to this repository.
      const markers = item.snapshot?.originThreadIds ?? [];
      if (markers.length === 1 && item.snapshot) {
        try {
          const origin = await eligibleThread(markers[0]!);
          if (origin.environmentId) {
            const context = origin.environmentId === environmentId ? discovered : await lookupEnvironment(origin.environmentId);
            if (context.outcome === "available") {
              const expected = parsePullRequestUrl(item.url), actual = parsePullRequestUrl(context.pullRequest.url);
              if (`${actual.owner}/${actual.repository}`.toLowerCase() === `${expected.owner}/${expected.repository}`.toLowerCase()) store.link(item.id, makeLink(await threadChoice(origin), "body-marker", "discovery", true));
            }
          }
        } catch { /* A marker is unverified context, never permission to reveal a hidden thread. */ }
      }
      changed();
    })().finally(() => { if (environmentFlights.get(environmentId) === operation) environmentFlights.delete(environmentId); });
    environmentFlights.set(environmentId, operation);
    return operation;
  }
  /** Each bb project's github.com remote; projects without one are skipped. */
  async function readProjectRepositories() {
    try {
      return (await bb.sdk.projects.list()).flatMap((project) => { const repository = githubRepository(project.gitRemoteUrl); return repository ? [{ id: project.id, repository }] : []; });
    } catch { return []; }
  }
  let projectRepositories: ReturnType<typeof readProjectRepositories> | null = null;
  async function discover(includeArchived: boolean) {
    discovering = true; discoveryReads.clear();
    projectRepositories = readProjectRepositories();
    const repositories = [...new Map((await projectRepositories).map(({ repository }) => [repository.toLowerCase(), repository])).values()];
    const searches: { scope: "authored" | "review" | "history" | "repository"; repositories?: string[] }[] = [{ scope: "authored" }, { scope: "review" }, { scope: "history" }];
    // GitHub ORs repo: qualifiers; small batches keep each query well under the search length limit.
    for (let index = 0; index < repositories.length; index += 5) searches.push({ scope: "repository", repositories: repositories.slice(index, index + 5) });
    coverage.checked = 0; coverage.total = 0; coverage.unavailable = 0; coverage.incomplete = false; coverage.includesArchived = includeArchived;
    const machines = (await bb.sdk.hosts.list()).filter((machine) => machine.status === "connected");
    // Prefer an established reader; credentials on each machine can have different repository access.
    machines.sort((a, b) => store.readersOnHost(b.id).length - store.readersOnHost(a.id).length);
    coverage.total = machines.length;
    for (const machine of machines) {
      let reader: Reader | undefined;
      try {
        for (const { scope, repositories: batch } of searches) {
          let cursor: string | undefined;
          // GitHub search is capped at 1,000 results; history shows the latest 100 and each project batch its 300 most recently updated.
          const pages = scope === "history" ? 4 : scope === "repository" ? 12 : 40;
          for (let page = 0; page < pages; page++) {
            const generations = new Map(itemEpochs), connections = new Map(connectionEpochs);
            const hostGeneration = hostInvalidations.get(machine.id) ?? 0;
            const result = await searchHost({ scope, ...(batch ? { repositories: batch } : {}), ...(cursor ? { cursor } : {}), ...(reader ? { expectedAccountId: reader.accountId } : {}) }, machine.id);
            assertLive();
            if (!result.ok) throw new Error(result.message);
            const key = `${machine.id}:${result.accountId}`;
            if (hostGeneration !== (hostInvalidations.get(machine.id) ?? 0) || (connections.get(key) ?? 0) !== (connectionEpochs.get(key) ?? 0)) throw new Error("GitHub access changed during search. Retry.");
            if (!reader) reader = { hostId: machine.id, accountId: result.accountId, login: result.login };
            const imported: PullRequestItem[] = [];
            for (const snapshot of result.snapshots) {
              const id = `github:${snapshot.nodeId}`;
              if ((generations.get(id) ?? 0) !== (itemEpochs.get(id) ?? 0)) continue;
              const item = store.upsert(snapshot, reader);
              if (item.reader?.hostId !== reader.hostId || item.reader.accountId !== reader.accountId) continue;
              imported.push(store.save({ ...item, discoveredFromGitHub: true }));
              refreshedInBatch.add(id);
            }
            changed();
            await mapConcurrent(imported, 4, associateBodyThreads);
            changed();
            cursor = result.nextCursor ?? undefined;
            if (!cursor) break;
            if (scope !== "history" && page === pages - 1) coverage.incomplete = true;
          }
          if (!reader) break;
        }
      } catch { coverage.unavailable++; coverage.incomplete = true; }
      coverage.checked++; changed();
    }
    if (!machines.length) coverage.incomplete = true;
    // Keep the explicit archived-thread CLI option as optional link enrichment.
    // Ordinary inbox discovery never walks bb environments.
    if (includeArchived) {
      const inventory = await visibleThreads(true);
      coverage.incomplete ||= inventory.incomplete;
      const environments = new Map<string, Thread[]>();
      for (const thread of inventory.threads) if (thread.environmentId) environments.set(thread.environmentId, [...environments.get(thread.environmentId) ?? [], thread]);
      await mapConcurrent([...environments], 4, async ([id, threads]) => { try { await discoverEnvironment(id, threads); } catch { coverage.incomplete = true; } });
    }
    coverage.lastDiscoveryAt = now();
  }
  function refresh(input: { discover?: boolean; includeArchived?: boolean; id?: string }) {
    if (batch) {
      if (input.discover) { rerunDiscovery = true; rerunArchived ||= input.includeArchived ?? false; }
      return { ...coverage };
    }
    refreshedInBatch.clear(); coverage.running = true; changed();
    batch = (async () => {
      if (input.id) await refreshOne(input.id);
      else {
        if (input.discover) await discover(input.includeArchived ?? false);
        await mapConcurrent(store.knownOpenIds().filter((id) => !refreshedInBatch.has(id)), 4, async (id) => { if (!lifetime.signal.aborted) await refreshOne(id); });
      }
    })().catch(() => { coverage.incomplete = true; }).finally(() => {
      batch = null; discovering = false; discoveryReads.clear(); refreshedInBatch.clear(); coverage.running = false; changed();
      if (rerunDiscovery && !lifetime.signal.aborted) { const includeArchived = rerunArchived; rerunDiscovery = false; rerunArchived = false; refresh({ discover: true, includeArchived }); }
    });
    return { ...coverage };
  }
  function cleanupTokens() {
    for (const [key, value] of previews) if (value.expires < Date.now()) previews.delete(key);
    for (const [key, value] of undos) if (value.expires < Date.now()) undos.delete(key);
    while (previews.size >= 50) previews.delete(previews.keys().next().value!);
    while (undos.size >= 100) undos.delete(undos.keys().next().value!);
  }
  async function preview(input: { url: string; threadId: string; hostId?: string }, evidence: Link["evidence"] = "user-explicit", actor = "user") {
    const url = parsePullRequestUrl(input.url).url;
    const thread = await threadChoice(await eligibleThread(input.threadId));
    const hostId = input.hostId ?? thread.hostId;
    if (!hostId) throw new Error("Choose a machine with GitHub access for this thread.");
    if (thread.hostId && thread.hostId !== hostId) throw new Error("Use this thread's machine to verify the pull request.");
    await connected(hostId);
    const existing = store.byUrl(url);
    const reader = existing?.reader?.hostId === hostId ? existing.reader : null;
    const result = await readHost({ url, ...(reader ? { expectedAccountId: reader.accountId } : {}) }, { hostId, signal: lifetime.signal, timeoutMs: 90_000 });
    assertLive();
    if (!result.ok) { if (existing && reader) fail(existing, result); throw new Error(result.message); }
    cleanupTokens();
    const token = randomUUID();
    const verified = { snapshot: result.snapshot, reader: { hostId, accountId: result.accountId, login: result.login }, thread, expires: Date.now() + 120_000, evidence, actor };
    previews.set(token, verified);
    return { token, snapshot: verified.snapshot, reader: verified.reader, thread };
  }
  async function commitLink(token: string) {
    const value = previews.get(token);
    if (!value || value.expires < Date.now()) throw new Error("The preview expired. Verify the URL again.");
    const currentThread = await threadChoice(await eligibleThread(value.thread.id));
    if (currentThread.hostId && currentThread.hostId !== value.reader.hostId) throw new Error("The thread changed machines. Verify the URL again.");
    const id = `github:${value.snapshot.nodeId}`, generation = itemEpochs.get(id) ?? 0, epoch = connectionEpoch(value.reader);
    const result = await readHost({ url: value.snapshot.url, expectedAccountId: value.reader.accountId }, { hostId: value.reader.hostId, signal: lifetime.signal, timeoutMs: 90_000 });
    assertLive();
    if (!result.ok) {
      const existing = store.byUrl(value.snapshot.url);
      if (existing?.reader?.hostId === value.reader.hostId && existing.reader.accountId === value.reader.accountId) fail(existing, result);
      throw new Error(result.message);
    }
    if (result.snapshot.nodeId !== value.snapshot.nodeId || result.snapshot.title !== value.snapshot.title) throw new Error("The pull request changed. Verify the URL again before linking.");
    await eligibleThread(value.thread.id);
    if (generation !== (itemEpochs.get(id) ?? 0) || epoch !== connectionEpoch(value.reader)) throw new Error("Pull request access changed. Verify the URL again.");
    const item = store.upsert(result.snapshot, value.reader);
    const linked = store.link(item.id, makeLink(currentThread, value.evidence, value.actor), true);
    previews.delete(token); changed(); return linked;
  }
  async function unlink(id: string, threadId: string) {
    await eligibleThread(threadId);
    const link = store.unlink(id, threadId);
    if (!link) return { undoToken: null };
    cleanupTokens();
    const undoToken = randomUUID();
    undos.set(undoToken, { id, link, expires: Date.now() + 60_000 });
    changed(); return { undoToken };
  }
  async function sanitize(item: PullRequestItem) {
    const eligible = new Set(await mapConcurrent(item.links, 4, async (link) => {
      try { await eligibleThread(link.threadId); return link.threadId; } catch { return null; }
    }));
    item = store.get(item.id);
    const links = item.links.filter((link) => eligible.has(link.threadId));
    return { ...item, links, preferredThreadId: links.some((link) => link.threadId === item.preferredThreadId) ? item.preferredThreadId : null };
  }
  async function show(id: string) {
    const item = await sanitize(store.get(id));
    if (!item.links.length && !item.discoveredFromGitHub) throw new Error("No accessible bb threads are linked to this pull request.");
    return item;
  }
  async function list(input: z.input<typeof rpcContract.list.input>) {
    const parsed = rpcContract.list.input.parse(input), offset = offsetFrom(parsed.cursor);
    const page = store.list({ ...parsed, offset });
    const items = (await mapConcurrent(page.items, 4, (item) => sanitize(item))).filter((item) => item.links.length || item.discoveredFromGitHub).map((item) => ({ ...item, snapshot: item.snapshot ? { ...item.snapshot, body: "", checks: { ...item.snapshot.checks, items: [] }, stack: { ...item.snapshot.stack, items: [] } } : null }));
    return { items, total: page.total, nextCursor: offset + page.items.length < page.total ? String(offset + page.items.length) : null, coverage: { ...coverage }, authors: page.authors, projects: await (projectRepositories ??= readProjectRepositories()) };
  }
  async function source(id: string, hostId: string) {
    const item = await show(id);
    const choices = await mapConcurrent(item.links, 4, async (link) => threadChoice(await eligibleThread(link.threadId)));
    if (!item.discoveredFromGitHub && !choices.some((thread) => thread.hostId === hostId || thread.hostId === null)) throw new Error("Choose a linked thread's machine for this read source.");
    await connected(hostId);
    const generation = (itemEpochs.get(id) ?? 0) + 1;
    itemEpochs.set(id, generation);
    // Explicit source selection is the only path that accepts a changed GitHub account.
    const result = await readHost({ url: item.url }, { hostId, signal: lifetime.signal, timeoutMs: 90_000 });
    assertLive();
    if (generation !== itemEpochs.get(id)) return show(id);
    if (!result.ok) { if (item.reader?.hostId === hostId) fail(item, result); throw new Error(result.message); }
    if (`github:${result.snapshot.nodeId}` !== id) throw new Error("This URL resolves to a different pull request. Relink it explicitly.");
    if (item.reader?.hostId === hostId && item.reader.accountId !== result.accountId) {
      connectionEpochs.set(connectionKey(item.reader), connectionEpoch(item.reader) + 1);
      store.invalidateConnection(item.reader, "auth-changed", "The GitHub account on this machine changed. Choose the read source explicitly to use the new account.");
    }
    const value = store.save({ ...store.get(id), snapshot: result.snapshot, reader: { hostId, accountId: result.accountId, login: result.login }, sourceState: "available", sourceMessage: null, lastAttemptAt: now() });
    changed(); return sanitize(value);
  }
  bb.rpc.register(rpcContract, {
    list, show: ({ id }) => show(id), refresh,
    context: async ({ query, cursor, threadIds }) => {
      const offset = offsetFrom(cursor);
      const threads = threadIds ? (await mapConcurrent([...new Set(threadIds)], 4, async (id) => eligibleThread(id).catch(() => null))).filter((thread) => thread !== null) : await bb.sdk.threads.list({ includeHidden: false, limit: PAGE, offset, signal: lifetime.signal });
      const choices = await mapConcurrent(threads.filter((thread) => thread.deletedAt === null && thread.visibility !== "hidden"), 4, (thread) => threadChoice(thread));
      return { threads: choices.filter((thread) => !query || `${thread.title} ${thread.id}`.toLowerCase().includes(query.toLowerCase())), nextCursor: !threadIds && threads.length === PAGE ? String(offset + PAGE) : null, hosts: (await bb.sdk.hosts.list()).map((machine) => ({ id: machine.id, name: machine.name, connected: machine.status === "connected" })) };
    },
    preview: (input) => preview(input), link: ({ token }) => commitLink(token), unlink: ({ id, threadId }) => unlink(id, threadId),
    undo: async ({ token }) => {
      const value = undos.get(token);
      if (!value || value.expires < Date.now()) throw new Error("Undo has expired. Link the pull request again.");
      await eligibleThread(value.link.threadId);
      const item = store.link(value.id, value.link, true); undos.delete(token); changed(); return sanitize(item);
    },
    prefer: async ({ id, threadId }) => {
      const item = await show(id);
      if (threadId && !item.links.some((link) => link.threadId === threadId)) throw new Error("Choose a linked thread.");
      if (threadId) await eligibleThread(threadId);
      const value = store.save({ ...store.get(id), preferredThreadId: threadId }); changed(); return sanitize(value);
    },
    pin: async ({ id, pinned }) => { await show(id); const value = store.save({ ...store.get(id), pinned }); changed(); return sanitize(value); },
    source: ({ id, hostId }) => source(id, hostId),
    changes: async ({ id }) => {
      const item = await show(id);
      if (!item.reader || !item.snapshot) throw new Error("Refresh this pull request before opening Changes.");
      const reader = item.reader, epoch = connectionEpoch(reader), generation = itemEpochs.get(id) ?? 0;
      const result = await changesHost({ url: item.url, expectedAccountId: reader.accountId, headSha: item.snapshot.headSha }, { hostId: reader.hostId, signal: lifetime.signal, timeoutMs: 90_000 });
      assertLive();
      if (epoch !== connectionEpoch(reader) || generation !== (itemEpochs.get(id) ?? 0)) throw new Error("The read source changed. Reopen Changes.");
      if (!result.ok) { fail(item, result); throw new Error(result.message); }
      if (store.get(id).snapshot?.headSha !== result.changes.headSha) throw new Error("The pull request revision changed. Reopen Changes for the current revision.");
      return result.changes;
    },
  });
  bb.events.on("thread.deleted", ({ thread }) => {
    store.removeThread(thread.id);
    for (const [token, value] of previews) if (value.thread.id === thread.id) previews.delete(token);
    for (const [token, value] of undos) if (value.link.threadId === thread.id) undos.delete(token);
    changed();
  });
  const eventTimers = new Map<string, ReturnType<typeof setTimeout>>();
  for (const name of ["thread.created", "thread.idle"] as const) bb.events.on(name, ({ thread }) => {
    if (!thread.environmentId || thread.visibility === "hidden" || thread.deletedAt !== null) return;
    const id = thread.environmentId;
    clearTimeout(eventTimers.get(id));
    eventTimers.set(id, setTimeout(() => { eventTimers.delete(id); if (!lifetime.signal.aborted) void discoverEnvironment(id).catch(() => { coverage.incomplete = true; changed(); }); }, 750));
  });
  bb.onDispose(() => { lifetime.abort(); for (const resolve of networkWaiters.splice(0)) resolve(); for (const timer of eventTimers.values()) clearTimeout(timer); eventTimers.clear(); previews.clear(); undos.clear(); });

  const output = (value: unknown) => ({ exitCode: 0, stdout: JSON.stringify(value) });
  const target = (explicit: string | undefined, current: string | undefined) => {
    if (explicit ?? current) return (explicit ?? current)!;
    throw new PluginCliError("A thread is required.", { code: "thread_required", hint: "Pass --thread <thread-id>." });
  };
  const idPosition = [{ name: "id", required: true, description: "Stable PR ID from list" }] as const;
  const threadOption = { type: "string", description: "Explicit target thread; defaults to the calling thread" } as const;
  bb.cli.register(defineCli({ name: "pull-requests", summary: "Find GitHub pull requests and related bb threads", commands: {
    list: cliCommand({ summary: "List known PRs with explicit coverage and pagination", options: { cursor: { type: "string", description: "Page cursor" }, limit: { type: "integer", min: 1, max: 100, description: "Maximum items" }, query: { type: "string", description: "Repository, PR number or title" } }, run: async ({ options }) => output(await list({ cursor: options.cursor, limit: options.limit ?? 20, query: options.query })) }),
    show: cliCommand({ summary: "Read one PR and its links", positionals: idPosition, run: async ({ positionals }) => output(await show(positionals.id)) }),
    refresh: cliCommand({ summary: "Refresh known open PRs or query your GitHub pull requests", options: { discover: { type: "boolean", description: "Query authored PRs, review requests and recent history on GitHub" }, archived: { type: "boolean", description: "Include surviving archived thread environments in discovery" } }, run: ({ options }) => output(refresh({ discover: options.discover, includeArchived: options.archived })) }),
    link: cliCommand({ summary: "Verify and link an existing GitHub PR to a visible thread", positionals: [{ name: "url", required: true, description: "HTTPS GitHub pull request URL" }], options: { thread: threadOption, machine: { type: "string", description: "Machine for a thread without an environment" } }, run: async ({ positionals, options }, ctx) => {
      const verified = await preview({ url: positionals.url, threadId: target(options.thread, ctx.threadId), hostId: options.machine }, "agent-explicit", ctx.threadId ?? "cli");
      return output(await commitLink(verified.token));
    } }),
    unlink: cliCommand({ summary: "Remove a local link with a 60-second undo token; never modifies GitHub", positionals: idPosition, options: { thread: threadOption }, run: async ({ positionals, options }, ctx) => output(await unlink(positionals.id, target(options.thread, ctx.threadId))) }),
  } }));
  bb.agents.registerTool({ name: "pull_requests", description: "Read GitHub PRs and related bb threads, refresh snapshots, or explicitly link/unlink an existing PR. Read-only on GitHub. Cross-thread changes require an explicit threadId; this is a targeting convention, not an authorization boundary.", parameters: z.object({ action: z.enum(["list", "show", "refresh", "link", "unlink"]), id: z.string().optional(), url: z.string().optional(), threadId: z.string().optional(), hostId: z.string().optional(), cursor: z.string().optional(), discover: z.boolean().optional() }), async execute(input, ctx) {
    if (input.action === "list") return JSON.stringify(await list({ cursor: input.cursor, limit: 20 }));
    if (input.action === "show") { if (!input.id) throw new Error("Provide a PR id."); return JSON.stringify(await show(input.id)); }
    if (input.action === "refresh") return JSON.stringify(refresh({ discover: input.discover }));
    if (input.action === "unlink") { if (!input.id) throw new Error("Provide a PR id."); return JSON.stringify(await unlink(input.id, input.threadId ?? ctx.threadId)); }
    if (!input.url) throw new Error("Provide an HTTPS GitHub PR URL.");
    const verified = await preview({ url: input.url, threadId: input.threadId ?? ctx.threadId, hostId: input.hostId }, "agent-explicit", ctx.threadId);
    return JSON.stringify(await commitLink(verified.token));
  } });
  bb.agents.configure(() => ({ tools: ["pull_requests"], skills: [] }));
  bb.log.info("Pull Requests loaded");
}
