export const SECTION_TARGETS = [
  "bb",
  "extensions",
  "design",
  "writing",
] as const;

export type SectionTarget = (typeof SECTION_TARGETS)[number];

export interface OrganizableThread {
  archivedAt: number | null;
  childOrigin: "fork" | "side-chat" | null;
  deletedAt: number | null;
  originKind: "fork" | "side-chat" | null;
  originPluginId: string | null;
  parentThreadId: string | null;
  sourceThreadId: string | null;
  status: "active" | "error" | "idle" | "starting" | "stopping";
  visibility: "hidden" | "visible";
}

export interface SectionClassification {
  confidence: number;
  margin: number;
  reasons: string[];
  runnerUp: SectionTarget | null;
  target: SectionTarget;
}

export interface SectionDescriptor {
  id: string;
  name: string;
}

export interface TitleCandidate {
  confidence: number;
  title: string;
}

const SECTION_ALIASES: Record<SectionTarget, readonly string[]> = {
  bb: ["bb", "bb quick fixes"],
  design: ["design"],
  extensions: ["extensions"],
  writing: ["writing"],
};

const LOW_INFORMATION = new Set([
  "continue",
  "do it",
  "fix",
  "go ahead",
  "help",
  "help me",
  "investigate",
  "ok",
  "okay",
  "proceed",
  "root cause this",
  "sounds good",
  "yes",
]);

const ACTION_PATTERNS: Array<{
  expression: RegExp;
  title: string;
}> = [
  { expression: /^take\s+over\b/i, title: "Take Over" },
  { expression: /^clean\s+up\b/i, title: "Clean Up" },
  { expression: /^root\s+cause\b/i, title: "Investigate" },
  { expression: /^investigate\b/i, title: "Investigate" },
  { expression: /^implement\b/i, title: "Implement" },
  { expression: /^optimize\b/i, title: "Optimize" },
  { expression: /^reorganize\b/i, title: "Reorganize" },
  { expression: /^refactor\b/i, title: "Refactor" },
  { expression: /^analyze\b/i, title: "Analyze" },
  { expression: /^create\b/i, title: "Create" },
  { expression: /^design\b/i, title: "Design" },
  { expression: /^rewrite\b/i, title: "Rewrite" },
  { expression: /^refresh\b/i, title: "Refresh" },
  { expression: /^profile\b/i, title: "Profile" },
  { expression: /^review\b/i, title: "Review" },
  { expression: /^rename\b/i, title: "Rename" },
  { expression: /^update\b/i, title: "Update" },
  { expression: /^render\b/i, title: "Render" },
  { expression: /^archive\b/i, title: "Archive" },
  { expression: /^debug\b/i, title: "Debug" },
  { expression: /^build\b/i, title: "Build" },
  { expression: /^write\b/i, title: "Write" },
  { expression: /^style\b/i, title: "Style" },
  { expression: /^move\b/i, title: "Move" },
  { expression: /^open\b/i, title: "Open" },
  { expression: /^audit\b/i, title: "Audit" },
  { expression: /^add\b/i, title: "Add" },
  { expression: /^fix\b/i, title: "Fix" },
];

const GENERIC_TITLE_WORDS = new Set([
  "agent",
  "automation",
  "bb",
  "issue",
  "plugin",
  "problem",
  "task",
  "thing",
  "this",
  "thread",
]);

const TITLE_CONNECTORS = new Set([
  "and",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "to",
  "with",
]);

const TITLE_ACRONYMS = new Set([
  "api",
  "bb",
  "ci",
  "cpu",
  "css",
  "ds",
  "html",
  "http",
  "https",
  "mcp",
  "pr",
  "qa",
  "sdk",
  "ui",
  "url",
  "ux",
]);

function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim()
    .toLowerCase();
}

function matches(value: string, expression: RegExp): boolean {
  expression.lastIndex = 0;
  return expression.test(value);
}

export function isSubstantiveText(value: string): boolean {
  const normalized = normalize(value)
    .replace(/^\/[a-z0-9:_-]+\s*/i, "")
    .replace(/[.!?]+$/g, "")
    .trim();
  if (normalized.length < 4 || LOW_INFORMATION.has(normalized)) return false;
  return !/^(?:https?:\/\/\S+|@[a-z0-9:_-]+)$/i.test(normalized);
}

export function isManageableThread(thread: OrganizableThread): boolean {
  return (
    thread.visibility === "visible" &&
    thread.parentThreadId === null &&
    thread.sourceThreadId === null &&
    thread.originKind === null &&
    thread.childOrigin === null &&
    thread.originPluginId === null &&
    thread.archivedAt === null &&
    thread.deletedAt === null
  );
}

export function isEligibleThread(thread: OrganizableThread): boolean {
  return (
    isManageableThread(thread) &&
    thread.status !== "error" &&
    thread.status !== "stopping"
  );
}

function setScore(
  scores: Map<SectionTarget, { confidence: number; reasons: string[] }>,
  target: SectionTarget,
  confidence: number,
  reason: string,
): void {
  const current = scores.get(target);
  if (current === undefined || confidence > current.confidence) {
    scores.set(target, { confidence, reasons: [reason] });
    return;
  }
  if (confidence === current.confidence && !current.reasons.includes(reason)) {
    current.reasons.push(reason);
  }
}

export function classifySection(input: {
  projectName: string;
  texts: string[];
}): SectionClassification | null {
  const project = normalize(input.projectName);
  const substantive = input.texts.filter(isSubstantiveText).map(normalize);
  const corpus = substantive.join("\n");
  const scores = new Map<
    SectionTarget,
    { confidence: number; reasons: string[] }
  >();

  if (
    matches(
      corpus,
      /\b(blog(?:\s+post)?|article|essay|positioning|product copy|website copy|editorial)\b/i,
    )
  ) {
    setScore(scores, "writing", 0.96, "explicit editorial intent");
  }

  if (
    project === "ui pattern atlas" ||
    matches(
      corpus,
      /\b(design system|ui patterns?|information architecture|interaction model|product direction|api surface|figma)\b|design\s*[↔<>-]\s*code/i,
    )
  ) {
    setScore(
      scores,
      "design",
      project === "ui pattern atlas" ? 0.97 : 0.95,
      project === "ui pattern atlas"
        ? "design project identity"
        : "durable design-system intent",
    );
  }

  if (
    ["bb plugins", "prompt shaper"].includes(project) ||
    (project !== "bb" &&
      matches(
        corpus,
        /\b(bb\s+plugin|plugin|skill|automation|agent tool|agent tooling)\b/i,
      ))
  ) {
    setScore(
      scores,
      "extensions",
      project === "bb plugins" || project === "prompt shaper" ? 0.98 : 0.96,
      project === "bb plugins" || project === "prompt shaper"
        ? "extension project identity"
        : "explicit extension intent",
    );
  } else if (project === "design doctrine") {
    setScore(scores, "extensions", 0.9, "extension project identity");
  }

  if (project === "bb") {
    setScore(scores, "bb", 0.9, "bb project identity");
    if (
      matches(
        corpus,
        /\b(fix|debug|investigate|implement|build|review|refactor|test|ci|server|daemon|sync|branch|pull request|pr\s*#?\d+|issue\s*#?\d+)\b/i,
      )
    ) {
      setScore(scores, "bb", 0.96, "bb engineering intent");
    }
  }

  const ranked = [...scores.entries()]
    .map(([target, value]) => ({ target, ...value }))
    .sort(
      (left, right) =>
        right.confidence - left.confidence ||
        left.target.localeCompare(right.target),
    );
  const winner = ranked[0];
  if (winner === undefined) return null;
  const runnerUp = ranked[1] ?? null;
  return {
    confidence: winner.confidence,
    margin: winner.confidence - (runnerUp?.confidence ?? 0),
    reasons: winner.reasons,
    runnerUp: runnerUp?.target ?? null,
    target: winner.target,
  };
}

export function resolveSectionId(
  sections: SectionDescriptor[],
  target: SectionTarget,
): string | null {
  const aliases = new Set(SECTION_ALIASES[target]);
  const matches = sections.filter((section) =>
    aliases.has(normalize(section.name)),
  );
  return matches.length === 1 ? matches[0]!.id : null;
}

function stripPromptPreamble(value: string): string {
  let result = value
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/^\s*(?:[-*]|\d+[.)])\s+/, "")
    .replace(/^\/[a-z0-9:_-]+\s+/i, "")
    .trim();
  const preambles = [
    /^(?:can|could|would)\s+you\s+/i,
    /^can\s+i\s+/i,
    /^please\s+/i,
    /^i\s+(?:want|need)\s+to\s+/i,
    /^i(?:'d| would)\s+like\s+to\s+/i,
    /^help\s+me\s+(?:to\s+)?/i,
    /^let(?:'s| us)\s+/i,
  ];
  for (const preamble of preambles) result = result.replace(preamble, "");
  return result.trim();
}

function displayTitleWord(word: string, index: number): string {
  const lower = word.toLowerCase();
  if (TITLE_ACRONYMS.has(lower)) return lower.toUpperCase();
  if (index > 0 && TITLE_CONNECTORS.has(lower)) return lower;
  if (/[0-9↔<>+#./-]/.test(word) && /[A-Z]/.test(word)) return word;
  return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
}

export function deriveTaskTitle(value: string): TitleCandidate | null {
  let prompt = stripPromptPreamble(value);
  if (
    prompt.length === 0 ||
    /^(?:https?:\/\/|@)/i.test(prompt) ||
    !isSubstantiveText(prompt)
  ) {
    return null;
  }

  const action = ACTION_PATTERNS.find(({ expression }) =>
    matches(prompt, expression),
  );
  if (action === undefined) return null;
  prompt = prompt.replace(action.expression, "").trim();
  prompt = prompt
    .split(/\b(?:so that|because|and then|then|which|that)\b|[\n.!?;:]/i, 1)[0]!
    .replace(/^[\s"'`([{]+|[\s"'`\])}]+$/g, "")
    .trim();

  const words =
    prompt.match(/[A-Za-z0-9][A-Za-z0-9+#./↔<>-]*/g)?.filter(Boolean) ?? [];
  while (
    words.length > 0 &&
    /^(?:a|an|my|our|the|this|these|those)$/i.test(words[0]!)
  ) {
    words.shift();
  }

  const actionWordCount = action.title.split(/\s+/).length;
  const objectWords = words.slice(0, Math.max(1, 5 - actionWordCount));
  while (
    objectWords.length > 0 &&
    TITLE_CONNECTORS.has(objectWords.at(-1)!.toLowerCase())
  ) {
    objectWords.pop();
  }
  const specificWords = objectWords.filter((word) => {
    const normalized = word.toLowerCase();
    return (
      !GENERIC_TITLE_WORDS.has(normalized) &&
      !TITLE_CONNECTORS.has(normalized) &&
      normalized.length > 1
    );
  });
  if (objectWords.length === 0 || specificWords.length === 0) return null;

  const objectTitle = objectWords
    .map((word, index) => displayTitleWord(word, index + actionWordCount))
    .join(" ");
  return {
    confidence: 0.92,
    title: `${action.title} ${objectTitle}`.trim(),
  };
}

export function nextEvaluationMilestone(current: number): number {
  return current <= 1 ? 5 : current + 10;
}

export function advanceEvaluationMilestone(
  current: number,
  completedTurns: number,
): number {
  let next = current;
  while (next <= completedTurns) next = nextEvaluationMilestone(next);
  return next;
}
