const root = document.querySelector('.lever-lab');
const drawing = root.querySelector('#lever-parts');
const trace = root.querySelector('#tilt-trace');
const bridge = window.playground;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let state = normalize(bridge.state);
let motion = { angle: 0, velocity: 0 };
let samples = [], elapsed = 0, last = 0, lastDraw = 0, frame = 0, visible = true;
let selected = -1;
const text = (id, value) => { const node = root.querySelector('#' + id); if (node.textContent !== value) node.textContent = value; };
const readout = () => ({ inputs: { ...state }, ...measure(state, motion.angle), tiltDegrees: motion.angle * 180 / Math.PI });

function paint() {
  const m = measure(state, motion.angle);
  drawing.innerHTML = drawLever(k, state, motion.angle);
  text('left-torque', m.left.toFixed(2) + ' N·m');
  text('right-torque', m.right.toFixed(2) + ' N·m');
  text('net-torque', (m.net > 0 ? '+' : '') + m.net.toFixed(2) + ' N·m');
  text('tilt', (motion.angle * 180 / Math.PI).toFixed(1) + '°');
  text('result', m.balanced ? 'Balanced: the turning effects cancel.' : m.net > 0 ? 'The left end drops: its turning effect is greater.' : 'The right end drops: its turning effect is greater.');
  const points = samples.map(([t, a]) => (624 - (elapsed - t) / 6 * 588).toFixed(1) + ',' + (43 - a / STOP * 26).toFixed(1));
  trace.setAttribute('points', points.join(' '));
  text('time-label', 'Last 6 seconds of simulated time');
  root.querySelector('#trace-description').textContent = 'Current tilt ' + (motion.angle * 180 / Math.PI).toFixed(1) + ' degrees. Positive means the left end is lower. The trace shows up to six seconds of simulated motion.';
}

function tick(now) {
  frame = 0;
  if (!visible || document.hidden || reduced.matches) { last = 0; return; }
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
  last = now;
  const before = motion.angle;
  motion = advance(state, motion, dt);
  elapsed += dt;
  if (now - lastDraw >= 50) {
    samples.push([elapsed, motion.angle]);
    samples = samples.filter(([t]) => t >= elapsed - 6).slice(-125);
    paint(); lastDraw = now;
  }
  const settled = Math.abs(motion.angle - before) < 1e-8 && Math.abs(motion.velocity) < 1e-6;
  if (!settled || elapsed < 6) frame = requestAnimationFrame(tick);
  else { paint(); last = 0; }
}

function start() {
  if (reduced.matches) {
    const m = measure(state);
    motion = { angle: m.balanced ? 0 : Math.sign(m.net) * STOP, velocity: 0 };
    samples = []; paint();
    text('time-label', 'Reduced motion · equilibrium shown without animation');
  } else if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick);
}

function apply(input, { save = true, reset = false, experiment = -1 } = {}) {
  state = normalize(input, reset ? DEFAULTS : state);
  selected = experiment;
  // Starting a new experiment releases the beam from level with no velocity.
  if (reset) { motion = { angle: 0, velocity: 0 }; samples = []; elapsed = 0; last = 0; }
  for (const key of Object.keys(LIMITS)) {
    root.querySelector('#' + key).value = state[key];
    text(key + '-value', key.endsWith('Mass') ? state[key].toFixed(1) + ' kg' : state[key] + ' cm');
  }
  root.querySelectorAll('[data-experiment]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.experiment) === selected)));
  text('experiment-note', selected < 0 ? 'Predict which end will fall. Change a mass or its distance, then compare the two torques.' : EXPERIMENTS[selected].hint);
  paint(); start();
  if (save) bridge.save({ ...state });
  return readout();
}

function experiment(index) {
  if (!Number.isInteger(index) || !EXPERIMENTS[index]) throw new Error('Choose experiment 0, 1, or 2.');
  return apply(EXPERIMENTS[index].state, { reset: true, experiment: index });
}

root.querySelectorAll('input[type=range]').forEach((input) => {
  input.addEventListener('input', () => apply({ [input.id]: Number(input.value) }));
});
root.querySelector('#reset').addEventListener('click', () => apply(DEFAULTS, { reset: true }));
root.querySelector('#release').addEventListener('click', () => apply(state, { reset: true }));
root.querySelectorAll('[data-experiment]').forEach((button) => button.addEventListener('click', () => experiment(Number(button.dataset.experiment))));
bridge.expose({ set: (input) => apply(input), reset: () => apply(DEFAULTS, { reset: true }), experiment, read: readout });
bridge.onState((input) => apply(normalize(input), { save: false, reset: true }));
const theme = (value) => { root.querySelector('.iso').dataset.theme = value.scheme === 'light' ? 'light' : 'dark'; };
theme(bridge.theme);
bridge.onTheme(theme);
reduced.addEventListener('change', () => { if (frame) cancelAnimationFrame(frame); frame = 0; last = 0; start(); });
new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;
  if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; last = 0; }
  if (visible) start();
}).observe(root);
document.addEventListener('visibilitychange', () => { last = 0; if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; } else start(); });
apply(state, { save: false, reset: true });
