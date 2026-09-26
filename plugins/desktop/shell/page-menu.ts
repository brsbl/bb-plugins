import { useEffect, useRef, type RefObject } from "react";
import { HOMEPAGE_SLOT_ID } from "../slots";
import { useMenu, type MenuEntry, type MenuTrigger } from "./menu";

/** Page content that keeps its own right-click; the desktop menu opens only on bare page background. */
const PAGE_MENU_IGNORED = [
  "input",
  "textarea",
  "select",
  "button",
  "a",
  "label",
  "[contenteditable]",
  "[role]",
  "[data-promptbox]",
  "[data-promptbox-shell]",
  ".bbd-root",
  `[id^="plugin-homepage:"]:not([id="${HOMEPAGE_SLOT_ID}"])`,
].join(",");

/** Opens the desktop menu when the page background around the canvas is right-clicked. */
export function usePageBackgroundMenu(
  canvasRef: RefObject<HTMLDivElement | null>,
  entries: (event: MenuTrigger) => MenuEntry[],
) {
  const menu = useMenu();
  const latest = useRef({ menu, entries });
  latest.current = { menu, entries };

  useEffect(() => {
    const page = canvasRef.current?.closest('[class~="@container/page"]')?.parentElement;
    if (page === null || page === undefined) return;
    const onContextMenu = (event: MouseEvent) => {
      let node = event.target instanceof Element ? event.target : null;
      while (node !== null && node !== page) {
        if (node.matches(PAGE_MENU_IGNORED)) return;
        node = node.parentElement;
      }
      if (node === null) return;
      if (window.getSelection()?.isCollapsed === false) return;
      latest.current.menu.open(event, latest.current.entries(event));
    };
    page.addEventListener("contextmenu", onContextMenu);
    return () => page.removeEventListener("contextmenu", onContextMenu);
  }, [canvasRef]);
}
