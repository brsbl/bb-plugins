import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { definePluginApp, experimental_FileLink as FileLink, useBbNavigate, useComposer, useRealtime, useRealtimeConnectionState, useRpc } from "@get-bb/plugin-sdk/app";
import { toast } from "sonner";
import { MAX_PINS, type RecentFile, type Reference, type rpcContract } from "./contract.js";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "./components/ui/context-menu.js";
import { PinPopover as Popover, PinPopoverContent as PopoverContent, PinPopoverTrigger as PopoverTrigger, PinPopoverAnchor } from "./pin-popover.js";
import { CustomizePins } from "./customize-pins.js";
import { FilePicker } from "./file-picker.js";
import { addToStrip, layoutPins, movePin, PIN_MAX_WIDTH_CLASS, PIN_SLOT_CLASS, removeFromStrip, useMeasurePinCapacity, type Arrangement } from "./pin-layout.js";
import { ReferenceIcon } from "./reference-icon.js";
import { cn } from "./lib/utils.js";

const linkClass = `group inline-flex h-7 min-w-0 ${PIN_MAX_WIDTH_CLASS} items-center gap-1.5 rounded px-1.5 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`;
const launchers = new Map<string, () => void>();
function plainClick(event: MouseEvent<HTMLAnchorElement>) {
  return !event.defaultPrevented && event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}
function PinContents({ pin }: { pin: Reference }) {
  return <><ReferenceIcon name={pin.name} moss={pin.moss} /><span className="truncate group-hover:underline">{pin.name}</span></>;
}

function PinStrip({ threadId }: { threadId: string }) {
  const rpc = useRpc<typeof rpcContract>();
  const navigate = useBbNavigate();
  const connection = useRealtimeConnectionState();
  const [pins, setPins] = useState<Reference[]>([]);
  const [more, setMore] = useState<string[]>([]);
  const [picker, setPicker] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [recent, setRecent] = useState<RecentFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const zone = useRef<HTMLSpanElement>(null);
  const slot = useRef<HTMLSpanElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const arranging = useRef({ pending: 0, queue: Promise.resolve() });
  const capacity = useMeasurePinCapacity(zone, slot);
  const generation = useRef(0);
  const alive = useRef(true);
  const recentGeneration = useRef(0);
  const report = useCallback((cause: unknown) => { if (alive.current) toast.error(cause instanceof Error ? cause.message : String(cause)); }, []);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    try {
      const result = await rpc.call("inspect", { threadId });
      if (alive.current && request === generation.current && arranging.current.pending === 0) { setPins(result.pins); setMore(result.more); }
    } catch (cause) { report(cause); }
  }, [rpc, threadId, report]);
  const refreshRecent = useCallback(async () => {
    const request = ++recentGeneration.current;
    try {
      const result = await rpc.call("recent", { threadId });
      if (alive.current && request === recentGeneration.current) setRecent(result.files);
    } catch { /* A disconnected host must not obstruct existing pins. */ }
  }, [rpc, threadId]);
  useEffect(() => { void refreshRecent(); }, [refreshRecent, connection, pins]);
  useRealtime("recent-changed", (payload) => {
    if (payload && typeof payload === "object" && "threadId" in payload && payload.threadId === threadId) void refreshRecent();
  });
  useEffect(() => {
    alive.current = true;
    const launch = () => { setMoreOpen(false); setCustomizing(false); setPicker(true); };
    launchers.set(threadId, launch);
    return () => { alive.current = false; generation.current++; recentGeneration.current++; if (launchers.get(threadId) === launch) launchers.delete(threadId); };
  }, [threadId]);
  useEffect(() => { void refresh(); }, [refresh, connection]);
  useEffect(() => {
    const check = () => { if (document.visibilityState === "visible") void refresh(); };
    const timer = setInterval(check, 30_000);
    window.addEventListener("focus", check);
    return () => { clearInterval(timer); window.removeEventListener("focus", check); };
  }, [refresh]);
  useRealtime("pins-changed", (payload) => {
    if (payload && typeof payload === "object" && "threadId" in payload && payload.threadId === threadId) void refresh();
  });
  useEffect(() => {
    if (customizing || !restoreFocus.current) return;
    restoreFocus.current = false;
    addButton.current?.focus();
  }, [customizing]);
  async function unpin(pin: Reference) {
    if (busy) return;
    setBusy(true);
    try {
      const { undoToken } = await rpc.call("remove", { threadId, pinId: pin.id });
      setMoreOpen(false);
      await refresh();
      if (undoToken) toast(`Unpinned ${pin.name}`, {
        duration: 10_000,
        action: { label: "Undo", onClick: () => {
          void rpc.call("undo", { threadId, undoToken }).then(() => refresh()).catch(report);
        } },
      });
    } catch (cause) { report(cause); }
    finally { if (alive.current) setBusy(false); }
  }
  function open(pin: Reference, event: MouseEvent<HTMLAnchorElement>) {
    if (!plainClick(event)) return;
    if (pin.status !== "available") { event.preventDefault(); report(new Error(`${pin.hostName} is unavailable. Reconnect the machine and try again.`)); return; }
    if (!/\.(?:md|markdown)$/i.test(pin.path)) return;
    event.preventDefault();
    void rpc.call("openMossNote", { threadId, pinId: pin.id }).then(({ opened }) => {
      if (!opened && alive.current) navigate.experimental_openFilePreview({ target: { kind: "host", hostId: pin.hostId, path: pin.path }, location: null });
    }).catch((error) => { report(error); void refresh(); });
  }
  const layout = layoutPins(pins, more, capacity);
  const current: Arrangement = { order: pins.map((pin) => pin.id), more };
  function arrange(next: Arrangement | null) {
    if (!next) return;
    // Apply locally first, like bb's footer preferences; saves run in order and
    // refreshes wait until the last one lands so the strip never steps back.
    generation.current++;
    setPins(next.order.map((id) => pins.find((pin) => pin.id === id)!));
    setMore(next.more);
    const saves = arranging.current;
    saves.pending++;
    saves.queue = saves.queue.then(() => rpc.call("arrange", { threadId, ...next })).then(() => undefined, report)
      .finally(() => { if (--saves.pending === 0) void refresh(); });
  }
  async function pinRecent(file: RecentFile) {
    if (busy) return;
    setBusy(true);
    try { await rpc.call("pin", { threadId, hostId: file.hostId, path: file.path }); await refresh(); }
    catch (error) { report(error); }
    finally { if (alive.current) setBusy(false); }
  }
  function customize() { setPicker(false); setMoreOpen(false); setCustomizing(true); }
  function doneCustomizing() { restoreFocus.current = true; setCustomizing(false); }
  function reference(pin: Reference, inList = false) {
    const title = `${pin.path}\n${pin.hostName}${pin.moss ? " · Moss note" : ""}${pin.status === "missing" ? " · File missing" : pin.status === "unavailable" ? " · Unavailable" : ""}`;
    if (pin.status === "missing") return <span key={pin.id} className={`relative inline-flex min-w-0 ${inList ? "w-full" : PIN_MAX_WIDTH_CLASS}`} title={title}>
      <span aria-label={`${pin.name} (missing)`} className={cn(linkClass, "cursor-default rounded-none pr-4 text-destructive/55 hover:text-destructive/55", inList && "w-full max-w-none")}>
        <ReferenceIcon name={pin.name} moss={pin.moss} /><span className="truncate">{pin.name}</span><span className="sr-only"> (missing)</span>
      </span>
      <button type="button" disabled={busy} aria-label={`Remove missing ${pin.name}`} title={`Remove missing ${pin.name}`} onClick={() => void unpin(pin)}
        className="absolute right-0 -top-1 flex size-5 items-center justify-center rounded-sm text-xs text-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">×</button>
    </span>;
    return <ContextMenu key={pin.id}>
      <ContextMenuTrigger asChild>
        <FileLink target={{ kind: "host", hostId: pin.hostId, path: pin.path }} onClick={(event) => open(pin, event)} title={title}
          aria-label={`Open ${pin.name}`} className={`${linkClass} ${inList ? "w-full max-w-none" : ""} ${pin.status !== "available" ? "opacity-60" : ""}`}><PinContents pin={pin} /></FileLink>
      </ContextMenuTrigger>
      <ContextMenuContent style={{ animation: "none", transition: "none" }}>
        <ContextMenuItem disabled={busy} onSelect={() => void unpin(pin)}>Unpin</ContextMenuItem>
        <ContextMenuItem onSelect={customize}>Customize pins</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>;
  }
  return <div className="relative min-w-0">
    {customizing ? <CustomizePins layout={layout} capacity={capacity} busy={busy} onDone={doneCustomizing}
      onRemoveFromStrip={(id) => arrange(removeFromStrip(layout, current, id))}
      onAddToStrip={(id) => arrange(addToStrip(layout, current, id))}
      onMove={(id, overId) => arrange(movePin(layout, current, id, overId))}
      onUnpin={(pin) => void unpin(pin)} /> :
      <Popover open={picker} onOpenChange={setPicker}>
        {pins.length > 0 ? <section aria-label="Pinned files" className="min-w-0 px-1 py-1">
          <div className="flex min-w-0 items-center gap-1">
            <span className="mr-1 shrink-0 text-xs text-muted-foreground">Pinned</span>
            {layout.strip.map((pin) => reference(pin))}
            {layout.more.length > 0 && <Popover open={moreOpen} onOpenChange={setMoreOpen}>
              <PopoverTrigger asChild><button type="button" aria-label={`${layout.more.length} more pinned files`} className={`${linkClass} shrink-0 tabular-nums`}>+{layout.more.length}</button></PopoverTrigger>
              <PopoverContent aria-label="More pinned files" className="w-72 p-1">
                <div className="max-h-64 space-y-0.5 overflow-y-auto">{layout.more.map((pin) => reference(pin, true))}</div>
                <div role="separator" className="-mx-1 my-1 h-px bg-muted" />
                <button type="button" className={cn(linkClass, "w-full max-w-none")} onClick={customize}>Customize pins</button>
              </PopoverContent>
            </Popover>}
            <PopoverTrigger asChild><button ref={addButton} type="button" className={`${linkClass} shrink-0 px-1`} title="Pin to thread" aria-label="Pin to thread">+</button></PopoverTrigger>
          </div>
        </section> : recent.length > 0 ? <section aria-label="Suggested pins" className="flex min-w-0 items-center gap-1 px-1 py-1">
          <span className="shrink-0 text-xs text-muted-foreground">Recent</span>
          <div className="flex min-w-0 flex-1 overflow-hidden">{recent.slice(0, 3).map((file) => <button key={file.path} type="button" disabled={busy} aria-label={`Pin ${file.name}`} title={`Pin ${file.path}`} className={linkClass} onClick={() => void pinRecent(file)}><ReferenceIcon name={file.name} moss={file.moss} /><span className="truncate">{file.name}</span></button>)}</div>
          <PopoverTrigger asChild><button type="button" className={`${linkClass} shrink-0`} aria-label="Pin to thread" title="Pin to thread">+</button></PopoverTrigger>
        </section> : <PinPopoverAnchor asChild><span className="block h-0 w-0" /></PinPopoverAnchor>}
        <PopoverContent aria-label="Pin to thread" align={pins.length > 0 || recent.length > 0 ? "end" : "start"} onCloseAutoFocus={(event) => { if (pins.length === 0 && recent.length === 0) event.preventDefault(); }}>
          <FilePicker threadId={threadId} recent={recent} hasPins={pins.length > 0} onClose={() => setPicker(false)} onPinned={refresh} onCustomize={customize} />
        </PopoverContent>
      </Popover>}
    {/* Mirrors the strip row so capacity is the same in the strip and in Customize pins. */}
    <div aria-hidden="true" className="pointer-events-none invisible absolute inset-x-0 top-0 flex h-0 items-center gap-1 overflow-hidden px-1">
      <span className="mr-1 shrink-0 text-xs">Pinned</span>
      <span ref={zone} className="min-w-0 flex-1" />
      <span className={`${linkClass} shrink-0 tabular-nums`}>+{MAX_PINS}</span>
      <span className={`${linkClass} shrink-0 px-1`}>+</span>
    </div>
    <span ref={slot} aria-hidden="true" className={cn(PIN_SLOT_CLASS, "pointer-events-none invisible absolute left-0 top-0 h-0")} />
  </div>;
}
function PinsBanner() {
  const composer = useComposer();
  return composer.scope.kind === "thread" ? <PinStrip key={composer.scope.threadId} threadId={composer.scope.threadId} /> : null;
}
export default definePluginApp((app) => {
  app.composer.customize({
    id: "file-pins", scopes: ["thread"], banners: [{ id: "pins", chrome: "bare", component: PinsBanner }],
    plusMenu: [{ id: "pin-file", label: "Pin to thread", icon: "Pin", run: ({ composer }) => { if (composer.scope.kind === "thread") launchers.get(composer.scope.threadId)?.(); } }],
  });
});
