// Starter figure: a slide bench. A carriage rides two rails over a ruler and a
// dial gauge reads its travel. Copy this directory, keep the helpers, and
// replace the parts with the object that explains your idea.

export const meta = {
  title: 'Slide bench',
  width: 540,
  fig: 'Fig. 1',
  name: 'Slide bench',
  hint: 'Drag the slider or use the arrow keys.',
  viewBox: [600, 300],
};

export const initial = { position: 0.62 };

export const normalize = (state) => ({
  position: Math.min(1, Math.max(0, Number(state?.position ?? initial.position) || 0)),
});

export const travel = (position) => -110 + position * 220;

export function projection(k) {
  const bounds = [-200, 200].flatMap((x) => [-80, 72].flatMap((y) => [-14, 90].map((z) => [x, y, z])));
  return k.fitProjection(bounds, meta.viewBox[0], meta.viewBox[1], { pad: 18, azimuth: 62, elevation: 30 });
}

export function needle(k, P, position) {
  const angle = (-120 + position * 240) * Math.PI / 180;
  const cx = 150, cy = -54, z = 61.5;
  return k.segment([cx - Math.sin(angle) * 3, cy + Math.cos(angle) * 3, z], [cx + Math.sin(angle) * 13.5, cy - Math.cos(angle) * 13.5, z], P);
}

export function draw(k, state) {
  const P = projection(k);
  const solid = (plan, z, height, tone = 'mid', extra = {}) => k.solidSvg(k.slabOf(plan, z, height, P, 5, 0.65), { tone, ...extra });
  const cyl = (x, y, r, z, height, tone = 'mid') => k.solidSvg(k.cylinder(x, y, r, z, height, P, 24, 0.4), { tone });
  const line = (a, b, tone = 'lo') => k.lineSvg(k.segment(a, b, P), { tone });
  const ln = (d, tone = 'lo') => k.lineSvg(d, { tone });
  const screw = (x, y, z, size = 1.8) => cyl(x, y, size, z, 0.6, 'lo') + line([x - size * 0.6, y, z + 0.6], [x + size * 0.6, y, z + 0.6], 'hi');
  const parts = [];

  // Base plate on four turned feet, with an inset groove and corner screws.
  const base = { x: -196, y: -74, w: 392, d: 140, r: 8 };
  parts.push(`<path class="iso-halo" d="${k.haloOf(base, -13, 7, P)}"/>`);
  for (const y of [-54, 48]) for (const x of [-172, 172]) parts.push(cyl(x, y, 9, -12, 3, 'lo'), cyl(x, y, 6.4, -9, 9));
  parts.push(solid(base, 0, 9, 'lo'));
  parts.push(ln(k.planOutline({ x: -190, y: -68, w: 380, d: 128, r: 5 }, 9, P), 'faint'));
  for (const x of [-184, 184]) for (const y of [-62, 54]) parts.push(screw(x, y, 9, 2.2));

  // A label plate with three printed rule lines.
  parts.push(solid({ x: -170, y: -66, w: 70, d: 22, r: 2 }, 9, 1.2, 'lo'));
  for (const [y, end] of [[-60, -112], [-55, -128], [-50, -120]]) parts.push(k.lineSvg(k.segment([-164, y, 10.4], [end, y, 10.4], P), { tone: 'faint', free: true }));

  // Dial gauge on a post: knurled bezel, ticks, and a needle that reads travel.
  parts.push(solid({ x: 128, y: -72, w: 44, d: 36, r: 4 }, 9, 5));
  for (const x of [134, 166]) for (const y of [-66, -42]) parts.push(screw(x, y, 14, 1.5));
  parts.push(cyl(150, -54, 6, 14, 30), cyl(150, -54, 10, 42, 5));
  parts.push(cyl(150, -54, 20, 47, 13, 'hi'));
  parts.push(ln(k.sideArc(150, -54, 20, 55, P, 38), 'lo'));
  parts.push(ln(k.knurl(150, -54, 20, 55, 60, 64, P), 'lo'));
  parts.push(cyl(150, -54, 18, 60, 1, 'lo'));
  const dial = k.radialTicks(150, -54, 16, 36, 6, 61, [1.5, 3], P, -Math.PI * 2 / 3, Math.PI * 4 / 3);
  parts.push(ln(dial.minor, 'lo'), ln(dial.major, 'mid'));
  parts.push(`<path id="needle" class="iso-line" data-tone="lit" stroke-width="1.2" d="${needle(k, P, state.position)}"/>`);
  parts.push(cyl(150, -54, 1.7, 61, 0.7, 'hi'));

  // Two hardened rails on end blocks.
  for (const y of [-24, 24]) {
    for (const x of [-176, 164]) {
      parts.push(solid({ x, y: y - 10, w: 12, d: 20, r: 2 }, 9, 15));
      parts.push(screw(x + 6, y - 6, 24, 1.4), screw(x + 6, y + 6, 24, 1.4));
    }
    parts.push(solid({ x: -164, y: y - 2.2, w: 328, d: 4.4, r: 2 }, 19, 4.4, 'hi'));
    parts.push(line([-164, y, 23.4], [164, y, 23.4], 'faint'));
  }

  // Front ruler: minor ticks every 6 units, a major every 5th, hung from its edge.
  parts.push(solid({ x: -168, y: 48, w: 336, d: 8, r: 1.5 }, 9, 1.1, 'lo'));
  const ruler = k.topTicks(-160, 160, 6, 5, 48.3, 10.1, [2.6, 5.2], P);
  parts.push(ln(ruler.minor, 'lo'), ln(ruler.major, 'mid'));

  // The carriage is built once at x = 0; only this group moves.
  parts.push(`<g id="carriage" transform="${k.translateAlong(P, [travel(state.position), 0, 0])}">`);
  parts.push(`<path class="iso-halo" d="${k.haloOf({ x: -34, y: -32, w: 68, d: 64, r: 4 }, 12, 7, P)}"/>`);
  for (const x of [-30, 18]) for (const y of [-24, 24]) {
    parts.push(solid({ x, y: y - 7, w: 12, d: 14, r: 2 }, 23, 7, 'hi'));
    parts.push(screw(x + 6, y, 30, 1.6));
  }
  const top = { x: -34, y: -34, w: 68, d: 68, r: 3 };
  parts.push(solid(top, 30, 6, 'hi', { inner: ln(k.sideSeam(top, 33, P, 5), 'faint') }));
  for (const x of [-28, 28]) for (const y of [-28, 28]) parts.push(screw(x, y, 36, 1.3));
  parts.push(cyl(0, 0, 12, 36, 2, 'lo'));
  parts.push(cyl(0, 0, 9, 38, 10, 'hi'));
  parts.push(ln(k.knurl(0, 0, 9, 38, 48, 28, P), 'lo'));
  parts.push(cyl(0, 0, 4, 48, 3, 'mid'));
  parts.push(solid({ x: -2, y: 34, w: 4, d: 16, r: 1 }, 10, 3, 'hi'));
  parts.push(line([0, 36, 13], [0, 50, 13], 'lit'));
  parts.push('</g>');
  return parts.join('');
}
