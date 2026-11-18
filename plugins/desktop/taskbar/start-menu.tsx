import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronRightGlyph, DetailsArt, PowerGlyph } from "../art";
import { toggleDesktop } from "../enabled";
import { useLaunchers, type Launcher } from "../programs/launchers";
import { useDesktop } from "../shell/data";
import { useMenu } from "../shell/menu";
import { PLUGIN_SCOPE } from "../slots";
import { quickLaunchToggleEntry } from "./quick-launch";

export function StartFlag() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path d="M2 3.2 Q4.8 2 8.2 3.4 L7.4 8.2 Q4.2 7 1.4 8 Z" fill="oklch(0.66 0.21 30)" />
      <path d="M9.4 3.8 Q12.6 5 16 3.6 L15.2 8.4 Q12 9.6 8.6 8.6 Z" fill="oklch(0.74 0.19 140)" />
      <path d="M1.2 9.2 Q4 8.2 7.2 9.4 L6.4 14.2 Q3.4 13 0.4 14 Z" fill="oklch(0.62 0.18 250)" />
      <path d="M8.4 9.8 Q11.6 11 15 9.6 L14.2 14.4 Q11 15.6 7.6 14.6 Z" fill="oklch(0.86 0.16 90)" />
    </svg>
  );
}

export function StartMenu({ onClose }: { onClose: () => void }) {
  const desktop = useDesktop();
  const menu = useMenu();
  const { apps, launcher } = useLaunchers();
  const [appsOpen, setAppsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || (target as Element).closest?.(".bbd-start, .bbd-start-flyout")) return;
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);
  const run = (action: () => void) => () => {
    onClose();
    action();
  };
  const programs = (["finder", "internet-explorer", "new-thread", "new-folder", "media-player", "sticky-note"] as const).map(launcher);
  const places: { section: string; items: Launcher[] }[] = [
    { section: "Accessories", items: [launcher("paint"), launcher("command-prompt")] },
    { section: "Games", items: [launcher("minesweeper"), launcher("solitaire"), launcher("pinball"), launcher("maze")] },
    { section: "", items: [launcher("search"), launcher("run")] },
  ];
  const itemProps = (item: Launcher, inFlyout = false) => ({
    type: "button" as const,
    // Pointing at any other Start menu row closes the Apps list, as XP's cascading menus do.
    ...(inFlyout ? {} : { onPointerEnter: () => setAppsOpen(false) }),
    role: "menuitem",
    title: "Right-click to add to Quick Launch",
    onClick: run(item.run),
    onContextMenu: (event: ReactMouseEvent) => menu.open(event, [quickLaunchToggleEntry(desktop, item.id)]),
  });
  return (
    <div ref={menuRef} className="bbd-start-menu" role="menu" aria-label="Start menu">
      <div className="bbd-start-head">
        <span className="bbd-start-avatar">
          <StartFlag />
        </span>
        <span>bb</span>
      </div>
      <div className="bbd-start-columns">
        <div className="bbd-start-body">
          {programs.map((item) => (
            <button key={item.id} className="bbd-start-item" {...itemProps(item)}>
              {item.art(30)}
              <span>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </span>
            </button>
          ))}
          <AppsFlyout open={appsOpen} setOpen={setAppsOpen} create={launcher("new-app")} apps={apps} itemProps={(item) => itemProps(item, true)} />
        </div>
        <div className="bbd-start-places">
          {places.map((group, index) => (
            <div key={group.section || index} className="grid">
              {group.section === "" ? <div className="bbd-start-rule" aria-hidden /> : <span className="bbd-start-section">{group.section}</span>}
              {group.items.map((item) => (
                <button key={item.id} className="bbd-start-place" {...itemProps(item)}>
                  {item.art(22)}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="bbd-start-foot">
        <button type="button" role="menuitem" className="bbd-start-off" onClick={run(toggleDesktop)}>
          <span className="bbd-start-power" aria-hidden>
            <PowerGlyph className="size-3.5" strokeWidth={2.5} />
          </span>
          Turn Off Desktop
        </button>
      </div>
    </div>
  );
}

type ItemProps = (item: Launcher) => Record<string, unknown>;

/**
 * Where XP had All Programs: one row that opens New app and every app other plugins registered, A–Z.
 * With no apps yet, the row is New app itself.
 * The list lives beside the menu and scrolls, so the Start menu keeps its size however many apps there are.
 */
function AppsFlyout({ open, setOpen, create, apps, itemProps }: {
  open: boolean;
  setOpen: (open: boolean) => void;
  create: Launcher;
  apps: Launcher[];
  itemProps: ItemProps;
}) {
  const rowRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; bottom: number; maxHeight: number } | null>(null);
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!open || row === null) return;
    const box = row.getBoundingClientRect();
    const bottom = Math.max(4, window.innerHeight - box.bottom - 5);
    // Cap at the space above the anchor so a long list scrolls instead of running off the top.
    setPosition({ left: box.right + 2, bottom, maxHeight: window.innerHeight - bottom - 8 });
  }, [open]);
  const sorted = [...apps].sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: "base", numeric: true }));
  const show = (focus: boolean) => {
    setOpen(true);
    if (focus) requestAnimationFrame(() => listRef.current?.querySelector<HTMLButtonElement>("button")?.focus());
  };
  // Until there is an app, the row is New app itself, faintly tinted to draw the eye.
  if (apps.length === 0) {
    return (
      <>
        <div className="bbd-start-rule my-1" aria-hidden />
        <button className="bbd-start-item bbd-start-item-new" {...itemProps(create)}>
          {create.art(30)}
          <span>
            <strong>{create.label}</strong>
            <small>{create.detail}</small>
          </span>
        </button>
      </>
    );
  }
  return (
    <>
      <div className="bbd-start-rule my-1" aria-hidden />
      <button
        ref={rowRef}
        type="button"
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={open}
        className="bbd-start-all"
        data-open={open || undefined}
        onPointerEnter={() => show(false)}
        onClick={() => show(true)}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            show(true);
          }
        }}
      >
        <DetailsArt size={30} />
        <span className="flex-1">Apps</span>
        <ChevronRightGlyph className="bbd-start-all-arrow size-3.5" strokeWidth={2.5} />
      </button>
      {open && position !== null
        ? createPortal(
            <div
              ref={listRef}
              {...PLUGIN_SCOPE}
              role="menu"
              aria-label="Apps"
              className="bbd-root bbd-start-flyout"
              style={{ left: position.left, bottom: position.bottom, maxHeight: position.maxHeight }}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  setOpen(false);
                  rowRef.current?.focus();
                }
              }}
            >
              {[create, ...sorted].map((item, index) => [
                index === 1 ? <div key="rule" className="bbd-start-rule my-1" aria-hidden /> : null,
                <button key={item.id} className="bbd-start-place" {...itemProps(item)}>
                  {item.art(22)}
                  <span>{item.label}</span>
                </button>,
              ])}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
