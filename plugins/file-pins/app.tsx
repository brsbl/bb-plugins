import { Fragment, useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { definePluginApp, experimental_FileLink as FileLink, useBbNavigate, useComposer, useRealtime, useRealtimeConnectionState, useRpc } from "@get-bb/plugin-sdk/app";
import { toast } from "sonner";
import type { Reference, rpcContract } from "./contract.js";
import { Button } from "./components/ui/button.js";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "./components/ui/context-menu.js";
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "./components/ui/dropdown-menu.js";
import { Icon } from "./components/ui/icon.js";
import { PinPopover as Popover, PinPopoverAnchor as PopoverAnchor, PinPopoverContent as PopoverContent, PinPopoverTrigger as PopoverTrigger } from "./pin-popover.js";
import { FilePicker } from "./file-picker.js";
import { layoutPins, pinFile, PIN_MAX_WIDTH_CLASS, PIN_SLOT_CLASS, unpinFile, useMeasurePinCapacity, type Arrangement } from "./pin-layout.js";
import { ReferenceIcon } from "./reference-icon.js";
import { cn } from "./lib/utils.js";

const linkClass = `group inline-flex h-7 min-w-0 ${PIN_MAX_WIDTH_CLASS} items-center gap-1.5 rounded px-1.5 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`;
// The quiet file chip bb uses for composer attachments.
const pinClass = cn(linkClass, "rounded-md bg-surface-recessed shadow-xs");
// ⋯ list rows use bb's menu item density; their ⋯ shows on hover, keyboard focus and touch.
const rowLinkClass = "flex min-w-0 flex-1 items-center gap-2 rounded-sm px-2 py-[0.3125rem] text-xs text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring";
const rowActionClass = "flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground opacity-0 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring group-hover/row:opacity-100 group-has-[:focus-visible]/row:opacity-100 data-[state=open]:opacity-100 pointer-coarse:opacity-100 [@media(hover:none)]:opacity-100";
const noMotion = { animation: "none", transition: "none" };
type PinAction = { label: string; hint?: string; disabled?: boolean; run(): void };
async function copyText(text: string, copied: string, failed: string) {
  try { await navigator.clipboard.writeText(text); toast.success(copied); } catch { toast.error(failed); }
}
function ActionLabel({ action }: { action: PinAction }) {
  return action.hint ? <span className="min-w-0"><span className="block">{action.label}</span><span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{action.hint}</span></span> : <>{action.label}</>;
}
// The composer action opens the picker owned by its thread's strip.
const launchers = new Map<string, (anchor: HTMLElement) => void>();
function plainClick(event: MouseEvent<HTMLAnchorElement>) {
  return !event.defaultPrevented && event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}
function PinContents({ pin }: { pin: Reference }) {
  return <><ReferenceIcon path={pin.path} /><span className="truncate group-hover:underline">{pin.name}</span></>;
}

function PinStrip({ threadId }: { threadId: string }) {
  const rpc = useRpc<typeof rpcContract>();
  const navigate = useBbNavigate();
  const connection = useRealtimeConnectionState();
  const [pins, setPins] = useState<Reference[]>([]);
  const [more, setMore] = useState<string[]>([]);
  const [picker, setPicker] = useState(false);
  const [choosingFolder, setChoosingFolder] = useState(false);
  const [busy, setBusy] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const zone = useRef<HTMLSpanElement>(null);
  const slot = useRef<HTMLSpanElement>(null);
  const arranging = useRef({ pending: 0, queue: Promise.resolve() });
  const capacity = useMeasurePinCapacity(zone, slot);
  const generation = useRef(0);
  const alive = useRef(true);
  // The picker opens at the composer action that launched it; keep its last position if that unmounts.
  const anchorElement = useRef<HTMLElement | null>(null);
  const anchorRect = useRef(new DOMRect());
  const anchor = useRef({ getBoundingClientRect: () => {
    if (anchorElement.current?.isConnected) anchorRect.current = anchorElement.current.getBoundingClientRect();
    return anchorRect.current;
  } });
  const report = useCallback((cause: unknown) => { if (alive.current) toast.error(cause instanceof Error ? cause.message : String(cause)); }, []);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    try {
      const result = await rpc.call("inspect", { threadId });
      if (alive.current && request === generation.current && arranging.current.pending === 0) { setPins(result.pins); setMore(result.more); }
    } catch (cause) { report(cause); }
  }, [rpc, threadId, report]);
  useEffect(() => {
    alive.current = true;
    const launch = (element: HTMLElement) => { setMoreOpen(false); anchorElement.current = element; setPicker(true); };
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
  async function remove(pin: Reference) {
    if (busy) return;
    setBusy(true);
    try {
      const { undoToken } = await rpc.call("remove", { threadId, pinId: pin.id });
      setMoreOpen(false);
      await refresh();
      if (undoToken) toast(`Removed ${pin.name}`, {
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
    if (pin.status !== "available") { event.preventDefault(); report(new Error(`${pin.hostName} is unavailable. Reconnect the machine and try again.`)); }
  }
  const layout = layoutPins(pins, more, capacity);
  // The folder chooser sits above the picker (a drawer on phones); using or closing it must not close the picker.
  const keepOpenForChooser = (event: Event) => { if (choosingFolder) event.preventDefault(); };
  const current: Arrangement = { order: pins.map((pin) => pin.id), more };
  function arrange(next: Arrangement) {
    // Apply locally first; saves run in order and
    // refreshes wait until the last one lands so the strip never steps back.
    generation.current++;
    setPins(next.order.map((id) => pins.find((pin) => pin.id === id)!));
    setMore(next.more);
    const saves = arranging.current;
    saves.pending++;
    saves.queue = saves.queue.then(() => rpc.call("arrange", { threadId, ...next })).then(() => undefined, report)
      .finally(() => { if (--saves.pending === 0) void refresh(); });
  }
  function title(pin: Reference) {
    return `${pin.path}\n${pin.hostName}${pin.status === "missing" ? " · File missing" : pin.status === "unavailable" ? " · Unavailable" : ""}`;
  }
  // Pinned files offer Unpin (to the ⋯ list); other files offer Pin while the strip has room.
  function actions(pin: Reference): PinAction[] {
    const pinned = !more.includes(pin.id);
    return [
      pinned
        ? { label: "Unpin", run: () => arrange(unpinFile(current, pin.id)) }
        : { label: "Pin", disabled: !layout.canPin, hint: layout.canPin ? undefined : "No room on the strip", run: () => {
          const next = pinFile(layout, current, pin.id);
          if (next) { setMoreOpen(false); arrange(next); }
        } },
      { label: "Remove", disabled: busy, run: () => void remove(pin) },
    ];
  }
  // bb's FileLink menu items that the public SDK can reproduce, then this plugin's actions.
  // "Open with" and "Open in" need core-only openers and local app targets, so they are left out.
  function menuGroups(pin: Reference): PinAction[][] {
    if (pin.status === "missing") return [actions(pin)];
    const file = { target: { kind: "host" as const, hostId: pin.hostId, path: pin.path }, location: null };
    return [
      [
        { label: "Open preview", run: () => { setMoreOpen(false); navigate.experimental_openFilePreview(file); } },
        { label: "Open externally", disabled: pin.status !== "available", run: () => { setMoreOpen(false); navigate.experimental_openFileExternally(file); } },
      ],
      [
        { label: "Copy file path", run: () => void copyText(pin.path, "File path copied", "Failed to copy file path") },
        { label: "Copy file name", run: () => void copyText(pin.name, "File name copied", "Failed to copy file name") },
      ],
      actions(pin),
    ];
  }
  function contextMenu(pin: Reference) {
    return <ContextMenuContent style={noMotion} className="min-w-52">
      {menuGroups(pin).map((group, index) => <Fragment key={index}>
        {index > 0 && <ContextMenuSeparator />}
        {group.map((action) => <ContextMenuItem key={action.label} disabled={action.disabled} onSelect={action.run}><ActionLabel action={action} /></ContextMenuItem>)}
      </Fragment>)}
    </ContextMenuContent>;
  }
  function stripPin(pin: Reference) {
    const link = pin.status === "missing" ? <span className={`relative inline-flex min-w-0 ${PIN_MAX_WIDTH_CLASS}`} title={title(pin)}>
      <span aria-label={`${pin.name} (missing)`} className={cn(pinClass, "cursor-default pr-4 text-destructive/55 hover:text-destructive/55")}>
        <ReferenceIcon path={pin.path} /><span className="truncate">{pin.name}</span><span className="sr-only"> (missing)</span>
      </span>
      <button type="button" disabled={busy} aria-label={`Remove missing ${pin.name}`} title={`Remove missing ${pin.name}`} onClick={() => void remove(pin)}
        className="absolute right-0.5 top-0.5 flex size-3.5 items-center justify-center rounded-sm text-xs leading-none text-muted-foreground/70 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">×</button>
    </span> : <FileLink target={{ kind: "host", hostId: pin.hostId, path: pin.path }} onClick={(event) => open(pin, event)} title={title(pin)}
      aria-label={`Open ${pin.name}`} className={cn(pinClass, pin.status === "available" ? "cursor-pointer" : "opacity-60")}><PinContents pin={pin} /></FileLink>;
    return <ContextMenu key={pin.id}><ContextMenuTrigger asChild>{link}</ContextMenuTrigger>{contextMenu(pin)}</ContextMenu>;
  }
  function listRow(pin: Reference) {
    const name = <><ReferenceIcon path={pin.path} /><span className="truncate">{pin.name}</span></>;
    const link = pin.status === "missing"
      ? <span aria-label={`${pin.name} (missing)`} title={title(pin)} className={cn(rowLinkClass, "cursor-default text-destructive/55")}>{name}<span className="sr-only"> (missing)</span></span>
      : <FileLink target={{ kind: "host", hostId: pin.hostId, path: pin.path }} onClick={(event) => open(pin, event)} title={title(pin)}
        aria-label={`Open ${pin.name}`} className={cn(rowLinkClass, pin.status === "available" ? "cursor-pointer" : "opacity-60")}>{name}</FileLink>;
    // The menu trigger sits on the link itself, as on the strip, so it replaces FileLink's own menu.
    return <div key={pin.id} className="group/row flex min-w-0 items-center rounded-sm pr-1 hover:bg-state-hover has-[:focus-visible]:bg-state-hover has-[[data-state=open]]:bg-state-hover">
      <ContextMenu><ContextMenuTrigger asChild>{link}</ContextMenuTrigger>{contextMenu(pin)}</ContextMenu>
      <Menu.Root modal={false}>
        <Menu.Trigger asChild><button type="button" aria-label={`Actions for ${pin.name}`} title="Actions" className={rowActionClass}><Icon name="MoreHorizontal" className="size-4" /></button></Menu.Trigger>
        <DropdownMenuContent align="end" style={noMotion} className="min-w-52">
          {menuGroups(pin).map((group, index) => <Fragment key={index}>
            {index > 0 && <DropdownMenuSeparator />}
            {group.map((action) => <DropdownMenuItem key={action.label} disabled={action.disabled} onSelect={action.run}><ActionLabel action={action} /></DropdownMenuItem>)}
          </Fragment>)}
        </DropdownMenuContent>
      </Menu.Root>
    </div>;
  }
  return <div className="relative min-w-0">
    <Popover open={picker} onOpenChange={(open) => { setPicker(open); if (!open) setChoosingFolder(false); }}>
      <PopoverAnchor virtualRef={anchor} />
      {pins.length > 0 && <section aria-label="Pinned files" className="min-w-0 overflow-hidden px-1 py-1">
        <div className="flex min-w-0 items-center gap-1">
          {layout.strip.map((pin) => stripPin(pin))}
          {layout.more.length > 0 && <Popover open={moreOpen} onOpenChange={setMoreOpen}>
            <PopoverTrigger asChild><button type="button" aria-label={`${layout.more.length} more ${layout.more.length === 1 ? "file" : "files"}`} title="More files" className={`${linkClass} shrink-0 cursor-pointer px-1`}><Icon name="MoreHorizontal" className="size-4" /></button></PopoverTrigger>
            <PopoverContent aria-label="More files" className="w-56 p-1"><div className="max-h-64 overflow-y-auto">{layout.more.map((pin) => listRow(pin))}</div></PopoverContent>
          </Popover>}
        </div>
      </section>}
      <PopoverContent aria-label="Pin to thread" align="end"
        // Focus goes back to the composer action that opened the picker.
        onCloseAutoFocus={(event) => { event.preventDefault(); if (anchorElement.current?.isConnected) anchorElement.current.focus(); }}
        onInteractOutside={keepOpenForChooser} onFocusOutside={keepOpenForChooser}
        onEscapeKeyDown={(event) => { if (choosingFolder) { event.preventDefault(); setChoosingFolder(false); } }}>
        <FilePicker threadId={threadId} stripFull={!layout.canPin} choosingFolder={choosingFolder} onChoosingFolderChange={setChoosingFolder} onClose={() => setPicker(false)} onPinned={refresh} />
      </PopoverContent>
    </Popover>
    {/* Mirrors the strip row, with room for ⋯, to measure how many pin slots fit. */}
    <div aria-hidden="true" className="pointer-events-none invisible absolute inset-x-0 top-0 flex h-0 items-center gap-1 overflow-hidden px-1">
      <span ref={zone} className="min-w-0 flex-1" />
      <span className={`${linkClass} shrink-0 px-1`}><Icon name="MoreHorizontal" className="size-4" /></span>
    </div>
    <span ref={slot} aria-hidden="true" className={cn(PIN_SLOT_CLASS, "pointer-events-none invisible absolute left-0 top-0 h-0")} />
  </div>;
}
function PinsBanner() {
  const composer = useComposer();
  return composer.scope.kind === "thread" ? <PinStrip key={composer.scope.threadId} threadId={composer.scope.threadId} /> : null;
}
// The entry point for pinning, in the composer's action row beside other plugins' actions.
function PinAction() {
  const composer = useComposer();
  if (composer.scope.kind !== "thread") return null;
  const threadId = composer.scope.threadId;
  return <Button type="button" variant="ghost" size="icon" className="size-7 text-muted-foreground" aria-label="Pin files" title="Pin files" aria-haspopup="dialog"
    // Narrow composers collapse their action row on blur; keep it until the click lands.
    onMouseDown={(event) => event.preventDefault()}
    onClick={(event) => launchers.get(threadId)?.(event.currentTarget)}>
    <Icon name="Pin" className="size-4" />
  </Button>;
}
export default definePluginApp((app) => {
  app.composer.customize({
    id: "file-pins", scopes: ["thread"],
    banners: [{ id: "pins", chrome: "bare", component: PinsBanner }],
    actions: [{ id: "pin-files", component: PinAction }],
  });
});
