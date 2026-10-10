// Drawing uses Ryan's Anatomy kit; all dimensions are illustrative world units.
export function drawLever(k, state, angle) {
  const P = { origin: [340, 292], scale: 1.55, azimuth: 27, elevation: 23 };
  const pivot = 148;
  const at = (p) => k.iso(p, P);
  const solid = (plan, z, height, tone = "mid") => k.solidSvg(k.slabOf(plan, z, height, P, 4, 0.5), { tone });
  const cyl = (x, y, r, z, height, tone = "mid") => k.solidSvg(k.cylinder(x, y, r, z, height, P, 20), { tone });
  const line = (a, b, tone = "lo") => k.lineSvg(k.segment(a, b, P), { tone });
  const out = [];
  for (const y of [-27, 27]) for (const x of [-159, 159]) {
    out.push(cyl(x, y, 8, -9, 5, "lo"), cyl(x, y, 6, -4, 4));
  }
  out.push(solid({ x: -181, y: -42, w: 362, d: 84, r: 7 }, 0, 8));
  out.push(k.lineSvg(k.planOutline({ x: -175, y: -36, w: 350, d: 72, r: 5 }, 8.2, P), { tone: "faint" }));
  for (const x of [-169, 169]) for (const y of [-29, 29]) {
    out.push(cyl(x, y, 2.5, 8, 0.8, "lo"), line([x - 1.5, y, 8.8], [x + 1.5, y, 8.8]));
  }
  out.push(solid({ x: -27, y: -20, w: 54, d: 40, r: 4 }, 8, 6));
  out.push(solid({ x: -12, y: -11, w: 24, d: 22, r: 2 }, 14, 7));
  out.push(solid({ x: -5, y: -7, w: 10, d: 14, r: 1 }, 21, pivot - 12));
  out.push(line([-2, -7.3, 24], [-2, -7.3, pivot - 2], "faint"));
  for (const x of [-16, 16]) out.push(cyl(x, 0, 2, 14, 1.2, "lo"));
  // Rubber travel stops are placed where the beam reaches its ±12° limit.
  for (const x of [-160, 160]) {
    out.push(cyl(x, 0, 6, 8, 4));
    out.push(cyl(x, 0, 2.6, 12, 95), cyl(x, 0, 5, 107, 4, "lo"));
  }
  // Project an actual tilted rectangular beam, keeping hanging masses vertical.
  const turn = ([x, y, z]) => [x * Math.cos(angle) - z * Math.sin(angle), y, pivot + x * Math.sin(angle) + z * Math.cos(angle)];
  const beamAt = (p) => at(turn(p));
  const face = (points, cls, extra = "") => `<path class="${cls}" ${extra} d="${k.pathOf(points.map(beamAt), true)}"/>`;
  out.push(face([[-169, -5, -4], [169, -5, -4], [169, -5, 4], [-169, -5, 4]], "iso-shade", 'data-shade="1"'));
  out.push(face([[169, -5, -4], [169, 5, -4], [169, 5, 4], [169, -5, 4]], "iso-shade", 'data-shade="0"'));
  out.push(face([[-169, -5, 4], [169, -5, 4], [169, 5, 4], [-169, 5, 4]], "iso-top"));
  out.push(`<path class="iso-line" data-tone="mid" d="${k.pathOf([[-169, -5, -4], [169, -5, -4], [169, 5, -4], [169, 5, 4], [-169, 5, 4], [-169, -5, 4], [-169, -5, -4]].map(beamAt))}"/>`);
  for (let x = -160; x <= 160; x += 8) {
    const major = x % 32 === 0;
    out.push(k.lineSvg(k.pathOf([[x, -5.1, 4], [x, -5.1, major ? -2 : 1]].map(beamAt)), { tone: major ? "mid" : "lo" }));
  }
  for (const [side, sign, color] of [["left", -1, "#5e65c7"], ["right", 1, "#c48331"]]) {
    const x = sign * state[`${side}Distance`] * 3.3;
    const [ax, , az] = turn([x, -5, 0]);
    const count = Math.round(state[`${side}Mass`] * 10);
    const height = 4 + count * 1.6;
    const bottom = az - 28 - height;
    const clip = [[x - 3, -6, -6], [x + 3, -6, -6], [x + 3, -6, 6], [x - 3, -6, 6]];
    out.push(`<path fill="${color}" stroke="var(--anatomy-hi)" stroke-width=".5" d="${k.pathOf(clip.map(beamAt), true)}"/>`);
    out.push(line([ax, -7, az - 5], [ax, -7, az - 24], "mid"));
    out.push(k.lineSvg(k.sideRing([ax, -7, az - 25], 3, "y", P, 16), { tone: "mid" }));
    out.push(`<g style="--anatomy-top:${color};--anatomy-paper:${color};--anatomy-shade-0:${color};--anatomy-shade-1:${color};--anatomy-shade-2:${color};--anatomy-shade-3:${color}">`);
    out.push(cyl(ax, -7, 11, bottom, height, "mid"));
    for (let i = 1; i < count; i++) out.push(k.lineSvg(k.sideArc(ax, -7, 11.1, bottom + 3 + i * 1.6, P, 14), { tone: "lo" }));
    out.push("</g>");
    out.push(cyl(ax, -7, 3, bottom + height, 2, "mid"));
  }
  const [cx, cy] = at([0, -9, pivot]);
  out.push(`<circle cx="${cx}" cy="${cy}" r="7" fill="var(--anatomy-paper)" stroke="var(--anatomy-mid)" stroke-width="1.2"/><circle cx="${cx}" cy="${cy}" r="2.5" fill="var(--anatomy-mid)"/>`);
  return out.join("");
}
