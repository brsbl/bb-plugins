import { useEffect, useState } from "react";
import { OWN_FOOTER_ITEM } from "../slots";
import { TASKBAR_SELECTOR } from "../windows";

/**
 * Mirrors bb's sidebar footer buttons into the tray, and while the sidebar is collapsed restyles the panels they open
 * as XP windows above the taskbar.
 */

export interface FooterItem {
  key: string;
  label: string;
  title: string;
  iconHtml: string;
  disclosure: boolean;
}


function footerElements(): HTMLElement[] {
  const footer = document.querySelector('[data-sidebar="footer"]');
  return footer === null
    ? []
    : [...footer.querySelectorAll<HTMLElement>("a[aria-label], button[aria-label]")].filter(
        (element) => element.closest('[data-testid^="plugin-sidebar-footer-disclosure-"]') === null,
      );
}

function footerKey(element: HTMLElement): string {
  const testId = element.dataset.testid;
  return testId !== undefined && testId.startsWith("plugin-sidebar-footer") ? testId : element.getAttribute("aria-label") ?? "";
}

function readFooterItems(): FooterItem[] {
  return footerElements().flatMap((element) => {
    const key = footerKey(element);
    const icon = element.querySelector("svg, [data-icon-root]");
    if (key === OWN_FOOTER_ITEM || icon === null) return [];
    const title = element.getAttribute("aria-label") ?? "";
    return [
      {
        key,
        title,
        label: title.replace(/\s*\(.*\)$/, ""),
        iconHtml: icon.outerHTML,
        disclosure: element.hasAttribute("aria-expanded"),
      },
    ];
  });
}

export function useFooterItems(): FooterItem[] {
  const [items, setItems] = useState<FooterItem[]>(readFooterItems);
  useEffect(() => {
    let last = JSON.stringify(items);
    const sync = () => {
      const next = readFooterItems();
      const serialized = JSON.stringify(next);
      if (serialized === last) return;
      last = serialized;
      setItems(next);
    };
    const timer = setInterval(sync, 1500);
    sync();
    return () => clearInterval(timer);
  }, []);
  return items;
}

const PANEL_STYLE_ID = "bbd-panel-window-style";
const PANEL_SELECTOR = '[data-testid^="plugin-sidebar-footer-disclosure-"]';
const PANEL_TITLE_HEIGHT = 30;
const PANEL_STYLE = `
body[data-bbd-panel-window] :has(${PANEL_SELECTOR}) {
  transform: none !important;
  filter: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  will-change: auto !important;
  contain: none !important;
}
body[data-bbd-panel-window] ${PANEL_SELECTOR} {
  position: fixed !important;
  right: var(--bbd-panel-right, 16px);
  bottom: var(--bbd-panel-bottom, 64px);
  z-index: 40;
  width: 340px;
  height: auto !important;
  max-height: 70vh;
  padding: ${PANEL_TITLE_HEIGHT}px 4px 4px;
  visibility: visible !important;
  border: 1px solid oklch(0.42 0.19 262 / 0.65) !important;
  border-radius: 14px 14px 12px 12px !important;
  background: color-mix(in oklab, var(--background) 82%, transparent) !important;
  -webkit-backdrop-filter: blur(24px) saturate(1.6);
  backdrop-filter: blur(24px) saturate(1.6);
  box-shadow: 0 18px 40px -18px oklch(0.2 0.05 262 / 0.6);
  animation: bbd-panel-in 160ms ease-out;
}
body[data-bbd-panel-window] ${PANEL_SELECTOR}::before {
  content: attr(aria-label);
  position: absolute;
  inset: 0 0 auto;
  height: ${PANEL_TITLE_HEIGHT - 2}px;
  display: flex;
  align-items: center;
  padding: 0 40px 0 12px;
  border-radius: 13px 13px 0 0;
  background: linear-gradient(oklch(0.7 0.16 250), oklch(0.55 0.2 258) 45%, oklch(0.48 0.2 260));
  color: oklch(0.99 0.004 250);
  font-weight: 700;
  font-size: var(--text-sm);
  text-shadow: 1px 1px 0 oklch(0.3 0.15 265);
  cursor: default;
}
body[data-bbd-panel-window] ${PANEL_SELECTOR}::after {
  content: "\\2715";
  position: absolute;
  top: 5px;
  right: 8px;
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: oklch(0.63 0.19 32);
  box-shadow: inset 0 0 0 1px oklch(0.99 0.004 250 / 0.7);
  color: oklch(0.99 0.004 250);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}
@keyframes bbd-panel-in {
  from { opacity: 0; transform: translateY(8px); }
}
@media (prefers-reduced-motion: reduce) {
  body[data-bbd-panel-window] ${PANEL_SELECTOR} { animation: none; }
}
`;

function sidebarCollapsed(): boolean {
  return document.querySelector('.peer[data-side="left"][data-state="collapsed"]') !== null;
}

function openPanel(): HTMLElement | null {
  return document.querySelector<HTMLElement>(PANEL_SELECTOR);
}

function placePanel() {
  const taskbar = document.querySelector(TASKBAR_SELECTOR)?.getBoundingClientRect();
  const root = document.documentElement.style;
  if (taskbar === undefined) return;
  root.setProperty("--bbd-panel-right", `${Math.max(12, window.innerWidth - taskbar.right)}px`);
  root.setProperty("--bbd-panel-bottom", `${window.innerHeight - taskbar.top + 10}px`);
}

function showPanelsAsWindows(active: boolean) {
  if (active) {
    if (document.getElementById(PANEL_STYLE_ID) === null) {
      const style = document.createElement("style");
      style.id = PANEL_STYLE_ID;
      style.textContent = PANEL_STYLE;
      document.head.append(style);
    }
    placePanel();
    document.body.dataset.bbdPanelWindow = "true";
  } else {
    delete document.body.dataset.bbdPanelWindow;
  }
}

export function usePanelWindows() {
  useEffect(() => {
    const sync = () => showPanelsAsWindows(sidebarCollapsed() && openPanel() !== null);
    const timer = setInterval(sync, 400);
    const onPointerDown = (event: PointerEvent) => {
      const panel = openPanel();
      if (panel === null || document.body.dataset.bbdPanelWindow === undefined) return;
      const bounds = panel.getBoundingClientRect();
      const inTitle =
        event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.top + PANEL_TITLE_HEIGHT;
      if (!inTitle || event.clientX < bounds.right - 34) return;
      event.preventDefault();
      event.stopPropagation();
      const key = panel.dataset.testid?.replace("plugin-sidebar-footer-disclosure-", "plugin-sidebar-footer-item-");
      footerElements().find((element) => footerKey(element) === key)?.click();
    };
    window.addEventListener("resize", placePanel);
    window.addEventListener("pointerdown", onPointerDown, true);
    sync();
    return () => {
      clearInterval(timer);
      window.removeEventListener("resize", placePanel);
      window.removeEventListener("pointerdown", onPointerDown, true);
      showPanelsAsWindows(false);
    };
  }, []);
}

export function activateFooterItem(item: FooterItem) {
  const target = footerElements().find((element) => footerKey(element) === item.key);
  if (target === undefined) return;
  target.click();
  if (item.disclosure && sidebarCollapsed()) {
    requestAnimationFrame(() => showPanelsAsWindows(openPanel() !== null));
  }
}
