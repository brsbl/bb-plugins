import { useMemo, useState } from "react";
import { definePluginApp, useBbNavigate, type PluginMessageDirectiveProps, type PluginNavPanelProps, type PluginThreadPanelProps } from "@get-bb/plugin-sdk/app";
import { DETAIL_ACTION, PAGE_PATH, type ConnectionStatus } from "./contract.js";
import { FORMATS, FORMAT_LABELS, itemId as itemIdSchema, todayInCalendar, type Item } from "./model.js";
import { parseDirective, parseSubPath, rangeDays, rangeLabel, rangeSubPath, shiftRange, switchView, syncLabel, todayRange, type CalendarRange } from "./calendar-layout.js";
import { CalendarBoard, requestNewItem } from "./components/board.js";
import { ConnectClientForm, ConnectFlow, ConnectSteps } from "./components/connect.js";
import { readableError, useCalendarData, useCalendarRpc, useNow, useStatus } from "./components/data.js";
import { ItemDetail } from "./components/detail.js";
import { ToastProvider } from "./components/toasts.js";
import "./app.css";

const connected = (status: ConnectionStatus | null) => !!status && status.state !== "needs_client" && status.state !== "not_connected";

function SyncText({ status, busy = false }: { status: ConnectionStatus; busy?: boolean }) {
  const now = useNow();
  const { text, tone } = busy ? { text: "Syncing…", tone: "busy" as const } : syncLabel(status, now);
  return <span className="cc-sync" role="status"><i className={`cc-dot cc-dot-${tone}`} aria-hidden="true" />{text}</span>;
}

/** Title-bar actions: sync state, Refresh, and New item. */
export function PageHeader() {
  const rpc = useCalendarRpc();
  const { status, setStatus } = useStatus();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!connected(status)) return null;
  return <div className="cc-root cc-header">
    {error ? <span className="cc-sync cc-error" role="alert">{error}</span> : <SyncText status={status!} busy={busy} />}
    <button type="button" className="cc-button" disabled={busy} onClick={async () => {
      setBusy(true); setError(null);
      try { setStatus(await rpc.call("sync", {})); } catch (err) { setError(readableError(err)); } finally { setBusy(false); }
    }}>Refresh</button>
    <button type="button" className="cc-button cc-primary" onClick={(event) => requestNewItem(event.currentTarget)}>New item</button>
  </div>;
}

export function CalendarPage({ subPath }: PluginNavPanelProps) {
  const navigate = useBbNavigate();
  const today = todayInCalendar();
  const range = useMemo(() => parseSubPath(subPath, today), [subPath, today]);
  const { status, error, reload, setStatus } = useStatus();
  const go = (next: CalendarRange) => navigate.toPluginPanel(PAGE_PATH, { subPath: rangeSubPath(next) });
  return <ToastProvider><div className="cc-root cc-page">
    {!status ? <div className="cc-page-empty" role="status">{error ? <><p className="cc-error">{error}</p><button type="button" className="cc-button" onClick={() => void reload()}>Retry</button></> : <p className="cc-muted">Loading…</p>}</div>
      : !connected(status) ? <ConnectSteps status={status} onConnected={setStatus} />
        : <ConnectedPage range={range} today={today} go={go} status={status} onStatus={setStatus} />}
  </div></ToastProvider>;
}

function ConnectedPage({ range, today, go, status, onStatus }: {
  range: CalendarRange; today: string; go: (range: CalendarRange) => void; status: ConnectionStatus; onStatus: (status: ConnectionStatus) => void;
}) {
  const { from, to } = rangeDays(range);
  const data = useCalendarData(from, to, true);
  const [selected, setSelected] = useState<string | null>(null);
  const live = data.view?.status ?? status;
  return <div className={selected ? "cc-page-layout cc-with-detail" : "cc-page-layout"}>
    <div className="cc-page-main">
      <div className="cc-toolbar">
        <button type="button" className="cc-button cc-icon-only" aria-label={range.view === "week" ? "Previous week" : "Previous month"} onClick={() => go(shiftRange(range, -1))}>‹</button>
        <button type="button" className="cc-button cc-icon-only" aria-label={range.view === "week" ? "Next week" : "Next month"} onClick={() => go(shiftRange(range, 1))}>›</button>
        <button type="button" className="cc-button" onClick={() => go(todayRange(range.view, today))}>Today</button>
        <h2 className="cc-range">{rangeLabel(range)}</h2>
        <span className="cc-seg cc-seg-buttons" role="group" aria-label="View">
          {(["month", "week"] as const).map((view) => <button key={view} type="button" aria-pressed={range.view === view} onClick={() => go(switchView(range, view, today))}>{view === "month" ? "Month" : "Week"}</button>)}
        </span>
      </div>
      <div className="cc-legend" aria-hidden="true">
        {FORMATS.map((format) => <span key={format}><i className={`cc-swatch cc-f-${format}`} />{FORMAT_LABELS[format]}</span>)}
        <span><i className="cc-swatch cc-swatch-dashed" />Waits on something</span>
      </div>
      <Banner status={live} onStatus={(next) => { onStatus(next); void data.reload(); }} />
      {data.actionError && <p className="cc-error cc-error-line" role="alert">{data.actionError} <button type="button" className="cc-link" onClick={data.dismissError}>Dismiss</button></p>}
      {data.loadError && !data.view && <p className="cc-error cc-error-line" role="alert">{data.loadError} <button type="button" className="cc-link" onClick={() => void data.reload()}>Retry</button></p>}
      {data.view ? <CalendarBoard range={range} mode="page" data={data} view={data.view} selectedId={selected} onOpen={(item: Item) => setSelected(item.id)} />
        : !data.loadError && <p className="cc-muted cc-page-empty" role="status">Loading…</p>}
    </div>
    {selected && <aside className="cc-page-detail" aria-label="Item detail">
      <ItemDetail itemId={selected} onClose={() => setSelected(null)} onItem={data.upsert} onDelete={(item) => { data.remove(item); setSelected(null); }} />
    </aside>}
  </div>;
}

function Banner({ status, onStatus }: { status: ConnectionStatus; onStatus: (status: ConnectionStatus) => void }) {
  const rpc = useCalendarRpc();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (status.state === "reconnect") return <div className="cc-banner" role="alert">
    <p><b>Reconnect Google Calendar.</b> {status.message ?? "Google stopped accepting bb's access."} Your edits are kept and sync after you reconnect.</p>
    <ConnectFlow label="Reconnect" askCalendarId={false} onConnected={onStatus} />
  </div>;
  if (status.state === "calendar_deleted") return <div className="cc-banner" role="alert">
    <p><b>The Content calendar was deleted in Google Calendar.</b> bb still has every item.</p>
    <div className="cc-row-actions"><button type="button" className="cc-button cc-primary" disabled={busy} onClick={async () => {
      setBusy(true); setError(null);
      try { onStatus(await rpc.call("restoreCalendar", {})); } catch (err) { setError(readableError(err)); } finally { setBusy(false); }
    }}>{busy ? "Restoring…" : "Recreate and restore"}</button></div>
    {error && <p className="cc-error">{error}</p>}
  </div>;
  return null;
}

/** `::content-calendar{view="week" start="2026-10-05"}` — a live calendar inside an agent message. */
export function CalendarDirective({ attributes }: PluginMessageDirectiveProps) {
  const parsed = parseDirective(attributes);
  if (!parsed.ok) return <div className="cc-root cc-embed cc-embed-invalid" role="alert">Content Calendar: {parsed.error}</div>;
  return <ToastProvider><InlineCalendar initial={parsed.range} /></ToastProvider>;
}

function InlineCalendar({ initial }: { initial: CalendarRange }) {
  const navigate = useBbNavigate();
  const [range, setRange] = useState(initial);
  const { status } = useStatus();
  const openPage = () => navigate.toPluginPanel(PAGE_PATH, { subPath: rangeSubPath(range) });
  const unit = range.view === "week" ? "week" : "month";
  return <section className={`cc-root cc-embed cc-embed-${range.view}`} aria-label={`Content calendar, ${rangeLabel(range)}`}>
    <div className="cc-embed-bar">
      <b>Content Calendar</b><span className="cc-muted">{rangeLabel(range)}</span><span className="cc-spacer" />
      <button type="button" className="cc-button cc-icon-only" aria-label={`Previous ${unit}`} onClick={() => setRange(shiftRange(range, -1))}>‹</button>
      <button type="button" className="cc-button cc-icon-only" aria-label={`Next ${unit}`} onClick={() => setRange(shiftRange(range, 1))}>›</button>
      <button type="button" className="cc-button" onClick={openPage}>Open calendar</button>
    </div>
    {!status ? <p className="cc-muted cc-embed-message" role="status">Loading…</p>
      : !connected(status) ? <p className="cc-muted cc-embed-message">Google Calendar isn't connected yet. Open the calendar to connect it.</p>
        : <InlineBoard range={range} onOpen={(item) => {
          if (!navigate.openThreadPanel({ actionId: DETAIL_ACTION, title: item.title, params: { itemId: item.id } })) openPage();
        }} />}
    <div className="cc-embed-foot"><span>Drag to move · click an item to edit it in the side panel</span><span className="cc-spacer" />{status && connected(status) && <SyncText status={status} />}</div>
  </section>;
}

function InlineBoard({ range, onOpen }: { range: CalendarRange; onOpen: (item: Item) => void }) {
  const { from, to } = rangeDays(range);
  const data = useCalendarData(from, to, false);
  return <>
    {data.actionError && <p className="cc-error cc-error-line" role="alert">{data.actionError} <button type="button" className="cc-link" onClick={data.dismissError}>Dismiss</button></p>}
    {data.view ? <CalendarBoard range={range} mode="inline" data={data} view={data.view} onOpen={onOpen} />
      : <p className={data.loadError ? "cc-error cc-embed-message" : "cc-muted cc-embed-message"} role="status">{data.loadError ?? "Loading…"}</p>}
  </>;
}

/** Item detail in the thread's side panel, opened from an inline calendar. */
export function ItemPanel({ params }: PluginThreadPanelProps) {
  const raw = params && typeof params === "object" && !Array.isArray(params) ? params.itemId : null;
  const parsed = itemIdSchema.safeParse(raw);
  if (!parsed.success) return <div className="cc-root cc-panel"><p className="cc-muted">Click an item in a Content Calendar in the chat to edit it here.</p></div>;
  return <ToastProvider><div className="cc-root cc-panel"><ItemDetail key={parsed.data} itemId={parsed.data} /></div></ToastProvider>;
}

export default definePluginApp((app) => {
  app.slots.navPanel({ id: "calendar", path: PAGE_PATH, title: "Content Calendar", icon: "Calendar", component: CalendarPage, headerContent: PageHeader });
  app.slots.messageDirective({ id: "content-calendar", component: CalendarDirective });
  app.slots.threadPanelAction({ id: DETAIL_ACTION, title: "Content item", icon: "Calendar", layout: "flush", component: ItemPanel });
  app.slots.pendingInteraction({ id: "connect-client", component: ConnectClientForm });
});
