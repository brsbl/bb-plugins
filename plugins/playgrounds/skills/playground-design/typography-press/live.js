const root = document.querySelector('.typography-press');
const bridge = window.playground;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const draftSheet = root.querySelector('#draft-sheet');
const printedSheet = root.querySelector('#printed-sheet');
const typeBed = root.querySelector('#press-type');
const carriage = root.querySelector('#press-carriage');
let state = normalizeState(bridge.state);
let draftLayout, printedLayout, job = null, elapsed = 0, last = 0, frame = 0, visible = true;
const text = (id, value) => { const element = root.querySelector('#' + id); if (element.textContent !== value) element.textContent = value; };
function sheetStyle(sheet, inputs) {
  sheet.style.setProperty('--type-size', inputs.fontSize + 'px');
  sheet.style.setProperty('--measure', inputs.measure + 'ch');
  sheet.style.setProperty('--leading', inputs.leading);
  sheet.style.setProperty('--margin', inputs.margin + 'px');
}
function readLayout(sheet, inputs) {
  const box = sheet.getBoundingClientRect();
  const words = Array.from(sheet.querySelectorAll('[data-type]')).map(word => {
    const rect = word.getBoundingClientRect();
    return { x: rect.left - box.left, y: rect.top - box.top, width: rect.width, height: rect.height, text: word.textContent };
  });
  const lines = new Set(Array.from(sheet.querySelectorAll('.sample-body [data-type]')).map(word => Math.round(word.getBoundingClientRect().top * 2) / 2));
  return { width: box.width, height: box.height, margin: inputs.margin, words, lines: lines.size, textWidth: sheet.querySelector('.sample-body').getBoundingClientRect().width };
}
function readout() {
  return { draft: { ...state.draft }, printed: { ...state.printed }, pending: !!job, changed: isDirty(state), draftMetrics: { ...typographyMetrics(state.draft), lines: draftLayout?.lines || 0, textWidth: Math.round(draftLayout?.textWidth || 0) }, printedMetrics: { ...typographyMetrics(state.printed), lines: printedLayout?.lines || 0, textWidth: Math.round(printedLayout?.textWidth || 0) } };
}
function save() { bridge.save({ draft: { ...state.draft }, printed: { ...state.printed } }); }
function refresh() {
  sheetStyle(draftSheet, state.draft);
  sheetStyle(printedSheet, state.printed);
  draftLayout = readLayout(draftSheet, state.draft);
  printedLayout = readLayout(printedSheet, state.printed);
  typeBed.innerHTML = drawType(k, draftLayout);
  for (const key of Object.keys(LIMITS)) {
    root.querySelector('#' + key).value = state.draft[key];
    text(key + '-value', key === 'measure' ? state.draft[key] + ' ch' : key === 'leading' ? state.draft[key].toFixed(2) + '×' : state.draft[key] + ' px');
  }
  text('draft-readout', draftLayout.lines + ' body lines · ' + typographyMetrics(state.draft).lineHeight.toFixed(1) + ' px leading');
  text('proof-settings', state.printed.fontSize + ' px / ' + state.printed.leading.toFixed(2) + '× · ' + state.printed.measure + ' ch · ' + state.printed.margin + ' px margins');
  text('proof-readout', printedLayout.lines + ' body lines · ' + Math.round(printedLayout.textWidth) + ' px text measure');
  text('draft-status', isDirty(state) ? 'Type is set. Print to see this composition.' : 'The proof matches the type on the bed.');
  root.querySelectorAll('[data-preset]').forEach(button => {
    const preset = PRESETS[Number(button.dataset.preset)];
    button.setAttribute('aria-pressed', String(Object.keys(LIMITS).every(key => preset.inputs[key] === state.draft[key])));
  });
}
function stopAnimation() {
  if (frame) cancelAnimationFrame(frame);
  frame = 0; last = 0;
}
function cancelJob() {
  stopAnimation(); job = null; elapsed = 0;
  carriage.removeAttribute('transform');
  root.querySelector('#print').disabled = false;
  root.querySelector('.press-stage').setAttribute('aria-busy', 'false');
}
function finishImpression() {
  if (!job || job.impressed) return;
  state.printed = { ...job.inputs };
  job.impressed = true;
  refresh(); save();
  text('press-status', 'Proof printed. Read the rhythm of the lines below.');
}
function completeJob() {
  finishImpression(); cancelJob();
  text('press-status', 'Press ready · type and proof match');
}
function tick(now) {
  frame = 0;
  if (!job || !visible || document.hidden) { last = 0; return; }
  elapsed += last ? Math.min(50, now - last) : 0; last = now;
  const smooth = value => value * value * (3 - 2 * value);
  let travel;
  if (elapsed < 850) travel = smooth(elapsed / 850);
  else { finishImpression(); travel = elapsed < 1000 ? 1 : 1 - smooth(Math.min(1, (elapsed - 1000) / 750)); }
  carriage.setAttribute('transform', carriageTransform(k, travel));
  if (elapsed >= 1750) completeJob();
  else frame = requestAnimationFrame(tick);
}
function resume() {
  if (!job) return;
  if (reduced.matches) { completeJob(); return; }
  if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick);
}
function printProof() {
  if (job) return readout();
  job = { inputs: { ...state.draft }, impressed: false };
  elapsed = 0; last = 0;
  root.querySelector('#print').disabled = true;
  root.querySelector('.press-stage').setAttribute('aria-busy', 'true');
  text('press-status', 'Pulling an impression…');
  if (reduced.matches || !visible || document.hidden) completeJob(); else resume();
  return readout();
}
function setInputs(input, shouldSave = true) {
  cancelJob(); state.draft = normalizeInputs(input, state.draft);
  refresh();
  text('press-status', isDirty(state) ? 'Composition changed · ready to print' : 'Press ready · type and proof match');
  text('experiment-note', 'Change one setting, print, then compare the reading rhythm. The body copy stays the same.');
  if (shouldSave) save();
  return readout();
}
function reset() {
  cancelJob(); state = normalizeState(initialState); refresh(); save();
  text('press-status', 'Press ready · type and proof match');
  text('experiment-note', 'Change one setting, print, then compare the reading rhythm. The body copy stays the same.');
  return readout();
}
function preset(index) {
  if (!Number.isInteger(index) || !PRESETS[index]) throw new Error('Choose preset 0, 1, or 2.');
  const result = setInputs(PRESETS[index].inputs);
  text('experiment-note', PRESETS[index].hint);
  return result;
}
root.querySelectorAll('input[type=range]').forEach(input => input.addEventListener('input', () => setInputs({ [input.id]: Number(input.value) })));
root.querySelector('#print').addEventListener('click', printProof);
root.querySelector('#reset').addEventListener('click', reset);
root.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => preset(Number(button.dataset.preset))));
bridge.expose({ set: setInputs, reset, print: printProof, preset, read: readout });
bridge.onState(input => { cancelJob(); state = normalizeState(input); refresh(); text('press-status', isDirty(state) ? 'Saved composition restored · ready to print' : 'Press ready · type and proof match'); });
const theme = value => { root.querySelector('.iso').dataset.theme = value.scheme === 'light' ? 'light' : 'dark'; };
theme(bridge.theme); bridge.onTheme(theme);
reduced.addEventListener('change', () => { stopAnimation(); resume(); });
new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (!visible) stopAnimation(); else resume(); }).observe(root);
document.addEventListener('visibilitychange', () => { if (document.hidden) stopAnimation(); else resume(); });
refresh();
