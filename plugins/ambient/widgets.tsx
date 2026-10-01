import { useEffect, useRef, useState, type ReactNode } from "react";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function snap(value: number, min: number, max: number, step: number): number {
  return clamp(Number((Math.round((value - min) / step) * step + min).toFixed(4)), min, max);
}

export function Slider({
  label,
  hint,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const fraction = (clamp(value, min, max) - min) / (max - min);
  const text = format ? format(value) : value.toFixed(step >= 1 ? 0 : step >= 0.1 ? 1 : 2);
  const fromPointer = (clientX: number) => {
    const rect = track.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    onChange(snap(min + ((clientX - rect.left) / rect.width) * (max - min), min, max, step));
  };
  return (
    <div className="grid min-h-6 grid-cols-[7rem_1fr_2.25rem] items-center gap-2">
      <span className="line-clamp-2 text-xs leading-tight break-words text-muted-foreground" title={hint ? `${label}: ${hint}` : label}>
        {label}
      </span>
      <div
        ref={track}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={text}
        className="group relative flex h-5 cursor-pointer touch-none items-center outline-none"
        onPointerDown={(event) => {
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture(event.pointerId);
          fromPointer(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) fromPointer(event.clientX);
        }}
        onKeyDown={(event) => {
          const direction =
            event.key === "ArrowRight" || event.key === "ArrowUp"
              ? 1
              : event.key === "ArrowLeft" || event.key === "ArrowDown"
                ? -1
                : 0;
          if (direction === 0) return;
          event.preventDefault();
          onChange(snap(value + direction * step * (event.shiftKey ? 10 : 1), min, max, step));
        }}
      >
        <div className="h-1 w-full rounded-full bg-foreground/15" />
        <div
          className="absolute left-0 h-1 rounded-full bg-foreground/60"
          style={{ width: `${fraction * 100}%` }}
        />
        <div
          className="absolute h-4 w-4 -translate-x-1/2 cursor-grab rounded-full border border-foreground/20 shadow-[0_1px_3px_color-mix(in_oklab,var(--ink)_35%,transparent)] transition-transform duration-150 group-hover:scale-110 group-focus:scale-110 group-focus:ring-4 group-focus:ring-foreground/15 group-active:cursor-grabbing"
          style={{ left: `${fraction * 100}%`, backgroundColor: "var(--canvas)" }}
        />
      </div>
      <span className="text-right text-xs tabular-nums text-muted-foreground">{text}</span>
    </div>
  );
}

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-1">
      <div className="flex h-5 items-center justify-between gap-2">
        <h3 className="text-xs font-medium text-foreground/70">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function TextButton({
  children,
  danger,
  disabled,
  onClick,
}: {
  children: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full px-1.5 text-xs transition-colors disabled:opacity-50 ${
        danger ? "text-destructive hover:text-destructive/80" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

const THEME_KEY = "bb.theme";
type ThemeMode = "light" | "dark" | "system";
const THEME_MODES: { mode: ThemeMode; label: string; icon: ReactNode }[] = [
  {
    mode: "light",
    label: "Light",
    icon: (
      <>
        <circle cx="8" cy="8" r="2.75" />
        <path d="M8 1.75v1.5M8 12.75v1.5M1.75 8h1.5M12.75 8h1.5M3.6 3.6l1.05 1.05M11.35 11.35l1.05 1.05M3.6 12.4l1.05-1.05M11.35 4.65l1.05-1.05" />
      </>
    ),
  },
  { mode: "dark", label: "Dark", icon: <path d="M13.25 9.6A5.5 5.5 0 1 1 6.4 2.75a4.5 4.5 0 0 0 6.85 6.85z" /> },
  {
    mode: "system",
    label: "System",
    icon: (
      <>
        <rect x="2" y="3" width="12" height="8" rx="1.5" />
        <path d="M6 13.5h4M8 11v2.5" />
      </>
    ),
  },
];

function readThemeMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

export function ThemeModeSwitch() {
  const [mode, setMode] = useState<ThemeMode>(readThemeMode);

  useEffect(() => {
    const sync = () => setMode(readThemeMode());
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("storage", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("storage", sync);
    };
  }, []);

  const choose = (next: ThemeMode) => {
    const previous = localStorage.getItem(THEME_KEY);
    localStorage.setItem(THEME_KEY, next);
    window.dispatchEvent(
      new StorageEvent("storage", { key: THEME_KEY, oldValue: previous, newValue: next, storageArea: localStorage }),
    );
    setMode(next);
  };

  return (
    <div role="radiogroup" aria-label="Appearance" className="flex items-center gap-px rounded-full bg-foreground/5 p-px">
      {THEME_MODES.map((entry) => (
        <button
          key={entry.mode}
          type="button"
          role="radio"
          aria-checked={mode === entry.mode}
          aria-label={entry.label}
          title={entry.label}
          onClick={() => choose(entry.mode)}
          className={`flex size-5 items-center justify-center rounded-full transition-colors ${
            mode === entry.mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {entry.icon}
          </svg>
        </button>
      ))}
    </div>
  );
}

export function Switch({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${checked ? "bg-foreground" : "bg-foreground/20"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-3 rounded-full shadow-sm transition-transform ${checked ? "translate-x-3" : "translate-x-0"}`}
        style={{ backgroundColor: "var(--canvas)" }}
      />
    </button>
  );
}
