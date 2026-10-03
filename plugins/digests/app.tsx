import { useCallback, useEffect, useRef, useState } from "react";
import {
  definePluginApp,
  Markdown,
  useBbNavigate,
  useComposer,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
  type PluginMessageDirectiveProps,
} from "@get-bb/plugin-sdk/app";

import type { rpcContract } from "./contracts.js";
import type { Connection, DigestDefinition, Issue } from "./model.js";
import "./app.css";

type Overview = {
  definitions: DigestDefinition[];
  connections: Connection[];
  actionCardsAvailable: boolean;
  organizerReady: boolean;
};

function useReconnectRefresh(refresh: () => void) {
  const connection = useRealtimeConnectionState();
  const previous = useRef(connection);
  useEffect(() => {
    if (connection === "connected" && previous.current !== "connected") refresh();
    previous.current = connection;
  }, [connection, refresh]);
}

function DigestIssue({ attributes, message }: PluginMessageDirectiveProps) {
  const rpc = useRpc<typeof rpcContract>();
  const id = attributes.id?.trim();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loadError, setLoadError] = useState(false);
  const generation = useRef(0);

  const load = useCallback(async () => {
    if (!id) return;
    const request = ++generation.current;
    try {
      const next = await rpc.call("getIssue", { threadId: message.threadId, id });
      if (generation.current !== request) return;
      setIssue(next);
      setLoadError(false);
    } catch {
      if (generation.current === request) setLoadError(true);
    }
  }, [id, message.threadId, rpc]);

  useEffect(() => {
    setIssue(null);
    setLoadError(false);
    void load();
    return () => { generation.current += 1; };
  }, [load]);
  useRealtime("issues", () => { void load(); });
  useReconnectRefresh(load);

  if (!id) {
    return <div className="digest-issue" role="alert">This digest is missing its issue reference. Ask the publishing thread to publish it again.</div>;
  }
  if (!issue) {
    return (
      <div className="digest-issue">
        {loadError ? <>
          <p role="alert">This issue couldn’t be loaded. Check that bb is running and try again.</p>
          <button type="button" className="digest-button" onClick={() => { void load(); }}>Retry</button>
        </> : <p className="digest-muted" role="status">Loading digest…</p>}
      </div>
    );
  }
  return <IssueSummary key={issue.id} issue={issue} threadId={message.threadId} loadError={loadError} refresh={load} />;
}

function RecoveryBanner() {
  const rpc = useRpc<typeof rpcContract>();
  const composer = useComposer();
  const threadId = composer.scope.kind === "thread" ? composer.scope.threadId : null;
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loadError, setLoadError] = useState(false);
  const generation = useRef(0);
  const load = useCallback(async () => {
    if (!threadId) return;
    const request = ++generation.current;
    try {
      const result = await rpc.call("recoveryIssue", { threadId });
      if (generation.current !== request) return;
      setIssue(result);
      setLoadError(false);
    } catch {
      if (generation.current === request) setLoadError(true);
    }
  }, [rpc, threadId]);
  useEffect(() => {
    setIssue(null);
    setLoadError(false);
    void load();
    return () => { generation.current += 1; };
  }, [load]);
  useRealtime("issues", () => { void load(); });
  useReconnectRefresh(load);
  if (!threadId || !issue || issue.threadId !== threadId) return null;
  return <IssueSummary key={issue.id} issue={issue} threadId={threadId} loadError={loadError} refresh={load} />;
}

function IssueSummary({ issue, threadId, loadError, refresh }: {
  issue: Issue;
  threadId: string;
  loadError: boolean;
  refresh: () => Promise<void>;
}) {
  const rpc = useRpc<typeof rpcContract>();
  const navigate = useBbNavigate();
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<"retry" | "reconnect" | null>(null);
  const recover = async (action: "retry" | "reconnect") => {
    if (pending) return;
    setPending(action);
    setActionError(null);
    setNotice(null);
    try {
      const input = { threadId, id: issue.id };
      if (action === "reconnect") {
        const result = await rpc.call("reconnect", input);
        setNotice(result.message);
      } else {
        const result = await rpc.call("retry", input);
        navigate.toThread(result.threadId);
        setNotice("Retrying this issue.");
      }
    } catch (error) {
      setActionError(error instanceof Error && error.message.trim() ? error.message : action === "reconnect"
        ? "Couldn’t open your connection. Check that bb is running, then try Reconnect again."
        : "Couldn’t retry this digest. Check that bb is running, then try again.");
    } finally {
      setPending(null);
    }
  };

  return (
    <section className="digest-issue" aria-label="Digest summary" data-state={issue.state}>
      <header className="digest-issue-header">
        <span className="digest-eyebrow">{issue.state === "failed" ? "Needs attention" : issue.state === "collecting" ? "Preparing digest" : "Digest"}</span>
        {issue.publishedAt !== null && <time className="digest-muted" dateTime={new Date(issue.publishedAt).toISOString()}>
          {new Date(issue.publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </time>}
      </header>
      <h3 className="digest-headline">{issue.headline}</h3>
      {issue.state === "collecting" && <p className="digest-muted" role="status">Gathering your updates. This summary will update here.</p>}
      {issue.metrics.length > 0 && <dl className="digest-metrics">
        {issue.metrics.slice(0, 6).map((metric, index) => <div key={`${metric.label}-${index}`}>
          <dt>{metric.label}</dt>
          <dd>{metric.value}</dd>
        </div>)}
      </dl>}
      {issue.state === "failed" && <div className="digest-recovery">
        {issue.recovery === "upgrade" && <p>Update bb on your desktop and connected server to 0.45.0 or later, then retry. Your existing browser sign-ins can be reused after the update.</p>}
        <div className="digest-controls">
          {issue.recovery === "reconnect" && <button type="button" className="digest-button digest-primary" disabled={pending !== null} onClick={() => { void recover("reconnect"); }}>
            {pending === "reconnect" ? "Opening…" : "Reconnect"}
          </button>}
          <button type="button" className={`digest-button ${issue.recovery === "reconnect" ? "" : "digest-primary"}`} disabled={pending !== null} onClick={() => { void recover("retry"); }}>
            {pending === "retry" ? "Retrying…" : "Retry"}
          </button>
        </div>
      </div>}
      {actionError && <p className="digest-error" role="alert">{actionError}</p>}
      {notice && <p className="digest-muted" role="status">{notice}</p>}
      {loadError && <div className="digest-refresh-error" role="alert">
        <span>Couldn’t refresh this issue. The last saved summary is shown.</span>
        <button type="button" className="digest-button" onClick={() => { void refresh(); }}>Retry</button>
      </div>}
      {issue.details.trim() && <details className="digest-details" open={issue.state === "failed"}>
        <summary>Details</summary>
        <Markdown content={issue.details} />
      </details>}
    </section>
  );
}

function scheduleLabel(schedule: DigestDefinition["schedule"]): string {
  if (!schedule) return "Published by another thread";
  const [minute, hour, day, month, weekday, extra] = schedule.cron.trim().split(/\s+/u);
  const zone = schedule.timezone === "America/Los_Angeles" ? "PT" : schedule.timezone;
  if (!extra && /^\d+$/u.test(minute ?? "") && /^\d+$/u.test(hour ?? "") && day === "*" && month === "*") {
    const days: Record<string, string> = { "*": "Daily", "1-5": "Weekdays", "0": "Sundays", "1": "Mondays", "2": "Tuesdays", "3": "Wednesdays", "4": "Thursdays", "5": "Fridays", "6": "Saturdays", "7": "Sundays" };
    if (weekday && days[weekday] && Number(hour) < 24 && Number(minute) < 60) {
      const hourNumber = Number(hour);
      const minutes = Number(minute) === 0 ? "" : `:${minute!.padStart(2, "0")}`;
      return `${days[weekday]} · ${hourNumber % 12 || 12}${minutes}${hourNumber < 12 ? "am" : "pm"} ${zone}`;
    }
  }
  return `${schedule.cron} · ${zone}`;
}

const connectionLabels: Record<Connection["status"], string> = {
  "unknown": "Not checked yet",
  "signed-in": "Signed in",
  "signed-out": "Reconnect needed",
  "expired": "Sign-in expired",
  "unavailable": "Browser unavailable",
  "upgrade-required": "bb update needed",
};

function DigestsSettings() {
  const rpc = useRpc<typeof rpcContract>();
  const navigate = useBbNavigate();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const generation = useRef(0);
  const load = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true);
    try {
      const result = await rpc.call("overview", {});
      if (generation.current !== request) return;
      setOverview(result);
      setError(null);
    } catch {
      if (generation.current === request) setError("Couldn’t load Digests settings. Check that bb is running and try again.");
    } finally {
      if (generation.current === request) setLoading(false);
    }
  }, [rpc]);
  useEffect(() => {
    void load();
    return () => { generation.current += 1; };
  }, [load]);
  useRealtime("issues", () => { void load(); });
  useReconnectRefresh(load);

  const update = async (definition: DigestDefinition, action: "toggle" | "run") => {
    if (pending) return;
    setPending(definition.id);
    setError(null);
    try {
      if (action === "toggle") {
        const updated = await rpc.call("setEnabled", { id: definition.id, enabled: !definition.enabled });
        setOverview((current) => current && { ...current, definitions: current.definitions.map((item) => item.id === updated.id ? updated : item) });
      } else {
        const result = await rpc.call("run", { id: definition.id });
        if (result.threadId) navigate.toThread(result.threadId);
        else setError("This digest didn’t return an issue. Refresh to check its status before trying again.");
      }
    } catch (error) {
      setError(error instanceof Error && error.message.trim() ? error.message : action === "toggle"
        ? `Couldn’t ${definition.enabled ? "pause" : "enable"} ${definition.name}. Try again.`
        : `Couldn’t start ${definition.name}. Check that bb is running and try again.`);
    } finally {
      setPending(null);
    }
  };

  return (
    <section className="digest-settings" aria-label="Digests">
      <header className="digest-settings-header">
        <div><h3>Digests</h3><p className="digest-muted">Briefings arrive as threads. Read issues archive after 7 days.</p></div>
        <button type="button" className="digest-button digest-icon-button" aria-label="Refresh Digests" title="Refresh Digests" disabled={loading} onClick={() => { void load(); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 7a7 7 0 0 1 11.5-1.2L20 9M4 15l2.4 3.2A7 7 0 0 0 17.9 17"/></svg>
        </button>
      </header>
      {error && <div className="digest-refresh-error" role="alert"><span>{error}</span><button type="button" className="digest-button" disabled={loading} onClick={() => { void load(); }}>Retry</button></div>}
      {!overview && !error && <p className="digest-muted" role="status">Loading Digests…</p>}
      {overview && <>
        {!overview.organizerReady && <p className="digest-error" role="status">The Digests section needs setup in Thread Organizer. Ask an agent to set up Digests before enabling schedules.</p>}
        {overview.definitions.length === 0 && <p className="digest-muted">No digests yet. Ask an agent to set up your first briefing.</p>}
        <ul className="digest-definition-list">
          {overview.definitions.map((definition) => <li className="digest-definition" key={definition.id}>
            <div className="digest-definition-copy">
              <h4>{definition.name}</h4>
              <p className="digest-muted" title={definition.schedule?.cron}>{scheduleLabel(definition.schedule)}{definition.schedule && !definition.enabled ? " · Paused" : ""}</p>
            </div>
            <div className="digest-controls">
              {definition.schedule && <button type="button" className="digest-button" aria-label={`${definition.enabled ? "Pause" : "Enable"} ${definition.name}`} disabled={pending !== null || (!definition.enabled && !overview.organizerReady)} onClick={() => { void update(definition, "toggle"); }}>
                {pending === definition.id ? "Working…" : definition.enabled ? "Pause" : "Enable"}
              </button>}
              {definition.schedule && <button type="button" className="digest-button" aria-label={`Run ${definition.name} now`} disabled={pending !== null || !overview.organizerReady} onClick={() => { void update(definition, "run"); }}>Run now</button>}
            </div>
          </li>)}
        </ul>
        <h4 className="digest-connections-title">Connections</h4>
        <p className="digest-muted">Uses your existing bb Browser sign-ins. Each run checks access.</p>
        {overview.connections.length === 0 ? <p className="digest-muted">No connections configured.</p> : <ul className="digest-connection-list">
          {overview.connections.map((connection) => <li className="digest-connection" key={connection.id}>
            <div><span className="digest-connection-name">{connection.name}</span>{connection.detail && <p className="digest-muted">{connection.detail}</p>}</div>
            <span className="digest-connection-status" data-status={connection.status}>{connectionLabels[connection.status]}</span>
          </li>)}
        </ul>}
      </>}
    </section>
  );
}

export default definePluginApp((app) => {
  app.slots.messageDirective({ id: "digest-issue", component: DigestIssue });
  app.slots.settingsSection({ id: "digests", component: DigestsSettings });
  app.composer.customize({
    id: "digest-recovery",
    banners: [{ id: "failed-issue", chrome: "bare", component: RecoveryBanner }],
  });
});
