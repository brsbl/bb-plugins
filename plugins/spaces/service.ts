// Spaces' server side: the registry, the in-memory membership the agent configuration reads synchronously,
// snapshots, mutations, the sidebar More controller, and live updates.

import type {
  BbPluginApi,
  PluginAgentConfiguration,
  PluginAgentConfigurationContext,
  PluginMentionProviderRegistration,
  PluginRpcHandlers,
  PluginThreadEventPayloads,
} from "@get-bb/plugin-sdk";
import { z } from "zod";

import type { OrganizerSupport, PanelState, SpaceSnapshot, SpaceSummary, TellResult, spacesRpc } from "./contract";
import {
  buildCandidates,
  childrenByParent,
  countText,
  isTopLevelVisible,
  liveSpaceOf,
  memberInstruction,
  mentionContext,
  rankProjects,
  sortMembers,
  toExcerpt,
  toMember,
  withHiddenGroup,
  type ThreadPlacement,
  type ThreadRow,
} from "./model";
import {
  MENTION_PROVIDER_ID,
  ORGANIZER_PLUGIN_ID,
  ORGANIZER_RENAME_METHOD,
  ORGANIZER_SPACES_METHOD,
  PANEL_ACTION_ID,
  PLUGIN_ID,
  REALTIME_CHANNEL,
  THREAD_LIST_PLUGIN_ID,
  hiddenGroupKey,
} from "./shared";
import { createStore } from "./store";

/** The frontmatter name of skills/spaces/SKILL.md. Once a plugin configures agents, only selected skills load. */
const SKILL_NAME = "spaces";
const LIST_CACHE_MS = 2_000;
const PROJECT_CACHE_MS = 60_000;
const ORGANIZER_CACHE_MS = 30_000;
const REFRESH_DEBOUNCE_MS = 500;
const ARCHIVED_LIMIT = 20;
const OUTPUT_CONCURRENCY = 4;
const MOVE_CONCURRENCY = 4;
const TAB_CONCURRENCY = 4;
const TAB_ATTEMPTS = 3;
const EXCERPT_CACHE_MAX = 500;
const SEND_CONCURRENCY = 4;

/**
 * The tab bb's client builds for this plugin's `space` panel action without params
 * (`createPluginPanelFixedPanelTab`), so a tab Spaces adds and one opened from the + launcher are the same tab.
 */
const SPACE_TAB_ID = `plugin-panel:${encodeURIComponent(`${PLUGIN_ID}:${PANEL_ACTION_ID}:`)}:none`;

/**
 * Thread changes that can move a thread in or out of a Space or change how its card reads. A section move or a
 * rename arrives as title-changed. Streaming output (events-appended) is left to the lifecycle events.
 */
const RELEVANT_THREAD_CHANGES: ReadonlySet<string> = new Set([
  "archived-changed",
  "interactions-changed",
  "parent-changed",
  "read-state-changed",
  "status-changed",
  "thread-created",
  "thread-deleted",
  "title-changed",
]);

type SectionRow = Awaited<ReturnType<BbPluginApi["sdk"]["threadSections"]["list"]>>[number];
type EventThread = PluginThreadEventPayloads["thread.idle"]["thread"];
type ThreadTab = Awaited<ReturnType<BbPluginApi["sdk"]["threads"]["tabs"]["get"]>>["tabs"][number];

const SPACE_TAB = {
  id: SPACE_TAB_ID,
  kind: "plugin-panel",
  pluginId: PLUGIN_ID,
  actionId: PANEL_ACTION_ID,
  title: "Space",
  paramsJson: null,
} satisfies ThreadTab;

const organizerAnswerSchema = z.object({
  version: z.number(),
  inboxSectionIds: z.array(z.string()),
  entryPromptSectionIds: z.array(z.string()).optional(),
});
const organizerRenameSchema = z.object({ name: z.string() });
const listPreferencesSchema = z.object({ preferences: z.object({ hiddenGroups: z.array(z.string()) }) });
const setPreferenceSchema = z.object({ key: z.string(), value: z.array(z.string()) });

interface OrganizerInfo {
  support: OrganizerSupport;
  /** Thread Organizer's inboxes, which can't be Spaces. Empty unless Thread Organizer supports Spaces. */
  inboxSectionIds: ReadonlySet<string>;
  /** Sections with a Thread Organizer entry prompt, which pauses while the section is a Space. */
  entryPromptSectionIds: ReadonlySet<string>;
}

interface ReconcileResult {
  /** Spaces whose members, names, or existence changed. */
  affected: Set<string>;
  /** Threads that became members since the last pass. */
  joined: string[];
}

interface TtlCache<T> {
  get(): Promise<T>;
  clear(): void;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Shares one load among concurrent readers and keeps it for `ttlMs`; a failed load is never cached. */
function ttlCache<T>(ttlMs: number, load: () => Promise<T>): TtlCache<T> {
  let entry: { at: number; value: Promise<T> } | null = null;
  return {
    get() {
      if (entry && Date.now() - entry.at < ttlMs) return entry.value;
      const current = { at: Date.now(), value: load() };
      entry = current;
      current.value.catch(() => {
        if (entry === current) entry = null;
      });
      return current.value;
    },
    clear() {
      entry = null;
    },
  };
}

async function mapLimit<T, R>(items: readonly T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await fn(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function isSpaceTab(tab: ThreadTab): boolean {
  return tab.kind === "plugin-panel" && tab.pluginId === PLUGIN_ID && tab.actionId === PANEL_ACTION_ID;
}

/** Another client wrote the thread's tabs first (HTTP 409 `thread_tabs_conflict`). */
function isRevisionConflict(error: unknown): boolean {
  if (typeof error === "object" && error !== null) {
    const { status, code } = error as { status?: unknown; code?: unknown };
    if (status === 409 || code === "thread_tabs_conflict") return true;
  }
  return /thread_tabs_conflict|\b409\b/u.test(errorMessage(error));
}

export function createService(bb: BbPluginApi) {
  const store = createStore(bb);
  const isSpace = (sectionId: string) => store.has(sectionId);

  const settings = bb.settings.define({
    membersKnowSpace: {
      type: "boolean",
      label: "Members know their Space",
      description:
        "Give each thread in a Space one short line naming its Space and how to check on the others, so you can ask it to coordinate with them without mentioning the Space. Applies the next time a thread's session starts.",
      default: true,
    },
  });
  // bb.agents.configure is synchronous, so it reads this copy of the setting.
  let membersKnowSpace = true;
  settings.get().then(
    (values) => {
      membersKnowSpace = values.membersKnowSpace;
    },
    (error: unknown) => bb.log.warn(`Spaces could not read its settings: ${errorMessage(error)}`),
  );
  settings.onChange((next) => {
    membersKnowSpace = next.membersKnowSpace;
  });

  // -------------------------------------------------------------------------
  // Reads, cached briefly so a burst of panel refreshes costs one list.

  const liveThreads = ttlCache(LIST_CACHE_MS, () => bb.sdk.threads.list({ archived: false }));
  const sectionList = ttlCache(LIST_CACHE_MS, () => bb.sdk.threadSections.list());
  const projectNames = ttlCache(PROJECT_CACHE_MS, async () => {
    const projects: Array<{ id: string; name: string }> = await bb.sdk.projects.list({ includePersonal: true });
    return new Map(projects.map((project) => [project.id, project.name]));
  });
  const organizer = ttlCache(ORGANIZER_CACHE_MS, loadOrganizer);
  const archivedLists = new Map<string, TtlCache<ThreadRow[]>>();
  /** Latest-output excerpts, keyed by thread and invalidated when the thread's activity moves on. */
  const excerpts = new Map<string, { key: string; value: Promise<string | null> }>();

  function invalidate(): void {
    liveThreads.clear();
    sectionList.clear();
    for (const cache of archivedLists.values()) cache.clear();
  }

  async function loadOrganizer(): Promise<OrganizerInfo> {
    try {
      const answer = await bb.sdk.plugins.callRpc({
        pluginId: ORGANIZER_PLUGIN_ID,
        method: ORGANIZER_SPACES_METHOD,
        input: null,
        outputSchema: organizerAnswerSchema,
      });
      if (answer.version >= 1) {
        return {
          support: "supported",
          inboxSectionIds: new Set(answer.inboxSectionIds),
          entryPromptSectionIds: new Set(answer.entryPromptSectionIds ?? []),
        };
      }
    } catch {
      // Not installed, turned off, or too old to answer; the plugin list says which.
    }
    try {
      const { plugins } = await bb.sdk.plugins.list();
      const installed = plugins.find((plugin) => plugin.id === ORGANIZER_PLUGIN_ID);
      return { support: installed?.enabled ? "outdated" : "absent", inboxSectionIds: new Set(), entryPromptSectionIds: new Set() };
    } catch (error) {
      bb.log.warn(`Spaces could not check for Thread Organizer: ${errorMessage(error)}`);
      return { support: "absent", inboxSectionIds: new Set(), entryPromptSectionIds: new Set() };
    }
  }

  async function projectNamesOrEmpty(): Promise<Map<string, string>> {
    try {
      return await projectNames.get();
    } catch (error) {
      bb.log.warn(`Spaces could not list projects: ${errorMessage(error)}`);
      return new Map();
    }
  }

  /** The 20 most recently archived members, which the panel folds into "Archived (n)". */
  async function archivedMembers(sectionId: string): Promise<ThreadRow[]> {
    let cache = archivedLists.get(sectionId);
    if (!cache) {
      cache = ttlCache(LIST_CACHE_MS, async () =>
        (await bb.sdk.threads.list({ archived: true, sectionId, hasParent: false, limit: ARCHIVED_LIMIT }))
          .filter((row) => isTopLevelVisible(row)));
      archivedLists.set(sectionId, cache);
    }
    try {
      return await cache.get();
    } catch (error) {
      bb.log.warn(`Spaces could not list archived members of ${sectionId}: ${errorMessage(error)}`);
      return [];
    }
  }

  function excerptKey(thread: Pick<ThreadRow, "updatedAt" | "latestAttentionAt" | "status">): string {
    return `${thread.updatedAt}:${thread.latestAttentionAt}:${thread.status}`;
  }

  function rememberExcerpt(threadId: string, entry: { key: string; value: Promise<string | null> }): void {
    excerpts.delete(threadId);
    excerpts.set(threadId, entry);
    if (excerpts.size <= EXCERPT_CACHE_MAX) return;
    const oldest = excerpts.keys().next().value;
    if (oldest !== undefined) excerpts.delete(oldest);
  }

  function excerptFor(row: ThreadRow): Promise<string | null> {
    const key = excerptKey(row);
    const cached = excerpts.get(row.id);
    if (cached?.key === key) return cached.value;
    const entry: { key: string; value: Promise<string | null> } = {
      key,
      value: bb.sdk.threads.output({ threadId: row.id }).then(
        ({ output }) => toExcerpt(output),
        (error: unknown) => {
          if (excerpts.get(row.id) === entry) excerpts.delete(row.id);
          bb.log.debug(`Spaces could not read the latest output of ${row.id}: ${errorMessage(error)}`);
          return null;
        },
      ),
    };
    rememberExcerpt(row.id, entry);
    return entry.value;
  }

  async function placementOf(threadId: string, live?: ReadonlyMap<string, ThreadRow>): Promise<ThreadPlacement> {
    const rows = live ?? new Map((await liveThreads.get()).map((row) => [row.id, row]));
    return rows.get(threadId) ?? bb.sdk.threads.get({ threadId });
  }

  // -------------------------------------------------------------------------
  // Registry and membership

  let loaded = false;
  let loading: Promise<void> | null = null;
  /** Loads the registry once; a failed load is retried by the next caller rather than treated as "no Spaces". */
  function ensureLoaded(): Promise<void> {
    if (loaded) return Promise.resolve();
    loading ??= store.load().then(
      () => {
        loaded = true;
        loading = null;
      },
      (error: unknown) => {
        loading = null;
        throw error;
      },
    );
    return loading;
  }

  function requireSpace(sectionId: string): void {
    if (!store.has(sectionId)) throw new Error("That section isn't a Space.");
  }

  /** Live member → its Space, rebuilt on every reconcile. Serves the synchronous agent configuration. */
  let membership = new Map<string, string>();
  /** Space → section name, from the same reconcile. */
  let sectionNames = new Map<string, string>();
  let baselined = false;
  let disposed = false;

  async function reconcile(): Promise<ReconcileResult> {
    await ensureLoaded();
    invalidate();
    const [sections, live] = await Promise.all([sectionList.get(), liveThreads.get()]);
    const existing = new Set(sections.map((section) => section.id));
    const gone = store.ids().filter((sectionId) => !existing.has(sectionId));
    if (gone.length > 0) {
      bb.log.info(`Spaces: section ${gone.join(", ")} was deleted, so it is no longer a Space.`);
      await store.remove(gone);
      for (const sectionId of gone) archivedLists.delete(sectionId);
    }

    const names = new Map(sections.filter((section) => store.has(section.id)).map((section) => [section.id, section.name]));
    const next = new Map<string, string>();
    for (const row of live) {
      const sectionId = liveSpaceOf(row, isSpace);
      if (sectionId !== null) next.set(row.id, sectionId);
    }

    const affected = new Set<string>(gone);
    const joined: string[] = [];
    for (const [threadId, sectionId] of next) {
      const previous = membership.get(threadId);
      if (previous === sectionId) continue;
      joined.push(threadId);
      affected.add(sectionId);
      if (previous !== undefined) affected.add(previous);
    }
    for (const [threadId, sectionId] of membership) {
      if (!next.has(threadId)) affected.add(sectionId);
    }
    for (const [sectionId, name] of names) {
      if (sectionNames.get(sectionId) !== name) affected.add(sectionId);
    }

    const first = !baselined;
    membership = next;
    sectionNames = names;
    baselined = true;
    // The first pass only learns who is already a member. Treating them all as new would put the Space tab back
    // on every restart, including on threads where it was closed.
    return first ? { affected: new Set(gone), joined: [] } : { affected, joined };
  }

  let reconcileChain: Promise<unknown> = Promise.resolve();
  /** One reconcile at a time, so two passes never diff against the same membership. */
  function reconcileNow(): Promise<ReconcileResult> {
    const run = reconcileChain.then(reconcile);
    reconcileChain = run.catch(() => undefined);
    return run;
  }

  async function ensureBaseline(): Promise<void> {
    if (baselined) return;
    try {
      await reconcileNow();
    } catch (error) {
      bb.log.warn(`Spaces could not read current members: ${errorMessage(error)}`);
    }
  }

  function publish(sectionIds: Iterable<string>): void {
    const ids = [...new Set(sectionIds)];
    if (ids.length === 0 || disposed) return;
    try {
      bb.realtime.publish(REALTIME_CHANNEL, { sectionIds: ids });
    } catch (error) {
      bb.log.warn(`Spaces realtime publish failed: ${errorMessage(error)}`);
    }
  }

  // -------------------------------------------------------------------------
  // The Space tab on new members

  let tabWork: Promise<void> = Promise.resolve();

  /** Adds the Space tab to a member that lacks it. Tab failures are logged, never surfaced to the caller. */
  async function ensureSpaceTab(threadId: string): Promise<void> {
    for (let attempt = 0; attempt < TAB_ATTEMPTS; attempt += 1) {
      try {
        const current = await bb.sdk.threads.tabs.get({ threadId });
        if (current.tabs.some(isSpaceTab)) return;
        await bb.sdk.threads.tabs.update({ threadId, expectedRevision: current.revision, tabs: [...current.tabs, SPACE_TAB] });
        return;
      } catch (error) {
        if (isRevisionConflict(error)) continue;
        bb.log.warn(`Spaces could not add the Space tab to ${threadId}: ${errorMessage(error)}`);
        return;
      }
    }
    bb.log.warn(`Spaces skipped the Space tab on ${threadId}: its tabs kept changing.`);
  }

  function queueTabs(threadIds: readonly string[]): void {
    if (threadIds.length === 0 || disposed) return;
    tabWork = tabWork.then(async () => {
      await mapLimit(threadIds, TAB_CONCURRENCY, ensureSpaceTab);
    });
  }

  /** After any change: refresh membership, give new members the tab, and tell open panels which Spaces moved. */
  async function afterChange(sectionIds: Iterable<string>): Promise<void> {
    const affected = new Set(sectionIds);
    try {
      const result = await reconcileNow();
      for (const sectionId of result.affected) affected.add(sectionId);
      queueTabs(result.joined);
    } catch (error) {
      bb.log.warn(`Spaces could not refresh after a change: ${errorMessage(error)}`);
      invalidate();
    }
    publish(affected);
  }

  // -------------------------------------------------------------------------
  // Snapshots

  async function spaceSummaries(): Promise<SpaceSummary[]> {
    await ensureLoaded();
    const [sections, live] = await Promise.all([sectionList.get(), liveThreads.get()]);
    const counts = new Map<string, number>();
    for (const row of live) {
      const sectionId = liveSpaceOf(row, isSpace);
      if (sectionId !== null) counts.set(sectionId, (counts.get(sectionId) ?? 0) + 1);
    }
    return sections
      .filter((section) => store.has(section.id))
      .map((section) => ({ sectionId: section.id, name: section.name, memberCount: counts.get(section.id) ?? 0 }))
      .sort((left, right) => left.name.localeCompare(right.name) || left.sectionId.localeCompare(right.sectionId));
  }

  async function summaryOf(sectionId: string): Promise<SpaceSummary> {
    const summary = (await spaceSummaries()).find((candidate) => candidate.sectionId === sectionId);
    if (!summary) throw new Error("That Space no longer exists.");
    return summary;
  }

  async function buildSnapshot(sectionId: string): Promise<SpaceSnapshot> {
    await ensureLoaded();
    requireSpace(sectionId);
    const [sections, live, archived, projects, organizerInfo] = await Promise.all([
      sectionList.get(),
      liveThreads.get(),
      archivedMembers(sectionId),
      projectNamesOrEmpty(),
      organizer.get(),
    ]);
    const section = sections.find((candidate) => candidate.id === sectionId);
    if (!section) throw new Error("That Space's section no longer exists.");
    const children = childrenByParent(live);
    const rows = [...live.filter((row) => liveSpaceOf(row, isSpace) === sectionId), ...archived];
    const latest = await mapLimit(rows, OUTPUT_CONCURRENCY, excerptFor);
    const members = sortMembers(
      rows.map((row, index) =>
        toMember(row, {
          projectName: projects.get(row.projectId) ?? null,
          excerpt: latest[index] ?? null,
          children: children.get(row.id) ?? [],
        })),
    );
    return {
      sectionId,
      name: section.name,
      projects: rankProjects(members),
      members,
      organizer: organizerInfo.support,
      builtAt: Date.now(),
    };
  }

  async function panelState(threadId: string): Promise<PanelState> {
    await ensureLoaded();
    const [placement, sections] = await Promise.all([placementOf(threadId), sectionList.get()]);
    const section: SectionRow | undefined = placement.sectionId === null
      ? undefined
      : sections.find((candidate) => candidate.id === placement.sectionId);
    // Archived members still show their Space; subthreads and hidden threads never belong to one.
    if (section && isTopLevelVisible(placement) && store.has(section.id)) {
      return { kind: "member", space: await buildSnapshot(section.id) };
    }
    const [organizerInfo, spaces] = await Promise.all([organizer.get(), spaceSummaries()]);
    return {
      kind: "outside",
      section: section
        ? {
            id: section.id,
            name: section.name,
            eligible: !organizerInfo.inboxSectionIds.has(section.id),
            hasEntryPrompt: organizerInfo.entryPromptSectionIds.has(section.id),
          }
        : null,
      spaces,
      isSubthread: placement.parentThreadId !== null,
    };
  }

  // -------------------------------------------------------------------------
  // Mutations

  /** Moves threads into a Space. Subthreads follow their parent and hidden threads are never members, so both are skipped. */
  async function moveIntoSpace(
    sectionId: string,
    threadIds: readonly string[],
  ): Promise<{ added: string[]; skipped: string[]; left: Set<string> }> {
    const live = new Map((await liveThreads.get()).map((row) => [row.id, row]));
    const left = new Set<string>();
    const outcomes = await mapLimit([...new Set(threadIds)], MOVE_CONCURRENCY, async (threadId) => {
      try {
        const placement = await placementOf(threadId, live);
        if (!isTopLevelVisible(placement)) return { threadId, added: false };
        if (placement.sectionId !== sectionId) {
          await bb.sdk.threads.update({ threadId, sectionId });
          if (placement.sectionId !== null && store.has(placement.sectionId)) left.add(placement.sectionId);
        }
        return { threadId, added: true };
      } catch (error) {
        bb.log.warn(`Spaces could not move ${threadId} into ${sectionId}: ${errorMessage(error)}`);
        return { threadId, added: false };
      }
    });
    return {
      added: outcomes.filter((outcome) => outcome.added).map((outcome) => outcome.threadId),
      skipped: outcomes.filter((outcome) => !outcome.added).map((outcome) => outcome.threadId),
      left,
    };
  }

  // -------------------------------------------------------------------------
  // Sidebar More controller

  let sidebarQueue: Promise<unknown> = Promise.resolve();

  /**
   * Brings a Space out of More or puts it back, changing only its own `hiddenGroups` entry. Spaces only puts back
   * a Space it brought out, the way Desktop only unhides threads it hid.
   */
  async function applySidebarVisibility(sectionId: string, show: boolean): Promise<{ changed: boolean }> {
    await ensureLoaded();
    const record = store.get(sectionId);
    if (!record || (!show && !record.autoShown)) return { changed: false };
    const key = hiddenGroupKey(sectionId);
    try {
      const { preferences } = await bb.sdk.plugins.callRpc({
        pluginId: THREAD_LIST_PLUGIN_ID,
        method: "listPreferences",
        input: null,
        outputSchema: listPreferencesSchema,
      });
      const hidden = preferences.hiddenGroups.includes(key);
      if (show && !hidden) return { changed: false }; // Already in the sidebar, so it isn't Spaces' to put back.
      if (!show && hidden) {
        // You put it back yourself; it's yours again.
        await store.update(sectionId, { autoShown: false });
        return { changed: false };
      }
      const written = await bb.sdk.plugins.callRpc({
        pluginId: THREAD_LIST_PLUGIN_ID,
        method: "setPreference",
        input: { key: "hiddenGroups", value: withHiddenGroup(preferences.hiddenGroups, key, !show) },
        outputSchema: setPreferenceSchema,
      });
      if (written.value.includes(key) === show) {
        bb.log.warn(`Spaces wrote the sidebar's hidden groups, but ${sectionId} didn't move.`);
        return { changed: false };
      }
      await store.update(sectionId, { autoShown: show });
      return { changed: true };
    } catch (error) {
      bb.log.warn(`Spaces could not ${show ? "bring" : "put"} ${sectionId} ${show ? "out of" : "back into"} More: ${errorMessage(error)}`);
      return { changed: false };
    }
  }

  // -------------------------------------------------------------------------
  // RPC

  const rpc = {
    panelState: ({ threadId }) => panelState(threadId),
    snapshot: ({ sectionId }) => buildSnapshot(sectionId),
    async listSpaces() {
      return { spaces: await spaceSummaries() };
    },
    async listSpaceSectionIds() {
      await ensureLoaded();
      return { sectionIds: store.ids() };
    },
    async makeSpace({ sectionId }) {
      await ensureLoaded();
      if (!store.has(sectionId)) {
        sectionList.clear();
        const section = (await sectionList.get()).find((candidate) => candidate.id === sectionId);
        if (!section) throw new Error(`There's no section ${sectionId}.`);
        if ((await organizer.get()).inboxSectionIds.has(sectionId)) {
          throw new Error(`"${section.name}" is a Thread Organizer inbox, so it can't be a Space. Start a new Space instead.`);
        }
        // Learn current members first, so the ones already in this section count as joining and get the tab.
        await ensureBaseline();
        await store.set(sectionId, { createdAt: Date.now(), autoShown: false });
        await afterChange([sectionId]);
      }
      return summaryOf(sectionId);
    },
    async createSpace({ name, threadIds }) {
      await ensureLoaded();
      await ensureBaseline();
      const section = await bb.sdk.threadSections.create({ name });
      // Mark it before anything else, so Thread Organizer never adopts the new section as a stage.
      const marked = store.set(section.id, { createdAt: Date.now(), autoShown: false });
      sectionList.clear();
      await marked;
      const moved = threadIds && threadIds.length > 0 ? await moveIntoSpace(section.id, threadIds) : null;
      await afterChange([section.id, ...(moved?.left ?? [])]);
      return summaryOf(section.id);
    },
    async renameSpace({ sectionId, name }) {
      await ensureLoaded();
      requireSpace(sectionId);
      // Thread Organizer names its sections after its stage titles and would undo a direct rename, so a Space it
      // manages is renamed through it.
      if ((await organizer.get()).support === "supported") {
        try {
          await bb.sdk.plugins.callRpc({
            pluginId: ORGANIZER_PLUGIN_ID,
            method: ORGANIZER_RENAME_METHOD,
            input: { sectionId, name },
            outputSchema: organizerRenameSchema,
          });
        } catch (error) {
          bb.log.warn(`Thread Organizer did not rename Space ${sectionId}: ${errorMessage(error)}`);
          await bb.sdk.threadSections.update({ id: sectionId, name });
        }
      } else {
        await bb.sdk.threadSections.update({ id: sectionId, name });
      }
      await afterChange([sectionId]);
      return summaryOf(sectionId);
    },
    async stopSpace({ sectionId }) {
      await ensureLoaded();
      // Only the marker goes; the section and its threads stay where they are.
      if (store.has(sectionId)) {
        await store.remove([sectionId]);
        archivedLists.delete(sectionId);
        await afterChange([sectionId]);
      }
      return { ok: true as const };
    },
    async addThreads({ sectionId, threadIds }) {
      await ensureLoaded();
      requireSpace(sectionId);
      await ensureBaseline();
      const { added, skipped, left } = await moveIntoSpace(sectionId, threadIds);
      await afterChange([sectionId, ...left]);
      return { added, skipped };
    },
    async removeThreads({ threadIds }) {
      await ensureLoaded();
      await ensureBaseline();
      const live = new Map((await liveThreads.get()).map((row) => [row.id, row]));
      const left = new Set<string>();
      const outcomes = await mapLimit([...new Set(threadIds)], MOVE_CONCURRENCY, async (threadId) => {
        try {
          const { sectionId } = await placementOf(threadId, live);
          if (sectionId === null || !store.has(sectionId)) return null;
          await bb.sdk.threads.update({ threadId, sectionId: null });
          left.add(sectionId);
          return threadId;
        } catch (error) {
          bb.log.warn(`Spaces could not move ${threadId} out of its Space: ${errorMessage(error)}`);
          return null;
        }
      });
      await afterChange(left);
      return { removed: outcomes.filter((threadId): threadId is string => threadId !== null) };
    },
    async tell({ threadIds, message }) {
      // Sent as the user (no senderThreadId). A running thread gets it queued after its turn, never mid-turn.
      const results = await mapLimit([...new Set(threadIds)], SEND_CONCURRENCY, async (threadId): Promise<TellResult> => {
        try {
          const sent = await bb.sdk.threads.send({
            threadId,
            mode: "queue-if-active",
            input: [{ type: "text", text: message, mentions: [] }],
          });
          return { threadId, ok: true, queued: sent.delivery === "queued", error: null };
        } catch (error) {
          bb.log.warn(`Spaces could not tell ${threadId}: ${errorMessage(error)}`);
          return { threadId, ok: false, queued: false, error: errorMessage(error) };
        }
      });
      return { results };
    },
    async candidates({ sectionId, query }) {
      await ensureLoaded();
      requireSpace(sectionId);
      const [live, archived, sections, projects] = await Promise.all([
        liveThreads.get(),
        archivedMembers(sectionId),
        sectionList.get(),
        projectNamesOrEmpty(),
      ]);
      const names = new Map(sections.map((section) => [section.id, section.name]));
      return buildCandidates({
        sectionId,
        live,
        archivedMembers: archived,
        query,
        now: Date.now(),
        projectName: (projectId) => projects.get(projectId) ?? null,
        sectionName: (id) => (id === null ? null : names.get(id) ?? null),
      });
    },
    setSidebarVisibility({ sectionId, show }) {
      // One at a time: each call reads and writes the whole hiddenGroups list.
      const run = sidebarQueue.then(() => applySidebarVisibility(sectionId, show));
      sidebarQueue = run.catch(() => undefined);
      return run;
    },
  } satisfies PluginRpcHandlers<typeof spacesRpc>;

  // -------------------------------------------------------------------------
  // Agents and mentions

  function agentConfiguration(context: PluginAgentConfigurationContext): PluginAgentConfiguration {
    const configuration: PluginAgentConfiguration = { tools: [], skills: [SKILL_NAME] };
    if (!membersKnowSpace) return configuration;
    const sectionId = membership.get(context.thread.id);
    const name = sectionId === undefined ? undefined : sectionNames.get(sectionId);
    if (sectionId === undefined || name === undefined) return configuration;
    let members = 0;
    for (const memberSection of membership.values()) if (memberSection === sectionId) members += 1;
    return { ...configuration, instructions: memberInstruction({ sectionId, name }, members - 1) };
  }

  const mentionProvider: PluginMentionProviderRegistration = {
    id: MENTION_PROVIDER_ID,
    label: "Spaces",
    async search({ query }) {
      try {
        const wanted = query.trim().toLowerCase();
        return (await spaceSummaries())
          .filter((space) => space.name.toLowerCase().includes(wanted))
          .slice(0, 20)
          .map((space) => ({
            id: space.sectionId,
            title: space.name,
            subtitle: `Space · ${countText(space.memberCount)}`,
            icon: "Layers",
          }));
      } catch (error) {
        bb.log.warn(`Spaces mention search failed: ${errorMessage(error)}`);
        return [];
      }
    },
    async resolve(itemId) {
      await ensureLoaded();
      if (!store.has(itemId)) {
        return { context: `The user mentioned a Space (section ${itemId}) that is no longer a Space, so there is no roster to share.` };
      }
      return { context: mentionContext(await buildSnapshot(itemId)) };
    },
  };

  // -------------------------------------------------------------------------
  // Live updates

  const touchedThreads = new Set<string>();
  const touchedSections = new Set<string>();
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;

  /** Notes a thread that changed; one refresh per 500 ms covers every change in the burst. */
  function touch(thread: Pick<EventThread, "id" | "sectionId" | "parentThreadId">): void {
    if (disposed || !loaded || store.size() === 0) return;
    touchedThreads.add(thread.id);
    if (thread.parentThreadId !== null) touchedThreads.add(thread.parentThreadId);
    if (thread.sectionId !== null) touchedSections.add(thread.sectionId);
    if (refreshTimer !== null) return;
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      void flush();
    }, REFRESH_DEBOUNCE_MS);
  }

  async function flush(): Promise<void> {
    const threadIds = [...touchedThreads];
    const sectionIds = [...touchedSections];
    touchedThreads.clear();
    touchedSections.clear();
    const before = membership;
    try {
      const result = await reconcileNow();
      const live = new Map((await liveThreads.get()).map((row) => [row.id, row]));
      const affected = new Set(result.affected);
      for (const sectionId of sectionIds) if (store.has(sectionId)) affected.add(sectionId);
      for (const threadId of threadIds) {
        for (const sectionId of [before.get(threadId), membership.get(threadId)]) {
          if (sectionId !== undefined) affected.add(sectionId);
        }
        // A subthread's change shows in its parent's rollup.
        const parentId = live.get(threadId)?.parentThreadId;
        const parentSpace = parentId ? membership.get(parentId) ?? before.get(parentId) : undefined;
        if (parentSpace !== undefined) affected.add(parentSpace);
      }
      queueTabs(result.joined);
      publish(affected);
    } catch (error) {
      bb.log.warn(`Spaces live refresh failed: ${errorMessage(error)}`);
    }
  }

  function onIdle(thread: EventThread, lastAssistantText: string | null): void {
    // The idle event already carries the output the card shows, so the next snapshot needn't read it again.
    rememberExcerpt(thread.id, { key: excerptKey(thread), value: Promise.resolve(toExcerpt(lastAssistantText)) });
    touch(thread);
  }

  function onThreadChanged(event: { id?: string; changes: readonly string[] }): void {
    if (event.id === undefined || !event.changes.some((change) => RELEVANT_THREAD_CHANGES.has(change))) return;
    touch({ id: event.id, sectionId: null, parentThreadId: null });
  }

  /** Loads the registry and learns current members. Runs when the background service starts. */
  async function start(): Promise<void> {
    try {
      await ensureLoaded();
    } catch (error) {
      bb.log.warn(`Spaces could not load its Spaces: ${errorMessage(error)}`);
      return;
    }
    await ensureBaseline();
  }

  /** The periodic pass catches anything the events missed, such as threads dragged in while a refresh failed. */
  async function periodic(): Promise<void> {
    await ensureLoaded();
    if (store.size() === 0 && membership.size === 0) return;
    const result = await reconcileNow();
    queueTabs(result.joined);
    publish(result.affected);
  }

  async function dispose(): Promise<void> {
    disposed = true;
    if (refreshTimer !== null) clearTimeout(refreshTimer);
    refreshTimer = null;
    await Promise.allSettled([reconcileChain, tabWork, sidebarQueue]);
  }

  return {
    rpc,
    snapshot: buildSnapshot,
    listSpaces: spaceSummaries,
    /** Every section, fresh, for resolving `--from-section`. */
    async allSections(): Promise<SectionRow[]> {
      sectionList.clear();
      return sectionList.get();
    },
    agentConfiguration,
    mentionProvider,
    touch,
    onIdle,
    onThreadChanged,
    start,
    periodic,
    dispose,
  };
}

export type SpacesService = ReturnType<typeof createService>;
