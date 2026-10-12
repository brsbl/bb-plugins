const $ = (id) => document.getElementById(id);
const SAMPLE = 4;
let state = normalize(window.playground.state);
let run = simulate(state);
let advice = advise(state);
// Open just before the first burst so the card is already telling the story.
let t = ui.reduced.matches ? TRAFFIC[state.traffic].first + 0.6 : TRAFFIC[state.traffic].first - 2.5;
let done = Math.floor(t / DT);
let tally = { sent: 0, passed: 0, lost: 0 };

const graph = flow($('flow'), {
  width: 500, height: 132,
  nodes: [
    { id: 'clients', x: 64, y: 66, title: 'Clients' },
    { id: 'bucket', x: 250, y: 66, w: 132, h: 76, title: 'Token bucket', meter: true },
    { id: 'api', x: 436, y: 66, title: 'API', slots: 6 },
  ],
  edges: [{ from: 'clients', to: 'bucket' }, { from: 'bucket', to: 'api' }],
});
const clients = graph.node('clients'), bucket = graph.node('bucket'), api = graph.node('api');

function drawChart() {
  const points = run.steps.filter((_, i) => i % 5 === 0).map((s) => [s.t, s.tokens]);
  const bands = [];
  run.perSecond.forEach((s) => {
    if (!s.rejected) return;
    const last = bands.at(-1);
    if (last && last.x1 === s.t) last.x1 = s.t + 1; else bands.push({ x0: s.t, x1: s.t + 1 });
  });
  ui.chart($('chart'), {
    width: 500, height: 96, pad: { l: 30, t: 12 },
    x: { min: 0, max: SECONDS, ticks: [0, 10, 20, 30], format: (v) => `${v} s` },
    y: { min: 0, max: run.capacity, ticks: [0, run.capacity], format: (v) => ui.fmt(v) },
    series: [{ points, fill: true }],
    bands, now: t,
  });
}

function showStep(index) {
  const step = run.steps[Math.min(run.steps.length - 1, index)];
  bucket.meter(step.tokens / run.capacity);
  bucket.sub(`${ui.fmt(step.tokens)} / ${ui.fmt(run.capacity)} tokens`);
  clients.sub(`${ui.fmt(arrivalsAt(run.traffic, step.t))} req/s`);
  const recent = run.steps.slice(Math.max(0, index - 10), index + 1);
  const rate = recent.reduce((sum, s) => sum + s.accepted, 0) / (recent.length * DT);
  api.slots(Math.round(Math.min(1, rate / API_RATE) * 6));
  api.sub(`${ui.fmt(rate)} req/s`);
  const lost = recent.some((s) => s.rejected);
  bucket.state(lost ? 'bad' : undefined);
  bucket.value(lost ? '429' : '', lost ? 'bad' : undefined);
  const status = $('status');
  status.dataset.tone = lost ? 'bad' : 'good';
  status.textContent = lost ? 'Rejecting' : 'Admitting';
}

function advance(dt) {
  t += dt;
  if (t >= SECONDS) { t = 0; done = 0; graph.clear(); }
  const target = Math.floor(t / DT);
  for (; done < target; done++) {
    const s = run.steps[done];
    tally.sent += s.arrivals; tally.passed += s.accepted; tally.lost += s.rejected;
    for (; tally.sent >= SAMPLE; tally.sent -= SAMPLE) graph.send('clients', 'bucket', { duration: 0.55 });
    for (; tally.passed >= SAMPLE; tally.passed -= SAMPLE) graph.send('bucket', 'api', { duration: 0.55 });
    for (; tally.lost >= SAMPLE; tally.lost -= SAMPLE) graph.drop('bucket');
  }
  graph.tick(dt);
  showStep(done);
  paintTime();
}

function paintTime() {
  const label = `${ui.fmt(t, { digits: 1 })} s`;
  $('clock').textContent = label;
  $('scrub').value = String(t);
  drawChart();
}

function paintInputs() {
  $('capacity').value = String(state.capacity);
  $('refill').value = String(state.refill);
  $('capacity-out').textContent = `${state.capacity} tokens`;
  $('refill-out').textContent = `${state.refill} tokens/s`;
  $('traffic').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.traffic === state.traffic)));
  const total = run.accepted + run.rejected;
  $('accepted').textContent = ui.fmt(run.accepted);
  $('rejected').innerHTML = `${ui.fmt(run.rejected)}<small>${ui.fmt(total ? run.rejected / total : 0, { percent: true, digits: 1 })} of traffic</small>`;
  $('answer').dataset.tone = advice.capacity && state.capacity >= advice.capacity ? 'good' : advice.capacity ? 'warn' : 'bad';
  $('advice').innerHTML = advice.capacity
    ? `${advice.capacity} tokens<small>at ${state.refill} tokens/s</small>`
    : `Raise refill<small>demand averages ${ui.fmt(advice.average)}/s</small>`;
}

const clock = ui.loop((dt) => advance(dt), {
  onChange: (playing) => {
    $('play').innerHTML = playing ? ui.icons.pause : ui.icons.play;
    $('play').setAttribute('aria-label', playing ? 'Pause' : 'Play');
  },
});

function apply(next, save) {
  state = normalize({ ...state, ...next });
  run = simulate(state);
  advice = advise(state);
  graph.clear();
  done = Math.floor(t / DT);
  paintInputs(); showStep(done); paintTime();
  if (save) window.playground.save(state);
  return read();
}

function seek(seconds) {
  t = Math.min(SECONDS - DT, Math.max(0, Number(seconds) || 0));
  done = Math.floor(t / DT);
  graph.clear(); showStep(done); paintTime();
  return read();
}

const read = () => ({ inputs: state, accepted: run.accepted, rejected: run.rejected, firstRejectionAt: run.firstReject, lossFreeCapacity: advice.capacity, time: Number(t.toFixed(1)) });

$('traffic').innerHTML = Object.entries(TRAFFIC).map(([key, p]) => `<button type="button" data-traffic="${key}">${p.label}</button>`).join('');
$('traffic').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) apply({ traffic: b.dataset.traffic }, true); });
for (const key of ['capacity', 'refill']) {
  $(key).addEventListener('input', () => apply({ [key]: Number($(key).value) }, false));
  $(key).addEventListener('change', () => apply({ [key]: Number($(key).value) }, true));
}
$('play').addEventListener('click', () => clock.toggle());
$('restart').innerHTML = ui.icons.reset;
$('restart').addEventListener('click', () => { seek(0); clock.play(); });
$('scrub').addEventListener('input', () => { clock.pause(); seek($('scrub').value); });
window.playground.onState((next) => apply(next, false));
window.playground.expose({
  set: (inputs) => apply(inputs, true),
  play: () => { clock.play(); return read(); },
  pause: () => { clock.pause(); return read(); },
  seek,
  read,
});

apply(state, false);
$('play').innerHTML = ui.icons.play;
if (!ui.reduced.matches) clock.play();
