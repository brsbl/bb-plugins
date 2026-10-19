import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { visualDelta } from './pixels.mjs';
import { observeInteractions, unexercisedControls } from './observations.mjs';

// This is run in the card's real rendered frame (not a reconstructed mock).
export function inventory(scope = 'body') {
  const root = document.querySelector(scope);
  if (!root) return [];
  const candidates = [...root.querySelectorAll('button,input:not([type="hidden"]),select,textarea,[role="button"],[role="switch"],[role="slider"],[role="checkbox"],[role="radio"],[role="tab"],[tabindex],canvas,[onclick],[data-drag]')];
  for (const el of root.querySelectorAll('*')) {
    const cursor = getComputedStyle(el).cursor;
    if (/^(pointer|grab|grabbing|move|.*resize)$/.test(cursor) && getComputedStyle(el.parentElement || el).cursor !== cursor) candidates.push(el);
  }
  const identities = window.__launchControlIdentities ||= { elements: new WeakMap(), next: 0 };
  return [...new Set(candidates)].filter(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' &&
      !candidates.some(child => child !== el && el.contains(child));
  }).map(el => {
    if (!identities.elements.has(el)) identities.elements.set(el, identities.next++);
    const i = identities.elements.get(el);
    el.dataset.launchControl = String(i);
    return { cursor: getComputedStyle(el).cursor, disabled: Boolean(el.disabled || el.getAttribute('aria-disabled') === 'true'), index: i, tag: el.tagName.toLowerCase(), type: el.type || el.getAttribute('role') || '',
      label: el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 100) || el.id || `control ${i}`,
      selected: el.checked || el.getAttribute('aria-pressed') === 'true' || el.getAttribute('aria-selected') === 'true',
      group: el.name || el.closest('[role="tablist"],.pg-seg,.pg-segmented')?.outerHTML.slice(0, 120) || null };
  });
}
const selector = c => `[data-launch-control="${c.index}"]`;
function action(c) {
  const s = selector(c);
  if (c.disabled) return null;
  if (c.tag === 'canvas' || (c.tag === 'input' && ['file','color','date','time','datetime-local','month','week'].includes(c.type))) return null;
  if (c.type === 'range' || c.type === 'slider' || c.type === 'dial' || /grab|move|resize/.test(c.cursor || '')) return [['drag', s, 0.2, 0.5, 0.85, 0.5, 20]];
  if (c.tag === 'select') return [['click', s], ['key', 'ArrowDown', s], ['key', 'Enter', s]];
  if (c.tag === 'textarea' || (c.tag === 'input' && ['text','search','email','url','password','tel','number'].includes(c.type))) {
    if (c.type === 'number') return [['click', s], ['key', 'ArrowUp', s]];
    return [['click', s], ['key', 'x', s]];
  }
  if (c.tag === 'button' || ['button','submit','reset','checkbox','radio','switch','tab'].includes(c.type) || c.tag === 'a' || c.cursor === 'pointer') return [['click', s]];
  return null;
}

export async function checkControls({ target, scope = 'body', width, dir, drive }) {
  const listExpression = `(${inventory.toString()})(${JSON.stringify(scope)})`;
  const discovered = await drive(target, [['eval', listExpression]], join(dir, 'inventory'), width);
  const controls = discovered.evals.find(Array.isArray);
  if (!controls?.length) return { pass: false, controls: [], reason: 'No exposed controls discovered' };
  const actions = [['eval', listExpression]];
  const plans = [];
  for (const control of controls) {
    const steps = action(control);
    if (!steps) { plans.push({ ...control, pass: false, reason: control.disabled ? 'Disabled control: precondition not exercised; needs review' : 'Unsupported exposed control; manual proof required' }); continue; }
    const s = selector(control);
    // Leaving a drag surface can reset its output. Keep its low/high pointer
    // positions through the screenshots; the existing masks exclude cosmetics.
    const moveOff = steps.some(step => step[0] === 'drag') ? [] : [['move', scope, 0.01, 0.01]];
    actions.push(['scroll', s]);
    // A selected tab/radio and a reset need a changed starting state to be tested.
    const peer = controls.find(c => c.index !== control.index && action(c) && (control.group ? c.group === control.group : action(c) && !/reset/i.test(c.label)));
    if (peer && (control.selected || /reset|restart|clear/i.test(control.label))) actions.push(...action(peer));
    if (control.type === 'range' || control.type === 'slider') actions.push(['drag', s, 0.8, 0.5, 0.2, 0.5]);
    actions.push(...moveOff, ['wait', 400]);
    const paths = ['before0','before1','before2','after0','after1'].map(name => join(dir, `control-${control.index}-${name}.png`));
    actions.push(['eval', `(()=>{const root=document.querySelector(${JSON.stringify(scope)}),r=root.getBoundingClientRect();return {maskFor:${control.index},rects:[...root.querySelectorAll('[data-launch-control]')].map(e=>{const b=(e.closest('label,.pg-control,[data-pg]')||e).getBoundingClientRect();return {x:b.x-r.x+4,y:b.y-r.y+4,w:b.width,h:b.height}})}})()`]);
    for (let n = 0; n < 3; n++) actions.push(['shot', paths[n], scope], ['wait', 450]);
    actions.push(...steps, ...moveOff, ['wait', 450], ['shot', paths[3], scope], ['wait', 450], ['shot', paths[4], scope]);
    plans.push({ ...control, paths, steps });
  }
  actions.push(['eval', listExpression]);
  const exercised = await drive(target, observeInteractions(actions, listExpression), join(dir, 'controls'), width);
  const results = plans.map(plan => {
    if (!plan.paths) return plan;
    const masks = exercised.evals.find(v => v?.maskFor === plan.index)?.rects;
    if (!masks) return { ...plan, pass: false, reason: 'Control masks unavailable' };
    try { return { ...plan, ...visualDelta(plan.paths, masks) }; }
    catch (error) { return { ...plan, pass: false, reason: String(error) }; }
  });
  const initial = exercised.evals.find(Array.isArray) || controls;
  const snapshots = [
    { inventoryAfter: {phase:'start'}, controls: initial },
    ...exercised.evals.filter(value => value?.inventoryAfter),
    { inventoryAfter: {phase:'end'}, controls: exercised.evals.filter(Array.isArray).at(-1) || [] },
  ];
  for (const control of unexercisedControls(controls, snapshots))
    results.push({ ...control, pass: false, reason: 'Interaction exposed another control that was not exercised (retained even if later hidden)' });
  const pass = exercised.code === 0 && !exercised.log.includes('exception:') && results.every(c => c.pass);
  const report = { pass, controls: results, inventories: snapshots, reason: pass ? 'Every exposed control produced an output change' : 'At least one control is dead, unsupported, or unproven' };
  writeFileSync(join(dir, 'controls.json'), JSON.stringify(report, null, 2));
  return report;
}
