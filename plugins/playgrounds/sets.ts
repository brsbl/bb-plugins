// Higher-level component sets, composed from the base library in controls.ts.
// Calculator set: scrubbable numbers inside a sentence, one answer, a breakdown bar.
// Simulation set: a run bar (play, pause, scrub) driving the base chart, which
// shows the run with a "now" marker and its events. The music set lives in controls.ts.

export const SETS_CSS = String.raw`
.pg-sentence { margin-bottom: 0; font-size: 15px; line-height: 1.7; color: var(--pg-body); text-wrap: pretty; }
.pg-scrub { position: relative; display: inline-block; padding: 0 2px; border-radius: 4px; color: var(--pg-accent-ink, var(--pg-ink)); font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; cursor: ew-resize; touch-action: none; user-select: none; -webkit-user-select: none; background: color-mix(in srgb, var(--pg-accent) 10%, transparent); box-shadow: inset 0 -1.5px 0 color-mix(in srgb, var(--pg-accent) 55%, transparent); transition: background .15s; }
.pg-scrub:hover, .pg-scrub.pg-grab { background: color-mix(in srgb, var(--pg-accent) 18%, transparent); }
.pg-scrub:focus-visible { outline: 2px solid var(--ring); outline-offset: 1px; }
.pg-scrub input { width: 6ch; padding: 0; border: 0; background: none; outline: none; font: inherit; color: inherit; text-align: center; }
.pg-scrub[data-agent]::after { top: -12px; }
.pg-answer { display: grid; gap: 2px; }
.pg-answer > .pg-label { margin: 0; }
.pg-answer > strong { display: flex; align-items: center; gap: 8px; font-size: 24px; line-height: 1.2; font-weight: 600; letter-spacing: -.015em; color: var(--pg-ink); font-variant-numeric: proportional-nums; }
.pg-answer > span { font-size: 12.5px; line-height: 1.45; color: var(--pg-body); }
.pg-answer > .pg-label + strong { margin-top: 2px; }
.pg-answer[data-long] > strong { font-size: 20px; letter-spacing: -.01em; }
.pg-tone { display: inline-grid; place-items: center; flex-shrink: 0; width: 16px; height: 16px; border-radius: 50%; background: var(--t); color: var(--card); font-size: 10px; font-style: normal; font-weight: 700; letter-spacing: 0; line-height: 1; }
.pg-tone[data-tone=good] { --t: var(--pg-good); } .pg-tone[data-tone=warn] { --t: var(--pg-warn); } .pg-tone[data-tone=bad] { --t: var(--pg-bad); }
.pg-breakdown { display: grid; gap: 10px; }
.pg-breakdown > .pg-bar { display: flex; height: 12px; gap: 2px; overflow: hidden; border-radius: 6px; background: var(--pg-hairline); }
.pg-breakdown > .pg-bar > i { min-width: 2px; background: var(--seg); transition: flex-grow .35s var(--pg-ease, ease); }
.pg-breakdown > ul { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
.pg-breakdown li { display: grid; grid-template-columns: 10px minmax(0, 1fr) auto; align-items: center; gap: 8px; font-size: 12px; color: var(--pg-body); }
.pg-breakdown li::before { content: ""; width: 10px; height: 10px; border-radius: 3px; background: var(--seg); }
.pg-breakdown li > b { font-weight: 500; color: var(--pg-ink); font-variant-numeric: tabular-nums; }
/* The run bar: play and the time. On its own it has a scrubber; tied to a chart (data-chart), you scrub by dragging on the chart. */
.pg-run { display: flex; align-items: center; gap: 10px; }
.pg-run > button { flex-shrink: 0; width: 28px; height: 28px; }
.pg-run input[type=range] { flex: 1; min-width: 0; height: 18px; margin: 0; accent-color: var(--pg-ink); }
.pg-run[data-chart] input[type=range] { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.pg-run output { font-size: 12px; font-weight: 500; color: var(--pg-ink); font-variant-numeric: tabular-nums; white-space: nowrap; }
.pg-run[data-chart] { gap: 8px; }
.pg-run[data-chart] > button { width: 26px; height: 26px; }
.pg-run[data-chart] output { font-weight: 400; color: var(--pg-body); }
.pg-chart-head { display: flex; align-items: center; gap: 12px; min-height: 26px; }
.pg-chart-head > .pg-chart-legend { margin-left: auto; justify-content: flex-end; }
/* Result: the answer beside what explains it (a breakdown, or a few stats). */
.pg-result { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); column-gap: 24px; row-gap: 14px; align-items: start; }
.pg-result.pg-surface { padding: 16px; }
.pg-result > * { margin-top: 0 !important; }
.pg-result > .pg-breakdown { padding-top: 3px; }
.pg-result > .pg-notes, .pg-result > p { grid-column: 1 / -1; margin: 0; font-size: 12px; line-height: 1.45; color: var(--pg-meta); }
.pg-result:has(> .pg-stats) { grid-template-columns: minmax(0, 1fr) auto; align-items: end; }
.pg-stats { display: grid; gap: 8px; margin: 0; text-align: right; }
.pg-stats dt { font-size: 11px; font-weight: 500; color: var(--pg-meta); }
.pg-stats dd { margin: 1px 0 0; font-size: 15px; font-weight: 500; color: var(--pg-ink); font-variant-numeric: tabular-nums; }
@container (max-width: 420px) {
  .pg-result, .pg-result:has(> .pg-stats) { grid-template-columns: 1fr; }
  .pg-stats { grid-template-columns: 1fr 1fr; text-align: left; }
}
.pg-sentence { max-width: 62ch; }
/* Game set: whose turn it is, and a new-game button, above the board. */
.pg-turn { display: flex; align-items: center; gap: 8px; min-height: 30px; font-size: 13px; font-weight: 500; color: var(--pg-ink); }
.pg-turn > i { width: 10px; height: 10px; border-radius: 50%; background: var(--piece, var(--pg-meta)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--foreground) 15%, transparent); }
.pg-turn[data-turn=me] > i { animation: pg-blink .9s ease-in-out infinite alternate; }
.pg-turn > small { font-size: 12px; font-weight: 400; color: var(--pg-meta); }
.pg-turn > button { margin-left: auto; }
.pg-turn > .pg-tone { width: 16px; height: 16px; animation: none; box-shadow: none; }
:where(.pg-turn + [data-pg=board]) { max-width: 420px; margin-top: 10px; }
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
      const done = (commit) => { if (commit && input.value !== "") set(name, Number(input.value)); el.__paint(); el.focus(); };
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
  const SEGMENTS = ["var(--pg-accent)", "color-mix(in srgb, var(--pg-accent) 62%, var(--card))", "color-mix(in srgb, var(--pg-accent) 36%, var(--card))", "color-mix(in srgb, var(--foreground) 35%, var(--card))", "color-mix(in srgb, var(--foreground) 18%, var(--card))"];
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
    const paint = () => { scrub.value = String(r.t); out.textContent = format(Number(r.t.toFixed(1)), { step: .1 }) + " " + unit; const ended = !r.playing && r.t >= r.duration; play.innerHTML = ended ? REPLAY : icon(r.playing ? "pause" : "play"); play.setAttribute("aria-label", ended ? "Replay" : r.playing ? "Pause" : "Play"); };
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
  function paintTurn() {
    const g = theGame; if (!g) return;
    const turn = values.turn, w = g.winner(values[g.board]);
    const piece = (who) => { const el = document.querySelector('[data-pg="board"][data-param="' + g.board + '"]'); const hit = attr(el || document.body, "pieces", "").split(",").map((x) => x.split(":")).find((x) => x[0].trim() === who); return hit ? (hit[1] || "").trim() : ""; };
    for (const el of document.querySelectorAll('[data-pg="turn"]')) {
      el.dataset.turn = turn === g.you ? "you" : turn === g.me ? "me" : "done";
      const dot = document.createElement("i");
      const text = document.createElement("span"), note = document.createElement("small");
      if (turn === "done") {
        const tone = w === g.you ? "good" : w === g.me ? "bad" : "";
        text.textContent = w === g.you ? "You win" : w === g.me ? "I win" : "Draw";
        if (tone) { dot.className = "pg-tone"; dot.dataset.tone = tone; dot.textContent = tone === "good" ? "\u2713" : "\u00d7"; } else dot.style.setProperty("--piece", "var(--pg-meta)");
      } else {
        dot.style.setProperty("--piece", piece(turn) || "var(--pg-meta)");
        text.textContent = turn === g.you ? "Your turn" : "My turn";
        note.textContent = turn === g.me ? "thinking" : g.last ? "I played " + g.last : "";
      }
      const again = document.createElement("button"); again.type = "button"; again.className = "pg-btn"; again.textContent = "New game"; again.onclick = () => newGame("user");
      el.replaceChildren(...[dot, text, note.textContent ? note : null, again].filter(Boolean));
      el.setAttribute("aria-live", "polite");
    }
    outputs.game = { value: { turn, winner: w || null, last: g.last || null } };
  }
  function newGame(from) {
    const g = theGame;
    set(g.board, g.start(), from === "agent" ? "remote" : "user"); set("turn", g.first, "remote"); g.last = null; persist(); paintTurn();
    if (from === "user") api.emit("new-game", { turn: g.first });
    else lane("Started a new game.");
    return { turn: values.turn };
  }
  function playMove(m, who) {
    const g = theGame;
    if (!g) throw new Error("No game on this card");
    if (values.turn === "done") throw new Error("The game is over; start a new one");
    if (values.turn !== who) throw new Error(who === g.me ? "It's the player's turn" : "It's not your turn");
    const next = g.move(JSON.parse(JSON.stringify(values[g.board])), m, who);
    if (!next) throw new Error("That move isn't allowed");
    const w = g.winner(next), said = g.say(m);
    set(g.board, next, "remote");
    set("turn", w ? "done" : who === g.you ? g.me : g.you, "remote");
    persist();
    if (who === g.me) { g.last = said; lane("Played " + said + "."); }
    paintTurn();
    if (who === g.you) api.emit("move", { move: m, said, turn: values.turn, winner: w || null });
    return { played: said, turn: values.turn, winner: w || null };
  }
  function game(spec) {
    ready();
    const g = theGame = { board: "board", you: "you", me: "me", say: (m) => (typeof m === "number" ? "column " + (m + 1) : String(m)), fromCell: (r, c) => c, winner: () => null, ...spec };
    if (!specs[g.board]) throw new Error("No board parameter " + g.board);
    g.first = g.first || g.you;
    g.start = g.start || (() => specs[g.board].default);
    define("turn", { label: "Turn", options: [{ value: g.you }, { value: g.me }, { value: "done" }], default: g.first });
    on("select", ({ name, row, col, from }) => {
      if (name !== g.board) return;
      try { playMove(g.fromCell(row, col), from === "agent" ? g.me : g.you); } catch (e) { if (from === "agent") throw e; }
    });
    on("change", ({ name }) => { if (name === "turn") paintTurn(); });
    paintTurn();
    return { play: (m) => playMove(m, g.you), newGame: () => newGame("user") };
  }
  Object.assign(SET_KINDS, { run: runBar, turn: (el) => el.classList.add("pg-turn") });
  Object.assign(SET_UI, { answer: readyFirst(answer), breakdown: readyFirst(breakdown), run, game });
  Object.assign(SET_ACTIONS, {
    move: (m) => playMove(m, theGame ? theGame.me : null),
    newGame: () => newGame("agent"),
    seek: (name, t) => { const r = runs[String(name)]; if (!r) throw new Error("No run bar " + name); r.api.pause(); r.api.seek(t); lane("Moved to " + format(Number(t), { step: .1 }) + "."); return { t: r.t }; },
    run: (name, on) => { const r = runs[String(name)]; if (!r) throw new Error("No run bar " + name); if (on === false) r.api.pause(); else r.api.play(); return { playing: r.playing }; },
  });
`;
