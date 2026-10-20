import { describe, expect, it } from 'vitest';
// @ts-expect-error eval-only ESM
import { inputProbes } from './controls.mjs';

describe('custom surface input coverage',()=>{
  it('tests drag, click and keyboard independently despite slider semantics',()=>{
    const probes=inputProbes({index:0,tag:'div',type:'slider',focusable:true,label:'Position'});
    expect(probes.map((probe:{mode:string})=>probe.mode)).toEqual(expect.arrayContaining(['drag','click','key-Home','key-End','key-ArrowRight','key-ArrowLeft','key-ArrowUp','key-ArrowDown','key-Space','key-Enter']));
    expect(probes.find((probe:{mode:string})=>probe.mode==='key-End').steps).toEqual([['key','End','[data-launch-control="0"]']]);
  });
  it('also probes a focusable drawing without an ARIA role',()=>{
    expect(inputProbes({index:1,tag:'div',type:'',focusable:true,drawing:true,label:'Drawing'}).map((probe:{mode:string})=>probe.mode)).toContain('key-Enter');
  });
  it('does not pretend disabled, unknown or file controls were exercised',()=>{
    expect(inputProbes({index:0,tag:'div',type:'slider',disabled:true})).toEqual([]);
    expect(inputProbes({index:0,tag:'span',type:''})).toEqual([]);
    expect(inputProbes({index:0,tag:'input',type:'file'})).toEqual([]);
  });
  it('keeps native toggle interaction focused on its actual click',()=>{
    const probes=inputProbes({index:0,tag:'input',type:'checkbox'});
    expect(probes).toEqual([{mode:'primary',steps:[['click','[data-launch-control="0"]']]}]);
  });
});
