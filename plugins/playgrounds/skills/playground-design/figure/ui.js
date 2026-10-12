// Shared playground helpers. The builder inlines this file as `ui` in every card.
const ui = (() => {
  const SVG = 'http://www.w3.org/2000/svg';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  // Numbers the way a person writes them: one precision per value, no trailing zeros.
  function fmt(value, { digits = 0, unit = '', sign = false, compact = false, percent = false } = {}) {
    if (!Number.isFinite(value)) return '—';
    const options = { maximumFractionDigits: digits, minimumFractionDigits: 0 };
    if (compact) Object.assign(options, { notation: 'compact', maximumFractionDigits: 1 });
    let text = new Intl.NumberFormat('en-US', options).format(percent ? value * 100 : value);
    if (sign && value > 0) text = '+' + text;
    if (percent) text += '%';
    return unit ? `${text}${/^[%/°]/.test(unit) ? '' : ' '}${unit}` : text;
  }

  function ticks(min, max, count = 4) {
    const span = max - min;
    if (!(span > 0)) return [min];
    const raw = span / count, power = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => span / s <= count) ?? power * 10;
    const out = [];
    for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) out.push(Number(v.toFixed(10)));
    return out;
  }

  const el = (name, attrs = {}, text) => {
    const node = document.createElementNS(SVG, name);
    for (const [key, value] of Object.entries(attrs)) if (value !== undefined && value !== false) node.setAttribute(key, value === true ? '' : String(value));
    if (text !== undefined) node.textContent = text;
    return node;
  };

  // chart(svg, spec) draws axes, gridlines, series, threshold marks, shaded bands and a "now" marker.
  // spec: { width, height, x: {min, max, ticks, format}, y: {min, max, ticks, format},
  //   series: [{ points: [[x, y]], kind: 'line'|'step'|'area'|'bars', tone, dashed }],
  //   marks: [{ y, label }], bands: [{ x0, x1 }], events: [{ x, label, tone }], now }
  function chart(svg, spec) {
    const W = spec.width ?? 480, H = spec.height ?? 160;
    const pad = { l: 34, r: 12, t: 10, b: 20, ...(spec.pad ?? {}) };
    const fx = spec.x.format ?? ((v) => fmt(v)), fy = spec.y.format ?? ((v) => fmt(v));
    const sx = (v) => pad.l + (v - spec.x.min) / (spec.x.max - spec.x.min) * (W - pad.l - pad.r);
    const sy = (v) => H - pad.b - (v - spec.y.min) / (spec.y.max - spec.y.min) * (H - pad.t - pad.b);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.classList.add('pg-chart');
    svg.replaceChildren();
    for (const band of spec.bands ?? []) svg.append(el('rect', { class: 'band', x: sx(band.x0), y: pad.t, width: Math.max(0, sx(band.x1) - sx(band.x0)), height: H - pad.t - pad.b }));
    for (const v of spec.y.ticks ?? ticks(spec.y.min, spec.y.max, 3)) {
      svg.append(el('line', { class: v === spec.y.min ? 'axis' : 'grid', x1: pad.l, x2: W - pad.r, y1: sy(v), y2: sy(v) }));
      svg.append(el('text', { x: pad.l - 6, y: sy(v) + 3.5, 'text-anchor': 'end' }, fy(v)));
    }
    const xt = spec.x.ticks ?? ticks(spec.x.min, spec.x.max, 4);
    xt.forEach((v, i) => svg.append(el('text', { x: sx(v), y: H - 5, 'text-anchor': i === 0 ? 'start' : i === xt.length - 1 ? 'end' : 'middle' }, fx(v))));
    for (const s of spec.series ?? []) {
      const pts = s.points.filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
      if (!pts.length) continue;
      const tone = s.tone && s.tone !== 'ink' ? s.tone : undefined;
      if (s.kind === 'bars') {
        const w = Math.max(1, (W - pad.l - pad.r) / pts.length * (s.width ?? 0.7));
        for (const [x, y] of pts) svg.append(el('rect', { class: 'bar', 'data-tone': tone, x: sx(x) - w / 2, y: sy(Math.max(y, spec.y.min)), width: w, height: Math.max(0, sy(spec.y.min) - sy(y)), rx: Math.min(2, w / 3) }));
        continue;
      }
      let d = '';
      pts.forEach(([x, y], i) => {
        if (i === 0) d += `M${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`;
        else if (s.kind === 'step') d += `H${sx(x).toFixed(1)}V${sy(y).toFixed(1)}`;
        else d += `L${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`;
      });
      if (s.kind === 'area' || s.fill) {
        const base = sy(spec.y.min);
        svg.append(el('path', { class: 'area', d: `${d}V${base}H${sx(pts[0][0]).toFixed(1)}Z` }));
      }
      svg.append(el('path', { class: 'series', 'data-tone': tone, 'data-dashed': s.dashed, d }));
    }
    for (const mark of spec.marks ?? []) {
      svg.append(el('line', { class: 'mark', x1: pad.l, x2: W - pad.r, y1: sy(mark.y), y2: sy(mark.y) }));
      if (mark.label) svg.append(el('text', { class: 'mark-label', x: W - pad.r, y: sy(mark.y) - 4, 'text-anchor': 'end' }, mark.label));
    }
    for (const ev of spec.events ?? []) {
      const x = sx(ev.x);
      svg.append(el('line', { class: 'event', x1: x, x2: x, y1: pad.t, y2: H - pad.b, 'data-tone': ev.tone }));
      if (ev.label) svg.append(el('text', { class: 'event-label', x: x + 4, y: pad.t + 8, 'data-tone': ev.tone }, ev.label));
    }
    if (Number.isFinite(spec.now)) {
      const x = sx(Math.min(spec.x.max, Math.max(spec.x.min, spec.now)));
      svg.append(el('line', { class: 'now', x1: x, x2: x, y1: pad.t, y2: H - pad.b }));
      const s = (spec.series ?? [])[0];
      const at = s && [...s.points].reverse().find(([px]) => px <= spec.now);
      if (at) svg.append(el('circle', { class: 'now-dot', cx: x, cy: sy(at[1]), r: 3.5 }));
    }
    return { sx, sy };
  }

  // Deterministic random numbers so a simulation replays the same way every time.
  function rng(seed = 1) {
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // loop(step) calls step(dt) every frame while playing; it pauses when the card is hidden or offscreen.
  function loop(step, { onChange } = {}) {
    let frame = 0, last = 0, playing = false, visible = true;
    const tick = (now) => {
      frame = 0;
      if (!playing || !visible || document.hidden) { last = 0; return; }
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      if (step(dt) === false) { api.pause(); return; }
      frame = requestAnimationFrame(tick);
    };
    const kick = () => { if (playing && visible && !frame) frame = requestAnimationFrame(tick); };
    new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; kick(); }).observe(document.body);
    document.addEventListener('visibilitychange', kick);
    const api = {
      get playing() { return playing; },
      play() { if (playing) return; playing = true; kick(); onChange?.(true); },
      pause() { if (!playing) return; playing = false; if (frame) cancelAnimationFrame(frame); frame = 0; last = 0; onChange?.(false); },
      toggle() { playing ? api.pause() : api.play(); },
    };
    return api;
  }

  // agent(element) drives a .pg-agent area: what the agent did, is doing, or suggests.
  function agent(node) {
    const text = node.querySelector('.pg-agent-text');
    const when = node.querySelector('.pg-agent-who small');
    return {
      say(message, { state = 'idle', note = '' } = {}) {
        node.dataset.state = state;
        text.textContent = message;
        if (when) when.textContent = note;
      },
    };
  }

  const icons = {
    play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.8v10.4c0 .5.5.8.9.5l8-5.2c.4-.2.4-.8 0-1l-8-5.2c-.4-.3-.9 0-.9.5Z"/></svg>',
    pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="2.5" width="3" height="11" rx="1"/><rect x="9.5" y="2.5" width="3" height="11" rx="1"/></svg>',
    step: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3.2v9.6c0 .5.5.8.9.5l6.6-4.8c.4-.3.4-.7 0-1L3.9 2.7c-.4-.3-.9 0-.9.5Z"/><rect x="11" y="2.5" width="2.5" height="11" rx="1"/></svg>',
    reset: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5a5.5 5.5 0 1 1-5.2 3.8.8.8 0 1 1 1.5.5A4 4 0 1 0 8 4h-.7l1 1a.8.8 0 0 1-1.1 1.1L4.9 3.8a.8.8 0 0 1 0-1.1l2.3-2.3a.8.8 0 1 1 1.1 1.1l-.4.5H8Z"/></svg>',
  };

  return { reduced, fmt, ticks, chart, rng, loop, agent, icons };
})();
