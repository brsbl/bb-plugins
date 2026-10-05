import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

// Compact layouts clamp descriptions to two lines; a clipped one expands on tap.
export function Consequence({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [clipped, setClipped] = useState(false);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || open || typeof ResizeObserver === "undefined") return;
    const measure = () => setClipped(node.scrollHeight > node.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [open, children]);
  const toggle = () => setOpen((value) => !value);
  return <p ref={ref} className="iac-consequence" data-open={open || undefined}
    {...(clipped || open ? {
      role: "button", tabIndex: 0, "aria-expanded": open, onClick: toggle,
      onKeyDown: (event: KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(); } },
    } : {})}>{children}</p>;
}
