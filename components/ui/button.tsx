// BB Button, adapted to plugin-local CSS from shared-ui at 1e2cee69ad.
import { forwardRef, type ComponentPropsWithoutRef } from "react";

type ButtonProps = ComponentPropsWithoutRef<"button"> & { variant?: "default" | "outline" | "ghost" };
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "outline", className = "", type = "button", ...props }, ref) =>
    <button {...props} ref={ref} type={type} className={`digest-button digest-button-${variant} ${className}`} />,
);
Button.displayName = "Button";
