import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type RefObject } from "react";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { definePluginApp, experimental_FileLink as FileLink, useBbNavigate, useComposer, useRealtime, useRealtimeConnectionState, useRpc } from "@get-bb/plugin-sdk/app";
import { toast } from "sonner";
import { PIN_MENTION, type Reference, type rpcContract } from "./contract.js";
import { Button } from "./components/ui/button.js";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "./components/ui/context-menu.js";
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "./components/ui/dropdown-menu.js";
import { useIsCompactViewport } from "./components/ui/hooks/use-compact-viewport.js";
import { usePointerCoarse } from "./components/ui/hooks/use-pointer-coarse.js";
import { Icon } from "./components/ui/icon.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip.js";
import { PinPopover as Popover, PinPopoverContent as PopoverContent, PinPopoverTrigger as PopoverTrigger } from "./pin-popover.js";
import { layoutPins, pinFile, PIN_MAX_WIDTH_CLASS, PIN_SLOT_CLASS, unpinFile, useMeasurePinCapacity, type Arrangement } from "./pin-layout.js";
import { previewTarget } from "./open-target.js";
import { ReferenceIcon } from "./reference-icon.js";
import { cn } from "./lib/utils.js";

const linkClass = `group inline-flex h-7 min-w-0 ${PIN_MAX_WIDTH_CLASS} items-center gap-1.5 rounded px-1.5 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`;
// bb's composer-stack card chrome at chip scale, kept quiet: a hairline at rest, a shadow on hover.
const pinClass = cn(linkClass, "rounded-md border border-border-seam bg-surface-raised-solid transition-shadow hover:shadow-xs");
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
function plainClick(event: MouseEvent<HTMLAnchorElement>) {
  return !event.defaultPrevented && event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}
function PinContents({ pin }: { pin: Reference }) {
  return <><ReferenceIcon path={pin.path} /><span className="truncate group-hover:underline">{pin.name}</span></>;
}

// True while the strip is the composer stack's top row, so a fade above it covers only timeline text, never another banner.
function useTopOfComposerStack(ref: RefObject<HTMLElement | null>, active: boolean) {
  const [top, setTop] = useState(false);
  useLayoutEffect(() => {
    const element = ref.current;
    const stack = element?.closest("[data-promptbox-shell]");
    if (!active || !element || !stack) { setTop(false); return; }
    const check = () => setTop(element.getBoundingClientRect().top - stack.getBoundingClientRect().top < 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(stack);
    return () => observer.disconnect();
  }, [ref, active]);
  return top;
}

function PinStrip({ threadId }: { threadId: string }) {
  const rpc = useRpc<typeof rpcContract>();
  const navigate = useBbNavigate();
  const connection = useRealtimeConnectionState();
  const [pins, setPins] = useState<Reference[]>([]);
  const [more, setMore] = useState<string[]>([]);
  const [threadHostId, setThreadHostId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [rowMenu, setRowMenu] = useState<string | null>(null);
  // Phones have no room beside the list, so row menus open below the row there.
  const compact = useIsCompactViewport();
  const zone = useRef<HTMLSpanElement>(null);
  const slot = useRef<HTMLSpanElement>(null);
  const arranging = useRef({ pending: 0, queue: Promise.resolve() });
  const capacity = useMeasurePinCapacity(zone, slot);
  const root = useRef<HTMLDivElement>(null);
  const fade = useTopOfComposerStack(root, pins.length > 0);
  const generation = useRef(0);
  const alive = useRef(true);
  const report = useCallback((cause: unknown) => { if (alive.current) toast.error(cause instanceof Error ? cause.message : String(cause)); }, []);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    try {
      const result = await rpc.call("inspect", { threadId });
      if (alive.current && request === generation.current && arranging.current.pending === 0) { setPins(result.pins); setMore(result.more); setThreadHostId(result.threadHostId); }
    } catch (cause) { report(cause); }
  }, [rpc, threadId, report]);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; generation.current++; };
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
    else if (!previewTarget(pin, threadHostId)) { event.preventDefault(); elsewhere(pin); }
  }
  // bb previews only files on this thread's machine, so say where the file is instead of doing nothing.
  function elsewhere(pin: Reference) {
    toast(`${pin.name} is on ${pin.hostName}, so it can't be previewed here.`);
  }
  // Clicks on a pin with no preview target are intercepted above; the pin's own target keeps FileLink's href.
  function linkTarget(pin: Reference) {
    return previewTarget(pin, threadHostId) ?? { kind: "host" as const, hostId: pin.hostId, path: pin.path };
  }
  const layout = layoutPins(pins, more, capacity);
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
    const preview = previewTarget(pin, threadHostId);
    return [
      [
        { label: "Open preview", run: () => {
          setMoreOpen(false);
          if (preview) navigate.experimental_openFilePreview({ target: preview, location: null }); else elsewhere(pin);
        } },
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
    </span> : <FileLink target={linkTarget(pin)} onClick={(event) => open(pin, event)} title={title(pin)}
      aria-label={`Open ${pin.name}`} className={cn(pinClass, pin.status === "available" ? "cursor-pointer" : "[&>*]:opacity-60")}><PinContents pin={pin} /></FileLink>;
    return <ContextMenu key={pin.id}><ContextMenuTrigger asChild>{link}</ContextMenuTrigger>{contextMenu(pin)}</ContextMenu>;
  }
  function listRow(pin: Reference) {
    const name = <><ReferenceIcon path={pin.path} /><span className="truncate">{pin.name}</span></>;
    // Right-click opens the row's ⋯ menu, anchored beside the row, in place of FileLink's own menu.
    const onContextMenu = (event: MouseEvent) => { event.preventDefault(); setRowMenu(pin.id); };
    const link = pin.status === "missing"
      ? <span aria-label={`${pin.name} (missing)`} title={title(pin)} onContextMenu={onContextMenu} className={cn(rowLinkClass, "cursor-default text-destructive/55")}>{name}<span className="sr-only"> (missing)</span></span>
      : <FileLink target={linkTarget(pin)} onClick={(event) => open(pin, event)} onContextMenu={onContextMenu} title={title(pin)}
        aria-label={`Open ${pin.name}`} className={cn(rowLinkClass, pin.status === "available" ? "cursor-pointer" : "opacity-60")}>{name}</FileLink>;
    return <div key={pin.id} className="group/row flex min-w-0 items-center rounded-sm pr-1 hover:bg-state-hover has-[:focus-visible]:bg-state-hover has-[[data-state=open]]:bg-state-hover">
      {link}
      <Menu.Root modal={false} open={rowMenu === pin.id} onOpenChange={(open) => setRowMenu(open ? pin.id : null)}>
        <Menu.Trigger asChild><button type="button" aria-label={`Actions for ${pin.name}`} title="Actions" className={rowActionClass}><Icon name="MoreHorizontal" className="size-4" /></button></Menu.Trigger>
        <DropdownMenuContent side={compact ? "bottom" : "right"} align={compact ? "end" : "start"} alignOffset={compact ? 0 : -4} sideOffset={compact ? 4 : 8} collisionPadding={8} style={noMotion} className="min-w-52">
          {menuGroups(pin).map((group, index) => <Fragment key={index}>
            {index > 0 && <DropdownMenuSeparator />}
            {group.map((action) => <DropdownMenuItem key={action.label} disabled={action.disabled} onSelect={action.run}><ActionLabel action={action} /></DropdownMenuItem>)}
          </Fragment>)}
        </DropdownMenuContent>
      </Menu.Root>
    </div>;
  }
  return <div ref={root} className="relative min-w-0">
    {/* bb's composer fade, repeated above the flat strip so text scrolling under it doesn't end in a hard edge. */}
    {fade && <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-b from-transparent to-background" />}
    {pins.length > 0 && <section aria-label="Pinned files" className="min-w-0 overflow-hidden rounded-lg px-1 py-1">
      <div className="flex min-w-0 items-center gap-1">
        {layout.strip.map((pin) => stripPin(pin))}
        {layout.more.length > 0 && <Popover open={moreOpen} onOpenChange={setMoreOpen}>
          <PopoverTrigger asChild><button type="button" aria-label={`${layout.more.length} more ${layout.more.length === 1 ? "file" : "files"}`} title="More files" className={`${linkClass} shrink-0 cursor-pointer px-1`}><Icon name="MoreHorizontal" className="size-4" /></button></PopoverTrigger>
          <PopoverContent aria-label="More files" className="w-56 p-1"><div className="max-h-64 overflow-y-auto">{layout.more.map((pin) => listRow(pin))}</div></PopoverContent>
        </Popover>}
      </div>
    </section>}
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
// The entry point for pinning: a pill carrying the skill's instructions; the user types which files.
function PinAction() {
  const composer = useComposer();
  const coarse = usePointerCoarse();
  if (composer.scope.kind !== "thread") return null;
  function start() {
    // `insert` (bb 0.45+) places the pill and a space at the cursor and focuses the editor except on touch screens.
    const insert = (composer as { insert?: (parts: readonly unknown[], options: { at: "cursor" }) => void }).insert;
    if (insert) insert.call(composer, [PIN_MENTION, " "], { at: "cursor" });
    else { composer.insertMention(PIN_MENTION); composer.updateText((text) => `${text.trimEnd()} `); }
    if (!insert || coarse) composer.focus();
  }
  return <TooltipProvider delayDuration={300}><Tooltip>
    <TooltipTrigger asChild>
      <Button type="button" variant="ghost" size="icon" className="size-7 text-muted-foreground" aria-label="Pin files"
        // Narrow composers collapse their action row on blur; keep it, and the editor's cursor, until the click lands.
        onMouseDown={(event) => event.preventDefault()}
        onClick={start}>
        <Icon name="Pin" className="size-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Pin files</TooltipContent>
  </Tooltip></TooltipProvider>;
}
export default definePluginApp((app) => {
  app.composer.customize({
    id: "file-pins", scopes: ["thread"],
    banners: [{ id: "pins", chrome: "bare", component: PinsBanner }],
    actions: [{ id: "pin-files", component: PinAction }],
  });
});
