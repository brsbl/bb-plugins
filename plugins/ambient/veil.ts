// The veil thins bb's own backgrounds so the scene shows through, and puts frosted glass behind
// text. It is one static stylesheet, injected once while Ambient is on; the user's controls reach
// it through custom properties on <body>, so moving a slider never rebuilds or re-parses CSS.
import { mountScrollClip } from "./scroll-clip.js";

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
  const stopScrollClip = mountScrollClip();
  return () => {
    stopScrollClip();
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
/** bb up to 0.46.0 nests the overflow fade, footer panels and the customize editor in the footer; that footer keeps its full glass card. */
const FOOTER_TRAY = `${SIDEBAR_FOOTER}:not(:has(> [data-overflow-fade]))`;
/** bb's default icon rail: its scrolling icon column, and Settings in the rail's footer cell. */
const RAIL = `${ROOT} [data-testid="app-nav-rail"] > :not([data-prism-frame-layer])`;
const RAIL_SETTINGS = `${ROOT} [data-testid="sidebar-navigation-rail"] ~ div > button[aria-label^="Settings"]`;
/** Plugins, Settings and Skills put "Back to app" above the section card; it joins the card as its first row. */
const SECTION_BACK = `${ROOT} [data-testid$="-sidebar-top-reserve-row"] + div:has(+ [data-sidebar="content"])`;
/** The sidebar body and footer row beside bb's icon rail; its cards sit one gap right of the rail. Plain sibling selectors: a :has()
    hook here would restyle the whole sidebar on every row change. */
const RAIL_SIDEBAR = `${ROOT} [data-testid="sidebar-navigation-rail"] ~ [data-sidebar="collapsible-body"]`;
/** bb's back/forward pair in the sidebar header; its gap class is unique to it (the in-app browser's toolbar is a different
    component). In the desktop title bar bb overrides that class, so the pair is found as the first child of the title-bar controls. */
const HISTORY_PAIR = 'div[class~="gap-(--bb-chrome-control-gap)"]';
const TITLE_BAR_HISTORY_PAIR = 'div[class~="gap-(--bb-title-bar-sidebar-toggle-gap)"] > div:first-child';
const SIDEBAR_OPEN = `${ROOT} .peer[data-state="expanded"][data-side="left"] + [data-sidebar="inset"]`;
const THREAD_TITLE_ROW =
  '[data-split-pane-id]:has([data-thread-window]) > header > [data-testid="app-page-header-content-row"]';
const PLUGIN_PAGE_BODY = '[data-testid="plugin-panel-body"]';
const PAGE_COLUMN = `:is(.max-w-5xl, [class~="max-w-[760px]"], ${PLUGIN_PAGE_BODY})`;

const COLUMN_HALF = "404px";
/** bb's pl-[104px] traffic-light reserve, plus the 6px a header pill reaches outward. */
const TRAFFIC_LIGHT_RESERVE = "110px";
/** Newer bb's reserve for a header row beside the title-bar controls when the sidebar is collapsed; other pages keep it as is. */
const COLLAPSED_TITLE_BAR_RESERVE =
  "calc(var(--bb-window-title-bar-controls-end) + 12px - var(--bb-window-card-collapsed-left) - 1rem)";
const COLUMN_LEFT = `max(var(--ambient-column-gutter, 8px), 50% - ${COLUMN_HALF})`;
const COLUMN_RIGHT = `max(8px, 50% - ${COLUMN_HALF})`;
const COLUMN_BOTTOM = "8px";
const COMPACT_INSET = "max(16px, calc((100% - 760px) / 2 + 16px))";

const HIDE = "display: none;";
const NO_BLUR = "-webkit-backdrop-filter: none; backdrop-filter: none;";
const BLUR = "-webkit-backdrop-filter: var(--ambient-blur); backdrop-filter: var(--ambient-blur);";
const INK_WASH = mix("var(--ink)", "9%");
/** Glass separates by fill and shadow, not outlines; the transparent border keeps bb's sizing. */
const EDGE = "border: 1px solid transparent;";
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
/* The scene is the window's backdrop. A theme's image on bb's desktop window frame is opaque and would hide it. */
${ROOT} [data-framed] { background-image: none; background-color: var(--background); }
/* One spacing system for the chrome: every outer surface sits --ambient-edge from the window, neighbors sit --ambient-gap apart,
   and controls in one row share its top and bottom. The other values place bb's own rows on that grid in each layout. */
${ROOT} { --ambient-edge: 8px; --ambient-gap: 8px; --ambient-chip-top: 8px; --ambient-card-shift: 0px; --ambient-rail-lift: -4px; --ambient-rail-cell-slack: 10px; }
/* The desktop window's frame lip draws no edge under the scene, so it would only double the inset; without it the window card's
   1px edge plus Ambient's 8px inset is the edge. Title-bar chips sit on the traffic-light axis, and the content line (rail, New
   thread, thread and page cards) starts one gap under them. bb's title bar is 50px for the cards' and rail's own offsets
   (header plus its 1px seam, and the rail's 10px top padding); the values below are derived from its real height. */
${ROOT} [data-framed] {
  --bb-window-frame-lip: 0px; --ambient-edge: 9px; --ambient-rail-cell-slack: 11px; --ambient-footer-seam: 1px; /* the sidebar's own 1px edge at its start and bottom */
  --ambient-chip-top: calc(var(--bb-macos-traffic-light-center-y) - 16px);
  --ambient-content-top: calc(var(--ambient-chip-top) + 32px + var(--ambient-gap));
  --ambient-card-shift: calc(var(--ambient-content-top) - var(--bb-window-title-bar-height) - 1px);
  --ambient-rail-lift: calc(var(--ambient-content-top) - var(--bb-window-title-bar-height) - 10px);
}
/* Prism Frame paints the same frame, rail and title bar with an opaque gradient; the scene replaces it. */
${ROOT} [data-prism-frame-layer] { ${HIDE} }
/* No hairlines over the scene: the desktop window card's outline, its title-bar seam, and the frame edges. */
${ROOT} [data-sidebar="inset-edge"] { ${HIDE} }
${ROOT} [data-sidebar="inset"]::after, ${ROOT} [data-sidebar="collapsible-body"] { border-color: transparent; background-color: transparent; }
/* The frame carries the one Show-through tint; the card's and sidebar's own fills would draw their edges as tone steps. */
${ROOT} [data-framed] [data-sidebar="inset"]::before, ${ROOT} [data-framed] [data-sidebar="panel"] { background-color: transparent; border-color: transparent; }
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
/* In the desktop window the card starts on the content line, like the rail and New thread beside it. The thread window clips its
   overflow, so it lets a card raised above its box through. */
${ROOT} [data-framed] [data-split-pane-id] [data-thread-window] { overflow-clip-margin: max(0px, -1 * var(--ambient-card-shift)); }
${ROOT} [data-framed] [data-split-pane-id] [data-thread-window]::before, ${ROOT} [data-framed] ${PAGE_MAIN}:not(:has([data-testid="app-page-header-content-row"]))::before { top: var(--ambient-card-shift); }
${ROOT} [data-framed] [data-split-pane-id] [data-thread-window]::after { top: calc(var(--ambient-card-shift) + 1px); }
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
/* Plugin controls own their surfaces; a search input may sit inside an already painted field. */
${PAGE} :is(input[type="search"], input[placeholder^="Search" i]):not([data-bb-plugin-root] *) { background-color: ${mix("var(--ambient-card)", "72%")}; border-color: ${mix("var(--ink)", "12%")}; }
${PAGE} .bg-card[class*="hover:bg-"]:hover { background-color: color-mix(in oklab, var(--ambient-card) 97%, var(--ink)); border-color: ${mix("var(--ink)", "14%")}; box-shadow: 0 8px 24px -16px ${mix("var(--ink)", "35%")}; }
/* With the sidebar collapsed, the window card (and its 1px edge) starts right of the rail cell; its column starts one gap after the rail. */
@media (min-width: 768px) { ${ROOT} .peer[data-collapsible="rail"][data-side="left"] + [data-sidebar="inset"] { --ambient-column-gutter: calc(var(--ambient-edge) + var(--ambient-gap) - var(--ambient-rail-cell-slack) - 1px); } }
@media (min-width: 768px) { ${SIDEBAR_OPEN} { --ambient-column-gutter: 0px; } ${SIDEBAR_OPEN} [data-testid="app-page-header-content-row"] > :first-child { margin-inline-start: -16px; } }
@media (min-width: 768px) { ${ROOT} ${THREAD_TITLE_ROW} { padding-inline-start: max(32px, 50% - ${COLUMN_HALF} + 6px); } ${ROOT} ${THREAD_TITLE_ROW}[class~="pl-[104px]"] { padding-inline-start: max(${TRAFFIC_LIGHT_RESERVE}, 50% - ${COLUMN_HALF} + 6px); } ${ROOT} ${THREAD_TITLE_ROW}[class*="pl-[calc(var(--bb-window-title-bar-controls-end)"] { padding-inline-start: max(${COLLAPSED_TITLE_BAR_RESERVE}, 50% - ${COLUMN_HALF} + 6px); } ${SIDEBAR_OPEN} ${THREAD_TITLE_ROW} { padding-inline-start: max(0px, 50% - ${COLUMN_HALF} + 16px); } }
${THREAD}::after { content: ""; position: absolute; z-index: 1; pointer-events: none; top: 1px; height: 28px; left: calc(${COLUMN_LEFT} + 1px); right: calc(${COLUMN_RIGHT} + 1px); border-radius: 19px 19px 0 0; background: linear-gradient(to bottom, ${mix("var(--ambient-background)", "18%")}, transparent); }
${THREAD} [data-timeline-row-list] :is([data-message-column].border, [data-message-column] .border) { border-color: ${mix("var(--ink)", "8%")}; }
${THREAD} [data-markdown-preview] div:has(> div > table) { width: 100% !important; margin-inline: 0 !important; }
/* Clip only the bottom: bb portals the text-selection menu into the transcript, and it can overhang the column's sides. */
${ROOT} [data-ambient-scroll-clip] { clip-path: inset(-100vmax -100vmax var(--ambient-scroll-clip-bottom, 0px) -100vmax); }
${THREAD} [data-scroll-footer] > .bg-background { background-color: transparent; }
/* Pending interactions overlap the scrolling timeline, so their surface must be fully opaque. */
${ROOT} :is([data-testid="user-question-banner"], [data-testid="plugin-interaction-shell"], [data-testid="approval-banner"], [data-testid="plan-review-banner"]) { background-color: var(--ambient-background); border-radius: 12px; }
/* Keep short secret-request actions on one compact row, including on mobile. */
${ROOT} [data-testid="plugin-interaction-shell"] [data-bb-plugin="secrets"] form > .sticky { flex-direction: row; flex-wrap: wrap; align-items: center; justify-content: flex-end; background-color: var(--ambient-background); padding-block-start: 8px; }
${ROOT} [data-testid="plugin-interaction-shell"] [data-bb-plugin="secrets"] form > .sticky > button { width: auto; }
${ROOT} header.bg-surface-scrim { border-color: transparent; }
${COMPACT_HOME} > [data-testid="root-compose-compact-scroll-viewport"] { top: auto !important; bottom: 6px; left: ${COMPACT_INSET}; right: ${COMPACT_INSET}; max-height: min(calc(100% - 68px), 594px); border-radius: 20px; }
/* bb pads the compact home so Recent rests a few rows above the composer; Ambient bounds that pane itself. */
${COMPACT_HOME} [data-testid="root-compose-compact-leading-spacer"] { ${HIDE} }
${COMPACT_HOME} [data-testid="root-compose-compact-bottom-spacer"] { margin-block-start: -6px; }
${COMPACT_HOME} [data-testid="root-compose-compact-scroll-content"] > .px-4 { padding-inline: 0; }
${ROOT} [data-root-compose-mobile-recents] { ${GLASS_SURFACE} border-radius: 20px; padding-block: 0 6px; }
${ROOT} [data-root-compose-mobile-recents] > .sticky { position: static; background-color: transparent; ${NO_BLUR} padding-block-start: 16px; }
${ROOT} [data-root-compose-mobile-recents] > .sticky [data-overflow-fade] { ${HIDE} }
${COMPACT_COMPOSER} [data-overflow-fade] { ${HIDE} }
${COMPACT_COMPOSER} > .bg-background { background: ${SHEEN}, var(--ambient-glass-fill); ${BLUR} margin-inline: ${COMPACT_INSET}; margin-block-end: 6px; padding-block-start: 12px; border-radius: 20px; ${EDGE} box-shadow: inset 0 1px 0 ${mix("var(--canvas)", "70%")}, 0 -10px 24px -18px ${mix("var(--ink)", "40%")}; }
/* Recent and the compact composer meet as one glass surface, without a double edge at the join. */
${COMPACT_HOME} [data-root-compose-mobile-recents] { border-radius: 20px 20px 0 0; border-block-end: 0; box-shadow: inset 0 1px 0 ${mix("var(--canvas)", "60%")}; }
${COMPACT_HOME} [data-testid="root-compose-compact-composer"] > .bg-background { background: var(--ambient-glass-fill); border-radius: 0 0 20px 20px; border-block-start: 0; box-shadow: 0 12px 32px -16px ${mix("var(--ink)", "35%")}; }
/* bb wraps the wide home composer in the compact composer too; only the compact one has its own glass. */
${ROOT} [data-app-composer]:has([data-new-thread-footer]):not([data-testid="root-compose-compact-composer"] > .bg-background *) { ${GLASS_SURFACE} border-radius: 20px; padding: 10px 10px 4px; }
${ROOT} [data-app-composer] { --background: ${mix("var(--ambient-background)", "68%")}; }
/* The opaque follow-up shell fills the seam behind the input and its footer lip. */
${ROOT} [data-follow-up-composer] { background-color: var(--ambient-background); border-radius: 12px; }
/* Low specificity on purpose: plugins that restyle a composer, like Desktop's IM window, keep their own border. */
:where(${ROOT}) [data-promptbox] { border-color: transparent; }
${ROOT} [data-follow-up-composer] [data-promptbox] { --background: var(--ambient-background); ${NO_BLUR} }
${ROOT} [data-follow-up-composer-footer] { border-radius: 0 0 12px 12px; padding-inline: 4px; }
${ROOT} [data-follow-up-composer-footer] button { background-color: transparent; }
${ROOT} [data-follow-up-composer-footer] button:hover { background-color: ${INK_WASH}; }
${ROOT} [role="img"][aria-label="bb"] + div { ${GLASS_SURFACE} border-radius: 20px; padding: 6px; }
/* The lone right-panel toggle lines up with the header pills: same 8px inset and 32px height. */
${ROOT} div.fixed:has(> ${RIGHT_PANEL_BUTTON}) { top: calc(8px + env(safe-area-inset-top)); right: calc(8px + env(safe-area-inset-right)); }
${ROOT} div.fixed > ${RIGHT_PANEL_BUTTON} { ${GLASS_CHIP} border-radius: 12px; width: 32px; height: 32px; }
/* In the desktop window bb moves it onto the traffic-light axis itself; 10px puts it on the chips' line there, on the edge. */
${ROOT} [data-framed] div.fixed:has(> ${RIGHT_PANEL_BUTTON}) { top: 10px; right: var(--ambient-edge); }
${ROOT} [data-sidebar="panel"] { background-color: var(--background); border-inline-end-color: transparent; }
:is(${CHROME_PILLS}) { ${GLASS_CHIP} border-radius: 12px; padding-inline: 6px; }
${ROOT} ${SIDEBAR_RESERVE_PILL} { margin-inline: -6px; }
${ROOT} [data-testid="app-desktop-sidebar-trigger"][class~="left-[84px]"] { margin-inline-start: 6px; }
${ROOT} [data-testid="app-page-header-content-row"][class~="pl-[104px]"] { padding-inline-start: ${TRAFFIC_LIGHT_RESERVE}; }
${ROOT} ${SIDEBAR_HEADER_CONTENT} { display: flex; align-items: center; min-width: 0; max-width: 100%; min-height: 32px; overflow: hidden; }
${ROOT} button[data-sidebar="trigger"] { margin-inline: -4px 0; width: 32px; height: 32px; }
/* Outside the desktop title bar the toggle heads the rail column, so it starts on the same edge. bb insets it by the rail padding,
   less 2px except on touch phones. */
${ROOT} button[data-sidebar="trigger"]:not([data-framed] *, [data-testid="app-desktop-sidebar-trigger"] *) { margin-inline-start: calc(var(--ambient-edge) - var(--bb-sidebar-rail-padding, 12px) + 2px); }
@media (width < 48rem) and (pointer: coarse) { ${ROOT} button[data-sidebar="trigger"]:not([data-framed] *, [data-testid="app-desktop-sidebar-trigger"] *) { margin-inline-start: calc(var(--ambient-edge) - var(--bb-sidebar-rail-padding, 12px)); } }
/* In the desktop title bar, back and forward share one chip like the sidebar toggle beside them. */
${ROOT} [data-framed] ${TITLE_BAR_HISTORY_PAIR} { ${GLASS_CHIP} border-radius: 12px; height: 32px; padding-inline: 2px; margin-inline-end: 7px; }
/* That chip widens the title-bar controls by 13px (edge, padding, gap). bb's reserve token grows with it, plus 1px so a collapsed-sidebar header
   pill sits one gap from the toggle. */
${ROOT} [data-framed] { --bb-window-title-bar-controls-end: calc(var(--bb-macos-traffic-light-reserve) + 3 * var(--bb-title-bar-control-size) + var(--bb-title-bar-sidebar-toggle-gap) + 14px); }
/* Outside the desktop title bar the pair sits in the sidebar header at the same 32px height; touch buttons fit inside it. */
${ROOT} ${HISTORY_PAIR} { height: 32px; }
${ROOT} ${HISTORY_PAIR} > button { max-height: 100%; }
/* Rail icons sit on the same opaque chip as the toggle above them; the column hugs its icons. */
${RAIL} { flex: 0 1 auto; width: auto; padding: 6px; ${GLASS_CHIP} border-radius: 12px; }
${RAIL_SETTINGS} { ${GLASS_CHIP} border-radius: 12px; width: 38px; height: 38px; margin-block: 0; }
/* The rail column starts on the window edge and at the content line: one gap under the title-bar chips. */
${ROOT} [data-testid="app-nav-rail"] { align-items: flex-start; padding-inline-start: var(--ambient-edge); margin-block-start: var(--ambient-rail-lift); }
/* Settings closes the bottom row: on the edge, and its bottom on the edge like the footer tray and the cards beside it. */
/* The row is one control plus one gap tall, so a footer panel open above it ends one gap above the tray. */
${ROOT} [data-testid="sidebar-navigation-rail"] ~ div:has(> button[aria-label^="Settings"]) { justify-content: flex-start; align-items: flex-end; block-size: calc(38px + var(--ambient-gap) + var(--ambient-edge) + env(safe-area-inset-bottom)); padding: 0 0 calc(var(--ambient-edge) + env(safe-area-inset-bottom)) var(--ambient-edge); }
/* Touch screens get bb's 36px rail buttons; Settings keeps the rail's width so the column's edges line up. */
@media (width < 48rem) and (pointer: coarse) { ${RAIL_SETTINGS} { width: 50px; } }
${ROOT} [data-testid="app-sidebar-top-reserve-row"] > div:nth-child(n) { margin-inline-end: 0; min-height: 32px; }
/* The header row lines up with the cards under it: same start, and its last pill ends where they end. */
${RAIL_SIDEBAR} [data-testid="app-sidebar-top-reserve-row"] { margin-inline: calc(var(--ambient-edge) + var(--ambient-gap) - var(--ambient-rail-cell-slack) - 8px) -1px; }
/* In the desktop window the sidebar's first row (New thread, a section's search, or nothing) starts on the content line too. */
${ROOT} [data-framed] [data-testid$="-sidebar-top-reserve-row"] { margin-block-start: calc(var(--ambient-content-top) - var(--bb-window-title-bar-height) - 9px); }
/* Header pills sit one gap apart, whatever gap bb gives the row. */
${ROOT} [data-testid="app-page-header-content-row"] { column-gap: var(--ambient-gap); }
${HEADER_FIRST} { flex: 0 1 auto; min-width: 0; min-height: 32px; margin-inline: -6px 0; padding-inline-start: 12px; }
/* In narrow windows the title pill starts one gap after the toggle; bb reserves 32px for it, or 40px on phones. */
@media (max-width: 767px) { ${HEADER_FIRST} { margin-inline-start: 0; } }
@media (max-width: 767px) and (pointer: coarse) { ${HEADER_FIRST} { margin-inline-start: -8px; } }
${HEADER_FIRST}:has([data-pane-header-focus-tab]) { background-image: linear-gradient(var(--state-active), var(--state-active)); }
${ROOT} [data-pane-header-focus-tab] { background-color: transparent; }
${ROOT} ${HEADER_ACTIONS} { margin-inline: auto -8px; min-height: 32px; }
${ROOT} ${HEADER_ACTIONS} button.border { border-color: transparent; }
/* bb pulls the desktop title bar's right-panel toggles, and the slot one reserves in split panes, out to the window edge; inside the pill and the panel they keep their padding. */
${ROOT} ${HEADER_ACTIONS} :is(${RIGHT_PANEL_BUTTON}, [data-thread-header-pane-actions] > span[aria-hidden]), ${RIGHT_PANEL} ${RIGHT_PANEL_BUTTON} { margin-inline-end: 0; }
/* The split panes' floating toggle sits exactly on that slot (bb's 16px chrome padding, less the pill's 8px overhang, plus its padding and gap). */
${ROOT} [data-testid="split-workspace-panel-toggle"] { right: 15px; }
${ROOT} [data-thread-header-workflow-actions]:not(:has(button, a)) { ${HIDE} }
${ROOT} ${HEADER_ACTIONS}:has(> [data-thread-header-pane-actions]) { column-gap: 0; }
${ROOT} ${HEADER_ACTIONS} [data-thread-header-pane-actions] { margin-inline-start: 0; column-gap: 0; }
@media (max-width: 767px) { ${ROOT} :is(div.fixed, ${HEADER_ACTIONS}) ${RIGHT_PANEL_BUTTON}, ${ROOT} [data-thread-header-pane-actions] button { width: 32px; height: 32px; } :is(${HEADER_FIRST}, ${ROOT} ${HEADER_ACTIONS}) { height: 32px; min-height: 32px; } ${ROOT} ${HEADER_ACTIONS}:has(${RIGHT_PANEL_BUTTON}) { padding-inline: 3px; } }
:is(${THREAD}, ${PAGE}, ${SIDEBAR_CARDS}, ${SECTION_BACK}, ${CHROME_PILLS}, ${RAIL}, ${RAIL_SETTINGS}, ${OVERLAY}) { --state-hover: ${INK_WASH}; --state-active: ${mix("var(--ink)", "15%")}; --sidebar-accent: var(--state-hover); }
/* The sidebar column ends 1px before the window card, so the cards end one gap before the thread and page cards. */
${SIDEBAR_CARDS} { ${GLASS_SURFACE} border-radius: 16px; margin-inline: calc(var(--ambient-edge) - var(--ambient-footer-seam, 0px)) calc(var(--ambient-gap) - 1px); }
${SECTION_BACK} { ${GLASS_SURFACE} border-block-end: 0; border-radius: 16px 16px 0 0; margin-inline: 8px calc(var(--ambient-gap) - 1px); padding-block: 8px 4px; box-shadow: inset 0 1px 0 ${mix("var(--canvas)", "60%")}; }
/* Beside the icon rail, the cards start one gap after it (bb's rail cell is the rail plus this slack). */
${RAIL_SIDEBAR} :is([data-sidebar="content"], [data-sidebar="footer"], [data-testid$="-sidebar-top-reserve-row"] + div:has(+ [data-sidebar="content"])) { margin-inline-start: calc(var(--ambient-edge) + var(--ambient-gap) - var(--ambient-rail-cell-slack)); }
/* In the rail layout the footer row below already holds one gap; the list card ends on it. Footer panels and the footer editor
   under the list share the cards' column and sit one gap above the tray, while the card above keeps its own height. */
${RAIL_SIDEBAR} [data-testid="app-sidebar-body"] > [data-sidebar="content"] { margin-block-end: 0; }
${RAIL_SIDEBAR} [data-testid="app-sidebar-body"] > [data-sidebar="content"] ~ div:not([data-testid]) { padding-inline: calc(var(--ambient-edge) + var(--ambient-gap) - var(--ambient-rail-cell-slack)) calc(var(--ambient-gap) - 1px); margin-block-start: auto; padding-block-start: 0; }
${RAIL_SIDEBAR} [data-testid="app-sidebar-body"] > [data-sidebar="content"] ~ div:not([data-testid]) > :first-child { margin-block-start: var(--ambient-gap); }
${SECTION_BACK} + [data-sidebar="content"] { border-block-start-color: transparent; border-start-start-radius: 0; border-start-end-radius: 0; box-shadow: 0 12px 32px -16px ${mix("var(--ink)", "35%")}; }
${SECTION_BACK} + [data-sidebar="content"] > .px-2:first-child { padding-block-start: 8px; }
:is(${SIDEBAR_CARDS}, ${OVERLAY}) .w-px.bg-border-hairline, :is(${SIDEBAR_CARDS}, ${OVERLAY}) [class*="before:bg-border-hairline"]::before { ${HIDE} }
${ROOT} [data-testid="sidebar-navigation-region"] { margin-block: 0 8px; }
${ROOT} [data-testid="sidebar-navigation-region"] [data-testid="navigation-divider"] { ${HIDE} }
${ROOT} [data-sidebar="content"] { flex: 0 1 auto; min-height: min(7rem, 18dvh); margin-block-end: auto; }
/* Without a footer, the card itself ends on the bottom edge. */
${ROOT} [data-sidebar="content"]:not(:has(~ [data-sidebar="footer"])) { margin-block-end: calc(var(--ambient-edge) - var(--ambient-footer-seam, 0px)); }
${ROOT} [data-sidebar="content"] > .px-2:first-child { padding-block-start: 12px; }
@media (max-height: 560px) { ${ROOT} [data-testid="sidebar-navigation-region"] { flex: 0 1 auto; min-height: 3rem; overflow-y: auto; } }
/* bb measures this row to decide which icons fit. Shrink-to-content makes overflow capacity depend on the icons it already hid. */
${SIDEBAR_FOOTER} { flex-shrink: 0; margin-block: 8px; align-self: stretch; width: auto; }
${ROOT} [data-framed] [data-sidebar="footer"] { margin-block: 0; }
/* The footer tray is a glass strip as tall as the Settings chip beside it, as wide as the cards above it, on the same bottom edge. */
${FOOTER_TRAY} { position: relative; isolation: isolate; background: none; box-shadow: none; ${NO_BLUR} block-size: 38px; padding-block: 0; margin-block: var(--ambient-gap) calc(var(--ambient-edge) - var(--ambient-footer-seam, 0px)); }
/* In the rail layout the footer shares a row with Settings: it fills the row's width and sits at its bottom. */
${ROOT} [data-testid="sidebar-footer-body"] [data-sidebar="footer"]:not(:has(> [data-overflow-fade])) { flex: 1 1 0%; min-inline-size: 0; align-self: flex-end; }
${FOOTER_TRAY}::before { ${LAYER} ${GLASS_SURFACE} border-radius: 12px; inset: 0; }
${SIDEBAR_FOOTER} [data-testid^="plugin-sidebar-footer-disclosure-"] { background-color: transparent; }
${ROOT} [data-testid^="plugin-sidebar-footer-disclosure-"] { border-color: transparent; }
${SIDEBAR_FOOTER} > [data-overflow-fade], ${SIDEBAR_FOOTER} > ul > li[aria-hidden="true"]:empty { ${HIDE} }
:is(${SIDEBAR_CARDS}, ${RIGHT_PANEL}) :is(.sticky, [data-sidebar-sticky-tier], [data-sidebar-sticky-stack]), ${OVERLAY} :is(.sticky:not(.bg-sidebar, .bg-background, .bg-popover), [data-sidebar-sticky-tier], [data-sidebar-sticky-stack]), :is(${SIDEBAR_CARDS}) [data-sidebar-sticky-stack]::before { ${NO_BLUR} }
:is(${SIDEBAR_CARDS}) [data-sidebar-sticky-stack] [data-sidebar-sticky-tier] { position: relative; top: auto; }
${RIGHT_PANEL} { ${GLASS_SURFACE} inset: var(--ambient-chip-top) 8px 8px 0; height: auto; max-width: calc(100% - 8px); border-radius: 20px; overflow: hidden; --background: transparent; --sidebar: transparent; }
/* A thread in the right panel (Side chat) uses the panel as its card: no centered card of its own, the same solid tint behind its text. */
${RIGHT_PANEL} [data-thread-window]::before, ${RIGHT_PANEL} [data-thread-window]::after { ${HIDE} }
${RIGHT_PANEL} [data-thread-window] { background-color: var(--ambient-glass-solid); }
${RIGHT_PANEL} [data-thread-window] > * { clip-path: none; }
/* Split panes' cards sit one gap apart: the invisible 1px separator overlaps the next pane instead of adding to the gap. */
${ROOT} [role="separator"][data-split-resize-grid-boundary] { margin-inline-end: -1px; }
${ROOT} [role="separator"][data-split-resize-grid-boundary] + div { --ambient-column-gutter: 0px; }
${ROOT} :is([role="separator"][data-split-resize-grid-boundary], [data-panel-resize-handle-id]):not(:hover, [data-dragging], [data-resize-handle-state="drag"]), ${ROOT} [data-panel-resize-handle-id]:not(:hover, [data-resize-handle-state="drag"]) > span { background-color: transparent; }
${RIGHT_PANEL} [data-app-browser] > [class~="flex-1"]:last-child { margin: 0 8px 8px; border-radius: 12px; overflow: hidden; }
${OVERLAY} { ${GLASS_PANE} --background: transparent; --popover: transparent; --sidebar: transparent; }
${OVERLAY}::before { ${LAYER} inset: 0; border-radius: inherit; ${BLUR} }
/* Menus inside a thread, like the text-selection menu, sit on dense text; their surface is opaque. */
${THREAD} [data-bb-portaled-overlay]:is([role="dialog"], [role="menu"], [role="listbox"]) { background-color: var(--ambient-background); }
${OVERLAY} .sticky:is(.bg-sidebar, .bg-background, .bg-popover) { --sidebar: transparent; --background: transparent; --popover: transparent; ${BLUR} }
${SHELL}[data-ambient-glass="solid"] ${OVERLAY} .sticky:is(.bg-sidebar, .bg-background, .bg-popover) { --sidebar: var(--ambient-glass-solid); --background: var(--ambient-glass-solid); --popover: var(--ambient-glass-solid); }
${OVERLAY}[data-testid="secondary-panel-shelf"] .sticky:is(.bg-sidebar, .bg-background, .bg-popover) { --sidebar: var(--ambient-glass-solid); --background: var(--ambient-glass-solid); --popover: var(--ambient-glass-solid); ${NO_BLUR} }
${SHELL} [data-bb-portaled-overlay] :is([data-palette-input-band], [data-palette-results-clip]) { background-color: transparent; }
${SHELL} [data-testid="secondary-panel-shelf"] { background-color: var(--ambient-glass-solid); ${BLUR} }`;
