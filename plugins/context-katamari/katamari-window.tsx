import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";

import {
  coinsLine,
  compactedLine,
  type GulpTier,
  line,
  LINES,
  modeLine,
  pickupLine,
  receipt,
  speechSeconds,
  swallow,
  type UsageReading,
} from "./commentary";
import { DRIVE_KEYS, driveFromKeys, IDLE_DRIVE } from "./controls";
import type { TurnCost } from "./contract";
import { Guide, guideSeen, markGuideSeen } from "./guide";
import { Clock, FlowerGauge, PrinceOnEarth, SizeText, TurnStrip, Typewriter } from "./hud";
import { fillForRadius, formatTokens } from "./katamari-math";
import { KatamariAudio } from "./sound";
import type { StageMode } from "./stage";
import { type HudSnapshot, KatamariWorld, type WorldEvent } from "./engine/world";
import { useWindowLayout } from "./use-window-layout";

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
  const speechTimer = useRef(0);
  const lookOutTimer = useRef(0);

  const speechEnds = useRef(0);
  const queuedSpeechTimer = useRef(0);

  const say = useCallback((text: string) => {
    window.clearTimeout(speechTimer.current);
    const seconds = speechSeconds(text);
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
          sayNext(pickupLine(event.fill));
          break;
        case "compacted":
          say(compactedLine(event.compactions));
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
          sayNext(coinsLine(event.usedTokens));
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
      // Arrow keys held while the world was building take hold now; after
      // this, each press and release updates the drive.
      created.setDrive(driveFromKeys(pressedRef.current));
    };
    // Let the window paint first; building the world takes a moment.
    const frame = window.requestAnimationFrame(() => {
      timer = window.setTimeout(createWorld, 0);
    });
    return () => {
      window.cancelAnimationFrame(frame);
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
  const lastUsage = useRef<UsageReading>({ threadId: null, usedTokens: null, ready: false });
  useEffect(() => {
    const previous = lastUsage.current;
    lastUsage.current = { threadId: stage.threadId, usedTokens: stage.usedTokens, ready: stage.ready };
    const swallowed = swallow(previous, {
      threadId: stage.threadId,
      usedTokens: stage.usedTokens,
      capacityTokens: stage.capacityTokens,
      ready: stage.ready,
      compactions: stage.compactions,
    });
    if (!swallowed) return;
    worldRef.current?.gulp(swallowed.share);
    setGulpLabel({ text: swallowed.label, tier: swallowed.tier, key: Date.now() });
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
    const remark = modeLine(stage.mode);
    if (remark !== null) say(remark);
  }, [say, stage.mode]);

  useEffect(() => {
    audioRef.current?.setMuted(muted);
  }, [muted]);

  const { layout, beginDrag, continueDrag, endDrag } = useWindowLayout();

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.currentTarget.blur();
      return;
    }
    if (!DRIVE_KEYS.has(event.key) || event.metaKey || event.ctrlKey || event.altKey) return;
    event.preventDefault();
    event.stopPropagation();
    pressedRef.current.add(event.key);
    worldRef.current?.setDrive(driveFromKeys(pressedRef.current));
  };

  const onKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!DRIVE_KEYS.has(event.key)) return;
    event.preventDefault();
    pressedRef.current.delete(event.key);
    worldRef.current?.setDrive(driveFromKeys(pressedRef.current));
  };

  const toggleGuide = useCallback((open: boolean) => {
    setGuideOpen(open);
    if (!open) markGuideSeen();
  }, []);
  const closeGuide = useCallback(() => toggleGuide(false), [toggleGuide]);

  const releaseKeys = () => {
    pressedRef.current.clear();
    worldRef.current?.setDrive(IDLE_DRIVE);
    setFocused(false);
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

        {guideOpen ? <Guide onClose={closeGuide} /> : null}

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
