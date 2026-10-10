const root = document.querySelector('.motion-lab');
const bridge = window.playground;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const P = rigProjection(k);
const $ = id => root.querySelector('#' + id);
const nodes = Object.fromEntries(['drawer-carriage', 'target-index', 'spring-back', 'spring-front', 'position-needle', 'position-value', 'velocity-value', 'target-value', 'damping-ratio', 'regime', 'ideal-overshoot', 'status', 'motion-status', 'motion-trace', 'target-trace', 'trace-label', 'trace-description', 'interface-drawer', 'motion-drag', 'motion-svg', 'stiffness', 'damping', 'stiffness-value', 'damping-value', 'preset-note', 'stiffness-needle', 'damping-needle'].map(id => [id, $(id)]));
let state = normalizeState(bridge.state);
let motion = atRest(state);
let samples = [], elapsed = 0, last = 0, sampledAt = -1, readAt = -1, frame = 0;
let visible = true, disposed = false, dragging = null;
const text = (id, value) => { if (nodes[id].textContent !== value) nodes[id].textContent = value; };
const read = () => ({ inputs: { ...state }, ...motion, ...measure(state, motion), reducedMotion: reduced.matches, dragging: Boolean(dragging) });
const say = message => text('status', message);

function stop() {
  if (frame) cancelAnimationFrame(frame);
  frame = 0; last = 0;
}

function paint(force = false) {
  const springs = springPaths(k, motion.position);
  nodes['drawer-carriage'].setAttribute('transform', k.translateAlong(P, [rigPosition(motion.position), 0, 0]));
  nodes['spring-back'].setAttribute('d', springs.back);
  nodes['spring-front'].setAttribute('d', springs.front);
  nodes['position-needle'].setAttribute('d', gaugeNeedle(k, motion.position));
  nodes['interface-drawer'].style.transform = 'translateX(' + ((1 - motion.position) * 100).toFixed(3) + '%)';
  const drawerHidden = motion.position < .04;
  nodes['interface-drawer'].inert = drawerHidden;
  nodes['interface-drawer'].setAttribute('aria-hidden', String(drawerHidden));
  if (force || elapsed - readAt >= .1) {
    readAt = elapsed;
    const percent = Math.round(motion.position * 100);
    text('position-value', percent + '%');
    text('velocity-value', (motion.velocity > 0 ? '+' : '') + motion.velocity.toFixed(2) + '/s');
    nodes['motion-drag'].setAttribute('aria-valuenow', String(Math.round(state.target * 100)));
    nodes['motion-drag'].setAttribute('aria-valuetext', 'Target ' + Math.round(state.target * 100) + ' percent. Drawer ' + percent + ' percent open.');
    const phase = dragging ? 'Held by you' : measure(state, motion).settled ? 'At rest' : motion.position < 0 || motion.position > 1 ? 'Overshooting' : 'In motion';
    text('motion-status', reduced.matches ? 'Reduced motion · resting positions' : phase);
  }
  if (!reduced.matches && (force || elapsed - sampledAt >= 1 / 30)) {
    sampledAt = elapsed;
    const lastSample = samples.at(-1);
    if (lastSample?.[0] === elapsed) samples[samples.length - 1] = [elapsed, motion.position, state.target];
    else samples.push([elapsed, motion.position, state.target]);
    samples = samples.filter(([time]) => time >= elapsed - 3).slice(-100);
    const points = value => samples.map(sample => (586 - (elapsed - sample[0]) / 3 * 540).toFixed(1) + ',' + (70 - (sample[value] + .4) / 1.8 * 59).toFixed(1)).join(' ');
    nodes['motion-trace'].setAttribute('points', points(1));
    nodes['target-trace'].setAttribute('points', points(2));
  }
}

function tick(now) {
  frame = 0;
  if (disposed || !visible || document.hidden || reduced.matches || dragging) { last = 0; return; }
  const dt = last ? Math.min(.05, Math.max(0, (now - last) / 1000)) : 1 / 60;
  last = now;
  motion = advance(state, motion, dt);
  elapsed += dt;
  paint();
  if (!measure(state, motion).settled) frame = requestAnimationFrame(tick);
  else {
    paint(true); last = 0;
    say('Drawer settled at ' + Math.round(state.target * 100) + ' percent open.');
  }
}

function start() {
  if (disposed) return;
  if (reduced.matches) {
    stop(); motion = atRest(state); samples = [];
    nodes['motion-trace'].setAttribute('points', '');
    nodes['target-trace'].setAttribute('points', '');
    text('trace-label', 'Reduced motion · animation and trace are paused');
    paint(true);
  } else {
    text('trace-label', 'Last 3 seconds of simulated motion');
    if (!frame && visible && !document.hidden && !dragging && !measure(state, motion).settled) frame = requestAnimationFrame(tick);
  }
}

function endDrag(resume = true) {
  if (!dragging) return;
  const pointer = dragging.id;
  dragging = null;
  nodes['motion-drag'].classList.remove('is-dragging');
  if (nodes['motion-drag'].hasPointerCapture(pointer)) nodes['motion-drag'].releasePointerCapture(pointer);
  if (resume) { paint(true); start(); }
}

function updateControls() {
  for (const [key, [min, max]] of Object.entries(LIMITS)) {
    nodes[key].value = state[key];
    text(key + '-value', String(state[key]));
    const angle = (-135 + (state[key] - min) / (max - min) * 270) * Math.PI / 180;
    const cx = key === 'stiffness' ? -166 : -121;
    nodes[key + '-needle'].setAttribute('d', k.segment([cx, -54, 26.8], [cx + Math.sin(angle) * 5.5, -54 - Math.cos(angle) * 5.5, 26.8], P));
  }
  const m = measure(state, motion);
  text('damping-ratio', m.dampingRatio.toFixed(2));
  text('regime', m.regime);
  text('ideal-overshoot', (m.idealOvershoot * 100).toFixed(1) + '%');
  text('target-value', Math.round(state.target * 100) + '%');
  nodes['target-index'].setAttribute('transform', k.translateAlong(P, [rigPosition(state.target), 0, 0]));
  root.querySelectorAll('[data-goal]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.goal) === state.target)));
  let matched = null;
  root.querySelectorAll('[data-preset]').forEach(button => {
    const name = button.dataset.preset;
    const active = PRESETS[name].stiffness === state.stiffness && PRESETS[name].damping === state.damping;
    button.setAttribute('aria-pressed', String(active));
    if (active) matched = name;
  });
  text('preset-note', matched ? PRESETS[matched].hint : 'Stiffness pulls toward the target. Damping removes speed. Change either while the drawer is moving.');
}

function apply(input, { save = true, restore = false, fromClosed = false } = {}) {
  endDrag(false);
  state = normalizeState(input, restore ? initialState : state);
  if (restore || fromClosed) {
    stop(); motion = fromClosed ? { position: 0, velocity: 0 } : atRest(state);
    samples = []; elapsed = 0; sampledAt = -1; readAt = -1;
  }
  updateControls(); paint(true); start();
  if (save) bridge.save({ ...state });
  return read();
}

function goal(target) {
  const result = apply({ target });
  say((target === 1 ? 'Opening' : target === 0 ? 'Closing' : 'Moving') + ' drawer. Current velocity is preserved.');
  return result;
}

function preset(name) {
  if (typeof name !== 'string' || !Object.hasOwn(PRESETS, name)) throw new Error('Choose gentle, crisp, or bouncy.');
  const result = apply({ ...PRESETS[name], target: 1 }, { fromClosed: true });
  say(PRESETS[name].label + ' preset. Replaying an opening from rest.');
  return result;
}

function reset() {
  const result = apply(initialState, { restore: true });
  say('Reset to the original spring and an open drawer.');
  return result;
}

for (const key of Object.keys(LIMITS)) nodes[key].addEventListener('input', () => apply({ [key]: Number(nodes[key].value) }));
root.querySelectorAll('[data-goal]').forEach(button => button.addEventListener('click', () => goal(Number(button.dataset.goal))));
root.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => preset(button.dataset.preset)));
$('reset').addEventListener('click', reset);
$('preview-open').addEventListener('click', () => goal(1));
$('preview-close').addEventListener('click', () => { $('preview-open').focus({ preventScroll: true }); goal(0); });

function svgPoint(event) {
  const matrix = nodes['motion-svg'].getScreenCTM();
  return matrix ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()) : null;
}
const origin = k.iso([0, 0, 0], P), end = k.iso([120, 0, 0], P);
const axis = [end[0] - origin[0], end[1] - origin[1]];
const axisLength = axis[0] ** 2 + axis[1] ** 2;
nodes['motion-drag'].addEventListener('pointerdown', event => {
  if (disposed || !event.isPrimary || event.button !== 0 || !event.target.closest('#drawer-carriage')) return;
  const point = svgPoint(event);
  if (!point) return;
  stop(); motion.velocity = 0;
  dragging = { id: event.pointerId, point, position: motion.position, lastPosition: motion.position, at: performance.now() };
  nodes['motion-drag'].setPointerCapture(event.pointerId);
  nodes['motion-drag'].classList.add('is-dragging');
  nodes['motion-drag'].focus({ preventScroll: true });
  say('Drawer held. Release to return to the target.');
  paint(true);
});
nodes['motion-drag'].addEventListener('pointermove', event => {
  if (!dragging || event.pointerId !== dragging.id) return;
  const point = svgPoint(event);
  if (!point) return;
  const change = ((point.x - dragging.point.x) * axis[0] + (point.y - dragging.point.y) * axis[1]) / axisLength;
  const position = Math.min(1, Math.max(0, dragging.position + change));
  const now = performance.now(), dt = Math.max(.001, (now - dragging.at) / 1000);
  const velocity = reduced.matches ? 0 : Math.min(12, Math.max(-12, (position - dragging.lastPosition) / dt));
  motion = { position, velocity };
  elapsed += Math.min(.05, dt);
  dragging.lastPosition = position; dragging.at = now;
  paint(true);
});
nodes['motion-drag'].addEventListener('pointerup', event => {
  if (!dragging || event.pointerId !== dragging.id) return;
  if (performance.now() - dragging.at > 90) motion.velocity = 0;
  endDrag();
  say('Released toward ' + Math.round(state.target * 100) + ' percent open.');
});
const cancelDrag = () => { if (dragging) { motion.velocity = 0; endDrag(); } };
nodes['motion-drag'].addEventListener('pointercancel', cancelDrag);
nodes['motion-drag'].addEventListener('lostpointercapture', cancelDrag);
nodes['motion-drag'].addEventListener('keydown', event => {
  let target = state.target;
  if (event.key === 'ArrowRight' || event.key === 'ArrowUp') target = Math.min(1, target + .1);
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') target = Math.max(0, target - .1);
  else if (event.key === 'Home') target = 0;
  else if (event.key === 'End') target = 1;
  else if (event.key === ' ' || event.key === 'Enter') target = state.target >= .5 ? 0 : 1;
  else return;
  event.preventDefault(); goal(target);
});

bridge.expose({ set: input => apply(input), reset, preset, open: () => goal(1), close: () => goal(0), read });
const offState = bridge.onState(input => apply(input, { save: false, restore: true }));
const theme = value => { root.querySelector('.iso').dataset.theme = value.scheme === 'light' ? 'light' : 'dark'; };
theme(bridge.theme);
const offTheme = bridge.onTheme(theme);
const motionPreference = () => { cancelDrag(); stop(); start(); };
reduced.addEventListener('change', motionPreference);
const observer = new IntersectionObserver(entries => {
  visible = entries[entries.length - 1].isIntersecting;
  if (!visible) { endDrag(false); stop(); }
  else start();
});
observer.observe(root);
const visibility = () => { if (document.hidden) { endDrag(false); stop(); } else start(); };
document.addEventListener('visibilitychange', visibility);
window.addEventListener('pagehide', () => {
  disposed = true; endDrag(false); stop(); observer.disconnect();
  document.removeEventListener('visibilitychange', visibility);
  reduced.removeEventListener('change', motionPreference);
  if (typeof offState === 'function') offState();
  if (typeof offTheme === 'function') offTheme();
}, { once: true });
apply(state, { save: false, restore: true });
