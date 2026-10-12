const $ = (id) => document.getElementById(id);
let state = normalize(window.playground.state ?? initial);
const visited = new Set(['cart', 'details', 'review', 'processing']);
const graph = states(document.getElementById('graph'), GRAPH);
let last = ['processing', state.state];

const SCREENS = {
  cart: () => `<h3>Your bag</h3><div class="line"><span>Everyday bag × 1</span><span>$48.00</span></div><div class="line"><span>Shipping</span><span>Free</span></div>`,
  details: () => `<h3>Payment details</h3><p>Visa ending 4242 · Ships to 18 Elm St</p>`,
  review: () => `<h3>Review order</h3><div class="line"><span>Total</span><span>$48.00</span></div>`,
  processing: () => `<h3>Paying…</h3><p>Contacting the gateway.</p>`,
  declined: () => `<div class="notice"><span class="pg-badge" data-tone="bad">Card declined</span></div><h3 style="margin-top:10px">No charge was made</h3><p>Your bag and details are kept. Retry, or use another card.</p>`,
  unknown: () => `<div class="notice"><span class="pg-badge" data-tone="warn">No response</span></div><h3 style="margin-top:10px">We didn't hear back</h3><p>Don't pay again yet. Check the payment status first.</p>`,
  confirmed: () => `<div class="notice"><span class="pg-badge" data-tone="good">Paid</span></div><h3 style="margin-top:10px">Order 1042 confirmed</h3><p>$48.00 charged once. A receipt is on its way.</p>`,
};

function paint() {
  visited.add(state.state);
  graph.set({ current: state.state, visited: [...visited], last });
  const actions = available(state.state);
  $('screen').innerHTML = SCREENS[state.state]()
    + `<div class="actions">${actions.map((e, i) => `<button type="button" class="${i === 0 ? 'pg-btn-primary' : 'pg-btn'}" data-event="${e}">${EVENTS[e].label}</button>`).join('')}`
    + (state.state === 'confirmed' ? `<button type="button" class="pg-btn" data-reset>Start a new order</button>` : '') + `</div>`;
  $('answer').dataset.tone = state.charges ? 'good' : '';
  $('charged').textContent = state.charges ? 'Once' : 'Not yet';
  const tone = { confirmed: 'good', declined: 'bad', unknown: 'warn' }[state.state];
  $('live').textContent = STATES.find((x) => x.id === state.state).label;
  if (tone) $('live').dataset.tone = tone; else delete $('live').dataset.tone;
  $('key').textContent = state.key;
  $('attempts').textContent = String(state.attempts);
  $('clock').textContent = state.log.length ? state.log.at(-1)[0] : '';
  $('gateway').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.gateway === state.gateway)));
}

function send(event) {
  const from = state.state;
  state = step(state, event);
  last = EVENTS[event].to === 'processing' || event === 'pay' || event === 'retry' ? ['processing', state.state] : [from, state.state];
  paint();
  window.playground.save(state);
  window.playground.emit('event', { event, state: state.state });
  return read();
}
function gateway(outcome) {
  state = normalize({ ...state, gateway: outcome });
  paint(); window.playground.save(state);
  return read();
}
function reset() {
  state = normalize({ ...initial, state: 'cart', attempts: 0, charges: 0, key: 'ord_1043-a', log: [['0:00', 'Checkout started']] });
  visited.clear(); visited.add('cart'); last = null;
  paint(); window.playground.save(state);
  return read();
}
const read = () => ({ state: state.state, valid: available(state.state), gateway: state.gateway, attempts: state.attempts, charges: state.charges });

$('gateway').innerHTML = Object.entries(GATEWAY).map(([key, label]) => `<button type="button" data-gateway="${key}">${label}</button>`).join('');
$('gateway').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) gateway(b.dataset.gateway); });
$('screen').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.reset !== undefined) reset(); else send(b.dataset.event);
});
window.playground.onState((next) => { state = normalize(next); paint(); });
window.playground.expose({ send, gateway, reset, read });
paint();
