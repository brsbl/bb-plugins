// The bed and carriage are illustrative; the type placement comes from actual
// browser text measurements. Static geometry is generated only at build time.
export function pressProjection(k) {
  const bounds = [-154, 158].flatMap(x => [-114, 123].flatMap(y => [-15, 108].map(z => [x, y, z])));
  return k.fitProjection(bounds, 720, 360, { pad: 27, azimuth: 49, elevation: 34 });
}
export function drawPress(k) {
  const P = pressProjection(k);
  const at = point => k.iso(point, P);
  const S = (x, y, w, d, z, h, tone = 'mid', r = 1.5) => k.solidSvg(k.slabOf({ x, y, w, d, r }, z, h, P, 3, .5), { tone });
  const C = (x, y, r, z, h, tone = 'mid') => k.solidSvg(k.cylinder(x, y, r, z, h, P, 16), { tone });
  const L = (a, b, tone = 'lo') => k.lineSvg(k.segment(a, b, P), { tone });
  const screw = (x, y, z, r = 2.2) => C(x, y, r, z, .8, 'lo') + L([x - r * .6, y, z + .8], [x + r * .6, y, z + .8], 'mid');
  const roller = (x0, x1, y, z, r, tone = '') => {
    const parts = [];
    // Circumference strips are solid faces of one horizontal impression roller.
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2, b = (i + 1) / 24 * Math.PI * 2;
      if (Math.cos((a + b) / 2) * .7 + Math.sin((a + b) / 2) * .7 < 0) continue;
      const points = [[x0, y + Math.cos(a) * r, z + Math.sin(a) * r], [x1, y + Math.cos(a) * r, z + Math.sin(a) * r], [x1, y + Math.cos(b) * r, z + Math.sin(b) * r], [x0, y + Math.cos(b) * r, z + Math.sin(b) * r]];
      parts.push(`<path class="iso-shade" data-shade="${Math.min(3, Math.floor((Math.sin((a + b) / 2) + 1) * 1.8))}" d="${k.pathOf(points.map(at), true)}"/>`);
    }
    parts.push(`<path class="iso-top" d="${k.sideRing([x1, y, z], r, 'x', P, 32)}"/>`);
    for (const x of [x0, x1]) parts.push(k.lineSvg(k.sideRing([x, y, z], r, 'x', P, 32), { tone: tone || 'mid' }));
    return parts.join('');
  };
  const out = [];
  // Four rubber feet, iron bed, perimeter lip, countersunk bed fasteners.
  for (const x of [-124, 124]) for (const y of [-88, 98]) out.push(C(x, y, 8, -12, 4, 'lo'), C(x, y, 5.7, -8, 8));
  out.push(S(-148, -111, 296, 232, 0, 13, 'mid', 7));
  out.push(k.lineSvg(k.planOutline({ x: -140, y: -103, w: 280, d: 216, r: 5 }, 13.2, P), { tone: 'lo' }));
  for (const x of [-137, 137]) for (const y of [-99, 109]) out.push(screw(x, y, 13));
  // The rear bed stop, back rail and its replaceable running surface.
  out.push(S(-126, -94, 252, 7, 13, 8));
  out.push(S(-126, -86, 8, 193, 13, 8), S(-124, -86, 3, 193, 21, 2, 'hi'));
  for (const y of [-71, -21, 29, 89]) out.push(screw(-122, y, 23, 1.5));
  // Chase: a real open frame that locks the type bed in place.
  out.push(S(-105, -76, 210, 177, 13, 4, 'lo', 1));
  out.push(S(-105, -76, 210, 4, 17, 3), S(-105, -72, 4, 169, 17, 3));
  out.push('<g id="press-type"></g>');
  out.push(S(-105, 97, 210, 4, 17, 3), S(101, -72, 4, 169, 17, 3));
  for (const y of [-45, 40, 83]) {
    out.push(S(106, y, 7, 9, 13, 7), screw(109.5, y + 4.5, 20, 1.7));
  }
  // Near guide rail, a brass scale and fasteners. The carriage rides both rails.
  out.push(S(118, -86, 8, 193, 13, 8), S(120, -86, 3, 193, 21, 2, 'hi'));
  for (const y of [-71, -21, 29, 89]) out.push(screw(122, y, 23, 1.5));
  out.push(S(130, -82, 7, 181, 13, .8, 'lo', .5));
  for (let y = -78; y <= 95; y += 5) out.push(L([137, y, 14], [y % 20 === 2 ? 131 : 133, y, 14], y % 20 === 2 ? 'mid' : 'lo'));
  for (const x of [-122, 122]) for (const y of [-87, 106]) out.push(S(x - 7, y, 14, 5, 13, 13), screw(x, y + 2.5, 26, 1.7));
  // Impression cylinder starts parked clear of the forme; move only this group.
  out.push('<g id="press-carriage">');
  out.push(S(-132, -89, 20, 25, 23, 21), S(-129, -87, 14, 21, 44, 4));
  out.push(roller(-134, 139, -76, 44, 4));
  out.push('<g class="press-rubber">' + roller(-109, 108, -76, 44, 22, 'hi') + '</g>');
  for (const x of [-110, 108]) out.push(roller(x, x + 2, -76, 44, 23, 'mid'));
  out.push(S(112, -89, 20, 25, 23, 21), S(115, -87, 14, 21, 44, 4));
  for (const x of [-125, -118, 118, 125]) out.push(screw(x, -83, 48, 1.4), screw(x, -69, 48, 1.4));
  // Crank arm and knurled handle, retained on the end of the cylinder axle.
  out.push(roller(135, 145, -76, 44, 8));
  out.push(S(141, -79, 5, 6, 43, 32, 'mid', 1));
  out.push(roller(143, 154, -76, 75, 4));
  out.push(C(152, -76, 5, 70, 20, 'hi'), k.lineSvg(k.knurl(152, -76, 5, 71, 89, 18, P), { tone: 'lo' }));
  out.push('</g>');
  // Fore-edge furniture stores spare spacing material and the composing tool.
  for (let i = 0; i < 6; i++) out.push(S(-88 + i * 19, 107, 15, 7, 13, 2 + (i % 3), 'mid', .4));
  out.push(S(-137, -80, 4, 82, 13, 4, 'mid', .7));
  out.push(S(-137, -80, 12, 4, 13, 4, 'mid', .7));
  out.push(screw(-131, -76, 17, 1.2));
  return out.join('');
}
export function drawType(k, layout) {
  const P = pressProjection(k);
  const S = (x, y, w, d, z, h, tone = 'mid') => k.solidSvg(k.slabOf({ x, y, w, d, r: .25 }, z, h, P, 1, .12), { tone });
  const scale = Math.min(184 / Math.max(1, layout.width), 150 / Math.max(1, layout.height));
  const ox = -layout.width * scale / 2, oy = -62;
  const out = [S(ox, oy, layout.width * scale, layout.height * scale, 17, .3, 'lo')];
  // Margin furniture surrounds the type; word rectangles use measured browser positions.
  const margin = layout.margin * scale;
  out.push(S(ox, oy, margin, layout.height * scale, 17.3, 4, 'lo'));
  out.push(S(ox + layout.width * scale - margin, oy, margin, layout.height * scale, 17.3, 4, 'lo'));
  out.push(S(ox + margin, oy, (layout.width - 2 * layout.margin) * scale, margin, 17.3, 4, 'lo'));
  for (const word of layout.words.slice(0, 75)) {
    const x = ox + word.x * scale, y = oy + word.y * scale;
    const w = Math.max(.5, word.width * scale), d = Math.max(.5, word.height * scale * .68);
    out.push(S(x, y, w, d, 17.4, 5, 'hi'));
    // Individual character joints are cut into each metal word assembly.
    for (let i = 1; i < word.text.length; i++) out.push(k.lineSvg(k.segment([x + w * i / word.text.length, y, 22.4], [x + w * i / word.text.length, y + d, 22.4], P), { tone: 'faint' }));
    out.push(k.faceTextSvg(k.topMatrix([x + w / 2, y + d * .76], 22.5, P, 'x'), word.text, { size: Math.min(d * .86, w / Math.max(1, word.text.length) * 1.8), tone: 'hi', anchor: 'middle' }));
  }
  return out.join('');
}
export function carriageTransform(k, progress) {
  return k.translateAlong(pressProjection(k), [0, Math.max(0, Math.min(1, progress)) * 169, 0]);
}
