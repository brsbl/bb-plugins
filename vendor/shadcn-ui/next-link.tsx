import type { ComponentProps } from "react";

/** Browser-only adapter for the Next.js link used by pinned upstream demos. */
export default function Link(props: ComponentProps<"a">) {
  return <a {...props} />;
}
