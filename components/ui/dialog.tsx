// Adapted from bb's shared-ui Dialog at get-bb/bb f0f99dcf2.
// Lightboxes stay full-screen on touch instead of becoming bottom drawers.
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

export const Dialog = DialogPrimitive.Root;
export const DialogTitle = DialogPrimitive.Title;
export const DialogClose = DialogPrimitive.Close;
export const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay data-bb-plugin-root="" data-bb-portaled-overlay="" className="icx-viewer-overlay" />
    <DialogPrimitive.Content ref={ref} data-bb-plugin-root="" data-bb-portaled-overlay="" {...props}>
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";
