import {
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { DRIVE_KEYS, driveFromKeys, IDLE_DRIVE } from "./controls";
import type { TurnCost } from "./contract";
import { diameterMillimetres, fillForRadius, formatTokens } from "./katamari-math";
import { KatamariAudio } from "./sound";
import type { StageMode } from "./stage";
import { type HudSnapshot, KatamariWorld, type WorldEvent } from "./engine/world";
import { clampLayout, defaultLayout, type PaneBounds, parseLayout, type WindowLayout } from "./window-layout";

export interface KatamariStage {
  threadId: string | null;
  mode: StageMode;
  fill: number;
  /** Null until the thread's compaction count has been read. */
  compactions: number | null;
  /** The newest compaction bb announced while the window was open; each new one pops the ball. */
  compactedSeq: number | null;
  ready: boolean;
  title: string | null;
  usedTokens: number | null;
  capacityTokens: number | null;
  /** The thread's most recent turns, newest first. */
  turns: readonly TurnCost[];
}

interface KatamariWindowProps {
  stage: KatamariStage;
  muted: boolean;
  onMutedChange(muted: boolean): void;
  onClose(): void;
}

// Older versions saved only the position here; a saved size now rides along.
const LAYOUT_KEY = "context-katamari:position";
const GUIDE_SEEN_KEY = "context-katamari:guide-seen";

// The royal commentary, in the game's grand and slightly absurd voice.
const LINES = {
  enter: ["Roll, Prince, roll!", "Ah, this thread. We remember it.", "A fresh cousin arrives!"],
  rolling: ["Work, work! Roll, roll!", "Onward! Everything sticks eventually."],
  resting: ["The thread rests. So shall We.", "A little break. Very royal."],
  waiting: ["We shall wait right here.", "Off elsewhere? We keep the katamari warm."],
  compacted: ["Lighter, and wiser.", "Everything that mattered stuck.", "A fresh start, with a new star."],
  sprinkle: ["We sprinkle some snacks. Roll them up!"],
  full: ["It is ENORMOUS. Compaction beckons."],
  knockedOff: ["Oh! Things fell off. Careful, Prince."],
} as const;

/** Share of the context window one swallow takes before it counts as a bite, a gulp, or HEAVY. */
const GULP_TIERS = [
  { tier: "nibble", below: 0.005 },
  { tier: "bite", below: 0.02 },
  { tier: "gulp", below: 0.05 },
  { tier: "heavy", below: Number.POSITIVE_INFINITY },
] as const;

type GulpTier = (typeof GULP_TIERS)[number]["tier"];

function gulpTier(share: number): GulpTier {
  return (GULP_TIERS.find((entry) => share < entry.below) ?? GULP_TIERS[3]).tier;
}

function clip(text: string, length: number): string {
  return text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text;
}

/** The King's verdict on a finished turn: what the prompt cost the context. */
function receipt(turn: TurnCost, capacity: number | null): string {
  const quote = turn.prompt ? `"${clip(turn.prompt, 34)}"` : "That turn";
  if (turn.contextTokens < 0) return `${quote} ended lighter, thanks to a compaction.`;
  const grew = formatTokens(turn.contextTokens);
  if (turn.baseline) {
    return `A thread starts heavy: bb's system prompt and tools came first. ${quote} began at ${grew}.`;
  }
  switch (gulpTier(capacity ? turn.contextTokens / capacity : 0)) {
    case "heavy":
      return `A HEAVY one! ${quote} swallowed ${grew}.`;
    case "nibble":
      return `A light snack: ${quote} took just ${grew}.`;
    default:
      return `${quote} swallowed ${grew}.`;
  }
}

function line(options: readonly string[]): string {
  return options[Math.floor(Math.random() * options.length)];
}

function viewport() {
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * bb has no stable hook for the thread pane, so find it from the composer:
 * the first ancestor tall enough to be the whole pane.
 */
/**
 * The conversation column: the widest ancestor of the prompt box before the
 * width jumps out to the whole main area around it.
 */
function findThreadPane(): PaneBounds | null {
  let element = document.querySelector("[data-promptbox-editor-content]")?.parentElement ?? null;
  if (!element) return null;
  const composerWidth = element.getBoundingClientRect().width;
  let pane: PaneBounds | null = null;
  while (element && element !== document.body) {
    const bounds = element.getBoundingClientRect();
    if (bounds.width > composerWidth + 64) break;
    pane = { left: bounds.left, right: bounds.right };
    element = element.parentElement;
  }
  return pane;
}

function readSavedLayout(): WindowLayout | null {
  try {
    const saved = parseLayout(JSON.parse(window.localStorage.getItem(LAYOUT_KEY) ?? "null"));
    return saved ? clampLayout(saved, viewport()) : null;
  } catch {
    return null;
  }
}

function saveLayout(layout: WindowLayout) {
  try {
    window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
  } catch {
    // The layout simply resets next time.
  }
}

/** The game's size readout: big numbers with small units, "11cm7mm" or "4m84cm". */
function SizeText({ radius }: { radius: number }) {
  const total = Math.round(diameterMillimetres(radius));
  const metres = Math.floor(total / 1000);
  const centimetres = Math.floor((total % 1000) / 10);
  const millimetres = total % 10;
  return (
    <span className="ck-size-text">
      {metres > 0 ? (
        <>
          {metres}
          <small>m</small>
          {centimetres}
          <small>cm</small>
        </>
      ) : centimetres === 0 ? (
        <>
          {millimetres}
          <small>mm</small>
        </>
      ) : (
        <>
          {centimetres}
          <small>cm</small>
          {millimetres}
          <small>mm</small>
        </>
      )}
    </span>
  );
}

const PETAL_RINGS = ["#ff3d7f", "#ffe14d", "#2fd35a", "#2f8cff", "#ff8a1d", "#c23bff"];

/** The rainbow flower gauge in the top-left corner, with the katamari at its heart. */
function FlowerGauge({ fill }: { fill: number }) {
  const rings = PETAL_RINGS.map((color, ring) => {
    const radius = 46 - ring * 6.5;
    const petals = 18 - ring;
    const points: string[] = [];
    for (let step = 0; step <= petals * 8; step += 1) {
      const angle = (step / (petals * 8)) * Math.PI * 2;
      const wobble = 1 + 0.08 * Math.cos(angle * petals);
      points.push(`${50 + Math.cos(angle) * radius * wobble},${50 + Math.sin(angle) * radius * wobble}`);
    }
    return <polygon key={color} points={points.join(" ")} fill={color} />;
  });
  const core = 8 + fill * 12;
  return (
    <svg className="ck-flower" viewBox="0 0 100 100" aria-hidden="true">
      {rings}
      <circle cx="50" cy="50" r="13" fill="#6b3ac8" />
      <circle cx="50" cy="50" r={core} fill="#f7f5ea" opacity="0.92" />
      <circle cx="50" cy="50" r={core * 0.45} fill="#e8453c" opacity="0.85" />
    </svg>
  );
}

/** The time-limit clock, standing in for how much context is left before compaction. */
function Clock({ percentLeft }: { percentLeft: number }) {
  const urgent = percentLeft <= 15;
  const angle = (1 - percentLeft / 100) * 360;
  return (
    <div className="ck-clock" data-urgent={urgent} aria-label={`${percentLeft}% of context left`}>
      <span className="ck-clock-number">
        {percentLeft}
        <small>%</small>
      </span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" className="ck-clock-face" />
        <line x1="12" y1="12" x2="12" y2="4" className="ck-clock-hand" transform={`rotate(${angle} 12 12)`} />
        {urgent ? <text x="12" y="17" textAnchor="middle" className="ck-clock-bang">!</text> : null}
      </svg>
    </div>
  );
}

/** The Prince standing on the Earth, bottom right, glowing while he rolls. */
function PrinceOnEarth({ mode, compactions }: { mode: StageMode; compactions: number }) {
  return (
    <div className="ck-prince-earth" data-mode={mode} aria-hidden="true">
      <svg viewBox="0 0 80 80">
        <defs>
          <radialGradient id="ck-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle className="ck-prince-glow" cx="40" cy="42" r="30" fill="url(#ck-glow)" />
        <circle cx="86" cy="96" r="48" fill="#2f6fd6" />
        <path d="M44 72 q10 -6 20 0 t20 0 M52 82 q10 -6 20 0 t20 0" stroke="#bfe3ff" strokeWidth="2.5" fill="none" />
        <path d="M60 58 q8 -4 12 4 q-6 6 -12 -4z" fill="#3fae4a" />
        <g className="ck-prince-figure">
          <rect x="22" y="22" width="30" height="13" rx="6.5" fill="#7cc242" />
          <rect x="24" y="22" width="4" height="13" fill="#b4dd72" />
          <rect x="46" y="22" width="4" height="13" fill="#b4dd72" />
          <rect x="31" y="23.5" width="12" height="10" fill="#f5d94a" />
          <rect x="32.5" y="25" width="9" height="7" fill="#f2dcc0" />
          <circle cx="35" cy="27.5" r="0.9" fill="#2b2233" />
          <circle cx="39" cy="27.5" r="0.9" fill="#2b2233" />
          <circle cx="37" cy="30.3" r="1" fill="#d8342f" />
          <path d="M37 16 l2 6 h-4z" fill="#f5d94a" />
          <circle cx="37" cy="15" r="1.8" fill="#e0312b" />
          <path d="M30 35 h14 l3 13 h-20z" fill="#7cc242" />
          <rect x="31" y="48" width="2.4" height="9" fill="#7a2a8c" />
          <rect x="40.6" y="48" width="2.4" height="9" fill="#7a2a8c" />
        </g>
      </svg>
      {mode === "resting" ? <span className="ck-prince-mark">z z</span> : null}
      {mode === "waiting" ? <span className="ck-prince-mark">?</span> : null}
      {compactions > 0 ? (
        <span className="ck-stars" title={`Compacted ${compactions} ${compactions === 1 ? "time" : "times"}`}>
          ✦{compactions >= 99 ? "99+" : compactions}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Recent turns as bars, oldest to newest: height is how much context each
 * swallowed, so a heavy prompt stands out next to a light one.
 */
function TurnStrip({ turns, capacity }: { turns: readonly TurnCost[]; capacity: number | null }) {
  if (turns.length === 0) return null;
  const ordered = [...turns].reverse();
  // The setup turn would dwarf every prompt after it, so it does not set the scale.
  const largest = Math.max(
    1,
    ...ordered.map((turn) => (turn.baseline ? 0 : Math.max(0, turn.contextTokens))),
  );
  return (
    <div className="ck-turns">
      <span className="ck-turn-bars" aria-label="Context each recent turn swallowed">
        {ordered.map((turn) => {
          const grown = Math.max(0, turn.contextTokens);
          const tier =
            turn.contextTokens < 0
              ? "compacted"
              : turn.baseline
                ? "setup"
                : gulpTier(capacity ? grown / capacity : 0);
          return (
            <span
              key={turn.turnId}
              className="ck-turn-bar"
              data-tier={tier}
              data-running={turn.status === "running"}
              style={{ height: `${Math.min(100, Math.max(12, Math.sqrt(grown / largest) * 100))}%` }}
              title={`${turn.prompt ?? "Turn"}\n${
                turn.contextTokens < 0
                  ? "Compacted"
                  : `Context +${formatTokens(grown)}${turn.baseline ? " (system prompt and tools included)" : ""}`
              }`}
            />
          );
        })}
      </span>
    </div>
  );
}

function guideSeen(): boolean {
  try {
    return window.localStorage.getItem(GUIDE_SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

/** What the cousin and the world do, and what each one says about the thread. */
const GUIDE_EVENTS = [
  ["🏃", "Rolling on his own", "the thread is working"],
  ["🧍", "Standing still", "idle, or waiting for you"],
  ["💥", "GULP and a shake", "one turn swallowed a lot"],
  ["🪙", "Coin trail", "past 50k, every turn re-reads it all"],
  ["🎈", "POP, the ball shrinks", "the thread compacted"],
  ["💫", "Dizzy cousin", "woozier with each compaction"],
] as const;

/**
 * The help screen, in two pages the way a game's tutorial runs: labels over
 * each part of the HUD, then what the cousin's antics mean.
 */
function Guide({ onClose }: { onClose(): void }) {
  const [page, setPage] = useState<"hud" | "events">("hud");
  const nav = (
    <div className="ck-guide-actions">
      <button
        type="button"
        className="ck-guide-arrow"
        aria-label="Previous page"
        disabled={page === "hud"}
        onClick={() => setPage("hud")}
      >
        ‹
      </button>
      <span className="ck-guide-dots" aria-hidden="true">
        <span data-on={page === "hud"} />
        <span data-on={page === "events"} />
      </span>
      <button
        type="button"
        className="ck-guide-arrow"
        aria-label="Next page"
        disabled={page === "events"}
        onClick={() => setPage("events")}
      >
        ›
      </button>
      {page === "events" ? (
        <button type="button" className="ck-guide-close" onClick={onClose}>
          Got it
        </button>
      ) : null}
    </div>
  );
  return (
    <div className="ck-guide" data-page={page} role="dialog" aria-label="What everything means">
      {page === "hud" ? (
        <>
          <span className="ck-guide-label" data-spot="size">↑ Size · tokens used / max</span>
          <span className="ck-guide-label" data-spot="clock">↑ Context left</span>
          <span className="ck-guide-label" data-spot="turns">Each turn's context ↑</span>
          <span className="ck-guide-label" data-spot="item">← Last thing the ball picked up</span>
          <span className="ck-guide-label" data-spot="stars">Times compacted ↗</span>
          <div className="ck-guide-card">
            <p>The ball grows as this thread fills its context. At the limit, bb compacts it: POP!</p>
            <p className="ck-guide-keys">Click, then roll with the arrow keys.</p>
            {nav}
          </div>
        </>
      ) : (
        <div className="ck-guide-card" data-page="events">
          <ul className="ck-guide-events">
            {GUIDE_EVENTS.map(([icon, sight, meaning]) => (
              <li key={sight}>
                <span aria-hidden="true">{icon}</span>
                <span>
                  <b>{sight}</b> {meaning}
                </span>
              </li>
            ))}
          </ul>
          {nav}
        </div>
      )}
    </div>
  );
}

/** The King's lines type out a letter at a time, the way the game delivers them. */
function Typewriter({ text }: { text: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    const timer = window.setInterval(() => {
      setShown((count) => {
        if (count >= text.length) {
          window.clearInterval(timer);
          return count;
        }
        return count + 1;
      });
    }, 30);
    return () => window.clearInterval(timer);
  }, [text]);
  return <span aria-hidden="true">{text.slice(0, shown)}</span>;
}

export function KatamariWindow({
  stage,
  muted,
  onMutedChange,
  onClose,
}: KatamariWindowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<KatamariWorld | null>(null);
  const audioRef = useRef<KatamariAudio | null>(null);
  const pressedRef = useRef(new Set<string>());
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [speech, setSpeech] = useState<{ text: string; key: number; seconds: number } | null>(null);
  const [gulpLabel, setGulpLabel] = useState<{
    text: string;
    tier: GulpTier | "setup";
    key: number;
  } | null>(null);
  const [lastItem, setLastItem] = useState<{ name: string; image: string | null; key: number } | null>(null);
  const [lookOut, setLookOut] = useState(0);
  const [focused, setFocused] = useState(false);
  const [ready, setReady] = useState(false);
  // Shown once on first open; the ? button brings it back.
  const [guideOpen, setGuideOpen] = useState(() => !guideSeen());
  // Until the person moves or resizes the window, it keeps fitting beside the thread pane.
  const customizedRef = useRef(false);
  const [layout, setLayout] = useState<WindowLayout>(() => {
    const saved = readSavedLayout();
    customizedRef.current = saved !== null;
    return saved ?? defaultLayout(viewport(), findThreadPane());
  });
  const dragRef = useRef<{
    kind: "move" | "resize";
    pointerId: number;
    startX: number;
    startY: number;
    origin: WindowLayout;
  } | null>(null);
  const speechTimer = useRef(0);
  const lookOutTimer = useRef(0);

  const speechEnds = useRef(0);
  const queuedSpeechTimer = useRef(0);

  const say = useCallback((text: string) => {
    window.clearTimeout(speechTimer.current);
    // Long lines stay up long enough to finish typing and be read.
    const seconds = Math.max(3.8, text.length * 0.03 + 2.2);
    setSpeech({ text, key: Date.now(), seconds });
    speechEnds.current = Date.now() + seconds * 1000;
    speechTimer.current = window.setTimeout(() => setSpeech(null), seconds * 1000);
  }, []);

  /** Say a line once the King finishes the current one, instead of cutting him off. */
  const sayNext: (text: string) => void = useCallback(
    (text: string) => {
      const wait = speechEnds.current - Date.now();
      if (wait <= 0) {
        say(text);
        return;
      }
      window.clearTimeout(queuedSpeechTimer.current);
      // Check again when it is due, in case another line started meanwhile.
      queuedSpeechTimer.current = window.setTimeout(() => sayNext(text), wait + 300);
    },
    [say],
  );

  const onEvent = useCallback(
    (event: WorldEvent) => {
      switch (event.kind) {
        case "enter":
          say(line(LINES.enter));
          break;
        case "pickup":
          sayNext(event.fill >= 0.95 ? line(LINES.full) : `Splendid! ${Math.round(event.fill * 100)}% full.`);
          break;
        case "compacted":
          say(`POP! Compaction #${event.compactions}. ${line(LINES.compacted)}`);
          break;
        case "sprinkle":
          sayNext(line(LINES.sprinkle));
          break;
        case "rolledUp":
          setLastItem({ name: event.name, image: event.image, key: Date.now() });
          break;
        case "lookOut":
          window.clearTimeout(lookOutTimer.current);
          setLookOut(Date.now());
          lookOutTimer.current = window.setTimeout(() => setLookOut(0), 1800);
          break;
        case "knockedOff":
          say(line(LINES.knockedOff));
          break;
        case "coins":
          sayNext(`${formatTokens(event.usedTokens)} tokens! Every turn re-reads all of it. Coins, coins, coins!`);
          break;
      }
    },
    [say, sayNext],
  );
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const worldStage = {
    threadId: stage.threadId,
    mode: stage.mode,
    fill: stage.fill,
    compactions: stage.compactions,
    compactedSeq: stage.compactedSeq,
    ready: stage.ready,
    usedTokens: stage.usedTokens,
  };
  const worldStageRef = useRef(worldStage);
  worldStageRef.current = worldStage;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const audio = new KatamariAudio(muted);
    // Opening the window is itself a click, so audio may start right away.
    audio.unlock();
    audioRef.current = audio;
    let world: KatamariWorld | null = null;
    let observer: ResizeObserver | null = null;
    let timer = 0;
    let keyFrame = 0;
    const createWorld = () => {
      const created = new KatamariWorld(
        canvas,
        audio,
        (snapshot) => setHud(snapshot),
        (event) => onEventRef.current(event),
      );
      world = created;
      worldRef.current = created;
      const resize = () => {
        const bounds = canvas.getBoundingClientRect();
        created.resize(bounds.width, bounds.height, window.devicePixelRatio || 1);
      };
      resize();
      observer = new ResizeObserver(resize);
      observer.observe(canvas);
      created.setStage(worldStageRef.current);
      created.start();
      setReady(true);
      // Read the held arrow keys every frame.
      const pollKeys = () => {
        created.setDrive(driveFromKeys(pressedRef.current));
        keyFrame = window.requestAnimationFrame(pollKeys);
      };
      keyFrame = window.requestAnimationFrame(pollKeys);
    };
    // Let the window paint first; building the world takes a moment.
    const frame = window.requestAnimationFrame(() => {
      timer = window.setTimeout(createWorld, 0);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(keyFrame);
      window.clearTimeout(timer);
      observer?.disconnect();
      world?.dispose();
      audio.dispose();
      worldRef.current = null;
      audioRef.current = null;
      window.clearTimeout(speechTimer.current);
      window.clearTimeout(queuedSpeechTimer.current);
      window.clearTimeout(lookOutTimer.current);
    };
    // The world lives for the window's lifetime; stage and mute sync below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    worldRef.current?.setStage(worldStageRef.current);
  }, [
    stage.threadId,
    stage.mode,
    stage.fill,
    stage.compactions,
    stage.compactedSeq,
    stage.ready,
    stage.usedTokens,
  ]);

  // New context lands with a chomp: a nibble for a little, a screen-shaking gulp for a heavy turn.
  const lastUsage = useRef<{
    threadId: string | null;
    usedTokens: number | null;
    ready: boolean;
  }>({ threadId: null, usedTokens: null, ready: false });
  useEffect(() => {
    const previous = lastUsage.current;
    lastUsage.current = { threadId: stage.threadId, usedTokens: stage.usedTokens, ready: stage.ready };
    if (previous.threadId !== stage.threadId) return;
    // A thread we watched start with nothing measured: its first usage is the
    // system prompt and tools arriving, not history we opened onto. After a
    // compaction the usage also blanks briefly, and what returns is the summary.
    const setup = previous.usedTokens === null && previous.ready && (stage.compactions ?? 0) === 0;
    const before = setup ? 0 : previous.usedTokens;
    if (
      before === null ||
      stage.usedTokens === null ||
      stage.capacityTokens === null ||
      stage.usedTokens <= before
    ) {
      return;
    }
    const swallowed = stage.usedTokens - before;
    const share = swallowed / stage.capacityTokens;
    const tier = setup ? "setup" : gulpTier(share);
    worldRef.current?.gulp(share);
    setGulpLabel({
      text: setup
        ? `+${formatTokens(swallowed)} setup`
        : `${tier === "heavy" ? "GULP! " : ""}+${formatTokens(swallowed)}`,
      tier,
      key: Date.now(),
    });
  }, [stage.threadId, stage.usedTokens, stage.capacityTokens, stage.ready, stage.compactions]);

  // When a turn finishes, the King reads out what its prompt cost.
  const announcedTurns = useRef(new Map<string, string>());
  const latestSettled = stage.turns.find((turn) => turn.status !== "running") ?? null;
  useEffect(() => {
    if (stage.threadId === null || !stage.ready) return;
    const announced = announcedTurns.current;
    const seen = announced.get(stage.threadId);
    announced.set(stage.threadId, latestSettled?.turnId ?? "");
    // The first reading of a thread is history, not news.
    if (seen === undefined || latestSettled === null || seen === latestSettled.turnId) return;
    say(receipt(latestSettled, stage.capacityTokens));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [say, stage.threadId, stage.ready, latestSettled?.turnId]);

  const previousMode = useRef(stage.mode);
  useEffect(() => {
    if (previousMode.current === stage.mode) return;
    // The first thread gets an entrance line instead.
    const firstThread = previousMode.current === "empty";
    previousMode.current = stage.mode;
    if (firstThread) return;
    if (stage.mode === "rolling") say(line(LINES.rolling));
    if (stage.mode === "resting") say(line(LINES.resting));
    if (stage.mode === "waiting") say(line(LINES.waiting));
  }, [say, stage.mode]);

  useEffect(() => {
    audioRef.current?.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    const fit = () =>
      setLayout((current) =>
        // Refit from the saved layout so a window squeezed by a small viewport grows back.
        customizedRef.current
          ? (readSavedLayout() ?? clampLayout(current, viewport()))
          : defaultLayout(viewport(), findThreadPane()),
      );
    // The thread pane may render after the window does.
    const frame = window.requestAnimationFrame(fit);
    window.addEventListener("resize", fit);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", fit);
    };
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.currentTarget.blur();
      return;
    }
    if (!DRIVE_KEYS.has(event.key) || event.metaKey || event.ctrlKey || event.altKey) return;
    event.preventDefault();
    event.stopPropagation();
    pressedRef.current.add(event.key);
  };

  const onKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!DRIVE_KEYS.has(event.key)) return;
    event.preventDefault();
    pressedRef.current.delete(event.key);
  };

  const toggleGuide = (open: boolean) => {
    setGuideOpen(open);
    if (open) return;
    try {
      window.localStorage.setItem(GUIDE_SEEN_KEY, "true");
    } catch {
      // The guide simply shows again next time.
    }
  };

  const releaseKeys = () => {
    pressedRef.current.clear();
    worldRef.current?.setDrive(IDLE_DRIVE);
    setFocused(false);
  };

  const beginDrag = (kind: "move" | "resize") => (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      kind,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: layout,
    };
  };

  const continueDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    // The window is anchored bottom-right, so the top-left handle grows it up and left.
    setLayout(
      clampLayout(
        drag.kind === "move"
          ? { ...drag.origin, right: drag.origin.right - dx, bottom: drag.origin.bottom - dy }
          : { ...drag.origin, width: drag.origin.width - dx, height: drag.origin.height - dy },
        viewport(),
      ),
    );
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    customizedRef.current = true;
    setLayout((current) => {
      saveLayout(current);
      return current;
    });
  };

  const radius = hud?.radius ?? 0.3;
  const target = hud?.targetRadius ?? radius;
  const percentLeft = Math.max(0, Math.min(99, Math.round((1 - stage.fill) * 100)));
  const tokens =
    stage.usedTokens !== null && stage.capacityTokens !== null
      ? `${formatTokens(stage.usedTokens)} / ${formatTokens(stage.capacityTokens)}`
      : "—";

  return (
    <div
      className="ck-window"
      style={{ right: layout.right, bottom: layout.bottom, width: layout.width, height: layout.height }}
      data-mode={stage.mode}
      data-focused={focused}
      data-ready={ready}
      role="region"
      aria-label="Context Katamari"
    >
      <div
        className="ck-stage"
        tabIndex={0}
        aria-label="Katamari world. Click, then roll with the arrow keys. Escape to let go."
        onFocus={() => {
          setFocused(true);
          audioRef.current?.unlock();
        }}
        onBlur={releaseKeys}
        onPointerDown={() => audioRef.current?.unlock()}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
      >
        <canvas ref={canvasRef} className="ck-canvas" />

        <div className="ck-gauge" aria-label={`Katamari ${Math.round(fillForRadius(target) * 100)}% of context`}>
          <FlowerGauge fill={fillForRadius(radius)} />
          <SizeText radius={radius} />
          <span className="ck-goal">
            <svg viewBox="0 0 40 16" aria-hidden="true">
              <path d="M2 12 Q 20 2 36 8" />
              <path d="M31 4 l6 4 -7 2" />
            </svg>
            {tokens}
          </span>
        </div>

        <Clock percentLeft={percentLeft} />
        <TurnStrip turns={stage.turns} capacity={stage.capacityTokens} />

        {gulpLabel ? (
          <div
            key={gulpLabel.key}
            className="ck-gulp"
            data-tier={gulpLabel.tier}
            aria-hidden="true"
            onAnimationEnd={() => setGulpLabel(null)}
          >
            {gulpLabel.text}
          </div>
        ) : null}

        <div className="ck-title" title={stage.title ?? undefined}>
          {stage.title ?? "Open a thread"}
        </div>

        {speech ? (
          <div
            key={speech.key}
            className="ck-king"
            role="status"
            aria-label={speech.text}
            style={{ animationDuration: `${speech.seconds}s` }}
          >
            <span className="ck-king-face" aria-hidden="true">♛</span>
            <span className="ck-king-caption">
              <Typewriter text={speech.text} />
            </span>
          </div>
        ) : null}

        <div className="ck-item" data-look-out={lookOut !== 0}>
          {lookOut !== 0 ? <span className="ck-look-out">LOOK OUT!</span> : null}
          <div className="ck-item-disc">
            {lastItem?.image ? <img key={lastItem.key} src={lastItem.image} alt="" /> : null}
          </div>
          {lastItem ? <span key={lastItem.key} className="ck-item-name">{lastItem.name}</span> : null}
        </div>

        <PrinceOnEarth mode={stage.mode} compactions={hud?.compactions ?? stage.compactions ?? 0} />

        {guideOpen ? <Guide onClose={() => toggleGuide(false)} /> : null}

        <div className="ck-hint" aria-hidden="true">
          {focused
            ? "↑↓ roll · ←→ steer"
            : "Click, then use the arrow keys"}
        </div>
      </div>
      <div
        className="ck-grip"
        role="presentation"
        title="Drag to move"
        onPointerDown={beginDrag("move")}
        onPointerMove={continueDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span />
      </div>
      <div
        className="ck-resize"
        role="presentation"
        title="Drag to resize"
        onPointerDown={beginDrag("resize")}
        onPointerMove={continueDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
      <div className="ck-controls">
        <button
          type="button"
          className="ck-button"
          aria-label={guideOpen ? "Hide the guide" : "What everything means"}
          aria-pressed={guideOpen}
          title={guideOpen ? "Hide the guide" : "What everything means"}
          onClick={() => toggleGuide(!guideOpen)}
        >
          <span className="ck-button-glyph" aria-hidden="true">?</span>
        </button>
        <button
          type="button"
          className="ck-button"
          aria-label={muted ? "Unmute" : "Mute"}
          aria-pressed={muted}
          title={muted ? "Unmute" : "Mute"}
          onClick={() => onMutedChange(!muted)}
        >
          {muted ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 9h4l5-4v14l-5-4H4z" />
              <path d="M17 9l4 6M21 9l-4 6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 9h4l5-4v14l-5-4H4z" />
              <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
            </svg>
          )}
        </button>
        <button
          type="button"
          className="ck-button"
          aria-label="Close Context Katamari"
          title="Close"
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
