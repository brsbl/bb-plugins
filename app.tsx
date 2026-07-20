import { definePluginApp } from "@bb/plugin-sdk/app";
import {
  AlarmClockIcon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  ClaudeIcon,
  CursorIcon,
  Folder01Icon,
  FolderEditIcon,
  GitBranchIcon,
  LaptopIcon,
  LinkSquare01Icon,
  Loading03Icon,
  OpenAiIcon,
  PiIcon,
  SourceCodeIcon,
  SquareUnlock02Icon,
  ViewIcon,
} from "./icons";
import type { ThreadSummary, ThreadTiming } from "./server";
import { HOVER_CARD_CSS } from "./styles";
import { markdownPreview } from "./markdown-preview";

const CARD_ID = "bb-thread-hover-card";
const STYLE_ID = "bb-thread-hover-card-styles";
const PLUGIN_CSS_SELECTOR =
  'link[data-bb-plugin-css="thread-hover-cards"]';
const THREAD_TRIGGER_SELECTOR = "a[data-sidebar-thread-id]";
const THREAD_ROW_SELECTOR = ".group\\/thread-row";
const OPEN_DELAY_MS = 150;
const PREFETCH_DELAY_MS = 50;
const CLOSE_DELAY_MS = 120;
const CACHE_TTL_MS = 10_000;
const CACHE_MAX_ENTRIES = 128;
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
  summary: ThreadSummary;
  timingFetchedAt: number | null;
}

interface HoverCardController {
  dispose(): void;
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
    case "open":
      return "success";
    case "draft":
      return "muted";
    case "closed":
      return "danger";
    case "merged":
      return "merged";
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
  if (providerId === "claude-code") {
    return formatted.replace(/^Claude\s+/i, "");
  }
  return formatted;
}

function permissionLabel(
  permissionMode: ThreadSummary["permissionMode"],
): string | null {
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
      : summary.permissionMode === "workspace-write"
        ? { definition: FolderEditIcon, name: "FolderEditIcon" }
        : { definition: ViewIcon, name: "ViewIcon" };
  const access = element("span", "bb-thread-hover-card__access");
  access.dataset.permissionMode = summary.permissionMode!;
  access.setAttribute("aria-label", `Permission: ${label}`);
  access.title = `Permission: ${label}`;
  access.append(
    icon(
      permissionIcon.definition,
      permissionIcon.name,
      "bb-thread-hover-card__icon bb-thread-hover-card__permission-icon",
    ),
    document.createTextNode(label),
  );
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

async function fetchSummary(threadId: string): Promise<ThreadSummary> {
  const response = await fetch(
    "/api/v1/plugins/thread-hover-cards/rpc/threadSummary",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ threadId }),
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

function renderLoading(card: HTMLElement): void {
  card.replaceChildren(
    element(
      "p",
      "bb-thread-hover-card__loading",
      "Loading thread summary…",
    ),
  );
}

function renderError(card: HTMLElement): void {
  card.replaceChildren(
    element("p", "bb-thread-hover-card__loading", "Summary unavailable"),
  );
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
    ? `${summary.provider.displayName} · ${modelLabel} · ${reasoningLabel} reasoning`
    : `${summary.provider.displayName} · ${modelLabel}`;
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
    context.dataset.hasBranch = String(
      summary.repository.isGitRepository &&
        Boolean(summary.repository.branch),
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

    if (summary.repository.isGitRepository && summary.repository.branch) {
      const branch = element("span", "bb-thread-hover-card__branch");
      const branchName = element(
        "span",
        "bb-thread-hover-card__branch-name",
        summary.repository.branch,
      );
      branchName.title = summary.repository.branch;
      branch.append(
        icon(
          GitBranchIcon,
          "GitBranchIcon",
          "bb-thread-hover-card__icon bb-thread-hover-card__meta-icon",
        ),
        branchName,
      );
      context.append(branch);
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

function installHoverCards(): HoverCardController {
  let card: HTMLDivElement | null = null;
  let activeTrigger: HTMLAnchorElement | null = null;
  let activeThreadId: string | null = null;
  let openTimer: ReturnType<typeof setTimeout> | null = null;
  let prefetchTimer: ReturnType<typeof setTimeout> | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;
  let timeTimer: ReturnType<typeof setInterval> | null = null;
  let disposed = false;
  let requestGeneration = 0;
  let forwardTabTarget: HTMLElement | null = null;
  const cache = new Map<string, CachedSummary>();
  const pending = new Map<string, Promise<ThreadSummary>>();
  const timingPending = new Map<string, Promise<ThreadTiming>>();
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

    const anchor =
      trigger.closest<HTMLElement>(THREAD_ROW_SELECTOR) ?? trigger;
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

  function cachedSummary(threadId: string): CachedSummary | undefined {
    const cached = cache.get(threadId);
    if (!cached) return undefined;
    cache.delete(threadId);
    cache.set(threadId, cached);
    return cached;
  }

  function cacheSummary(threadId: string, summary: ThreadSummary): void {
    cache.delete(threadId);
    cache.set(threadId, {
      fetchedAt: Date.now(),
      summary,
      timingFetchedAt: null,
    });
    while (cache.size > CACHE_MAX_ENTRIES) {
      const oldestThreadId = cache.keys().next().value;
      if (oldestThreadId === undefined) break;
      cache.delete(oldestThreadId);
    }
  }

  function requestSummary(threadId: string): Promise<ThreadSummary> {
    const existing = pending.get(threadId);
    if (existing) return existing;

    const request = fetchSummary(threadId)
      .then((summary) => {
        cacheSummary(threadId, summary);
        return summary;
      })
      .finally(() => pending.delete(threadId));
    pending.set(threadId, request);
    return request;
  }

  function requestTiming(threadId: string): Promise<ThreadTiming> {
    const existing = timingPending.get(threadId);
    if (existing) return existing;

    const request = fetchTiming(threadId).finally(() =>
      timingPending.delete(threadId),
    );
    timingPending.set(threadId, request);
    return request;
  }

  function prefetchSummary(threadId: string): void {
    const cached = cachedSummary(threadId);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return;
    void requestSummary(threadId).catch(() => undefined);
  }

  function refreshTiming(
    threadId: string,
    generation: number,
    hoverCard: HTMLDivElement,
  ): void {
    const cached = cache.get(threadId);
    if (
      cached?.timingFetchedAt !== null &&
      cached?.timingFetchedAt !== undefined &&
      Date.now() - cached.timingFetchedAt < CACHE_TTL_MS
    ) {
      return;
    }

    void requestTiming(threadId)
      .then((timing) => {
        const current = cache.get(threadId);
        if (!current) return;
        const summary = {
          ...current.summary,
          ...timing,
        };
        cache.delete(threadId);
        cache.set(threadId, {
          ...current,
          summary,
          timingFetchedAt: Date.now(),
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

  function showCard(trigger: HTMLAnchorElement): void {
    const threadId = threadIdFor(trigger);
    if (!threadId || disposed) return;

    activeTrigger?.removeAttribute("aria-describedby");
    activeTrigger = trigger;
    activeThreadId = threadId;
    trigger.setAttribute("aria-describedby", CARD_ID);
    requestGeneration += 1;
    const generation = requestGeneration;
    const hoverCard = ensureCard();
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

    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      refreshTiming(threadId, generation, hoverCard);
      return;
    }

    void requestSummary(threadId)
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
        renderSummary(hoverCard, summary);
        if (focusWasInsideCard) {
          const replacementPullRequestLink =
            hoverCard.querySelector<HTMLAnchorElement>(
              ".bb-thread-hover-card__pr-link",
            );
          (replacementPullRequestLink ?? resolveActiveTrigger())?.focus();
        }
        requestAnimationFrame(positionCard);
        refreshTiming(threadId, generation, hoverCard);
      })
      .catch(() => {
        if (
          !cached &&
          !disposed &&
          generation === requestGeneration &&
          activeThreadId === threadId &&
          resolveActiveTrigger()
        ) {
          renderError(hoverCard);
          requestAnimationFrame(positionCard);
        }
      });
  }

  function cancelOpen(): void {
    if (openTimer) {
      clearTimeout(openTimer);
      openTimer = null;
    }
    if (prefetchTimer) {
      clearTimeout(prefetchTimer);
      prefetchTimer = null;
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
    const threadId = threadIdFor(trigger);
    if (threadId && delay > 0) {
      prefetchTimer = setTimeout(() => {
        prefetchTimer = null;
        prefetchSummary(threadId);
      }, Math.min(PREFETCH_DELAY_MS, delay));
    }
    openTimer = setTimeout(() => {
      openTimer = null;
      showCard(trigger);
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
      pending.clear();
    },
  };
}

function installHoverCardLifecycle(): HoverCardController {
  let controller: HoverCardController | null = null;
  let disposed = false;

  function reconcile(): void {
    if (disposed) return;

    const pluginIsActive = document.querySelector(PLUGIN_CSS_SELECTOR) !== null;
    if (pluginIsActive && !controller) {
      controller = installHoverCards();
    } else if (!pluginIsActive && controller) {
      controller.dispose();
      controller = null;
    }
  }

  const observer = new MutationObserver(reconcile);
  observer.observe(document.head, { childList: true });
  reconcile();

  return {
    dispose() {
      disposed = true;
      observer.disconnect();
      controller?.dispose();
      controller = null;
    },
  };
}

const pluginGlobal = globalThis as typeof globalThis & {
  __bbThreadHoverCards?: HoverCardController;
};

function start(): void {
  pluginGlobal.__bbThreadHoverCards?.dispose();
  pluginGlobal.__bbThreadHoverCards = installHoverCardLifecycle();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    const onReady = () => start();
    document.addEventListener("DOMContentLoaded", onReady, { once: true });
    pluginGlobal.__bbThreadHoverCards = {
      dispose() {
        document.removeEventListener("DOMContentLoaded", onReady);
      },
    };
  } else {
    start();
  }
}

// The SDK currently has no thread-row hover slot. This valid, empty app
// definition lets BB load the scoped compatibility bridge above.
export default definePluginApp(() => {});
