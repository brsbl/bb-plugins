import { useSyncExternalStore } from "react";

import type { ActivitySummary } from "./activity.js";
import { DETAIL, type Controls, type RippleKind, type Scene } from "./contract.js";
import type { AmbientState } from "./rpc.js";

const OVERRIDE_MS = 1_500;
const DEVICE_DETAIL_KEY = "bb-ambient:detail";

function readDeviceDetail(): number {
  try {
    const stored = window.localStorage.getItem(DEVICE_DETAIL_KEY);
    const value = stored === null ? Number.NaN : Number(stored);
    return Number.isFinite(value) && value >= DETAIL.min && value <= DETAIL.max ? value : DETAIL.default;
  } catch {
    return DETAIL.default;
  }
}

type Override = {
  at: number;
  apply: (state: AmbientState) => AmbientState;
  acknowledged?: (state: AmbientState) => boolean;
};

export interface AmbientSnapshot {
  state: AmbientState | null;
  summary: ActivitySummary;
  compileError: string | null;
  throttled: boolean;
  /** Render resolution on this device. It is never synced: each GPU picks its own. */
  deviceDetail: number;
}

type Listener = () => void;

export class AmbientStore {
  private server: AmbientState | null = null;
  private overrides = new Map<string, Override>();
  private snapshot: AmbientSnapshot = {
    state: null,
    summary: { working: 0, waiting: 0 },
    compileError: null,
    throttled: false,
    deviceDetail: typeof window === "undefined" ? DETAIL.default : readDeviceDetail(),
  };
  private listeners = new Set<Listener>();
  private rippleListeners = new Set<(kind: RippleKind) => void>();

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): AmbientSnapshot => this.snapshot;

  receive(state: AmbientState): void {
    if (this.server && state.revision < this.server.revision) return;
    for (const [key, override] of this.overrides) {
      if (override.acknowledged && (
        (this.server && state.sceneRevision !== this.server.sceneRevision) || override.acknowledged(state)
      )) this.overrides.delete(key);
    }
    this.server = state;
    this.publish();
  }

  setValue(id: string, value: number): () => void {
    // A slow save must not expire when another slider publishes its local edit.
    return this.override(`value:${id}`, (state) => ({
      ...state,
      scene: {
        ...state.scene,
        params: state.scene.params.map((entry) =>
          entry.id === id ? { ...entry, value } : entry,
        ),
      },
    }), (state) => state.scene.params.find((entry) => entry.id === id)?.value === value);
  }

  setPaletteColor(index: number, color: string): void {
    this.override(`palette:${index}`, (state) => {
      const palette = [...state.scene.palette] as Scene["palette"];
      palette[index] = color;
      return { ...state, scene: { ...state.scene, palette } };
    });
  }

  setControl<Key extends keyof Controls>(key: Key, value: Controls[Key]): void {
    this.override(`control:${key}`, (state) => ({
      ...state,
      controls: { ...state.controls, [key]: value },
    }));
  }

  setSummary(summary: ActivitySummary): void {
    const current = this.snapshot.summary;
    if (current.working === summary.working && current.waiting === summary.waiting) {
      return;
    }
    this.snapshot = { ...this.snapshot, summary };
    this.emit();
  }

  setCompileError(compileError: string | null): void {
    if (this.snapshot.compileError === compileError) return;
    this.snapshot = { ...this.snapshot, compileError };
    this.emit();
  }

  setDeviceDetail(deviceDetail: number): void {
    if (this.snapshot.deviceDetail === deviceDetail) return;
    try {
      window.localStorage.setItem(DEVICE_DETAIL_KEY, String(deviceDetail));
    } catch {}
    this.snapshot = { ...this.snapshot, deviceDetail };
    this.emit();
  }

  setThrottled(throttled: boolean): void {
    if (this.snapshot.throttled === throttled) return;
    this.snapshot = { ...this.snapshot, throttled };
    this.emit();
  }

  clearOverrides(): void {
    this.overrides.clear();
    this.publish();
  }

  requestRipple(kind: RippleKind): void {
    for (const listener of this.rippleListeners) listener(kind);
  }

  onRipple(listener: (kind: RippleKind) => void): () => void {
    this.rippleListeners.add(listener);
    return () => this.rippleListeners.delete(listener);
  }

  private override(key: string, apply: Override["apply"], acknowledged?: Override["acknowledged"]): () => void {
    const override = { at: Date.now(), apply, acknowledged };
    this.overrides.set(key, override);
    this.publish();
    return () => {
      if (this.overrides.get(key) !== override) return;
      this.overrides.delete(key);
      this.publish();
    };
  }

  private publish(): void {
    const now = Date.now();
    let state = this.server;
    for (const [key, override] of this.overrides) {
      if (!override.acknowledged && now - override.at > OVERRIDE_MS) {
        this.overrides.delete(key);
        continue;
      }
      if (state) state = override.apply(state);
    }
    this.snapshot = { ...this.snapshot, state };
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}

export const ambientStore = new AmbientStore();

export function useAmbient(): AmbientSnapshot {
  return useSyncExternalStore(ambientStore.subscribe, ambientStore.getSnapshot);
}
