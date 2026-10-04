import { forwardRef, type ComponentPropsWithoutRef } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { usePortalScopeProps } from "./lib/portal-scope.js";
import { cn } from "./lib/utils.js";

// The bb popover recipe without drawer conversion or motion: these controls
// stay attached to their trigger on compact viewports as well.
export const PinPopover = PopoverPrimitive.Root;
export const PinPopoverTrigger = PopoverPrimitive.Trigger;
export const PinPopoverContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>>(
  ({ className, ...props }, ref) => {
    const scope = usePortalScopeProps();
    return <PopoverPrimitive.Portal><PopoverPrimitive.Content ref={ref} {...scope} side="top" align="end" sideOffset={6} collisionPadding={8}
      className={cn("z-50 w-80 max-w-[calc(100vw-16px)] overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md outline-none", className)}
      style={{ maxHeight: "var(--radix-popover-content-available-height)" }} {...props} /></PopoverPrimitive.Portal>;
  },
);
PinPopoverContent.displayName = "PinPopoverContent";
