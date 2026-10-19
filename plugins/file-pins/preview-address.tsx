import { previewAddressLabel } from "./pin-label.js";

const addressClass = "min-w-0 border-b bg-muted/30 px-3 py-2 text-[11px] leading-4 text-muted-foreground";

export function PreviewAddress({ value, focused }: { value: string; focused: boolean }) {
  return <div className={`${addressClass} ${focused ? "break-all whitespace-normal" : "truncate"}`} title={value}>
    <span aria-hidden="true">{focused ? value : previewAddressLabel(value)}</span>
    <span className="sr-only">{value}</span>
  </div>;
}
