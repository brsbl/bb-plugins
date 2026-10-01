import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface ProgramMenuItem {
  label: string;
  shortcut?: string;
  checked?: boolean;
  disabled?: boolean;
  action?: () => void;
}
export interface ProgramMenu {
  label: string;
  items: readonly (ProgramMenuItem | "separator")[];
}

/** The compact XP menu shared by the bundled programs. */
export function ProgramMenuBar({ menus }: { menus: readonly ProgramMenu[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const bar = useRef<HTMLElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const id = useId();
  const show = (index: number) => {
    const button = bar.current?.querySelectorAll("button")[index];
    if (!button) return;
    const rect = button.getBoundingClientRect();
    setPosition({ left: Math.min(rect.left, window.innerWidth - 240), top: rect.bottom });
    setOpen(index);
  };
  const close = () => {
    if (open !== null) bar.current?.querySelectorAll("button")[open]?.focus();
    setOpen(null);
  };
  useEffect(() => {
    if (open === null) return;
    popup.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !bar.current?.contains(event.target) && !popup.current?.contains(event.target)) setOpen(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close(); }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        show((open + (event.key === "ArrowRight" ? 1 : menus.length - 1)) % menus.length);
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, menus.length]);
  return <>
    <nav ref={bar} className="bbd-menubar bbd-program-menubar" aria-label="Program menu" role="menubar">
      {menus.map((menu, index) => <button key={menu.label} type="button" role="menuitem" aria-haspopup="menu" aria-expanded={open === index} aria-controls={open === index ? id : undefined}
        onClick={() => open === index ? close() : show(index)}
        onPointerEnter={() => { if (open !== null) show(index); }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") { event.preventDefault(); show(index); }
          if (open === null && (event.key === "ArrowRight" || event.key === "ArrowLeft")) {
            event.preventDefault(); bar.current?.querySelectorAll("button")[(index + (event.key === "ArrowRight" ? 1 : menus.length - 1)) % menus.length]?.focus();
          }
        }}>{menu.label}</button>)}
    </nav>
    {open !== null && createPortal(<div ref={popup} id={id} className="bbd-root bbd-program-menu" role="menu" aria-label={menus[open]!.label} style={position}
      onKeyDown={(event) => {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Home" && event.key !== "End") return;
        event.preventDefault();
        const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
        const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (current + (event.key === "ArrowDown" ? 1 : buttons.length - 1)) % buttons.length;
        buttons[next]?.focus();
      }}>
      {menus[open]!.items.map((item, index) => item === "separator" ? <hr key={index} role="separator" /> : <button key={index} type="button"
        role={item.checked === undefined ? "menuitem" : "menuitemcheckbox"} aria-checked={item.checked} disabled={item.disabled || !item.action}
        onClick={() => { close(); item.action?.(); }}><span aria-hidden>{item.checked ? "✓" : ""}</span><span>{item.label}</span><span>{item.shortcut}</span></button>)}
    </div>, document.body)}
  </>;
}

export function ProgramStatusBar({ children }: { children: ReactNode }) {
  return <footer className="bbd-statusbar bbd-program-status">{children}</footer>;
}
