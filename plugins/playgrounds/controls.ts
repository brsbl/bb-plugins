// The Playgrounds component kit, for apps a person uses together with the agent.
// Layers: 0 tokens · 1 primitives and behaviors · 2 controls bound to named
// parameters · 3 patterns (bank, keyboard, pads, steps, presets, transport).
// Whole apps are built from these in the skill's references, not here.
//
// Controls are declared in markup (`<div data-pg="dial" data-param="cutoff" …>`).
// Each parameter lives in shared state under `params`, is readable and settable by
// the agent through the `getParams` and `setParams` actions, and shows when the
// agent moves it.

export const CONTROLS_CSS = String.raw`
:root {
  --pg-accent: var(--foreground);
  --pg-good: #1f8a4c; --pg-bad: #d23f3f; --pg-warn: #b26b00;
  --pg-edge: inset 0 0 0 1px var(--pg-hairline);
  --pg-radius-panel: 14px; --pg-radius-group: 10px; --pg-radius-control: 8px;
  --pg-fast: .12s;
}
:root[data-scheme=dark] { --pg-good: #4cc282; --pg-bad: #f06a6a; --pg-warn: #e0a040; }

.pg-surface { padding: 12px; border-radius: var(--pg-radius-panel); background: var(--pg-stage); }
.pg-group { min-width: 0; padding: 9px 6px 8px; border-radius: var(--pg-radius-group); background: var(--card); box-shadow: var(--pg-edge); }
.pg-label { margin: 0; font-size: 10px; line-height: 1.3; font-weight: 500; letter-spacing: .04em; text-transform: uppercase; color: var(--pg-meta); }
.pg-group > .pg-label { margin: 0 0 6px 4px; }
.pg-value { font-size: 9.5px; line-height: 1.3; color: var(--pg-meta); font-variant-numeric: tabular-nums; }
.pg-icon { width: 16px; height: 10px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linejoin: round; stroke-linecap: round; }
.pg-glyph { width: 14px; height: 14px; fill: currentColor; }
.pg-icon-btn { display: inline-grid; place-items: center; width: 32px; height: 32px; padding: 0; border-radius: 50%; border: 1px solid var(--pg-hairline); background: var(--card); color: var(--pg-ink); }
.pg-icon-btn[aria-pressed=true], .pg-icon-btn[data-primary] { background: var(--pg-ink); border-color: var(--pg-ink); color: var(--card); }
.pg-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--pg-bad); }
[data-live] > .pg-dot, .pg-dot[data-live] { animation: pg-blink 1s ease-in-out infinite alternate; }
@keyframes pg-blink { to { opacity: .3; } }

[data-pg] { --pg-c: var(--pg-accent); }
[data-pg][data-agent] { --pg-c: var(--pg-accent); }
[data-pg][data-agent]::after { content: "Agent"; position: absolute; top: -6px; left: 50%; transform: translateX(-50%); padding: 0 5px; border-radius: 999px; background: var(--pg-ink); color: var(--card); font-size: 8.5px; line-height: 13px; font-weight: 500; letter-spacing: .02em; pointer-events: none; }

.pg-dial { position: relative; display: grid; justify-items: center; gap: 2px; width: 46px; outline: none; touch-action: none; cursor: ns-resize; user-select: none; -webkit-user-select: none; }
.pg-dial svg { width: 38px; height: 38px; overflow: visible; transition: transform var(--pg-fast); }
.pg-dial.pg-grab svg { transform: scale(1.06); }
.pg-dial .pg-track { fill: none; stroke: var(--pg-hairline); stroke-width: 3.2; stroke-linecap: round; }
.pg-dial .pg-arc { fill: none; stroke: var(--pg-c); stroke-width: 3.2; stroke-linecap: round; }
.pg-dial .pg-cap { fill: var(--card); stroke: color-mix(in srgb, var(--foreground) 16%, transparent); }
.pg-dial.pg-grab .pg-cap, .pg-dial[data-agent] .pg-cap { stroke: var(--pg-c); }
.pg-dial .pg-pointer { stroke: var(--pg-ink); stroke-width: 2; stroke-linecap: round; }
.pg-dial .pg-name { font-size: 10px; font-weight: 500; color: var(--pg-ink); white-space: nowrap; }
.pg-dial .pg-value { min-height: 12px; }
.pg-dial.pg-grab .pg-value { color: var(--pg-ink); font-weight: 500; }
.pg-dial:focus-visible svg { outline: 2px solid var(--ring); outline-offset: 2px; border-radius: 50%; }

.pg-fader { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 6px 10px; align-items: baseline; font-size: 11px; font-weight: 500; color: var(--pg-ink); }
.pg-fader input { grid-column: 1 / -1; width: 100%; margin: 0; accent-color: var(--pg-c); }
.pg-stepper { position: relative; display: inline-flex; align-items: center; gap: 2px; padding: 2px; border-radius: 999px; box-shadow: var(--pg-edge); background: var(--card); }
.pg-stepper button { width: 24px; height: 24px; border: 0; border-radius: 50%; background: transparent; color: var(--pg-ink); }
.pg-stepper button:hover { background: var(--pg-stage); }
.pg-stepper output { min-width: 3.5em; text-align: center; font-size: 11.5px; font-weight: 500; }
.pg-picker { position: relative; display: grid; justify-items: center; gap: 4px; }
.pg-picker > [role=group] { display: grid; grid-template-columns: repeat(var(--pg-picker-cols, 2), 24px); gap: 2px; padding: 2px; border-radius: 9px; box-shadow: var(--pg-edge); background: var(--card); }
.pg-picker button { display: grid; place-items: center; width: 24px; height: 18px; padding: 0; border: 0; border-radius: 6px; background: transparent; color: var(--pg-ink); }
.pg-picker button[aria-pressed=true] { background: var(--pg-ink); color: var(--card); }
.pg-picker > .pg-value { font-size: 9.5px; }
.pg-toggle { position: relative; }
.pg-pad { position: relative; display: grid; place-items: center; min-height: 44px; padding: 6px; border-radius: var(--pg-radius-control); border: 0; background: var(--card); box-shadow: var(--pg-edge), inset 0 -3px 0 var(--pg-hairline); color: var(--pg-ink); font-size: 11px; font-weight: 500; touch-action: none; user-select: none; -webkit-user-select: none; transition: transform var(--pg-fast), background var(--pg-fast); }
.pg-pad.pg-on { background: color-mix(in srgb, var(--pg-c) 22%, var(--card)); transform: scale(.98); }
.pg-pad small { display: block; font-size: 9px; font-weight: 400; color: var(--pg-meta); }
.pg-meter { position: relative; height: 6px; border-radius: 3px; background: var(--pg-hairline); overflow: hidden; }
.pg-meter > i { position: absolute; inset: 0 auto 0 0; width: var(--v, 0%); background: var(--pg-c); transition: width var(--pg-fast) linear; }
.pg-scope { position: relative; height: 84px; border-radius: var(--pg-radius-group); background: var(--card); box-shadow: var(--pg-edge); overflow: hidden; }
.pg-scope canvas { display: block; width: 100%; height: 100%; }
.pg-scope > .pg-label { position: absolute; left: 10px; top: 8px; }
.pg-scope > output { position: absolute; right: 10px; top: 7px; font-size: 11px; font-weight: 500; color: var(--pg-ink); font-variant-numeric: tabular-nums; }
.pg-record[aria-pressed=true] { border-color: var(--pg-bad); color: var(--pg-bad); }
[data-pg="send"]:disabled { display: none; }
.pg-record[aria-pressed=true] .pg-dot { animation: pg-blink 1s ease-in-out infinite alternate; }

.pg-bank { display: flex; justify-content: space-around; align-items: center; gap: 4px; }
.pg-banks { display: grid; grid-template-columns: var(--cols, 1fr 1fr); gap: 10px; }
.pg-banks + .pg-banks, .pg-surface > * + * { margin-top: 10px; }
@media (max-width: 460px) { .pg-banks { grid-template-columns: 1fr; } }
.pg-presets { display: flex; flex-wrap: wrap; gap: 6px; }
.pg-transport { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.pg-transport > div { display: flex; gap: 6px; }
.pg-transport > .pg-hint { flex: 1; min-width: 0; text-align: center; font-size: 11px; color: var(--pg-meta); }
.pg-keyboard { position: relative; height: 112px; user-select: none; -webkit-user-select: none; touch-action: none; }
.pg-keyboard > div { position: absolute; top: 0; }
.pg-keyboard .pg-w { bottom: 0; border-radius: 0 0 7px 7px; background: #fbfaf7; box-shadow: inset 0 0 0 1px rgba(0,0,0,.14), inset 0 -3px 0 rgba(0,0,0,.06); transition: background .06s, transform .06s; transform-origin: top; }
.pg-keyboard .pg-b { z-index: 1; height: 62%; border-radius: 0 0 5px 5px; background: #1d1d1f; box-shadow: inset 0 -3px 0 rgba(255,255,255,.08), 0 2px 3px rgba(0,0,0,.25); transition: background .06s, transform .06s; transform-origin: top; }
.pg-keyboard .pg-w.pg-on { background: color-mix(in srgb, var(--pg-c) 30%, #fbfaf7); transform: scaleY(.985); }
.pg-keyboard .pg-b.pg-on { background: var(--pg-c); transform: scaleY(.97); }
.pg-keyboard span { position: absolute; left: 0; right: 0; bottom: 6px; text-align: center; font-size: 9px; color: #9a968e; pointer-events: none; }
.pg-keyboard .pg-b span { bottom: 5px; color: #8a8a8e; }
.pg-keyboard .pg-c span { color: #5f5b54; font-weight: 500; }
.pg-keyboard > .pg-gesture { inset: 0; z-index: 2; display: grid; place-items: center; border: 0; border-radius: 8px; background: color-mix(in srgb, var(--card) 72%, transparent); color: var(--pg-ink); font-size: 12px; font-weight: 500; }
@media (pointer: coarse) { .pg-keyboard span.pg-key { display: none; } }
.pg-pads { display: grid; grid-template-columns: repeat(var(--pg-pad-cols, 4), minmax(0, 1fr)); gap: 6px; }
.pg-steps { display: grid; grid-template-columns: 56px repeat(var(--steps, 16), minmax(0, 1fr)); gap: 3px; align-items: center; font-size: 10px; color: var(--pg-meta); }
.pg-steps button { aspect-ratio: 1; min-width: 0; padding: 0; border: 0; border-radius: 4px; background: var(--pg-hairline); }
.pg-steps button:nth-of-type(4n+1) { background: color-mix(in srgb, var(--foreground) 14%, var(--card)); }
.pg-steps button[aria-pressed=true] { background: var(--pg-c); }
.pg-steps button.pg-now { outline: 2px solid var(--pg-ink); outline-offset: -2px; }
`;

// Inserted into the bridge before the API object is frozen. It may use `api`
// (the object that becomes window.playground), `state`, and `actions`.
// It must not contain backticks or "${" because it lives in a template string.
export const CONTROLS_RUNTIME = String.raw`
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const WAVES = { sine: "M1 5 C3 0 5 0 7.5 5 S12 10 15 5", triangle: "M1 8 L4.5 2 L8 8 L11.5 2 L15 8", sawtooth: "M1 8 L7 2 L7 8 L13 2 L13 8", square: "M1 8 L1 2 L6 2 L6 8 L11 8 L11 2 L15 2", noise: "M1 5 L3 2 L4 8 L6 3 L7 7 L9 1 L10 9 L12 4 L13 6 L15 5" };
  const GLYPHS = { play: "M4.5 2.8v10.4c0 .5.5.8.9.5l8-5.2c.4-.2.4-.8 0-1l-8-5.2c-.4-.3-.9 0-.9.5Z", stop: "M4 4h8v8H4z", pause: "M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z", send: "M2 8 14 2 10 14 8.5 9.5Z" };
  function icon(name) {
    if (WAVES[name]) return '<svg class="pg-icon" viewBox="0 0 16 10" aria-hidden="true"><path d="' + WAVES[name] + '"/></svg>';
    if (GLYPHS[name]) return '<svg class="pg-glyph" viewBox="0 0 16 16" aria-hidden="true"><path d="' + GLYPHS[name] + '"/></svg>';
    return "";
  }
  const decimals = (step) => { const s = String(step || 1); return s.includes(".") ? s.split(".")[1].length : 0; };
  function format(v, s) {
    if (s.options) { const o = s.options.find((x) => x.value === v); return o ? o.label : String(v); }
    if (typeof v === "boolean") return v ? "On" : "Off";
    const u = s.unit || "";
    if (u === "%" && s.max <= 1) return Math.round(v * 100) + "%";
    if (u === "Hz") return v >= 1000 ? (v / 1000).toFixed(1) + "k" : v < 10 ? v.toFixed(1) + "Hz" : Math.round(v) + "Hz";
    if (u === "s") return v < 1 ? Math.round(v * 1000) + "ms" : v.toFixed(1) + "s";
    const n = Number(v).toFixed(s.step ? decimals(s.step) : Math.abs(v) < 10 ? 1 : 0);
    return u ? n + (/^[%¢°]/.test(u) ? "" : " ") + u : n;
  }

  // Layer 1 behaviors.
  function dragValue(el, ctl) {
    let drag = null;
    el.addEventListener("pointerdown", (e) => { if (e.button !== 0) return; e.preventDefault(); el.focus(); el.setPointerCapture(e.pointerId); drag = { y: e.clientY, t: ctl.t() }; el.classList.add("pg-grab"); });
    el.addEventListener("pointermove", (e) => { if (drag) ctl.set(drag.t + (drag.y - e.clientY) / (e.shiftKey ? 600 : 160)); });
    const end = () => { drag = null; el.classList.remove("pg-grab"); };
    el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
    el.addEventListener("dblclick", () => ctl.reset());
    el.addEventListener("wheel", (e) => { e.preventDefault(); ctl.set(ctl.t() - Math.sign(e.deltaY) * .02); }, { passive: false });
    el.addEventListener("keydown", (e) => {
      const step = { ArrowUp: .02, ArrowRight: .02, ArrowDown: -.02, ArrowLeft: -.02, PageUp: .1, PageDown: -.1 }[e.key];
      if (step) { e.preventDefault(); ctl.set(ctl.t() + step); }
      else if (e.key === "Home") { e.preventDefault(); ctl.set(0); }
      else if (e.key === "End") { e.preventDefault(); ctl.set(1); }
    });
  }
  function pressable(el, down, up) {
    const ids = new Set();
    el.addEventListener("pointerdown", (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); if (!ids.size) down(); ids.add(e.pointerId); });
    const end = (e) => { if (!ids.delete(e.pointerId)) return; if (!ids.size) up(); };
    el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
    el.addEventListener("keydown", (e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); down(); } });
    el.addEventListener("keyup", (e) => { if (e.key === " " || e.key === "Enter") up(); });
  }

  // Sound needs a click inside the card first. ui.audio() returns the shared
  // context; ui.onAudio runs once it can play.
  let audioCtx = null;
  const audioWaiters = new Set();
  function audio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx && Ctx) audioCtx = new Ctx();
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    return audioCtx;
  }
  const audioReady = () => Boolean(audioCtx && audioCtx.state === "running");
  addEventListener("pointerdown", () => { const ctx = audio(); if (ctx) ctx.resume().then(() => { for (const fn of audioWaiters) fn(); audioWaiters.clear(); }).catch(() => {}); }, true);

  // Events: press, release, change, take.
  const handlers = new Map();
  const on = (type, fn) => { if (!handlers.has(type)) handlers.set(type, new Set()); handlers.get(type).add(fn); return () => handlers.get(type).delete(fn); };
  const fire = (type, detail) => { for (const fn of handlers.get(type) || []) { try { fn(detail); } catch (error) { console.error(error); } } };

  // Layer 2: parameters.
  const specs = {}, values = {};
  const restored = state && typeof state === "object" && state.params && typeof state.params === "object" ? state.params : {};
  const norm = (s, v) => s.scale === "log" ? Math.log(v / s.min) / Math.log(s.max / s.min) : (v - s.min) / (s.max - s.min);
  const denorm = (s, t) => { t = clamp(t, 0, 1); return s.scale === "log" ? s.min * Math.pow(s.max / s.min, t) : s.min + t * (s.max - s.min); };
  function valid(s, v) {
    if (s.options) return s.options.some((o) => o.value === v) ? v : s.default;
    if (s.type === "toggle") return Boolean(v);
    if (s.type === "grid") return Array.isArray(v) && v.length === s.rows && v.every((r) => Array.isArray(r) && r.length === s.steps) ? v.map((r) => r.map(Boolean)) : s.default;
    const n = Number(v);
    if (!Number.isFinite(n)) return s.default;
    const c = clamp(n, s.min, s.max);
    return s.step ? Number((Math.round((c - s.min) / s.step) * s.step + s.min).toFixed(6)) : c;
  }
  function define(name, spec) {
    if (!/^[A-Za-z][\w-]*$/.test(name)) throw new Error("Parameter names are letters, digits, - and _: " + name);
    const s = { label: name, ...spec };
    if (s.type === "grid") s.default = s.default || Array.from({ length: s.rows }, () => Array(s.steps).fill(false));
    else if (s.type !== "toggle" && !s.options) { s.min = Number(s.min ?? 0); s.max = Number(s.max ?? 1); }
    if (s.default === undefined) s.default = s.options ? s.options[0].value : s.type === "toggle" ? false : s.min;
    specs[name] = s;
    if (!(name in values)) values[name] = valid(s, name in restored ? restored[name] : s.default);
    return values[name];
  }
  let saveTimer = 0;
  const rawSave = api.save;
  const current = () => (api.state && typeof api.state === "object" && !Array.isArray(api.state) ? api.state : {});
  const persist = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => rawSave({ ...current(), params: { ...values } }), 150); };
  api.save = (value) => rawSave(value && typeof value === "object" && !Array.isArray(value) && Object.keys(specs).length && !("params" in value) ? { ...value, params: { ...values } } : value);
  function set(name, value, from) {
    const s = specs[name];
    if (!s) return undefined;
    const next = valid(s, value);
    if (JSON.stringify(next) === JSON.stringify(values[name])) return next;
    values[name] = next;
    fire("change", { name, value: next, from: from || "user" });
    if (from === "agent") flag(name);
    if (from !== "remote") persist();
    record("change", { name, value: next, from });
    return next;
  }
  const params = Object.freeze({
    define, set: (name, value) => set(name, value, "user"),
    get: (name) => values[name], all: () => ({ ...values }), spec: (name) => specs[name],
    format: (name, v) => format(v === undefined ? values[name] : v, specs[name] || {}),
    on: (fn) => on("change", fn),
  });
  function flag(name) {
    for (const el of document.querySelectorAll('[data-param="' + name + '"]')) {
      el.dataset.agent = ""; clearTimeout(el.__agentTimer);
      el.__agentTimer = setTimeout(() => { delete el.dataset.agent; }, 1600);
    }
  }
  stateListeners.add((next) => {
    const incoming = next && typeof next === "object" && next.params;
    if (!incoming) return;
    for (const name in specs) if (name in incoming) set(name, incoming[name], "remote");
  });

  // Takes: what the person played and changed, with timing, ready to send.
  let recording = null, lastTake = null;
  function record(kind, detail) {
    if (!recording || detail.from === "agent") return;
    const t = Math.round(performance.now() - recording.t0) / 1000;
    if (kind === "press") recording.open.set(detail.id, t);
    else if (kind === "release" && recording.open.has(detail.id)) { const t0 = recording.open.get(detail.id); recording.open.delete(detail.id); recording.notes.push([detail.id, t0, Number((t - t0).toFixed(3))]); }
    else if (kind === "change") recording.changes.push([t, detail.name, detail.value]);
  }
  function startTake() { recording = { t0: performance.now(), open: new Map(), notes: [], changes: [] }; syncRecorders(); }
  function stopTake() {
    if (!recording) return lastTake;
    const t = Math.round(performance.now() - recording.t0) / 1000;
    for (const [id, t0] of recording.open) recording.notes.push([id, t0, Number((t - t0).toFixed(3))]);
    lastTake = { seconds: t, notes: recording.notes.sort((a, b) => a[1] - b[1]), changes: recording.changes, params: { ...values } };
    recording = null; syncRecorders(); fire("take", lastTake);
    return lastTake;
  }
  function syncRecorders() {
    for (const el of document.querySelectorAll('[data-pg="record"]')) { el.setAttribute("aria-pressed", String(Boolean(recording))); el.lastChild.textContent = recording ? "Stop" : "Record"; }
    for (const el of document.querySelectorAll('[data-pg="send"]')) el.disabled = !lastTake || Boolean(recording);
  }

  // Presses from people and from the agent go through one path.
  const pressed = new Map();
  function press(id, from, velocity) {
    pressed.set(id, (pressed.get(id) || 0) + 1);
    for (const el of document.querySelectorAll('[data-press="' + CSS.escape(String(id)) + '"]')) el.classList.add("pg-on");
    fire("press", { id, from: from || "user", velocity: velocity ?? 1 });
    record("press", { id, from });
  }
  function release(id, from) {
    const n = (pressed.get(id) || 1) - 1;
    if (n > 0) { pressed.set(id, n); return; }
    pressed.delete(id);
    for (const el of document.querySelectorAll('[data-press="' + CSS.escape(String(id)) + '"]')) el.classList.remove("pg-on");
    fire("release", { id, from: from || "user" });
    record("release", { id, from });
  }
  let agentTimers = [], unheard = null;
  // play([[id, startBeat, lengthBeats], ...], bpm): the agent performs on the card's own controls.
  function play(notes, bpm) {
    const beat = 60 / clamp(Number(bpm) || 120, 30, 300);
    for (const t of agentTimers) clearTimeout(t);
    agentTimers = [];
    const list = (Array.isArray(notes) ? notes : []).slice(0, 512).filter((n) => Array.isArray(n) && n.length >= 2);
    for (const [id, start, length] of list) {
      agentTimers.push(setTimeout(() => press(id, "agent"), Math.max(0, Number(start) * beat * 1000)));
      agentTimers.push(setTimeout(() => release(id, "agent"), Math.max(0, (Number(start) + Math.max(.05, Number(length) || .5)) * beat * 1000)));
    }
    const seconds = list.reduce((m, [, s, l]) => Math.max(m, (Number(s) + (Number(l) || .5)) * beat), 0);
    const audible = audioReady();
    unheard = audible ? null : [list, bpm];
    if (!audible) for (const kb of document.querySelectorAll('[data-pg="keyboard"],[data-pg="pads"]')) kb.__gesture?.();
    return { notes: list.length, seconds: Number(seconds.toFixed(2)), audible };
  }

  // Layer 2 controls and layer 3 patterns, hydrated from markup.
  const attr = (el, name, fallback) => (el.dataset[name] === undefined ? fallback : el.dataset[name]);
  const num = (el, name, fallback) => (el.dataset[name] === undefined ? fallback : Number(el.dataset[name]));
  function optionsOf(el) {
    const raw = el.dataset.options;
    if (!raw) return null;
    return raw.split(",").map((part) => { const [value, label] = part.split(":"); return { value: value.trim(), label: (label || value).trim() }; });
  }
  function specFrom(el, extra) {
    const options = optionsOf(el);
    return {
      label: attr(el, "label", el.dataset.param), unit: attr(el, "unit", ""), scale: attr(el, "scale", "lin"),
      min: num(el, "min", 0), max: num(el, "max", 1), step: num(el, "step", undefined),
      default: el.dataset.value === undefined ? undefined : options ? el.dataset.value : extra && extra.type === "toggle" ? el.dataset.value === "true" : Number(el.dataset.value),
      options, ...extra,
    };
  }
  const ARC = (t) => { const a0 = -225 * Math.PI / 180, a = a0 + t * 270 * Math.PI / 180, r = 15, p = (g) => (19 + r * Math.cos(g)).toFixed(2) + " " + (19 + r * Math.sin(g)).toFixed(2); return "M " + p(a0) + " A " + r + " " + r + " 0 " + (t > 2 / 3 ? 1 : 0) + " 1 " + p(a); };
  const BUILD = {
    dial(el, name) {
      const s = specs[name];
      el.classList.add("pg-dial"); el.tabIndex = 0; el.setAttribute("role", "slider"); el.setAttribute("aria-label", s.label);
      el.innerHTML = '<svg viewBox="0 0 38 38" aria-hidden="true"><path class="pg-track" d="' + ARC(1) + '"/><path class="pg-arc"/><circle class="pg-cap" cx="19" cy="19" r="10.5"/><line class="pg-pointer" x1="19" y1="19" x2="19" y2="11"/></svg><div class="pg-name"></div><div class="pg-value"></div>';
      el.querySelector(".pg-name").textContent = s.label;
      dragValue(el, { t: () => norm(s, values[name]), set: (t) => set(name, denorm(s, t)), reset: () => set(name, s.default) });
      return () => {
        const t = clamp(norm(s, values[name]), 0, 1), g = (-225 + t * 270) * Math.PI / 180;
        el.querySelector(".pg-arc").setAttribute("d", t > .001 ? ARC(t) : "");
        const p = el.querySelector(".pg-pointer"); p.setAttribute("x2", (19 + 8 * Math.cos(g)).toFixed(2)); p.setAttribute("y2", (19 + 8 * Math.sin(g)).toFixed(2));
        el.querySelector(".pg-value").textContent = format(values[name], s);
        el.setAttribute("aria-valuenow", String(values[name])); el.setAttribute("aria-valuetext", format(values[name], s));
      };
    },
    fader(el, name) {
      const s = specs[name];
      el.classList.add("pg-fader");
      el.innerHTML = '<span></span><output></output><input type="range" min="0" max="1000" step="1">';
      el.firstChild.textContent = s.label;
      const input = el.querySelector("input"); input.setAttribute("aria-label", s.label);
      input.addEventListener("input", () => set(name, denorm(s, Number(input.value) / 1000)));
      return () => { input.value = String(Math.round(norm(s, values[name]) * 1000)); el.querySelector("output").textContent = format(values[name], s); };
    },
    stepper(el, name) {
      const s = specs[name], step = s.step || (s.max - s.min) / 20;
      el.classList.add("pg-stepper"); el.setAttribute("role", "group"); el.setAttribute("aria-label", s.label);
      el.innerHTML = '<button type="button" aria-label="Decrease">−</button><output></output><button type="button" aria-label="Increase">+</button>';
      el.firstChild.onclick = () => set(name, values[name] - step); el.lastChild.onclick = () => set(name, values[name] + step);
      return () => { el.querySelector("output").textContent = format(values[name], s); };
    },
    segmented(el, name) {
      const s = specs[name];
      el.classList.add("pg-seg"); el.setAttribute("role", "group"); el.setAttribute("aria-label", s.label);
      el.innerHTML = s.options.map((o) => '<button type="button" aria-pressed="false"></button>').join("");
      [...el.children].forEach((b, i) => { b.textContent = s.options[i].label; b.onclick = () => set(name, s.options[i].value); });
      return () => [...el.children].forEach((b, i) => b.setAttribute("aria-pressed", String(s.options[i].value === values[name])));
    },
    picker(el, name) {
      const s = specs[name];
      el.classList.add("pg-picker");
      el.innerHTML = '<div role="group"></div><div class="pg-value"></div>';
      const grid = el.firstChild; grid.setAttribute("aria-label", s.label);
      grid.innerHTML = s.options.map((o) => '<button type="button" aria-pressed="false">' + icon(o.value) + "</button>").join("");
      [...grid.children].forEach((b, i) => { b.setAttribute("aria-label", s.options[i].label); if (!icon(s.options[i].value)) b.textContent = s.options[i].label; b.onclick = () => set(name, s.options[i].value); });
      el.lastChild.textContent = attr(el, "caption", s.label);
      return () => [...grid.children].forEach((b, i) => b.setAttribute("aria-pressed", String(s.options[i].value === values[name])));
    },
    toggle(el, name) {
      const s = specs[name];
      el.classList.add(el.classList.contains("pg-btn") ? "pg-toggle" : "pg-chip", "pg-toggle");
      if (el.tagName !== "BUTTON") { el.tabIndex = 0; el.setAttribute("role", "button"); }
      if (!el.textContent.trim()) el.textContent = s.label;
      el.onclick = () => set(name, !values[name]);
      return () => el.setAttribute("aria-pressed", String(Boolean(values[name])));
    },
    steps(el, name) {
      const s = specs[name], rows = attr(el, "rows", "").split(",").map((r) => r.trim());
      el.classList.add("pg-steps"); el.style.setProperty("--steps", String(s.steps));
      el.innerHTML = rows.map((r, ri) => "<span></span>" + Array.from({ length: s.steps }, (_, si) => '<button type="button" aria-pressed="false" data-r="' + ri + '" data-s="' + si + '"></button>').join("")).join("");
      [...el.querySelectorAll("span")].forEach((sp, i) => { sp.textContent = rows[i]; });
      el.onclick = (e) => { const b = e.target.closest("button"); if (!b) return; const grid = values[name].map((r) => r.slice()); grid[+b.dataset.r][+b.dataset.s] = !grid[+b.dataset.r][+b.dataset.s]; set(name, grid); };
      el.__now = (i) => el.querySelectorAll("button").forEach((b) => b.classList.toggle("pg-now", +b.dataset.s === i));
      return () => el.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(Boolean(values[name][+b.dataset.r][+b.dataset.s]))));
    },
  };
  const NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
  const noteName = (m) => NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
  function keyboard(el) {
    const keymap = attr(el, "keys", "awsedftgyhujkolp;'"), count = num(el, "count", 25), whites = [0, 2, 4, 5, 7, 9, 11];
    let base = num(el, "from", 48);
    el.classList.add("pg-keyboard"); el.setAttribute("role", "group"); el.setAttribute("aria-label", attr(el, "label", "Keyboard"));
    function build() {
      el.innerHTML = "";
      const nWhite = Array.from({ length: count }, (_, i) => i).filter((i) => whites.includes(((base + i) % 12 + 12) % 12)).length, w = 100 / nWhite;
      let wi = 0;
      for (let i = 0; i < count; i++) {
        const m = base + i, white = whites.includes(((m % 12) + 12) % 12), key = document.createElement("div");
        key.dataset.press = String(m); key.setAttribute("aria-label", noteName(m));
        if (white) { key.className = "pg-w" + (m % 12 === 0 ? " pg-c" : ""); key.style.left = "calc(" + (wi * w) + "% + 1px)"; key.style.width = "calc(" + w + "% - 2px)"; wi++; }
        else { key.className = "pg-b"; key.style.left = (wi * w - w * .3) + "%"; key.style.width = (w * .6) + "%"; }
        const q = keymap[i] ? keymap[i].toUpperCase() : "";
        key.innerHTML = m % 12 === 0 ? "<span></span>" : q ? '<span class="pg-key"></span>' : "";
        if (key.firstChild) key.firstChild.textContent = m % 12 === 0 ? noteName(m) : q;
        if (pressed.has(m)) key.classList.add("pg-on");
        el.append(key);
      }
    }
    build();
    const pointers = new Map();
    const at = (x, y) => { const k = document.elementFromPoint(x, y)?.closest("[data-press]"); return k && el.contains(k) ? Number(k.dataset.press) : null; };
    el.addEventListener("pointerdown", (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); const m = at(e.clientX, e.clientY); pointers.set(e.pointerId, m); if (m != null) press(m); });
    el.addEventListener("pointermove", (e) => { if (!pointers.has(e.pointerId)) return; const m = at(e.clientX, e.clientY), prev = pointers.get(e.pointerId); if (m !== prev) { if (prev != null) release(prev); if (m != null) press(m); pointers.set(e.pointerId, m); } });
    const up = (e) => { if (!pointers.has(e.pointerId)) return; const m = pointers.get(e.pointerId); pointers.delete(e.pointerId); if (m != null) release(m); };
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    addEventListener("keydown", (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.("input,textarea,[role=slider]")) return;
      const k = e.key.toLowerCase();
      if ((k === "z" || k === "x") && el.dataset.octaves !== "false") { e.preventDefault(); base = clamp(base + (k === "z" ? -12 : 12), 12, 96); build(); return; }
      const i = keymap.indexOf(k); if (i < 0 || e.repeat || i >= count) return; e.preventDefault(); press(base + i);
    });
    addEventListener("keyup", (e) => { const i = keymap.indexOf(e.key.toLowerCase()); if (i >= 0 && i < count) release(base + i); });
    gesture(el);
  }
  function gesture(el) {
    el.__gesture = () => {
      if (audioReady() || el.querySelector(".pg-gesture")) return;
      const b = document.createElement("button"); b.type = "button"; b.className = "pg-gesture"; b.textContent = "Tap to hear the agent play";
      b.onclick = () => { const ctx = audio(); b.remove(); const again = unheard; unheard = null; if (again && ctx) ctx.resume().then(() => play(again[0], again[1])).catch(() => {}); }; el.append(b);
      audioWaiters.add(() => b.remove());
    };
  }
  function pads(el) {
    el.classList.add("pg-pads");
    const list = attr(el, "pads", "").split(",").map((p) => { const [label, key] = p.split(":"); return { id: label.trim(), key: (key || "").trim().toLowerCase() }; }).filter((p) => p.id);
    el.style.setProperty("--pg-pad-cols", attr(el, "cols", String(Math.min(4, list.length))));
    for (const p of list) {
      const b = document.createElement("button"); b.type = "button"; b.className = "pg-pad"; b.dataset.press = p.id;
      b.innerHTML = "<span></span><small></small>"; b.firstChild.textContent = p.id; b.lastChild.textContent = p.key.toUpperCase();
      pressable(b, () => press(p.id), () => release(p.id)); el.append(b);
    }
    addEventListener("keydown", (e) => { if (e.repeat || e.metaKey || e.ctrlKey || e.target.closest?.("input,textarea")) return; const p = list.find((x) => x.key === e.key.toLowerCase()); if (p) { e.preventDefault(); press(p.id); } });
    addEventListener("keyup", (e) => { const p = list.find((x) => x.key === e.key.toLowerCase()); if (p) release(p.id); });
    el.style.position = "relative"; gesture(el);
  }
  function presets(el) {
    const source = el.querySelector('script[type="application/json"]');
    let table = {};
    try { table = JSON.parse(source ? source.textContent : "{}"); } catch {}
    el.classList.add("pg-presets"); el.setAttribute("role", "group"); el.setAttribute("aria-label", attr(el, "label", "Presets"));
    const names = Object.keys(table);
    el.innerHTML = names.map(() => '<button type="button" class="pg-chip" aria-pressed="false"></button>').join("");
    [...el.children].forEach((b, i) => { b.textContent = names[i]; b.onclick = () => { for (const [k, v] of Object.entries(table[names[i]])) set(k, v); fire("preset", { name: names[i] }); }; });
    const matches = (preset) => { const known = Object.entries(preset).filter(([k]) => k in specs); return known.length > 0 && known.every(([k, v]) => JSON.stringify(values[k]) === JSON.stringify(valid(specs[k], v))); };
    const sync = () => [...el.children].forEach((b, i) => b.setAttribute("aria-pressed", String(matches(table[names[i]]))));
    on("change", sync); afterHydrate.push(sync);
  }
  function scope(el) {
    el.classList.add("pg-scope");
    if (!el.querySelector("canvas")) el.insertAdjacentHTML("afterbegin", "<canvas></canvas>");
    const canvas = el.querySelector("canvas"), g = canvas.getContext("2d");
    let analyser = null, buf = null;
    const draw = (samples) => {
      const w = canvas.width = canvas.clientWidth * devicePixelRatio, h = canvas.height = canvas.clientHeight * devicePixelRatio;
      g.clearRect(0, 0, w, h); g.lineWidth = 1.5 * devicePixelRatio; g.strokeStyle = getComputedStyle(el).getPropertyValue("--pg-c") || "#000"; g.beginPath();
      const n = samples ? samples.length : 0;
      for (let i = 0; i < Math.max(2, n); i++) { const x = (i / Math.max(1, n - 1)) * w, y = h / 2 - (n ? samples[i] : 0) * h * .38; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    };
    const loop = () => { if (analyser) { analyser.getFloatTimeDomainData(buf); draw(buf); requestAnimationFrame(loop); } };
    el.__scope = { draw, attach(node) { analyser = node; buf = new Float32Array(node.fftSize); requestAnimationFrame(loop); }, readout(text) { const o = el.querySelector("output"); if (o) o.textContent = text; } };
    draw(null);
  }
  const afterHydrate = [];
  function hydrate(root) {
    const binders = [];
    for (const el of root.querySelectorAll("[data-pg]")) {
      if (el.__pg) continue;
      el.__pg = true;
      const kind = el.dataset.pg, name = el.dataset.param;
      if (BUILD[kind] && name) {
        const extra = kind === "toggle" ? { type: "toggle" } : kind === "steps" ? { type: "grid", rows: attr(el, "rows", "").split(",").length, steps: num(el, "steps", 16) } : {};
        if (kind === "picker" || kind === "segmented") { if (!optionsOf(el)) continue; }
        if (!specs[name]) define(name, specFrom(el, extra));
        const paint = BUILD[kind](el, name);
        el.__paint = paint; binders.push(paint); paint();
      } else if (kind === "keyboard") keyboard(el);
      else if (kind === "pads") pads(el);
      else if (kind === "presets") presets(el);
      else if (kind === "scope") scope(el);
      else if (kind === "meter") { el.classList.add("pg-meter"); el.innerHTML = "<i></i>"; el.__set = (t) => el.style.setProperty("--v", (clamp(t, 0, 1) * 100) + "%"); }
      else if (kind === "record") { el.classList.add("pg-btn", "pg-record"); el.innerHTML = '<i class="pg-dot"></i><span>Record</span>'; el.setAttribute("aria-pressed", "false"); el.onclick = () => (recording ? stopTake() : startTake()); }
      else if (kind === "send") { el.classList.add("pg-btn"); if (!el.textContent.trim()) el.textContent = "Send to agent"; el.disabled = true; el.onclick = () => { if (lastTake) api.send(attr(el, "label", "Take") + " · " + lastTake.notes.length + " notes · " + lastTake.seconds.toFixed(1) + "s", lastTake); }; }
    }
    for (const fn of afterHydrate.splice(0)) fn();
  }
  on("change", ({ name }) => { for (const el of document.querySelectorAll('[data-param="' + name + '"]')) el.__paint?.(); });

  const autoActions = {
    getParams: () => ({ values: { ...values }, specs: Object.fromEntries(Object.entries(specs).map(([k, s]) => [k, { label: s.label, unit: s.unit, min: s.min, max: s.max, options: s.options && s.options.map((o) => o.value), type: s.type }])) }),
    setParams: (next) => { const out = {}; for (const [k, v] of Object.entries(next && typeof next === "object" ? next : {})) if (specs[k]) out[k] = set(k, v, "agent"); return { set: out }; },
    play: (notes, bpm) => play(notes, bpm),
    take: () => lastTake,
  };
  api.params = params;
  api.ui = Object.freeze({ icon, format: (v, spec) => format(v, spec || {}), dragValue, pressable, audio, audioReady, onAudio: (fn) => (audioReady() ? fn() : audioWaiters.add(fn)), on, press: (id) => press(id, "user"), release: (id) => release(id, "user"), play, scope: (el) => el.__scope, meter: (el) => el.__set, steps: (el) => el.__now, noteName, hydrate: () => hydrate(document), take: () => lastTake });
  const start = () => {
    hydrate(document);
    if (Object.keys(specs).length || document.querySelector('[data-pg="keyboard"],[data-pg="pads"],[data-pg="record"]')) api.expose(autoActions);
    syncRecorders();
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", start); else start();
`;
