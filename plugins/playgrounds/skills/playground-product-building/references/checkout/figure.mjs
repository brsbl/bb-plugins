// Checkout as a state machine with an idempotent payment. One pure model:
// step(state, event) returns the next state; the card renders the real screen
// for the current state and the rail of states beside it.

export const meta = { title: 'Checkout state machine', width: 560 };

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
