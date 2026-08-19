export const PHASE_TARGETS = [
  "planning",
  "spec-review",
  "building",
  "handoff",
  "testing-deploy",
  "inbox",
] as const;

export type PhaseTarget = (typeof PHASE_TARGETS)[number];

export const PHASE_SECTION_NAMES: Record<PhaseTarget, string> = {
  planning: "📋 Planning",
  "spec-review": "🔎 Spec Review",
  building: "🛠️ Building",
  handoff: "🤝 Handoff",
  "testing-deploy": "✅ Testing / Deploy",
  inbox: "📥 Inbox",
};

export interface OrganizableThread {
  archivedAt: number | null;
  childOrigin?: "fork" | "side-chat" | null;
  deletedAt: number | null;
  originKind: "fork" | "side-chat" | null;
  originPluginId: string | null;
  parentThreadId: string | null;
  sourceThreadId: string | null;
  status: "active" | "error" | "idle" | "starting" | "stopping";
  visibility: "hidden" | "visible";
}

export interface PhaseClassification {
  confidence: number;
  reasons: string[];
  target: PhaseTarget;
}

export interface SectionDescriptor {
  id: string;
  name: string;
}

export interface TitleCandidate {
  confidence: number;
  title: string;
}

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
  "sounds good",
  "yes",
]);

const PHASE_RULES: Array<{
  target: Exclude<PhaseTarget, "inbox">;
  confidence: number;
  reason: string;
  expression: RegExp;
}> = [
  {
    target: "spec-review",
    confidence: 0.99,
    reason: "explicit spec review",
    expression:
      /\b(spec(?:ification)?|prd|proposal|implementation plan|requirements?)\b.{0,36}\b(review|critique|approve|approval|sign[ -]?off)\b|\b(review|critique|approve)\b.{0,24}\b(spec(?:ification)?|prd|proposal|plan|requirements?)\b/i,
  },
  {
    target: "handoff",
    confidence: 0.98,
    reason: "explicit handoff",
    expression:
      /\b(handoff|hand[ -]?off|transfer ownership|pass (?:this|it) (?:to|back)|integration order|ready for (?:another|the next) agent)\b/i,
  },
  {
    target: "testing-deploy",
    confidence: 0.97,
    reason: "verification or delivery work",
    expression:
      /\b(test(?:ing)?|qa|quality assurance|verify|verification|regression|ci|deploy|deployment|release|ship|shipping|merge-ready|visual qa)\b/i,
  },
  {
    target: "building",
    confidence: 0.96,
    reason: "implementation work",
    expression:
      /\b(implement|build|code|develop|fix|debug|refactor|patch|wire up|add support|update the .+ plugin)\b/i,
  },
  {
    target: "planning",
    confidence: 0.94,
    reason: "planning or discovery work",
    expression:
      /\b(plan|planning|scope|shape|explore|research|investigate|architecture|design direction|requirements?|break down|task graph)\b/i,
  },
];

const ACTION_PATTERNS: Array<{ expression: RegExp; title: string }> = [
  [/^take\s+over\b/i, "Take Over"],
  [/^clean\s+up\b/i, "Clean Up"],
  [/^root\s+cause\b/i, "Investigate"],
  [/^investigate\b/i, "Investigate"],
  [/^implement\b/i, "Implement"],
  [/^optimize\b/i, "Optimize"],
  [/^reorganize\b/i, "Reorganize"],
  [/^refactor\b/i, "Refactor"],
  [/^analyze\b/i, "Analyze"],
  [/^create\b/i, "Create"],
  [/^design\b/i, "Design"],
  [/^rewrite\b/i, "Rewrite"],
  [/^refresh\b/i, "Refresh"],
  [/^profile\b/i, "Profile"],
  [/^review\b/i, "Review"],
  [/^rename\b/i, "Rename"],
  [/^update\b/i, "Update"],
  [/^render\b/i, "Render"],
  [/^archive\b/i, "Archive"],
  [/^debug\b/i, "Debug"],
  [/^build\b/i, "Build"],
  [/^write\b/i, "Write"],
  [/^style\b/i, "Style"],
  [/^move\b/i, "Move"],
  [/^open\b/i, "Open"],
  [/^audit\b/i, "Audit"],
  [/^add\b/i, "Add"],
  [/^fix\b/i, "Fix"],
].map(([expression, title]) => ({
  expression: expression as RegExp,
  title: title as string,
}));

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
  "html",
  "http",
  "mcp",
  "pr",
  "qa",
  "sdk",
  "ui",
  "url",
  "ux",
]);
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

function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim()
    .toLowerCase();
}

export function isSubstantiveText(value: string): boolean {
  const normalized = normalize(value)
    .replace(/^\/[a-z0-9:_-]+\s*/i, "")
    .replace(/[.!?]+$/g, "")
    .trim();
  return (
    normalized.length >= 4 &&
    !LOW_INFORMATION.has(normalized) &&
    !/^(?:https?:\/\/\S+|@[a-z0-9:_-]+)$/i.test(normalized)
  );
}

export function isManageableThread(thread: OrganizableThread): boolean {
  return (
    thread.visibility === "visible" &&
    thread.parentThreadId === null &&
    thread.sourceThreadId === null &&
    thread.originKind === null &&
    (thread.childOrigin ?? null) === null &&
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

export function classifyPhase(texts: string[]): PhaseClassification {
  const substantive = texts.filter(isSubstantiveText).map(normalize);
  const corpus = substantive.join("\n");
  if (!corpus)
    return { target: "inbox", confidence: 1, reasons: ["phase unclear"] };
  const direct = substantive.find((text) =>
    /^(?:plan|planning|scope|shape|design the approach|write requirements?)\b/i.test(
      text,
    ),
  );
  if (direct)
    return {
      target: "planning",
      confidence: 0.99,
      reasons: ["explicit planning action"],
    };
  const matches = PHASE_RULES.filter((rule) => rule.expression.test(corpus));
  const winner = matches[0];
  if (!winner)
    return { target: "inbox", confidence: 1, reasons: ["phase unclear"] };
  return {
    target: winner.target,
    confidence: winner.confidence,
    reasons: [winner.reason],
  };
}

export function parsePhaseTarget(value: string): PhaseTarget | null {
  const normalized = normalize(value)
    .replace(/[📋🔎🛠️🤝✅📥]/gu, "")
    .trim()
    .replace(/[ _/]+/g, "-");
  const aliases: Record<string, PhaseTarget> = {
    plan: "planning",
    planning: "planning",
    spec: "spec-review",
    "spec-review": "spec-review",
    review: "spec-review",
    build: "building",
    building: "building",
    implement: "building",
    handoff: "handoff",
    test: "testing-deploy",
    testing: "testing-deploy",
    deploy: "testing-deploy",
    "testing-deploy": "testing-deploy",
    inbox: "inbox",
    unclear: "inbox",
  };
  return aliases[normalized] ?? null;
}

export function resolvePhaseSectionId(
  sections: SectionDescriptor[],
  target: PhaseTarget,
): string | null {
  const matches = sections.filter(
    (section) =>
      normalize(section.name) === normalize(PHASE_SECTION_NAMES[target]),
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
  for (const expression of [
    /^(?:can|could|would)\s+you\s+/i,
    /^can\s+i\s+/i,
    /^please\s+/i,
    /^i\s+(?:want|need)\s+to\s+/i,
    /^i(?:'d| would)\s+like\s+to\s+/i,
    /^help\s+me\s+(?:to\s+)?/i,
    /^let(?:'s| us)\s+/i,
  ])
    result = result.replace(expression, "");
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
    !prompt ||
    /^(?:https?:\/\/|@)/i.test(prompt) ||
    !isSubstantiveText(prompt)
  )
    return null;
  const action = ACTION_PATTERNS.find(({ expression }) =>
    expression.test(prompt),
  );
  if (!action) return null;
  prompt = prompt
    .replace(action.expression, "")
    .trim()
    .split(/\b(?:so that|because|and then|then|which|that)\b|[\n.!?;:]/i, 1)[0]!
    .replace(/^[\s"'`([{]+|[\s"'`\])}]+$/g, "")
    .trim();
  const words = prompt.match(/[A-Za-z0-9][A-Za-z0-9+#./↔<>-]*/g) ?? [];
  while (
    words.length &&
    /^(?:a|an|my|our|the|this|these|those)$/i.test(words[0]!)
  )
    words.shift();
  const objectWords = words.slice(
    0,
    Math.max(1, 5 - action.title.split(/\s+/).length),
  );
  while (
    objectWords.length &&
    TITLE_CONNECTORS.has(objectWords.at(-1)!.toLowerCase())
  )
    objectWords.pop();
  if (
    !objectWords.some(
      (word) =>
        !GENERIC_TITLE_WORDS.has(word.toLowerCase()) &&
        !TITLE_CONNECTORS.has(word.toLowerCase()) &&
        word.length > 1,
    )
  )
    return null;
  return {
    confidence: 0.92,
    title:
      `${action.title} ${objectWords.map((word, index) => displayTitleWord(word, index + 1)).join(" ")}`.trim(),
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
