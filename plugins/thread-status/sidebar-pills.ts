import type { PluginContentScriptContext } from "@get-bb/plugin-sdk/app";

import { statusSchema, type ThreadStatus } from "./status.js";

const SIDEBAR_SELECTOR = '[data-sidebar="sidebar"]';
const ROW_LINK_SELECTOR = "a[data-sidebar-thread-id]";
const TITLE_SELECTOR = ".bb-thread-title";
const LABEL_ATTRIBUTE = "data-thread-status";
const TONE_ATTRIBUTE = "data-thread-status-tone";
const REFRESH_MS = 4000;

export type StatusMap = ReadonlyMap<string, ThreadStatus>;

export function parseStatuses(body: unknown): StatusMap | null {
  if (typeof body !== "object" || body === null) return null;
  const envelope = body as { ok?: unknown; result?: { statuses?: unknown } };
  if (envelope.ok !== true || typeof envelope.result?.statuses !== "object" || envelope.result.statuses === null) return null;
  const statuses = new Map<string, ThreadStatus>();
  for (const [threadId, value] of Object.entries(envelope.result.statuses)) {
    const parsed = statusSchema.safeParse(value);
    if (parsed.success) statuses.set(threadId, parsed.data);
  }
  return statuses;
}

async function fetchStatuses(pluginId: string, signal: AbortSignal): Promise<StatusMap | null> {
  try {
    const response = await fetch(`/api/v1/plugins/${encodeURIComponent(pluginId)}/rpc/list`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "null",
      signal,
    });
    return parseStatuses(await response.json());
  } catch {
    return null;
  }
}

function setAttribute(element: Element, name: string, value: string | null): void {
  if (value === null) {
    if (element.hasAttribute(name)) element.removeAttribute(name);
  } else if (element.getAttribute(name) !== value) {
    element.setAttribute(name, value);
  }
}

export function applyPills(root: ParentNode, statuses: StatusMap): void {
  for (const sidebar of root.querySelectorAll(SIDEBAR_SELECTOR)) {
    for (const link of sidebar.querySelectorAll(ROW_LINK_SELECTOR)) {
      const title = link.parentElement?.querySelector(TITLE_SELECTOR);
      if (!title) continue;
      const status = statuses.get(link.getAttribute("data-sidebar-thread-id") ?? "");
      setAttribute(title, LABEL_ATTRIBUTE, status?.label ?? null);
      setAttribute(title, TONE_ATTRIBUTE, status?.tone ?? null);
    }
  }
}

export function removePills(root: ParentNode): void {
  for (const title of root.querySelectorAll(`[${LABEL_ATTRIBUTE}]`)) {
    title.removeAttribute(LABEL_ATTRIBUTE);
    title.removeAttribute(TONE_ATTRIBUTE);
  }
}

export function mountSidebarPills({ pluginId, signal }: PluginContentScriptContext): () => void {
  const doc = document;
  let statuses: StatusMap = new Map();
  let frame: number | null = null;

  const schedule = () => {
    if (frame !== null || signal.aborted) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      applyPills(doc, statuses);
    });
  };

  const refresh = async () => {
    const next = await fetchStatuses(pluginId, signal);
    if (next === null || signal.aborted) return;
    statuses = next;
    schedule();
  };

  const observer = new MutationObserver(schedule);
  observer.observe(doc.body, { childList: true, subtree: true });
  const timer = setInterval(() => void refresh(), REFRESH_MS);
  const onFocus = () => void refresh();
  window.addEventListener("focus", onFocus);
  void refresh();

  return () => {
    observer.disconnect();
    clearInterval(timer);
    window.removeEventListener("focus", onFocus);
    if (frame !== null) cancelAnimationFrame(frame);
    removePills(doc);
  };
}
