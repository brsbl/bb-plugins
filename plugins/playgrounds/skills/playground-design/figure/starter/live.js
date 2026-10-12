// Runs inside the playground. The builder provides k (the Anatomy kit), P (the
// projection), figure (svg, readout, hint), reduced (reduced-motion query) and
// every export of figure.mjs.
const input = document.getElementById('position');
const output = document.getElementById('position-out');
const carriage = figure.svg.querySelector('#carriage');
const gauge = figure.svg.querySelector('#needle');
let state = normalize(window.playground.state);
let shown = window.playground.state ? state.position : 0;
let frame = 0;

function paint(position) {
  carriage.setAttribute('transform', k.translateAlong(P, [travel(position), 0, 0]));
  gauge.setAttribute('d', needle(k, P, position));
  figure.readout.textContent = Math.round(position * 100) + ' mm';
}

function settle() {
  frame = 0;
  shown += (state.position - shown) * 0.16;
  if (reduced.matches || Math.abs(state.position - shown) < 0.001) shown = state.position;
  paint(shown);
  if (shown !== state.position) frame = requestAnimationFrame(settle);
}

function apply(next, save) {
  state = normalize(next);
  input.value = String(Math.round(state.position * 100));
  output.textContent = input.value + ' mm';
  if (!frame) frame = requestAnimationFrame(settle);
  if (save) window.playground.save(state);
  return { position: state.position };
}

input.addEventListener('input', () => apply({ position: Number(input.value) / 100 }, false));
input.addEventListener('change', () => apply({ position: Number(input.value) / 100 }, true));
window.playground.onState((next) => apply(next, false));
window.playground.expose({
  set: (position) => apply({ position }, true),
  reset: () => apply(initial, true),
  read: () => ({ position: state.position }),
});
paint(shown);
apply(state, false);
