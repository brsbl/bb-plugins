// BB Switch, adapted to plugin-local CSS from shared-ui at 1e2cee69ad (via plugins/coordinator-mode).
import { forwardRef, type ComponentPropsWithoutRef } from "react";

type SwitchProps = Omit<ComponentPropsWithoutRef<"button">, "onChange" | "role"> & {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, className = "", onCheckedChange, onClick, ...props }, ref) => (
    <button {...props} ref={ref} type="button" role="switch" aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"} className={`dl-switch ${className}`}
      onClick={(event) => { onClick?.(event); if (!event.defaultPrevented) onCheckedChange?.(!checked); }}>
      <span aria-hidden />
    </button>
  ),
);
Switch.displayName = "Switch";
