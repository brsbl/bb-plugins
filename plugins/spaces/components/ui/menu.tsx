// A small menu button with bb's dropdown-menu look (shared-ui at 1e2cee69ad), built on plain elements because this
// plugin doesn't depend on Radix. It renders in place, so it stays inside the plugin's styling scope.
import { experimental_Icon as Icon } from "@get-bb/plugin-sdk/app";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { cx } from "../lib/cx";
import { Button, type ButtonSize, type ButtonVariant } from "./button";

export interface MenuItem {
  id: string;
  label: string;
  /** Muted text at the row's end, such as a count. */
  detail?: string;
  onSelect(): void;
}

interface MenuProps {
  /** Accessible name of the menu, and of the trigger when it is icon-only. */
  label: string;
  items: readonly MenuItem[];
  /** Icon of an icon-only trigger. */
  icon?: string;
  /** Visible trigger text; replaces the icon. */
  text?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  /** Shown as the disabled trigger's tooltip. */
  disabledReason?: string;
  align?: "start" | "end";
}

const ITEM_SELECTOR = '[role="menuitem"]';

export function Menu({
  label,
  items,
  icon = "MoreHorizontal",
  text,
  variant = "ghost",
  size,
  disabled = false,
  disabledReason,
  align = "end",
}: MenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const itemNodes = () => [...(menuRef.current?.querySelectorAll<HTMLButtonElement>(ITEM_SELECTOR) ?? [])];

  useEffect(() => {
    if (!open) return;
    itemNodes()[0]?.focus();
    const onMouseDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const nodes = itemNodes();
    const index = nodes.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      nodes[(index + 1) % nodes.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      nodes[index <= 0 ? nodes.length - 1 : index - 1]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      nodes[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      nodes[nodes.length - 1]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  const trigger = (
    <Button
      ref={triggerRef}
      variant={variant}
      size={size ?? (text ? "xs" : "icon")}
      aria-label={text ? undefined : label}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? menuId : undefined}
      data-state={open ? "open" : "closed"}
      disabled={disabled}
      onClick={() => setOpen((current) => !current)}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown" && !open) {
          event.preventDefault();
          setOpen(true);
        }
      }}
    >
      {text ?? <Icon name={icon} aria-hidden />}
    </Button>
  );

  return (
    <div ref={rootRef} className="relative inline-flex">
      {disabled && disabledReason ? (
        <span className="inline-flex" title={disabledReason}>
          {trigger}
        </span>
      ) : (
        trigger
      )}
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className={cx(
            "absolute top-full z-30 mt-1 min-w-44 max-w-72 overflow-hidden rounded-md border border-border bg-popover p-1 text-left text-popover-foreground shadow-md",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                close();
                item.onSelect();
              }}
              className="flex min-h-7 w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-state-hover focus:bg-state-hover"
            >
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.detail ? <span className="shrink-0 text-xs text-muted-foreground">{item.detail}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
