// Higher-level component sets, composed from the base library in controls.ts.
// Calculator set: scrubbable numbers inside a sentence, one answer, a breakdown bar.
// An optional run bar (play, pause, scrub) driving the base chart, which shows
// the run with a "now" marker and its events. The music set lives in controls.ts.

export const SETS_CSS = String.raw`
.pg-sentence { margin-bottom: 0; max-width: 62ch; font-size: var(--pg-text-sentence); line-height: 1.6; color: var(--pg-body); text-wrap: pretty; }
.pg-sentence :is(b, strong) { font-weight: 600; color: var(--pg-ink); font-variant-numeric: tabular-nums; }
.pg-scrub { position: relative; display: inline-block; padding: 0 3px; border-radius: 5px; color: var(--pg-accent-ink, var(--pg-ink)); font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; cursor: ew-resize; touch-action: none; user-select: none; -webkit-user-select: none; background: color-mix(in oklab, var(--pg-accent) 10%, transparent); box-shadow: inset 0 -2px 0 var(--pg-accent); transition: background var(--pg-base); }
.pg-scrub:hover, .pg-scrub.pg-grab { background: color-mix(in oklab, var(--pg-accent) 18%, transparent); }
.pg-scrub:focus-visible { outline: 2px solid var(--ring); outline-offset: 1px; }
.pg-scrub input { width: 6ch; padding: 0; border: 0; background: none; outline: none; font: inherit; color: inherit; text-align: center; }
.pg-scrub[data-agent]::after { top: -12px; }
.pg-answer { display: grid; gap: 2px; }
.pg-answer > .pg-label { margin: 0; }
.pg-answer > strong { display: flex; align-items: center; gap: 8px; font-size: var(--pg-text-hero); line-height: 1.15; font-weight: 600; letter-spacing: -.02em; color: var(--pg-ink); font-variant-numeric: proportional-nums; }
.pg-answer > span { font-size: var(--pg-text-body); line-height: 1.45; color: var(--pg-body); }
.pg-answer > .pg-label + strong { margin-top: 4px; }
.pg-answer > strong + span { margin-top: 2px; }
.pg-answer[data-long] > strong { font-size: 22px; letter-spacing: -.012em; }
.pg-tone { display: inline-grid; place-items: center; flex-shrink: 0; width: 18px; height: 18px; border-radius: 50%; background: var(--t); color: var(--card); font-size: 11px; font-style: normal; font-weight: 700; letter-spacing: 0; line-height: 1; }
.pg-tone[data-tone=good] { --t: var(--pg-good); } .pg-tone[data-tone=warn] { --t: var(--pg-warn); } .pg-tone[data-tone=bad] { --t: var(--pg-bad); }
.pg-breakdown { display: grid; gap: 12px; }
.pg-breakdown > .pg-bar { display: flex; height: 10px; gap: 2px; overflow: hidden; border-radius: 5px; }
.pg-breakdown > .pg-bar > i { min-width: 2px; background: var(--seg); transition: flex-grow .35s var(--pg-ease, ease); }
.pg-breakdown > ul { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
.pg-breakdown li { display: grid; grid-template-columns: 10px minmax(0, 1fr) auto; align-items: center; gap: 8px; font-size: var(--pg-text-body); color: var(--pg-body); }
.pg-breakdown li::before { content: ""; width: 10px; height: 10px; border-radius: 3px; background: var(--seg); }
.pg-breakdown li > b { font-weight: 500; color: var(--pg-ink); font-variant-numeric: tabular-nums; }
/* The run bar: play and the time. On its own it has a scrubber; tied to a chart (data-chart), you scrub by dragging on the chart. */
.pg-run { --pg-c: var(--pg-ink); display: flex; align-items: center; gap: 10px; }
.pg-run > button { flex-shrink: 0; width: 28px; height: 28px; }
.pg-run input[type=range] { flex: 1; min-width: 0; }
.pg-run[data-chart] input[type=range] { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.pg-run output { font-size: var(--pg-text-label); font-weight: 500; color: var(--pg-ink); font-variant-numeric: tabular-nums; white-space: nowrap; }
.pg-run[data-chart] { gap: 8px; }
.pg-run[data-chart] > button { width: 28px; height: 28px; }
.pg-run[data-chart] output { font-weight: 400; color: var(--pg-body); }
.pg-chart-head { display: flex; align-items: center; gap: 12px; min-height: 28px; }
.pg-chart-head > .pg-chart-legend { margin-left: auto; justify-content: flex-end; }
/* Result: the answer beside what explains it (a breakdown, or a few stats). */
.pg-result { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); column-gap: 24px; row-gap: 16px; align-items: center; }
.pg-result.pg-surface { padding: 18px 20px; }
.pg-result > * { margin-top: 0 !important; }
.pg-result > .pg-notes, .pg-result > p { grid-column: 1 / -1; margin: 0; font-size: var(--pg-text-meta); line-height: 1.45; color: var(--pg-meta); }
.pg-result:has(> .pg-stats) { grid-template-columns: minmax(0, 1fr) auto; align-items: end; }
.pg-stats { display: grid; gap: 8px; margin: 0; text-align: right; }
.pg-stats dt { font-size: var(--pg-text-label); font-weight: 500; color: var(--pg-meta); }
.pg-stats dd { margin: 2px 0 0; font-size: 16px; font-weight: 600; color: var(--pg-ink); font-variant-numeric: tabular-nums; }
@container (max-width: 460px) {
  .pg-result, .pg-result:has(> .pg-stats) { grid-template-columns: 1fr; }
  .pg-stats { grid-template-columns: 1fr 1fr; text-align: left; }
}
/* Game set: whose turn it is, and a new-game button, above the board. */
.pg-turn { max-width: 440px; display: flex; align-items: center; gap: 8px; min-height: 32px; font-size: var(--pg-text-body); font-weight: 600; color: var(--pg-ink); }
.pg-turn > i { width: 10px; height: 10px; border-radius: 50%; background: var(--piece, var(--pg-meta)); box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--foreground) 15%, transparent); }
.pg-turn[data-turn=me] > i { animation: pg-blink .9s ease-in-out infinite alternate; }
.pg-turn > span { flex-shrink: 0; white-space: nowrap; }
.pg-turn > small { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--pg-text-meta); font-weight: 400; color: var(--pg-meta); }
.pg-turn > button { flex-shrink: 0; white-space: nowrap; }
.pg-turn > .pg-btn[data-primary] { background: var(--pg-ink); border-color: var(--pg-ink); color: var(--card); }
.pg-turn > button { margin-left: auto; }
.pg-turn > button + button { margin-left: 0; }
.pg-turn > .pg-tone { width: 18px; height: 18px; animation: none; box-shadow: none; }
/* Guide set: one step at a time, with progress and Back/Next. */
.pg-guide { display: grid; gap: 14px; }
.pg-guide-head { display: grid; gap: 8px; }
.pg-guide-head > p { margin: 0; font-size: var(--pg-text-label); font-weight: 500; color: var(--pg-meta); font-variant-numeric: tabular-nums; }
.pg-guide-bar { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: 4px; }
.pg-guide-bar > i { height: 4px; border-radius: 2px; background: var(--pg-hairline); }
.pg-guide-bar > i[data-on] { background: var(--pg-accent); }
.pg-guide > section[data-step] { display: grid; gap: 8px; }
.pg-guide > section[data-step][hidden] { display: none; }
.pg-guide > section > :is(h3, h4) { margin: 4px 0 0; font-size: 15px; line-height: 1.3; font-weight: 600; color: var(--pg-ink); }
.pg-guide > section > p { margin: 0; max-width: 62ch; font-size: var(--pg-text-body); line-height: 1.5; color: var(--pg-body); }
.pg-guide > section > :is(svg, figure, .pg-figure) { display: block; width: 100%; height: auto; max-height: 260px; margin: 0; border-radius: var(--pg-radius-group); background: var(--card); box-shadow: var(--pg-edge); }
.pg-guide-nav { display: flex; align-items: center; gap: 8px; padding-top: 12px; border-top: 1px solid var(--pg-hairline); }
.pg-guide-nav > span { margin-right: auto; font-size: var(--pg-text-meta); color: var(--pg-meta); font-variant-numeric: tabular-nums; }
.pg-guide-nav > button[data-primary] { background: var(--pg-ink); border-color: var(--pg-ink); color: var(--card); }
/* Photos: one tall photo beside two stacked ones (or one or two). Broken links disappear. */
[data-pg=photos] { display: grid; grid-template-columns: 3fr 2fr; grid-template-rows: 1fr 1fr; gap: 4px; height: 240px; border-radius: var(--pg-radius-panel); overflow: hidden; }
[data-pg=photos] > img { width: 100%; height: 100%; min-height: 0; aspect-ratio: auto; border-radius: 0; object-fit: cover; display: block; background: var(--pg-stage); }
[data-pg=photos] > img:first-child { grid-row: span 2; }
[data-pg=photos]:has(> img:only-child) { grid-template-columns: 1fr; }
[data-pg=photos]:has(> img:nth-child(2):last-child) > img { grid-row: span 2; }
/* Anatomy figures (skills.wheresryan.sh/anatomy) sit in the card instead of on their own page. */
body.iso { background: transparent; }
body.iso .iso-page { width: 100%; margin: 0 auto; }
:where(.pg-turn + [data-pg=board]) { max-width: 440px; margin-top: var(--pg-space-2); }
`;

// Runs inside the bridge, after controls.ts's runtime, sharing its scope.
// It must not contain backticks or "${".
export const SETS_RUNTIME = String.raw`
  // Calculator set: a number inside a sentence that you drag left or right, or click to type.
  BUILD.scrub = function (el, name) {
    const s = specs[name];
    el.classList.add("pg-scrub"); el.tabIndex = 0; el.setAttribute("role", "slider"); el.setAttribute("aria-label", s.label);
    let drag = null, moved = false;
    const t = () => norm(s, values[name]);
    el.addEventListener("pointerdown", (e) => { if (e.button !== 0 || el.querySelector("input")) return; e.preventDefault(); el.setPointerCapture(e.pointerId); drag = { x: e.clientX, t: t() }; moved = false; el.classList.add("pg-grab"); });
    el.addEventListener("pointermove", (e) => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 2) moved = true; if (moved) set(name, denorm(s, drag.t + dx / (e.shiftKey ? 900 : 300))); });
    el.addEventListener("pointerup", () => {
      el.classList.remove("pg-grab"); const was = drag; drag = null;
      if (!was || moved) return;
      const input = document.createElement("input"); input.type = "number"; input.value = String(values[name]); input.step = String(s.step || "any");
      el.replaceChildren(input); input.focus(); input.select();
      let closed = false;
      const done = (commit) => { if (closed) return; closed = true; const typed = input.value; input.remove(); if (commit && typed !== "") set(name, Number(typed)); el.__paint(); el.focus(); };
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") done(true); if (e.key === "Escape") done(false); });
      input.addEventListener("blur", () => done(true), { once: true });
    });
    el.addEventListener("pointercancel", () => { drag = null; el.classList.remove("pg-grab"); });
    el.addEventListener("keydown", (e) => { const step = { ArrowUp: .02, ArrowRight: .02, ArrowDown: -.02, ArrowLeft: -.02 }[e.key]; if (step) { e.preventDefault(); set(name, denorm(s, t() + step)); } });
    return () => {
      if (el.querySelector("input")) return;
      const prefix = attr(el, "prefix", "");
      el.textContent = prefix + format(values[name], { ...s, unit: s.unit });
      el.setAttribute("aria-valuetext", el.textContent);
    };
  };
  const TONES = { good: "\u2713", warn: "!", bad: "\u00d7" };
  function answer(name, a) {
    const o = a || {};
    outputs[name] = { value: o.value, label: o.label || null, detail: o.detail || null, tone: o.tone || null };
    for (const el of document.querySelectorAll('[data-pg="answer"][data-name="' + name + '"]')) {
      el.classList.add("pg-answer"); el.setAttribute("aria-live", "polite");
      const label = document.createElement("p"); label.className = "pg-label"; label.textContent = o.label || attr(el, "label", "");
      const value = document.createElement("strong");
      if (TONES[o.tone]) { const t = document.createElement("i"); t.className = "pg-tone"; t.dataset.tone = o.tone; t.setAttribute("aria-hidden", "true"); t.textContent = TONES[o.tone]; value.append(t); }
      value.append(String(o.value ?? ""));
      const detail = document.createElement("span"); detail.textContent = o.detail || "";
      el.replaceChildren(...[label.textContent ? label : null, value, o.detail ? detail : null].filter(Boolean));
      if (o.tone) el.dataset.tone = o.tone; else delete el.dataset.tone;
      if (String(o.value ?? "").length > 14) el.dataset.long = ""; else delete el.dataset.long;
    }
  }
  const SEGMENTS = [1, 2, 3, 4, 5, 6, 7].map((i) => "var(--pg-series-" + i + ")");
  // breakdown(name, [{ label, value, display }]): where a total goes, as one bar and a legend.
  function breakdown(name, parts) {
    const list = (Array.isArray(parts) ? parts : []).filter((p) => p && Number(p.value) > 0);
    outputs[name] = { value: list.map((p) => ({ label: p.label, value: p.value })) };
    for (const el of document.querySelectorAll('[data-pg="breakdown"][data-name="' + name + '"]')) {
      el.classList.add("pg-breakdown");
      const bar = document.createElement("div"); bar.className = "pg-bar"; bar.setAttribute("aria-hidden", "true");
      const legend = document.createElement("ul");
      list.forEach((p, i) => {
        const seg = p.color || SEGMENTS[i % SEGMENTS.length];
        const piece = document.createElement("i"); piece.style.setProperty("--seg", seg); piece.style.flexGrow = String(p.value); bar.append(piece);
        const li = document.createElement("li"); li.style.setProperty("--seg", seg);
        const label = document.createElement("span"); label.textContent = p.label;
        const value = document.createElement("b"); value.textContent = p.display || format(p.value, {});
        li.append(label, value); legend.append(li);
      });
      el.replaceChildren(bar, legend);
    }
  }

  // A run bar: play, pause, replay and scrub time. ui.run(name, { tick(dt, t), seek(t) }).
  // With data-chart="<chart name>" it sits above that chart and dragging on the chart scrubs.
  const runs = {};
  function runBar(el) {
    el.classList.add("pg-run");
    const name = attr(el, "name", "run"), duration = num(el, "duration", 30), unit = attr(el, "unit", "s");
    const target = attr(el, "chart", "");
    el.innerHTML = (target ? '<button type="button" class="pg-icon-btn">' : '<button type="button" class="pg-icon-btn" data-primary>') + '</button><input type="range" min="0" step="0.01"><output></output>';
    const [play, scrub, out] = el.children;
    const REPLAY = '<svg class="pg-glyph" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5a5.5 5.5 0 1 1-5.2 3.8.8.8 0 1 1 1.5.5A4 4 0 1 0 8 4h-1l1.2 1.2-1.1 1.1L4.9 4.1 7.1 1.9l1.1 1.1L7.4 3H8Z"/></svg>';
    scrub.max = String(duration); scrub.setAttribute("aria-label", "Time");
    const r = { t: 0, playing: false, frame: 0, last: 0, visible: true, handlers: null, duration };
    const paint = () => { scrub.value = String(r.t); scrub.style.setProperty("--pg-fill", (clamp(r.t / r.duration, 0, 1) * 100).toFixed(1) + "%"); out.textContent = format(Number(r.t.toFixed(1)), { step: .1 }) + " " + unit; const ended = !r.playing && r.t >= r.duration; play.innerHTML = ended ? REPLAY : icon(r.playing ? "pause" : "play"); play.setAttribute("aria-label", ended ? "Replay" : r.playing ? "Pause" : "Play"); };
    const tick = (now) => {
      r.frame = 0;
      if (!r.playing || !r.visible || document.hidden) { r.last = 0; return; }
      const dt = r.last ? Math.min(.05, (now - r.last) / 1000) : 1 / 60; r.last = now;
      r.t += dt * num(el, "speed", 1);
      if (r.t >= r.duration) { r.t = r.duration; r.playing = false; r.handlers && r.handlers.end && r.handlers.end(); }
      r.handlers && r.handlers.tick && r.handlers.tick(dt * num(el, "speed", 1), r.t);
      paint();
      if (r.playing) r.frame = requestAnimationFrame(tick);
    };
    const kick = () => { if (r.playing && r.visible && !r.frame) r.frame = requestAnimationFrame(tick); };
    new IntersectionObserver((entries) => { r.visible = entries[entries.length - 1].isIntersecting; kick(); }).observe(el);
    document.addEventListener("visibilitychange", kick);
    r.api = {
      get t() { return r.t; }, get playing() { return r.playing; },
      play() { if (r.t >= r.duration) r.t = 0; r.playing = true; paint(); kick(); },
      pause() { r.playing = false; if (r.frame) cancelAnimationFrame(r.frame); r.frame = 0; r.last = 0; paint(); },
      seek(t) { r.t = clamp(Number(t) || 0, 0, r.duration); r.handlers && r.handlers.seek && r.handlers.seek(r.t); paint(); },
      length(seconds) { r.duration = Math.max(1, Number(seconds) || r.duration); scrub.max = String(r.duration); paint(); },
    };
    play.onclick = () => (r.playing ? r.api.pause() : r.api.play());
    scrub.addEventListener("input", () => { r.api.pause(); r.api.seek(Number(scrub.value)); });
    if (target) afterHydrate.push(() => {
      const fig = document.querySelector('[data-pg="chart"][data-name="' + target + '"]'), c = fig && fig.__chart;
      if (!c) return;
      fig.dataset.seek = "";
      const head = document.createElement("div"); head.className = "pg-chart-head"; fig.insertBefore(head, c.legend); head.append(el, c.legend);
      const at = (e) => { if (!c.ix) return; r.api.pause(); r.api.seek(c.ix(e.clientX - c.svg.getBoundingClientRect().left)); };
      c.svg.addEventListener("pointerdown", (e) => { c.svg.setPointerCapture(e.pointerId); at(e); });
      c.svg.addEventListener("pointermove", (e) => { if (c.svg.hasPointerCapture(e.pointerId)) at(e); });
    });
    runs[name] = r; paint();
  }
  function run(name, handlers) {
    ready();
    const r = runs[name];
    if (!r) throw new Error("No run bar named " + name);
    r.handlers = handlers || {};
    if (attr(document.querySelector('[data-pg="run"][data-name="' + name + '"]'), "autoplay", "true") !== "false" && !reduced) r.api.play();
    return r.api;
  }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Game set: ui.game({ board, you, me, first, move(board, move, who), winner(board), fromCell(row, col), say(move) }).
  // A tap on the board and the agent's move action take one path. Each of your moves is
  // emitted as a "move" event, so the agent waiting on watch answers without a chat message.
  let theGame = null;
  const allValues = () => JSON.parse(JSON.stringify(values));
  function paintTurn() {
    const g = theGame; if (!g) return;
    const turn = values.turn, w = g.winner(values[g.board], allValues());
    const piece = (who) => { const el = document.querySelector('[data-pg="board"][data-param="' + g.board + '"]'); const hit = attr(el || document.body, "pieces", "").split(",").map((x) => x.split(":")).find((x) => x[0].trim() === who); return hit ? (hit[1] || "").trim() : ""; };
    for (const el of document.querySelectorAll('[data-pg="turn"]')) {
      el.dataset.turn = turn === g.you ? "you" : turn === g.me ? "me" : turn === "setup" ? "setup" : "done";
      const dot = document.createElement("i");
      const text = document.createElement("span"), note = document.createElement("small");
      const buttons = [];
      if (turn === "setup") {
        dot.style.setProperty("--piece", "var(--pg-meta)");
        text.textContent = g.setupText;
        const go = document.createElement("button"); go.type = "button"; go.className = "pg-btn"; go.dataset.primary = ""; go.textContent = g.startLabel; go.onclick = () => startGame("user");
        buttons.push(go);
      } else if (turn === "done") {
        const tone = w === g.you ? "good" : w === g.me ? "bad" : "";
        text.textContent = w === g.you ? "You win" : w === g.me ? "I win" : "Draw";
        if (tone) { dot.className = "pg-tone"; dot.dataset.tone = tone; dot.textContent = tone === "good" ? "✓" : "×"; } else dot.style.setProperty("--piece", "var(--pg-meta)");
      } else {
        dot.style.setProperty("--piece", piece(turn) || "var(--pg-meta)");
        text.textContent = turn === g.you ? "Your turn" : "My turn";
        note.textContent = turn === g.me ? "thinking" : g.last ? "I played " + g.last : "";
      }
      if (turn !== "setup") { const again = document.createElement("button"); again.type = "button"; again.className = "pg-btn"; again.textContent = "New game"; again.onclick = () => newGame("user"); buttons.push(again); }
      el.replaceChildren(...[dot, text, note.textContent ? note : null, ...buttons].filter(Boolean));
      el.setAttribute("aria-live", "polite");
    }
    outputs.game = { value: { turn, winner: w || null, last: g.last || null } };
  }
  function applyAll(all, from) { for (const k of Object.keys(all)) if (specs[k] && JSON.stringify(all[k]) !== JSON.stringify(values[k])) set(k, all[k], from); }
  function newGame(from) {
    const g = theGame;
    const all = allValues(); all[g.board] = g.start(all); applyAll(all, "remote");
    set("turn", g.setup ? "setup" : g.first, "remote"); g.last = null; persist(); paintTurn();
    if (from === "user") api.emit("new-game", { turn: values.turn });
    else lane("Started a new game.");
    return { turn: values.turn };
  }
  function startGame(from) {
    const g = theGame;
    if (values.turn !== "setup") throw new Error("The game has already started");
    set("turn", g.first, "remote"); persist(); paintTurn();
    if (from === "user") api.emit("start", { turn: values.turn }); else lane("Started.");
    return { turn: values.turn };
  }
  function playMove(m, who) {
    const g = theGame;
    if (!g) throw new Error("No game on this card");
    if (values.turn === "done") throw new Error("The game is over; start a new one");
    if (values.turn === "setup") throw new Error("The game hasn't started yet");
    if (values.turn !== who) throw new Error(who === g.me ? "It's the player's turn" : "It's not your turn");
    const all = allValues();
    const next = g.move(all[g.board], m, who, all);
    if (!next) throw new Error("That move isn't allowed");
    all[g.board] = next;
    const w = g.winner(next, all), said = g.say(m, all, who);
    applyAll(all, "remote");
    set("turn", w ? "done" : g.again && g.again(m, all, who) ? who : who === g.you ? g.me : g.you, "remote");
    persist();
    if (who === g.me) { g.last = said; lane("Played " + said + "."); }
    paintTurn();
    if (who === g.you) api.emit("move", { move: m, said, turn: values.turn, winner: w || null });
    return { played: said, turn: values.turn, winner: w || null };
  }
  function game(spec) {
    ready();
    const g = theGame = { board: "board", you: "you", me: "me", say: (m) => (typeof m === "number" ? "column " + (m + 1) : String(m)), fromCell: (r, c) => c, winner: () => null, setupText: "Set up", startLabel: "Start", ...spec };
    if (!specs[g.board]) throw new Error("No board parameter " + g.board);
    g.first = g.first || g.you;
    g.start = g.start || (() => specs[g.board].default);
    const fresh = !("turn" in restored);
    define("turn", { label: "Turn", options: [{ value: g.you }, { value: g.me }, { value: "done" }, { value: "setup" }], default: g.setup ? "setup" : g.first });
    if (fresh) { const all = allValues(); all[g.board] = g.start(all); applyAll(all, "remote"); persist(); }
    on("select", ({ name, row, col, from }) => {
      if (name !== g.board) return;
      if (values.turn === "setup") { if (from === "agent") throw new Error("The game hasn't started yet"); return; }
      try { playMove(g.fromCell(row, col), from === "agent" ? g.me : g.you); } catch (e) { if (from === "agent") throw e; }
    });
    on("change", ({ name }) => { if (name === "turn") paintTurn(); });
    paintTurn();
    return { play: (m) => playMove(m, g.you), newGame: () => newGame("user"), start: () => startGame("user") };
  }

  // Guide set: <div data-pg="guide" data-param="step"> with <section data-step> children.
  // The step is a parameter, so you jump with setParams({ step: 5 }).
  function guide(el) {
    const name = el.dataset.param || "step", steps = [...el.querySelectorAll(":scope > [data-step]")];
    if (!steps.length) return;
    el.classList.add("pg-guide");
    if (!specs[name]) define(name, { label: attr(el, "label", "Step"), min: 1, max: steps.length, step: 1, default: 1 });
    const head = document.createElement("div"); head.className = "pg-guide-head";
    const count = document.createElement("p"), bar = document.createElement("div"); bar.className = "pg-guide-bar"; bar.style.setProperty("--n", String(steps.length));
    bar.innerHTML = steps.map(() => "<i></i>").join(""); head.append(count, bar); el.prepend(head);
    const nav = document.createElement("div"); nav.className = "pg-guide-nav";
    const where = document.createElement("span");
    const back = document.createElement("button"); back.type = "button"; back.className = "pg-btn"; back.textContent = "Back";
    const next = document.createElement("button"); next.type = "button"; next.className = "pg-btn"; next.dataset.primary = "";
    nav.append(where, back, next); el.append(nav);
    back.onclick = () => set(name, values[name] - 1, "user");
    next.onclick = () => set(name, Math.min(steps.length, values[name] + 1), "user");
    const paint = () => {
      const at = clamp(Math.round(values[name]), 1, steps.length);
      steps.forEach((sec, i) => { sec.hidden = i + 1 !== at; });
      count.textContent = attr(el, "label", "Step") + " " + at + " of " + steps.length;
      [...bar.children].forEach((b, i) => { if (i < at) b.dataset.on = ""; else delete b.dataset.on; });
      where.textContent = at + " / " + steps.length;
      back.disabled = at === 1; next.disabled = at === steps.length;
      next.textContent = at === steps.length ? "Done" : "Next";
      el.dataset.param = name;
    };
    el.__paint = paint; paint();
    on("change", (e) => { if (e.name === name) paint(); });
  }
  function photos(el) {
    el.classList.add("pg-photos");
    for (const img of el.querySelectorAll("img")) {
      img.loading = "lazy"; img.decoding = "async";
      img.addEventListener("error", () => { if (img.dataset.retry === "") { img.dataset.retry = "done"; return; } img.remove(); if (!el.querySelector("img")) el.hidden = true; });
    }
  }
  addEventListener("error", (e) => {
    const img = e.target;
    if (img && img.tagName === "IMG" && /^https:\/\/thumb\.wikimedia\.org\//.test(img.src)) { img.dataset.retry = ""; img.src = img.src.replace("https://thumb.wikimedia.org/", "https://upload.wikimedia.org/"); }
  }, true);
  Object.assign(SET_KINDS, { run: runBar, turn: (el) => el.classList.add("pg-turn"), guide, photos });
  Object.assign(SET_UI, { answer: readyFirst(answer), breakdown: readyFirst(breakdown), run, game });
  Object.assign(SET_ACTIONS, {
    move: (m) => playMove(m, theGame ? theGame.me : null),
    newGame: () => newGame("agent"),
    start: () => startGame("agent"),
    seek: (name, t) => { const r = runs[String(name)]; if (!r) throw new Error("No run bar " + name); r.api.pause(); r.api.seek(t); lane("Moved to " + format(Number(t), { step: .1 }) + "."); return { t: r.t }; },
    run: (name, on) => { const r = runs[String(name)]; if (!r) throw new Error("No run bar " + name); if (on === false) r.api.pause(); else r.api.play(); return { playing: r.playing }; },
  });
`;
