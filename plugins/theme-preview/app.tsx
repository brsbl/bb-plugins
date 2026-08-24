import { definePluginApp, useBbNavigate, useRealtime, useRpc } from "@get-bb/plugin-sdk/app";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { rpcContract } from "./server";
import { placeThemeMenu, type ThemeMenuPlacement } from "./theme-menu";
import { LatestRequest, contrastRatio } from "./theme-utils";

// ---------------------------------------------------------------------------
// Everything reads the theme's CSS custom properties directly, and the mock
// mirrors what bb actually paints: surfaces, radii and borders were measured
// off the running app rather than invented, so a palette fails here the same
// way it fails there. Decoration bb's theme does not touch — icons, window
// chrome, nav lists — is left out on purpose.
// ---------------------------------------------------------------------------

const v = (name: string, fallback?: string): string =>
  fallback === undefined ? `var(--${name})` : `var(--${name}, ${fallback})`;
const SANS = v("font-sans", "ui-sans-serif, system-ui, sans-serif");
const MONO = v("font-mono", "ui-monospace, SFMono-Regular, Menlo, monospace");

// Measured off the running app: thread rows 10px, composer and messages 16px,
// code blocks 10px.
const R_ROW = 10;
const R_BUBBLE = 16;
const R_BLOCK = 10;

const VIEWS = ["thread", "new", "split", "settings"] as const;
type View = (typeof VIEWS)[number];
const VIEW_LABEL: Record<View, string> = {
  thread: "Thread",
  new: "New thread",
  split: "Split",
  settings: "Settings",
};
const VIEW_NOTE: Record<View, string> = {
  thread: "open thread · timeline TOC · side panel · row menu, hover card, toast",
  new: "empty state and composer",
  split: "two panes, one focused",
  settings: "page header, cards, controls",
};

// The frame is laid out at bb's real size and scaled to fit, so row heights and
// type sizes stay the sizes bb ships.
const FRAME_W = 1280;
const FRAME_H = 780;

type Mode = "light" | "dark";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function Dot({ color, size = 6 }: { color: string; size?: number }) {
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: 999, background: color, flex: "none" }} />;
}

function Eyebrow({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: v("muted-foreground"), ...style }}>
      {children}
    </div>
  );
}

type Tone = "outline" | "primary" | "secondary" | "success" | "warning" | "destructive" | "merged";
function Badge({ children, tone = "outline" }: { children: ReactNode; tone?: Tone }) {
  const tones: Record<Tone, CSSProperties> = {
    outline: { boxShadow: `inset 0 0 0 1px ${v("border")}`, color: v("foreground") },
    primary: { background: v("primary"), color: v("primary-foreground") },
    secondary: { background: v("secondary"), color: v("secondary-foreground") },
    success: { background: `color-mix(in srgb, ${v("success")} 16%, transparent)`, color: v("success") },
    warning: { background: `color-mix(in srgb, ${v("warning")} 16%, transparent)`, color: v("warning-text", v("warning")) },
    destructive: { background: `color-mix(in srgb, ${v("destructive")} 16%, transparent)`, color: v("destructive-text", v("destructive")) },
    merged: { background: `color-mix(in srgb, ${v("pr-merged")} 16%, transparent)`, color: v("pr-merged") },
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 20, padding: "0 7px", borderRadius: 6, fontSize: 11, fontWeight: 500, lineHeight: 1, whiteSpace: "nowrap", ...tones[tone] }}>
      {children}
    </span>
  );
}

// bb's Button variants (shared-ui/button.tsx): the default button is
// foreground-on-background — bb has no primary-filled button; --primary carries
// links, focus and accents.
type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive";
function Button({ children, variant = "default", size = "md", disabled = false }: { children: ReactNode; variant?: ButtonVariant; size?: "sm" | "md"; disabled?: boolean }) {
  const variants: Record<ButtonVariant, CSSProperties> = {
    default: { background: v("foreground"), color: v("background", v("canvas")) },
    secondary: { background: v("secondary"), color: v("secondary-foreground") },
    outline: { boxShadow: `inset 0 0 0 1px ${v("input")}`, color: v("foreground") },
    ghost: { color: v("foreground") },
    destructive: { background: v("destructive"), color: v("destructive-foreground") },
  };
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 8, whiteSpace: "nowrap",
        height: size === "sm" ? 26 : 30, padding: size === "sm" ? "0 10px" : "0 12px", fontSize: size === "sm" ? 12 : 13, fontWeight: 500,
        opacity: disabled ? 0.5 : 1, fontFamily: SANS, ...variants[variant],
      }}
    >
      {children}
    </span>
  );
}

function Switch({ on }: { on: boolean }) {
  return (
    <span style={{ width: 30, height: 17, borderRadius: 999, background: on ? v("primary") : v("input"), position: "relative", display: "inline-block", flex: "none" }}>
      <span style={{ position: "absolute", top: 2, left: on ? 15 : 2, width: 13, height: 13, borderRadius: 999, background: on ? v("primary-foreground") : v("background", "#fff") }} />
    </span>
  );
}

function TextInput({ focused = false, value, placeholder, width = 190 }: { focused?: boolean; value?: string; placeholder?: string; width?: number }) {
  return (
    <div
      style={{
        height: 30, width, borderRadius: 8, boxSizing: "border-box", padding: "0 10px", display: "flex", alignItems: "center", gap: 1,
        boxShadow: focused ? `inset 0 0 0 1px ${v("ring")}, 0 0 0 3px color-mix(in srgb, ${v("ring")} 28%, transparent)` : `inset 0 0 0 1px ${v("input")}`,
        background: v("background", "transparent"), fontSize: 12.5, fontFamily: SANS, color: value ? v("foreground") : v("muted-foreground"),
      }}
    >
      {value ?? placeholder}
      {focused ? <span style={{ width: 1, height: 14, background: v("foreground") }} /> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar. Carries bb's real `fixed bg-sidebar` classes so any theme block
// scoped to that selector (token overrides, the noise overlay) applies here
// exactly as it does in the app.
// ---------------------------------------------------------------------------

const sidebarScope: CSSProperties = { position: "relative", inset: "auto", zIndex: "auto" };

// From bb's sidebarRowClasses.ts: hover paints bg-sidebar-accent with
// sidebar-accent-foreground text; the open thread's row paints bg-state-active
// (CONTEXT_SELECTION_SURFACE_CLASS); open-in-split resolves sidebar-accent 50%
// against the sidebar unless the theme overrides the variable.
type RowState = "rest" | "hover" | "selected" | "split";
function rowStyle(state: RowState): CSSProperties {
  switch (state) {
    case "hover": return { background: v("sidebar-accent"), color: v("sidebar-accent-foreground") };
    case "selected": return { background: v("state-active") };
    case "split": return { background: v("bb-sidebar-open-in-split-background", `color-mix(in oklch, ${v("sidebar-accent")} 50%, ${v("sidebar")})`) };
    default: return {};
  }
}

// The dots bb actually draws: a 5px foreground dot for unread, a muted dot for
// working status (SIDEBAR_UNREAD_DOT_CLASS / SIDEBAR_SUCCESS_STATUS_DOT_CLASS).
function Row({ label, state = "rest", dot }: { label: string; state?: RowState; dot?: "unread" | "status" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, height: 28, padding: "0 10px", borderRadius: R_ROW, fontSize: 13, color: v("sidebar-foreground"), ...rowStyle(state) }}>
      <span style={{ flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{label}</span>
      {dot === "unread" ? <Dot color={v("foreground")} size={5} /> : dot === "status" ? <Dot color={`color-mix(in srgb, ${v("muted-foreground")} 60%, transparent)`} size={5} /> : null}
    </div>
  );
}

function Sidebar({ selected, split, hover }: { selected?: boolean; split?: boolean; hover?: boolean }) {
  return (
    <div
      className="fixed bg-sidebar"
      style={{
        ...sidebarScope, width: 248, height: "100%", flex: "none", background: v("sidebar"), color: v("sidebar-foreground"),
        // bb's sidebar divider is border-border-seam; a theme's scoped seam
        // (blacklight's orange line) still arrives via the element class.
        borderRight: `1px solid ${v("border-seam", v("border"))}`, display: "flex", flexDirection: "column", padding: "10px 8px", boxSizing: "border-box", fontFamily: SANS,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", height: 30, padding: "0 10px", fontSize: 13, fontWeight: 600 }}>bb-plugins</div>
      {/* bb renders New thread as a ghost row, not a filled button. */}
      <Row label="New thread" />
      <div style={{ fontSize: 11, color: v("muted-foreground"), padding: "6px 10px 4px" }}>Today</div>
      <Row label="Endless theme family — blacklight" state={selected ? "selected" : "rest"} dot="unread" />
      <Row label="Specimen sheets + social grid" state={split ? "split" : "rest"} dot="status" />
      <Row label="theme-preview plugin" state={hover ? "hover" : "rest"} />
      <Row label="Crit: endless-color light foil" dot="unread" />
      <div style={{ fontSize: 11, color: v("muted-foreground"), padding: "12px 10px 4px" }}>Yesterday</div>
      <Row label="Fix pink split row (oklch mix)" dot="status" />
      <Row label="Hue census battery" />
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", height: 30, padding: "0 10px", fontSize: 12.5, color: v("muted-foreground") }}>brsbl</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overlays
// ---------------------------------------------------------------------------

const popover: CSSProperties = {
  background: v("popover"), color: v("popover-foreground"),
  boxShadow: `inset 0 0 0 1px ${v("border")}, ${v("shadow-md", "0 4px 16px rgba(0,0,0,.2)")}`,
  borderRadius: 10, fontFamily: SANS, fontSize: 13,
};

function MenuItem({ children, hover = false, destructive = false, kbd }: { children: ReactNode; hover?: boolean; destructive?: boolean; kbd?: string }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 8, height: 28, padding: "0 10px", borderRadius: 6, margin: "0 4px",
        background: hover ? v("accent") : undefined,
        color: destructive ? v("destructive-text", v("destructive")) : hover ? v("accent-foreground") : v("popover-foreground"),
      }}
    >
      <span style={{ flex: 1 }}>{children}</span>
      {kbd ? <span style={{ fontFamily: MONO, fontSize: 11, color: v("muted-foreground") }}>{kbd}</span> : null}
    </div>
  );
}

function Menu({ style }: { style?: CSSProperties }) {
  return (
    <div style={{ ...popover, width: 200, padding: "5px 0", ...style }}>
      <MenuItem kbd="⌘⇧O">Open in split</MenuItem>
      <MenuItem hover kbd="⌘R">Rename</MenuItem>
      <MenuItem>Move to section</MenuItem>
      <div style={{ height: 1, background: v("border"), margin: "5px 0" }} />
      <MenuItem destructive>Delete thread</MenuItem>
    </div>
  );
}

function HoverCard({ style }: { style?: CSSProperties }) {
  return (
    <div style={{ ...popover, width: 280, padding: 13, ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
        <Dot color={v("warning")} /> <span style={{ fontWeight: 600 }}>Specimen sheets + social grid</span>
      </div>
      <div style={{ fontSize: 12.5, color: v("muted-foreground"), lineHeight: "18px", marginBottom: 10 }}>
        Regenerating both sheets against the new ramp.
      </div>
      <div style={{ display: "flex", gap: 6 }}><Badge tone="outline">bb/endless-theme</Badge><Badge tone="merged">#42</Badge></div>
    </div>
  );
}

function Toast({ style }: { style?: CSSProperties }) {
  return (
    <div style={{ ...popover, width: 280, padding: "11px 13px", display: "flex", gap: 10, alignItems: "flex-start", boxShadow: `inset 0 0 0 1px ${v("border")}, ${v("shadow-lg", "0 8px 24px rgba(0,0,0,.25)")}`, ...style }}>
      <Dot color={v("success")} size={8} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>Theme applied</div>
        <div style={{ fontSize: 12.5, color: v("muted-foreground") }}>endless-color is now active.</div>
      </div>
    </div>
  );
}

function Tooltip({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <span style={{ ...popover, padding: "5px 9px", fontSize: 12, borderRadius: 7, whiteSpace: "nowrap", ...style }}>{children}</span>;
}


// ---------------------------------------------------------------------------
// Thread. Surfaces measured off the running app: the composer sits on the
// canvas with a 1px border (not on --card), and messages and code blocks are
// the faintest recessed wash with a seam border.
// ---------------------------------------------------------------------------

function Bubble({ children }: { children: ReactNode }) {
  return (
    <div style={{ alignSelf: "flex-end", maxWidth: "70%", background: v("surface-recessed", "rgba(127,127,127,.05)"), boxShadow: `inset 0 0 0 1px ${v("border-seam", v("border"))}`, borderRadius: R_BUBBLE, padding: "10px 14px" }}>
      {children}
    </div>
  );
}

function CodeBlock() {
  const line = (text: string, kind?: "add" | "del") => (
    <div key={text} style={{ padding: "0 12px", whiteSpace: "pre", background: kind === "add" ? `color-mix(in srgb, ${v("diff-added")} 18%, transparent)` : kind === "del" ? `color-mix(in srgb, ${v("diff-removed")} 18%, transparent)` : undefined }}>
      {text}
    </div>
  );
  return (
    <div style={{ borderRadius: R_BLOCK, overflow: "hidden", boxShadow: `inset 0 0 0 1px ${v("border-seam", v("border"))}`, fontFamily: MONO, fontSize: 12, lineHeight: "19px", color: v("foreground"), padding: "8px 0" }}>
      <div style={{ padding: "0 12px 6px", fontSize: 11, display: "flex", gap: 8, color: v("muted-foreground") }}>
        <span style={{ color: v("file-accent", v("muted-foreground")) }}>themes/endless-color.css</span><span>+2 −1</span>
      </div>
      {line("  .dark .fixed.bg-sidebar {")}
      {line("-   --sidebar: #1d1d1d;", "del")}
      {line("+   --sidebar: #070707;", "add")}
      {line("  }")}
    </div>
  );
}

function Composer({ focused = false, text }: { focused?: boolean; text?: string }) {
  return (
    <div
      style={{
        borderRadius: R_BUBBLE, background: v("background", v("canvas")), padding: "12px 12px 10px", display: "flex", flexDirection: "column", gap: 12,
        boxShadow: focused
          ? `inset 0 0 0 1px ${v("ring")}, 0 0 0 3px color-mix(in srgb, ${v("ring")} 25%, transparent)`
          : `inset 0 0 0 1px ${v("border")}`,
      }}
    >
      <div style={{ fontSize: 13.5, color: text ? v("foreground") : v("muted-foreground"), minHeight: 20 }}>{text ?? "Ask for a follow-up."}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12, color: v("muted-foreground") }}>claude-fable-5</span>
        <div style={{ flex: 1 }} />
        <div style={{ width: 26, height: 26, borderRadius: 8, background: text ? v("primary") : v("muted"), color: text ? v("primary-foreground") : v("muted-foreground"), display: "grid", placeItems: "center", fontSize: 12 }}>↑</div>
      </div>
    </div>
  );
}

function VerificationCard() {
  const rows: ReadonlyArray<[string, string, Tone]> = [
    ["Theme tokens", "28 resolved", "success"],
    ["Contrast floor", "AA passed", "success"],
    ["Reference sheet", "Updated", "secondary"],
  ];
  return (
    <div style={{ borderRadius: R_BLOCK, background: v("surface-recessed", "rgba(127,127,127,.05)"), boxShadow: `inset 0 0 0 1px ${v("border-seam", v("border"))}`, padding: "10px 12px" }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Verification summary</div>
      {rows.map(([label, value, tone]) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 25, borderTop: `1px solid ${v("border-hairline", v("border"))}` }}>
          <span style={{ flex: 1, color: v("muted-foreground") }}>{label}</span>
          <Badge tone={tone}>{value}</Badge>
        </div>
      ))}
    </div>
  );
}

function TimelineToc() {
  const items = [
    "Three blacks were fragmenting the frame…",
    "Selection now reads rgba(47,180,255,.20)…",
    "Tightened the raised surfaces and kept seams neutral…",
  ];
  return (
    <div style={{ position: "absolute", right: 10, top: 58, zIndex: 4, display: "flex", alignItems: "flex-start" }}>
      <div
        id="thread-toc-panel-preview"
        style={{
          position: "absolute", right: 36, top: 0, width: 292, paddingRight: 4,
        }}
      >
        <div data-tp-toc="panel" style={{ padding: 4, borderRadius: 8, background: v("popover"), color: v("popover-foreground"), boxShadow: `inset 0 0 0 1px ${v("border")}, ${v("shadow-lg", "0 8px 24px rgba(0,0,0,.22)")}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 2, paddingBottom: 4 }}>
            <span style={{ borderRadius: 6, padding: "5px 8px", background: v("state-hover"), color: v("foreground"), fontSize: 11.5, fontWeight: 600 }}>Agent messages</span>
            <span style={{ borderRadius: 6, padding: "5px 8px", color: v("muted-foreground"), fontSize: 11.5 }}>Your messages</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {items.map((item, index) => (
              <div
                key={item}
                style={{
                  borderRadius: 6, padding: "6px 8px", fontSize: 12, lineHeight: "16px",
                  background: index === 1 ? v("state-hover") : undefined,
                  color: index === 1 ? v("foreground") : v("muted-foreground"),
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div aria-label="Thread table of contents" style={{ width: 32, padding: "8px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        {[12, 12, 20, 12, 12].map((width, index) => (
          <span key={index} style={{ width, height: 3, borderRadius: 999, background: index === 2 ? `color-mix(in srgb, ${v("foreground")} 70%, transparent)` : `color-mix(in srgb, ${v("foreground")} 20%, transparent)` }} />
        ))}
      </div>
    </div>
  );
}

function Thread({ title = "Endless theme family — blacklight pass", active = true, narrow = false, empty = false, marker = false, toc = false, children }: { title?: string; active?: boolean; narrow?: boolean; empty?: boolean; marker?: boolean; toc?: boolean; children?: ReactNode }) {
  const pad = narrow ? 20 : 30;
  return (
    <div style={{ flex: 1, minWidth: 0, height: "100%", background: v("canvas", v("background")), color: v("foreground"), display: "flex", flexDirection: "column", fontFamily: SANS, position: "relative" }}>
      {empty ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: `0 ${pad}px` }}>
          <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.01em" }}>What are we building?</div>
          <div style={{ width: "100%", maxWidth: 620 }}><Composer focused text="make the blacklight variant feel like the reference" /></div>
          <div style={{ display: "flex", gap: 8 }}>
            {["Fix the failing build", "Review open PRs"].map((s) => (
              <span key={s} style={{ fontSize: 12.5, padding: "6px 12px", borderRadius: 999, boxShadow: `inset 0 0 0 1px ${v("border")}`, color: v("muted-foreground") }}>{s}</span>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div style={{ height: 48, display: "flex", alignItems: "center", gap: 10, padding: `0 ${pad}px`, flex: "none", position: "relative" }}>
            {marker && active ? <span style={{ position: "absolute", left: 0, right: 0, top: 0, height: 2, background: v("primary") }} /> : null}
            <span style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{title}</span>
            <Badge tone="success"><Dot color={v("success")} size={6} /> Running</Badge>
            {narrow ? null : <Badge tone="outline">bb/endless-theme-plugin</Badge>}
          </div>
          <div style={{ flex: 1, overflow: "hidden", padding: `22px ${toc ? 54 : pad}px 0 ${pad}px`, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16, fontSize: 13.5, lineHeight: "21px" }}>
            <Bubble>make the blacklight variant feel like the reference — neon orange seam, blue selection, calm UV canvas.</Bubble>
            <div>
              Three blacks were fragmenting the frame. The base theme's{" "}
              <code style={{ fontFamily: MONO, fontSize: "0.92em", fontWeight: 600, background: v("surface-recessed"), padding: "1px 5px", borderRadius: 4 }}>.fixed.bg-sidebar</code>{" "}
              block was overriding the variant's sidebar tokens, so it rendered <span style={{ fontFamily: MONO, fontSize: "0.92em" }}>#1d1d1d</span> instead of true black.
            </div>
            <CodeBlock />
            <div style={{ color: v("muted-foreground"), fontSize: 12.5, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 1, height: 18, background: v("timeline-accent", v("border")) }} />
              14:02 · <span style={{ color: v("file-accent", v("muted-foreground")), fontFamily: MONO }}>themes/endless-color.css</span>
            </div>
            <Bubble>looks right — now match the selection blue to the glove.</Bubble>
            <div>
              Done. Selection now reads <span style={{ fontFamily: MONO, fontSize: "0.92em" }}>rgba(47,180,255,.20)</span> over the canvas, and file paths pick up the
              glove's steel blue — <span style={{ color: v("file-accent", v("muted-foreground")), fontFamily: MONO, fontSize: "0.92em" }}>build-color.py</span> shows it inline.
              <span data-tp-selection="sample" style={{ background: v("selection-color-default", v("surface-selected")), color: v("foreground"), borderRadius: 3, padding: "0 3px", WebkitBoxDecorationBreak: "clone", boxDecorationBreak: "clone" }}> Selected text stays readable.</span>
            </div>
            <div style={{ color: v("muted-foreground"), fontSize: 12.5, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 1, height: 18, background: v("timeline-accent", v("border")) }} />
              14:18 · checks completed
            </div>
            <VerificationCard />
            <Bubble>keep the hierarchy calm — orange should guide the eye, not fill the room.</Bubble>
            <div>
              Tightened the raised surfaces and kept the content seams neutral. The sidebar edge is the only persistent orange line; focus and selection stay blue, so the two signals never compete.
            </div>
          </div>
          <div style={{ padding: `12px ${pad}px 18px`, flex: "none" }}><Composer focused={active} /></div>
        </>
      )}
      {toc ? <TimelineToc /> : null}
      {children}
    </div>
  );
}

function InfoPanel() {
  const kv = (k: string, val: ReactNode) => (
    <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, fontSize: 12.5, height: 28 }}>
      <span style={{ color: v("muted-foreground") }}>{k}</span>
      <span style={{ color: v("foreground"), textAlign: "right", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{val}</span>
    </div>
  );
  return (
    <div
      // The real right panel is `bg-sidebar` WITHOUT `fixed` (probe: no seam, no
      // scoped overrides), so it must not carry the class the sidebar rule targets.
      className="bg-sidebar"
      style={{ ...sidebarScope, width: 280, height: "100%", flex: "none", background: v("sidebar"), color: v("sidebar-foreground"), borderLeft: `1px solid ${v("border-seam", v("border"))}`, fontFamily: SANS, display: "flex", flexDirection: "column" }}
    >
      <div style={{ height: 48, display: "flex", alignItems: "center", gap: 14, padding: "0 16px", fontSize: 12.5 }}>
        {["Info", "Files", "Changes"].map((t, i) => (
          <span key={t} style={{ color: i === 0 ? v("foreground") : v("muted-foreground"), fontWeight: i === 0 ? 600 : 400 }}>{t}</span>
        ))}
      </div>
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          {kv("Status", <Badge tone="success">Running</Badge>)}
          {kv("Agent", "Claude Fable 5")}
          {kv("Branch", <span style={{ fontFamily: MONO, fontSize: 12 }}>bb/endless-theme</span>)}
          {kv("Pull request", <Badge tone="merged">Merged #42</Badge>)}
        </div>
        <div>
          <Eyebrow style={{ marginBottom: 4 }}>Files</Eyebrow>
          {["themes/endless-color.css", "build-color.py"].map((f) => (
            <div key={f} style={{ height: 24, fontSize: 12.5, fontFamily: MONO, color: v("file-accent", v("foreground")), overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{f}</div>
          ))}
        </div>
        <div style={{ borderRadius: R_BLOCK, background: v("surface-recessed-soft-solid", v("card")), boxShadow: `inset 0 0 0 1px ${v("border-hairline", v("border"))}`, padding: "10px 12px", fontSize: 12.5, color: v("readback-foreground", v("muted-foreground")), lineHeight: "18px" }}>
          Sidebar reads true black with the orange seam; blue selection at .20.
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div style={{ flex: 1, minWidth: 0, height: "100%", background: v("canvas", v("background")), color: v("foreground"), fontFamily: SANS, overflow: "hidden" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 32px" }}>
        <div style={{ borderRadius: 14, padding: "24px 26px", marginBottom: 22, background: `linear-gradient(135deg, ${v("secondary")} 0%, ${v("accent")} 100%)`, boxShadow: `inset 0 0 0 1px ${v("border-hairline", v("border"))}` }}>
          <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 6 }}>Extensions</div>
          <div style={{ fontSize: 13.5, color: v("muted-foreground"), maxWidth: 440, lineHeight: "20px" }}>Plugins add surfaces, agents and themes to bb.</div>
        </div>
        <div style={{ display: "flex", gap: 18, borderBottom: `1px solid ${v("border")}`, marginBottom: 18, fontSize: 13 }}>
          {["Installed", "Marketplace", "Themes"].map((t, i) => (
            <span key={t} style={{ padding: "0 0 8px", color: i === 0 ? v("foreground") : v("muted-foreground"), fontWeight: i === 0 ? 600 : 400, boxShadow: i === 0 ? `inset 0 -2px 0 0 ${v("primary")}` : undefined }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {["Endless", "Endless Color", "Theme Preview", "Plugin Guide"].map((name, i) => (
            <div key={name} style={{ borderRadius: 12, background: v("card"), boxShadow: `inset 0 0 0 1px ${v("border")}, ${v("shadow-xs", "none")}`, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                <div style={{ fontSize: 12, color: v("muted-foreground") }}>v0.1.{i}</div>
              </div>
              <Switch on={i !== 3} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The frame
// ---------------------------------------------------------------------------

function FrameView({ view }: { view: View }) {
  switch (view) {
    case "thread":
      // Overlays are anchored to the things that open them: the context menu
      // hangs off the open thread's row, the hover card off the row under it,
      // the toast sits in bb's toast corner. No free-floating chrome.
      return (
        <>
          <Sidebar selected />
          <Thread toc />
          <InfoPanel />
          <Menu style={{ position: "absolute", left: 196, top: 118, zIndex: 5 }} />
          <HoverCard style={{ position: "absolute", left: 254, top: 292, zIndex: 5 }} />
          {/* bb toasts land in the window's bottom-right corner. */}
          <Toast style={{ position: "absolute", right: 20, bottom: 20, zIndex: 5 }} />
        </>
      );
    case "new":
      return <><Sidebar hover /><Thread empty /></>;
    case "split":
      return (
        <>
          <Sidebar selected split />
          <Thread narrow marker />
          <div style={{ width: 1, background: v("border-seam-vertical", v("border-seam", v("border"))), flex: "none" }} />
          <Thread title="Specimen sheets + social grid" active={false} narrow marker />
        </>
      );
    case "settings":
      return <><Sidebar /><SettingsPage /></>;
  }
}

function Frame({ view, fitBoth = false }: { view: View; fitBoth?: boolean }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [fit, setFit] = useState({ zoom: 0.8, height: FRAME_H });
  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    // Width sets the scale; the mock window then takes whatever height the pane
    // gives it — a bb window is resizable, so a taller mock is still truthful
    // and the pane has no dead space.
    const measure = () => {
      if (fitBoth) {
        const zoom = Math.min(1, Math.max(0.24, Math.min(el.clientWidth / FRAME_W, el.clientHeight / FRAME_H)));
        setFit({ zoom, height: FRAME_H });
        return;
      }
      const zoom = Math.min(1, Math.max(0.24, el.clientWidth / FRAME_W));
      const height = Math.min(1400, Math.max(620, Math.floor(el.clientHeight / zoom)));
      setFit({ zoom, height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitBoth]);
  return (
    <div ref={hostRef} style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "flex-start", justifyContent: "center", overflow: "hidden" }}>
      <div
        style={{
          width: FRAME_W, height: fit.height, zoom: fit.zoom, display: "flex", overflow: "hidden", borderRadius: 12, position: "relative", flex: "none",
          boxShadow: v("shadow-lg", "0 10px 30px rgba(0,0,0,.25)"), background: v("canvas", v("background")),
        }}
      >
        <FrameView view={view} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Style guide — a dense table rather than a wall of cards. Surface values and
// the working theme picker live in the rail; visual component specimens and
// the remaining token families use the wide sheet below the mock.
// ---------------------------------------------------------------------------

const SURFACE_TOKENS = ["canvas", "sidebar", "card", "popover", "secondary", "muted", "surface-recessed-solid", "surface-scrim"] as const;
const GUIDE_GROUPS: ReadonlyArray<{ title: string; tokens: readonly string[] }> = [
  { title: "Ink", tokens: ["foreground", "muted-foreground", "subtle-foreground", "readback-foreground", "sidebar-foreground"] },
  { title: "Accent", tokens: ["primary", "file-accent", "timeline-accent", "surface-selected", "state-hover", "state-active"] },
  { title: "Status", tokens: ["success", "warning", "destructive", "pr-merged", "diff-added", "diff-removed"] },
  { title: "Lines", tokens: ["border", "border-hairline", "border-seam", "sidebar-border", "input", "ring"] },
];
const ALL_TOKENS = [...SURFACE_TOKENS, ...GUIDE_GROUPS.flatMap((group) => group.tokens)];

type Computed = Record<string, { value: string; hex: string; rgb: string; sidebar: string | null }>;

function resolveColor(color: string): { rgb: string; hex: string } {
  const m = /rgba?\(([^)]+)\)/.exec(color);
  let channels: readonly number[] | null = null;
  if (m) {
    channels = m[1].split(",").map((p) => parseFloat(p.trim()));
  } else if (color) {
    // Chrome may preserve authored oklch()/oklab()/color-mix() syntax in
    // computed styles. Painting one pixel asks the browser's color engine for
    // the actual sRGB result without duplicating its conversion math here.
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (context) {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
      channels = [r, g, b, a / 255];
    }
  }
  if (!channels || channels.length < 3 || channels.some((channel) => !Number.isFinite(channel))) return { rgb: "", hex: "—" };
  const [r, g, b, a] = channels;
  const rounded = [r, g, b].map((channel) => Math.round(channel));
  const baseHex = "#" + rounded.map((channel) => channel.toString(16).padStart(2, "0")).join("");
  const alpha = a === undefined ? 1 : a;
  return {
    rgb: alpha < 1 ? `rgba(${rounded.join(", ")}, ${alpha})` : `rgb(${rounded.join(", ")})`,
    hex: alpha < 1 ? `${baseHex} ${Math.round(alpha * 100)}%` : baseHex,
  };
}

function useComputedTokens(names: readonly string[], revision: string): Computed {
  const [out, setOut] = useState<Computed>({});
  useEffect(() => {
    // Re-read on every theme/mode change (revision) — a beat later, because the
    // theme CSS lands asynchronously after the rpc response.
    const timer = setTimeout(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    const probe = document.createElement("div");
    probe.className = "fixed bg-sidebar";
    probe.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:0;height:0;pointer-events:none";
    document.body.appendChild(probe);
    const sidebarStyle = getComputedStyle(probe);
    const swatch = document.createElement("span");
    swatch.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px";
    document.body.appendChild(swatch);
    const next: Computed = {};
    for (const name of names) {
      const value = rootStyle.getPropertyValue(`--${name}`).trim();
      const scoped = sidebarStyle.getPropertyValue(`--${name}`).trim();
      swatch.style.backgroundColor = "";
      swatch.style.backgroundColor = `var(--${name})`;
      const resolved = value ? resolveColor(getComputedStyle(swatch).backgroundColor) : { rgb: "", hex: "—" };
      next[name] = {
        value,
        hex: resolved.hex,
        rgb: resolved.rgb,
        sidebar: scoped && scoped !== value ? scoped : null,
      };
    }
    probe.remove();
    swatch.remove();
    setOut(next);
    }, 350);
    return () => clearTimeout(timer);
  }, [names, revision]);
  return out;
}

function TokenRow({ name, computed, contrastAgainst }: { name: string; computed: Computed; contrastAgainst?: string }) {
  const c = computed[name];
  // Ink rows carry their WCAG ratio against the surface they sit on; the 4.5:1
  // body-text floor is the pass mark.
  const ratio = contrastAgainst && c?.rgb && computed[contrastAgainst]?.rgb
    ? contrastRatio(c.rgb, computed[contrastAgainst].rgb, contrastAgainst === "canvas" ? undefined : computed.canvas?.rgb)
    : null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: contrastAgainst ? "24px minmax(0, 1fr) 72px 46px" : "24px minmax(0, 1fr) 72px", alignItems: "center", columnGap: 6, height: 22 }}>
      <span
        title={c?.sidebar ? `${c.value}\nsidebar: ${c.sidebar}` : c?.value}
        style={{
          width: 24, height: 14, borderRadius: 3, background: c?.value ? v(name) : "transparent",
          boxShadow: `inset 0 0 0 1px ${c?.sidebar ? v("warning") : v("border-hairline", v("border"))}`,
        }}
      />
      <span style={{ fontFamily: MONO, fontSize: 10.5, color: v("foreground"), overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{name}</span>
      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", fontFamily: MONO, fontSize: 10.5, color: v("muted-foreground"), textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{c?.hex ?? ""}</span>
      {contrastAgainst ? (
        <span
          title={`contrast vs --${contrastAgainst} · WCAG floor 4.5:1`}
          style={{ fontFamily: MONO, fontSize: 10.5, textAlign: "right", fontVariantNumeric: "tabular-nums", color: ratio === null || ratio >= 4.5 ? v("success") : v("destructive-text", v("destructive")), fontWeight: ratio !== null && ratio < 4.5 ? 600 : 400, whiteSpace: "nowrap" }}
        >
          {ratio === null ? "" : `${ratio.toFixed(2)}:1`}
        </span>
      ) : null}
    </div>
  );
}

function GuideBlock({ title, note, wide = false, children }: { title: string; note?: string; wide?: boolean; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 14, gridColumn: wide ? "1 / -1" : undefined, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, minHeight: 18, marginBottom: 6, overflow: "hidden" }}>
        <span style={{ fontSize: 12, fontWeight: 650, color: v("foreground"), whiteSpace: "nowrap" }}>{title}</span>
        {note ? <span style={{ minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontSize: 10.5, color: v("muted-foreground") }}>{note}</span> : null}
      </div>
      {children}
    </div>
  );
}

function TypeSpecimen() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.005em" }}>Title · foreground 600</span>
      <span style={{ fontSize: 13.5 }}>Body at 13.5 — the thing most pixels are.</span>
      <span style={{ fontSize: 13, color: v("muted-foreground") }}>Muted · labels and captions</span>
      <span style={{ fontSize: 12.5, color: v("subtle-foreground", v("muted-foreground")) }}>Subtle · secondary metadata</span>
      <span style={{ fontSize: 13 }}>
        inline <code style={{ fontFamily: MONO, fontSize: "0.92em", fontWeight: 600, background: v("surface-recessed"), padding: "1px 5px", borderRadius: 4 }}>--token</code>
        {" · "}<span style={{ fontFamily: MONO, fontSize: 12.5, color: v("file-accent", "inherit") }}>path/file.tsx</span>
        {" · "}<span style={{ color: v("primary"), textDecoration: "underline", textUnderlineOffset: 3 }}>link</span>
      </span>
    </div>
  );
}

function SurfaceControls({ computed, catalog, mode, onPick }: { computed: Computed; catalog: Catalog; mode: Mode; onPick: (themeId: string, mode: Mode) => void }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, minHeight: 22, marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 650, letterSpacing: "-0.005em" }}>Theme surfaces</span>
        <span style={{ fontSize: 10.5, color: v("muted-foreground") }}>live values</span>
      </div>
      <GuideBlock title="Theme" note="applies live">
        <ThemePicker catalog={catalog} mode={mode} onPick={onPick} />
      </GuideBlock>
      <GuideBlock title="Surfaces" note="amber = sidebar override">
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {SURFACE_TOKENS.map((token) => <TokenRow key={token} name={token} computed={computed} />)}
        </div>
      </GuideBlock>
    </div>
  );
}

function StyleGuide({ computed }: { computed: Computed }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 9, minHeight: 22, marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 650, letterSpacing: "-0.005em" }}>Style guide</span>
        <span style={{ fontSize: 11, color: v("muted-foreground") }}>visual specimens + live token readout</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", columnGap: 24, alignItems: "start" }}>

      <GuideBlock title="Visual controls" note="preview only" wide>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <Button size="sm">Default</Button><Button size="sm" variant="secondary">Secondary</Button>
          <Button size="sm" variant="outline">Outline</Button><Button size="sm" variant="destructive">Delete</Button>
          <Switch on />
          <TextInput placeholder="Search threads…" width={150} /><TextInput focused value="endless" width={110} />
          <Badge tone="success"><Dot color={v("success")} size={6} /> Running</Badge><Badge tone="warning">Attention</Badge>
          <Badge tone="destructive">Failed</Badge><Badge tone="merged">Merged</Badge><Badge tone="outline">branch</Badge>
        </div>
      </GuideBlock>

      <GuideBlock title="Type" note="visual specimen">
        <TypeSpecimen />
      </GuideBlock>

      {GUIDE_GROUPS.map((group) => (
        <GuideBlock
          key={group.title}
          title={group.title}
          note={group.title === "Ink" ? "ratio vs its surface · floor 4.5:1" : group.title === "Status" ? "ratio vs canvas" : undefined}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {group.tokens.map((token) => (
              <TokenRow
                key={token}
                name={token}
                computed={computed}
                contrastAgainst={
                  group.title === "Ink" ? (token === "sidebar-foreground" ? "sidebar" : "canvas")
                  : group.title === "Status" ? "canvas"
                  : undefined
                }
              />
            ))}
          </div>
        </GuideBlock>
      ))}

      <GuideBlock title="Sidebar rows" note="1:1, in the real sidebar scope">
        <div className="fixed bg-sidebar" style={{ ...sidebarScope, overflow: "hidden", background: v("sidebar"), boxShadow: `inset 0 0 0 1px ${v("border-seam", v("border"))}`, borderRadius: 10, padding: 6 }}>
          <Row label="rest · unread" dot="unread" />
          <Row label="hover · sidebar-accent" state="hover" />
          <Row label="open thread · state-active" state="selected" />
          <Row label="open in split" state="split" dot="status" />
        </div>
      </GuideBlock>

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The theme control: palette and mode in one dropdown. Every row previews the
// theme it names — its prominent colours as chips, its two faces as live type —
// so the choice is made on appearance rather than on an id.
// ---------------------------------------------------------------------------

type Swatch = {
  canvas: string | null; sidebar: string | null; card: string | null;
  primary: string | null; accent: string | null; foreground: string | null;
  fontSans: string | null; fontMono: string | null;
};
type ThemeEntry = { id: string; name: string; light: Swatch | null; dark: Swatch | null };
type Catalog = { activeThemeId: string | null; themes: ThemeEntry[]; revision: number };

const CHIP_KEYS = ["sidebar", "canvas", "card", "primary", "accent"] as const;

function Chips({ swatch, w = 13, h = 20 }: { swatch: Swatch | null; w?: number; h?: number }) {
  return (
    <span style={{ display: "flex", gap: 3, flex: "none" }}>
      {CHIP_KEYS.map((key) => (
        <span
          key={key}
          title={`--${key === "accent" ? "file-accent" : key}: ${swatch?.[key] ?? "bundled with the app, not readable from disk"}`}
          style={{
            width: w, height: h, borderRadius: 3, flex: "none", background: swatch?.[key] ?? "transparent",
            boxShadow: `inset 0 0 0 1px ${swatch?.[key] ? v("border-hairline", v("border")) : v("border")}`,
            opacity: swatch?.[key] ? 1 : 0.35,
          }}
        />
      ))}
    </span>
  );
}

function ThemeRow({ entry, mode, active, onPick }: { entry: ThemeEntry; mode: Mode; active: boolean; onPick: () => void }) {
  const swatch = mode === "dark" ? entry.dark : entry.light;
  const shell = swatch?.canvas ?? (mode === "dark" ? "#1a1a1a" : "#f4f4f4");
  const ink = swatch?.foreground ?? (mode === "dark" ? "#e6e6e6" : "#111111");
  // Type is declared once at :root, so a dark block usually omits it.
  const fontSans = swatch?.fontSans ?? entry.light?.fontSans ?? entry.dark?.fontSans ?? SANS;
  const fontMono = swatch?.fontMono ?? entry.light?.fontMono ?? entry.dark?.fontMono ?? MONO;
  return (
    <button
      type="button"
      onClick={onPick}
      style={{
        appearance: "none", border: 0, cursor: "pointer", textAlign: "left", padding: "4px 6px", borderRadius: 7,
        display: "flex", alignItems: "center", gap: 8, width: "100%", fontFamily: SANS,
        background: active ? v("accent") : "transparent", color: active ? v("accent-foreground") : v("popover-foreground"),
      }}
    >
      <Chips swatch={swatch} w={10} h={16} />
      <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: active ? 600 : 500, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{entry.name}</span>
      <span style={{ display: "inline-flex", alignItems: "baseline", gap: 5, padding: "1px 6px", borderRadius: 4, flex: "none", background: shell, color: ink, boxShadow: `inset 0 0 0 1px ${v("border-hairline", v("border"))}` }}>
        <span style={{ fontFamily: fontSans, fontSize: 12.5, fontWeight: 600 }}>Aa</span>
        <span style={{ fontFamily: fontMono, fontSize: 11 }}>Aa</span>
      </span>
      <span style={{ fontSize: 10.5, color: v("muted-foreground"), width: 28, flex: "none", textTransform: "capitalize" }}>{mode}</span>
    </button>
  );
}

function ThemePicker({ catalog, mode, onPick }: { catalog: Catalog; mode: Mode; onPick: (themeId: string, mode: Mode) => void }) {
  const [open, setOpen] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState<ThemeMenuPlacement>({ side: "down", maxHeight: 520 });
  const hostRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const host = hostRef.current;
    const root = host?.closest<HTMLElement>("[data-tp-root]");
    if (!host || !root) return;

    const updatePlacement = () => {
      const control = host.querySelector<HTMLElement>("[data-tp-theme-control]");
      if (!control) return;
      const controlRect = control.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      setMenuPlacement(placeThemeMenu({
        controlTop: controlRect.top,
        controlBottom: controlRect.bottom,
        boundaryTop: Math.max(0, rootRect.top),
        boundaryBottom: Math.min(window.innerHeight, rootRect.bottom),
      }));
    };

    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    root.addEventListener("scroll", updatePlacement, { passive: true });
    return () => {
      window.removeEventListener("resize", updatePlacement);
      root.removeEventListener("scroll", updatePlacement);
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!hostRef.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      // Arrow keys walk the option buttons; Enter activates the focused one.
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const options = Array.from(hostRef.current?.querySelectorAll<HTMLButtonElement>("[role=listbox] button") ?? []);
        if (options.length === 0) return;
        const index = options.indexOf(document.activeElement as HTMLButtonElement);
        const next = index === -1 ? 0 : (index + (e.key === "ArrowDown" ? 1 : options.length - 1)) % options.length;
        options[next].focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const current = catalog.themes.find((t) => t.id === catalog.activeThemeId) ?? catalog.themes[0];
  const currentSwatch = current ? (mode === "dark" ? current.dark : current.light) : null;

  return (
    <div ref={hostRef} style={{ position: "relative" }}>
      <button
        data-tp-theme-control=""
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          appearance: "none", border: 0, cursor: "pointer", fontFamily: SANS, display: "inline-flex", alignItems: "center", gap: 5,
          height: 24, padding: "0 6px", borderRadius: 7, background: v("card"), color: v("foreground"), fontSize: 11.5, fontWeight: 500, maxWidth: 200,
          boxShadow: `inset 0 0 0 1px ${v("border")}, ${v("shadow-xs", "none")}`,
        }}
      >
        <Chips swatch={currentSwatch} w={6} h={11} />
        <span style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", minWidth: 0 }}>{current?.name ?? "theme"}</span>
        <span style={{ color: v("muted-foreground"), textTransform: "capitalize", fontSize: 10.5, flex: "none" }}>{mode}</span>
        <span style={{ color: v("muted-foreground"), fontSize: 9, flex: "none" }}>▾</span>
      </button>
      {open ? (
        <div
          role="listbox"
          aria-label="Theme and mode"
          style={{
            ...popover,
            position: "absolute",
            top: menuPlacement.side === "down" ? 28 : undefined,
            bottom: menuPlacement.side === "up" ? 28 : undefined,
            right: 0,
            width: 296,
            padding: 4,
            zIndex: 30,
            maxHeight: menuPlacement.maxHeight,
            overflowY: "auto",
          }}
        >
          {catalog.themes.map((entry) => (
            <div key={entry.id} style={{ padding: "1px 0" }}>
              {(["light", "dark"] as const).map((m) => (
                <ThemeRow key={m} entry={entry} mode={m} active={entry.id === catalog.activeThemeId && m === mode} onPick={() => { onPick(entry.id, m); setOpen(false); }} />
              ))}
              <div style={{ height: 1, background: v("border-hairline", v("border")), margin: "3px 6px" }} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// Light/dark is a per-client preference in bb, stored in localStorage under
// `bb.theme` as "light" | "dark" | "system" and mirrored onto the document's
// `.dark` class. Writing the key (not just the class) is what makes the choice
// stick and what keeps Settings → Appearance showing the same thing; the
// storage event tells bb's own control to re-read it.
const MODE_KEY = "bb.theme";

function useColorMode(): [Mode, (next: Mode) => void] {
  const read = () => (document.documentElement.classList.contains("dark") ? "dark" : "light") as Mode;
  const [mode, setMode] = useState<Mode>(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setMode(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  const set = (next: Mode) => {
    const previous = localStorage.getItem(MODE_KEY);
    localStorage.setItem(MODE_KEY, next);
    // Same-document writes do not fire `storage`, so dispatch it ourselves for
    // any listener in this window; other windows get the native event.
    window.dispatchEvent(new StorageEvent("storage", { key: MODE_KEY, oldValue: previous, newValue: next, storageArea: localStorage }));
    document.documentElement.classList.toggle("dark", next === "dark");
    setMode(next);
  };
  return [mode, set];
}

function Toggle({ on, onChange, children }: { on: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{
        appearance: "none", border: 0, cursor: "pointer", fontFamily: SANS, fontSize: 11.5, fontWeight: on ? 600 : 500,
        height: 22, padding: "0 8px", borderRadius: 6,
        background: on ? v("card") : "transparent", color: on ? v("foreground") : v("muted-foreground"),
        boxShadow: on ? `inset 0 0 0 1px ${v("border")}, ${v("shadow-xs", "none")}` : "none",
      }}
    >
      {children}
    </button>
  );
}

function PreviewPage({ subPath }: { subPath: string }) {
  const rpc = useRpc<typeof rpcContract>();
  const [mode, setMode] = useColorMode();
  const navigate = useBbNavigate();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [layout, setLayout] = useState({ compact: false, stageHeight: 620 });
  const [catalog, setCatalog] = useState<Catalog>({ activeThemeId: null, themes: [], revision: 0 });
  const [error, setError] = useState<string | null>(null);
  const catalogRequests = useRef(new LatestRequest());
  const selectionPending = useRef(false);

  const view = useMemo<View>(() => {
    const first = subPath.split("/").filter(Boolean)[0] ?? "";
    return (VIEWS as readonly string[]).includes(first) ? (first as View) : "thread";
  }, [subPath]);

  // Poll while the panel is open: the server compares the active theme file's
  // mtime and re-applies it when an agent has rewritten it, so a theme being
  // edited in the other split repaints here without anyone clicking anything.
  const loadRef = useRef<() => void>(() => {});
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      if (selectionPending.current) return;
      const request = catalogRequests.current.begin();
      rpc.call("themeCatalog", {})
        .then((c) => { if (!cancelled && catalogRequests.current.isLatest(request)) setCatalog(c); })
        .catch((e) => { if (catalogRequests.current.isLatest(request)) setError(String(e)); });
    };
    loadRef.current = load;
    load();
    // Slow fallback only; the server's directory watcher signals changes instantly.
    const timer = setInterval(load, 8000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [rpc]);
  useRealtime("theme-preview:changed", () => loadRef.current());

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      const compact = el.clientWidth < 920;
      const framePaneWidth = compact ? el.clientWidth : el.clientWidth - 276;
      const fittedFrameHeight = Math.round((Math.max(0, framePaneWidth - 32) / FRAME_W) * FRAME_H + 26);
      const stageHeight = Math.min(720, Math.max(compact ? 320 : 500, fittedFrameHeight));
      setLayout((current) => current.compact === compact && current.stageHeight === stageHeight ? current : { compact, stageHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const pick = (themeId: string, nextMode: Mode) => {
    setMode(nextMode);
    // Always send the explicit choice. The catalog reflects the last completed
    // apply, so it can be stale while a slower selection is still in flight.
    selectionPending.current = true;
    const request = catalogRequests.current.begin();
    rpc.call("setTheme", { themeId })
      .then((next) => { if (catalogRequests.current.isLatest(request)) setCatalog(next); })
      .catch((err) => { if (catalogRequests.current.isLatest(request)) setError(String(err)); })
      .finally(() => { if (catalogRequests.current.isLatest(request)) selectionPending.current = false; });
  };

  const revision = `${mode}:${catalog.activeThemeId ?? ""}:${catalog.revision}`;
  const computed = useComputedTokens(ALL_TOKENS, revision);

  return (
    <div ref={rootRef} data-tp-root style={{ height: "100%", overflowY: "auto", overflowX: "hidden", background: v("canvas", v("background")), color: v("foreground"), fontFamily: SANS }}>
      <div style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", flexWrap: "wrap", rowGap: 6, gap: 8, padding: "8px 16px", borderBottom: `1px solid ${v("border-seam", v("border"))}`, background: v("canvas", v("background")) }}>
        <div style={{ display: "inline-flex", gap: 1, padding: 2, borderRadius: 8, background: v("surface-recessed", v("muted")) }}>
          {VIEWS.map((item) => (
            <Toggle key={item} on={item === view} onChange={() => navigate.toPluginPanel("preview", { subPath: item })}>{VIEW_LABEL[item]}</Toggle>
          ))}
        </div>
        {layout.compact ? null : <span style={{ fontSize: 11.5, color: v("muted-foreground") }}>{VIEW_NOTE[view]}</span>}
        <div style={{ flex: 1 }} />
        {error ? <span style={{ fontSize: 12, color: v("destructive-text", v("destructive")) }}>{error}</span> : null}
      </div>

      {/* The mock keeps the main stage. Surface values and the working picker
          occupy the rail; visual specimens stay in the wide sheet below. */}
      <div
        data-tp-layout={layout.compact ? "stacked" : "stage-with-surfaces"}
        style={{
          minHeight: 0, display: "grid",
          gridTemplateColumns: layout.compact ? "minmax(0, 1fr)" : "minmax(0, 1fr) 276px",
          gridTemplateRows: layout.compact ? `${layout.stageHeight}px auto` : undefined,
          height: layout.compact ? undefined : layout.stageHeight,
          borderBottom: `1px solid ${v("border-seam", v("border"))}`,
        }}
      >
        <div data-tp-section="frame" style={{ minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", padding: "12px 16px 14px" }}>
          <Frame view={view} fitBoth />
        </div>
        <div
          data-tp-section="surfaces"
          style={{
            minWidth: 0, padding: "16px 16px 20px",
            borderLeft: layout.compact ? undefined : `1px solid ${v("border-seam", v("border"))}`,
            borderTop: layout.compact ? `1px solid ${v("border-seam", v("border"))}` : undefined,
            background: v("surface-recessed-soft-solid", v("card")),
          }}
        >
          <SurfaceControls computed={computed} catalog={catalog} mode={mode} onPick={pick} />
        </div>
      </div>

      <div data-tp-section="guide" style={{ margin: "18px 16px 24px", padding: "18px 18px 22px", borderRadius: 14, background: v("card"), boxShadow: `inset 0 0 0 1px ${v("border-seam", v("border"))}, ${v("shadow-xs", "none")}` }}>
        <StyleGuide computed={computed} />
      </div>
    </div>
  );
}

export default definePluginApp((app) => {
  app.slots.navPanel({
    id: "preview",
    title: "Theme Preview",
    icon: "Zap",
    path: "preview",
    component: PreviewPage,
  });
});
