// Checkout as a state machine with an idempotent payment. One pure model:
// step(state, event) returns the next state; the card draws the state graph and
// renders the real screen for the current state under it.

export const meta = { title: 'Checkout state machine', width: 560, components: ['product-building/states'] };

// Graph layout in viewBox units; edges are the real transitions, including loops.
export const GRAPH = {
  width: 500, height: 128,
  nodes: [
    { id: 'cart', label: 'Cart', x: 36, y: 28 },
    { id: 'details', label: 'Details', x: 124, y: 28 },
    { id: 'review', label: 'Review', x: 216, y: 28 },
    { id: 'processing', label: 'Processing', x: 324, y: 28 },
    { id: 'confirmed', label: 'Confirmed', x: 450, y: 28, tone: 'good' },
    { id: 'declined', label: 'Declined', x: 252, y: 104, tone: 'bad' },
    { id: 'unknown', label: 'Unknown', x: 404, y: 104, tone: 'warn' },
  ],
  edges: [
    { from: 'cart', to: 'details' }, { from: 'details', to: 'review' }, { from: 'review', to: 'processing', label: 'pay' },
    { from: 'processing', to: 'confirmed', label: 'approve' }, { from: 'processing', to: 'declined', label: 'decline' },
    { from: 'processing', to: 'unknown', label: 'timeout', nudge: [8, -4] }, { from: 'declined', to: 'processing', label: 'retry', nudge: [-2, 10] },
    { from: 'unknown', to: 'confirmed', label: 'found' }, { from: 'unknown', to: 'declined', label: 'none' },
    { from: 'declined', to: 'details', label: 'edit' },
  ],
};

export const STATES = [
  { id: 'cart', label: 'Cart' },
  { id: 'details', label: 'Details' },
  { id: 'review', label: 'Review' },
  { id: 'processing', label: 'Processing' },
  { id: 'declined', label: 'Declined' },
  { id: 'unknown', label: 'Unknown' },
  { id: 'confirmed', label: 'Confirmed' },
];

// event -> { from: [states], to, label }
export const EVENTS = {
  checkout: { from: ['cart'], to: 'details', label: 'Check out' },
  submit: { from: ['details'], to: 'review', label: 'Continue' },
  pay: { from: ['review'], to: 'processing', label: 'Pay $48.00' },
  retry: { from: ['declined'], to: 'processing', label: 'Retry payment' },
  edit: { from: ['declined', 'review'], to: 'details', label: 'Change card' },
  reconcile: { from: ['unknown'], to: null, label: 'Check status' },
};
export const GATEWAY = { approve: 'Approve', decline: 'Decline', timeout: 'Time out' };

export const initial = { state: 'declined', gateway: 'approve', attempts: 1, charges: 0, key: 'ord_1042-a', log: [['0:00', 'Checkout started'], ['0:41', 'Paid · key ord_1042-a'], ['0:42', 'Gateway declined the card']] };

export function normalize(input) {
  const s = input && typeof input === 'object' ? input : {};
  return {
    state: STATES.some((x) => x.id === s.state) ? s.state : initial.state,
    gateway: Object.hasOwn(GATEWAY, s.gateway) ? s.gateway : initial.gateway,
    attempts: Math.max(0, Math.min(99, Math.floor(Number(s.attempts) || 0))),
    charges: Math.max(0, Math.min(1, Math.floor(Number(s.charges) || 0))),
    key: typeof s.key === 'string' ? s.key.slice(0, 24) : initial.key,
    log: Array.isArray(s.log) ? s.log.slice(-6).map((e) => [String(e[0]).slice(0, 6), String(e[1]).slice(0, 60)]) : [],
  };
}

export const available = (state) => Object.entries(EVENTS).filter(([, e]) => e.from.includes(state)).map(([id]) => id);

const clock = (n) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;

// Paying sends the gateway the order's idempotency key. A retry reuses it, so a
// duplicate approval can never charge twice; reconcile asks the gateway what happened.
export function step(input, event) {
  const s = normalize(input);
  const e = EVENTS[event];
  if (!e || !e.from.includes(s.state)) throw new Error(`${event} is not valid in ${s.state}`);
  const at = clock(42 + s.log.length * 9);
  const log = (text) => [...s.log, [at, text]].slice(-6);
  if (event === 'pay' || event === 'retry') {
    const attempts = s.attempts + 1;
    const sent = log(`${event === 'pay' ? 'Paid' : 'Retried'} · key ${s.key}`);
    if (s.gateway === 'approve') return { ...s, state: 'confirmed', attempts, charges: 1, log: [...sent, [at, 'Gateway approved · charged once']].slice(-6) };
    if (s.gateway === 'decline') return { ...s, state: 'declined', attempts, log: [...sent, [at, 'Gateway declined the card']].slice(-6) };
    return { ...s, state: 'unknown', attempts, log: [...sent, [at, 'No response after 10 s']].slice(-6) };
  }
  if (event === 'reconcile') {
    const charged = s.gateway === 'approve';
    return { ...s, state: charged ? 'confirmed' : 'declined', charges: charged ? 1 : s.charges, log: log(charged ? 'Gateway found the charge' : 'Gateway has no charge') };
  }
  return { ...s, state: e.to, log: log(e.label) };
}
