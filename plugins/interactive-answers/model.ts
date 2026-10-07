import { z } from "zod";

const label = z.string().trim().min(1).max(160);
const name = z.string().regex(/^[a-z][a-z0-9_]{0,39}$/);
export const idSchema = z.string().uuid();
export const threadSchema = z.string().min(1).max(100);
export type Expression = number | { ref: string } | { op: "add" | "subtract" | "multiply" | "divide" | "power" | "min" | "max" | "round"; args: Expression[] };
const expression: z.ZodType<Expression> = z.lazy(() => z.union([
  z.number().finite(), z.object({ ref: name }).strict(),
  z.object({ op: z.enum(["add", "subtract", "multiply", "divide", "power", "min", "max", "round"]), args: z.array(expression).min(1).max(12) }).strict()
    .refine(({ op, args }) => op === "round" ? args.length === 1 : ["subtract", "divide", "power"].includes(op) ? args.length === 2 : args.length >= 2, "Wrong number of operands"),
]));
const format = z.object({ prefix: z.string().max(16).optional(), suffix: z.string().max(24).optional(), decimals: z.number().int().min(0).max(6).optional() }).strict();
const numericControl = z.object({ id: name, label, type: z.enum(["number", "range"]), min: z.number().finite(), max: z.number().finite(), step: z.number().positive().finite(), value: z.number().finite(), unit: z.string().max(24).optional() }).strict()
  .refine((c) => c.min < c.max && c.value >= c.min && c.value <= c.max && Number.isFinite(c.max - c.min) && c.step <= c.max - c.min, "Invalid control range or default");
const choiceControl = z.object({ id: name, label, type: z.literal("select"), options: z.array(z.object({ value: z.string().min(1).max(80), label }).strict()).min(2).max(12), value: z.string().min(1).max(80) }).strict()
  .refine((c) => new Set(c.options.map((o) => o.value)).size === c.options.length && c.options.some((o) => o.value === c.value), "Choices must be unique and include the default");
const when = z.object({ control: name, equals: z.union([z.string().max(80), z.number().finite()]) }).strict().optional();
const metric = z.object({ label, value: expression, format: format.optional() }).strict();
export const documentSchema = z.object({
  title: label,
  description: z.string().max(1200).optional(),
  controls: z.array(z.union([numericControl, choiceControl])).max(12).default([]),
  calculations: z.array(z.object({ id: name, value: expression }).strict()).max(30).default([]),
  blocks: z.array(z.discriminatedUnion("type", [
    z.object({ type: z.literal("text"), title: label.optional(), text: z.string().min(1).max(4000), when }).strict(),
    z.object({ type: z.literal("metrics"), items: z.array(metric).min(1).max(6), when }).strict(),
    z.object({ type: z.literal("chart"), title: label, style: z.enum(["line", "bar"]), labels: z.array(z.string().min(1).max(80)).min(2).max(40), series: z.array(z.object({ label, values: z.array(expression).min(2).max(40) }).strict()).min(1).max(4), format: format.optional(), when }).strict(),
    z.object({ type: z.literal("table"), title: label, columns: z.array(label).min(1).max(6), rows: z.array(z.array(z.union([z.string().max(600), expression])).min(1).max(6)).min(1).max(40), format: format.optional(), when }).strict(),
    z.object({ type: z.literal("details"), title: label, text: z.string().min(1).max(6000), when }).strict(),
  ])).min(1).max(24),
}).strict();
export type AnswerDocument = z.infer<typeof documentSchema>;
export type Control = AnswerDocument["controls"][number];
export type Block = AnswerDocument["blocks"][number];
export type Values = Record<string, number | string>;
export const answerSchema = z.object({ id: idSchema, threadId: threadSchema, document: documentSchema }).strict();
export type Answer = z.infer<typeof answerSchema>;

// Bound nesting before recursive schema validation, including documents read from storage.
export function parseDocument(json: string): AnswerDocument {
  if (json.length > 120_000) throw new Error("Keep the answer under 120,000 characters.");
  const raw: unknown = JSON.parse(json);
  const pending = [{ value: raw, depth: 0 }];
  while (pending.length) {
    const { value, depth } = pending.pop()!;
    if (depth > 24) throw new Error("Expressions are nested too deeply.");
    if (value && typeof value === "object") for (const child of Object.values(value)) pending.push({ value: child, depth: depth + 1 });
  }
  const doc = documentSchema.parse(raw);
  const allNames = new Set<string>();
  const numericNames = new Set<string>();
  const reserve = (id: string) => { if (allNames.has(id)) throw new Error(`Duplicate name: ${id}`); allNames.add(id); };
  doc.controls.forEach((c) => { reserve(c.id); if (c.type !== "select") numericNames.add(c.id); });
  const check = (value: Expression): void => {
    if (typeof value === "number") return;
    if ("ref" in value) { if (!numericNames.has(value.ref)) throw new Error(`Unknown numeric reference: ${value.ref}. Calculations may only use controls and earlier calculations.`); }
    else value.args.forEach(check);
  };
  doc.calculations.forEach((c) => { reserve(c.id); check(c.value); numericNames.add(c.id); });
  doc.blocks.forEach((b) => {
    if (b.when) {
      const c = doc.controls.find((c) => c.id === b.when!.control);
      if (!c || (c.type === "select" ? !c.options.some((o) => o.value === b.when!.equals) : typeof b.when.equals !== "number" || b.when.equals < c.min || b.when.equals > c.max)) throw new Error("Visibility conditions must match a control value.");
    }
    if (b.type === "metrics") b.items.forEach((m) => check(m.value));
    if (b.type === "chart") b.series.forEach((s) => { if (s.values.length !== b.labels.length) throw new Error("Every series needs a value for each chart label."); s.values.forEach(check); });
    if (b.type === "table") b.rows.forEach((row) => { if (row.length !== b.columns.length) throw new Error("Every table row needs a cell for each column."); row.forEach((v) => { if (typeof v !== "string") check(v); }); });
  });
  return doc;
}

export function evaluate(expr: Expression, values: Values): number | null {
  if (typeof expr === "number") return Number.isFinite(expr) ? expr : null;
  if ("ref" in expr) { const v = Object.hasOwn(values, expr.ref) ? values[expr.ref] : undefined; return typeof v === "number" && Number.isFinite(v) ? v : null; }
  const evaluated = expr.args.map((e) => evaluate(e, values));
  if (evaluated.some((v) => v === null)) return null;
  const args = evaluated as number[];
  const [a, b] = args;
  let result: number;
  switch (expr.op) {
    case "add": result = args.reduce((s, v) => s + v, 0); break;
    case "subtract": result = a - b; break;
    case "multiply": result = args.reduce((s, v) => s * v, 1); break;
    case "divide": result = b === 0 ? NaN : a / b; break;
    case "power": result = a ** b; break;
    case "min": result = Math.min(...args); break;
    case "max": result = Math.max(...args); break;
    case "round": result = Math.round(a); break;
  }
  return Number.isFinite(result) ? result : null;
}
export function computedValues(doc: AnswerDocument, inputs: Values): Values {
  const values = { ...inputs };
  for (const c of doc.calculations) values[c.id] = evaluate(c.value, values) ?? "";
  return values;
}
export function defaultValues(doc: AnswerDocument): Values { return Object.fromEntries(doc.controls.map((c) => [c.id, c.value])); }
export function validValue(control: Control, value: unknown): value is number | string {
  if (control.type === "select") return control.options.some((o) => o.value === value);
  if (typeof value !== "number" || !Number.isFinite(value) || value < control.min || value > control.max) return false;
  const steps = (value - control.min) / control.step;
  return Number.isFinite(steps) && Math.abs(steps - Math.round(steps)) < 1e-7;
}
export function formatValue(value: number | null, style?: z.infer<typeof format>): string {
  if (value === null) return "Unavailable";
  return `${style?.prefix ?? ""}${new Intl.NumberFormat(undefined, { maximumFractionDigits: style?.decimals ?? 2, minimumFractionDigits: style?.decimals ?? 0 }).format(value)}${style?.suffix ?? ""}`;
}
