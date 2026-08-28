import { definePluginApp } from "@get-bb/plugin-sdk/app";
import {
  AlarmClockIcon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  ClaudeIcon,
  CursorIcon,
  Folder01Icon,
  FolderEditIcon,
  HelpCircleIcon,
  LaptopIcon,
  LinkSquare01Icon,
  Loading03Icon,
  OpenAiIcon,
  PiIcon,
  SecurityCheckIcon,
  SourceCodeIcon,
  SquareUnlock02Icon,
  ViewIcon,
} from "./icons";
import type {
  RpcDiagnostics,
  SectionSummary,
  ThreadPullRequest,
  ThreadSummary,
  ThreadTiming,
} from "./server";
import { HOVER_CARD_CSS, SECTION_CARD_CSS } from "./styles";
import { markdownPreview } from "./markdown-preview";

const CARD_ID = "bb-thread-hover-card";
const STYLE_ID = "bb-thread-hover-card-styles";
const SECTION_CARD_ID = "bb-section-hover-card";
const SECTION_STYLE_ID = "bb-section-hover-card-styles";
const THREAD_TRIGGER_SELECTOR = "a[data-sidebar-thread-id]";
const THREAD_ROW_SELECTOR = ".group\\/thread-row";
const SECTION_TOGGLE_SELECTOR =
  'button[aria-expanded][aria-label$=" section"]';
const STICKY_GROUP_SELECTOR = "[data-sidebar-sticky-group]";
const PROJECT_ITEM_SELECTOR = "[data-sidebar-sticky-project-item]";
const SECTION_ID_SELECTOR = "[data-sidebar-section-id]";
const PROJECT_ID_SELECTOR = "[data-sidebar-project-id]";
const SECTION_SUMMARY_CACHE_TTL_MS = 4_000;
const SECTION_CACHE_MAX_ENTRIES = 32;
/** Comfortably past the server's section-directory TTL, so a wrong "no" heals. */
const SECTION_UNKNOWN_TTL_MS = 60_000;
const OPEN_DELAY_MS = 0;
const CLOSE_DELAY_MS = 120;
const ACTIVE_SUMMARY_CACHE_TTL_MS = 2_000;
const IDLE_SUMMARY_CACHE_TTL_MS = 5_000;
const ACTIVE_TIMING_CACHE_TTL_MS = 1_000;
const IDLE_TIMING_CACHE_TTL_MS = 5_000;
const PULL_REQUEST_CACHE_TTL_MS = 15_000;
const CACHE_MAX_ENTRIES = 128;
const TIMING_RECORD_MAX_ENTRIES = 200;
const TABBABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=\"hidden\"])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable=\"true\"]",
  "[tabindex]",
].join(",");

interface CachedSummary {
  fetchedAt: number;
  pullRequestFetchedAt: number | null;
  summary: ThreadSummary;
  timingFetchedAt: number | null;
  timingStartedAt: number | null;
}

interface PendingSummaryRequest {
  controller: AbortController;
  promise: Promise<ThreadSummary>;
}

interface ClientTimingRecord {
  cache?: "coalesced" | "fresh" | "miss" | "stale";
  durationMs: number;
  operation:
    | "firstContent"
    | "open"
    | "pullRequest"
    | "summary"
    | "timing";
  outcome: "aborted" | "error" | "ok";
  recordedAt: number;
  server?: RpcDiagnostics;
  threadId: string;
}

interface HoverCardController {
  dispose(): void;
  /** Hides the card without tearing the controller down. */
  closeCard?(): void;
}

const diagnosticsGlobal = globalThis as typeof globalThis & {
  __bbThreadHoverCardTimings?: ClientTimingRecord[];
};

function monotonicNow(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function elapsedMs(startedAt: number): number {
  return Math.max(0, Math.round((monotonicNow() - startedAt) * 10) / 10);
}

function recordTiming(record: Omit<ClientTimingRecord, "recordedAt">): void {
  const records =
    diagnosticsGlobal.__bbThreadHoverCardTimings ??
    (diagnosticsGlobal.__bbThreadHoverCardTimings = []);
  records.push({ ...record, recordedAt: Date.now() });
  if (records.length > TIMING_RECORD_MAX_ENTRIES) {
    records.splice(0, records.length - TIMING_RECORD_MAX_ENTRIES);
  }
}

function summaryCacheTtl(summary: ThreadSummary): number {
  return summary.status === "active" ||
    summary.status === "host-reconnecting" ||
    summary.status === "provisioning" ||
    summary.status === "starting" ||
    summary.status === "stopping"
    ? ACTIVE_SUMMARY_CACHE_TTL_MS
    : IDLE_SUMMARY_CACHE_TTL_MS;
}

function timingCacheTtl(summary: ThreadSummary): number {
  return summaryCacheTtl(summary) === ACTIVE_SUMMARY_CACHE_TTL_MS
    ? ACTIVE_TIMING_CACHE_TTL_MS
    : IDLE_TIMING_CACHE_TTL_MS;
}

function repositoryIdentity(summary: ThreadSummary): string {
  const repository = summary.repository;
  return JSON.stringify([
    repository.isGitRepository,
    repository.path,
    repository.name,
    repository.branch,
  ]);
}

function pullRequestRepositoryIdentity(repository: {
  branch: string | null;
  path: string | null;
}): string {
  return JSON.stringify([repository.path, repository.branch]);
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException
      ? error.name === "AbortError"
      : error instanceof Error && error.name === "AbortError"
  );
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
type HugeiconDefinition = readonly (
  readonly [string, { readonly [key: string]: string | number }]
)[];

interface StatusPresentation {
  animated: boolean;
  icon: HugeiconDefinition | null;
  iconName:
    | "CancelCircleIcon"
    | "CheckmarkCircle02Icon"
    | "Loading03Icon"
    | null;
  label: string;
  tone: "danger" | "muted" | "success" | "warning" | "working";
}

const REASONING_LABELS: Record<
  NonNullable<ThreadSummary["provider"]["reasoningLevel"]>,
  string
> = {
  none: "None",
  low: "Low",
  medium: "Medium",
  high: "High",
  xhigh: "Extra High",
  ultracode: "Ultracode",
  max: "Max",
  ultra: "Ultra",
};

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function icon(
  definition: HugeiconDefinition,
  name: string,
  className: string,
): SVGSVGElement {
  const svg = document.createElementNS(SVG_NAMESPACE, "svg");
  svg.classList.add(...className.split(/\s+/).filter(Boolean));
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("data-icon", name);
  svg.setAttribute("aria-hidden", "true");

  for (const [tag, attributes] of definition) {
    const child = document.createElementNS(SVG_NAMESPACE, tag);
    for (const [attribute, value] of Object.entries(attributes)) {
      if (attribute === "key" || value === undefined || value === null) {
        continue;
      }
      const normalizedAttribute = attribute.replace(
        /[A-Z]/g,
        (letter) => `-${letter.toLowerCase()}`,
      );
      child.setAttribute(normalizedAttribute, String(value));
    }
    svg.append(child);
  }

  return svg;
}

function statusPresentation(
  status: ThreadSummary["status"],
): StatusPresentation {
  switch (status) {
    case "active":
    case "host-reconnecting":
    case "provisioning":
    case "starting":
    case "stopping":
      return {
        animated: true,
        icon: Loading03Icon,
        iconName: "Loading03Icon",
        label: "Agent working",
        tone: "working",
      };
    case "error":
      return {
        animated: false,
        icon: CancelCircleIcon,
        iconName: "CancelCircleIcon",
        label: "Thread failed",
        tone: "danger",
      };
    case "waiting-for-host":
      return {
        animated: false,
        icon: null,
        iconName: null,
        label: "Waiting for host",
        tone: "warning",
      };
    case "idle":
      return {
        animated: false,
        icon: CheckmarkCircle02Icon,
        iconName: "CheckmarkCircle02Icon",
        label: "Agent finished",
        tone: "success",
      };
  }
}

function pullRequestTone(
  pullRequest: Extract<ThreadSummary["pullRequest"], { kind: "available" }>,
): "danger" | "merged" | "muted" | "success" {
  switch (pullRequest.state) {
    case "draft":
      return "muted";
    case "closed":
      return "danger";
    case "merged":
      return "merged";
    case "open":
      switch (pullRequest.signal.toLowerCase()) {
        case "blocked":
        case "checks failing":
        case "changes requested":
        case "conflicts":
          return "danger";
        case "checks passing":
        case "ready to merge":
          return "success";
        case "checks pending":
        case "open":
        case "review requested":
        default:
          return "muted";
      }
  }
}

function compactLocalPath(path: string): string {
  const normalized = path.trim().replace(/[\\/]+$/, "");
  if (!normalized) return path.trim() || "Local";

  const separator =
    normalized.includes("\\") && !normalized.includes("/") ? "\\" : "/";
  const abbreviated =
    separator === "\\"
      ? normalized.replace(/^[A-Za-z]:\\Users\\[^\\]+(?=\\|$)/i, "~")
      : normalized.replace(/^\/(?:Users|home)\/[^/]+(?=\/|$)/, "~");
  const segments = abbreviated.split(/[\\/]/).filter(Boolean);

  if (
    segments[0] === "~" &&
    segments[1] === ".bb" &&
    segments.length > 3
  ) {
    return `~${separator}.bb${separator}…${separator}${segments.at(-1)}`;
  }
  if (segments.length <= 4) return abbreviated;
  if (segments[0] === "~") {
    return `~${separator}…${separator}${segments.slice(-2).join(separator)}`;
  }
  return `…${separator}${segments.slice(-3).join(separator)}`;
}

function findThreadTrigger(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null;

  const direct = target.closest<HTMLAnchorElement>(THREAD_TRIGGER_SELECTOR);
  if (direct) return direct;

  const row = target.closest<HTMLElement>(THREAD_ROW_SELECTOR);
  return row?.querySelector<HTMLAnchorElement>(THREAD_TRIGGER_SELECTOR) ?? null;
}

/** A sidebar section header row and the section it stands for. */
export interface SectionTrigger {
  name: string;
  projectId: string | null;
  projectName: string | null;
  row: HTMLElement;
  sectionId: string | null;
  toggle: HTMLElement;
}

export function sectionLabelOf(toggle: Element): string | null {
  return (
    /^(?:Expand|Collapse) (.+) section$/.exec(
      toggle.getAttribute("aria-label") ?? "",
    )?.[1] ?? null
  );
}

/**
 * The header row owns its toggle directly (row > title group > button), which
 * is what separates it from the sticky group wrapping it and from the thread
 * rows nested underneath.
 */
function sectionToggleOwnedBy(row: Element): Element | null {
  const toggle = row.querySelector(SECTION_TOGGLE_SELECTOR);
  return toggle?.parentElement?.parentElement === row ? toggle : null;
}

/** Project rows reuse the section header markup, so they are excluded. */
function isProjectHeaderRow(row: Element): boolean {
  return (
    row.closest(STICKY_GROUP_SELECTOR)?.parentElement?.matches(
      PROJECT_ITEM_SELECTOR,
    ) === true
  );
}

/** In project mode a section is nested under a project and only counts its threads. */
function enclosingProjectName(row: Element): string | null {
  const projectItem = row.closest(PROJECT_ITEM_SELECTOR);
  const projectToggle = projectItem?.querySelector(SECTION_TOGGLE_SELECTOR);
  return projectToggle == null ? null : sectionLabelOf(projectToggle);
}

function projectIdFor(row: Element): string | null {
  const value = row
    .closest<HTMLElement>(PROJECT_ID_SELECTOR)
    ?.dataset.sidebarProjectId?.trim();
  return value || null;
}

export function findSectionTrigger(
  target: EventTarget | null,
): SectionTrigger | null {
  // Pointer events fire document-wide, so bail before the walk on anything
  // outside a sidebar group rather than scanning up to <html> every time.
  const root =
    target instanceof Element ? target.closest(STICKY_GROUP_SELECTOR) : null;
  if (root === null) return null;
  let candidate: Element | null = target as Element;
  while (candidate && candidate !== root.parentElement) {
    const toggle = sectionToggleOwnedBy(candidate);
    if (toggle) {
      const name = sectionLabelOf(toggle);
      if (name === null || isProjectHeaderRow(candidate)) return null;
      return {
        name,
        projectId: projectIdFor(candidate),
        projectName: enclosingProjectName(candidate),
        row: candidate as HTMLElement,
        sectionId:
          root instanceof HTMLElement
            ? root.dataset.sidebarSectionId?.trim() || null
            : null,
        toggle: toggle as HTMLElement,
      };
    }
    candidate = candidate.parentElement;
  }
  return null;
}

function sameSectionIdentity(
  left: SectionTrigger,
  right: SectionTrigger,
): boolean {
  if (left.sectionId !== null || right.sectionId !== null) {
    return (
      left.sectionId !== null &&
      left.sectionId === right.sectionId &&
      left.projectId === right.projectId
    );
  }
  return left.name === right.name && left.projectName === right.projectName;
}

function findCurrentSectionTrigger(
  target: SectionTrigger,
): SectionTrigger | null {
  const matches: SectionTrigger[] = [];
  for (const toggle of Array.from(
    document.querySelectorAll<HTMLElement>(SECTION_TOGGLE_SELECTOR),
  )) {
    const current = findSectionTrigger(toggle);
    if (current && sameSectionIdentity(target, current)) matches.push(current);
  }
  // Name-only legacy DOM cannot safely distinguish duplicate built-in/custom
  // rows. Failing closed is better than attaching another section's summary.
  return matches.length === 1 ? matches[0]! : null;
}

function threadIdFor(trigger: HTMLAnchorElement): string | null {
  const value = trigger.dataset.sidebarThreadId?.trim();
  return value ? value : null;
}

function runTime(timestamp: number, endedAt = Date.now()): string {
  const elapsedSeconds = Math.max(0, Math.floor((endedAt - timestamp) / 1000));
  const seconds = elapsedSeconds % 60;
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 1) return `${seconds}s`;

  const minutes = elapsedMinutes % 60;
  const hours = Math.floor(elapsedMinutes / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function refreshRunTime(card: HTMLElement): void {
  const runtime = card.querySelector<HTMLElement>("[data-turn-started-at]");
  if (runtime) {
    const timestamp = Number(runtime.dataset.turnStartedAt);
    const endedAt = runtime.dataset.turnEndedAt
      ? Number(runtime.dataset.turnEndedAt)
      : Date.now();
    const value = runTime(timestamp, endedAt);
    runtime.querySelector<HTMLElement>("[data-time-value]")!.textContent = value;
    runtime.title = `${runtime.dataset.timeLabel ?? "Run time"} ${value}`;
  }
}

function formatModelLabel(value: string, providerId: string): string {
  if (providerId === "claude-code") {
    const contextMatch = value.match(/^(.*)\[(\d+(?:\.\d+)?[km])\]$/i);
    const modelId = contextMatch?.[1] ?? value;
    const context = contextMatch?.[2]?.toUpperCase();
    const formatted = modelId
      .replace(/^claude[-_\s]+/i, "")
      .split(/[-_]/)
      .map((part) => {
        if (/^\d+(\.\d+)*$/.test(part)) return part;
        if (/^[a-z]+$/i.test(part)) {
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        }
        return part;
      })
      .join("-")
      .replace(/-(\d+)-(\d+)(?=-|$)/, "-$1.$2")
      .split("-")
      .join(" ");
    return context ? `${formatted} (${context})` : formatted;
  }

  const formatted = value
    .split("-")
    .map((part) => {
      if (part.toLowerCase() === "gpt") return "GPT";
      if (/^\d+(\.\d+)*$/.test(part)) return part;
      if (/^[a-z]+$/i.test(part)) {
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }
      return part;
    })
    .join("-");

  if (providerId === "codex") return formatted.replace(/^GPT-/i, "");
  return formatted;
}

function permissionLabel(
  permissionMode: ThreadSummary["permissionMode"],
): string | null {
  if (permissionMode === "accept-edits") return "Accept edits";
  if (permissionMode === "auto") return "Auto";
  if (permissionMode === "full") return "Full access";
  if (permissionMode === "workspace-write") return "Workspace write";
  if (permissionMode === "readonly") return "Read only";
  return null;
}

function permissionMetadata(summary: ThreadSummary): HTMLSpanElement | null {
  const label = permissionLabel(summary.permissionMode);
  if (!label) return null;

  const permissionIcon =
    summary.permissionMode === "full"
      ? {
          definition: SquareUnlock02Icon,
          name: "SquareUnlock02Icon",
        }
      : summary.permissionMode === "accept-edits" ||
          summary.permissionMode === "workspace-write"
        ? { definition: FolderEditIcon, name: "FolderEditIcon" }
        : summary.permissionMode === "auto"
          ? { definition: SecurityCheckIcon, name: "SecurityCheckIcon" }
          : summary.permissionMode === "readonly"
            ? { definition: ViewIcon, name: "ViewIcon" }
            : null;
  const access = element("span", "bb-thread-hover-card__access");
  access.dataset.permissionMode = summary.permissionMode!;
  access.setAttribute("aria-label", `Permission: ${label}`);
  access.title = `Permission: ${label}`;
  if (permissionIcon) {
    access.append(
      icon(
        permissionIcon.definition,
        permissionIcon.name,
        "bb-thread-hover-card__icon bb-thread-hover-card__permission-icon",
      ),
    );
  }
  access.append(document.createTextNode(label));
  return access;
}

interface InlinePattern {
  match: RegExpMatchArray;
  type: "code" | "emphasis" | "image" | "link" | "strike" | "strong";
}

function nextInlinePattern(source: string): InlinePattern | null {
  const patterns: Array<[InlinePattern["type"], RegExp]> = [
    ["image", /!\[([^\]]*)\]\([^)]+\)/],
    ["link", /\[([^\]]+)\]\([^)]+\)/],
    ["code", /`([^`\n]+)`/],
    ["strong", /(?<!\\)\*\*(\S(?:[^\n]*?\S)?)(?<!\\)\*\*/],
    ["strong", /(?<![\\\w])__(\S(?:[^\n]*?\S)?)(?<!\\)__(?!\w)/],
    ["strike", /~~(.+?)~~/],
    ["emphasis", /(?<!\\)\*(?!\*)(\S(?:[^*\n]*?\S)?)(?<!\\)\*(?!\*)/],
    ["emphasis", /(?<![\\\w])_(?!_)(\S(?:[^_\n]*?\S)?)(?<!\\)_(?![\w_])/],
  ];
  let next: InlinePattern | null = null;
  for (const [type, pattern] of patterns) {
    const match = source.match(pattern);
    if (!match || match.index === undefined) continue;
    if (!next || match.index < (next.match.index ?? Number.POSITIVE_INFINITY)) {
      next = { match, type };
    }
  }
  return next;
}

function appendInlineMarkdown(
  parent: HTMLElement,
  source: string,
  allowEmphasis: boolean,
): void {
  let remaining = source;
  while (remaining) {
    const next = nextInlinePattern(remaining);
    if (!next || next.match.index === undefined) {
      parent.append(
        document.createTextNode(
          remaining.replace(/\\([\\`*_[\]{}()#+\-.!|>])/g, "$1"),
        ),
      );
      return;
    }

    if (next.match.index > 0) {
      parent.append(
        document.createTextNode(
          remaining
            .slice(0, next.match.index)
            .replace(/\\([\\`*_[\]{}()#+\-.!|>])/g, "$1"),
        ),
      );
    }

    const value = next.match[1] ?? "";
    if (next.type === "code") {
      parent.append(element("code", "bb-thread-hover-card__inline-code", value));
    } else if (next.type === "image") {
      parent.append(document.createTextNode(value || "Image"));
    } else if (next.type === "link") {
      const label = element("span", "bb-thread-hover-card__inline-link");
      appendInlineMarkdown(label, value, allowEmphasis);
      parent.append(label);
    } else if (next.type === "strike") {
      const strike = element("s", "bb-thread-hover-card__inline-strike");
      appendInlineMarkdown(strike, value, allowEmphasis);
      parent.append(strike);
    } else if (allowEmphasis) {
      const emphasis = element(
        next.type === "strong" ? "strong" : "em",
        next.type === "strong"
          ? "bb-thread-hover-card__inline-strong"
          : "bb-thread-hover-card__inline-emphasis",
      );
      appendInlineMarkdown(emphasis, value, allowEmphasis);
      parent.append(emphasis);
    } else {
      appendInlineMarkdown(parent, value, allowEmphasis);
    }

    remaining = remaining.slice(next.match.index + next.match[0].length);
  }
}

function messagePreview(
  source: string,
  allowEmphasis: boolean,
): HTMLParagraphElement {
  const message = element("p", "bb-thread-hover-card__message");
  const preview = markdownPreview(source);
  if (preview) {
    message.dataset.markdownBlock = preview.kind;
    appendInlineMarkdown(message, preview.inline, allowEmphasis);
  }
  return message;
}

function providerIcon(
  provider: ThreadSummary["provider"],
): HTMLImageElement | SVGSVGElement {
  if (provider.logoUrl) {
    const image = element(
      "img",
      "bb-thread-hover-card__icon bb-thread-hover-card__provider-icon",
    );
    image.src = provider.logoUrl;
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    image.addEventListener(
      "error",
      () => {
        image.replaceWith(
          icon(
            SourceCodeIcon,
            "SourceCodeIcon",
            "bb-thread-hover-card__icon bb-thread-hover-card__provider-icon",
          ),
        );
      },
      { once: true },
    );
    return image;
  }

  const providerDefinition =
    provider.id === "codex"
      ? { definition: OpenAiIcon, name: "OpenAiIcon", viewBox: "0 0 24 24" }
      : provider.id === "claude-code"
        ? { definition: ClaudeIcon, name: "ClaudeIcon", viewBox: "0 0 149 149" }
        : provider.id === "pi"
          ? { definition: PiIcon, name: "PiIcon", viewBox: "100 100 600 600" }
          : provider.id === "acp-cursor"
            ? {
                definition: CursorIcon,
                name: "CursorIcon",
                viewBox: "0 0 24 24",
              }
            : {
                definition: SourceCodeIcon,
                name: "SourceCodeIcon",
                viewBox: "0 0 24 24",
              };
  const providerMark = icon(
    providerDefinition.definition,
    providerDefinition.name,
    "bb-thread-hover-card__icon bb-thread-hover-card__provider-icon",
  );
  providerMark.setAttribute("viewBox", providerDefinition.viewBox);
  return providerMark;
}

async function fetchSummary(
  threadId: string,
  signal: AbortSignal,
  clientId: string,
  generation: number,
): Promise<ThreadSummary> {
  const response = await fetch(
    "/api/v1/plugins/thread-hover-cards/rpc/threadSummary",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId, generation, threadId }),
      signal,
    },
  );
  const envelope = (await response.json()) as
    | { ok: true; result: ThreadSummary }
    | { ok: false; error?: { message?: string } };

  if (!response.ok || !envelope.ok) {
    throw new Error(
      envelope.ok ? "Thread summary request failed." : envelope.error?.message,
    );
  }
  return envelope.result;
}

async function fetchTiming(threadId: string): Promise<ThreadTiming> {
  const response = await fetch(
    "/api/v1/plugins/thread-hover-cards/rpc/threadTiming",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ threadId }),
    },
  );
  const envelope = (await response.json()) as
    | { ok: true; result: ThreadTiming }
    | { ok: false; error?: { message?: string } };

  if (!response.ok || !envelope.ok) {
    throw new Error(
      envelope.ok ? "Thread timing request failed." : envelope.error?.message,
    );
  }
  return envelope.result;
}

async function fetchPullRequest(threadId: string): Promise<ThreadPullRequest> {
  const response = await fetch(
    "/api/v1/plugins/thread-hover-cards/rpc/threadPullRequest",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ threadId }),
    },
  );
  const envelope = (await response.json()) as
    | { ok: true; result: ThreadPullRequest }
    | { ok: false; error?: { message?: string } };

  if (!response.ok || !envelope.ok) {
    throw new Error(
      envelope.ok
        ? "Thread pull request failed."
        : envelope.error?.message,
    );
  }
  return envelope.result;
}

/** Flush to the anchor's right, flipping to its left when the viewport is tight. */
function placeCardNear(card: HTMLElement, anchor: HTMLElement): void {
  const anchorRect = anchor.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const margin = 8;
  const gap = 8;

  let left = anchorRect.right + gap;
  if (left + cardRect.width > window.innerWidth - margin) {
    left = Math.max(margin, anchorRect.left - gap - cardRect.width);
  }

  const top = Math.min(
    Math.max(margin, anchorRect.top - 4),
    Math.max(margin, window.innerHeight - cardRect.height - margin),
  );
  card.style.left = `${Math.round(left)}px`;
  card.style.top = `${Math.round(top)}px`;
}

function renderLoading(card: HTMLElement, subject = "thread"): void {
  card.replaceChildren(
    element("p", "bb-thread-hover-card__loading", `Loading ${subject} summary…`),
  );
}

function renderError(card: HTMLElement): void {
  card.replaceChildren(
    element("p", "bb-thread-hover-card__loading", "Summary unavailable"),
  );
}

type HoverCardRenderState = "complete" | "error" | "loading" | "summary";

function setHoverCardRenderState(
  card: HTMLElement,
  state: HoverCardRenderState,
): void {
  card.dataset.bbHoverCardRenderState = state;
  if (state === "loading" || state === "summary") {
    card.setAttribute("aria-busy", "true");
  } else {
    card.removeAttribute("aria-busy");
  }
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function waitForCardAssets(card: HTMLElement): Promise<void> {
  const fonts = document.fonts?.ready;
  const images = Array.from(card.querySelectorAll("img"));
  await Promise.all([
    fonts ?? Promise.resolve(),
    ...images.map((image) => {
      if (image.complete) return image.decode?.().catch(() => undefined);
      return new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      });
    }),
  ]);
}

async function markHoverCardComplete(
  card: HTMLElement,
  isCurrent: () => boolean,
): Promise<void> {
  await waitForCardAssets(card);
  await nextPaint();
  await nextPaint();
  if (isCurrent()) setHoverCardRenderState(card, "complete");
}

function renderSummary(card: HTMLElement, summary: ThreadSummary): void {
  const header = element("div", "bb-thread-hover-card__header");
  const provider = element("div", "bb-thread-hover-card__provider");
  const modelLabel = formatModelLabel(
    summary.provider.model,
    summary.provider.id,
  );
  const reasoningLabel = summary.provider.reasoningLevel
    ? REASONING_LABELS[summary.provider.reasoningLevel]
    : null;
  provider.title = reasoningLabel
    ? `${summary.provider.displayName}: ${modelLabel} · ${reasoningLabel} reasoning`
    : `${summary.provider.displayName}: ${modelLabel}`;
  const providerIdentity = element(
    "div",
    "bb-thread-hover-card__provider-identity",
  );
  providerIdentity.append(
    element(
      "span",
      "bb-thread-hover-card__provider-model bb-thread-hover-card__truncate",
      modelLabel,
    ),
  );
  if (reasoningLabel) {
    const reasoning = element(
      "span",
      "bb-thread-hover-card__reasoning",
      reasoningLabel,
    );
    reasoning.title = `${reasoningLabel} reasoning`;
    providerIdentity.append(reasoning);
  }
  const access = permissionMetadata(summary);
  if (access) {
    access.dataset.location = "header";
    providerIdentity.append(access);
  }
  provider.append(
    providerIcon(summary.provider),
    element(
      "span",
      "bb-thread-hover-card__sr-only",
      `${summary.provider.displayName}, `,
    ),
    providerIdentity,
  );
  header.append(provider);

  const runtimeStatus = statusPresentation(summary.status);
  const times = element("div", "bb-thread-hover-card__times");
  const isDone = summary.status === "idle";
  if (summary.currentTurnStartedAt !== null) {
    const runtime = element("span", "bb-thread-hover-card__runtime");
    runtime.dataset.turnStartedAt = String(summary.currentTurnStartedAt);
    runtime.dataset.timeLabel = isDone ? "Total agent time" : "Run time";
    if (summary.currentTurnCompletedAt !== null) {
      runtime.dataset.turnEndedAt = String(summary.currentTurnCompletedAt);
    }
    const runtimeValue = element("span", "bb-thread-hover-card__time-value");
    runtimeValue.dataset.timeValue = "";
    const usesThreadStatusIcon =
      (runtimeStatus.animated || isDone) &&
      runtimeStatus.icon !== null &&
      runtimeStatus.iconName !== null;
    const runtimeIcon = icon(
      usesThreadStatusIcon ? runtimeStatus.icon! : AlarmClockIcon,
      usesThreadStatusIcon ? runtimeStatus.iconName! : "AlarmClockIcon",
      "bb-thread-hover-card__icon bb-thread-hover-card__time-icon",
    );
    if (usesThreadStatusIcon) {
      runtimeIcon.dataset.tone = runtimeStatus.tone;
      if (runtimeStatus.animated) runtimeIcon.dataset.animated = "true";
      runtimeIcon.removeAttribute("aria-hidden");
      runtimeIcon.setAttribute("aria-label", runtimeStatus.label);
      runtimeIcon.setAttribute("role", "img");
    }
    runtime.append(
      runtimeIcon,
      element(
        "span",
        "bb-thread-hover-card__sr-only",
        `${runtime.dataset.timeLabel} `,
      ),
      runtimeValue,
    );
    times.append(runtime);
  } else if (runtimeStatus.icon && runtimeStatus.iconName) {
    const statusIcon = icon(
      runtimeStatus.icon,
      runtimeStatus.iconName,
      "bb-thread-hover-card__icon bb-thread-hover-card__time-icon bb-thread-hover-card__header-status",
    );
    statusIcon.dataset.tone = runtimeStatus.tone;
    if (runtimeStatus.animated) statusIcon.dataset.animated = "true";
    statusIcon.removeAttribute("aria-hidden");
    statusIcon.setAttribute("aria-label", runtimeStatus.label);
    statusIcon.setAttribute("role", "img");
    times.append(statusIcon);
  }
  if (times.childElementCount > 0) header.append(times);

  const content: HTMLElement[] = [header];
  const summaryMessage = summary.latestAssistantMessage;

  if (summaryMessage) {
    const request = element("section", "bb-thread-hover-card__summary");
    if (runtimeStatus.animated) request.dataset.working = "true";
    request.append(messagePreview(summaryMessage, true));
    content.push(request);
  }

  const hasMeaningfulProject =
    summary.repository.name !== "Repository unavailable";
  if (summary.repository.isGitRepository || hasMeaningfulProject) {
    const context = element("section", "bb-thread-hover-card__context");
    context.dataset.hasHost = String(
      summary.repository.isGitRepository && Boolean(summary.hostName),
    );
    const project = element("span", "bb-thread-hover-card__project");
    const projectName = element(
      "span",
      "bb-thread-hover-card__project-name",
      summary.repository.name,
    );
    projectName.title = summary.repository.name;
    project.append(
      icon(
        Folder01Icon,
        "Folder01Icon",
        "bb-thread-hover-card__icon bb-thread-hover-card__meta-icon",
      ),
      projectName,
    );
    context.append(project);

    if (summary.repository.isGitRepository && summary.hostName) {
      const host = element("span", "bb-thread-hover-card__host");
      const hostName = element(
        "span",
        "bb-thread-hover-card__host-name",
        summary.hostName,
      );
      hostName.title = summary.hostName;
      host.append(
        icon(
          LaptopIcon,
          "LaptopIcon",
          "bb-thread-hover-card__icon bb-thread-hover-card__meta-icon",
        ),
        hostName,
      );
      context.append(host);
    }

    if (
      summary.repository.isGitRepository &&
      summary.pullRequest.kind === "available"
    ) {
      const pullRequest = element("span", "bb-thread-hover-card__pr");
      pullRequest.dataset.kind = summary.pullRequest.kind;
      const pullRequestLink = element("a", "bb-thread-hover-card__pr-link");
      pullRequestLink.href = summary.pullRequest.url;
      pullRequestLink.target = "_blank";
      pullRequestLink.rel = "noopener noreferrer";
      pullRequestLink.setAttribute(
        "aria-label",
        `Pull request #${summary.pullRequest.number}: ${summary.pullRequest.title}. ${summary.pullRequest.signal}. Opens in a new tab.`,
      );
      pullRequestLink.title = summary.pullRequest.title;
      pullRequestLink.append(
        icon(
          LinkSquare01Icon,
          "LinkSquare01Icon",
          "bb-thread-hover-card__icon bb-thread-hover-card__link-icon",
        ),
        element(
          "span",
          "bb-thread-hover-card__pr-number",
          `#${summary.pullRequest.number}`,
        ),
      );
      const pullRequestStatus = element(
        "span",
        "bb-thread-hover-card__pr-status",
        summary.pullRequest.signal,
      );
      pullRequestStatus.dataset.tone = pullRequestTone(summary.pullRequest);
      pullRequestStatus.dataset.state = summary.pullRequest.state;
      pullRequestLink.append(pullRequestStatus);
      pullRequest.append(pullRequestLink);
      context.append(pullRequest);
    }
    content.push(context);
  }

  if (!summary.repository.isGitRepository) {
    const localContext =
      summary.repository.path?.trim() ||
      (summary.repository.name === "Repository unavailable"
        ? "Local"
        : summary.repository.name);
    const local = element(
      "section",
      "bb-thread-hover-card__local",
    );
    const localPath = element(
      "span",
      "bb-thread-hover-card__local-path",
      compactLocalPath(localContext),
    );
    localPath.title = localContext;
    local.setAttribute("aria-label", `Local workspace: ${localContext}`);
    local.append(
      icon(
        LaptopIcon,
        "LaptopIcon",
        "bb-thread-hover-card__icon bb-thread-hover-card__meta-icon",
      ),
      localPath,
    );
    content.push(local);
  }

  card.replaceChildren(...content);
  refreshRunTime(card);
}

const SECTION_PROJECT_NAMES = 2;

function countLabel(value: number, singular: string, plural = `${singular}s`): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function attentionChip(
  className: string,
  glyph: HugeiconDefinition,
  glyphName: string,
  text: string,
): HTMLElement {
  const chip = element("span", `bb-section-hover-card__chip ${className}`);
  const mark = icon(
    glyph,
    glyphName,
    "bb-thread-hover-card__icon bb-section-hover-card__chip-icon",
  );
  chip.append(mark, element("span", "", text));
  return chip;
}

/** `label` is already plural-safe for the invariant words (working, unread). */
function countCell(value: number, label: string): HTMLElement {
  const cell = element("span", "bb-section-hover-card__count");
  // Zero dims rather than disappears: removing a cell shifts the others and
  // destroys the fixed positions that let the row be read without scanning.
  if (value === 0) cell.dataset.zero = "true";
  const word =
    label === "thread" ? (value === 1 ? "thread" : "threads") : label;
  cell.append(
    element("b", "bb-section-hover-card__count-value", String(value)),
    element("span", "", ` ${word}`),
  );
  return cell;
}

/**
 * Three bands: the projects this section spans, a headline that exists only
 * when something wants action, and counts in fixed positions. Every figure is
 * one that reading the whole section would be needed to learn — the titles and
 * the per-thread spinners the sidebar already gives are deliberately absent.
 */
export function renderSectionSummary(
  card: HTMLElement,
  summary: SectionSummary,
): void {
  if (summary.total === 0) {
    card.replaceChildren(
      element("p", "bb-section-hover-card__empty", "No threads yet"),
    );
    return;
  }

  const content: HTMLElement[] = [];

  if (summary.projects.length > 0) {
    const band = element("div", "bb-section-hover-card__band");
    band.append(
      icon(
        Folder01Icon,
        "Folder01Icon",
        "bb-thread-hover-card__icon bb-thread-hover-card__meta-icon",
      ),
    );
    const named = summary.projects.slice(0, SECTION_PROJECT_NAMES);
    named.forEach((project, index) => {
      if (index > 0) {
        band.append(element("span", "bb-section-hover-card__sep", "·"));
      }
      band.append(element("span", "bb-section-hover-card__project", project));
    });
    const remaining = summary.projects.length - named.length;
    if (remaining > 0) {
      band.append(
        element("span", "bb-section-hover-card__more", `+${remaining}`),
      );
    }
    content.push(band);
  }

  // Absent, not empty. A card with nothing in this position is itself the
  // signal that nothing is waiting on the reader.
  if (summary.questions > 0 || summary.failed > 0) {
    const headline = element("div", "bb-section-hover-card__headline");
    if (summary.questions > 0) {
      headline.append(
        attentionChip(
          "bb-section-hover-card__chip--question",
          HelpCircleIcon,
          "HelpCircleIcon",
          countLabel(summary.questions, "question"),
        ),
      );
    }
    if (summary.failed > 0) {
      headline.append(
        attentionChip(
          "bb-section-hover-card__chip--failed",
          CancelCircleIcon,
          "CancelCircleIcon",
          `${summary.failed} failed`,
        ),
      );
    }
    content.push(headline);
  }

  const counts = element("div", "bb-section-hover-card__counts");
  counts.append(
    countCell(summary.total, "thread"),
    countCell(summary.working, "working"),
    countCell(summary.unread, "unread"),
  );
  content.push(counts);

  card.replaceChildren(...content);
}

interface ThreadHoverCardOptions {
  /** Closes the section card so the two never overlap on a fast diagonal move. */
  onOpen: () => void;
}

function installHoverCards({ onOpen }: ThreadHoverCardOptions): HoverCardController {
  let card: HTMLDivElement | null = null;
  let activeTrigger: HTMLAnchorElement | null = null;
  let activeThreadId: string | null = null;
  let openTimer: ReturnType<typeof setTimeout> | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;
  let timeTimer: ReturnType<typeof setInterval> | null = null;
  let disposed = false;
  let requestGeneration = 0;
  const summaryClientId = `hover-card-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;
  let forwardTabTarget: HTMLElement | null = null;
  const cache = new Map<string, CachedSummary>();
  const pending = new Map<string, PendingSummaryRequest>();
  const pullRequestPending = new Map<string, Promise<ThreadPullRequest>>();
  const timingPending = new Map<string, Promise<ThreadTiming>>();
  const timingRetriedForSummary = new Map<string, number>();
  const timingRetryScheduled = new Set<string>();
  const style = element("style", "");
  style.id = STYLE_ID;
  style.textContent = HOVER_CARD_CSS;
  document.getElementById(STYLE_ID)?.remove();
  document.head.append(style);

  function ensureCard(): HTMLDivElement {
    if (card) return card;

    card = element("div", "bb-thread-hover-card");
    card.id = CARD_ID;
    card.hidden = true;
    card.setAttribute("data-bb-plugin", "thread-hover-cards");
    card.setAttribute("data-bb-plugin-root", "");
    card.setAttribute("data-bb-portaled-overlay", "");
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", "Thread summary");
    card.addEventListener("pointerenter", cancelClose);
    card.addEventListener("pointerleave", scheduleClose);
    document.body.append(card);
    return card;
  }

  function positionCard(): void {
    const trigger = resolveActiveTrigger();
    if (!card || !trigger || card.hidden) return;
    placeCardNear(card, trigger.closest<HTMLElement>(THREAD_ROW_SELECTOR) ?? trigger);
  }

  function cachedSummary(threadId: string): CachedSummary | undefined {
    const cached = cache.get(threadId);
    if (!cached) return undefined;
    cache.delete(threadId);
    cache.set(threadId, cached);
    return cached;
  }

  function cacheSummary(threadId: string, summary: ThreadSummary): void {
    const previous = cache.get(threadId);
    const repositoryIsUnchanged =
      previous !== undefined &&
      repositoryIdentity(previous.summary) === repositoryIdentity(summary);
    const shouldKeepPullRequest =
      summary.pullRequest.kind === "pending" &&
      previous !== undefined &&
      repositoryIsUnchanged &&
      previous.summary.pullRequest.kind !== "pending";
    const hasHydratedTiming =
      previous?.timingFetchedAt !== null &&
      previous?.timingFetchedAt !== undefined;
    const timingIsNewerThanSummary =
      hasHydratedTiming &&
      previous.timingStartedAt !== null &&
      previous.timingStartedAt >= summary.diagnostics.startedAt;
    const shouldKeepTimingValues =
      hasHydratedTiming &&
      (previous.summary.status === summary.status ||
        timingIsNewerThanSummary);
    const cachedPullRequest = shouldKeepPullRequest
      ? previous.summary.pullRequest
      : summary.pullRequest;
    const cachedSummaryValue: ThreadSummary = {
      ...summary,
      currentTurnCompletedAt: shouldKeepTimingValues
        ? previous.summary.currentTurnCompletedAt
        : summary.currentTurnCompletedAt,
      currentTurnStartedAt: shouldKeepTimingValues
        ? previous.summary.currentTurnStartedAt
        : summary.currentTurnStartedAt,
      pullRequest: cachedPullRequest,
      status: timingIsNewerThanSummary
        ? previous.summary.status
        : summary.status,
    };
    cache.delete(threadId);
    cache.set(threadId, {
      fetchedAt: Date.now(),
      pullRequestFetchedAt: shouldKeepPullRequest
        ? previous.pullRequestFetchedAt
        : cachedPullRequest.kind === "pending"
          ? null
          : Date.now(),
      summary: cachedSummaryValue,
      timingFetchedAt: timingIsNewerThanSummary
        ? previous.timingFetchedAt
        : null,
      timingStartedAt: shouldKeepTimingValues
        ? previous.timingStartedAt
        : null,
    });
    while (cache.size > CACHE_MAX_ENTRIES) {
      const oldestThreadId = cache.keys().next().value;
      if (oldestThreadId === undefined) break;
      cache.delete(oldestThreadId);
    }
  }

  function abortSupersededSummaryRequests(threadId: string): void {
    for (const [pendingThreadId, request] of pending) {
      if (pendingThreadId === threadId) continue;
      pending.delete(pendingThreadId);
      request.controller.abort();
    }
  }

  function requestSummary(
    threadId: string,
    cacheSource: "miss" | "stale",
    generation: number,
  ): Promise<ThreadSummary> {
    const existing = pending.get(threadId);
    if (existing) {
      const startedAt = monotonicNow();
      return existing.promise.then(
        (summary) => {
          recordTiming({
            cache: "coalesced",
            durationMs: elapsedMs(startedAt),
            operation: "summary",
            outcome: "ok",
            server: summary.diagnostics,
            threadId,
          });
          return summary;
        },
        (error) => {
          recordTiming({
            cache: "coalesced",
            durationMs: elapsedMs(startedAt),
            operation: "summary",
            outcome: isAbortError(error) ? "aborted" : "error",
            threadId,
          });
          throw error;
        },
      );
    }

    const startedAt = monotonicNow();
    const controller = new AbortController();
    let request: Promise<ThreadSummary>;
    request = fetchSummary(
      threadId,
      controller.signal,
      summaryClientId,
      generation,
    )
      .then((summary) => {
        cacheSummary(threadId, summary);
        recordTiming({
          cache: cacheSource,
          durationMs: elapsedMs(startedAt),
          operation: "summary",
          outcome: "ok",
          server: summary.diagnostics,
          threadId,
        });
        return summary;
      })
      .catch((error) => {
        recordTiming({
          cache: cacheSource,
          durationMs: elapsedMs(startedAt),
          operation: "summary",
          outcome: isAbortError(error) ? "aborted" : "error",
          threadId,
        });
        throw error;
      })
      .finally(() => {
        if (pending.get(threadId)?.promise === request) {
          pending.delete(threadId);
        }
      });
    pending.set(threadId, { controller, promise: request });
    return request;
  }

  function requestTiming(threadId: string): Promise<ThreadTiming> {
    const existing = timingPending.get(threadId);
    if (existing) {
      const startedAt = monotonicNow();
      return existing.then(
        (timing) => {
          recordTiming({
            cache: "coalesced",
            durationMs: elapsedMs(startedAt),
            operation: "timing",
            outcome: "ok",
            server: timing.diagnostics,
            threadId,
          });
          return timing;
        },
        (error) => {
          recordTiming({
            cache: "coalesced",
            durationMs: elapsedMs(startedAt),
            operation: "timing",
            outcome: "error",
            threadId,
          });
          throw error;
        },
      );
    }

    const startedAt = monotonicNow();
    const request = fetchTiming(threadId)
      .then((timing) => {
        recordTiming({
          cache: "miss",
          durationMs: elapsedMs(startedAt),
          operation: "timing",
          outcome: "ok",
          server: timing.diagnostics,
          threadId,
        });
        return timing;
      })
      .catch((error) => {
        recordTiming({
          cache: "miss",
          durationMs: elapsedMs(startedAt),
          operation: "timing",
          outcome: "error",
          threadId,
        });
        throw error;
      })
      .finally(() => timingPending.delete(threadId));
    timingPending.set(threadId, request);
    return request;
  }

  function requestPullRequest(
    threadId: string,
    repositoryKey: string,
  ): Promise<ThreadPullRequest> {
    const requestKey = JSON.stringify([threadId, repositoryKey]);
    const existing = pullRequestPending.get(requestKey);
    if (existing) {
      const startedAt = monotonicNow();
      return existing.then(
        (pullRequest) => {
          recordTiming({
            cache: "coalesced",
            durationMs: elapsedMs(startedAt),
            operation: "pullRequest",
            outcome: "ok",
            server: pullRequest.diagnostics,
            threadId,
          });
          return pullRequest;
        },
        (error) => {
          recordTiming({
            cache: "coalesced",
            durationMs: elapsedMs(startedAt),
            operation: "pullRequest",
            outcome: "error",
            threadId,
          });
          throw error;
        },
      );
    }

    const startedAt = monotonicNow();
    const request = fetchPullRequest(threadId)
      .then((pullRequest) => {
        recordTiming({
          cache: "miss",
          durationMs: elapsedMs(startedAt),
          operation: "pullRequest",
          outcome: "ok",
          server: pullRequest.diagnostics,
          threadId,
        });
        return pullRequest;
      })
      .catch((error) => {
        recordTiming({
          cache: "miss",
          durationMs: elapsedMs(startedAt),
          operation: "pullRequest",
          outcome: "error",
          threadId,
        });
        throw error;
      })
      .finally(() => {
        if (pullRequestPending.get(requestKey) === request) {
          pullRequestPending.delete(requestKey);
        }
      });
    pullRequestPending.set(requestKey, request);
    return request;
  }

  function refreshTiming(
    threadId: string,
    generation: number,
    hoverCard: HTMLDivElement,
  ): Promise<void> {
    const cached = cache.get(threadId);
    if (
      cached?.timingFetchedAt !== null &&
      cached?.timingFetchedAt !== undefined &&
      Date.now() - cached.timingFetchedAt < timingCacheTtl(cached.summary)
    ) {
      recordTiming({
        cache: "fresh",
        durationMs: 0,
        operation: "timing",
        outcome: "ok",
        threadId,
      });
      return Promise.resolve();
    }

    return requestTiming(threadId)
      .then((timing) => {
        const current = cache.get(threadId);
        if (!current) return;
        const summaryStartedAt = current.summary.diagnostics.startedAt;
        if (timing.diagnostics.startedAt < summaryStartedAt) {
          if (
            !disposed &&
            generation === requestGeneration &&
            activeThreadId === threadId &&
            resolveActiveTrigger() &&
            timingRetriedForSummary.get(threadId) !== summaryStartedAt &&
            !timingRetryScheduled.has(threadId)
          ) {
            timingRetriedForSummary.set(threadId, summaryStartedAt);
            timingRetryScheduled.add(threadId);
            return new Promise<void>((resolve) => {
              queueMicrotask(() => {
                timingRetryScheduled.delete(threadId);
                void refreshTiming(threadId, generation, hoverCard).then(resolve);
              });
            });
          }
          return;
        }
        timingRetriedForSummary.delete(threadId);
        const summary = {
          ...current.summary,
          ...timing,
        };
        cache.delete(threadId);
        cache.set(threadId, {
          ...current,
          summary,
          timingFetchedAt: Date.now(),
          timingStartedAt: timing.diagnostics.startedAt,
        });
        if (
          disposed ||
          generation !== requestGeneration ||
          activeThreadId !== threadId ||
          !resolveActiveTrigger()
        ) {
          return;
        }

        const focusWasInsideCard =
          document.activeElement instanceof Node &&
          hoverCard.contains(document.activeElement);
        renderSummary(hoverCard, summary);
        if (focusWasInsideCard) {
          const replacementPullRequestLink =
            hoverCard.querySelector<HTMLAnchorElement>(
              ".bb-thread-hover-card__pr-link",
            );
          (replacementPullRequestLink ?? resolveActiveTrigger())?.focus();
        }
        requestAnimationFrame(positionCard);
      })
      .catch(() => undefined);
  }

  function refreshPullRequest(
    threadId: string,
    generation: number,
    hoverCard: HTMLDivElement,
  ): Promise<void> {
    const cached = cache.get(threadId);
    if (!cached?.summary.repository.isGitRepository) return Promise.resolve();
    const repositoryKey = pullRequestRepositoryIdentity(
      cached.summary.repository,
    );
    if (
      cached.pullRequestFetchedAt !== null &&
      Date.now() - cached.pullRequestFetchedAt < PULL_REQUEST_CACHE_TTL_MS
    ) {
      recordTiming({
        cache: "fresh",
        durationMs: 0,
        operation: "pullRequest",
        outcome: "ok",
        threadId,
      });
      return Promise.resolve();
    }

    return requestPullRequest(threadId, repositoryKey)
      .then(({ pullRequest, repository }) => {
        const current = cache.get(threadId);
        if (
          !current ||
          pullRequestRepositoryIdentity(repository) !== repositoryKey ||
          pullRequestRepositoryIdentity(current.summary.repository) !==
            repositoryKey
        ) {
          return;
        }
        const summary = { ...current.summary, pullRequest };
        cache.delete(threadId);
        cache.set(threadId, {
          ...current,
          pullRequestFetchedAt: Date.now(),
          summary,
        });
        if (
          disposed ||
          generation !== requestGeneration ||
          activeThreadId !== threadId ||
          !resolveActiveTrigger()
        ) {
          return;
        }

        const focusWasInsideCard =
          document.activeElement instanceof Node &&
          hoverCard.contains(document.activeElement);
        renderSummary(hoverCard, summary);
        if (focusWasInsideCard) {
          const replacementPullRequestLink =
            hoverCard.querySelector<HTMLAnchorElement>(
              ".bb-thread-hover-card__pr-link",
            );
          (replacementPullRequestLink ?? resolveActiveTrigger())?.focus();
        }
        requestAnimationFrame(positionCard);
      })
      .catch(() => undefined);
  }

  function finishRendering(
    threadId: string,
    generation: number,
    hoverCard: HTMLDivElement,
  ): void {
    setHoverCardRenderState(hoverCard, "summary");
    void Promise.all([
      refreshTiming(threadId, generation, hoverCard),
      refreshPullRequest(threadId, generation, hoverCard),
    ]).then(() =>
      markHoverCardComplete(
        hoverCard,
        () =>
          !disposed &&
          generation === requestGeneration &&
          activeThreadId === threadId &&
          resolveActiveTrigger() !== null,
      ),
    );
  }

  function resolveActiveTrigger(): HTMLAnchorElement | null {
    if (!activeThreadId) return null;
    if (
      activeTrigger?.isConnected &&
      threadIdFor(activeTrigger) === activeThreadId
    ) {
      return activeTrigger;
    }

    activeTrigger?.removeAttribute("aria-describedby");
    activeTrigger =
      Array.from(
        document.querySelectorAll<HTMLAnchorElement>(THREAD_TRIGGER_SELECTOR),
      ).find((candidate) => threadIdFor(candidate) === activeThreadId) ?? null;
    activeTrigger?.setAttribute("aria-describedby", CARD_ID);
    return activeTrigger;
  }

  function isTabbable(candidate: HTMLElement): boolean {
    if (
      !candidate.isConnected ||
      candidate.tabIndex < 0 ||
      candidate.closest("[hidden], [inert], [aria-hidden=\"true\"]") ||
      card?.contains(candidate)
    ) {
      return false;
    }

    for (
      let ancestor: HTMLElement | null = candidate;
      ancestor;
      ancestor = ancestor.parentElement
    ) {
      const computed = window.getComputedStyle(ancestor);
      if (
        computed.display === "none" ||
        computed.visibility === "hidden" ||
        computed.visibility === "collapse"
      ) {
        return false;
      }
    }
    return true;
  }

  function tabbableCandidates(): HTMLElement[] {
    return Array.from(
      document.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR),
    )
      .filter(isTabbable)
      .sort((left, right) => {
        const leftOrder =
          left.tabIndex > 0 ? left.tabIndex : Number.POSITIVE_INFINITY;
        const rightOrder =
          right.tabIndex > 0 ? right.tabIndex : Number.POSITIVE_INFINITY;
        return leftOrder - rightOrder;
      });
  }

  function nextTabbableAfter(trigger: HTMLElement): HTMLElement | null {
    const candidates = tabbableCandidates();
    const triggerIndex = candidates.indexOf(trigger);
    if (triggerIndex < 0) return null;
    return candidates[(triggerIndex + 1) % candidates.length] ?? null;
  }

  function showCard(
    trigger: HTMLAnchorElement,
    requestedAt = monotonicNow(),
  ): void {
    const threadId = threadIdFor(trigger);
    if (!threadId || disposed) return;

    onOpen();
    activeTrigger?.removeAttribute("aria-describedby");
    activeTrigger = trigger;
    activeThreadId = threadId;
    trigger.setAttribute("aria-describedby", CARD_ID);
    requestGeneration += 1;
    const generation = requestGeneration;
    abortSupersededSummaryRequests(threadId);
    const hoverCard = ensureCard();
    setHoverCardRenderState(hoverCard, "loading");
    hoverCard.hidden = false;
    hoverCard.classList.remove("is-visible");
    void hoverCard.offsetWidth;
    hoverCard.classList.add("is-visible");
    if (timeTimer) clearInterval(timeTimer);
    timeTimer = setInterval(() => {
      if (card && !card.hidden) refreshRunTime(card);
    }, 1_000);

    const cached = cachedSummary(threadId);
    if (cached) renderSummary(hoverCard, cached.summary);
    else renderLoading(hoverCard);
    requestAnimationFrame(positionCard);
    const cacheIsFresh =
      cached !== undefined &&
      Date.now() - cached.fetchedAt < summaryCacheTtl(cached.summary);
    recordTiming({
      cache: cached ? (cacheIsFresh ? "fresh" : "stale") : "miss",
      durationMs: elapsedMs(requestedAt),
      operation: "open",
      outcome: "ok",
      threadId,
    });

    if (cached) {
      recordTiming({
        cache: cacheIsFresh ? "fresh" : "stale",
        durationMs: elapsedMs(requestedAt),
        operation: "firstContent",
        outcome: "ok",
        threadId,
      });
      if (cacheIsFresh) {
        finishRendering(threadId, generation, hoverCard);
        return;
      }
    }

    void requestSummary(
      threadId,
      cached ? "stale" : "miss",
      generation,
    )
      .then((summary) => {
        if (
          disposed ||
          generation !== requestGeneration ||
          activeThreadId !== threadId ||
          !resolveActiveTrigger()
        ) {
          return;
        }
        const focusWasInsideCard =
          document.activeElement instanceof Node &&
          hoverCard.contains(document.activeElement);
        const currentSummary = cache.get(threadId)?.summary ?? summary;
        renderSummary(hoverCard, currentSummary);
        if (!cached) {
          recordTiming({
            cache: "miss",
            durationMs: elapsedMs(requestedAt),
            operation: "firstContent",
            outcome: "ok",
            server: summary.diagnostics,
            threadId,
          });
        }
        if (focusWasInsideCard) {
          const replacementPullRequestLink =
            hoverCard.querySelector<HTMLAnchorElement>(
              ".bb-thread-hover-card__pr-link",
            );
          (replacementPullRequestLink ?? resolveActiveTrigger())?.focus();
        }
        requestAnimationFrame(positionCard);
        finishRendering(threadId, generation, hoverCard);
      })
      .catch((error) => {
        if (
          !cached &&
          !disposed &&
          generation === requestGeneration &&
          activeThreadId === threadId &&
          resolveActiveTrigger()
        ) {
          renderError(hoverCard);
          setHoverCardRenderState(hoverCard, "error");
          recordTiming({
            cache: "miss",
            durationMs: elapsedMs(requestedAt),
            operation: "firstContent",
            outcome: isAbortError(error) ? "aborted" : "error",
            threadId,
          });
          requestAnimationFrame(positionCard);
        }
      });
  }

  function cancelOpen(): void {
    if (openTimer) {
      clearTimeout(openTimer);
      openTimer = null;
    }
  }

  function cancelClose(): void {
    if (!closeTimer) return;
    clearTimeout(closeTimer);
    closeTimer = null;
  }

  function scheduleOpen(trigger: HTMLAnchorElement, delay: number): void {
    cancelOpen();
    cancelClose();
    if (activeTrigger === trigger && card && !card.hidden) return;
    const requestedAt = monotonicNow();
    if (delay <= 0) {
      showCard(trigger, requestedAt);
      return;
    }
    openTimer = setTimeout(() => {
      openTimer = null;
      showCard(trigger, requestedAt);
    }, delay);
  }

  function closeCard(): void {
    cancelOpen();
    cancelClose();
    requestGeneration += 1;
    activeTrigger?.removeAttribute("aria-describedby");
    activeTrigger = null;
    activeThreadId = null;
    forwardTabTarget = null;
    if (timeTimer) {
      clearInterval(timeTimer);
      timeTimer = null;
    }
    if (card) {
      card.hidden = true;
      card.classList.remove("is-visible");
    }
  }

  function scheduleClose(): void {
    cancelClose();
    closeTimer = setTimeout(() => {
      closeTimer = null;
      const focused = document.activeElement;
      if (
        focused === activeTrigger ||
        (focused instanceof Node && card?.contains(focused))
      ) {
        return;
      }
      closeCard();
    }, CLOSE_DELAY_MS);
  }

  function onPointerOver(event: PointerEvent): void {
    if (event.pointerType === "touch") return;
    const trigger = findThreadTrigger(event.target);
    if (!trigger) return;
    const previousTrigger = findThreadTrigger(event.relatedTarget);
    if (previousTrigger === trigger) return;
    scheduleOpen(trigger, OPEN_DELAY_MS);
  }

  function onPointerOut(event: PointerEvent): void {
    const trigger = findThreadTrigger(event.target);
    if (!trigger) return;
    if (findThreadTrigger(event.relatedTarget) === trigger) return;
    if (event.relatedTarget instanceof Node && card?.contains(event.relatedTarget)) {
      return;
    }
    cancelOpen();
    scheduleClose();
  }

  function onFocusIn(event: FocusEvent): void {
    const trigger = findThreadTrigger(event.target);
    if (trigger) scheduleOpen(trigger, 0);
  }

  function onFocusOut(event: FocusEvent): void {
    if (event.target instanceof Node && card?.contains(event.target)) {
      if (
        event.relatedTarget instanceof Node &&
        (card.contains(event.relatedTarget) ||
          event.relatedTarget === activeTrigger)
      ) {
        return;
      }
      scheduleClose();
      return;
    }

    const trigger = findThreadTrigger(event.target);
    if (!trigger) return;
    if (findThreadTrigger(event.relatedTarget) === trigger) return;
    if (
      event.relatedTarget instanceof Node &&
      card?.contains(event.relatedTarget)
    ) {
      return;
    }
    scheduleClose();
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (!activeThreadId) return;

    const trigger = resolveActiveTrigger();
    const pullRequestLink =
      card?.querySelector<HTMLAnchorElement>(".bb-thread-hover-card__pr-link") ??
      null;
    if (
      event.key === "Tab" &&
      !event.shiftKey &&
      event.target === trigger &&
      pullRequestLink
    ) {
      event.preventDefault();
      cancelClose();
      forwardTabTarget = trigger ? nextTabbableAfter(trigger) : null;
      pullRequestLink.focus();
      return;
    }
    if (
      event.key === "Tab" &&
      event.shiftKey &&
      event.target === pullRequestLink
    ) {
      event.preventDefault();
      cancelClose();
      if (trigger) {
        trigger.focus();
      } else {
        const fallback = forwardTabTarget?.isConnected
          ? forwardTabTarget
          : tabbableCandidates()[0];
        closeCard();
        fallback?.focus();
      }
      return;
    }
    if (
      event.key === "Tab" &&
      !event.shiftKey &&
      event.target === pullRequestLink
    ) {
      event.preventDefault();
      const target =
        forwardTabTarget && isTabbable(forwardTabTarget)
          ? forwardTabTarget
          : trigger
            ? nextTabbableAfter(trigger)
            : tabbableCandidates()[0];
      closeCard();
      target?.focus();
      return;
    }
    if (event.key === "Escape") {
      const restoreFocus =
        event.target instanceof Node && card?.contains(event.target);
      if (restoreFocus) {
        event.preventDefault();
        const fallback =
          trigger ??
          (forwardTabTarget && isTabbable(forwardTabTarget)
            ? forwardTabTarget
            : tabbableCandidates()[0]);
        fallback?.focus();
        closeCard();
        return;
      }
      closeCard();
    }
  }

  function onClick(event: MouseEvent): void {
    if (findThreadTrigger(event.target)) closeCard();
  }

  document.addEventListener("pointerover", onPointerOver);
  document.addEventListener("pointerout", onPointerOut);
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("focusout", onFocusOut);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("click", onClick);
  window.addEventListener("resize", positionCard);
  window.addEventListener("scroll", positionCard, true);

  return {
    dispose() {
      disposed = true;
      closeCard();
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick);
      window.removeEventListener("resize", positionCard);
      window.removeEventListener("scroll", positionCard, true);
      card?.remove();
      card = null;
      style.remove();
      cache.clear();
      for (const request of pending.values()) request.controller.abort();
      pending.clear();
      pullRequestPending.clear();
      timingPending.clear();
      timingRetriedForSummary.clear();
      timingRetryScheduled.clear();
    },
    closeCard,
  };
}

async function fetchSectionSummary(
  target: SectionTrigger,
  signal: AbortSignal,
): Promise<SectionSummary> {
  const response = await fetch(
    "/api/v1/plugins/thread-hover-cards/rpc/sectionSummary",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: target.name,
        projectId: target.projectId,
        projectName: target.projectName,
        ...(target.sectionId === null ? {} : { sectionId: target.sectionId }),
      }),
      signal,
    },
  );
  const envelope = (await response.json()) as
    | { ok: true; result: SectionSummary }
    | { ok: false; error?: { message?: string } };
  if (!response.ok || !envelope.ok) {
    throw new Error(
      envelope.ok ? "Section summary request failed." : envelope.error?.message,
    );
  }
  return envelope.result;
}

interface SectionHoverCardOptions {
  /** Closes the thread card so the two never overlap on a fast diagonal move. */
  onOpen: () => void;
}

/**
 * A deliberately smaller sibling of the thread controller: the section card has
 * no interactive content, so it needs no focus trap, tab forwarding, or the
 * timing and pull-request refresh passes.
 */
function installSectionHoverCards({
  onOpen,
}: SectionHoverCardOptions): HoverCardController {
  let card: HTMLDivElement | null = null;
  let active: SectionTrigger | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;
  let generation = 0;
  let disposed = false;
  const cache = new Map<string, { fetchedAt: number; summary: SectionSummary }>();
  const pending = new Map<string, AbortController>();
  // Built-in groups (Pinned, Unorganized, …) reuse the section header markup,
  // so one answer stops us offering them a card. The verdict expires because a
  // section created or renamed a moment ago can also answer "not a section",
  // and that must not be permanent.
  const unknownSections = new Map<string, number>();
  const style = element("style", "");
  style.id = SECTION_STYLE_ID;
  style.textContent = SECTION_CARD_CSS;
  document.getElementById(SECTION_STYLE_ID)?.remove();
  document.head.append(style);

  const keyOf = (target: SectionTrigger): string =>
    JSON.stringify(
      target.sectionId === null
        ? ["name", target.name, target.projectName]
        : ["id", target.sectionId, target.projectId],
    );

  function ensureCard(): HTMLDivElement {
    if (card) return card;
    card = element("div", "bb-thread-hover-card");
    card.id = SECTION_CARD_ID;
    card.hidden = true;
    card.dataset.bbCard = "section";
    card.setAttribute("data-bb-plugin", "thread-hover-cards");
    card.setAttribute("data-bb-plugin-root", "");
    card.setAttribute("data-bb-portaled-overlay", "");
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", "Section summary");
    card.addEventListener("pointerenter", cancelClose);
    card.addEventListener("pointerleave", scheduleClose);
    document.body.append(card);
    return card;
  }

  function position(): void {
    if (!card || card.hidden || !active) return;
    if (!active.row.isConnected) {
      const current = findCurrentSectionTrigger(active);
      if (!current) {
        closeCard();
        return;
      }
      active.toggle.removeAttribute("aria-describedby");
      active = current;
      active.toggle.setAttribute("aria-describedby", SECTION_CARD_ID);
    }
    placeCardNear(card, active.row);
  }

  function abortPendingRequests(): void {
    for (const controller of pending.values()) controller.abort();
    pending.clear();
  }

  function closeCard(): void {
    cancelClose();
    generation += 1;
    abortPendingRequests();
    active?.toggle.removeAttribute("aria-describedby");
    active = null;
    if (card) {
      card.hidden = true;
      card.classList.remove("is-visible");
    }
  }

  function cancelClose(): void {
    if (!closeTimer) return;
    clearTimeout(closeTimer);
    closeTimer = null;
  }

  function scheduleClose(): void {
    cancelClose();
    closeTimer = setTimeout(() => {
      closeTimer = null;
      const focused = document.activeElement;
      if (
        focused === active?.toggle ||
        (focused instanceof Node && card?.contains(focused))
      ) {
        return;
      }
      closeCard();
    }, CLOSE_DELAY_MS);
  }

  function requestSummary(target: SectionTrigger): Promise<SectionSummary> {
    const key = keyOf(target);
    abortPendingRequests();
    const controller = new AbortController();
    pending.set(key, controller);
    return fetchSectionSummary(target, controller.signal)
      .then((summary) => {
        if (!summary.known) {
          unknownSections.set(key, Date.now());
          return summary;
        }
        cache.delete(key);
        cache.set(key, { fetchedAt: Date.now(), summary });
        while (cache.size > SECTION_CACHE_MAX_ENTRIES) {
          const oldest = cache.keys().next().value;
          if (oldest === undefined) break;
          cache.delete(oldest);
        }
        return summary;
      })
      .finally(() => {
        if (pending.get(key) === controller) pending.delete(key);
      });
  }

  function showCard(target: SectionTrigger): void {
    const knownUnknownAt = unknownSections.get(keyOf(target));
    if (disposed) return;
    if (
      knownUnknownAt !== undefined &&
      Date.now() - knownUnknownAt < SECTION_UNKNOWN_TTL_MS
    ) {
      closeCard();
      return;
    }
    onOpen();
    cancelClose();
    abortPendingRequests();
    active?.toggle.removeAttribute("aria-describedby");
    active = target;
    target.toggle.setAttribute("aria-describedby", SECTION_CARD_ID);
    generation += 1;
    const requestGeneration = generation;
    const hoverCard = ensureCard();
    setHoverCardRenderState(hoverCard, "loading");
    hoverCard.hidden = false;
    hoverCard.classList.remove("is-visible");
    void hoverCard.offsetWidth;
    hoverCard.classList.add("is-visible");
    const key = keyOf(target);
    const cached = cache.get(key);
    if (cached) {
      renderSectionSummary(hoverCard, cached.summary);
      setHoverCardRenderState(hoverCard, "summary");
    } else renderLoading(hoverCard, "section");
    requestAnimationFrame(position);
    if (cached && Date.now() - cached.fetchedAt < SECTION_SUMMARY_CACHE_TTL_MS) {
      void markHoverCardComplete(
        hoverCard,
        () =>
          !disposed && requestGeneration === generation && active !== null,
      );
      return;
    }

    void requestSummary(target)
      .then((summary) => {
        if (!summary.known) {
          if (!disposed && requestGeneration === generation) closeCard();
          return;
        }
        if (disposed || requestGeneration !== generation) return;
        renderSectionSummary(hoverCard, summary);
        requestAnimationFrame(position);
        setHoverCardRenderState(hoverCard, "summary");
        void markHoverCardComplete(
          hoverCard,
          () =>
            !disposed &&
            requestGeneration === generation &&
            active !== null,
        );
      })
      .catch((error) => {
        if (disposed || requestGeneration !== generation || cached) return;
        if (isAbortError(error)) return;
        renderError(hoverCard);
        setHoverCardRenderState(hoverCard, "error");
        requestAnimationFrame(position);
      });
  }

  function onPointerOver(event: PointerEvent): void {
    if (event.pointerType === "touch") return;
    const target = findSectionTrigger(event.target);
    if (!target) return;
    if (active?.row === target.row && card && !card.hidden) {
      cancelClose();
      return;
    }
    showCard(target);
  }

  function onPointerOut(event: PointerEvent): void {
    if (!findSectionTrigger(event.target)) return;
    if (findSectionTrigger(event.relatedTarget)?.row === active?.row) return;
    if (
      event.relatedTarget instanceof Node &&
      card?.contains(event.relatedTarget)
    ) {
      return;
    }
    scheduleClose();
  }

  function onFocusIn(event: FocusEvent): void {
    const target = findSectionTrigger(event.target);
    if (target) {
      if (active?.row === target.row && card && !card.hidden) {
        cancelClose();
        return;
      }
      showCard(target);
    } else if (
      active &&
      !(event.target instanceof Node && card?.contains(event.target))
    ) {
      scheduleClose();
    }
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape" && active) closeCard();
  }

  function onClick(event: MouseEvent): void {
    if (findSectionTrigger(event.target)) closeCard();
  }

  document.addEventListener("pointerover", onPointerOver);
  document.addEventListener("pointerout", onPointerOut);
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("click", onClick);
  window.addEventListener("resize", position);
  window.addEventListener("scroll", position, true);
  const sidebarObserver = new MutationObserver(position);
  sidebarObserver.observe(document.body, { childList: true, subtree: true });

  return {
    dispose() {
      disposed = true;
      closeCard();
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick);
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      sidebarObserver.disconnect();
      card?.remove();
      card = null;
      style.remove();
      cache.clear();
      unknownSections.clear();
      for (const controller of pending.values()) controller.abort();
      pending.clear();
    },
    closeCard,
  };
}

function installHoverCardLifecycle(): HoverCardController {
  let disposed = false;
  // Each card closes the other, so the refs are bound after both exist.
  let sections: HoverCardController | null = null;
  const threads = installHoverCards({
    onOpen: () => sections?.closeCard?.(),
  });
  sections = installSectionHoverCards({
    onOpen: () => threads.closeCard?.(),
  });
  const controllers = [threads, sections];

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const controller of controllers) controller.dispose();
    },
  };
}

// Hover cards are pointer-only affordances. On touch devices — mobile web,
// tablets — there is no hover, so the card either never opens or hijacks the
// tap that should have opened the thread. Gate on a real fine pointer.
const HOVER_CAPABLE_QUERY = "(hover: hover) and (pointer: fine)";

export default definePluginApp((app) => {
  app.contentScripts.register({
    id: "thread-hover-cards",
    mount({ signal }) {
      if (signal.aborted) return;
      const media =
        typeof window !== "undefined" && window.matchMedia
          ? window.matchMedia(HOVER_CAPABLE_QUERY)
          : null;
      let lifecycle: HoverCardController | null = null;
      let disposed = false;

      const syncLifecycle = () => {
        if (disposed) return;
        if (media?.matches && !lifecycle) {
          lifecycle = installHoverCardLifecycle();
        } else if (!media?.matches && lifecycle) {
          lifecycle.dispose();
          lifecycle = null;
        }
      };
      const onChange = () => syncLifecycle();
      const dispose = () => {
        if (disposed) return;
        disposed = true;
        media?.removeEventListener("change", onChange);
        lifecycle?.dispose();
        lifecycle = null;
      };

      media?.addEventListener("change", onChange);
      syncLifecycle();
      signal.addEventListener("abort", dispose, { once: true });
      return () => {
        signal.removeEventListener("abort", dispose);
        dispose();
      };
    },
  });
});
