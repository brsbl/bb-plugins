// Marks sidebar rows of threads with something in Waiting on you, with the glyph bb uses for a thread's own question.
import type { PluginContentScriptContext } from "@get-bb/plugin-sdk/app";

const STATUS = { icon: "CircleQuestion", label: "Waiting on you" } as const;
const REFRESH_MS = 5000;

async function waitingThreads(signal: AbortSignal): Promise<string[] | null> {
  try {
    const response = await fetch("/api/v1/plugins/inline-action-cards/rpc/waitingThreads", {
      method: "POST", headers: { "content-type": "application/json" }, body: "{}", signal,
    });
    const body = await response.json() as { ok?: boolean; result?: unknown };
    return response.ok && body.ok && Array.isArray(body.result) ? body.result.filter((id): id is string => typeof id === "string") : null;
  } catch { return null; }
}

export function markWaitingThreads({ signal, experimental_setThreadRowStatus: setStatus }: PluginContentScriptContext) {
  if (!setStatus) return;
  let marked = new Set<string>();
  const refresh = async () => {
    const ids = await waitingThreads(signal);
    if (!ids || signal.aborted) return;
    const next = new Set(ids);
    for (const id of marked) if (!next.has(id)) setStatus(id, null);
    for (const id of next) if (!marked.has(id)) setStatus(id, STATUS);
    marked = next;
  };
  void refresh();
  const timer = setInterval(() => void refresh(), REFRESH_MS);
  const onFocus = () => void refresh();
  window.addEventListener("focus", onFocus);
  signal.addEventListener("abort", () => { clearInterval(timer); window.removeEventListener("focus", onFocus); });
}
