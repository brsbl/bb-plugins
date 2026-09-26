import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckGlyph } from "../art";
import { PLUGIN_SCOPE } from "../slots";

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  checked?: boolean;
  run: () => void;
}

export type MenuEntry = MenuItem | "separator" | { heading: string };

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
    const dismiss = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event.target instanceof Node && ref.current?.contains(event.target)) return;
      onClose();
    };
    window.addEventListener("pointerdown", dismiss, true);
    window.addEventListener("keydown", dismiss, true);
    window.addEventListener("blur", onClose);
    return () => {
      window.removeEventListener("pointerdown", dismiss, true);
      window.removeEventListener("keydown", dismiss, true);
      window.removeEventListener("blur", onClose);
    };
  }, [menu, onClose]);

  const list = (
    <div className="bbd-menu-list">
      {menu.entries.map((entry, index) =>
        entry === "separator" ? (
          <div key={`separator-${index}`} className="bbd-menu-separator" role="separator" />
        ) : "heading" in entry ? (
          <div key={`heading-${index}`} className="bbd-menu-label">
            {entry.heading}
          </div>
        ) : (
          <button
            key={`${entry.label}-${index}`}
            type="button"
            role={entry.checked === undefined ? "menuitem" : "menuitemradio"}
            aria-checked={entry.checked}
            className="bbd-menu-item disabled:text-muted-foreground"
            disabled={entry.disabled}
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
        ),
      )}
    </div>
  );

  return (
    <div
      ref={ref}
      {...PLUGIN_SCOPE}
      role="menu"
      className="bbd-root bbd-menu"
      style={{ left: position.x, top: position.y }}
      onContextMenu={(event) => event.preventDefault()}
    >
      {list}
    </div>
  );
}
