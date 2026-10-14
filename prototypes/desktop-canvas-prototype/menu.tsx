import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { experimental_Icon as Icon } from "@get-bb/plugin-sdk/app";
import { Button } from "./components/ui/button";
import { useDesktop, type DesktopContextValue } from "./data";

/** Desktop's right-click menus and its small name prompt, in bb's own styling. */

export const PLUGIN_SCOPE = { "data-bb-plugin": "desktop-canvas-prototype" } as const;

export interface MenuItem {
  label: string;
  icon?: string;
  disabled?: boolean;
  checked?: boolean;
  /** Shown at the right edge, like a keyboard shortcut. */
  hint?: string;
  /** For settings toggles: the menu stays open and redraws with the new state. */
  keepOpen?: boolean;
  run: () => void;
}

/** A row that opens its own list beside the menu. */
export interface MenuSubmenu {
  label: string;
  icon?: string;
  submenu: MenuEntry[];
}

export type MenuEntry = MenuItem | MenuSubmenu | "separator" | { heading: string };

/** A menu's rows, or a function that builds them from the latest desktop state each time the menu redraws. */
export type MenuSource = MenuEntry[] | ((desktop: DesktopContextValue) => MenuEntry[]);

/** A right-click, or a button standing in for one, that opens a menu at a point. */
export type MenuTrigger = Pick<MouseEvent, "clientX" | "clientY" | "preventDefault" | "stopPropagation">;

interface MenuApi {
  open: (event: MenuTrigger, entries: MenuSource) => void;
  /** Opens beside a button, aligned to its left edge: below it, or above it for the dock. */
  openFrom: (element: HTMLElement, entries: MenuSource, side?: "below" | "above") => void;
}

const MenuContext = createContext<MenuApi | null>(null);

export function useMenu(): MenuApi {
  const menu = useContext(MenuContext);
  if (menu === null) throw new Error("useMenu outside MenuProvider");
  return menu;
}

interface MenuState {
  x: number;
  y: number;
  entries: MenuSource;
  /** For menus opened from a button: the button's top, when the menu opens above it. */
  above?: number;
}

export function MenuProvider({ children }: { children: ReactNode }) {
  const desktop = useDesktop();
  const [menu, setMenu] = useState<MenuState | null>(null);
  const close = useCallback(() => setMenu(null), []);
  const api = useMemo<MenuApi>(
    () => ({
      open(event, entries) {
        event.preventDefault();
        event.stopPropagation();
        setMenu({ x: event.clientX, y: event.clientY, entries });
      },
      openFrom(element, entries, side = "below") {
        const bounds = element.getBoundingClientRect();
        setMenu(side === "below" ? { x: bounds.left, y: bounds.bottom + 4, entries } : { x: bounds.left, y: bounds.top, above: bounds.top - 6, entries });
      },
    }),
    [],
  );
  return (
    <MenuContext.Provider value={api}>
      {children}
      {menu === null ? null : createPortal(<ContextMenu menu={menu} entries={typeof menu.entries === "function" ? menu.entries(desktop) : menu.entries} onClose={close} />, document.body)}
    </MenuContext.Provider>
  );
}

function ContextMenu({ menu, entries, onClose }: { menu: MenuState; entries: MenuEntry[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: menu.x, y: menu.y });

  useLayoutEffect(() => {
    const element = ref.current;
    if (element === null) return;
    const box = element.getBoundingClientRect();
    const y = menu.above === undefined ? menu.y : menu.above - box.height;
    setPosition({
      x: Math.max(4, Math.min(menu.x, window.innerWidth - box.width - 4)),
      y: Math.max(4, Math.min(y, window.innerHeight - box.height - 4)),
    });
    element.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
  }, [menu]);

  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest(".cdc-menu") !== null) return;
      onClose();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };
    window.addEventListener("pointerdown", dismiss, true);
    window.addEventListener("keydown", escape, true);
    window.addEventListener("blur", onClose);
    return () => {
      window.removeEventListener("pointerdown", dismiss, true);
      window.removeEventListener("keydown", escape, true);
      window.removeEventListener("blur", onClose);
    };
  }, [onClose]);

  return (
    <div ref={ref} {...PLUGIN_SCOPE} role="menu" className="cdc-menu" style={{ left: position.x, top: position.y }} onContextMenu={(event) => event.preventDefault()}>
      <MenuList entries={entries} onClose={onClose} />
    </div>
  );
}

function MenuList({ entries, onClose, onBack }: { entries: MenuEntry[]; onClose: () => void; onBack?: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [focusSubmenu, setFocusSubmenu] = useState(false);
  const buttons = useRef(new Map<number, HTMLButtonElement>());

  const openSubmenu = (index: number, focus: boolean) => {
    const button = buttons.current.get(index);
    if (button === undefined) return;
    setAnchor(button.getBoundingClientRect());
    setOpenIndex(index);
    setFocusSubmenu(focus);
  };
  const closeSubmenu = () => {
    if (openIndex !== null) buttons.current.get(openIndex)?.focus();
    setOpenIndex(null);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest(".cdc-menu-list") !== event.currentTarget) return;
    const items = [...buttons.current.entries()].filter(([, button]) => !button.disabled).sort(([a], [b]) => a - b);
    const current = items.findIndex(([, button]) => button === document.activeElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : items.length - 1;
      items[(current + step) % items.length]?.[1].focus();
    } else if (event.key === "ArrowRight" && current !== -1) {
      const index = items[current]![0];
      const entry = entries[index];
      if (typeof entry === "object" && "submenu" in entry) {
        event.preventDefault();
        openSubmenu(index, true);
      }
    } else if (event.key === "ArrowLeft" && onBack !== undefined) {
      event.preventDefault();
      onBack();
    }
  };

  const open = openIndex === null ? null : entries[openIndex];
  return (
    <div className="cdc-menu-list" onKeyDown={onKeyDown}>
      {entries.map((entry, index) => {
        if (entry === "separator") return <div key={`separator-${index}`} className="cdc-menu-separator" role="separator" />;
        if ("heading" in entry) return <div key={`heading-${index}`} className="cdc-menu-heading">{entry.heading}</div>;
        const ref = (button: HTMLButtonElement | null) => {
          if (button === null) buttons.current.delete(index);
          else buttons.current.set(index, button);
        };
        if ("submenu" in entry) {
          return (
            <button key={`${entry.label}-${index}`} ref={ref} type="button" role="menuitem" aria-haspopup="menu" aria-expanded={openIndex === index}
              className="cdc-menu-item" data-open={openIndex === index || undefined} disabled={entry.submenu.length === 0}
              onPointerEnter={() => openSubmenu(index, false)} onClick={() => openSubmenu(index, true)}>
              <span className="cdc-menu-icon">{entry.icon ? <Icon name={entry.icon} /> : null}</span>
              <span className="cdc-menu-label">{entry.label}</span>
              <Icon name="ChevronRight" className="cdc-menu-chevron" />
            </button>
          );
        }
        return (
          <button key={`${entry.label}-${index}`} ref={ref} type="button" role={entry.checked === undefined ? "menuitem" : "menuitemradio"} aria-checked={entry.checked}
            className="cdc-menu-item" disabled={entry.disabled} onPointerEnter={() => setOpenIndex(null)}
            onClick={() => {
              if (!entry.keepOpen) onClose();
              entry.run();
            }}>
            <span className="cdc-menu-icon">{entry.checked ? <Icon name="Check" /> : entry.icon ? <Icon name={entry.icon} /> : null}</span>
            <span className="cdc-menu-label">{entry.label}</span>
            {entry.hint ? <kbd className="cdc-menu-hint">{entry.hint}</kbd> : null}
          </button>
        );
      })}
      {open !== null && typeof open === "object" && "submenu" in open && anchor !== null ? (
        <Submenu key={openIndex} anchor={anchor} entries={open.submenu} focus={focusSubmenu} onClose={onClose} onBack={closeSubmenu} />
      ) : null}
    </div>
  );
}

/** A cascading list beside its row: to the right when it fits, else to the left, kept on screen vertically. */
function Submenu({ anchor, entries, focus, onClose, onBack }: { anchor: DOMRect; entries: MenuEntry[]; focus: boolean; onClose: () => void; onBack: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: anchor.right, y: anchor.top - 5 });
  useLayoutEffect(() => {
    const element = ref.current;
    if (element === null) return;
    const box = element.getBoundingClientRect();
    const right = anchor.right + 2;
    const x = right + box.width <= window.innerWidth - 4 ? right : Math.max(4, anchor.left - box.width - 2);
    const y = Math.max(4, Math.min(anchor.top - 5, window.innerHeight - box.height - 4));
    setPosition({ x, y });
  }, [anchor]);
  useEffect(() => {
    if (focus) ref.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
  }, [focus]);
  return createPortal(
    <div ref={ref} {...PLUGIN_SCOPE} role="menu" className="cdc-menu cdc-submenu" style={{ left: position.x, top: position.y }} onContextMenu={(event) => event.preventDefault()}>
      <MenuList entries={entries} onClose={onClose} onBack={onBack} />
    </div>,
    document.body,
  );
}

// A one-field prompt, for names.

interface AskRequest {
  title: string;
  label: string;
  initial: string;
  confirm: string;
  resolve: (value: string | null) => void;
}

type AskText = (request: { title: string; label: string; initial?: string; confirm?: string }) => Promise<string | null>;

const AskContext = createContext<AskText | null>(null);

export function useAskText(): AskText {
  const ask = useContext(AskContext);
  if (ask === null) throw new Error("useAskText outside AskTextProvider");
  return ask;
}

export function AskTextProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<AskRequest | null>(null);
  const ask = useCallback<AskText>(
    ({ title, label, initial = "", confirm = "Save" }) =>
      new Promise((resolve) => {
        setRequest((current) => {
          current?.resolve(null);
          return { title, label, initial, confirm, resolve };
        });
      }),
    [],
  );
  const finish = (value: string | null) => {
    request?.resolve(value);
    setRequest(null);
  };
  return (
    <AskContext.Provider value={ask}>
      {children}
      {request === null ? null : <AskDialog key={request.title + request.initial} request={request} onFinish={finish} />}
    </AskContext.Provider>
  );
}

function AskDialog({ request, onFinish }: { request: AskRequest; onFinish: (value: string | null) => void }) {
  const [value, setValue] = useState(request.initial);
  return createPortal(
    <div {...PLUGIN_SCOPE} className="cdc-dialog-scrim" onPointerDown={(event) => { if (event.target === event.currentTarget) onFinish(null); }}>
      <form className="cdc-dialog" role="dialog" aria-label={request.title}
        onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); onFinish(null); } }}
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = value.trim();
          if (trimmed !== "") onFinish(trimmed.slice(0, 80));
        }}>
        <label>
          <span>{request.label}</span>
          <input autoFocus maxLength={80} value={value} onFocus={(event) => event.target.select()} onChange={(event) => setValue(event.target.value)} />
        </label>
        <div>
          <Button type="button" variant="ghost" size="sm" onClick={() => onFinish(null)}>Cancel</Button>
          <Button type="submit" size="sm" disabled={value.trim() === ""}>{request.confirm}</Button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
