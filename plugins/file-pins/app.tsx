import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { definePluginApp, experimental_FileLink as FileLink, experimental_Icon as Icon, useBbNavigate, useComposer, useRealtime, useRealtimeConnectionState, useRpc } from "@get-bb/plugin-sdk/app";
import { toast } from "sonner";
import type { Reference, rpcContract } from "./contract.js";
import { Button } from "./components/ui/button.js";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "./components/ui/context-menu.js";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./components/ui/dialog.js";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover.js";
import { FilePicker } from "./file-picker.js";
import { ReferenceIcon } from "./reference-icon.js";

const linkClass = "group inline-flex h-7 min-w-0 max-w-48 items-center gap-1.5 rounded px-1.5 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const launchers = new Map<string, () => void>();
function plainClick(event: MouseEvent<HTMLAnchorElement>) {
  return !event.defaultPrevented && event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}
function PinContents({ pin }: { pin: Reference }) {
  return <><ReferenceIcon name={pin.name} moss={pin.moss} status={pin.status} /><span className="truncate group-hover:underline">{pin.name}</span></>;
}

function PinStrip({ threadId }: { threadId: string }) {
  const rpc = useRpc<typeof rpcContract>();
  const navigate = useBbNavigate();
  const connection = useRealtimeConnectionState();
  const [pins, setPins] = useState<Reference[]>([]);
  const [picker, setPicker] = useState<{ replacing?: Reference } | null>(null);
  const [missing, setMissing] = useState<Reference | null>(null);
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const row = useRef<HTMLDivElement>(null);
  const measure = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const moreMeasure = useRef<HTMLSpanElement>(null);
  const generation = useRef(0);
  const alive = useRef(true);
  const report = useCallback((cause: unknown) => { if (alive.current) toast.error(cause instanceof Error ? cause.message : String(cause)); }, []);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    try {
      const result = await rpc.call("inspect", { threadId });
      if (alive.current && request === generation.current) setPins(result.pins);
    } catch (cause) { report(cause); }
  }, [rpc, threadId, report]);
  useEffect(() => {
    alive.current = true;
    const launch = () => { setMoreOpen(false); setPicker({}); };
    launchers.set(threadId, launch);
    return () => { alive.current = false; generation.current++; if (launchers.get(threadId) === launch) launchers.delete(threadId); };
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
  useLayoutEffect(() => {
    if (!row.current || !measure.current) return;
    const fit = () => {
      const widths = Array.from(measure.current!.children, (child) => child.getBoundingClientRect().width);
      const space = row.current!.clientWidth - (label.current?.offsetWidth ?? 0) - (addButton.current?.offsetWidth ?? 0) - 12;
      const total = widths.reduce((sum, width) => sum + width + 4, 0);
      if (total <= space) { setVisible(widths.length); return; }
      const available = space - (moreMeasure.current?.offsetWidth ?? 36) - 4;
      let used = 0, count = 0;
      for (const width of widths) { if (used + width + 4 > available) break; used += width + 4; count++; }
      setVisible(count);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(row.current); observer.observe(measure.current);
    return () => observer.disconnect();
  }, [pins]);
  async function unpin(pin: Reference) {
    if (busy) return;
    setBusy(true);
    try {
      const { undoToken } = await rpc.call("remove", { threadId, pinId: pin.id });
      setMissing(null); setMoreOpen(false);
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
    if (pin.status !== "available") { event.preventDefault(); setMoreOpen(false); setMissing(pin); return; }
    if (!/\.(?:md|markdown)$/i.test(pin.path)) return;
    event.preventDefault();
    void rpc.call("openMossNote", { threadId, pinId: pin.id }).then(({ opened }) => {
      if (!opened && alive.current) navigate.experimental_openFilePreview({ target: { kind: "host", hostId: pin.hostId, path: pin.path }, location: null });
    }).catch((error) => { report(error); void refresh(); });
  }
  function reference(pin: Reference, inList = false) {
    return <ContextMenu key={pin.id}>
      <ContextMenuTrigger asChild>
        <FileLink target={{ kind: "host", hostId: pin.hostId, path: pin.path }} onClick={(event) => open(pin, event)}
          title={`${pin.path}\n${pin.hostName}${pin.moss ? " · Moss note" : ""}${pin.status === "missing" ? " · File missing" : pin.status === "unavailable" ? " · Unavailable" : ""}`}
          aria-label={`Open ${pin.name}${pin.status === "missing" ? " (missing)" : ""}`}
          className={`${linkClass} ${inList ? "w-full max-w-none" : ""} ${pin.status !== "available" ? "opacity-60" : ""}`}>
          <PinContents pin={pin} />
        </FileLink>
      </ContextMenuTrigger>
      <ContextMenuContent><ContextMenuItem disabled={busy} onSelect={() => void unpin(pin)}><Icon name="PinOff" className="size-3.5" />Unpin</ContextMenuItem></ContextMenuContent>
    </ContextMenu>;
  }
  const overflow = pins.slice(visible);
  return <>
    {pins.length > 0 && <section aria-label="Pinned files" className="relative min-w-0 px-1 py-1">
      <div ref={row} className="flex min-w-0 items-center gap-1">
        <span ref={label} className="mr-1 shrink-0 text-xs text-muted-foreground">Pinned</span>
        {pins.slice(0, visible).map((pin) => reference(pin))}
        {overflow.length > 0 && <Popover open={moreOpen} onOpenChange={setMoreOpen}>
          <PopoverTrigger asChild><button type="button" aria-label={`${overflow.length} more pinned files`} className={`${linkClass} shrink-0 tabular-nums`}>+{overflow.length}</button></PopoverTrigger>
          <PopoverContent align="start" side="top" className="w-72 p-1" mobileTitle="Pinned files">
            <div className="max-h-64 space-y-0.5 overflow-y-auto" aria-label="More pinned files">{overflow.map((pin) => reference(pin, true))}</div>
          </PopoverContent>
        </Popover>}
        <button ref={addButton} type="button" className={`${linkClass} shrink-0 px-1`} title="Pin to thread" aria-label="Pin to thread" onClick={() => setPicker({})}><Icon name="Plus" className="size-3.5" /></button>
      </div>
      <div aria-hidden="true" className="pointer-events-none invisible absolute left-0 top-0 h-0 w-0 overflow-hidden">
        <div ref={measure} className="flex w-max">{pins.map((pin) => <span key={pin.id} className={`${linkClass} shrink-0`}><PinContents pin={pin} /></span>)}</div>
        <span ref={moreMeasure} className={`${linkClass} w-max tabular-nums`}>+{pins.length}</span>
      </div>
    </section>}
    {picker && <FilePicker threadId={threadId} replacing={picker.replacing} onClose={() => setPicker(null)} onPinned={refresh} />}
    <Dialog open={missing !== null} onOpenChange={(open) => { if (!open) setMissing(null); }}>
      {missing && <DialogContent className="sm:max-w-md">
        <DialogTitle>{missing.status === "missing" ? `Can't find ${missing.name}` : `${missing.hostName} is unavailable`}</DialogTitle>
        <DialogDescription>{missing.status === "missing" ? `The file may have moved or been deleted on ${missing.hostName}. Its pin is still here.` : "Reconnect the machine or check file permissions, then try again."}</DialogDescription>
        <p className="break-all text-xs text-muted-foreground">{missing.path}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => void unpin(missing)}>Unpin</Button>
          {missing.status === "missing" ? <Button size="sm" onClick={() => { setPicker({ replacing: missing }); setMissing(null); }}>Repin…</Button>
            : <Button size="sm" onClick={() => { setMissing(null); void refresh(); }}>Retry</Button>}
        </div>
      </DialogContent>}
    </Dialog>
  </>;
}
function PinsBanner() {
  const composer = useComposer();
  return composer.scope.kind === "thread" ? <PinStrip key={composer.scope.threadId} threadId={composer.scope.threadId}  /> : null;
}
export default definePluginApp((app) => {
  app.composer.customize({
    id: "file-pins", scopes: ["thread"], banners: [{ id: "pins", chrome: "bare", component: PinsBanner }],
    plusMenu: [{ id: "pin-file", label: "Pin to thread", icon: "Pin", run: ({ composer }) => { if (composer.scope.kind === "thread") launchers.get(composer.scope.threadId)?.(); } }],
  });
});
