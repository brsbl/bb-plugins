// states(svg, spec): a state-machine graph with its real branches and loops.
// spec: { width, height, nodes: [{ id, label, x, y, tone }], edges: [{ from, to, label, nudge: [dx, dy] }] }
// x, y are node centers in viewBox units. Edges that point backwards (a retry)
// bend away so loops stay readable. Call set({ current, visited, last: [from, to] }).
function states(svg, spec) {
  const SVG = 'http://www.w3.org/2000/svg';
  const W = spec.width ?? 500, H = spec.height ?? 150;
  const make = (name, attrs = {}, text) => {
    const node = document.createElementNS(SVG, name);
    for (const [key, value] of Object.entries(attrs)) if (value !== undefined && value !== false) node.setAttribute(key, String(value));
    if (text !== undefined) node.textContent = text;
    return node;
  };
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.classList.add('pg-states');
  svg.replaceChildren();
  const uid = Math.random().toString(36).slice(2, 7);
  const defs = make('defs');
  for (const tone of ['rest', 'live']) {
    const marker = make('marker', { id: `sm-${tone}-${uid}`, viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
    marker.append(make('path', { d: 'M1 1L7 4L1 7', class: `sm-arrow sm-arrow-${tone}` }));
    defs.append(marker);
  }
  svg.append(defs);
  const edgeLayer = make('g'), nodeLayer = make('g');
  svg.append(edgeLayer, nodeLayer);

  const nodes = new Map();
  for (const n of spec.nodes) {
    const w = Math.max(56, n.label.length * 6.4 + 22), h = 24;
    const g = make('g', { class: 'sm-node', transform: `translate(${n.x - w / 2} ${n.y - h / 2})`, 'data-tone': n.tone });
    g.append(make('rect', { width: w, height: h, rx: 12 }));
    g.append(make('text', { x: w / 2, y: 15.5, 'text-anchor': 'middle' }, n.label));
    nodeLayer.append(g);
    nodes.set(n.id, { ...n, w, h, g });
  }

  const border = (n, toward) => {
    const dx = toward.x - n.x, dy = toward.y - n.y;
    const sx = dx ? (n.w / 2) / Math.abs(dx) : Infinity, sy = dy ? (n.h / 2) / Math.abs(dy) : Infinity;
    const s = Math.min(sx, sy);
    return { x: n.x + dx * s, y: n.y + dy * s };
  };
  const edges = spec.edges.map((e) => {
    const a = nodes.get(e.from), b = nodes.get(e.to);
    const paired = spec.edges.some((o) => o.from === e.to && o.to === e.from);
    const back = !paired && (b.x < a.x - 1 || (Math.abs(b.x - a.x) < 1 && b.y < a.y));
    const bend = paired ? 16 : back ? 26 : Math.abs(b.y - a.y) > 1 && Math.abs(b.x - a.x) > 1 ? 10 : 0;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
    const c = { x: mx + nx * bend * (back ? -1 : 1), y: my + ny * bend * (back ? -1 : 1) };
    const p1 = border(a, bend ? c : b), p2 = border(b, bend ? c : a);
    const d = bend ? `M${p1.x} ${p1.y}Q${c.x} ${c.y} ${p2.x} ${p2.y}` : `M${p1.x} ${p1.y}L${p2.x} ${p2.y}`;
    const path = make('path', { class: 'sm-edge', d, 'marker-end': `url(#sm-rest-${uid})` });
    edgeLayer.append(path);
    let label = null;
    if (e.label) {
      const side = bend ? Math.sign((c.x - mx) * nx + (c.y - my) * ny) || 1 : -1;
      const [ox, oy] = e.nudge ?? [0, 0];
      const lx = (bend ? (p1.x + 2 * c.x + p2.x) / 4 : mx) + nx * side * 7 + ox;
      const ly = (bend ? (p1.y + 2 * c.y + p2.y) / 4 : my) + ny * side * 7 + 3 + oy;
      label = make('text', { class: 'sm-label', x: lx, y: ly, 'text-anchor': Math.abs(nx) > 0.6 ? (nx * side > 0 ? 'start' : 'end') : 'middle' }, e.label);
      edgeLayer.append(label);
    }
    return { ...e, path, label };
  });

  return {
    set({ current, visited = [], last = null } = {}) {
      const seen = new Set(visited);
      const next = new Set(edges.filter((e) => e.from === current).map((e) => e.to));
      for (const [id, n] of nodes) {
        n.g.classList.toggle('current', id === current);
        n.g.classList.toggle('visited', id !== current && seen.has(id));
        n.g.classList.toggle('next', id !== current && next.has(id));
        if (id === current) n.g.setAttribute('aria-current', 'step'); else n.g.removeAttribute('aria-current');
      }
      for (const e of edges) {
        const live = last && e.from === last[0] && e.to === last[1];
        const open = e.from === current;
        e.path.classList.toggle('live', Boolean(live));
        e.path.classList.toggle('open', open && !live);
        e.path.setAttribute('marker-end', `url(#sm-${live ? 'live' : 'rest'}-${uid})`);
        if (e.label) e.label.classList.toggle('open', open || Boolean(live));
      }
    },
  };
}
