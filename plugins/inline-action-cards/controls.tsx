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
// Mail01 and Signpost from Hugeicons (free set, MIT), the icon family bb's built-in icons use.
export function MailIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 6L8.91302 9.91697C11.4616 11.361 12.5384 11.361 15.087 9.91697L22 6"/>
    <path d="M2.01577 13.4756C2.08114 16.5412 2.11383 18.0739 3.24496 19.2094C4.37608 20.3448 5.95033 20.3843 9.09883 20.4634C11.0393 20.5122 12.9607 20.5122 14.9012 20.4634C18.0497 20.3843 19.6239 20.3448 20.7551 19.2094C21.8862 18.0739 21.9189 16.5412 21.9842 13.4756C22.0053 12.4899 22.0053 11.5101 21.9842 10.5244C21.9189 7.45886 21.8862 5.92609 20.7551 4.79066C19.6239 3.65523 18.0497 3.61568 14.9012 3.53657C12.9607 3.48781 11.0393 3.48781 9.09882 3.53656C5.95033 3.61566 4.37608 3.65521 3.24495 4.79065C2.11382 5.92608 2.08114 7.45885 2.01576 10.5244C1.99474 11.5101 1.99475 12.4899 2.01577 13.4756Z"/></svg>;
}
export function SignpostIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11.9922 16.0001V21.0001M8.99219 21.0001H14.9922M11.9922 8.00012V11.0001"/>
    <path d="M15.9732 3.00012H10.457C9.53555 3.00012 9.07482 3.00012 8.73164 3.20108C8.50682 3.33274 8.32012 3.52209 8.19032 3.75012C7.99219 4.0982 7.99219 4.56551 7.99219 5.50012C7.99219 6.43474 7.99219 6.90205 8.19032 7.25012C8.32012 7.47815 8.50682 7.66751 8.73164 7.79916C9.07482 8.00012 9.53555 8.00012 10.457 8.00012H15.9732C16.3259 8.00012 16.5022 8.00012 16.6696 7.96008C16.7808 7.93347 16.8887 7.89388 16.9909 7.84209C17.1448 7.76414 17.2802 7.64965 17.5512 7.42068C18.3848 6.71608 18.8016 6.36378 18.9296 5.93195C19.0131 5.65029 19.0131 5.34995 18.9296 5.06829C18.8016 4.63646 18.3848 4.28416 17.5512 3.57957C17.2802 3.35059 17.1448 3.2361 16.9909 3.15815C16.8887 3.10636 16.7808 3.06677 16.6696 3.04016C16.5022 3.00012 16.3259 3.00012 15.9732 3.00012Z"/>
    <path d="M8.01273 11.0001H13.5273C14.4488 11.0001 14.9096 11.0001 15.2527 11.2011C15.4776 11.3327 15.6643 11.5221 15.7941 11.7501C15.9922 12.0982 15.9922 12.5655 15.9922 13.5001C15.9922 14.4347 15.9922 14.902 15.7941 15.2501C15.6643 15.4782 15.4776 15.6675 15.2527 15.7992C14.9096 16.0001 14.4488 16.0001 13.5274 16.0001H8.01117C7.65852 16.0001 7.4822 16.0001 7.31478 15.9601C7.20354 15.9335 7.09572 15.8939 6.99347 15.8421C6.83959 15.7641 6.70413 15.6497 6.43322 15.4207C5.5996 14.7161 5.18278 14.3638 5.0548 13.932C4.97132 13.6503 4.97132 13.35 5.0548 13.0683C5.18278 12.6365 5.5996 12.2842 6.43322 11.5796C6.70413 11.3506 6.83959 11.2361 6.99347 11.1582C7.09572 11.1064 7.20354 11.0668 7.31478 11.0402C7.4822 11.0001 7.65904 11.0001 8.01273 11.0001Z"/></svg>;
}
