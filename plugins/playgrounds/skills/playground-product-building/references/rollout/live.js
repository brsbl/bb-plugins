const $ = (id) => document.getElementById(id);
const HOURS_PER_SECOND = 3;
let state = normalize(window.playground.state);
let run = simulate(state);
let t = 0;

function openAt() {
  if (ui.reduced.matches) return run.hours;
  return run.rolledBackAt !== null ? Math.max(0, run.rolledBackAt - 3) : Math.max(0, run.hours - 8);
}

function paint() {
  const now = Math.min(run.hours, t);
  const hourTicks = ui.ticks(0, run.hours, 4).map((v) => Math.round(v));
  const events = run.rolledBackAt !== null ? [{ x: run.rolledBackAt, label: 'rolled back', tone: 'bad' }] : [];
  ui.chart($('exposure'), {
    width: 500, height: 86, pad: { l: 36, t: 8, b: 4 },
    x: { min: 0, max: run.hours, ticks: [] },
    y: { min: 0, max: 100, ticks: [0, 50, 100], format: (v) => `${v}%` },
    series: [{ points: run.points.map((p) => [p.h, p.exposure]), kind: 'step', fill: true }],
    events, now,
  });
  const measured = run.points.filter((p) => p.measured !== null).map((p) => [p.h, p.measured]);
  const top = Math.max(2.5, ...measured.map((p) => p[1])) ;
  ui.chart($('errors'), {
    width: 500, height: 96, pad: { l: 36, t: 12 },
    x: { min: 0, max: run.hours, ticks: hourTicks, format: (v) => `${v} h` },
    y: { min: 0, max: Math.ceil(top), ticks: [0, Math.ceil(top)], format: (v) => `${v}%` },
    series: [{ points: measured.filter((p) => p[0] <= now) }],
    marks: [{ y: run.threshold, label: `roll back ≥ ${ui.fmt(run.threshold, { digits: 1 })}%` }],
    events: events.map((e) => ({ ...e, label: '' })), now,
  });
  const p = run.points[Math.min(run.points.length - 1, Math.floor(now))];
  $('where').textContent = run.rolledBackAt !== null && now >= run.rolledBackAt ? 'Rolled back · 0% of users' : `Stage ${p.stage + 1} · ${p.exposure}% of users`;
  $('clock').textContent = `${Math.floor(now)} h`;
  $('scrub').max = String(run.hours);
  $('scrub').value = String(now);
  const v = verdict(run);
  $('verdict').dataset.tone = v.tone;
  $('verdict').textContent = now >= run.hours ? v.label : 'Watching';
  if (now < run.hours) delete $('verdict').dataset.tone;
}

function paintTotals() {
  const until = run.rolledBackAt ?? run.hours;
  const peak = Math.max(...run.points.filter((p) => p.h < until || run.rolledBackAt === null).map((p) => p.exposure));
  $('peak').innerHTML = `${ui.fmt(USERS * peak / 100, { compact: true })}<small>${peak}% of users</small>`;
  $('hurt').textContent = run.release === 'regression' ? ui.fmt(run.exposedUserHours, { compact: true }) : 'None';
  $('fired').innerHTML = run.rolledBackAt === null ? `Never<small>${run.release === 'healthy' ? 'no false alarms' : 'the bug shipped'}</small>` : `${run.rolledBackAt} h<small>${run.release === 'healthy' ? 'false alarm' : 'rolled back'}</small>`;
}

function paintInputs() {
  paintTotals();
  $('bake').value = String(state.bake);
  $('threshold').value = String(state.threshold);
  $('bake-out').textContent = `${state.bake} h`;
  $('threshold-out').textContent = `${ui.fmt(state.threshold, { digits: 1 })}% errors`;
  for (const [id, key] of [['plan', 'plan'], ['release', 'release']]) $(id).querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === state[key])));
}

const clock = ui.loop((dt) => {
  t = Math.min(run.hours, t + dt * HOURS_PER_SECOND);
  paint();
  if (t >= run.hours) return false;
}, { onChange: (playing) => { $('play').innerHTML = playing ? ui.icons.pause : ui.icons.play; $('play').setAttribute('aria-label', playing ? 'Pause' : 'Play'); } });

function apply(next, save) {
  state = normalize({ ...state, ...next });
  run = simulate(state);
  t = openAt();
  paintInputs(); paint();
  if (!ui.reduced.matches) clock.play();
  if (save) window.playground.save(state);
  return read();
}
function seek(hour) { clock.pause(); t = Math.min(run.hours, Math.max(0, Number(hour) || 0)); paint(); return read(); }
const read = () => {
  const v = verdict(run);
  return { inputs: state, verdict: v.label, detail: v.detail, rolledBackAt: run.rolledBackAt, fullAt: run.fullAt, hour: Math.floor(t) };
};

const seg = (id, entries) => {
  $(id).innerHTML = entries.map(([value, label]) => `<button type="button" data-value="${value}">${label}</button>`).join('');
  $(id).addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) apply({ [id]: b.dataset.value }, true); });
};
seg('plan', Object.entries(PLANS).map(([k, p]) => [k, p.label]));
seg('release', Object.entries(RELEASES));
for (const key of ['bake', 'threshold']) {
  $(key).addEventListener('change', () => apply({ [key]: Number($(key).value) }, true));
  $(key).addEventListener('input', () => { $(`${key}-out`).textContent = key === 'bake' ? `${$(key).value} h` : `${ui.fmt(Number($(key).value), { digits: 1 })}% errors`; });
}
$('play').addEventListener('click', () => { if (t >= run.hours) t = 0; clock.toggle(); });
$('restart').innerHTML = ui.icons.reset;
$('restart').addEventListener('click', () => { t = 0; paint(); clock.play(); });
$('scrub').addEventListener('input', () => seek($('scrub').value));
window.playground.onState((next) => apply(next, false));
window.playground.expose({ set: (inputs) => apply(inputs, true), seek, play: () => { clock.play(); return read(); }, read });
$('play').innerHTML = ui.icons.play;
apply(state, false);
