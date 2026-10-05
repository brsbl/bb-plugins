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
export function MoreMenu({ children, disabled, onCloseAutoFocus }: { children: ReactNode; disabled?: boolean; onCloseAutoFocus?: (event: Event) => void }) {
  return <Menu.Root><Menu.Trigger asChild><ActionButton className="iac-icon" aria-label="More actions" disabled={disabled}>⋯</ActionButton></Menu.Trigger>
    <Menu.Content className="iac-menu" align="end" sideOffset={5} onCloseAutoFocus={onCloseAutoFocus}>{children}</Menu.Content>
  </Menu.Root>;
}
export function MenuAction({ children, onSelect }: { children: ReactNode; onSelect: () => void }) {
  return <Menu.Item className="iac-menu-item" onSelect={onSelect}>{children}</Menu.Item>;
}
export function ClockIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>; }
export function SkipIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>; }
// View from Hugeicons (free set, MIT), the icon family bb's built-in icons use.
export function ViewIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.544 11.045C21.848 11.4713 22 11.6845 22 12C22 12.3155 21.848 12.5287 21.544 12.955C20.1779 14.8706 16.6892 19 12 19C7.31078 19 3.8221 14.8706 2.45604 12.955C2.15201 12.5287 2 12.3155 2 12C2 11.6845 2.15201 11.4713 2.45604 11.045C3.8221 9.12944 7.31078 5 12 5C16.6892 5 20.1779 9.12944 21.544 11.045Z"/>
    <path d="M15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12Z"/></svg>;
}
// Action glyphs from Hugeicons (free set, MIT), keyed by the log action they stand for.
const actionGlyphs = {
  "send": ["M21.0477 3.05293C18.8697 0.707363 2.48648 6.4532 2.50001 8.551C2.51535 10.9299 8.89809 11.6617 10.6672 12.1581C11.7311 12.4565 12.016 12.7625 12.2613 13.8781C13.3723 18.9305 13.9301 21.4435 15.2014 21.4996C17.2278 21.5892 23.1733 5.342 21.0477 3.05293Z","M11.4999 12.5L14.9999 9"],
  "merge": ["M7 20C8.10457 20 9 19.1046 9 18C9 16.8954 8.10457 16 7 16C5.89543 16 5 16.8954 5 18C5 19.1046 5.89543 20 7 20Z","M7 8C8.10457 8 9 7.10457 9 6C9 4.89543 8.10457 4 7 4C5.89543 4 5 4.89543 5 6C5 7.10457 5.89543 8 7 8Z","M17 14C18.1046 14 19 13.1046 19 12C19 10.8954 18.1046 10 17 10C15.8954 10 15 10.8954 15 12C15 13.1046 15.8954 14 17 14Z","M7.02116 8.2793V15.4073M14.4113 12.0047L10.0193 12.0048C8.92158 12.0048 6.86182 11.1254 7.01818 8.78001"],
  "retry": ["M20.0092 2V5.13219C20.0092 5.42605 19.6418 5.55908 19.4537 5.33333C17.6226 3.2875 14.9617 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12"],
  "resume": ["M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z"],
  "archive": ["M21 7H3V13C3 16.7712 3 18.6569 4.17157 19.8284C5.34315 21 7.22876 21 11 21H13C16.7712 21 18.6569 21 19.8284 19.8284C21 18.6569 21 16.7712 21 13V7Z","M21 7H3L4.2 5.4C5.08328 4.22229 5.52492 3.63344 6.15836 3.31672C6.7918 3 7.52786 3 9 3H15C16.4721 3 17.2082 3 17.8416 3.31672C18.4751 3.63344 18.9167 4.22229 19.8 5.4L21 7Z","M12 17L12 10.5M9 14.5C9.58984 15.1068 11.1597 17.5 12 17.5C12.8403 17.5 14.4102 15.1068 15 14.5"],
  "yes": ["M5 14L8.5 17.5L19 6.5"],
  "no": ["M18 6L6.00081 17.9992M17.9992 18L6 6.00085"],
  "comment": ["M8 13.5H16M8 8.5H12","M6.09881 19C4.7987 18.8721 3.82475 18.4816 3.17157 17.8284C2 16.6569 2 14.7712 2 11V10.5C2 6.72876 2 4.84315 3.17157 3.67157C4.34315 2.5 6.22876 2.5 10 2.5H14C17.7712 2.5 19.6569 2.5 20.8284 3.67157C22 4.84315 22 6.72876 22 10.5V11C22 14.7712 22 16.6569 20.8284 17.8284C19.6569 19 17.7712 19 14 19C13.4395 19.0125 12.9931 19.0551 12.5546 19.155C11.3562 19.4309 10.2465 20.0441 9.14987 20.5789C7.58729 21.3408 6.806 21.7218 6.31569 21.3651C5.37769 20.6665 6.29454 18.5019 6.5 17.5"],
  "edit": ["M14.0737 3.88545C14.8189 3.07808 15.1915 2.6744 15.5874 2.43893C16.5427 1.87076 17.7191 1.85309 18.6904 2.39232C19.0929 2.6158 19.4769 3.00812 20.245 3.79276C21.0131 4.5774 21.3972 4.96972 21.6159 5.38093C22.1438 6.37312 22.1265 7.57479 21.5703 8.5507C21.3398 8.95516 20.9446 9.33578 20.1543 10.097L10.7506 19.1543C9.25288 20.5969 8.504 21.3182 7.56806 21.6837C6.63212 22.0493 5.6032 22.0224 3.54536 21.9686L3.26538 21.9613C2.63891 21.9449 2.32567 21.9367 2.14359 21.73C1.9615 21.5234 1.98636 21.2043 2.03608 20.5662L2.06308 20.2197C2.20301 18.4235 2.27297 17.5255 2.62371 16.7182C2.97444 15.9109 3.57944 15.2555 4.78943 13.9445L14.0737 3.88545Z","M13 4L20 11","M14 22L22 22"],
  "undo": ["M11 6H15.5C17.9853 6 20 8.01472 20 10.5C20 12.9853 17.9853 15 15.5 15H4","M6.99998 12C6.99998 12 4.00001 14.2095 4 15C3.99999 15.7906 7 18 7 18"],
  "open": ["M9 6.65032C9 6.65032 15.9383 6.10759 16.9154 7.08463C17.8924 8.06167 17.3496 15 17.3496 15M16.5 7.5L6.5 17.5"],
} as const;
export type ActionGlyph = keyof typeof actionGlyphs;
export function ActionGlyphIcon({ name }: { name: ActionGlyph }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{actionGlyphs[name].map((d) => <path key={d} d={d} />)}</svg>;
}
export function NoteIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14.5a1.5 1.5 0 0 1-1.5 1.5H9l-4 3.5v-13A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5z"/></svg>; }
