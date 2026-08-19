import { createRequire as __createRequire } from "node:module";
import { dirname as __pathDirname } from "node:path";
import { fileURLToPath as __fileURLToPath } from "node:url";
const require = __createRequire(import.meta.url);
var __filename = __fileURLToPath(import.meta.url);
var __dirname = __pathDirname(__filename);

// core.ts
var PHASE_SECTION_NAMES = {
  planning: "\u{1F4CB} Planning",
  "spec-review": "\u{1F50E} Spec Review",
  building: "\u{1F6E0}\uFE0F Building",
  handoff: "\u{1F91D} Handoff",
  "testing-deploy": "\u2705 Testing / Deploy",
  inbox: "\u{1F4E5} Inbox"
};
var LOW_INFORMATION = /* @__PURE__ */ new Set([
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
  "yes"
]);
var PHASE_RULES = [
  {
    target: "spec-review",
    confidence: 0.99,
    reason: "explicit spec review",
    expression: /\b(spec(?:ification)?|prd|proposal|implementation plan|requirements?)\b.{0,36}\b(review|critique|approve|approval|sign[ -]?off)\b|\b(review|critique|approve)\b.{0,24}\b(spec(?:ification)?|prd|proposal|plan|requirements?)\b/i
  },
  {
    target: "handoff",
    confidence: 0.98,
    reason: "explicit handoff",
    expression: /\b(handoff|hand[ -]?off|transfer ownership|pass (?:this|it) (?:to|back)|integration order|ready for (?:another|the next) agent)\b/i
  },
  {
    target: "testing-deploy",
    confidence: 0.97,
    reason: "verification or delivery work",
    expression: /\b(test(?:ing)?|qa|quality assurance|verify|verification|regression|ci|deploy|deployment|release|ship|shipping|merge-ready|visual qa)\b/i
  },
  {
    target: "building",
    confidence: 0.96,
    reason: "implementation work",
    expression: /\b(implement|build|code|develop|fix|debug|refactor|patch|wire up|add support|update the .+ plugin)\b/i
  },
  {
    target: "planning",
    confidence: 0.94,
    reason: "planning or discovery work",
    expression: /\b(plan|planning|scope|shape|explore|research|investigate|architecture|design direction|requirements?|break down|task graph)\b/i
  }
];
var ACTION_PATTERNS = [
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
  [/^fix\b/i, "Fix"]
].map(([expression, title]) => ({
  expression,
  title
}));
var TITLE_CONNECTORS = /* @__PURE__ */ new Set([
  "and",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "to",
  "with"
]);
var TITLE_ACRONYMS = /* @__PURE__ */ new Set([
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
  "ux"
]);
var GENERIC_TITLE_WORDS = /* @__PURE__ */ new Set([
  "agent",
  "automation",
  "bb",
  "issue",
  "plugin",
  "problem",
  "task",
  "thing",
  "this",
  "thread"
]);
function normalize(value) {
  return value.normalize("NFKC").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").trim().toLowerCase();
}
function isSubstantiveText(value) {
  const normalized = normalize(value).replace(/^\/[a-z0-9:_-]+\s*/i, "").replace(/[.!?]+$/g, "").trim();
  return normalized.length >= 4 && !LOW_INFORMATION.has(normalized) && !/^(?:https?:\/\/\S+|@[a-z0-9:_-]+)$/i.test(normalized);
}
function isManageableThread(thread) {
  return thread.visibility === "visible" && thread.parentThreadId === null && thread.sourceThreadId === null && thread.originKind === null && (thread.childOrigin ?? null) === null && thread.originPluginId === null && thread.archivedAt === null && thread.deletedAt === null;
}
function isEligibleThread(thread) {
  return isManageableThread(thread) && thread.status !== "error" && thread.status !== "stopping";
}
function classifyPhase(texts) {
  const substantive = texts.filter(isSubstantiveText).map(normalize);
  const corpus = substantive.join("\n");
  if (!corpus)
    return { target: "inbox", confidence: 1, reasons: ["phase unclear"] };
  const direct = substantive.find(
    (text) => /^(?:plan|planning|scope|shape|design the approach|write requirements?)\b/i.test(
      text
    )
  );
  if (direct)
    return {
      target: "planning",
      confidence: 0.99,
      reasons: ["explicit planning action"]
    };
  const matches = PHASE_RULES.filter((rule) => rule.expression.test(corpus));
  const winner = matches[0];
  if (!winner)
    return { target: "inbox", confidence: 1, reasons: ["phase unclear"] };
  return {
    target: winner.target,
    confidence: winner.confidence,
    reasons: [winner.reason]
  };
}
function parsePhaseTarget(value) {
  const normalized = normalize(value).replace(/[📋🔎🛠️🤝✅📥]/gu, "").trim().replace(/[ _/]+/g, "-");
  const aliases = {
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
    unclear: "inbox"
  };
  return aliases[normalized] ?? null;
}
function resolvePhaseSectionId(sections, target) {
  const matches = sections.filter(
    (section) => normalize(section.name) === normalize(PHASE_SECTION_NAMES[target])
  );
  return matches.length === 1 ? matches[0].id : null;
}
function stripPromptPreamble(value) {
  let result = value.normalize("NFKC").replace(/\r\n?/g, "\n").replace(/^\s*(?:[-*]|\d+[.)])\s+/, "").replace(/^\/[a-z0-9:_-]+\s+/i, "").trim();
  for (const expression of [
    /^(?:can|could|would)\s+you\s+/i,
    /^can\s+i\s+/i,
    /^please\s+/i,
    /^i\s+(?:want|need)\s+to\s+/i,
    /^i(?:'d| would)\s+like\s+to\s+/i,
    /^help\s+me\s+(?:to\s+)?/i,
    /^let(?:'s| us)\s+/i
  ])
    result = result.replace(expression, "");
  return result.trim();
}
function displayTitleWord(word, index) {
  const lower = word.toLowerCase();
  if (TITLE_ACRONYMS.has(lower)) return lower.toUpperCase();
  if (index > 0 && TITLE_CONNECTORS.has(lower)) return lower;
  if (/[0-9↔<>+#./-]/.test(word) && /[A-Z]/.test(word)) return word;
  return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
}
function deriveTaskTitle(value) {
  let prompt = stripPromptPreamble(value);
  if (!prompt || /^(?:https?:\/\/|@)/i.test(prompt) || !isSubstantiveText(prompt))
    return null;
  const action = ACTION_PATTERNS.find(
    ({ expression }) => expression.test(prompt)
  );
  if (!action) return null;
  prompt = prompt.replace(action.expression, "").trim().split(/\b(?:so that|because|and then|then|which|that)\b|[\n.!?;:]/i, 1)[0].replace(/^[\s"'`([{]+|[\s"'`\])}]+$/g, "").trim();
  const words = prompt.match(/[A-Za-z0-9][A-Za-z0-9+#./↔<>-]*/g) ?? [];
  while (words.length && /^(?:a|an|my|our|the|this|these|those)$/i.test(words[0]))
    words.shift();
  const objectWords = words.slice(
    0,
    Math.max(1, 5 - action.title.split(/\s+/).length)
  );
  while (objectWords.length && TITLE_CONNECTORS.has(objectWords.at(-1).toLowerCase()))
    objectWords.pop();
  if (!objectWords.some(
    (word) => !GENERIC_TITLE_WORDS.has(word.toLowerCase()) && !TITLE_CONNECTORS.has(word.toLowerCase()) && word.length > 1
  ))
    return null;
  return {
    confidence: 0.92,
    title: `${action.title} ${objectWords.map((word, index) => displayTitleWord(word, index + 1)).join(" ")}`.trim()
  };
}
function nextEvaluationMilestone(current) {
  return current <= 1 ? 5 : current + 10;
}
function advanceEvaluationMilestone(current, completedTurns) {
  let next = current;
  while (next <= completedTurns) next = nextEvaluationMilestone(next);
  return next;
}

// server.ts
var STATE_PREFIX = "thread:v1:";
var OWNED_SECTIONS_KEY = "sections:v1";
var THREAD_LIST_PAGE_SIZE = 100;
var RECONCILIATION_INTERVAL_MS = 5 * 6e4;
var MAX_COMPLETED_EVENT_DRAIN = 100;
var CLASSIFIER_VERSION = 3;
function stateKey(threadId) {
  return `${STATE_PREFIX}${threadId}`;
}
function initialState(thread) {
  return {
    version: 2,
    completedTurns: 0,
    createdAt: thread.createdAt,
    hasAppliedSection: false,
    hasAppliedTitle: false,
    lastAppliedSectionId: null,
    lastAppliedTitle: null,
    lastCompletedSeq: 0,
    nextEvaluationTurn: 1,
    phaseClassification: null,
    sectionLocked: thread.sectionId !== null,
    titleLocked: thread.title !== null
  };
}
function migrateState(value, thread) {
  if (!value || typeof value !== "object") return initialState(thread);
  const legacy = value;
  const appliedSection = legacy.hasAppliedSection === true;
  return {
    ...initialState(thread),
    completedTurns: typeof legacy.completedTurns === "number" ? legacy.completedTurns : 0,
    createdAt: typeof legacy.createdAt === "number" ? legacy.createdAt : thread.createdAt,
    hasAppliedSection: appliedSection,
    hasAppliedTitle: legacy.hasAppliedTitle === true,
    lastAppliedSectionId: typeof legacy.lastAppliedSectionId === "string" ? legacy.lastAppliedSectionId : null,
    lastAppliedTitle: typeof legacy.lastAppliedTitle === "string" ? legacy.lastAppliedTitle : null,
    lastCompletedSeq: typeof legacy.lastCompletedSeq === "number" ? legacy.lastCompletedSeq : 0,
    nextEvaluationTurn: typeof legacy.nextEvaluationTurn === "number" ? legacy.nextEvaluationTurn : 1,
    phaseClassification: legacy.version === 2 ? legacy.phaseClassification ?? null : null,
    sectionLocked: legacy.version === 2 ? legacy.sectionLocked === true : appliedSection ? false : legacy.sectionLocked === true || thread.sectionId !== null,
    titleLocked: legacy.version === 2 ? legacy.titleLocked === true : legacy.titleLocked === true || !legacy.hasAppliedTitle && thread.title !== null
  };
}
function promptTexts(history) {
  return [...history].sort((a, b) => a.createdAt - b.createdAt).flatMap(
    (entry) => entry.input.flatMap(
      (item) => item.type === "text" && item.visibility !== "agent-only" ? [item.text] : []
    )
  );
}
function abortableDelay(ms, signal) {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(done, ms);
    signal.addEventListener("abort", done, { once: true });
    function done() {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve();
    }
  });
}
function plugin(bb) {
  const settings = bb.settings.define({
    inboxMode: {
      type: "select",
      label: "Mode",
      description: "Apply organizes threads automatically. Observe only logs proposed changes.",
      options: ["observe", "apply"],
      default: "apply"
    }
  });
  const queues = /* @__PURE__ */ new Map();
  let disposed = false;
  async function readState(thread) {
    return migrateState(
      await bb.storage.kv.get(stateKey(thread.id)),
      thread
    );
  }
  async function saveState(threadId, state) {
    await bb.storage.kv.set(stateKey(threadId), state);
  }
  async function ownedSectionIds() {
    const stored = await bb.storage.kv.get(OWNED_SECTIONS_KEY);
    return new Set(
      Array.isArray(stored) ? stored.filter((id) => typeof id === "string") : []
    );
  }
  async function saveOwnedSections(ids) {
    await bb.storage.kv.set(OWNED_SECTIONS_KEY, [...ids].sort());
  }
  function enqueue(threadId, work) {
    const previous = queues.get(threadId) ?? Promise.resolve();
    const current = previous.catch(() => void 0).then(async () => {
      if (!disposed) await work();
    }).catch(
      (error) => bb.log.error(
        `thread=${threadId} action=queue-failed error=${error instanceof Error ? error.message : String(error)}`
      )
    ).finally(() => {
      if (queues.get(threadId) === current) queues.delete(threadId);
    });
    queues.set(threadId, current);
    return current;
  }
  async function ensurePhaseSection(target) {
    const listed = await bb.sdk.threadSections.list();
    const existingId = resolvePhaseSectionId(listed, target);
    if (existingId) return listed.find((section) => section.id === existingId);
    try {
      const created = await bb.sdk.threadSections.create({
        name: PHASE_SECTION_NAMES[target]
      });
      const owned = await ownedSectionIds();
      owned.add(created.id);
      await saveOwnedSections(owned);
      bb.log.info(
        `action=phase-section-created target=${target} section=${created.id}`
      );
      return created;
    } catch (error) {
      const raced = await bb.sdk.threadSections.list();
      const racedId = resolvePhaseSectionId(raced, target);
      if (racedId) return raced.find((section) => section.id === racedId);
      throw error;
    }
  }
  async function cleanupEmptyOwnedSections() {
    const owned = await ownedSectionIds();
    if (!owned.size) return;
    const existing = new Map(
      (await bb.sdk.threadSections.list()).map((section) => [
        section.id,
        section
      ])
    );
    let changed = false;
    for (const id of [...owned]) {
      if (!existing.has(id)) {
        owned.delete(id);
        changed = true;
        continue;
      }
      const members = await bb.sdk.threads.list({
        archived: false,
        sectionId: id,
        limit: 1
      });
      if (members.length) continue;
      try {
        await bb.sdk.threadSections.delete({ id });
        owned.delete(id);
        changed = true;
        bb.log.info(`action=phase-section-deleted section=${id}`);
      } catch (error) {
        bb.log.debug(
          `action=phase-section-delete-deferred section=${id} error=${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
    if (changed) await saveOwnedSections(owned);
  }
  function syncManualLocks(state, thread) {
    if (!state.titleLocked && (state.hasAppliedTitle ? thread.title !== state.lastAppliedTitle : thread.title !== null))
      state.titleLocked = true;
    if (!state.sectionLocked && (state.hasAppliedSection ? thread.sectionId !== state.lastAppliedSectionId : thread.sectionId !== null))
      state.sectionLocked = true;
  }
  async function moveToPhase(thread, state, target, explicit) {
    const { inboxMode } = await settings.get();
    if (!explicit && state.sectionLocked) return thread;
    if (inboxMode !== "apply" && !explicit) {
      bb.log.info(
        `thread=${thread.id} mode=observe action=propose-phase target=${target}`
      );
      return thread;
    }
    const section = await ensurePhaseSection(target);
    if (thread.sectionId === section.id) return thread;
    const fresh = await bb.sdk.threads.get({ threadId: thread.id });
    if (!explicit) {
      syncManualLocks(state, fresh);
      if (state.sectionLocked || !isManageableThread(fresh) || fresh.sectionId !== thread.sectionId)
        return fresh;
    }
    const updated = await bb.sdk.threads.update({
      threadId: thread.id,
      sectionId: section.id
    });
    state.hasAppliedSection = true;
    state.lastAppliedSectionId = section.id;
    state.sectionLocked = explicit;
    state.phaseClassification = {
      classifierVersion: CLASSIFIER_VERSION,
      decision: {
        target,
        confidence: 1,
        reasons: [explicit ? "agent transition" : "automatic phase mapping"]
      }
    };
    await saveState(thread.id, state);
    await cleanupEmptyOwnedSections();
    bb.log.info(`thread=${thread.id} action=phase-updated target=${target}`);
    return updated;
  }
  async function evaluate(threadId) {
    const thread = await bb.sdk.threads.get({ threadId });
    if (!isManageableThread(thread)) return;
    const state = await readState(thread);
    syncManualLocks(state, thread);
    const history = promptTexts(
      await bb.sdk.threads.promptHistory({ threadId, limit: "6" })
    );
    const texts = [
      ...thread.title ? [thread.title] : [],
      ...thread.titleFallback ? [thread.titleFallback] : [],
      ...history
    ];
    const decision = classifyPhase(texts);
    state.phaseClassification = {
      classifierVersion: CLASSIFIER_VERSION,
      decision
    };
    await moveToPhase(thread, state, decision.target, false);
    if (!state.titleLocked && thread.title === null) {
      const source = history.find(isSubstantiveText) ?? thread.titleFallback;
      const candidate = source ? deriveTaskTitle(source) : null;
      if (candidate && candidate.confidence >= 0.9 && (await settings.get()).inboxMode === "apply") {
        const updated = await bb.sdk.threads.update({
          threadId,
          title: candidate.title
        });
        state.hasAppliedTitle = true;
        state.lastAppliedTitle = updated.title;
      }
    }
    await saveState(threadId, state);
  }
  async function consumeCompletedTurns(threadId, state) {
    let drained = 0;
    while (drained < MAX_COMPLETED_EVENT_DRAIN) {
      const event = await bb.sdk.threads.events.wait({
        threadId,
        type: "turn/completed",
        waitMs: "1",
        ...state.lastCompletedSeq ? { afterSeq: String(state.lastCompletedSeq) } : {}
      });
      if (!event) break;
      state.lastCompletedSeq = event.seq;
      if (event.type === "turn/completed" && event.data.status === "completed")
        state.completedTurns += 1;
      drained += 1;
    }
    const due = state.completedTurns >= state.nextEvaluationTurn;
    if (due)
      state.nextEvaluationTurn = advanceEvaluationMilestone(
        state.nextEvaluationTurn,
        state.completedTurns
      );
    return due;
  }
  async function reconcileExisting(signal) {
    let offset = 0;
    while (!signal.aborted) {
      const page = await bb.sdk.threads.list({
        archived: false,
        hasParent: false,
        limit: THREAD_LIST_PAGE_SIZE,
        offset,
        signal
      });
      for (const thread of page)
        if (!signal.aborted && isManageableThread(thread))
          await evaluate(thread.id);
      if (page.length < THREAD_LIST_PAGE_SIZE) break;
      offset += THREAD_LIST_PAGE_SIZE;
    }
    if (!signal.aborted) await cleanupEmptyOwnedSections();
  }
  bb.events.on(
    "thread.created",
    ({ thread }) => enqueue(thread.id, async () => {
      if (isEligibleThread(thread)) await evaluate(thread.id);
    })
  );
  bb.events.on(
    "thread.active",
    ({ thread }) => enqueue(thread.id, () => evaluate(thread.id))
  );
  bb.events.on(
    "thread.idle",
    ({ thread }) => enqueue(thread.id, async () => {
      const fresh = await bb.sdk.threads.get({
        threadId: thread.id
      });
      if (!isManageableThread(fresh)) return;
      const state = await readState(fresh);
      if (await consumeCompletedTurns(thread.id, state))
        await evaluate(thread.id);
      else await saveState(thread.id, state);
    })
  );
  bb.events.on(
    "thread.failed",
    ({ thread }) => enqueue(thread.id, async () => {
      const fresh = await bb.sdk.threads.get({
        threadId: thread.id
      });
      const state = await readState(fresh);
      if (!state.hasAppliedSection && isManageableThread(fresh))
        await moveToPhase(fresh, state, "inbox", false);
    })
  );
  const forget = (threadId) => enqueue(threadId, async () => {
    const thread = await bb.sdk.threads.get({ threadId }).catch(() => null);
    const state = thread ? await readState(thread) : null;
    if (thread && state?.hasAppliedSection && thread.sectionId === state.lastAppliedSectionId) {
      await bb.sdk.threads.update({ threadId, sectionId: null }).catch(() => void 0);
    }
    await bb.storage.kv.delete(stateKey(threadId));
    await cleanupEmptyOwnedSections();
  });
  bb.events.on("thread.archived", ({ thread }) => forget(thread.id));
  bb.events.on("thread.deleted", ({ thread }) => forget(thread.id));
  bb.cli.register({
    name: "organizer",
    summary: "Move the current bb thread through development phases",
    commands: [
      {
        name: "phase",
        summary: "Move the current thread to a phase",
        usage: "bb organizer phase <planning|spec-review|building|handoff|testing-deploy|inbox>"
      }
    ],
    async run(argv, context) {
      if (argv[0] !== "phase" || !argv[1])
        return {
          exitCode: 2,
          stderr: "Usage: bb organizer phase <planning|spec-review|building|handoff|testing-deploy|inbox>\n"
        };
      const target = parsePhaseTarget(argv[1]);
      if (!target)
        return { exitCode: 2, stderr: `Unknown phase: ${argv[1]}
` };
      if (!context.threadId)
        return {
          exitCode: 2,
          stderr: "Run inside a bb thread so BB_THREAD_ID is available.\n"
        };
      const thread = await bb.sdk.threads.get({
        threadId: context.threadId
      });
      if (!isManageableThread(thread))
        return { exitCode: 2, stderr: "This thread cannot be organized.\n" };
      const state = await readState(thread);
      await moveToPhase(thread, state, target, true);
      return {
        exitCode: 0,
        stdout: `Moved ${thread.id} to ${PHASE_SECTION_NAMES[target]}.
`
      };
    }
  });
  bb.agents.configure(() => ({
    tools: [],
    skills: ["thread-phase-organizer"]
  }));
  bb.background.service("phase-reconciliation", {
    async start(signal) {
      while (!signal.aborted) {
        await reconcileExisting(signal);
        if (!signal.aborted)
          await abortableDelay(RECONCILIATION_INTERVAL_MS, signal);
      }
    }
  });
  bb.onDispose(async () => {
    disposed = true;
    await Promise.allSettled([...queues.values()]);
  });
  void settings.get().then(
    ({ inboxMode }) => bb.log.info(`Thread Organizer loaded mode=${inboxMode}`)
  );
}
export {
  plugin as default
};
//# sourceMappingURL=server.js.map
