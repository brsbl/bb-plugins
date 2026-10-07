import { useEffect, useId, useState } from "react";
import { definePluginApp, useRpc, type PluginMessageDirectiveProps } from "@get-bb/plugin-sdk/app";
import type { rpcContract } from "./server.js";
import { computedValues, defaultValues, evaluate, formatValue, idSchema, validValue, type Answer, type AnswerDocument, type Block, type Control, type Values } from "./model.js";
import "./app.css";

function loadInputs(doc: AnswerDocument, key: string): Values {
  const values = defaultValues(doc);
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    if (saved && typeof saved === "object") for (const c of doc.controls) {
      const value = (saved as Record<string, unknown>)[c.id];
      if (validValue(c, value)) values[c.id] = value;
    }
  } catch { /* Storage may be unavailable; exploration still works. */ }
  return values;
}

function Input({ control: c, value, onChange }: { control: Control; value: string | number; onChange: (value: string | number) => void }) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [invalid, setInvalid] = useState(false);
  useEffect(() => { setDraft(String(value)); setInvalid(false); }, [value]);
  const editNumber = (text: string) => {
    setDraft(text);
    const number = text.trim() === "" ? NaN : Number(text);
    const valid = validValue(c, number);
    setInvalid(!valid);
    if (valid) onChange(number);
  };
  return <div className="ia-control">
    <label htmlFor={id}>{c.label}{c.type === "range" && <output htmlFor={id}>{formatValue(Number(value))} {c.unit}</output>}</label>
    {c.type === "select" ? <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>{c.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
      : c.type === "range" ? <input id={id} type="range" min={c.min} max={c.max} step={c.step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
        : <div className="ia-number"><input id={id} type="number" min={c.min} max={c.max} step={c.step} value={draft} aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined} onChange={(e) => editNumber(e.target.value)} />{c.unit && <span>{c.unit}</span>}</div>}
    {invalid && c.type !== "select" && <small id={`${id}-error`} role="alert">Use {c.min}–{c.max} in steps of {c.step}. Results use the last valid value.</small>}
  </div>;
}

function Chart({ block: b, values }: { block: Extract<Block, { type: "chart" }>; values: Values }) {
  const titleId = useId();
  const data = b.series.map((s) => ({ label: s.label, values: s.values.map((v) => evaluate(v, values)) }));
  const numbers = data.flatMap((s) => s.values).filter((n): n is number => n !== null);
  // Normalize first so finite values near Number.MAX_VALUE cannot overflow the scale.
  const magnitude = Math.max(1, ...numbers.map(Math.abs));
  const low = Math.min(0, ...numbers.map((v) => v / magnitude));
  const high = Math.max(0, ...numbers.map((v) => v / magnitude));
  const span = high - low || 1;
  const y = (v: number) => 174 - ((v / magnitude - low) / span) * 144;
  const x = (i: number) => 78 + i * 380 / (b.labels.length - 1);
  const labelIndexes = [...new Set([0, Math.floor((b.labels.length - 1) / 2), b.labels.length - 1])];
  return <section className="ia-chart" aria-labelledby={titleId}>
    <h4 id={titleId}>{b.title}</h4>
    <svg viewBox="0 0 500 216" role="img" aria-label={`${b.title}. Exact values in the data table below.`}>
      {[low, (low + high) / 2, high].map((n, i) => <g key={i}><line x1="78" x2="458" y1={y(n * magnitude)} y2={y(n * magnitude)} className="ia-gridline" /><text x="70" y={y(n * magnitude) + 4} textAnchor="end">{formatValue(n * magnitude, b.format)}</text></g>)}
      {data.map((series, si) => <g key={si} className={`ia-series ia-series-${si}`}>
        {b.style === "line" && series.values.map((v, i, arr) => v !== null && i > 0 && arr[i - 1] !== null ? <line key={i} x1={x(i - 1)} y1={y(arr[i - 1]!)} x2={x(i)} y2={y(v)} strokeWidth="2.5" strokeDasharray={si ? `${8 - si} ${si + 2}` : undefined} /> : null)}
        {series.values.map((v, i) => v === null ? null : b.style === "line" ? <circle key={i} cx={x(i)} cy={y(v)} r="3"><title>{series.label}: {b.labels[i]} — {formatValue(v, b.format)}</title></circle> : <rect key={i} x={78 + i * 380 / b.labels.length + si * (300 / b.labels.length / data.length)} y={Math.min(y(v), y(0))} width={280 / b.labels.length / data.length} height={Math.max(0, Math.abs(y(v) - y(0)))} rx="2"><title>{series.label}: {b.labels[i]} — {formatValue(v, b.format)}</title></rect>)}
      </g>)}
      {labelIndexes.map((i) => <text key={i} x={b.style === "line" ? x(i) : 78 + (i + 0.4) * 380 / b.labels.length} y="200" textAnchor="middle">{b.labels[i].length > 16 ? `${b.labels[i].slice(0, 15)}…` : b.labels[i]}</text>)}
    </svg>
    <div className="ia-legend">{data.map((s, i) => <span key={i}><svg width="24" height="12" aria-hidden="true" className={`ia-series ia-series-${i}`}><line x1="1" x2="23" y1="6" y2="6" strokeWidth="3" strokeDasharray={i ? `${8 - i} ${i + 2}` : undefined} /></svg>{s.label}</span>)}</div>
    {numbers.length !== data.length * b.labels.length && <p role="status">Some values cannot be calculated with these inputs.</p>}
    <details><summary>View chart data</summary><div className="ia-table-scroll"><table><thead><tr><th scope="col">Point</th>{data.map((s, i) => <th key={i} scope="col">{s.label}</th>)}</tr></thead><tbody>{b.labels.map((label, i) => <tr key={i}><th scope="row">{label}</th>{data.map((s, j) => <td key={j}>{formatValue(s.values[i], b.format)}</td>)}</tr>)}</tbody></table></div></details>
  </section>;
}

export function AnswerView({ answer }: { answer: Answer }) {
  const doc = answer.document;
  const key = `interactive-answers:${answer.threadId}:${answer.id}`;
  const [inputs, setInputs] = useState(() => loadInputs(doc, key));
  const [resetCount, setResetCount] = useState(0);
  const [storageFailed, setStorageFailed] = useState(false);
  const values = computedValues(doc, inputs);
  const save = (next: Values) => {
    setInputs(next);
    try { localStorage.setItem(key, JSON.stringify(next)); setStorageFailed(false); }
    catch { setStorageFailed(true); }
  };
  return <article className="ia-answer" aria-label={doc.title}>
    <header><div><span className="ia-eyebrow">Explore</span><h3>{doc.title}</h3></div>{doc.controls.length > 0 && <button type="button" className="ia-reset" title="Reset inputs" aria-label="Reset inputs" onClick={() => { save(defaultValues(doc)); setResetCount((n) => n + 1); }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" /></svg></button>}</header>
    {doc.description && <p className="ia-description">{doc.description}</p>}
    {doc.controls.length > 0 && <div className="ia-controls" key={resetCount}>{doc.controls.map((c) => <Input key={c.id} control={c} value={inputs[c.id]} onChange={(value) => save({ ...inputs, [c.id]: value })} />)}</div>}
    <div className="ia-blocks">{doc.blocks.map((b, i) => {
      if (b.when && inputs[b.when.control] !== b.when.equals) return null;
      switch (b.type) {
        case "text": return <section key={i}>{b.title && <h4>{b.title}</h4>}<p>{b.text}</p></section>;
        case "metrics": return <dl className="ia-metrics" key={i} aria-live="polite">{b.items.map((m, j) => <div key={j}><dt>{m.label}</dt><dd>{formatValue(evaluate(m.value, values), m.format)}</dd></div>)}</dl>;
        case "chart": return <Chart key={i} block={b} values={values} />;
        case "details": return <details key={i}><summary>{b.title}</summary><p>{b.text}</p></details>;
        case "table": return <section key={i}><div className="ia-table-scroll"><table><caption>{b.title}</caption><thead><tr>{b.columns.map((c, j) => <th key={j} scope="col">{c}</th>)}</tr></thead><tbody>{b.rows.map((row, j) => <tr key={j}>{row.map((v, k) => <td key={k}>{typeof v === "string" ? v : formatValue(evaluate(v, values), b.format)}</td>)}</tr>)}</tbody></table></div></section>;
      }
    })}</div>
    {doc.controls.length > 0 && <footer>{storageFailed ? "Inputs work here but could not be saved in this browser." : "Inputs stay in this browser."}</footer>}
  </article>;
}

function AnswerDirective({ attributes, message }: PluginMessageDirectiveProps) {
  const rpc = useRpc<typeof rpcContract>();
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const id = attributes.id;
  const threadId = message.threadId;
  useEffect(() => {
    let active = true;
    setAnswer(null); setError(null);
    if (!idSchema.safeParse(id).success) { setError("This interactive answer has an invalid ID."); return; }
    void rpc.call("get", { id, threadId }).then((value) => { if (active) setAnswer(value); }).catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Could not load this answer."); });
    return () => { active = false; };
  }, [rpc, id, threadId, attempt]);
  if (error) return <div className="ia-answer ia-error" role="alert"><p>{error}</p><button type="button" onClick={() => setAttempt((n) => n + 1)}>Retry</button></div>;
  return answer ? <AnswerView key={`${answer.threadId}:${answer.id}`} answer={answer} /> : <div className="ia-answer" role="status">Loading interactive answer…</div>;
}
export default definePluginApp((app) => { app.slots.messageDirective({ id: "interactive-answer", component: AnswerDirective }); });
