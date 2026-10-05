import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export type MenuEntry = {
  label: string;
  onSelect(): void;
  /** Renders a menuitemcheckbox with a switch showing this state. */
  checked?: boolean;
  disabled?: boolean;
};

function DotsIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="3.5" cy="8" r="1.25" />
      <circle cx="8" cy="8" r="1.25" />
      <circle cx="12.5" cy="8" r="1.25" />
    </svg>
  );
}

/** A ⋯ button that opens a small menu. Closes on selection, Escape, or a click outside. */
export function Menu({ label, entries, className = "" }: { label: string; entries: MenuEntry[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && root.current?.contains(event.target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    root.current?.querySelector<HTMLElement>("[role^='menuitem']:not(:disabled)")?.focus();
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = [...(root.current?.querySelectorAll<HTMLElement>("[role^='menuitem']:not(:disabled)") ?? [])];
    const index = items.findIndex((item) => item === document.activeElement);
    const step = event.key === "ArrowDown" ? 1 : -1;
    items[(index + step + items.length) % items.length]?.focus();
  };

  return (
    <div ref={root} className={`cm-menu ${className}`} onKeyDown={onKeyDown}>
      <button ref={trigger} type="button" className="cm-menu-trigger" aria-label={label} aria-haspopup="menu"
        aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={() => setOpen((value) => !value)}>
        <DotsIcon />
      </button>
      {open && (
        <div id={menuId} role="menu" aria-label={label} className="cm-menu-list">
          {entries.map((entry) => (
            <button key={entry.label} type="button" role={entry.checked === undefined ? "menuitem" : "menuitemcheckbox"}
              aria-checked={entry.checked} disabled={entry.disabled} className="cm-menu-item"
              onClick={() => { setOpen(false); entry.onSelect(); }}>
              <span>{entry.label}</span>
              {entry.checked !== undefined && (
                <span aria-hidden="true" className="cm-switch" data-state={entry.checked ? "checked" : "unchecked"}><span /></span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
