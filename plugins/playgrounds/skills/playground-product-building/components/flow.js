// flow(svg, spec): a live system diagram. Service cards joined by edges; sampled
// requests travel the edges as dots, and rejected ones fall out of the card that
// dropped them. Drive it from your model: send(), drop(), node(id).meter() etc.
// spec: { width, height, nodes: [{ id, x, y, w, h, title, sub, meter, slots }], edges: [{ from, to, label }] }
// slots: a number of cells, or { count, per } when each cell stands for `per` workers or connections.
function flow(svg, spec) {
  const SVG = 'http://www.w3.org/2000/svg';
  const W = spec.width ?? 500, H = spec.height ?? 200;
  const make = (name, attrs = {}, text) => {
    const node = document.createElementNS(SVG, name);
    for (const [key, value] of Object.entries(attrs)) if (value !== undefined && value !== false) node.setAttribute(key, String(value));
    if (text !== undefined) node.textContent = text;
    return node;
  };
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.classList.add('pg-flow');
  svg.replaceChildren();
  const layers = { edges: make('g'), dots: make('g'), nodes: make('g'), drops: make('g') };
  svg.append(layers.edges, layers.dots, layers.nodes, layers.drops);

  const nodes = new Map();
  for (const n of spec.nodes) {
    const w = n.w ?? 112, h = n.h ?? (n.meter || n.slots ? 64 : 46), x = n.x - w / 2, y = n.y - h / 2;
    const g = make('g', { class: 'pg-flow-node', transform: `translate(${x} ${y})` });
    g.append(make('rect', { class: 'card', width: w, height: h, rx: 9 }));
    const meterW = n.meter ? 10 : 0;
    const tx = 10 + (meterW ? meterW + 8 : 0);
    g.append(make('text', { class: 'title', x: tx, y: 19 }, n.title));
    const sub = make('text', { class: 'sub', x: tx, y: 33 }, n.sub ?? '');
    g.append(sub);
    let meterFill = null;
    if (n.meter) {
      const mh = h - 20;
      g.append(make('rect', { class: 'meter', x: 10, y: 10, width: meterW, height: mh, rx: 3 }));
      meterFill = make('rect', { class: 'meter-fill', x: 10, y: 10 + mh, width: meterW, height: 0, rx: 3 });
      g.append(meterFill);
      for (let i = 1; i < 4; i++) g.append(make('line', { class: 'meter-tick', x1: 10, x2: 10 + meterW, y1: 10 + mh * i / 4, y2: 10 + mh * i / 4 }));
    }
    const slots = [];
    const slotCount = typeof n.slots === 'object' ? n.slots.count : n.slots;
    const per = typeof n.slots === 'object' ? n.slots.per ?? 1 : 1;
    if (slotCount) {
      const count = slotCount, size = Math.min(10, (w - tx - 10 - (count - 1) * 3) / count);
      for (let i = 0; i < count; i++) {
        const cell = make('rect', { class: 'slot', x: tx + i * (size + 3), y: h - 10 - size, width: size, height: size, rx: 2 });
        slots.push(cell); g.append(cell);
      }
    }
    const value = make('text', { class: 'value', x: w - 10, y: h - 9, 'text-anchor': 'end' });
    g.append(value);
    layers.nodes.append(g);
    nodes.set(n.id, { spec: n, g, x, y, w, h, meterFill, slots, per, sub, value, mh: h - 20 });
  }

  const edges = spec.edges.map((e) => {
    const a = nodes.get(e.from), b = nodes.get(e.to);
    const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2;
    const mid = (x1 + x2) / 2;
    const d = y1 === y2 ? `M${x1} ${y1}H${x2}` : `M${x1} ${y1}C${mid} ${y1} ${mid} ${y2} ${x2} ${y2}`;
    const path = make('path', { class: 'edge', d });
    layers.edges.append(path);
    layers.edges.append(make('path', { class: 'arrow', d: `M${x2 - 5} ${y2 - 3.5}L${x2} ${y2}L${x2 - 5} ${y2 + 3.5}` }));
    if (e.label) layers.edges.append(make('text', { class: 'edge-label', x: mid, y: Math.min(y1, y2) - 6, 'text-anchor': 'middle' }, e.label));
    return { ...e, path, length: path.getTotalLength() };
  });
  const edgeOf = (from, to) => edges.find((e) => e.from === from && e.to === to);

  const dots = [], drops = [];
  const MAX_DOTS = 90;
  const api = {
    node(id) {
      const n = nodes.get(id);
      return {
        meter(fraction) {
          if (!n.meterFill) return;
          const v = Math.max(0, Math.min(1, fraction));
          n.meterFill.setAttribute('y', String(10 + n.mh * (1 - v)));
          n.meterFill.setAttribute('height', String(n.mh * v));
          n.meterFill.dataset.low = String(v < 0.15);
        },
        // busy is in real units (workers, connections); each cell covers `per` of them
        slots(busy) { const cells = Math.ceil(busy / n.per - 1e-9); n.slots.forEach((cell, i) => cell.classList.toggle('busy', i < cells)); },
        sub(text) { n.sub.textContent = text; },
        value(text, tone) { n.value.textContent = text; if (tone) n.value.dataset.tone = tone; else delete n.value.dataset.tone; },
        state(tone) { if (tone) n.g.dataset.tone = tone; else delete n.g.dataset.tone; },
      };
    },
    // send a sampled request along an edge; duration in seconds of travel
    send(from, to, { tone, duration = 0.7 } = {}) {
      const edge = edgeOf(from, to);
      if (!edge) return;
      const gap = 12 / edge.length;
      if (dots.some((d) => d.edge === edge && d.t < gap)) return;
      if (dots.length >= MAX_DOTS) dots.shift().el.remove();
      const el = make('circle', { class: 'dot', r: 3, 'data-tone': tone });
      layers.dots.append(el);
      dots.push({ edge, el, t: 0, duration });
    },
    // a request rejected at a node falls out under it
    drop(at, { tone = 'bad' } = {}) {
      const n = nodes.get(at);
      const el = make('circle', { class: 'drop', r: 3, 'data-tone': tone });
      layers.drops.append(el);
      drops.push({ el, x: n.x + n.w / 2 + (Math.random() - 0.5) * n.w * 0.5, y: n.y + n.h, t: 0 });
      if (drops.length > 40) drops.shift().el.remove();
    },
    tick(dt) {
      for (let i = dots.length - 1; i >= 0; i--) {
        const d = dots[i];
        d.t += dt / d.duration;
        if (d.t >= 1) { d.el.remove(); dots.splice(i, 1); continue; }
        const p = d.edge.path.getPointAtLength(d.edge.length * d.t);
        d.el.setAttribute('cx', p.x.toFixed(1)); d.el.setAttribute('cy', p.y.toFixed(1));
      }
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.t += dt / 0.9;
        if (d.t >= 1) { d.el.remove(); drops.splice(i, 1); continue; }
        d.el.setAttribute('cx', d.x.toFixed(1)); d.el.setAttribute('cy', (d.y + 6 + d.t * 22).toFixed(1));
        d.el.setAttribute('opacity', (1 - d.t).toFixed(2));
      }
    },
    clear() { for (const d of [...dots, ...drops]) d.el.remove(); dots.length = 0; drops.length = 0; },
  };
  return api;
}
