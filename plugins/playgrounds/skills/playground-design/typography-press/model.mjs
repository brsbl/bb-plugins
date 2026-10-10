// Original product-design instrument. All typography inputs use CSS units.
export const DEFAULTS = Object.freeze({ fontSize: 16, measure: 44, leading: 1.55, margin: 24 });
export const LIMITS = Object.freeze({ fontSize: [12, 24, 1], measure: [26, 64, 1], leading: [1.1, 2, 0.05], margin: [12, 56, 4] });
export const PRESETS = Object.freeze([
  { name: 'Compact card', hint: 'A smaller measure and tighter spacing make a compact reading surface.', inputs: { fontSize: 14, measure: 32, leading: 1.35, margin: 16 } },
  { name: 'Reading view', hint: 'A longer measure has more room between lines. Follow the start of each new line.', inputs: { fontSize: 18, measure: 52, leading: 1.65, margin: 36 } },
  { name: 'Room to breathe', hint: 'Larger type, shorter lines and wider margins create a slower reading rhythm.', inputs: { fontSize: 21, measure: 38, leading: 1.8, margin: 44 } },
]);
export const SAMPLE = 'A useful interface gives every element room to speak. Type size sets the voice. Line length shapes the reading rhythm. Leading separates one thought from the next, while margins keep the whole composition from feeling crowded.';
export const initialState = Object.freeze({ draft: DEFAULTS, printed: DEFAULTS });
export function normalizeInputs(input, base = DEFAULTS) {
  const result = { ...DEFAULTS };
  for (const [key, [min, max, step]] of Object.entries(LIMITS)) {
    const fallback = typeof base?.[key] === 'number' && Number.isFinite(base[key]) ? base[key] : DEFAULTS[key];
    const value = typeof input?.[key] === 'number' && Number.isFinite(input[key]) ? input[key] : fallback;
    result[key] = Number((min + Math.round((Math.min(max, Math.max(min, value)) - min) / step) * step).toFixed(2));
  }
  return result;
}
export function normalizeState(input) {
  return { draft: normalizeInputs(input?.draft), printed: normalizeInputs(input?.printed) };
}
export function isDirty(state) { return Object.keys(LIMITS).some(key => state.draft[key] !== state.printed[key]); }
export function printState(state) { const safe = normalizeState(state); return { draft: safe.draft, printed: { ...safe.draft } }; }
export function typographyMetrics(inputs) {
  const safe = normalizeInputs(inputs);
  return { fontSize: safe.fontSize, lineHeight: Number((safe.fontSize * safe.leading).toFixed(2)), measureCh: safe.measure, margin: safe.margin };
}
