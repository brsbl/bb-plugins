// Original drawing, constructed with Ryan's Anatomy kit. A sliding drawer,
// opposed springs, linear guides, a target index and a position gauge.
export function rigProjection(k) {
  const bounds = [-215, 215].flatMap(x => [-85, 75].flatMap(y => [-14, 92].map(z => [x, y, z])));
  return k.fitProjection(bounds, 720, 355, { pad: 23, azimuth: 68, elevation: 29 });
}

export function rigPosition(position) { return -60 + position * 120; }

export function springPaths(k, position) {
  const P = rigProjection(k);
  const x = rigPosition(position);
  const left = k.coil(-174, x - 43, [0, 34], 6.5, 11, 'x', P, 12);
  const right = k.coil(x + 43, 174, [0, 34], 6.5, 11, 'x', P, 12);
  return { back: left.back + right.back, front: left.front + right.front };
}

export function gaugeNeedle(k, position) {
  const P = rigProjection(k);
  const angle = (-120 + (position + 0.4) / 1.8 * 240) * Math.PI / 180;
  const cx = 156, cy = -58, z = 57.5;
  return k.segment([cx - Math.sin(angle) * 3, cy + Math.cos(angle) * 3, z], [cx + Math.sin(angle) * 13.5, cy - Math.cos(angle) * 13.5, z], P);
}

export function drawRig(k, position = 1, target = 1) {
  const P = rigProjection(k);
  const solid = (plan, z, height, tone = 'mid', extra = {}) => k.solidSvg(k.slabOf(plan, z, height, P, 5, 0.65), { tone, ...extra });
  const cyl = (x, y, r, z, height, tone = 'mid') => k.solidSvg(k.cylinder(x, y, r, z, height, P, 24, 0.4), { tone });
  const line = (a, b, tone = 'lo') => k.lineSvg(k.segment(a, b, P), { tone });
  const ln = (d, tone = 'lo') => k.lineSvg(d, { tone });
  const screw = (x, y, z, size = 2) => cyl(x, y, size, z, 0.6, 'lo') + line([x - size * .6, y, z + .6], [x + size * .6, y, z + .6], 'hi');
  const parts = [];
  const base = { x: -208, y: -77, w: 416, d: 149, r: 8 };
  parts.push(`<path class="iso-halo" d="${k.haloOf(base, -13, 7, P)}"/>`);
  for (const y of [-56, 53]) for (const x of [-184, 184]) {
    parts.push(cyl(x, y, 9, -12, 3, 'lo'), cyl(x, y, 6.4, -9, 9));
    parts.push(ln(k.sideArc(x, y, 6.4, -5, P, 20), 'lo'));
  }
  parts.push(solid(base, 0, 9, 'lo'));
  parts.push(ln(k.planOutline({ x: -202, y: -71, w: 404, d: 137, r: 5 }, 9, P), 'faint'));
  for (const x of [-196, 196]) for (const y of [-65, 60]) parts.push(screw(x, y, 9, 2.4));

  // Rear control housing: two knurled adjusters, mounted on a real raised plate.
  parts.push(solid({ x: -186, y: -69, w: 106, d: 31, r: 4 }, 9, 8));
  parts.push(ln(k.planOutline({ x: -181, y: -65, w: 96, d: 23, r: 2 }, 17, P), 'faint'));
  for (const x of [-166, -121]) {
    parts.push(cyl(x, -54, 12, 17, 1.4, 'lo'));
    const ticks = k.radialTicks(x, -54, 11, 20, 5, 18.4, [1.5, 2.3], P);
    parts.push(ln(ticks.minor, 'lo'), ln(ticks.major, 'mid'));
    parts.push(cyl(x, -54, 8, 18.4, 8));
    parts.push(ln(k.knurl(x, -54, 8, 18.4, 26.4, 32, P), 'lo'));
    parts.push(`<path id="${x === -166 ? 'stiffness' : 'damping'}-needle" class="iso-line" data-tone="hi" d="${k.segment([x, -54, 26.8], [x, -59.5, 26.8], P)}"/>`);
  }
  for (const x of [-181, -85]) for (const y of [-64, -43]) parts.push(screw(x, y, 17, 1.5));

  // A small speed-controller case has closed vent slots and corner fasteners.
  parts.push(solid({ x: -58, y: -70, w: 68, d: 23, r: 3 }, 9, 6, 'lo'));
  for (let x = -49; x <= -8; x += 7) parts.push(ln(k.planOutline({ x, y: -65, w: 2.6, d: 13, r: 1.3 }, 15, P, 4), 'faint'));
  parts.push(screw(-54, -58, 15, 1.3), screw(5, -58, 15, 1.3));

  // The gauge is bolted to the rear of the same base. Its needle reads travel.
  parts.push(solid({ x: 135, y: -77, w: 42, d: 37, r: 4 }, 9, 5));
  for (const x of [141, 171]) for (const y of [-71, -46]) parts.push(screw(x, y, 14, 1.6));
  parts.push(cyl(156, -58, 6, 14, 29), cyl(156, -58, 10, 38, 5));
  parts.push(cyl(156, -58, 20, 43, 13, 'hi'));
  parts.push(ln(k.sideArc(156, -58, 20, 51, P, 38), 'lo'));
  parts.push(ln(k.knurl(156, -58, 20, 51, 56, 64, P), 'lo'));
  parts.push(cyl(156, -58, 18, 56, 1, 'lo'), ln(k.ring(156, -58, 16, 57, P, 48), 'lo'));
  const dial = k.radialTicks(156, -58, 16, 36, 6, 57, [1.5, 3], P, -Math.PI * 2 / 3, Math.PI * 4 / 3);
  parts.push(ln(dial.minor, 'lo'), ln(dial.major, 'mid'));
  parts.push(`<path id="position-needle" class="iso-line" data-tone="lit" stroke-width="1.2" d="${gaugeNeedle(k, position)}"/>`);
  parts.push(cyl(156, -58, 1.7, 57, .7, 'hi'));
  parts.push(solid({ x: 174, y: -61, w: 7, d: 6, r: 1 }, 47, 5));

  // Hardened guide rails are supported at both ends. The four bearing blocks
  // of the drawer sit on these rails; their cavities are hidden by the floor.
  for (const y of [-29, 29]) {
    for (const x of [-188, 177]) {
      parts.push(solid({ x, y: y - 11, w: 14, d: 22, r: 2 }, 9, 17));
      parts.push(screw(x + 7, y - 7, 26, 1.6), screw(x + 7, y + 7, 26, 1.6));
    }
    parts.push(solid({ x: -177, y: y - 2.4, w: 354, d: 4.8, r: 2.1 }, 22, 4.8, 'hi'));
    parts.push(line([-177, y, 26.8], [177, y, 26.8], 'faint'));
  }

  // Spring end anchors are real mounts; the spring ends meet their inner faces.
  for (const x of [-185, 174]) {
    parts.push(solid({ x, y: -10, w: 11, d: 20, r: 2 }, 9, 26));
    parts.push(screw(x + 5.5, -5, 35, 1.7), screw(x + 5.5, 5, 35, 1.7));
  }
  const springs = springPaths(k, position);
  parts.push(`<path id="spring-back" class="iso-line rig-spring" data-tone="lo" d="${springs.back}"/>`);
  parts.push(`<path id="spring-front" class="iso-line rig-spring" data-tone="hi" d="${springs.front}"/>`);

  // Drawer assembly, built once at x=0. Only this wrapper moves during a frame.
  parts.push(`<g id="drawer-carriage" transform="${k.translateAlong(P, [rigPosition(position), 0, 0])}">`);
  parts.push(`<path class="iso-halo" d="${k.haloOf({ x: -41, y: -34, w: 82, d: 70, r: 4 }, 12, 7, P)}"/>`);
  for (const x of [-37, 24]) for (const y of [-29, 29]) {
    parts.push(solid({ x, y: y - 7, w: 13, d: 14, r: 2 }, 25, 8, 'hi'));
    parts.push(screw(x + 6.5, y, 33, 1.8));
  }
  // Tabs join each spring to the carriage below its floor.
  for (const x of [-43, 38]) parts.push(solid({ x, y: -8, w: 5, d: 16, r: 1 }, 30, 7, 'hi'));
  parts.push(solid({ x: -41, y: -36, w: 82, d: 74, r: 3 }, 34, 5, 'hi'));
  parts.push(solid({ x: -40, y: -35, w: 80, d: 3, r: 1 }, 39, 23, 'hi'));
  parts.push(solid({ x: -40, y: -32, w: 3, d: 66, r: .8 }, 39, 23, 'hi'));
  // An inset liner, divider and captured index card make this visibly a drawer.
  parts.push(solid({ x: -35, y: -30, w: 70, d: 62, r: 1.6 }, 39, .8, 'lo'));
  parts.push(ln(k.planOutline({ x: -32, y: -27, w: 64, d: 56, r: 1 }, 39.8, P), 'faint'));
  parts.push(solid({ x: -31, y: -24, w: 56, d: 38, r: 1 }, 40, .8, 'hi'));
  for (const [y, end] of [[-17, 15], [-11, 6], [-5, 15], [1, 10]]) {
    parts.push(k.lineSvg(k.segment([-24, y, 40.8], [end, y, 40.8], P), { tone: 'faint', free: true }));
  }
  parts.push(solid({ x: -36, y: 20, w: 73, d: 2, r: .5 }, 40, 12));
  parts.push(solid({ x: 37, y: -32, w: 3, d: 66, r: .8 }, 39, 23, 'hi'));
  const front = { x: -42, y: 34, w: 84, d: 5, r: 1.6 };
  parts.push(solid(front, 34, 30, 'hi', { inner: ln(k.sideSeam(front, 39, P, 5), 'faint') }));
  // A face-mounted holder and handle: two standoffs with a broad graspable bar.
  parts.push(solid({ x: -28, y: 39, w: 23, d: 1.1, r: .5 }, 44, 10, 'lo'));
  parts.push(line([-26, 40.2, 51], [-8, 40.2, 51], 'faint'));
  for (const x of [5, 28]) parts.push(solid({ x, y: 39, w: 4, d: 7, r: 1 }, 47, 5));
  parts.push(solid({ x: 5, y: 44, w: 27, d: 4, r: 1.5 }, 46, 7, 'hi', { lit: true }));
  for (const x of [-34, 34]) {
    parts.push(screw(x, 36.5, 64, 1.5));
    for (const y of [-31, 28]) parts.push(screw(x, y, 62, 1.4));
  }
  parts.push('</g>');

  // Front ruler and sliding target index. Major marks are on the ruler edge.
  parts.push(solid({ x: -176, y: 53, w: 352, d: 8, r: 1.5 }, 9, 1.1, 'lo'));
  const ruler = k.topTicks(-168, 168, 6, 5, 53.3, 10.1, [2.6, 5.2], P);
  parts.push(ln(ruler.minor, 'lo'), ln(ruler.major, 'mid'));
  for (const x of [-60, 60]) parts.push(line([x, 53, 10.2], [x, 61, 10.2], 'hi'));
  parts.push(`<g id="target-index" transform="${k.translateAlong(P, [rigPosition(target), 0, 0])}">`);
  parts.push(solid({ x: -3, y: 51, w: 6, d: 12, r: 1 }, 10.2, 3, 'hi'));
  parts.push(line([0, 52, 13.2], [0, 62, 13.2], 'lit'), '</g>');
  for (const x of [-181, 181]) parts.push(screw(x, 57, 9, 1.7));
  return parts.join('');
}
