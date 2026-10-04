import type { WorkflowConfig } from "./core.js";

/** bb's built-in thread list owns the sidebar's section order. */
const THREAD_LIST_PLUGIN_ID = "thread-list";
const SECTION_ORDER_KEY = "manualSectionOrder";

function configuredSectionIds(config: WorkflowConfig): string[] {
  return config.stages.flatMap((stage) =>
    stage.sectionId === null ? [] : [stage.sectionId],
  );
}

function sameOrder(left: readonly string[], right: readonly string[]): boolean {
  return (
    left.length === right.length &&
    left.every((entry, index) => entry === right[index])
  );
}

/**
 * The sidebar's manual order with the workflow sections in configured order. Sections
 * the sidebar already orders keep the slots they occupy, so unrelated sections do not
 * move; a workflow section it has never ordered is inserted right after its
 * configured predecessor. Null when nothing would change.
 */
export function orderWithConfiguredSections(
  current: readonly string[],
  config: WorkflowConfig,
): string[] | null {
  const configured = configuredSectionIds(config).map(
    (sectionId) => `section:${sectionId}`,
  );
  if (configured.length < 2) return null;
  const configuredSet = new Set(configured);
  const positions = current.flatMap((entry, index) =>
    configuredSet.has(entry) ? [index] : [],
  );
  const present = new Set(current.filter((entry) => configuredSet.has(entry)));
  const next = [...current];
  const placed = configured.filter((entry) => present.has(entry));
  positions.forEach((position, index) => {
    next[position] = placed[index]!;
  });
  for (const [index, entry] of configured.entries()) {
    if (present.has(entry)) continue;
    const predecessor = configured
      .slice(0, index)
      .reverse()
      .find((candidate) => present.has(candidate));
    let insertAt: number;
    if (predecessor !== undefined) {
      insertAt = next.indexOf(predecessor) + 1;
    } else {
      const successor = configured
        .slice(index + 1)
        .find((candidate) => present.has(candidate));
      insertAt =
        successor !== undefined
          ? next.indexOf(successor)
          : next[0] === "pinned"
            ? 1
            : 0;
    }
    next.splice(insertAt, 0, entry);
    present.add(entry);
  }
  return sameOrder(next, current) ? null : next;
}


async function callThreadList(
  fetchImpl: typeof fetch,
  method: "listPreferences" | "setPreference",
  input: unknown,
): Promise<unknown> {
  const response = await fetchImpl(
    `/api/v1/plugins/${THREAD_LIST_PLUGIN_ID}/rpc/${method}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (!response.ok) {
    throw new Error(`Sidebar order request failed (${response.status})`);
  }
  const payload: unknown = await response.json();
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("ok" in payload) ||
    payload.ok !== true ||
    !("result" in payload)
  ) {
    throw new Error("The thread list returned an invalid response");
  }
  return payload.result;
}

/**
 * Moves the sidebar's workflow sections into the configured order. Sections
 * outside the workflow keep their slots. Resolves without writing when the
 * sidebar already matches.
 */
export async function syncSidebarOrder(
  config: WorkflowConfig,
  fetchImpl: typeof fetch = (...args) => fetch(...args),
): Promise<void> {
  const listed = await callThreadList(fetchImpl, "listPreferences", null);
  const preferences =
    typeof listed === "object" && listed !== null
      ? (listed as { preferences?: unknown }).preferences
      : undefined;
  const current =
    typeof preferences === "object" && preferences !== null
      ? (preferences as Record<string, unknown>)[SECTION_ORDER_KEY]
      : undefined;
  if (
    !Array.isArray(current) ||
    !current.every((entry) => typeof entry === "string")
  ) {
    throw new Error("The thread list returned an invalid section order");
  }
  const next = orderWithConfiguredSections(current, config);
  if (next === null) return;
  await callThreadList(fetchImpl, "setPreference", {
    key: SECTION_ORDER_KEY,
    value: next,
  });
}
