import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactElement, type RefObject } from "react";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { definePluginApp, experimental_FileLink as FileLink, UrlLink, useBbNavigate, useComposer, useRealtime, useRealtimeConnectionState, useRpc } from "@get-bb/plugin-sdk/app";
import { toast } from "sonner";
import { PIN_MENTION, isUrlPin, type FileReference, type Reference, type UrlPin, type rpcContract } from "./contract.js";
import { Button } from "./components/ui/button.js";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "./components/ui/context-menu.js";
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "./components/ui/dropdown-menu.js";
import { useIsCompactViewport } from "./components/ui/hooks/use-compact-viewport.js";
import { usePointerCoarse } from "./components/ui/hooks/use-pointer-coarse.js";
import { Icon } from "./components/ui/icon.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip.js";
import { PinPopover as Popover, PinPopoverContent as PopoverContent, PinPopoverTrigger as PopoverTrigger } from "./pin-popover.js";
import { layoutPins, pinFile, PIN_MIN_WIDTH_CLASS, useMeasurePins, type Arrangement } from "./pin-layout.js";
import { previewTarget } from "./open-target.js";
import { pinTooltip } from "./pin-tooltip.js";
import { LinkPreviewCard, PREVIEW_HOLD_MS, preparePreview } from "./link-preview-card.js";
import { pinLabel } from "./pin-label.js";
import { PreviewAddress } from "./preview-address.js";
import { previewClient, previewKey, refreshNotice } from "./preview-client.js";
import { ReferenceIcon } from "./reference-icon.js";
import { prStateLabel, showsPrState, UrlPinIcon, usePrStateAnswers } from "./url-pin-icon.js";
import { cn } from "./lib/utils.js";

const linkClass = `group inline-flex h-7 min-w-0 items-center gap-1.5 rounded px-1.5 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`;
// bb's composer-stack card chrome at chip scale, kept quiet: a hairline at rest, a shadow on hover.
const moreClass = `${linkClass} shrink-0`;
const pinClass = cn(linkClass, "rounded-md border border-border-seam bg-surface-raised-solid transition-shadow hover:shadow-xs");
// ⋯ list rows use bb's menu item density; their ⋯ shows on hover, keyboard focus and touch.
const rowLinkClass = "flex min-w-0 flex-1 items-center gap-2 rounded-sm px-2 py-[0.3125rem] text-xs text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring";
const rowActionClass = "flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground opacity-0 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring group-hover/row:opacity-100 group-has-[:focus-visible]/row:opacity-100 data-[state=open]:opacity-100 pointer-coarse:opacity-100 [@media(hover:none)]:opacity-100";
const noMotion = { animation: "none", transition: "none" };
const menuClass = "min-w-40 p-1";
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
function PinIcon({ threadId, pin }: { threadId: string; pin: Reference }) {
  return isUrlPin(pin) ? <UrlPinIcon threadId={threadId} pin={pin} /> : <ReferenceIcon path={pin.path} muted={pin.status === "missing"} />;
}

const tipClass = "w-72 rounded-lg border bg-popover p-0 text-popover-foreground shadow-lg";
function scrollPreviewAddress(event: KeyboardEvent, value: string) {
  if (!["ArrowRight", "ArrowLeft", "End", "Home"].includes(event.key)) return;
  const header = Array.from(document.querySelectorAll<HTMLDivElement>("[data-pin-preview-address]"))
    .find((element) => element.title === value && !element.closest("[role=tooltip]"));
  if (!header || header.scrollWidth <= header.clientWidth) return;
  if (event.key === "ArrowRight") header.scrollLeft += 80;
  else if (event.key === "ArrowLeft") header.scrollLeft -= 80;
  else if (event.key === "End") header.scrollLeft = header.scrollWidth;
  else if (event.key === "Home") header.scrollLeft = 0;
  else return;
  event.preventDefault();
}
/**
 * A link's preview card, opened whole: hovering or focusing the pin starts loading its preview while the tooltip
 * delay runs, and the card opens once the preview and its image are ready, or after PREVIEW_HOLD_MS with what it has.
 */
function HeldTooltip({ prepare, trigger, address, card }: { prepare: () => Promise<void>; trigger: ReactElement; address: string; card: ReactElement }) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const request = useRef(0);
  useEffect(() => () => { request.current++; }, []);
  function onOpenChange(next: boolean) {
    const ticket = ++request.current;
    if (!next) { setOpen(false); return; }
    const show = () => { if (request.current === ticket) setOpen(true); };
    const timer = setTimeout(show, PREVIEW_HOLD_MS);
    void prepare().then(() => { clearTimeout(timer); show(); });
  }
  return <Tooltip open={open} onOpenChange={onOpenChange}>
    <TooltipTrigger asChild onPointerEnter={() => void prepare()} onFocus={() => { setFocused(true); void prepare(); }} onBlur={() => setFocused(false)} onKeyDown={(event) => scrollPreviewAddress(event, address)}>{trigger}</TooltipTrigger>
    <TooltipContent side="top" sideOffset={6} className={tipClass}>
      <PreviewAddress value={address} focused={focused} />
      {card}
    </TooltipContent>
  </Tooltip>;
}

function FileTooltip({ trigger, address, card }: { trigger: ReactElement; address: string; card: ReactElement }) {
  const [focused, setFocused] = useState(false);
  return <Tooltip>
    <TooltipTrigger asChild onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onKeyDown={(event) => scrollPreviewAddress(event, address)}>{trigger}</TooltipTrigger>
    <TooltipContent side="top" sideOffset={6} className={tipClass}>
      <PreviewAddress value={address} focused={focused} />
      {card}
    </TooltipContent>
  </Tooltip>;
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
  // Refresh preview is busy per pin, so other pins' actions stay available.
  const [refreshing, setRefreshing] = useState<ReadonlySet<string>>(() => new Set());
  const [moreOpen, setMoreOpen] = useState(false);
  const [rowMenu, setRowMenu] = useState<string | null>(null);
  // Phones have no room beside the list, so row menus open below the row there.
  const compact = useIsCompactViewport();
  const measureRow = useRef<HTMLDivElement>(null);
  const arranging = useRef({ pending: 0, queue: Promise.resolve() });
  const metrics = useMeasurePins(measureRow, pins.map((pin) => pin.id).join("\n"));
  // Touch screens have no hover tooltip to reveal a cut-off label, so pins keep whole labels and the rest wait in ⋯.
  const whole = usePointerCoarse();
  // Re-render labels when a pinned PR's state arrives, so they name it for screen readers.
  usePrStateAnswers();
  const openLabel = (pin: Reference) => {
    const state = isUrlPin(pin) ? prStateLabel(pin.url) : "";
    return `Open ${pin.name}${state ? `, ${state}` : ""}`;
  };
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
      if (undoToken) toast(`Unpinned ${pin.name}`, {
        duration: 10_000,
        action: { label: "Undo", onClick: () => {
          void rpc.call("undo", { threadId, undoToken }).then(() => refresh()).catch(report);
        } },
      });
    } catch (cause) { report(cause); }
    finally { if (alive.current) setBusy(false); }
  }
  async function refreshPreview(pin: UrlPin) {
    if (refreshing.has(pin.id)) return;
    const mark = (on: boolean) => setRefreshing((ids) => {
      const next = new Set(ids);
      if (on) next.add(pin.id); else next.delete(pin.id);
      return next;
    });
    mark(true);
    try {
      // An open card for this pin shows the new answer as it lands; the current preview stays until then.
      const answer = await previewClient.refresh(previewKey(threadId, pin.id, pin.url), () => rpc.call("refreshPreview", { threadId, pinId: pin.id }));
      if (!alive.current) return;
      const notice = refreshNotice(answer);
      if (notice.ok) toast.success(notice.message); else toast.error(notice.message);
    } catch (cause) { report(cause); }
    finally { if (alive.current) mark(false); }
  }
  function open(pin: FileReference, event: MouseEvent<HTMLAnchorElement>) {
    if (!plainClick(event)) return;
    if (pin.status !== "available") { event.preventDefault(); report(new Error(`${pin.hostName} is unavailable. Reconnect the machine and try again.`)); }
    else if (!previewTarget(pin, threadHostId)) { event.preventDefault(); elsewhere(pin); }
  }
  // bb previews only files on this thread's machine, so say where the file is instead of doing nothing.
  function elsewhere(pin: FileReference) {
    toast(`${pin.name} is on ${pin.hostName}, so it can't be previewed here.`);
  }
  // Clicks on a pin with no preview target are intercepted above; the pin's own target keeps FileLink's href.
  function linkTarget(pin: FileReference) {
    return previewTarget(pin, threadHostId) ?? { kind: "host" as const, hostId: pin.hostId, path: pin.path };
  }
  // Use bb's compact breakpoint. Wide strips keep every pinned item at its natural width.
  const layoutMetrics = compact ? metrics : null;
  const layout = layoutPins(pins, more, layoutMetrics, { whole });
  const scrollRow = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  useLayoutEffect(() => {
    const row = scrollRow.current;
    if (compact || !row) return;
    const check = () => {
      const left = row.scrollLeft > 1;
      const right = row.scrollLeft < row.scrollWidth - row.clientWidth - 1;
      setEdges((previous) => previous.left === left && previous.right === right ? previous : { left, right });
    };
    // Some platforms leave Shift-wheel on the vertical axis. Trackpad deltaX stays native.
    const wheel = (event: WheelEvent) => {
      if (!event.shiftKey || event.ctrlKey || event.deltaX !== 0 || event.deltaY === 0) return;
      const unit = event.deltaMode === 1 ? row.clientHeight : event.deltaMode === 2 ? row.clientWidth : 1;
      const before = row.scrollLeft;
      row.scrollLeft += event.deltaY * unit;
      if (row.scrollLeft !== before) event.preventDefault();
    };
    check();
    row.addEventListener("scroll", check, { passive: true });
    row.addEventListener("wheel", wheel, { passive: false });
    const observer = new ResizeObserver(check);
    observer.observe(row);
    for (const child of Array.from(row.children)) observer.observe(child);
    return () => { row.removeEventListener("scroll", check); row.removeEventListener("wheel", wheel); observer.disconnect(); };
  }, [compact, metrics, pins, more]);
  // ⋯ is always there. It lists only pins the strip doesn't show: ones that didn't fit, then ones hidden by hand.
  // Pins reachable by scrolling the strip stay off it.
  const listed = layout.more;
  const moreLabel = listed.length ? `${listed.length} more ${listed.length === 1 ? "pin" : "pins"}` : "More pins, all pins are showing";
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
  // A small, hoverable preview card for both pointer and keyboard users.
  function withTooltip(pin: Reference, trigger: ReactElement) {
    const tip = pinTooltip(pin, threadHostId);
    if (isUrlPin(pin)) return <HeldTooltip key={pin.id} prepare={() => preparePreview(previewKey(threadId, pin.id, pin.url), () => rpc.call("preview", { threadId, pinId: pin.id }))}
      trigger={trigger} address={tip.address} card={<LinkPreviewCard threadId={threadId} pin={pin} />} />;
    return <FileTooltip key={pin.id} trigger={trigger} address={tip.address} card={
      <div className="flex items-start gap-2 px-3 py-2.5">
          <span className="mt-0.5 shrink-0"><PinIcon threadId={threadId} pin={pin} /></span>
          <div className="min-w-0">
            <div className="font-medium leading-5 break-words">{tip.title}</div>
            {tip.note && <div className="mt-0.5 text-xs text-muted-foreground">{tip.note}</div>}
          </div>
      </div>} />;
  }
  // Overflowed pins can move back to the strip; Unpin always removes with Undo.
  function actions(pin: Reference): PinAction[] {
    if (!more.includes(pin.id)) return [{ label: "Unpin", disabled: busy, run: () => void remove(pin) }];
    const next = pinFile(pins, current, pin.id, layoutMetrics, { whole });
    return [{
      label: "Show in strip", disabled: busy || !next, hint: next ? undefined : "No room on the strip", run: () => {
        if (next) { setMoreOpen(false); arrange(next); }
      },
    }, { label: "Unpin", disabled: busy, run: () => void remove(pin) }];
  }
  // bb's FileLink menu items that the public SDK can reproduce, then this plugin's actions.
  // "Open with" and "Open in" need core-only openers and local app targets, so they are left out.
  // A URL opens the way bb opens links: its browser preference, else a new tab.
  function openUrl(pin: UrlPin) {
    setMoreOpen(false);
    if (!navigate.openUrl(pin.url)) window.open(pin.url, "_blank", "noopener,noreferrer");
  }
  function menuGroups(pin: Reference): PinAction[][] {
    if (isUrlPin(pin)) return [
      [{ label: "Open", run: () => openUrl(pin) }],
      [
        { label: "Copy link", run: () => void copyText(pin.url, "Link copied", "Failed to copy link") },
        { label: "Refresh preview", disabled: refreshing.has(pin.id), run: () => void refreshPreview(pin) },
      ],
      actions(pin),
    ];
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
    return <ContextMenuContent style={noMotion} className={menuClass}>
      {menuGroups(pin).map((group, index) => <Fragment key={index}>
        {index > 0 && <ContextMenuSeparator />}
        {group.map((action) => <ContextMenuItem key={action.label} disabled={action.disabled} onSelect={action.run}><ActionLabel action={action} /></ContextMenuItem>)}
      </Fragment>)}
    </ContextMenuContent>;
  }
  function stripPin(pin: Reference) {
    const cap = layout.caps[pin.id];
    const style = cap === undefined ? undefined : { maxWidth: cap };
    const link = isUrlPin(pin) ? <UrlLink href={pin.url} style={style} aria-label={openLabel(pin)} className={cn(pinClass, "cursor-pointer")}>
      <PinIcon threadId={threadId} pin={pin} /><span className="truncate group-hover:underline">{pinLabel(pin)}</span>
    </UrlLink> : pin.status === "missing" ? <span className="relative inline-flex min-w-0" style={style}>
      <span aria-label={`${pin.name} (missing)`} className={cn(pinClass, "cursor-default pr-4 text-destructive/55 hover:text-destructive/55")}>
        <ReferenceIcon path={pin.path} muted /><span className="truncate">{pinLabel(pin)}</span><span className="sr-only"> (missing)</span>
      </span>
      <button type="button" disabled={busy} aria-label={`Unpin missing ${pin.name}`} onClick={() => void remove(pin)}
        className="absolute right-0.5 top-0.5 flex size-3.5 items-center justify-center rounded-sm text-xs leading-none text-muted-foreground/70 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">×</button>
    </span> : <FileLink target={linkTarget(pin)} onClick={(event) => open(pin, event)} style={style}
      aria-label={openLabel(pin)} className={cn(pinClass, pin.status === "available" ? "cursor-pointer" : "[&>*]:opacity-60")}><PinIcon threadId={threadId} pin={pin} /><span className="truncate group-hover:underline">{pinLabel(pin)}</span></FileLink>;
    return <ContextMenu key={pin.id}>{withTooltip(pin, <ContextMenuTrigger asChild>{link}</ContextMenuTrigger>)}{contextMenu(pin)}</ContextMenu>;
  }
  function listRow(pin: Reference) {
    const name = <><PinIcon threadId={threadId} pin={pin} /><span className="truncate">{pinLabel(pin)}</span></>;
    // Right-click opens the row's ⋯ menu, anchored beside the row, in place of FileLink's own menu.
    const onContextMenu = (event: MouseEvent) => { event.preventDefault(); setRowMenu(pin.id); };
    const link = isUrlPin(pin)
      ? <UrlLink href={pin.url} onContextMenu={onContextMenu} aria-label={openLabel(pin)} className={cn(rowLinkClass, "cursor-pointer")}>{name}</UrlLink>
      : pin.status === "missing"
      ? <span tabIndex={0} aria-label={`${pin.name} (missing)`} onContextMenu={onContextMenu} className={cn(rowLinkClass, "cursor-default text-destructive/55")}>{name}<span className="sr-only"> (missing)</span></span>
      : <FileLink target={linkTarget(pin)} onClick={(event) => open(pin, event)} onContextMenu={onContextMenu}
        aria-label={openLabel(pin)} className={cn(rowLinkClass, pin.status === "available" ? "cursor-pointer" : "opacity-60")}>{name}</FileLink>;
    return <div key={pin.id} className="group/row flex min-w-0 items-center rounded-sm pr-1 hover:bg-state-hover has-[:focus-visible]:bg-state-hover has-[[data-state=open]]:bg-state-hover">
      {withTooltip(pin, link)}
      <Menu.Root modal={false} open={rowMenu === pin.id} onOpenChange={(open) => setRowMenu(open ? pin.id : null)}>
        <Menu.Trigger asChild><button type="button" aria-label={`Actions for ${pin.name}`} title="Actions" className={rowActionClass}><Icon name="MoreHorizontal" className="size-4" /></button></Menu.Trigger>
        <DropdownMenuContent side={compact ? "bottom" : "right"} align={compact ? "end" : "start"} alignOffset={compact ? 0 : -4} sideOffset={compact ? 4 : 8} collisionPadding={8} style={noMotion} className={menuClass}>
          {menuGroups(pin).map((group, index) => <Fragment key={index}>
            {index > 0 && <DropdownMenuSeparator />}
            {group.map((action) => <DropdownMenuItem key={action.label} disabled={action.disabled} onSelect={action.run}><ActionLabel action={action} /></DropdownMenuItem>)}
          </Fragment>)}
        </DropdownMenuContent>
      </Menu.Root>
    </div>;
  }
  return <TooltipProvider delayDuration={300}><div ref={root} className="relative min-w-0">
    {/* bb's composer fade, repeated above the flat strip so text scrolling under it doesn't end in a hard edge. */}
    {fade && <span aria-hidden="true" data-overflow-fade="above" className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-b from-transparent to-background" />}
    {pins.length > 0 && <section aria-label="Pinned files and links" className="flex min-w-0 items-center gap-1 overflow-hidden rounded-lg px-1 py-1">
      <div ref={scrollRow}
        className={cn("flex min-w-0 flex-1 items-center gap-1", !compact && "-m-0.5 overflow-x-auto p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 [&>*]:scroll-mx-4")}
        style={compact ? undefined : { maskImage: `linear-gradient(to right, ${edges.left ? "transparent, black 16px" : "black"}, ${edges.right ? "black calc(100% - 16px), transparent" : "black"})` }}
        onFocusCapture={(event) => {
          if (!compact) event.target.scrollIntoView({ block: "nearest", inline: "nearest" });
        }}>
        {layout.strip.map((pin) => stripPin(pin))}
      </div>
      {/* ⋯ sits outside the scrolling row, flush with the composer's right edge, so pins scroll under its fade and it never moves. */}
      <Popover open={moreOpen} onOpenChange={setMoreOpen}>
        <PopoverTrigger asChild><button type="button" aria-label={moreLabel} title="More pins" className={cn(moreClass, "-mr-1 cursor-pointer")}><Icon name="MoreHorizontal" className="size-4" /></button></PopoverTrigger>
        <PopoverContent aria-label="More pins" className={cn("p-1", compact ? "w-[calc(100vw-2rem)]" : "w-56")}>
          {listed.length ? <div className="max-h-64 overflow-y-auto">{listed.map((pin) => listRow(pin))}</div>
            : <p className="px-2 py-[0.3125rem] text-xs text-muted-foreground">All pins are showing</p>}
        </PopoverContent>
      </Popover>
    </section>}
    {/* Mirrors the strip row with every pin at its natural width, plus ⋯ and the minimum pin, to measure what fits. */}
    <div ref={measureRow} aria-hidden="true" className="pointer-events-none invisible absolute inset-x-0 top-0 flex h-0 items-center gap-1 overflow-hidden px-1">
      {pins.map((pin) => <span key={pin.id} data-pin-id={pin.id} className={cn(pinClass, "shrink-0", !isUrlPin(pin) && pin.status === "missing" && "pr-4")}>
        {isUrlPin(pin) && showsPrState(pin.url) ? <span className="flex shrink-0 gap-0.5"><span className="size-3.5" /><span className="size-3.5" /></span> : <span className="size-3.5 shrink-0" />}
        <span className="truncate">{pinLabel(pin)}</span>
      </span>)}
      <span data-measure="more" className={moreClass}><Icon name="MoreHorizontal" className="size-4" /></span>
      <span data-measure="min" className={cn(PIN_MIN_WIDTH_CLASS, "shrink-0")} />
    </div>
  </div></TooltipProvider>;
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
      <Button type="button" variant="ghost" size="icon" className="size-7 text-muted-foreground" aria-label="Pin"
        // Narrow composers collapse their action row on blur; keep it, and the editor's cursor, until the click lands.
        onMouseDown={(event) => event.preventDefault()}
        onClick={start}>
        <Icon name="Pin" className="size-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Pin</TooltipContent>
  </Tooltip></TooltipProvider>;
}
export default definePluginApp((app) => {
  app.composer.customize({
    id: "file-pins", scopes: ["thread"],
    banners: [{ id: "pins", chrome: "bare", component: PinsBanner }],
    actions: [{ id: "pin-files", component: PinAction }],
  });
});
