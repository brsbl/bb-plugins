import type { AnswerDocument, Block, Expression } from "./model.js";
type Shape = Extract<Block, { type: "diagram" }>["elements"][number];
const ref = (name: string): Expression => ({ ref: name });
const mul = (a: Expression, b: Expression): Expression => ({ op: "multiply", args: [a, b] });
const add = (a: Expression, b: Expression): Expression => ({ op: "add", args: [a, b] });
const rect = (x: number, y: number, width: number, height: number, fill: Shape["fill"], rx = 0): Shape => ({ kind: "rect", x, y, width, height, fill, rx });
const path = (d: string, fill: Shape["fill"], stroke = "none", strokeWidth = 1): Shape => ({ kind: "path", d, fill, stroke, strokeWidth });
const line = (x: number, y: number, x2: number, y2: number, stroke: string, strokeWidth = 1): Shape => ({ kind: "line", x, y, x2, y2, stroke, strokeWidth });
const ellipse = (x: number, y: number, rx: number, ry: number, fill: Shape["fill"], stroke = "none", strokeWidth = 1): Shape => ({ kind: "ellipse", x, y, rx, ry, fill, stroke, strokeWidth });
const text = (x: number, y: number, content: string, fill = "#344039", fontSize = 16): Shape => ({ kind: "text", x, y, text: content, fill, fontSize });
const diagram = (title: string, description: string, elements: Shape[]): Block => ({ type: "diagram", title, description, width: 760, height: 390, elements });
const choice = (id: string, label: string, options: string[], value = options[0]): AnswerDocument["controls"][number] => ({ id, label, type: "select", options: options.map((value) => ({ value, label: value })), value });
const note = (title: string, body: string, control?: string, value?: string | number): Block => ({ type: "text", title, text: body, ...(control ? { when: { control, equals: value! } } : {}) });

const wheel = (cx: number, cy: number, moving: boolean): Shape[] => {
  const x = moving ? add(cx, mul(ref("release"), .65)) : cx;
  const y = moving ? add(cy, mul(ref("release"), -.65)) : cy;
  return [
    { ...ellipse(0, 0, 75, 75, "#ffffff", "#253436", 9), x, y },
    { ...ellipse(0, 0, 66, 66, "none", "#d4dbd9", 2), x, y },
    ...Array.from({ length: 12 }, (_, i): Shape => ({ kind: "path", d: "M0 0 L0 -64", x, y, rotate: add(i * 30, mul(ref("spin"), 3.6)), stroke: "#b4c0be", strokeWidth: 1.5 })),
    { ...ellipse(0, 0, 7, 7, "#526460"), x, y },
  ];
};
export const bike: AnswerDocument = {
  title: "Understand your bike before you fix it",
  description: "An interactive repair explainer. Turn the wheel, then lift it away from the fork to see how the parts fit.",
  controls: [
    { id: "release", label: "Lift the front wheel", type: "range", min: 0, max: 100, step: 1, value: 0, unit: "%" },
    { id: "spin", label: "Turn the wheel", type: "range", min: 0, max: 100, step: 1, value: 0, unit: "%" },
  ], calculations: [], blocks: [diagram("A closer look at the front wheel", "Yellow bicycle with an independently movable front wheel. The lift slider separates the wheel from its fork, and the turn slider rotates its spokes.", [
    rect(0, 0, 760, 390, "#f4f5ed"), ellipse(380, 328, 280, 13, "#e0e5da"),
    ...wheel(208, 240, false), ...wheel(514, 240, true),
    path("M208 240 L292 112 L367 240 Z M292 112 L475 112 L367 240 M475 112 L514 240", "none", "#d1b236", 13),
    path("M367 240 L317 93 M475 112 L462 77 L489 58 L516 58", "none", "#344944", 8),
    path("M284 90 L330 90", "none", "#263b36", 12), ellipse(367, 240, 25, 25, "#485954"), ellipse(367, 240, 16, 16, "#c4cdbe"),
    path("M208 240 L367 240 M367 240 L396 254 L414 254", "none", "#64746a", 4),
    path("M486 129 L515 239 M474 129 L503 239", "none", "#77887e", 5),
    text(36, 40, "01 / EXPLODED VIEW", "#707d6e", 13),
    text(530, 104, "Front wheel", "#344039", 17), line(532, 113, -22, 47, "#91a090"),
    text(50, 354, "Release the brake and axle before removing a wheel.", "#60715f", 14),
  ]), note("See the mechanism", "The fork holds the axle at the center of the wheel. This simplified illustration explains that connection; follow your bike manufacturer's instructions for the actual repair.")],
};

const places = ["Golden Gate Park", "North Beach", "The Mission"];
const placePositions = [[238, 218], [522, 115], [459, 290]];
const mapElements: Shape[] = [rect(0, 0, 760, 390, "#b9dce1"),
  path("M165 0 L444 0 L454 33 L491 48 L530 61 L549 95 L578 135 L597 182 L606 238 L630 294 L650 390 L147 390 L149 290 L141 210 L158 108 Z", "#f7f4e9"),
  rect(157, 191, 236, 49, "#b5cc9b", 6), path("M178 0 L328 0 L317 102 L173 144 Z", "#c8d9b0"),
  ...Array.from({ length: 9 }, (_, i) => line(186 + i * 43, 132, 0, 255, "#dedfd6", 2)),
  ...Array.from({ length: 9 }, (_, i) => line(174, 104 + i * 29, 408, 0, "#dedfd6", 2)),
  path("M465 375 L446 300 L433 250 L470 212 L506 158 L532 98", "none", "#d0c5ae", 7),
  text(34, 193, "PACIFIC", "#4d8690", 13), text(39, 213, "OCEAN", "#4d8690", 13), text(628, 115, "THE BAY", "#4d8690", 13),
  text(237, 32, "San Francisco", "#4a5548", 22), text(193, 263, "SUNSET", "#98a08e", 11), text(381, 175, "WESTERN ADDITION", "#98a08e", 10),
  path("M318 101 L366 104 L424 88 L518 112", "none", "#c0cdb5", 3),
];
places.forEach((place, i) => {
  const [x, y] = placePositions[i];
  mapElements.push({ ...ellipse(x, y, 29, 29, "#dcab53"), when: { control: "place", equals: place }, opacity: .5 });
  mapElements.push({ ...ellipse(x, y, 16, 16, "#2f6959", "#ffffff", 3), label: `Explore ${place}`, choose: { control: "place", value: place } });
  mapElements.push(text(x - 4, y + 5, String(i + 1), "#ffffff", 14));
});
mapElements.push(text(22, 369, "Illustrated neighborhood map · not for navigation", "#4d7c81", 11));
export const city: AnswerDocument = {
  title: "San Francisco, your way", description: "Pick a neighborhood to explore a different kind of afternoon.",
  controls: [choice("place", "Where to explore", places)], calculations: [], blocks: [diagram("Three starting points for a day out", "Illustrated San Francisco map with selectable markers for Golden Gate Park, North Beach, and the Mission. Use the neighborhood menu or activate a numbered marker.", mapElements),
    note("01 / Golden Gate Park", "Start with the gardens, wander the park's paths, and leave time to stop at a museum. Best for a slower afternoon outdoors.", "place", places[0]),
    note("02 / North Beach", "Explore the neighborhood on foot, browse a bookshop, and stop for coffee. Best for a compact afternoon of city wandering.", "place", places[1]),
    note("03 / The Mission", "Look for murals, visit local shops, and take a break in Dolores Park. Best for art, food, and a sunny park stop.", "place", places[2]),
  ],
};

const palettes = [
  { value: "Soft lilac", color: "#aaa6ce", shade: "#8d89b1" },
  { value: "Garden sage", color: "#a3b8a5", shade: "#829d87" },
  { value: "Open sky", color: "#9fc5e1", shade: "#7ca3bd" },
  { value: "Warm sand", color: "#d4c6ae", shade: "#b5a28a" },
  { value: "Terracotta", color: "#c68f78", shade: "#a96e5b" },
  { value: "Chalk", color: "#e8e6df", shade: "#c6c3b9" },
];
const wall = (shade: boolean): Shape["fill"] => ({ control: "color", colors: palettes.map((p) => ({ value: p.value, color: shade ? p.shade : p.color })) });
const roomElements: Shape[] = [rect(0, 0, 760, 390, "#ece9e1"),
  path("M73 31 L525 31 L525 243 L73 297 Z", wall(false)), path("M525 31 L690 79 L690 298 L525 243 Z", wall(true)),
  path("M73 297 L525 243 L690 298 L253 366 Z", "#bf9e7b"),
  ...Array.from({ length: 8 }, (_, i) => line(107 + i * 54, 293 - i * 6.5, 158, 65, "#a88563", 1)),
  path("M73 287 L525 234 L690 289", "none", "#f3efe7", 7),
  rect(134, 70, 101, 137, "#f8f3dd", 2), rect(143, 79, 38, 55, "#d3e2df"), rect(188, 79, 38, 55, "#d3e2df"),
  rect(143, 141, 38, 55, "#e9eadb"), rect(188, 141, 38, 55, "#e9eadb"),
  { ...path("M134 207 L235 207 L430 324 L302 341 Z", "#fff6d8"), opacity: mul(ref("light"), .006) },
  rect(348, 72, 87, 84, "#806b52", 1), rect(354, 78, 75, 72, "#f0e7d7"), path("M360 143 L388 98 L422 143 Z", "#b8b998"), ellipse(409, 94, 8, 8, "#cdac72"),
  ellipse(404, 292, 128, 20, "#af947b"), path("M284 215 L484 197 L532 267 L326 292 Z", "#e6ded0"),
  rect(283, 181, 206, 73, "#e9e1d4", 13), rect(285, 232, 213, 40, "#d9cdbc", 8),
  rect(272, 209, 24, 63, "#c6b9a5", 9), rect(486, 196, 25, 62, "#c6b9a5", 9),
  rect(302, 193, 47, 39, "#8b9985", 7), rect(430, 185, 45, 39, "#b98866", 7),
  line(317, 271, 0, 18, "#775a3f", 5), line(491, 258, 0, 16, "#775a3f", 5),
  ellipse(237, 306, 39, 13, "#8e7254"), line(237, 270, 0, 35, "#846b50", 5), ellipse(237, 269, 44, 15, "#d1b78d"),
  line(598, 175, 0, 86, "#736b49", 4), path("M568 126 L621 126 L636 179 L552 179 Z", "#eee0b6"), ellipse(596, 265, 22, 5, "#736b49"),
  path("M107 280 L128 280 L134 252 L101 252 Z", "#b67e61"), path("M117 253 C82 223 87 212 105 224 C103 196 125 202 119 236 C133 205 149 216 124 245 Z", "#697d55"),
];
export const room: AnswerDocument = {
  title: "Try the color before you paint", description: "Change the wall color and daylight to compare the same room in six palettes.",
  controls: [choice("color", "Wall color", palettes.map((p) => p.value)), { id: "light", label: "Daylight", type: "range", min: 0, max: 100, step: 1, value: 50, unit: "%" }], calculations: [],
  blocks: [diagram("A room, six possibilities", "Illustrated living room with walls bound to the selected palette. The daylight slider changes a sunlit patch across the floor.", roomElements),
    ...palettes.map((p) => note(p.value, `Wall color ${p.color.toUpperCase()}. Compare the mood here, then check a physical paint sample in your own light.`, "color", p.value)),
  ],
};

const folds: Shape[][] = [
  [path("M250 57 L506 57 L506 313 L250 313 Z", "#eab07a"), path("M250 57 L506 313", "none", "#b96837", 2)],
  [path("M232 291 L380 65 L528 291 Z", "#e99e61"), path("M380 66 L380 290", "none", "#c77842", 2), path("M232 291 L380 190 L528 291 Z", "#f3bd88")],
  [path("M262 284 L235 79 L380 199 L526 79 L498 284 L380 329 Z", "#e99658"), path("M262 284 L380 199 L498 284 L380 329 Z", "#efb37f"), path("M235 79 L311 155 L269 205 Z M526 79 L450 155 L490 205 Z", "#f6c995")],
  [path("M260 265 L239 61 L344 150 L421 150 L523 61 L503 265 L381 332 Z", "#df8c4a"), path("M249 85 L316 163 L271 183 Z M512 85 L448 163 L491 183 Z", "#f2bf88"), path("M260 265 L320 211 L381 292 L443 211 L503 265 L381 332 Z", "#fff0d9"), ellipse(331, 216, 8, 9, "#42372e"), ellipse(433, 216, 8, 9, "#42372e"), path("M363 286 L398 286 L381 304 Z", "#42372e")],
];
const foldSteps = ["1. Start with a square", "2. Fold a triangle", "3. Lift the ears", "4. Finish the face"];
export const origami: AnswerDocument = {
  title: "Fold a little paper fox", description: "Move through the folds at your own pace. Each step changes the illustration.",
  controls: [choice("step", "Fold", foldSteps)], calculations: [],
  blocks: [diagram("One sheet becomes a character", "Four simplified stages for a flat origami fox face: square sheet, triangle, raised ears, and finished face. Choose a fold to see its paper geometry.", [
    rect(0, 0, 760, 390, "#f5f0e6"), ellipse(380, 341, 130, 10, "#e6dccb"),
    ...folds.flatMap((shapes, i) => shapes.map((s) => ({ ...s, when: { control: "step", equals: foldSteps[i] } }))),
    text(24, 363, "A simple fox face · diagram is schematic", "#8b7b64", 12),
  ]),
    note("Start flat", "Lay a square sheet of paper flat, colored side down. A larger sheet makes the first folds easier to see.", "step", foldSteps[0]),
    note("Make the triangle", "Bring one corner to its opposite corner and crease firmly. Keep the long edge at the bottom.", "step", foldSteps[1]),
    note("Give it ears", "Fold the left and right corners upward. Match the angles so the two pointed ears are balanced.", "step", foldSteps[2]),
    note("Bring the fox to life", "Turn the paper over. Fold the top point down to shape the face, then draw the eyes and nose.", "step", foldSteps[3]),
  ],
};

const cropNames = ["Leafy greens", "Herbs", "Flowers"];
const cropColors: Shape["fill"] = { control: "crop", colors: [{ value: cropNames[0], color: "#5d9257" }, { value: cropNames[1], color: "#799b64" }, { value: cropNames[2], color: "#bd78a0" }] };
const plants: Shape[] = [];
for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) {
  const x = 220 + col * 72 - row * 25, y = 134 + row * 64;
  plants.push({ ...path("M0 9 C-32 6 -36 -29 -8 -13 C-14 -47 13 -49 10 -13 C39 -30 39 5 8 8 Z", cropColors), x, y, scale: add(.25, mul(ref("week"), .065)) });
  plants.push({ ...path("M0 11 L0 -14", "none", "#3c663f", 2), x, y, scale: add(.25, mul(ref("week"), .065)) });
}
export const garden: AnswerDocument = {
  title: "Your first raised-bed garden", description: "Choose what to grow, then move through the season to see how the bed fills in.",
  controls: [choice("crop", "Planting plan", cropNames), { id: "week", label: "Weeks of growth", type: "range", min: 0, max: 12, step: 1, value: 2, unit: "weeks" }], calculations: [],
  blocks: [diagram("Start small. Watch it grow.", "Illustrated raised garden bed with fifteen plants. Growth is a schematic size progression over twelve weeks, not a crop yield forecast.", [
    rect(0, 0, 760, 390, "#edf1e2"), ellipse(381, 308, 260, 25, "#d7dfc9"),
    path("M181 90 L621 90 L550 307 L110 307 Z", "#8d6347"), path("M110 307 L550 307 L550 333 L110 333 Z", "#b6855e"), path("M550 307 L621 90 L621 117 L550 333 Z", "#966a48"),
    path("M197 108 L595 108 L536 286 L135 286 Z", "#574c35"),
    ...Array.from({ length: 4 }, (_, i) => line(209 + i * 82, 108, -61, 178, "#72634a", 2)),
    ...plants, text(28, 44, "4 × 8 FT RAISED BED", "#667758", 13),
    ellipse(670, 45, 18, 18, "#e0ba60"), ...Array.from({ length: 8 }, (_, i): Shape => ({ kind: "path", d: "M0 -25 L0 -32", x: 670, y: 45, rotate: i * 45, stroke: "#d5ae57", strokeWidth: 2 })),
    text(24, 368, "Illustrative growth · timing depends on your climate and crop", "#75836a", 12),
  ]),
    note("Leafy greens", "A beginner-friendly plan for a productive small space. Follow the seed packet for spacing, sun, and harvest timing.", "crop", cropNames[0]),
    note("Herbs", "Choose herbs you cook with and check each plant's spacing. Group plants with similar light and watering needs.", "crop", cropNames[1]),
    note("Flowers", "Choose flowers suited to your climate and available sun. Mix bloom times to keep color through the season.", "crop", cropNames[2]),
  ],
};
export const visualExamples: Record<string, AnswerDocument> = { bike, city, room, origami, garden };
