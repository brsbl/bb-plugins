import { forwardRef } from "react";
import { previewAddressLabel } from "./pin-label.js";

const addressClass = "min-w-0 border-b bg-muted/30 px-3 py-2 text-[11px] leading-4 text-muted-foreground";

export const PreviewAddress = forwardRef<HTMLDivElement, { value: string; focused: boolean }>(function PreviewAddress({ value, focused }, ref) {
  return <div ref={ref} className={`${addressClass} whitespace-nowrap ${focused ? "overflow-x-auto ring-1 ring-inset ring-ring" : "truncate"}`} title={value}>
    <span aria-hidden="true">{focused ? value : previewAddressLabel(value)}</span>
    <span className="sr-only">{value}</span>
  </div>;
});
