import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type ReactElement, type RefObject } from "react";
import { definePluginApp, experimental_FileLink as FileLink, UrlLink, useBbNavigate, useComposer, useRealtime, useRealtimeConnectionState, useRpc } from "@get-bb/plugin-sdk/app";
import { toast } from "sonner";
import { PIN_MENTION, isUrlPin, type FileReference, type Reference, type UrlPin, type rpcContract } from "./contract.js";
import { Button } from "./components/ui/button.js";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "./components/ui/context-menu.js";
import { usePointerCoarse } from "./components/ui/hooks/use-pointer-coarse.js";
import { Icon } from "./components/ui/icon.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip.js";
import { previewTarget } from "./open-target.js";
import { edgeMask, useSwipeStrip } from "./pin-strip.js";
import { pinTooltip } from "./pin-tooltip.js";
import { LinkPreviewCard, PREVIEW_HOLD_MS, preparePreview } from "./link-preview-card.js";
import { pinLabel } from "./pin-label.js";
import { PreviewAddress } from "./preview-address.js";
import { previewKey } from "./preview-client.js";
import { ReferenceIcon } from "./reference-icon.js";
import { prStateLabel, UrlPinIcon, usePrStateAnswers } from "./url-pin-icon.js";
import { cn } from "./lib/utils.js";

const linkClass = `group inline-flex h-7 min-w-0 items-center gap-1.5 rounded px-1.5 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`;
// bb's composer-stack card chrome at chip scale, kept quiet: a hairline at rest, a shadow on hover.
const pinClass = cn(linkClass, "rounded-md border border-border-seam bg-surface-raised-solid transition-shadow hover:shadow-xs");
// Desktop Unpin: on hover or keyboard focus a × covers the pin's icon, as Safari's tab bar does, so the label
// stays readable and nothing shifts. Touch screens long-press the pin for its menu instead.
const unpinClass = "absolute inset-y-px left-px flex w-6 items-center justify-center rounded-l-[5px] bg-surface-raised-solid text-muted-foreground opacity-0 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/pin:opacity-100 group-has-[:focus-visible]/pin:opacity-100 pointer-coarse:hidden";
const noMotion = { animation: "none", transition: "none" };
const menuClass = "min-w-40 p-1";
type PinAction = { label: string; disabled?: boolean; run(): void };
async function copyText(text: string, copied: string, failed: string) {
  try { await navigator.clipboard.writeText(text); toast.success(copied); } catch { toast.error(failed); }
}
function plainClick(event: MouseEvent<HTMLAnchorElement>) {
  return !event.defaultPrevented && event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}
function PinIcon({ threadId, pin }: { threadId: string; pin: Reference }) {
  return isUrlPin(pin) ? <UrlPinIcon threadId={threadId} pin={pin} /> : <ReferenceIcon path={pin.path} muted={pin.status === "missing"} />;
}

const tipClass = "w-72 rounded-lg border bg-popover p-0 text-popover-foreground shadow-lg";
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
    <TooltipTrigger asChild onPointerEnter={() => void prepare()} onFocus={() => { setFocused(true); void prepare(); }} onBlur={() => setFocused(false)}>{trigger}</TooltipTrigger>
    <TooltipContent side="top" sideOffset={6} className={tipClass}>
      <PreviewAddress value={address} focused={focused} />
      {card}
    </TooltipContent>
  </Tooltip>;
}

function FileTooltip({ trigger, address, card }: { trigger: ReactElement; address: string; card: ReactElement }) {
  const [focused, setFocused] = useState(false);
  return <Tooltip>
    <TooltipTrigger asChild onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>{trigger}</TooltipTrigger>
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
  const [threadHostId, setThreadHostId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // A touch long-press opens a pin's menu; the click that ends that same press must not also open the pin.
  const pressedAt = useRef(0);
  const menuOpenedAt = useRef(0);
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
      if (alive.current && request === generation.current) { setPins(result.pins); setThreadHostId(result.threadHostId); }
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
  // Every pin keeps its whole label in one row that scrolls sideways at every width. Legacy
  // hand-hidden preferences are ignored; all saved pins show in their stored order.
  const scrollRow = useRef<HTMLDivElement>(null);
  const edges = useSwipeStrip(scrollRow, pins.map((pin) => pin.id).join("\n"));
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
  function actions(pin: Reference): PinAction[] {
    return [{ label: "Unpin", disabled: busy, run: () => void remove(pin) }];
  }
  // bb's FileLink menu items that the public SDK can reproduce, then this plugin's actions.
  // "Open with" and "Open in" need core-only openers and local app targets, so they are left out.
  // A URL opens the way bb opens links: its browser preference, else a new tab.
  function openUrl(pin: UrlPin) {
    if (!navigate.openUrl(pin.url)) window.open(pin.url, "_blank", "noopener,noreferrer");
  }
  function menuGroups(pin: Reference): PinAction[][] {
    if (isUrlPin(pin)) return [
      [{ label: "Open", run: () => openUrl(pin) }],
      [{ label: "Copy link", run: () => void copyText(pin.url, "Link copied", "Failed to copy link") }],
      actions(pin),
    ];
    if (pin.status === "missing") return [actions(pin)];
    const file = { target: { kind: "host" as const, hostId: pin.hostId, path: pin.path }, location: null };
    const preview = previewTarget(pin, threadHostId);
    return [
      [
        { label: "Open preview", run: () => {
          if (preview) navigate.experimental_openFilePreview({ target: preview, location: null }); else elsewhere(pin);
        } },
        { label: "Open externally", disabled: pin.status !== "available", run: () => navigate.experimental_openFileExternally(file) },
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
        {group.map((action) => <ContextMenuItem key={action.label} disabled={action.disabled} onSelect={action.run}>{action.label}</ContextMenuItem>)}
      </Fragment>)}
    </ContextMenuContent>;
  }
  function stripPin(pin: Reference) {
    const link = isUrlPin(pin) ? <UrlLink href={pin.url} aria-label={openLabel(pin)} className={cn(pinClass, "cursor-pointer")}>
      <PinIcon threadId={threadId} pin={pin} /><span className="truncate group-hover:underline">{pinLabel(pin)}</span>
    </UrlLink> : pin.status === "missing" ? <span className="relative inline-flex min-w-0">
      <span aria-label={`${pin.name} (missing)`} className={cn(pinClass, "cursor-default pr-4 text-destructive/55 hover:text-destructive/55")}>
        <ReferenceIcon path={pin.path} muted /><span className="truncate">{pinLabel(pin)}</span><span className="sr-only"> (missing)</span>
      </span>
      <button type="button" disabled={busy} aria-label={`Unpin missing ${pin.name}`} onClick={() => void remove(pin)}
        className="absolute right-0.5 top-0.5 flex size-3.5 items-center justify-center rounded-sm text-xs leading-none text-muted-foreground/70 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">×</button>
    </span> : <FileLink target={linkTarget(pin)} onClick={(event) => open(pin, event)}
      aria-label={openLabel(pin)} className={cn(pinClass, pin.status === "available" ? "cursor-pointer" : "[&>*]:opacity-60")}><PinIcon threadId={threadId} pin={pin} /><span className="truncate group-hover:underline">{pinLabel(pin)}</span></FileLink>;
    const missing = !isUrlPin(pin) && pin.status === "missing";
    return <ContextMenu key={pin.id} onOpenChange={(open) => { menuOpenedAt.current = open ? performance.now() : 0; }}>
      <span className="group/pin relative inline-flex min-w-0 select-none [-webkit-touch-callout:none]"
        onPointerDownCapture={() => { pressedAt.current = performance.now(); }}
        onKeyDownCapture={() => { pressedAt.current = performance.now(); }}
        onClickCapture={(event) => { if (menuOpenedAt.current > pressedAt.current) { event.preventDefault(); event.stopPropagation(); } }}>
        {withTooltip(pin, <ContextMenuTrigger asChild>{link}</ContextMenuTrigger>)}
        {!missing && <button type="button" aria-label={`Unpin ${pin.name}`} title="Unpin" disabled={busy} className={unpinClass} onClick={() => void remove(pin)}><Icon name="X" className="size-3.5" /></button>}
      </span>
      {contextMenu(pin)}
    </ContextMenu>;
  }
  return <TooltipProvider delayDuration={300}><div ref={root} className="relative min-w-0">
    {/* bb's composer fade, repeated above the flat strip so text scrolling under it doesn't end in a hard edge. */}
    {fade && <span aria-hidden="true" data-overflow-fade="above" className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-b from-transparent to-background" />}
    {pins.length > 0 && <section aria-label="Pinned files and links" className="flex min-w-0 items-center overflow-hidden rounded-lg px-1 py-1">
      {/* Edge fades show only on sides with more pins; focus scrolls a pin clear of them. */}
      <div ref={scrollRow} data-pin-strip=""
        className="-m-0.5 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 [&>*]:scroll-mx-4"
        style={{ maskImage: edgeMask(edges) }}
        onFocusCapture={(event) => {
          // Keyboard focus only: a pointer press focuses too, and scrolling then would move the pin out from under the click.
          // The pin's wrapper carries the scroll margin that keeps it clear of the fades.
          if (event.target.matches(":focus-visible")) event.target.closest("[data-pin-strip] > *")?.scrollIntoView({ block: "nearest", inline: "nearest" });
        }}>
        {pins.map((pin) => stripPin(pin))}
      </div>
    </section>}
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
