// The veil thins bb's own backgrounds so the scene shows through, and puts frosted glass behind
// text. It is one static stylesheet, injected once while Ambient is on; the user's controls reach
// it through custom properties on <body>, so moving a slider never rebuilds or re-parses CSS.

export const VEIL_STYLE_ID = "bb-ambient-veil";

/**
 * How glass is drawn, picked from the effective render detail. Backdrop blur re-samples the
 * animated canvas under every glass surface each frame, so it is the first thing to shed.
 */
export type GlassTier = "full" | "low" | "solid";

const FULL_GLASS_DETAIL = 0.45;
const LOW_GLASS_DETAIL = 0.3;

export function glassTier(detail: number): GlassTier {
  if (detail >= FULL_GLASS_DETAIL) return "full";
  if (detail >= LOW_GLASS_DETAIL) return "low";
  return "solid";
}

export interface VeilSettings {
  showThrough: number;
  glass: number;
  tier: GlassTier;
}

function percent(value: number): string {
  return `${Math.round(value * 1000) / 10}%`;
}

/** Points the injected stylesheet at the current controls. Cheap: three property writes. */
export function applyVeil(settings: VeilSettings): void {
  const { body } = document;
  body.style.setProperty("--ambient-keep", percent(1 - settings.showThrough));
  body.style.setProperty("--ambient-glass", percent(settings.glass));
  if (body.dataset.ambientGlass !== settings.tier) body.dataset.ambientGlass = settings.tier;
}

/** Injects the stylesheet if it isn't already there; the returned cleanup removes it and the properties. */
export function mountVeil(): () => void {
  let style = document.getElementById(VEIL_STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = VEIL_STYLE_ID;
    style.textContent = VEIL_CSS;
    document.head.append(style);
  }
  const mounted = style;
  return () => {
    mounted.remove();
    const { body } = document;
    body.style.removeProperty("--ambient-keep");
    body.style.removeProperty("--ambient-glass");
    delete body.dataset.ambientGlass;
  };
}

const mix = (color: string, amount: string) => `color-mix(in oklab, ${color} ${amount}, transparent)`;

const SHELL = "body.bb-app-shell";
const ROOT = `${SHELL} > #root`;
const PANES = `${ROOT}, [data-testid="secondary-panel-shelf"]`;
const OVERLAY = `${SHELL} [data-bb-portaled-overlay]:is([role="dialog"], [role="menu"], [role="listbox"])`;
// The compact right-panel shelf is a portaled dialog too; its sticky headers stay solid glass, unlike menus.
const THREAD = `${ROOT} [data-thread-window]`;
const PAGE_MAIN =
  '[data-testid="app-layout-content-shell"] > main:not(:has([data-thread-window], [data-app-composer], [role="img"][aria-label="bb"]))';
const PAGE = `${ROOT} ${PAGE_MAIN}`;
const RIGHT_PANEL = `${ROOT} #thread-detail-secondary-panel-handle + [data-panel] > aside`;
const COMPACT_HOME = `${ROOT} [data-testid="root-compose-compact-home"]:has([data-root-compose-mobile-recents])`;
const COMPACT_COMPOSER = `${ROOT} [data-testid="root-compose-compact-composer"]`;
/** bb pads the plugin sidebar header past the traffic lights and toggle, so it never becomes a pill itself; its plugin content does. */
const SIDEBAR_RESERVE_PILL = '[data-testid="app-sidebar-top-reserve-row"] > div:not([data-sidebar-header-slot])';
const SIDEBAR_HEADER_CONTENT = "[data-sidebar-header-slot] > [data-bb-plugin-root]";
// AppPageHeader no longer marks its actions wrapper; its second child still owns the action groups.
const HEADER_ACTIONS = '[data-testid="app-page-header-content-row"] > :nth-child(2)';
const CHROME_PILLS = `${ROOT} :is([data-testid="app-page-header-content-row"] > :first-child, ${HEADER_ACTIONS}, ${SIDEBAR_RESERVE_PILL}, ${SIDEBAR_HEADER_CONTENT}:not(:empty), button[data-sidebar="trigger"])`;
const HEADER_FIRST = `${ROOT} [data-testid="app-page-header-content-row"] > :first-child`;
const RIGHT_PANEL_BUTTON = 'button[aria-label*="right panel" i]';
const SIDEBAR_CARDS = `${ROOT} :is([data-testid="sidebar-navigation-region"], [data-sidebar="content"], [data-sidebar="footer"])`;
const SIDEBAR_FOOTER = `${ROOT} [data-sidebar="footer"]`;
/** Plugins, Settings and Skills put "Back to app" above the section card; it joins the card as its first row. */
const SECTION_BACK = `${ROOT} [data-testid$="-sidebar-top-reserve-row"] + div:has(+ [data-sidebar="content"])`;
const SIDEBAR_OPEN = `${ROOT} .peer[data-state="expanded"][data-side="left"] + [data-sidebar="inset"]`;
const THREAD_TITLE_ROW =
  '[data-split-pane-id]:has([data-thread-window]) > header > [data-testid="app-page-header-content-row"]';
const PLUGIN_PAGE_BODY = '[data-testid="plugin-panel-body"]';
const PAGE_COLUMN = `:is(.max-w-5xl, [class~="max-w-[760px]"], ${PLUGIN_PAGE_BODY})`;

const COLUMN_HALF = "404px";
/** bb's pl-[104px] traffic-light reserve, plus the 6px a header pill reaches outward. */
const TRAFFIC_LIGHT_RESERVE = "110px";
const COLUMN_LEFT = `max(var(--ambient-column-gutter, 8px), 50% - ${COLUMN_HALF})`;
const COLUMN_RIGHT = `max(8px, 50% - ${COLUMN_HALF})`;
const COLUMN_BOTTOM = "8px";
const COMPACT_INSET = "max(16px, calc((100% - 760px) / 2 + 16px))";

const HIDE = "display: none;";
const NO_BLUR = "-webkit-backdrop-filter: none; backdrop-filter: none;";
const BLUR = "-webkit-backdrop-filter: var(--ambient-blur); backdrop-filter: var(--ambient-blur);";
const INK_WASH = mix("var(--ink)", "9%");
const EDGE = `border: 1px solid ${INK_WASH};`;
const SHEEN = `linear-gradient(to bottom, ${mix("var(--canvas)", "28%")}, transparent 45%)`;
const LAYER = "content: \"\"; position: absolute; z-index: -1; pointer-events: none;";
/** Glass without the blur: fill, edge and lift. */
const GLASS_PANE = `background-color: var(--ambient-glass-fill); ${EDGE}
  box-shadow: inset 0 1px 0 ${mix("var(--canvas)", "60%")}, 0 12px 32px -16px ${mix("var(--ink)", "35%")};`;
/** Frosted glass, for the large surfaces that sit behind text. */
const GLASS_SURFACE = `${GLASS_PANE} ${BLUR}`;
/** Small chrome gets an opaque tint instead: a blur that size costs as much and reads as flat anyway. */
const GLASS_CHIP = `${GLASS_PANE} background-color: var(--ambient-glass-solid);`;

const VEIL_CSS = `html.bb-app-shell-root { background-color: var(--canvas); }
${SHELL} {
  background-color: transparent; --ambient-background: var(--background); --ambient-sidebar: var(--sidebar); --ambient-card: var(--card);
  --ambient-glass-fill: ${mix("var(--ambient-background)", "var(--ambient-glass, 60%)")};
  --ambient-glass-solid: ${mix("var(--ambient-background)", "clamp(88%, calc(var(--ambient-glass, 60%) + 30%), 92%)")};
  --ambient-blur: blur(12px);
}
${SHELL}[data-ambient-glass="low"] { --ambient-blur: blur(6px); }
${SHELL}[data-ambient-glass="solid"] { --ambient-blur: none; --ambient-glass-fill: var(--ambient-glass-solid); }
:is(${PANES}) { --background: ${mix("var(--ambient-background)", "var(--ambient-keep, 23%)")}; --sidebar: ${mix("var(--ambient-sidebar)", "var(--ambient-keep, 23%)")}; }
:is(${PANES}) .bg-sidebar .bg-sidebar:not(.sticky), [data-testid="secondary-panel-shelf"] .bg-sidebar:not(.sticky) { --sidebar: transparent; }
:is(${PANES}) .sticky:is(.bg-sidebar, .bg-background) { --sidebar: transparent; --background: transparent; }
:is(${THREAD}, ${PAGE}) .sticky:is(.bg-sidebar, .bg-background, .bg-popover) { --sidebar: var(--ambient-glass-solid); --background: var(--ambient-glass-solid); --popover: var(--ambient-glass-solid); }
:is(${PANES}) header.bg-surface-scrim { background-color: transparent; }
${SHELL} [role="switch"][aria-checked="true"] > span.bg-background { background-color: var(--canvas); }
${SHELL} [class~="text-background"] { color: var(--ambient-background); }
${SHELL} :is(button[role="checkbox"][data-state="checked"], [data-category-option-checkbox][data-state="enabled"]) { color: var(--canvas); }
${ROOT} [style*="--sidebar-width-mobile"]:has(> [data-sidebar="panel"]) { --ambient-sidebar-width-mobile: round(down, var(--sidebar-width-mobile), 1px); }
${ROOT} :is([data-sidebar="panel"][data-vaul-drawer-direction], [data-sidebar-mobile-backdrop], main[data-sidebar-shelf]) { --sidebar-width-mobile: var(--ambient-sidebar-width-mobile) !important; }
${ROOT} [data-sidebar="panel"][data-vaul-drawer-direction][data-state="closed"]:not([data-vaul-animate]) { visibility: hidden; transition: visibility 0s linear 260ms; }
${THREAD} { position: relative; isolation: isolate; }
${THREAD} > * { clip-path: inset(0 0 ${COLUMN_BOTTOM} 0); }
/* Dense thread content needs the same protective tint as chrome, even at the lowest Glass setting. */
${THREAD}::before { ${LAYER} ${GLASS_SURFACE} background-color: var(--ambient-glass-solid); border-radius: 20px; top: 0; bottom: ${COLUMN_BOTTOM}; left: ${COLUMN_LEFT}; right: ${COLUMN_RIGHT}; }
${THREAD} [data-overflow-fade] { ${HIDE} }
${PAGE} { position: relative; isolation: isolate; }
${PAGE}::before { ${LAYER} ${GLASS_SURFACE} border-radius: 20px; inset: 0 8px 8px; }
${PAGE} ${PLUGIN_PAGE_BODY} { margin-left: max(calc(var(--ambient-column-gutter, 8px) - 16px), 50% - ${COLUMN_HALF}); margin-right: max(-8px, 50% - ${COLUMN_HALF}); margin-bottom: -8px; border-radius: 20px; }
@media (min-width: 768px) { ${PAGE} ${PLUGIN_PAGE_BODY} { margin-left: max(calc(var(--ambient-column-gutter, 8px) - 20px), 50% - ${COLUMN_HALF}); margin-right: max(-12px, 50% - ${COLUMN_HALF}); margin-bottom: -12px; } }
${PAGE_MAIN} ${PAGE_COLUMN}:not(${PAGE_COLUMN} *) { anchor-name: --ambient-page-column; }
${PAGE_MAIN} #thread-detail-secondary-panel ${PAGE_COLUMN} { anchor-name: none; }
${PAGE}::before { left: max(var(--ambient-column-gutter, 8px), anchor(--ambient-page-column left, 8px)); right: max(8px, anchor(--ambient-page-column right, 8px)); }
${PAGE}:has([data-testid="app-page-header-content-row"])::before { top: var(--bb-app-chrome-row-height, 3rem); }
@media (max-width: 767px) { ${PAGE} header:has([data-testid="app-page-header-content-row"]) + div { clip-path: inset(0 8px 8px round 0 0 20px 20px); } }
${PAGE} { --card: ${mix("var(--ambient-card)", "55%")}; }
${PAGE} :is(input[type="search"], input[placeholder^="Search" i]) { background-color: ${mix("var(--ambient-card)", "72%")}; border-color: ${mix("var(--ink)", "12%")}; }
${PAGE} .bg-card[class*="hover:bg-"]:hover { background-color: color-mix(in oklab, var(--ambient-card) 97%, var(--ink)); border-color: ${mix("var(--ink)", "14%")}; box-shadow: 0 8px 24px -16px ${mix("var(--ink)", "35%")}; }
@media (min-width: 768px) { ${SIDEBAR_OPEN} { --ambient-column-gutter: 0px; } ${SIDEBAR_OPEN} [data-testid="app-page-header-content-row"] > :first-child { margin-inline-start: -16px; } }
@media (min-width: 768px) { ${ROOT} ${THREAD_TITLE_ROW} { padding-inline-start: max(32px, 50% - ${COLUMN_HALF} + 6px); } ${ROOT} ${THREAD_TITLE_ROW}[class~="pl-[104px]"] { padding-inline-start: max(${TRAFFIC_LIGHT_RESERVE}, 50% - ${COLUMN_HALF} + 6px); } ${SIDEBAR_OPEN} ${THREAD_TITLE_ROW} { padding-inline-start: max(0px, 50% - ${COLUMN_HALF} + 16px); } }
${THREAD}::after { content: ""; position: absolute; z-index: 1; pointer-events: none; top: 1px; height: 28px; left: calc(${COLUMN_LEFT} + 1px); right: calc(${COLUMN_RIGHT} + 1px); border-radius: 19px 19px 0 0; background: linear-gradient(to bottom, ${mix("var(--ambient-background)", "18%")}, transparent); }
${THREAD} [data-timeline-row-list] :is([data-message-column].border, [data-message-column] .border) { border-color: ${mix("var(--ink)", "8%")}; }
${THREAD} [data-markdown-preview] div:has(> div > table) { width: 100% !important; margin-inline: 0 !important; }
${THREAD} [data-scroll-footer] > .bg-background { background-color: transparent; }
${ROOT} header.bg-surface-scrim { border-color: transparent; }
${COMPACT_HOME} > [data-testid="root-compose-compact-scroll-viewport"] { top: auto !important; bottom: 0; left: ${COMPACT_INSET}; right: ${COMPACT_INSET}; max-height: min(calc(100% - 62px), 600px); border-radius: 20px; }
${COMPACT_HOME} [data-testid="root-compose-compact-recents-offset"] { ${HIDE} }
${COMPACT_HOME} [data-testid="root-compose-compact-scroll-content"] > .px-4 { padding-inline: 0; }
${ROOT} [data-root-compose-mobile-recents] { ${GLASS_SURFACE} border-radius: 20px; padding-block: 0 6px; }
${ROOT} [data-root-compose-mobile-recents] > .sticky { position: static; background-color: transparent; ${NO_BLUR} padding-block-start: 16px; }
${ROOT} [data-root-compose-mobile-recents] > .sticky [data-overflow-fade] { ${HIDE} }
${COMPACT_COMPOSER} [data-overflow-fade] { ${HIDE} }
${COMPACT_COMPOSER} > .bg-background { background: ${SHEEN}, var(--ambient-glass-fill); ${BLUR} margin-inline: ${COMPACT_INSET}; margin-block-end: 6px; padding-block-start: 12px; border-radius: 20px; ${EDGE} box-shadow: inset 0 1px 0 ${mix("var(--canvas)", "70%")}, 0 -10px 24px -18px ${mix("var(--ink)", "40%")}; }
/* Recent and the compact composer meet as one glass surface, without a double edge at the join. */
${COMPACT_HOME} [data-root-compose-mobile-recents] { border-radius: 20px 20px 0 0; border-block-end: 0; box-shadow: inset 0 1px 0 ${mix("var(--canvas)", "60%")}; }
${COMPACT_HOME} [data-testid="root-compose-compact-composer"] > .bg-background { background: var(--ambient-glass-fill); border-radius: 0 0 20px 20px; border-block-start: 0; box-shadow: 0 12px 32px -16px ${mix("var(--ink)", "35%")}; }
${ROOT} [data-app-composer]:has([data-new-thread-footer]):not([data-testid="root-compose-compact-composer"] *) { ${GLASS_SURFACE} border-radius: 20px; padding: 10px 10px 4px; }
${ROOT} [data-app-composer] { --background: ${mix("var(--ambient-background)", "68%")}; }
/* The opaque follow-up shell fills the seam behind the input and its footer lip. */
${ROOT} [data-follow-up-composer] { background-color: var(--ambient-background); border-radius: 12px; }
${ROOT} [data-follow-up-composer] [data-promptbox] { --background: var(--ambient-background); ${NO_BLUR} }
${ROOT} [data-follow-up-composer-footer] { border-radius: 0 0 12px 12px; padding-inline: 4px; }
${ROOT} [data-follow-up-composer-footer] button { background-color: transparent; }
${ROOT} [data-follow-up-composer-footer] button:hover { background-color: ${INK_WASH}; }
${ROOT} [role="img"][aria-label="bb"] + div { ${GLASS_SURFACE} border-radius: 20px; padding: 6px; }
${ROOT} div.fixed:has(> ${RIGHT_PANEL_BUTTON}) { top: calc(6px + env(safe-area-inset-top)); right: calc(6px + env(safe-area-inset-right)); }
${ROOT} div.fixed > ${RIGHT_PANEL_BUTTON} { ${GLASS_CHIP} border-radius: 12px; }
${ROOT} [data-sidebar="panel"] { background-color: var(--background); border-inline-end-color: transparent; }
:is(${CHROME_PILLS}) { ${GLASS_CHIP} border-radius: 12px; padding-inline: 6px; }
${ROOT} ${SIDEBAR_RESERVE_PILL} { margin-inline: -6px; }
${ROOT} [data-testid="app-desktop-sidebar-trigger"][class~="left-[84px]"] { margin-inline-start: 6px; }
${ROOT} [data-testid="app-page-header-content-row"][class~="pl-[104px]"] { padding-inline-start: ${TRAFFIC_LIGHT_RESERVE}; }
${ROOT} ${SIDEBAR_HEADER_CONTENT} { display: flex; align-items: center; min-width: 0; max-width: 100%; min-height: 32px; overflow: hidden; }
${ROOT} button[data-sidebar="trigger"] { margin-inline: -4px 0; width: 32px; height: 32px; }
${ROOT} [data-testid="app-sidebar-top-reserve-row"] > div:nth-child(n) { margin-inline-end: 0; min-height: 32px; }
${HEADER_FIRST} { flex: 0 1 auto; min-width: 0; min-height: 32px; margin-inline: -6px 6px; padding-inline-start: 12px; }
${HEADER_FIRST}:has([data-pane-header-focus-tab]) { background-image: linear-gradient(var(--state-active), var(--state-active)); }
${ROOT} [data-pane-header-focus-tab] { background-color: transparent; }
${ROOT} ${HEADER_ACTIONS} { margin-inline: auto -8px; min-height: 32px; }
${ROOT} ${HEADER_ACTIONS} button.border { border-color: transparent; }
${ROOT} [data-thread-header-workflow-actions]:not(:has(button, a)) { ${HIDE} }
${ROOT} ${HEADER_ACTIONS}:has(> [data-thread-header-pane-actions]) { column-gap: 0; }
${ROOT} ${HEADER_ACTIONS} [data-thread-header-pane-actions] { margin-inline-start: 0; column-gap: 0; }
@media (max-width: 767px) { ${ROOT} div.fixed:has(> ${RIGHT_PANEL_BUTTON}) { top: calc(8px + env(safe-area-inset-top)); right: calc(8px + env(safe-area-inset-right)); } ${ROOT} :is(div.fixed, ${HEADER_ACTIONS}) ${RIGHT_PANEL_BUTTON}, ${ROOT} [data-thread-header-pane-actions] button { width: 32px; height: 32px; } :is(${HEADER_FIRST}, ${ROOT} ${HEADER_ACTIONS}) { height: 32px; min-height: 32px; } ${ROOT} ${HEADER_ACTIONS}:has(${RIGHT_PANEL_BUTTON}) { padding-inline-end: 0; } }
:is(${THREAD}, ${PAGE}, ${SIDEBAR_CARDS}, ${SECTION_BACK}, ${CHROME_PILLS}, ${OVERLAY}) { --state-hover: ${INK_WASH}; --state-active: ${mix("var(--ink)", "15%")}; --sidebar-accent: var(--state-hover); }
${SIDEBAR_CARDS} { ${GLASS_SURFACE} border-radius: 16px; margin-inline: 8px; }
${SECTION_BACK} { ${GLASS_SURFACE} border-block-end: 0; border-radius: 16px 16px 0 0; margin-inline: 8px; padding-block: 8px 4px; box-shadow: inset 0 1px 0 ${mix("var(--canvas)", "60%")}; }
${SECTION_BACK} + [data-sidebar="content"] { border-block-start-color: ${INK_WASH}; border-start-start-radius: 0; border-start-end-radius: 0; box-shadow: 0 12px 32px -16px ${mix("var(--ink)", "35%")}; }
${SECTION_BACK} + [data-sidebar="content"] > .px-2:first-child { padding-block-start: 8px; }
:is(${SIDEBAR_CARDS}, ${OVERLAY}) .w-px.bg-border-hairline, :is(${SIDEBAR_CARDS}, ${OVERLAY}) [class*="before:bg-border-hairline"]::before { ${HIDE} }
${ROOT} [data-testid="sidebar-navigation-region"] { margin-block: 0 8px; }
${ROOT} [data-testid="sidebar-navigation-region"] [data-testid="navigation-divider"] { ${HIDE} }
${ROOT} [data-sidebar="content"] { flex: 0 1 auto; min-height: min(7rem, 18dvh); margin-block-end: auto; }
${ROOT} [data-sidebar="content"]:not(:has(~ [data-sidebar="footer"])) { margin-block-end: 8px; }
${ROOT} [data-sidebar="content"] > .px-2:first-child { padding-block-start: 12px; }
@media (max-height: 560px) { ${ROOT} [data-testid="sidebar-navigation-region"] { flex: 0 1 auto; min-height: 3rem; overflow-y: auto; } }
/* bb measures this row to decide which icons fit. Shrink-to-content makes overflow capacity depend on the icons it already hid. */
${SIDEBAR_FOOTER} { flex-shrink: 0; margin-block: 8px; align-self: stretch; width: auto; }
${SIDEBAR_FOOTER} [data-testid^="plugin-sidebar-footer-disclosure-"] { border-color: transparent; background-color: transparent; }
${SIDEBAR_FOOTER} > [data-overflow-fade], ${SIDEBAR_FOOTER} > ul > li[aria-hidden="true"]:empty { ${HIDE} }
:is(${SIDEBAR_CARDS}, ${RIGHT_PANEL}) :is(.sticky, [data-sidebar-sticky-tier], [data-sidebar-sticky-stack]), ${OVERLAY} :is(.sticky:not(.bg-sidebar, .bg-background, .bg-popover), [data-sidebar-sticky-tier], [data-sidebar-sticky-stack]), :is(${SIDEBAR_CARDS}) [data-sidebar-sticky-stack]::before { ${NO_BLUR} }
:is(${SIDEBAR_CARDS}) [data-sidebar-sticky-stack] [data-sidebar-sticky-tier] { position: relative; top: auto; }
${RIGHT_PANEL} { ${GLASS_SURFACE} inset: 8px 8px 8px 2px; height: auto; max-width: calc(100% - 10px); border-radius: 20px; overflow: hidden; --background: transparent; --sidebar: transparent; }
${ROOT} :is([role="separator"][data-split-resize-grid-boundary], [data-panel-resize-handle-id]):not(:hover, [data-dragging], [data-resize-handle-state="drag"]), ${ROOT} [data-panel-resize-handle-id]:not(:hover, [data-resize-handle-state="drag"]) > span { background-color: transparent; }
${RIGHT_PANEL} [data-app-browser] > [class~="flex-1"]:last-child { margin: 0 8px 8px; border-radius: 12px; overflow: hidden; }
${OVERLAY} { ${GLASS_PANE} --background: transparent; --popover: transparent; --sidebar: transparent; }
${OVERLAY}::before { ${LAYER} inset: 0; border-radius: inherit; ${BLUR} }
${OVERLAY} .sticky:is(.bg-sidebar, .bg-background, .bg-popover) { --sidebar: transparent; --background: transparent; --popover: transparent; ${BLUR} }
${SHELL}[data-ambient-glass="solid"] ${OVERLAY} .sticky:is(.bg-sidebar, .bg-background, .bg-popover) { --sidebar: var(--ambient-glass-solid); --background: var(--ambient-glass-solid); --popover: var(--ambient-glass-solid); }
${OVERLAY}[data-testid="secondary-panel-shelf"] .sticky:is(.bg-sidebar, .bg-background, .bg-popover) { --sidebar: var(--ambient-glass-solid); --background: var(--ambient-glass-solid); --popover: var(--ambient-glass-solid); ${NO_BLUR} }
${SHELL} [data-bb-portaled-overlay] :is([data-palette-input-band], [data-palette-results-clip]) { background-color: transparent; }
${SHELL} [data-testid="secondary-panel-shelf"] { background-color: var(--ambient-glass-solid); ${BLUR} }`;
