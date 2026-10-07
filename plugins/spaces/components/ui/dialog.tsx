// A modal over the Space tab with bb's dialog look (shared-ui at 1e2cee69ad), on plain elements because this plugin
// doesn't depend on Radix. It covers the tab rather than the window, traps Tab, closes on Esc or a scrim click, and
// gives focus back to whatever had it.
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";

import { cx } from "../lib/cx";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  labelledBy: string;
  describedBy?: string;
  /** "alertdialog" for a confirmation. */
  role?: "alertdialog" | "dialog";
  onClose(): void;
  className?: string;
  children: ReactNode;
}

export function Dialog({ labelledBy, describedBy, role = "dialog", onClose, className, children }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onCloseRef.current();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;
    const nodes = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (!first || !last) {
      event.preventDefault();
    } else if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="absolute inset-0 z-40 flex items-start justify-center bg-surface-scrim p-3"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current();
      }}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cx(
          "flex max-h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg outline-none",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
