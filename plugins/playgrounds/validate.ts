// Publish-time checks for component kit markup (`data-pg` elements). The kit ignores
// attributes it doesn't read and splits options on every comma, so mistakes show up
// as a card that silently drops units or controls. This catches them before publishing.

type AttrType = "text" | "number" | "positive" | "count" | "integer" | "name" | "options" | "value" | readonly string[];

// What the kit reads from each component's own element (controls.ts, charts.ts, sets.ts).
const SPEC = { param: "name", label: "text", unit: "text", scale: ["lin", "log"], min: "number", max: "number", step: "positive", value: "value", options: "options" } as const;
export const KIT_ATTRIBUTES: Record<string, Record<string, AttrType>> = {
  field: { ...SPEC, input: ["text", "number"], placeholder: "text", prefix: "text", help: "text" },
  select: SPEC,
  slider: SPEC,
  tabs: SPEC,
  list: { ...SPEC, notes: "text" },
  board: { ...SPEC, rows: "count", cols: "count", pieces: "text", shape: "text" },
  dial: SPEC,
  fader: SPEC,
  stepper: SPEC,
  segmented: SPEC,
  picker: { ...SPEC, caption: "text" },
  toggle: SPEC,
  steps: { ...SPEC, rows: "text", steps: "count" },
  scrub: { ...SPEC, prefix: "text" },
  keyboard: { label: "text", keys: "text", count: "count", from: "integer", octaves: "text" },
  pads: { pads: "text", cols: "count" },
  presets: { label: "text" },
  scope: {},
  readouts: {},
  table: { name: "text" },
  chart: { name: "text", label: "text", kind: ["line", "area", "step", "bars"], height: "positive" },
  agent: { empty: "text" },
  meter: {},
  record: {},
  send: { label: "text" },
  run: { name: "text", duration: "positive", unit: "text", chart: "text", speed: "positive", autoplay: "text" },
  turn: {},
  guide: { param: "name", label: "text" },
  photos: {},
  answer: { name: "text", label: "text" },
  breakdown: { name: "text" },
};
// Allowed on every component: the kit's conditional display, and styling hooks its CSS reads.
export const SHARED_ATTRIBUTES = ["pg", "show", "tone", "primary"];
const BOUND = ["field", "select", "slider", "tabs", "list", "board", "dial", "fader", "stepper", "segmented", "picker", "toggle", "steps", "scrub"];
const CHOICE = ["select", "segmented", "tabs", "list", "picker"];
const NUMERIC = ["field", "slider", "dial", "fader", "stepper", "scrub"];
const NAMED = ["table", "chart", "answer", "breakdown"];
const ALIASES: Record<string, string[]> = {
  suffix: ["unit"], units: ["unit"], default: ["value"], initial: ["value"], val: ["value"],
  minimum: ["min"], maximum: ["max"], increment: ["step"], choices: ["options"], items: ["options"],
  title: ["label"], text: ["label"], placeholder: ["label"], name: ["param"], param: ["name"], id: ["name", "param"],
  pre: ["prefix"], currency: ["prefix"], type: ["kind", "input"],
};

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0" };
function decode(s: string) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] !== "#") return ENTITIES[e.toLowerCase()] ?? m;
    const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1));
    return code <= 0x10ffff ? String.fromCodePoint(code) : m;
  });
}
const plain = (raw: string) => (raw.trim() !== "" && Number.isFinite(Number(raw)) ? Number(raw) : null);
const blank = (m: string) => m.replace(/[^\n]/g, " ");

function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const next = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = row[j]!;
      row[j] = next;
    }
  }
  return row[b.length]!;
}

// The kit splits on every comma, then takes the text before and after the first colon.
function checkOptions(raw: string) {
  const problems: string[] = [];
  const entries = raw.split(",").map((part) => part.split(":"));
  const values = entries.map((p) => p[0]!.trim());
  if (values.some((v) => !v)) problems.push(`data-options has an empty entry (a stray or doubled comma): "${raw}".`);
  const labelled = entries.filter((p) => p.length > 1).length;
  const bare = entries.filter((p) => p.length === 1 && p[0]!.trim()).map((p) => p[0]!.trim());
  if (labelled && bare.length)
    problems.push(
      `data-options splits on every comma, so a label with a comma becomes extra options (${[...new Set(bare)].map((v) => `"${v}"`).join(", ")}). Write each entry as value:label and take commas out of labels (for example "1–16" instead of "1,2,4,8,16").`,
    );
  const colons = entries.filter((p) => p.length > 2).map((p) => p.join(":").trim());
  if (colons.length)
    problems.push(`data-options labels can't contain ":" (the kit drops everything after the second one): ${colons.map((v) => `"${v}"`).join(", ")}.`);
  const dupes = [...new Set(values.filter((v, i) => v && values.indexOf(v) !== i))];
  if (dupes.length && !(labelled && bare.length)) problems.push(`data-options repeats the value ${dupes.map((v) => `"${v}"`).join(", ")}; each value must be unique.`);
  return { problems, values };
}

function suggest(kind: string, name: string, value: string) {
  const allowed = Object.keys(KIT_ATTRIBUTES[kind]!);
  const hit = (ALIASES[name] ?? []).find((a) => allowed.includes(a)) ?? allowed.find((a) => distance(a, name) <= Math.min(2, a.length - 2));
  if (hit === "unit") return `use data-unit="${value.trim()}" (the kit's name for the unit after a number; it adds the space itself)`;
  if (hit) return `use data-${hit}`;
  return allowed.length ? `${kind} reads ${allowed.map((a) => `data-${a}`).join(", ")}` : `${kind} reads no data-* attributes of its own`;
}

function checkElement(kind: string, attrs: Map<string, string>) {
  const problems: string[] = [];
  const known = KIT_ATTRIBUTES[kind];
  if (!known) {
    const close = Object.keys(KIT_ATTRIBUTES).find((k) => distance(k, kind) <= 2);
    return [
      `data-pg="${kind}" isn't a kit component${close ? `; did you mean "${close}"?` : "."} Components: ${Object.keys(KIT_ATTRIBUTES).join(", ")}. Use another attribute name for your own elements.`,
    ];
  }
  for (const [name, value] of attrs) {
    if (SHARED_ATTRIBUTES.includes(name) || name in known) continue;
    problems.push(`data-${name} isn't a ${kind} attribute, so the kit ignores it; ${suggest(kind, name, value)}.`);
  }
  const number = (name: string, type: AttrType) => {
    const raw = attrs.get(name)!;
    const n = plain(raw);
    if (n === null) problems.push(`data-${name}="${raw}" must be a plain number (no units or thousands separators).`);
    else if (type === "positive" && !(n > 0)) problems.push(`data-${name}="${raw}" must be greater than 0.`);
    else if (type === "count" && !(Number.isInteger(n) && n > 0)) problems.push(`data-${name}="${raw}" must be a whole number above 0.`);
    else if (type === "integer" && !Number.isInteger(n)) problems.push(`data-${name}="${raw}" must be a whole number.`);
  };
  for (const [name, type] of Object.entries(known)) {
    const raw = attrs.get(name);
    if (raw === undefined) continue;
    if (type === "number" || type === "positive" || type === "count" || type === "integer") number(name, type);
    else if (typeof type !== "string" && !type.includes(raw)) problems.push(`data-${name}="${raw}" must be one of ${type.map((t) => `"${t}"`).join(", ")}.`);
    else if (type === "name" && !/^[A-Za-z][\w-]*$/.test(raw)) problems.push(`data-${name}="${raw}" must start with a letter and use only letters, digits, - and _.`);
  }
  if (BOUND.includes(kind) && !attrs.get("param")) problems.push(`${kind} needs data-param (the parameter it sets); without it the kit skips the control.`);
  if (NAMED.includes(kind) && !attrs.get("name")) problems.push(`${kind} needs data-name, the name your script passes to ui.${kind}().`);
  const rawOptions = attrs.get("options");
  const options = rawOptions === undefined ? null : checkOptions(rawOptions);
  if (options) problems.push(...options.problems);
  if (CHOICE.includes(kind) && !rawOptions) problems.push(`${kind} needs data-options="value:Label,value:Label"; without it the kit skips the control.`);
  const value = attrs.get("value");
  if (value !== undefined && options && !options.problems.length) {
    if (!options.values.includes(value)) problems.push(`data-value="${value}" isn't one of the data-options values (${options.values.map((v) => `"${v}"`).join(", ")}).`);
  } else if (value !== undefined && kind === "toggle") {
    if (value !== "true" && value !== "false") problems.push(`data-value="${value}" must be "true" or "false" on a toggle.`);
  } else if (NUMERIC.includes(kind) && !options && attrs.get("input") !== "text") {
    const min = attrs.has("min") ? plain(attrs.get("min")!) : 0;
    const max = attrs.has("max") ? plain(attrs.get("max")!) : 1;
    const v = value === undefined ? undefined : plain(value);
    if (v === null) problems.push(`data-value="${value}" must be a plain number (no units or thousands separators).`);
    const defaults = [attrs.has("min") ? "" : "data-min defaults to 0", attrs.has("max") ? "" : "data-max defaults to 1"].filter(Boolean);
    const note = defaults.length ? ` (${defaults.join(", ")})` : "";
    if (typeof min === "number" && typeof max === "number") {
      if (min >= max) problems.push(`data-min (${min}) must be below data-max (${max})${note}.`);
      else if (typeof v === "number" && (v < min || v > max))
        problems.push(`data-value="${value}" is outside ${min}–${max}${note}, so the kit clamps it; set data-min and data-max around it.`);
      if (attrs.get("scale") === "log" && min <= 0) problems.push(`data-scale="log" needs data-min above 0.`);
    }
  }
  return problems;
}

// Start tags and their data-* attributes, in one linear pass (no backtracking on
// unterminated quotes or tags).
function* startTags(text: string) {
  const name = /[a-zA-Z][^\s/>]*/y, attr = /[^\s"'>/=]+/y, equals = /\s*=\s*/y, bare = /[^\s"'=<>`]+/y;
  const sticky = (re: RegExp, at: number) => ((re.lastIndex = at), re.exec(text));
  let p = 0;
  while ((p = text.indexOf("<", p)) !== -1) {
    const index = p;
    const tag = sticky(name, p + 1);
    p++;
    if (!tag) continue;
    p = name.lastIndex;
    const attrs = new Map<string, string>();
    while (p < text.length && text[p] !== ">") {
      const a = sticky(attr, p);
      if (!a) {
        p++;
        continue;
      }
      p = attr.lastIndex;
      let value = "";
      if (sticky(equals, p)) {
        p = equals.lastIndex;
        const q = text[p];
        if (q === '"' || q === "'") {
          const close = text.indexOf(q, p + 1);
          value = text.slice(p + 1, close === -1 ? text.length : close);
          p = close === -1 ? text.length : close + 1;
        } else if (sticky(bare, p)) {
          value = text.slice(p, bare.lastIndex);
          p = bare.lastIndex;
        }
      }
      const key = a[0].toLowerCase();
      if (key.startsWith("data-") && !attrs.has(key.slice(5))) attrs.set(key.slice(5), decode(value));
    }
    yield { index, name: tag[0].toLowerCase(), attrs };
  }
}

// Blanks comments and script, style and textarea contents (keeping line breaks), so
// markup inside strings isn't read as tags. Linear even when a closer is missing.
function hideRawText(html: string) {
  const open = /<!--|<(script|style|textarea)\b/gi;
  let out = "", from = 0;
  for (let m = open.exec(html); m; m = open.exec(html)) {
    let end = html.length;
    if (m[1] === undefined) {
      const close = html.indexOf("-->", m.index + 4);
      if (close !== -1) end = close + 3;
    } else {
      const close = new RegExp(`</${m[1]}`, "gi"), gt = html.indexOf(">", m.index);
      close.lastIndex = gt;
      const hit = gt === -1 ? null : close.exec(html);
      if (hit) end = hit.index;
    }
    out += html.slice(from, m.index) + blank(html.slice(m.index, end));
    from = open.lastIndex = end;
    if (end === html.length) break;
  }
  return out + html.slice(from);
}

// Every problem with the card's kit markup, each prefixed with its line and element.
export function kitProblems(html: string): string[] {
  const text = hideRawText(html);
  const problems: string[] = [];
  let line = 1, at = 0;
  for (const { index, name, attrs } of startTags(text)) {
    const kind = attrs.get("pg");
    if (kind === undefined) continue;
    for (; at < index; at++) if (text.charCodeAt(at) === 10) line++;
    const id = attrs.get("param") ?? attrs.get("name");
    const where = `line ${line}, <${name} data-pg="${kind}"${id === undefined ? "" : ` ${attrs.has("param") ? "data-param" : "data-name"}="${id}"`}>`;
    for (const problem of checkElement(kind, attrs)) problems.push(`${where}: ${problem}`);
  }
  return problems;
}

const MAX_LISTED = 25;
export function assertKitMarkup(html: string) {
  const problems = kitProblems(html);
  if (!problems.length) return;
  const listed = problems.slice(0, MAX_LISTED).map((p) => `- ${p}`);
  if (problems.length > MAX_LISTED) listed.push(`- …and ${problems.length - MAX_LISTED} more.`);
  throw new Error(
    [
      `Not published: the card's component markup has ${problems.length === 1 ? "a problem" : `${problems.length} problems`} the kit would silently get wrong. Fix ${problems.length === 1 ? "it" : "them all"} and publish again (see the playgrounds skill's Components section).`,
      ...listed,
    ].join("\n"),
  );
}
