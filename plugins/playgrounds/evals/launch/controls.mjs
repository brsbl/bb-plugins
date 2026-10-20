import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { visualDelta } from './pixels.mjs';
import { observeInteractions, unexercisedControls } from './observations.mjs';

// This is run in the card's real rendered frame (not a reconstructed mock).
export function inventory(scope = 'body') {
  const root = document.querySelector(scope);
  if (!root) return [];
  const candidates = [...root.querySelectorAll('button,summary,input:not([type="hidden"]),select,textarea,[role="button"],[role="switch"],[role="slider"],[role="checkbox"],[role="radio"],[role="tab"],[tabindex],canvas,[onclick],[data-drag]')];
  for (const el of root.querySelectorAll('*')) {
    const cursor = getComputedStyle(el).cursor;
    if (/^(pointer|grab|grabbing|move|.*resize)$/.test(cursor) && getComputedStyle(el.parentElement || el).cursor !== cursor) candidates.push(el);
  }
  const identities = window.__launchControlIdentities ||= { elements: new WeakMap(), next: 0 };
  const groups = window.__launchControlGroups ||= { elements: new WeakMap(), next: 0 };
  return [...new Set(candidates)].filter(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' &&
      !candidates.some(child => child !== el && el.contains(child));
  }).map(el => {
    if (!identities.elements.has(el)) identities.elements.set(el, identities.next++);
    const i = identities.elements.get(el);
    let group = el.closest('[role="tablist"],[role="group"],.pg-seg,.pg-segmented');
    // A selected button can be a no-op until a sibling choice is selected.
    // Infer only its nearest button container, not the whole card or stage.
    if (!group && el.matches('button,[role="tab"],[role="radio"]')) {
      const parent = el.parentElement;
      if (parent && parent !== root && [...parent.children].filter(child => child.matches('button,[role="tab"],[role="radio"]')).length > 1) group = parent;
    }
    if (group && !groups.elements.has(group)) groups.elements.set(group, groups.next++);
    el.dataset.launchControl = String(i);
    return { focusable: el.tabIndex >= 0, drawing: el.matches('svg,canvas') || Boolean(el.querySelector('svg,canvas')), cursor: getComputedStyle(el).cursor, disabled: Boolean(el.disabled || el.getAttribute('aria-disabled') === 'true'), index: i, tag: el.tagName.toLowerCase(), type: el.type || el.getAttribute('role') || '',
      label: el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 100) || el.id || `control ${i}`,
      selected: el.checked || el.getAttribute('aria-pressed') === 'true' || el.getAttribute('aria-selected') === 'true',
      group: el.name ? `name:${el.name}` : group ? `group:${groups.elements.get(group)}` : null };
  });
}
// Called immediately before each screenshot. All rectangles are in that
// screenshot's coordinates (drive.mjs captures the root with a 4 px border).
export function captureEvidence(scope,probeId,frameIndex) {
  const root=document.querySelector(scope),rootRect=root.getBoundingClientRect();
  const ordinary='button,input,select,textarea,label,[role="button"],[role="switch"],[role="checkbox"],[role="radio"],[role="tab"]';
  const candidates=[...root.querySelectorAll('svg,canvas,output,[data-readout],[aria-live],[role="status"],.pg-sentence,.pg-readouts dd,p,dd,td')]
    .filter(el => !el.closest(ordinary) && !el.parentElement?.closest('svg,canvas'));
  // Prefer the outer named output if nested selectors describe the same text.
  const outputs=candidates.filter(el => !candidates.some(parent => parent!==el && parent.contains(el)));
  const identities=window.__launchOutputIdentities ||= {elements:new WeakMap(),next:0};
  const rectOf=el => {const r=el.getBoundingClientRect();return {x:r.x-rootRect.x+4,y:r.y-rootRect.y+4,w:r.width,h:r.height};};
  const chrome=[...root.querySelectorAll('[data-launch-control]')];
  const hash=value => {let n=2166136261;for(let i=0;i<value.length;i++)n=Math.imul(n^value.charCodeAt(i),16777619);return (n>>>0).toString(16);};
  return {probeId,frameIndex,outputs:outputs.flatMap(el => {
    const rect=rectOf(el);if(rect.w<=0 || rect.h<=0) return [];
    if(!identities.elements.has(el)) identities.elements.set(el,identities.next++);
    const semantics={},kind=el.tagName.toLowerCase();
    if(kind==='svg') {
      const geometry=['x','y','x1','x2','y1','y2','cx','cy','r','rx','ry','width','height','d','points','transform','viewBox'];
      [el,...el.querySelectorAll('*')].forEach((part,index) => {
        const values=geometry.filter(name => part.hasAttribute(name)).map(name => [name,part.getAttribute(name)]);
        if(part.tagName.toLowerCase()==='text') values.push(['text',part.textContent]);
        if(values.length) {
          // Visibility can reveal actual parts; color, outline, hover/focus,
          // class, style, and selected/pressed state are deliberately excluded.
          const r=part.getBoundingClientRect();values.push(['visible',r.width>0 && r.height>0 && getComputedStyle(part).visibility!=='hidden']);
          semantics[index]=hash(JSON.stringify(values));
        }
      });
    } else if(kind!=='canvas') {
      const copy=el.cloneNode(true);copy.querySelectorAll(ordinary).forEach(control => control.remove());
      // Separate stable words/numbers from an independently ticking counter.
      // Positions must stay stable throughout all five samples; inserting or
      // reordering content still needs pixel proof in the same output region.
      const tokens=(copy.textContent || '').match(/[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu) || [];
      tokens.forEach((token,index) => {semantics[`token:${index}`]=token;});
    }
    const masks=chrome.filter(control => {
      // Inspect actual geometry/text inside a custom drawing surface. Its
      // control chrome cannot count because style-only changes have no semantic
      // evidence. Native/button/toggle chrome stays masked even when nested.
      if(control.contains(el) && !control.matches(ordinary)) return false;
      return control.matches(ordinary) || !(control.matches('svg,canvas') || control.querySelector('svg,canvas'));
    }).map(control => rectOf(control.closest('label,.pg-control,[data-pg]') || control));
    return [{id:identities.elements.get(el),kind,rect,semantics,masks}];
  })};
}
const selector = c => `[data-launch-control="${c.index}"]`;
function action(c) {
  const s = selector(c);
  if (c.disabled) return null;
  if (c.tag === 'canvas' || (c.tag === 'input' && ['file','color','date','time','datetime-local','month','week'].includes(c.type))) return null;
  if (c.type === 'range' || c.type === 'slider' || c.type === 'dial' || /grab|move|resize/.test(c.cursor || '')) return [['drag', s, 0.2, 0.8, 0.85, 0.15, 20]];
  if (c.tag === 'select') return [['click', s], ['key', 'ArrowDown', s], ['key', 'Enter', s]];
  if (c.tag === 'textarea' || (c.tag === 'input' && ['text','search','email','url','password','tel','number'].includes(c.type))) {
    if (c.type === 'number') return [['click', s], ['key', 'ArrowUp', s]];
    return [['click', s], ['key', 'x', s]];
  }
  if (c.tag === 'button' || c.tag === 'summary' || ['button','submit','reset','checkbox','radio','switch','tab'].includes(c.type) || c.tag === 'a' || c.cursor === 'pointer') return [['click', s]];
  return null;
}

export function inputProbes(control) {
  const primary=action(control);
  if(control.disabled || control.tag==='canvas') return [];
  const native=['button','summary','input','select','textarea','a'].includes(control.tag);
  const custom=!native && (control.focusable || control.drawing || primary || ['slider','button'].includes(control.type));
  if(!custom) return primary ? [{mode:primary.some(step => step[0]==='drag')?'drag':'primary',steps:primary}] : [];
  const s=selector(control);
  const keys=['Home','End','ArrowRight','ArrowLeft','ArrowUp','ArrowDown',' ','Enter'];
  return [
    {mode:'drag',steps:[['drag',s,0.2,0.8,0.85,0.15,20]]},
    {mode:'click',steps:[['click',s]]},
    ...[...keys].map(key => ({mode:`key-${key===' '?'Space':key}`,steps:[['key',key,s]]})),
  ];
}

export async function checkControls({ target, scope = 'body', width, dir, drive }) {
  const listExpression = `(${inventory.toString()})(${JSON.stringify(scope)})`;
  const discovered = await drive(target, [['eval', listExpression]], join(dir, 'inventory'), width);
  const controls = discovered.evals.find(Array.isArray);
  if (!controls?.length) return { pass: false, status:'unproven', controls: [], reason: 'No exposed controls discovered' };
  const actions = [['eval', listExpression]],plans=[];
  for(const control of controls) {
    const probes=inputProbes(control),s=selector(control);
    if(!probes.length) {plans.push({...control,pass:false,status:'unproven',reason:control.disabled?'Disabled control: precondition not exercised; needs review':'Unsupported exposed control; manual proof required'});continue;}
    const trials=[];
    for(const probe of probes) {
      const {steps,mode}=probe,probeId=`${control.index}-${mode}`;
      // Keep drag endpoints during capture. A legitimate pointer-dependent
      // output may reset on leave; preserve the existing capture restoration.
      const drag=steps.find(step => step[0]==='drag');
      const moveOff=drag?[]:[['move',scope,0.01,0.01]];
      const restoreBefore=drag?[['move',s,drag[2],drag[3]]]:[];
      const restoreAfter=drag?[['move',s,drag[4],drag[5]]]:[];
      actions.push(['scroll',s]);
      const peer=controls.find(c => c.index!==control.index && action(c) && (control.group?c.group===control.group:! /reset/i.test(c.label)));
      if(peer && (control.group || control.selected || /reset|restart|clear/i.test(control.label))) actions.push(...action(peer));
      if(drag) actions.push(['drag',s,drag[4],drag[5],drag[2],drag[3]]);
      actions.push(...moveOff,['wait',400]);
      const paths=['before0','before1','before2','after0','after1'].map(name => join(dir,`control-${probeId}-${name}.png`));
      const shot=index => [
        ['eval',`(${captureEvidence.toString()})(${JSON.stringify(scope)},${JSON.stringify(probeId)},${index})`],
        ['shot',paths[index],scope],
      ];
      for(let n=0;n<3;n++) actions.push(...shot(n),...restoreBefore,['wait',450]);
      actions.push(...steps,...moveOff,['wait',450],...shot(3),...restoreAfter,['wait',450],...shot(4),...restoreAfter);
      trials.push({...probe,probeId,paths});
    }
    plans.push({...control,probes:trials});
  }
  actions.push(['eval',listExpression]);
  // Multiple modalities can take longer than the original single gesture. This
  // is bounded control QA after delivery timing, never added to visibleMs.
  const exercised=await drive(target,observeInteractions(actions,listExpression),join(dir,'controls'),width,{timeout:Math.min(900_000,Math.max(240_000,plans.reduce((n,p)=>n+(p.probes?.length || 0),0)*7000))});
  const results=plans.map(plan => {
    if(!plan.probes) return plan;
    const probes=plan.probes.map(probe => {
      const frames=Array.from({length:5},(_,index) => exercised.evals.find(value => value?.probeId===probe.probeId && value.frameIndex===index));
      try {return {...probe,...visualDelta(probe.paths,[],frames)};}
      catch(error) {return {...probe,pass:false,status:'unproven',reason:String(error)};}
    });
    const best=probes.find(probe => probe.pass) || probes[0];
    return {...plan,...best,probes,pass:probes.some(probe => probe.pass),status:probes.some(probe => probe.pass)?'live':'unproven',
      coverage:{drag:probes.filter(p=>p.mode==='drag').map(p=>({status:p.status,reason:p.reason})),click:probes.filter(p=>p.mode==='click').map(p=>({status:p.status,reason:p.reason})),keyboard:probes.filter(p=>p.mode.startsWith('key-')).map(p=>({mode:p.mode,status:p.status,reason:p.reason}))}};
  });
  const initial=exercised.evals.find(Array.isArray) || controls;
  const snapshots=[{inventoryAfter:{phase:'start'},controls:initial},...exercised.evals.filter(value=>value?.inventoryAfter),{inventoryAfter:{phase:'end'},controls:exercised.evals.filter(Array.isArray).at(-1) || []}];
  for(const control of unexercisedControls(controls,snapshots)) results.push({...control,pass:false,status:'unproven',reason:'Interaction exposed another control that was not exercised (retained even if later hidden)'});
  // The parameter bridge catches subscriber failures and reports console.error;
  // a partially updated readout must not turn that failed render into a pass.
  const runtimeErrors=exercised.log.split('\n').filter(line=>/^(?:exception|console\.error):/.test(line));
  const pass=exercised.code===0 && runtimeErrors.length===0 && results.every(control=>control.pass);
  const report={pass,status:pass?'live':runtimeErrors.length?'runtime-error':'unproven',algorithm:'aligned-output-regions-v1',controls:results,inventories:snapshots,runtimeErrors,
    reason:pass?'Every exposed control produced a proven output change':runtimeErrors.length?'Runtime exception prevents card proof':'At least one control remains unproven; this is not proof that it is dead'};
  writeFileSync(join(dir,'controls.json'),JSON.stringify(report,null,2));
  return report;
}
