import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckGlyph, ChevronRightGlyph } from "../art";
import { PLUGIN_SCOPE } from "../slots";

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  checked?: boolean;
  run: () => void;
}

/** A row that opens its own list beside the menu, as Windows' cascading menus do. */
export interface MenuSubmenu {
  label: string;
  icon?: ReactNode;
  submenu: MenuEntry[];
}

export type MenuEntry = MenuItem | MenuSubmenu | "separator" | { heading: string };

interface MenuState {
  x: number;
  y: number;
  entries: MenuEntry[];
}

/** A right-click or synthetic event that opens a menu at its pointer position. */
export type MenuTrigger = Pick<MouseEvent, "clientX" | "clientY" | "preventDefault" | "stopPropagation">;

interface MenuApi {
  open: (event: MenuTrigger, entries: MenuEntry[]) => void;
}

const MenuContext = createContext<MenuApi | null>(null);

export function useMenu(): MenuApi {
  const menu = useContext(MenuContext);
  if (menu === null) throw new Error("useMenu outside MenuProvider");
  return menu;
}

/** Owns the one open context menu and renders it over everything on `document.body`. */
export function MenuProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const close = useCallback(() => setMenu(null), []);
  const api = useMemo<MenuApi>(
    () => ({
      open(event, entries) {
        event.preventDefault();
        event.stopPropagation();
        setMenu({ x: event.clientX, y: event.clientY, entries });
      },
    }),
    [],
  );
  return (
    <MenuContext.Provider value={api}>
      {children}
      {menu === null ? null : createPortal(<ContextMenu menu={menu} onClose={close} />, document.body)}
    </MenuContext.Provider>
  );
}

function ContextMenu({ menu, onClose }: { menu: MenuState; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: menu.x, y: menu.y });

  useEffect(() => {
    const element = ref.current;
    if (element !== null) {
      const box = element.getBoundingClientRect();
      setPosition({
        x: Math.max(4, Math.min(menu.x, window.innerWidth - box.width - 4)),
        y: Math.max(4, Math.min(menu.y, window.innerHeight - box.height - 4)),
      });
      element.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    }
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest(".bbd-menu") !== null) return;
      onClose();
    };
    // Focus sits on the menu's first item, so Escape closes it from anywhere and stops there.
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
  }, [menu, onClose]);

  return (
    <div
      ref={ref}
      {...PLUGIN_SCOPE}
      role="menu"
      className="bbd-root bbd-menu"
      style={{ left: position.x, top: position.y }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <MenuList entries={menu.entries} onClose={onClose} />
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
    if (event.target instanceof Element && event.target.closest(".bbd-menu-list") !== event.currentTarget) return;
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
    <div className="bbd-menu-list" onKeyDown={onKeyDown}>
      {entries.map((entry, index) => {
        if (entry === "separator") return <div key={`separator-${index}`} className="bbd-menu-separator" role="separator" />;
        if ("heading" in entry) {
          return (
            <div key={`heading-${index}`} className="bbd-menu-label">
              {entry.heading}
            </div>
          );
        }
        const ref = (button: HTMLButtonElement | null) => {
          if (button === null) buttons.current.delete(index);
          else buttons.current.set(index, button);
        };
        if ("submenu" in entry) {
          return (
            <button
              key={`${entry.label}-${index}`}
              ref={ref}
              type="button"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={openIndex === index}
              className="bbd-menu-item disabled:text-muted-foreground"
              data-open={openIndex === index || undefined}
              disabled={entry.submenu.length === 0}
              onPointerEnter={() => openSubmenu(index, false)}
              onClick={() => openSubmenu(index, true)}
            >
              <span className="flex size-4 items-center justify-center">{entry.icon}</span>
              <span className="flex-1">{entry.label}</span>
              <ChevronRightGlyph className="bbd-menu-chevron size-3" strokeWidth={2} />
            </button>
          );
        }
        return (
          <button
            key={`${entry.label}-${index}`}
            ref={ref}
            type="button"
            role={entry.checked === undefined ? "menuitem" : "menuitemradio"}
            aria-checked={entry.checked}
            className="bbd-menu-item disabled:text-muted-foreground"
            disabled={entry.disabled}
            onPointerEnter={() => setOpenIndex(null)}
            onClick={() => {
              onClose();
              entry.run();
            }}
          >
            <span className="flex size-4 items-center justify-center">
              {entry.checked ? <CheckGlyph className="size-3.5" strokeWidth={2} /> : entry.icon}
            </span>
            {entry.label}
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
function Submenu({ anchor, entries, focus, onClose, onBack }: {
  anchor: DOMRect;
  entries: MenuEntry[];
  focus: boolean;
  onClose: () => void;
  onBack: () => void;
}) {
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
  // On `document.body`: the parent menu's backdrop filter would otherwise make it the fixed-position containing block.
  return createPortal(
    <div
      ref={ref}
      {...PLUGIN_SCOPE}
      role="menu"
      className="bbd-root bbd-menu bbd-submenu"
      style={{ left: position.x, top: position.y }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <MenuList entries={entries} onClose={onClose} onBack={onBack} />
    </div>,
    document.body,
  );
}
