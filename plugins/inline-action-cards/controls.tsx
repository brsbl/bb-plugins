import type { ReactNode } from "react";
import * as Menu from "@radix-ui/react-dropdown-menu";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Button, type ButtonProps } from "./components/ui/button.js";
import { cn } from "./lib/utils.js";

export function ActionButton({ className, ...props }: ButtonProps) {
  return <Button size="sm" variant="ghost" {...props} className={cn("h-7 px-2", className)} />;
}
export function PendingButton({ children, pending, pendingLabel, ...props }: ButtonProps & { pending: boolean; pendingLabel: string }) {
  return <ActionButton {...props} disabled={props.disabled || pending} aria-busy={pending || undefined}>
    <span className="iac-button-label">
      <span aria-hidden={pending} style={{ visibility: pending ? "hidden" : "visible" }}>{children}</span>
      <span className="iac-progress" aria-hidden={!pending} style={{ visibility: pending ? "visible" : "hidden" }}>{pendingLabel}</span>
    </span>
  </ActionButton>;
}
export function IconButton({ label, children, ...props }: ButtonProps & { label: string; children: ReactNode }) {
  return <Tooltip.Provider delayDuration={250}><Tooltip.Root>
    <Tooltip.Trigger asChild><ActionButton {...props} className="iac-icon" aria-label={label}>{children}</ActionButton></Tooltip.Trigger>
    <Tooltip.Content className="iac-tooltip" sideOffset={5}>{label}</Tooltip.Content>
  </Tooltip.Root></Tooltip.Provider>;
}
export function MoreMenu({ children, disabled }: { children: ReactNode; disabled?: boolean }) {
  return <Menu.Root><Menu.Trigger asChild><ActionButton className="iac-icon" aria-label="More actions" disabled={disabled}>⋯</ActionButton></Menu.Trigger>
    <Menu.Content className="iac-menu" align="end" sideOffset={5}>{children}</Menu.Content>
  </Menu.Root>;
}
export function MenuAction({ children, onSelect }: { children: ReactNode; onSelect: () => void }) {
  return <Menu.Item className="iac-menu-item" onSelect={onSelect}>{children}</Menu.Item>;
}
export function ClockIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>; }
export function SkipIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>; }
