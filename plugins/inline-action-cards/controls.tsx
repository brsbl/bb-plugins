import type { ReactNode, Ref } from "react";
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
export function IconButton({ label, children, ...props }: ButtonProps & { label: string; children: ReactNode; ref?: Ref<HTMLButtonElement> }) {
  return <Tooltip.Provider delayDuration={250}><Tooltip.Root>
    <Tooltip.Trigger asChild><ActionButton {...props} className="iac-icon" aria-label={label}>{children}</ActionButton></Tooltip.Trigger>
    <Tooltip.Content className="iac-tooltip" sideOffset={5}>{label}</Tooltip.Content>
  </Tooltip.Root></Tooltip.Provider>;
}
export function ClockIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>; }
export function SkipIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>; }
export function CommentIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14.5a1.5 1.5 0 0 1-1.5 1.5H9l-4 3.5v-13A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5z"/></svg>; }
export function SendIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>; }
export function ResendIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5"/></svg>; }
export function UndoIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>; }
export function EditIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9a2.83 2.83 0 0 0-4-4L4 16v4zM13.5 6.5l4 4"/></svg>; }
export function DraftIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>; }
