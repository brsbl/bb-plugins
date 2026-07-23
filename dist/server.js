import { createRequire as __createRequire } from "node:module";
import { dirname as __pathDirname } from "node:path";
import { fileURLToPath as __fileURLToPath } from "node:url";
const require = __createRequire(import.meta.url);
var __filename = __fileURLToPath(import.meta.url);
var __dirname = __pathDirname(__filename);

// core.ts
var SECTION_ALIASES = {
  bb: ["bb", "bb quick fixes"],
  design: ["design"],
  extensions: ["extensions"],
  writing: ["writing"]
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
  "root cause this",
  "sounds good",
  "yes"
]);
var ACTION_PATTERNS = [
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
  { expression: /^fix\b/i, title: "Fix" }
];
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
  "ux"
]);
function normalize(value) {
  return value.normalize("NFKC").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").trim().toLowerCase();
}
function matches(value, expression) {
  expression.lastIndex = 0;
  return expression.test(value);
}
function isSubstantiveText(value) {
  const normalized = normalize(value).replace(/^\/[a-z0-9:_-]+\s*/i, "").replace(/[.!?]+$/g, "").trim();
  if (normalized.length < 4 || LOW_INFORMATION.has(normalized)) return false;
  return !/^(?:https?:\/\/\S+|@[a-z0-9:_-]+)$/i.test(normalized);
}
function isEligibleThread(thread) {
  return thread.visibility === "visible" && thread.parentThreadId === null && thread.sourceThreadId === null && thread.originKind === null && thread.childOrigin === null && thread.originPluginId === null && thread.archivedAt === null && thread.deletedAt === null && thread.status !== "error" && thread.status !== "stopping";
}
function setScore(scores, target, confidence, reason) {
  const current = scores.get(target);
  if (current === void 0 || confidence > current.confidence) {
    scores.set(target, { confidence, reasons: [reason] });
    return;
  }
  if (confidence === current.confidence && !current.reasons.includes(reason)) {
    current.reasons.push(reason);
  }
}
function classifySection(input) {
  const project = normalize(input.projectName);
  const substantive = input.texts.filter(isSubstantiveText).map(normalize);
  const corpus = substantive.join("\n");
  const scores = /* @__PURE__ */ new Map();
  if (matches(
    corpus,
    /\b(blog(?:\s+post)?|article|essay|positioning|product copy|website copy|editorial)\b/i
  )) {
    setScore(scores, "writing", 0.96, "explicit editorial intent");
  }
  if (project === "ui pattern atlas" || matches(
    corpus,
    /\b(design system|ui patterns?|information architecture|interaction model|product direction|api surface|figma)\b|design\s*[↔<>-]\s*code/i
  )) {
    setScore(
      scores,
      "design",
      project === "ui pattern atlas" ? 0.97 : 0.95,
      project === "ui pattern atlas" ? "design project identity" : "durable design-system intent"
    );
  }
  if (["bb plugins", "prompt shaper"].includes(project) || project !== "bb" && matches(
    corpus,
    /\b(bb\s+plugin|plugin|skill|automation|agent tool|agent tooling)\b/i
  )) {
    setScore(
      scores,
      "extensions",
      project === "bb plugins" || project === "prompt shaper" ? 0.98 : 0.96,
      project === "bb plugins" || project === "prompt shaper" ? "extension project identity" : "explicit extension intent"
    );
  } else if (project === "design doctrine") {
    setScore(scores, "extensions", 0.9, "extension project identity");
  }
  if (project === "bb") {
    setScore(scores, "bb", 0.9, "bb project identity");
    if (matches(
      corpus,
      /\b(fix|debug|investigate|implement|build|review|refactor|test|ci|server|daemon|sync|branch|pull request|pr\s*#?\d+|issue\s*#?\d+)\b/i
    )) {
      setScore(scores, "bb", 0.96, "bb engineering intent");
    }
  }
  const ranked = [...scores.entries()].map(([target, value]) => ({ target, ...value })).sort(
    (left, right) => right.confidence - left.confidence || left.target.localeCompare(right.target)
  );
  const winner = ranked[0];
  if (winner === void 0) return null;
  const runnerUp = ranked[1] ?? null;
  return {
    confidence: winner.confidence,
    margin: winner.confidence - (runnerUp?.confidence ?? 0),
    reasons: winner.reasons,
    runnerUp: runnerUp?.target ?? null,
    target: winner.target
  };
}
function resolveSectionId(sections, target) {
  const aliases = new Set(SECTION_ALIASES[target]);
  const matches2 = sections.filter(
    (section) => aliases.has(normalize(section.name))
  );
  return matches2.length === 1 ? matches2[0].id : null;
}
function stripPromptPreamble(value) {
  let result = value.normalize("NFKC").replace(/\r\n?/g, "\n").replace(/^\s*(?:[-*]|\d+[.)])\s+/, "").replace(/^\/[a-z0-9:_-]+\s+/i, "").trim();
  const preambles = [
    /^(?:can|could|would)\s+you\s+/i,
    /^can\s+i\s+/i,
    /^please\s+/i,
    /^i\s+(?:want|need)\s+to\s+/i,
    /^i(?:'d| would)\s+like\s+to\s+/i,
    /^help\s+me\s+(?:to\s+)?/i,
    /^let(?:'s| us)\s+/i
  ];
  for (const preamble of preambles) result = result.replace(preamble, "");
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
  if (prompt.length === 0 || /^(?:https?:\/\/|@)/i.test(prompt) || !isSubstantiveText(prompt)) {
    return null;
  }
  const action = ACTION_PATTERNS.find(
    ({ expression }) => matches(prompt, expression)
  );
  if (action === void 0) return null;
  prompt = prompt.replace(action.expression, "").trim();
  prompt = prompt.split(/\b(?:so that|because|and then|then|which|that)\b|[\n.!?;:]/i, 1)[0].replace(/^[\s"'`([{]+|[\s"'`\])}]+$/g, "").trim();
  const words = prompt.match(/[A-Za-z0-9][A-Za-z0-9+#./↔<>-]*/g)?.filter(Boolean) ?? [];
  while (words.length > 0 && /^(?:a|an|my|our|the|this|these|those)$/i.test(words[0])) {
    words.shift();
  }
  const actionWordCount = action.title.split(/\s+/).length;
  const objectWords = words.slice(0, Math.max(1, 5 - actionWordCount));
  while (objectWords.length > 0 && TITLE_CONNECTORS.has(objectWords.at(-1).toLowerCase())) {
    objectWords.pop();
  }
  const specificWords = objectWords.filter((word) => {
    const normalized = word.toLowerCase();
    return !GENERIC_TITLE_WORDS.has(normalized) && !TITLE_CONNECTORS.has(normalized) && normalized.length > 1;
  });
  if (objectWords.length === 0 || specificWords.length === 0) return null;
  const objectTitle = objectWords.map((word, index) => displayTitleWord(word, index + actionWordCount)).join(" ");
  return {
    confidence: 0.92,
    title: `${action.title} ${objectTitle}`.trim()
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
var PERSONAL_PROJECT_ID = "proj_personal";
var NEW_SECTION_CONFIDENCE = 0.85;
var NEW_SECTION_MARGIN = 0.2;
var MOVE_SECTION_CONFIDENCE = 0.92;
var MOVE_SECTION_MARGIN = 0.25;
var TITLE_CONFIDENCE = 0.9;
var MAX_COMPLETED_EVENT_DRAIN = 100;
function stateKey(threadId) {
  return `${STATE_PREFIX}${threadId}`;
}
function initialState(thread) {
  return {
    completedTurns: 0,
    createdAt: thread.createdAt,
    hasAppliedSection: false,
    hasAppliedTitle: false,
    inboxPinned: false,
    lastAppliedSectionId: null,
    lastAppliedTitle: null,
    lastCompletedSeq: 0,
    nextEvaluationTurn: 1,
    pendingSectionId: null,
    pendingSectionStreak: 0,
    sectionLocked: thread.sectionId !== null,
    titleLocked: thread.title !== null,
    version: 1
  };
}
function isThreadState(value) {
  if (typeof value !== "object" || value === null) return false;
  const state = value;
  return state.version === 1 && typeof state.completedTurns === "number" && typeof state.createdAt === "number" && typeof state.hasAppliedSection === "boolean" && typeof state.hasAppliedTitle === "boolean" && (typeof state.inboxPinned === "boolean" || state.inboxPinned === void 0) && (typeof state.lastAppliedSectionId === "string" || state.lastAppliedSectionId === null) && (typeof state.lastAppliedTitle === "string" || state.lastAppliedTitle === null) && typeof state.lastCompletedSeq === "number" && typeof state.nextEvaluationTurn === "number" && (typeof state.pendingSectionId === "string" || state.pendingSectionId === null) && typeof state.pendingSectionStreak === "number" && typeof state.sectionLocked === "boolean" && typeof state.titleLocked === "boolean";
}
function normalizeThreadState(state) {
  return {
    ...state,
    inboxPinned: state.inboxPinned ?? false
  };
}
function syncManualLocks(state, thread) {
  let changed = false;
  if (!state.titleLocked) {
    const externalTitle = state.hasAppliedTitle ? thread.title !== state.lastAppliedTitle : thread.title !== null;
    if (externalTitle) {
      state.titleLocked = true;
      changed = true;
    }
  }
  if (!state.sectionLocked) {
    const externalSection = state.hasAppliedSection ? thread.sectionId !== state.lastAppliedSectionId : thread.sectionId !== null;
    if (externalSection) {
      state.sectionLocked = true;
      changed = true;
    }
  }
  return changed;
}
function promptTexts(history) {
  return [...history].sort((left, right) => left.createdAt - right.createdAt).flatMap(
    (entry) => entry.input.flatMap(
      (item) => item.type === "text" && item.visibility !== "agent-only" ? [item.text] : []
    )
  );
}
function mostRecentSubstantiveText(texts) {
  for (let index = texts.length - 1; index >= 0; index -= 1) {
    const text = texts[index];
    if (isSubstantiveText(text)) return text;
  }
  return null;
}
function classificationSummary(decision) {
  return [
    `target=${decision.target}`,
    `confidence=${decision.confidence.toFixed(2)}`,
    `margin=${decision.margin.toFixed(2)}`,
    `reason=${decision.reasons.join(",")}`
  ].join(" ");
}
function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
function plugin(bb) {
  const settings = bb.settings.define({
    mode: {
      type: "select",
      label: "Mode",
      description: "Observe logs recommendations without changing threads. Apply enables high-confidence updates.",
      options: ["observe", "apply"],
      default: "observe"
    }
  });
  const queues = /* @__PURE__ */ new Map();
  let disposed = false;
  async function readState(threadId) {
    const stored = await bb.storage.kv.get(stateKey(threadId));
    if (stored === void 0) return null;
    if (isThreadState(stored)) return normalizeThreadState(stored);
    bb.log.warn(`thread=${threadId} action=ignore-invalid-state`);
    return null;
  }
  async function saveState(threadId, state) {
    await bb.storage.kv.set(stateKey(threadId), state);
  }
  function enqueue(threadId, work) {
    const previous = queues.get(threadId) ?? Promise.resolve();
    const current = previous.catch(() => void 0).then(async () => {
      if (!disposed) await work();
    }).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      bb.log.error(`thread=${threadId} action=queue-failed error=${message}`);
    }).finally(() => {
      if (queues.get(threadId) === current) queues.delete(threadId);
    });
    queues.set(threadId, current);
    return current;
  }
  async function loadContextTexts(thread, attempts) {
    let loaded = [];
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        loaded = promptTexts(
          await bb.sdk.threads.promptHistory({
            threadId: thread.id,
            limit: "6"
          })
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        bb.log.debug(
          `thread=${thread.id} action=prompt-history-unavailable attempt=${attempt + 1} error=${message}`
        );
      }
      if (loaded.some(isSubstantiveText) || attempt === attempts - 1) break;
      await delay(attempt === 0 ? 150 : 600);
    }
    return loaded;
  }
  async function reconcileInbox(threadId, state, phase) {
    const { mode } = await settings.get();
    const thread = await bb.sdk.threads.get({ threadId });
    const shouldBeInInbox = phase !== "active";
    if (shouldBeInInbox) {
      if (thread.pinnedAt !== null) return;
      if (mode !== "apply") {
        bb.log.info(
          `thread=${threadId} phase=${phase} mode=observe action=propose-inbox-pin`
        );
        return;
      }
      await bb.sdk.threads.pin({ threadId });
      state.inboxPinned = true;
      bb.log.info(
        `thread=${threadId} phase=${phase} mode=apply action=inbox-pinned`
      );
      return;
    }
    if (!state.inboxPinned) return;
    if (thread.pinnedAt === null) {
      state.inboxPinned = false;
      return;
    }
    if (mode !== "apply") {
      bb.log.info(
        `thread=${threadId} phase=${phase} mode=observe action=propose-inbox-unpin`
      );
      return;
    }
    await bb.sdk.threads.unpin({ threadId });
    state.inboxPinned = false;
    bb.log.info(
      `thread=${threadId} phase=${phase} mode=apply action=inbox-unpinned`
    );
  }
  async function applySection(thread, state, phase, decision, targetSectionId, mode) {
    if (state.sectionLocked) return;
    const movingManagedSection = thread.sectionId !== null;
    if (movingManagedSection && (!state.hasAppliedSection || phase !== "turn")) {
      return;
    }
    const minimumConfidence = movingManagedSection ? MOVE_SECTION_CONFIDENCE : NEW_SECTION_CONFIDENCE;
    const minimumMargin = movingManagedSection ? MOVE_SECTION_MARGIN : NEW_SECTION_MARGIN;
    if (decision.confidence < minimumConfidence || decision.margin < minimumMargin) {
      state.pendingSectionId = null;
      state.pendingSectionStreak = 0;
      return;
    }
    if (thread.sectionId === targetSectionId) {
      state.pendingSectionId = null;
      state.pendingSectionStreak = 0;
      return;
    }
    if (movingManagedSection) {
      if (state.pendingSectionId === targetSectionId) {
        state.pendingSectionStreak += 1;
      } else {
        state.pendingSectionId = targetSectionId;
        state.pendingSectionStreak = 1;
      }
      if (state.pendingSectionStreak < 2) return;
    }
    if (mode !== "apply") {
      bb.log.info(
        `thread=${thread.id} phase=${phase} mode=observe action=propose-section ${classificationSummary(decision)}`
      );
      return;
    }
    const fresh = await bb.sdk.threads.get({
      threadId: thread.id
    });
    syncManualLocks(state, fresh);
    if (state.sectionLocked || !isEligibleThread(fresh) || fresh.sectionId !== thread.sectionId) {
      return;
    }
    const updated = await bb.sdk.threads.update({
      threadId: thread.id,
      sectionId: targetSectionId
    });
    state.hasAppliedSection = true;
    state.lastAppliedSectionId = updated.sectionId;
    state.pendingSectionId = null;
    state.pendingSectionStreak = 0;
    bb.log.info(
      `thread=${thread.id} phase=${phase} mode=apply action=section-updated ${classificationSummary(decision)}`
    );
  }
  async function applyTitle(thread, state, phase, texts, mode) {
    if (phase !== "turn" || state.titleLocked || thread.title !== null) return;
    const source = texts.find(isSubstantiveText) ?? thread.titleFallback ?? void 0;
    if (source === void 0) return;
    const candidate = deriveTaskTitle(source);
    if (candidate === null || candidate.confidence < TITLE_CONFIDENCE) return;
    if (mode !== "apply") {
      bb.log.info(
        `thread=${thread.id} phase=${phase} mode=observe action=propose-title confidence=${candidate.confidence.toFixed(2)} title=${JSON.stringify(candidate.title)}`
      );
      return;
    }
    const fresh = await bb.sdk.threads.get({
      threadId: thread.id
    });
    syncManualLocks(state, fresh);
    if (state.titleLocked || !isEligibleThread(fresh) || fresh.title !== null) {
      return;
    }
    const updated = await bb.sdk.threads.update({
      threadId: thread.id,
      title: candidate.title
    });
    state.hasAppliedTitle = true;
    state.lastAppliedTitle = updated.title;
    bb.log.info(
      `thread=${thread.id} phase=${phase} mode=apply action=title-updated confidence=${candidate.confidence.toFixed(2)} title=${JSON.stringify(candidate.title)}`
    );
  }
  async function evaluate(threadId, phase) {
    const state = await readState(threadId);
    if (state === null) return;
    const thread = await bb.sdk.threads.get({ threadId });
    const locksChanged = syncManualLocks(state, thread);
    if (locksChanged) {
      bb.log.info(
        `thread=${threadId} action=manual-lock title=${state.titleLocked} section=${state.sectionLocked}`
      );
    }
    if (thread.archivedAt !== null || thread.deletedAt !== null) {
      await bb.storage.kv.delete(stateKey(threadId));
      return;
    }
    if (!isEligibleThread(thread)) {
      await saveState(threadId, state);
      return;
    }
    const attempts = phase === "active" ? 3 : 1;
    const historyTexts = await loadContextTexts(thread, attempts);
    const texts = [
      ...thread.title === null ? [] : [thread.title],
      ...thread.titleFallback === null ? [] : [thread.titleFallback],
      ...historyTexts
    ];
    const latestPromptText = mostRecentSubstantiveText(historyTexts);
    const sectionTexts = phase === "turn" && state.hasAppliedSection && thread.sectionId !== null ? latestPromptText === null ? [] : [latestPromptText] : texts;
    const { mode } = await settings.get();
    const movingManagedSection = state.hasAppliedSection && thread.sectionId !== null;
    if (!state.sectionLocked && (!movingManagedSection || phase === "turn")) {
      try {
        const projectName = thread.projectId === PERSONAL_PROJECT_ID ? "Personal" : (await bb.sdk.projects.get({
          projectId: thread.projectId
        })).name;
        const decision = classifySection({
          projectName,
          texts: sectionTexts
        });
        if (decision !== null) {
          const sectionId = resolveSectionId(
            await bb.sdk.threadSections.list(),
            decision.target
          );
          if (sectionId === null) {
            bb.log.warn(
              `thread=${threadId} phase=${phase} action=section-unavailable target=${decision.target}`
            );
          } else {
            await applySection(
              thread,
              state,
              phase,
              decision,
              sectionId,
              mode
            );
          }
        } else {
          state.pendingSectionId = null;
          state.pendingSectionStreak = 0;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        bb.log.warn(
          `thread=${threadId} phase=${phase} action=section-evaluation-failed error=${message}`
        );
      }
    }
    try {
      await applyTitle(thread, state, phase, historyTexts, mode);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      bb.log.warn(
        `thread=${threadId} phase=${phase} action=title-evaluation-failed error=${message}`
      );
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
        ...state.lastCompletedSeq === 0 ? {} : { afterSeq: String(state.lastCompletedSeq) }
      });
      if (event === null) break;
      state.lastCompletedSeq = event.seq;
      if (event.type === "turn/completed" && event.data.status === "completed") {
        state.completedTurns += 1;
      }
      drained += 1;
    }
    if (drained === MAX_COMPLETED_EVENT_DRAIN) {
      bb.log.warn(
        `thread=${threadId} action=turn-drain-capped limit=${MAX_COMPLETED_EVENT_DRAIN}`
      );
    }
  }
  bb.events.on(
    "thread.created",
    ({ thread }) => enqueue(thread.id, async () => {
      if (!isEligibleThread(thread)) return;
      if (await readState(thread.id) !== null) return;
      await saveState(thread.id, initialState(thread));
      await evaluate(thread.id, "created");
    })
  );
  bb.events.on(
    "thread.active",
    ({ thread }) => enqueue(thread.id, async () => {
      const state = await readState(thread.id);
      if (state === null) return;
      await reconcileInbox(thread.id, state, "active");
      await saveState(thread.id, state);
      await evaluate(thread.id, "active");
    })
  );
  bb.events.on(
    "thread.idle",
    ({ thread }) => enqueue(thread.id, async () => {
      const state = await readState(thread.id);
      if (state === null) return;
      try {
        await consumeCompletedTurns(thread.id, state);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        bb.log.warn(
          `thread=${thread.id} action=turn-count-failed error=${message}`
        );
      }
      const due = state.completedTurns >= state.nextEvaluationTurn;
      if (due) {
        state.nextEvaluationTurn = advanceEvaluationMilestone(
          state.nextEvaluationTurn,
          state.completedTurns
        );
      }
      await reconcileInbox(thread.id, state, "idle");
      await saveState(thread.id, state);
      if (due) await evaluate(thread.id, "turn");
    })
  );
  bb.events.on(
    "thread.failed",
    ({ thread }) => enqueue(thread.id, async () => {
      const state = await readState(thread.id);
      if (state === null) return;
      await reconcileInbox(thread.id, state, "failed");
      await saveState(thread.id, state);
    })
  );
  const forget = (threadId) => enqueue(threadId, async () => {
    await bb.storage.kv.delete(stateKey(threadId));
  });
  bb.events.on("thread.archived", ({ thread }) => forget(thread.id));
  bb.events.on("thread.deleted", ({ thread }) => forget(thread.id));
  settings.onChange((next, previous) => {
    if (next.mode === previous.mode) return;
    bb.log.info(`action=mode-changed previous=${previous.mode} next=${next.mode}`);
    if (next.mode !== "apply") return;
    void bb.storage.kv.list(STATE_PREFIX).then(
      (keys) => Promise.all(
        keys.map(
          (key) => enqueue(
            key.slice(STATE_PREFIX.length),
            () => evaluate(key.slice(STATE_PREFIX.length), "settings")
          )
        )
      )
    ).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      bb.log.error(`action=apply-mode-evaluation-failed error=${message}`);
    });
  });
  bb.onDispose(() => {
    disposed = true;
  });
  void settings.get().then(({ mode }) => bb.log.info(`Thread Organizer loaded mode=${mode}`)).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    bb.log.warn(`action=mode-read-failed error=${message}`);
  });
}
export {
  plugin as default
};
//# sourceMappingURL=server.js.map
