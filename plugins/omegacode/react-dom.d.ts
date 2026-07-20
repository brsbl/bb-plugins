// Minimal shim: bb provides react-dom at runtime (shimmed like react); we only use createPortal.
declare module "react-dom" {
  import type { ReactNode } from "react";
  export function createPortal(children: ReactNode, container: Element | DocumentFragment, key?: string | null): ReactNode;
}
