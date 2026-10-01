import { useEffect, useRef, useState } from "react";

import { CONTROL_SPECS, DETAIL, type ControlKey, type Controls, type RippleKind, type Scene, type SceneParam } from "./contract.js";
import { DailySceneRow, PaintRequestRow } from "./create.js";
import { useSceneEditing, useUndoShortcut, type LibraryItem } from "./editing.js";
import { ambientStore, useAmbient } from "./store.js";
import { Section, Slider, Switch, TextButton, ThemeModeSwitch } from "./widgets.js";

const RIPPLE_BUTTONS: { kind: RippleKind; label: string; hint: string; dot: string }[] = [
  { kind: "started", label: "starts", hint: "Show what the scene does when an agent starts", dot: "bg-foreground/50" },
  { kind: "done", label: "finishes", hint: "Show what the scene does when an agent finishes a turn", dot: "bg-foreground" },
  { kind: "error", label: "errors", hint: "Show what the scene does when an agent hits an error", dot: "bg-destructive" },
];

function SceneActions({
  entry,
  onReset,
  onDelete,
}: {
  entry: LibraryItem | undefined;
  onReset: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState<"reset" | "delete" | null>(null);
  const id = entry?.id;

  useEffect(() => {
    setConfirming(null);
  }, [id]);

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(null), 4000);
    return () => clearTimeout(timer);
  }, [confirming]);

  if (!entry || (!entry.tweaked && entry.builtIn)) return null;
  return (
    <div className="flex items-center">
      {confirming ? (
        <>
          <TextButton onClick={() => setConfirming(null)}>Cancel</TextButton>
          <TextButton
            danger
            onClick={() => {
              setConfirming(null);
              if (confirming === "reset") onReset();
              else onDelete();
            }}
          >
            {confirming === "reset" ? "Reset scene" : "Delete scene"}
          </TextButton>
        </>
      ) : (
        <>
          {entry.tweaked && <TextButton onClick={() => setConfirming("reset")}>Reset</TextButton>}
          {!entry.builtIn && <TextButton onClick={() => setConfirming("delete")}>Delete</TextButton>}
        </>
      )}
    </div>
  );
}

function ScenePicker({
  library,
  activeId,
  sceneName,
  onLoad,
}: {
  library: LibraryItem[];
  activeId: string | null;
  sceneName: string;
  onLoad: (id: string) => void;
}) {
  return (
    <div className="relative">
      <select
        aria-label="Scene"
        value={activeId ?? ""}
        onChange={(event) => onLoad(event.currentTarget.value)}
        className="h-7 w-full cursor-pointer appearance-none truncate rounded-md bg-foreground/5 pr-7 pl-2 text-xs text-foreground outline-none transition-colors hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring"
      >
        {activeId === null && <option value="">{sceneName}</option>}
        <optgroup label="Built-in">
          {library
            .filter((entry) => entry.builtIn)
            .map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
        </optgroup>
        {library.some((entry) => !entry.builtIn) && (
          <optgroup label="Saved">
            {library
              .filter((entry) => !entry.builtIn)
              .map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
          </optgroup>
        )}
      </select>
      <svg viewBox="0 0 16 16" aria-hidden="true" className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6l4 4 4-4" />
      </svg>
    </div>
  );
}

function PaletteRow({
  palette,
  onChange,
}: {
  palette: Scene["palette"];
  onChange: (index: number, color: string) => void;
}) {
  return (
    <div className="flex h-7 items-center justify-between">
      <span className="text-xs text-muted-foreground">Colors</span>
      <div className="flex items-center gap-1.5" aria-label="Palette">
        {palette.map((color, index) => (
          <label
            key={index}
            className="relative h-6 w-7 cursor-pointer overflow-hidden rounded-md border border-foreground/20 shadow-[0_1px_2px_color-mix(in_oklab,var(--ink)_30%,transparent),inset_0_1px_0_color-mix(in_oklab,var(--canvas)_35%,transparent)] transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:ring-2 hover:ring-foreground/25 active:translate-y-0 focus-within:ring-2 focus-within:ring-ring"
            style={{ backgroundColor: color }}
            title={`Change color ${index + 1} (${color})`}
          >
            <input
              type="color"
              value={color}
              aria-label={`Palette color ${index + 1}`}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
              onChange={(event) => onChange(index, event.currentTarget.value)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function ParamSliders({
  params,
  onChange,
}: {
  params: SceneParam[];
  onChange: (id: string, value: number) => void;
}) {
  return (
    <div className="space-y-1">
      {params.map((entry) => (
        <Slider
          key={entry.id}
          label={entry.label}
          value={entry.value}
          min={entry.min}
          max={entry.max}
          step={entry.step}
          onChange={(value) => onChange(entry.id, value)}
        />
      ))}
    </div>
  );
}

function DisplaySection({
  controls,
  deviceDetail,
  onControl,
}: {
  controls: Controls;
  deviceDetail: number;
  onControl: (key: ControlKey, value: number) => void;
}) {
  return (
    <Section title="Display" action={<ThemeModeSwitch />}>
      {CONTROL_SPECS.map((spec) => (
        <Slider
          key={spec.key}
          label={spec.label}
          hint={spec.hint}
          value={controls[spec.key]}
          min={spec.min}
          max={spec.max}
          step={spec.step}
          format={spec.format}
          onChange={(value) => onControl(spec.key, value)}
        />
      ))}
      <Slider
        label={DETAIL.label}
        hint={DETAIL.hint}
        value={deviceDetail}
        min={DETAIL.min}
        max={DETAIL.max}
        step={DETAIL.step}
        format={DETAIL.format}
        onChange={(value) => ambientStore.setDeviceDetail(value)}
      />
    </Section>
  );
}

function RippleRow() {
  return (
    <div className="flex min-h-6 flex-wrap items-center justify-between gap-x-1 gap-y-0.5 whitespace-nowrap">
      <h3 className="shrink-0 text-xs font-medium text-foreground/70">When an agent</h3>
      <div className="flex min-w-0 gap-0">
        {RIPPLE_BUTTONS.map((button) => (
          <button
            key={button.kind}
            type="button"
            title={button.hint}
            onClick={() => ambientStore.requestRipple(button.kind)}
            className="flex shrink-0 items-center gap-1 rounded-full px-1 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
          >
            <span className={`size-1.5 rounded-full ${button.dot}`} />
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AmbientControls({ dismiss }: { dismiss: () => void }) {
  const { state, summary, compileError, throttled, deviceDetail } = useAmbient();
  const editing = useSceneEditing(state);
  const panel = useRef<HTMLDivElement>(null);
  useUndoShortcut(panel, editing.step);

  if (!state) {
    return <div className="p-3 text-xs text-muted-foreground">Loading Ambient…</div>;
  }

  const { scene, controls } = state;
  const activity =
    summary.working + summary.waiting === 0
      ? "No agents running"
      : [
          summary.working > 0 && `${summary.working} working`,
          summary.waiting > 0 && `${summary.waiting} waiting on you`,
        ]
          .filter(Boolean)
          .join(" · ");
  return (
    <div
      ref={panel}
      className="w-full space-y-3 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pt-2 pb-3"
      style={{ maxHeight: "min(70vh, max(9rem, calc(100dvh - var(--ambient-panel-reserve, 32rem))))" }}
    >
      <style>{'[data-testid="plugin-sidebar-footer-disclosure-ambient-controls"] > div { max-height: none; overflow: visible; } @media (max-width: 767px) { [data-testid="plugin-sidebar-footer-disclosure-ambient-controls"] { --ambient-panel-reserve: 36rem; } }'}</style>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground">Ambient</div>
          <div className="truncate text-xs text-muted-foreground">{activity}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Switch
            checked={controls.enabled}
            label="Ambient background"
            onChange={(enabled) => editing.setControl("enabled", enabled)}
          />
          <button
            type="button"
            aria-label="Close Ambient"
            title="Close"
            onClick={dismiss}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-state-hover hover:text-foreground"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
      </div>

      {compileError && (
        <pre className="max-h-24 overflow-auto whitespace-pre-wrap rounded-md border border-border p-2 text-xs text-destructive">
          {compileError}
        </pre>
      )}

      {throttled && (
        <div className="text-xs text-muted-foreground">
          This scene is heavy for this machine, so Ambient lowered its detail to keep bb responsive.
        </div>
      )}

      <Section
        title="Scene"
        action={
          <SceneActions
            entry={editing.activeEntry}
            onReset={editing.resetScene}
            onDelete={() => void editing.deleteScene()}
          />
        }
      >
        <ScenePicker
          library={editing.library}
          activeId={editing.activeId}
          sceneName={scene.name}
          onLoad={editing.loadScene}
        />
        <PaletteRow palette={scene.palette} onChange={editing.setPaletteColor} />
      </Section>

      <ParamSliders params={scene.params} onChange={editing.setValue} />

      <DisplaySection controls={controls} deviceDetail={deviceDetail} onControl={editing.setControl} />

      <RippleRow />

      <PaintRequestRow />

      <DailySceneRow />
    </div>
  );
}
