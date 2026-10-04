import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  definePluginApp,
  experimental_useSidebarThreads as useSidebarThreads,
  useBbContext,
  useBbNavigate,
  useRealtime,
  useRealtimeConnectionState,
  type PluginThreadPanelProps,
} from "@get-bb/plugin-sdk/app";
import type { CoordinatorTemplate } from "./contracts.js";
import { Button } from "./components/ui/button.js";
import { SetupForm } from "./components/setup-form.js";
import { Tracker } from "./components/tracker.js";
import { errorMessage, useCoordinatorRpc, type CoordinatorStatus } from "./components/rpc.js";
import "./app.css";

/** Server publishes on this channel when coordinator state changes; polling covers missed signals. */
export const REALTIME_CHANNEL = "coordinator";
export const POLL_MS = 5_000;

function usePolling(refresh: () => void) {
  const latest = useRef(refresh);
  latest.current = refresh;
  useEffect(() => {
    const tick = () => { if (document.visibilityState !== "hidden") latest.current(); };
    const timer = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
}

function useReconnectRefresh(refresh: () => void) {
  const connection = useRealtimeConnectionState();
  const previous = useRef(connection);
  useEffect(() => {
    if (connection === "connected" && previous.current !== "connected") refresh();
    previous.current = connection;
  }, [connection, refresh]);
}

function CoordinatorPanel({ threadId }: PluginThreadPanelProps) {
  const call = useCoordinatorRpc();
  const { threads } = useSidebarThreads();
  const context = useBbContext();
  const thread = threads.find((candidate) => candidate.id === threadId);
  const [status, setStatus] = useState<CoordinatorStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    const current = ++generation.current;
    try {
      const next = await call("status", { threadId });
      if (current !== generation.current) return;
      setStatus(next);
      setError(null);
    } catch (reason) {
      if (current === generation.current) setError(errorMessage(reason));
    }
  }, [call, threadId]);

  useEffect(() => {
    setStatus(null);
    void refresh();
    void call("markOpened", { threadId }).catch(() => undefined);
  }, [call, threadId, refresh]);

  const refreshSoon = useCallback(() => { void refresh(); }, [refresh]);
  usePolling(refreshSoon);
  useReconnectRefresh(refreshSoon);
  useRealtime(REALTIME_CHANNEL, (payload) => {
    const target = (payload as { threadId?: unknown } | null)?.threadId;
    if (typeof target !== "string" || target === threadId) refreshSoon();
  });

  const turnOn = async (template: CoordinatorTemplate, autoApprove: boolean) => {
    await call("turnOn", { threadId, template });
    await call("setAutoApprove", { threadId, autoApprove });
    await refresh();
  };

  if (!status) {
    return (
      <div className="cm-panel">
        {error
          ? <p className="cm-error cm-pad" role="alert">{error} <Button variant="ghost" className="cm-small" onClick={refreshSoon}>Retry</Button></p>
          : <p className="cm-muted cm-pad">Loading…</p>}
      </div>
    );
  }

  const { state } = status;
  return (
    <div className="cm-panel">
      {error && <p className="cm-error cm-pad" role="alert">{error}</p>}
      {state ? (
        <Tracker
          threadId={threadId}
          threadName={thread?.displayTitle ?? state.template.name}
          status={{ ...status, state }}
          onChanged={refresh}
        />
      ) : (
        <SetupForm
          heading="Turn on Coordinator Mode"
          submitLabel="Turn on"
          busyLabel="Turning on…"
          projectId={thread?.projectId ?? context.projectId}
          onSubmit={turnOn}
        />
      )}
    </div>
  );
}

function CoordinatorSettings() {
  const call = useCoordinatorRpc();
  const navigate = useBbNavigate();
  const context = useBbContext();
  const { projects, status: projectsStatus } = useSidebarThreads();
  const pickerId = useId();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const fallback = projects.find((project) => project.id === context.projectId)
    ?? projects.find((project) => !project.isPersonal)
    ?? projects[0];
  const projectId = picked ?? fallback?.id ?? null;

  const create = async (template: CoordinatorTemplate, autoApprove: boolean) => {
    if (!projectId) return;
    const { threadId } = await call("createNew", { projectId, template });
    await call("setAutoApprove", { threadId, autoApprove });
    setOpen(false);
    navigate.toThread(threadId);
  };

  return (
    <div className="cm-settings">
      <p className="cm-muted">
        A coordinator is a thread that tracks your asks as items, starts sub-threads to do the work, and follows the rules you set.
        Turn it on for an existing thread from the thread’s Coordinator panel, or start a new coordinator here.
      </p>
      {open ? (
        <div className="cm-settings-form">
          <SetupForm
            heading="New coordinator"
            submitLabel="Create coordinator"
            busyLabel="Creating…"
            projectId={projectId}
            blockedReason={projectId ? null : projectsStatus === "loading" ? "Loading projects…" : "Add a project first."}
            onSubmit={create}
          >
            {projects.length > 1 && (
              <label className="cm-project" htmlFor={pickerId}>
                <span className="cm-muted">Project</span>
                <select id={pickerId} className="cm-select" value={projectId ?? ""} onChange={(event) => setPicked(event.target.value)}>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </label>
            )}
          </SetupForm>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      ) : (
        <Button onClick={() => setOpen(true)}>New coordinator</Button>
      )}
    </div>
  );
}

export default definePluginApp((app) => {
  app.slots.threadPanelAction({
    id: "coordinator",
    title: "Coordinator",
    component: CoordinatorPanel,
    layout: "flush",
  });
  app.slots.settingsSection({
    id: "coordinator-mode",
    title: "Coordinator Mode",
    description: "Turn a thread into a coordinator that tracks your asks and runs sub-threads.",
    component: CoordinatorSettings,
  });
});
