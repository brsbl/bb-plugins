import { describe, expect, it } from 'vitest';
// @ts-expect-error executable eval-only ESM
import { buildingProgress, observeInteractions, renderWindow, unexercisedControls } from './observations.mjs';

describe('visible progress while building', () => {
  const work = {kind:'work', startedAt:20, completedAt:100};
  const opening = {id:'opening', role:'assistant', text:'I’ll build a working model.', startedAt:10};
  const update = {id:'update', role:'assistant', text:'The model is ready; I’m checking its inputs.', startedAt:50};
  it('keeps visible opening text and updates while tools are still working', () => {
    const observations = [{rowId:'opening',at:15,text:opening.text},{rowId:'update',at:60,text:update.text}];
    expect(buildingProgress(observations,[opening,work,update])).toEqual(observations);
  });
  it('rejects a final answer observed just before its card paints', () => {
    const final = {id:'final',role:'assistant',startedAt:110,text:'Here it is.\n::playground{id="example"}'};
    expect(buildingProgress([{rowId:'final',at:115,text:final.text}],[work,final])).toEqual([]);
  });
  it('uses the completed row even if the browser saw only a streamed final preface', () => {
    const final = {id:'final',role:'assistant',startedAt:90,text:'Here it is.\n::playground{id="example"}'};
    expect(buildingProgress([{rowId:'final',at:95,text:'Here it is.'}],[work,final])).toEqual([]);
  });
  it('does not count final prose, tool status, unknown rows, or text first observed after work ended', () => {
    const final = {id:'final',role:'assistant',startedAt:110,text:'All done.'};
    const status = {id:'status',kind:'work',startedAt:20,completedAt:100,text:'Building'};
    expect(buildingProgress([
      {rowId:'final',at:115,text:final.text},
      {rowId:'status',at:30,text:status.text},
      {rowId:'missing',at:30,text:'Unknown'},
      {rowId:'opening',at:105,text:opening.text},
    ],[opening,work,final,status])).toEqual([]);
  });
});

const windowAt = (now: number, agentCompletedAt: number | null, visibleAt: number | null = null, capAt = 900_000) =>
  renderWindow({now,agentCompletedAt,visibleAt,capAt});

describe('terminal-to-render grace', () => {
  it('waits for a card that paints after the agent finishes without hiding its delay', () => {
    expect(windowAt(100_000,100_000).done).toBe(false);
    const waiting = windowAt(114_000,100_000);
    expect(waiting.done).toBe(false);
    expect(waiting.renderGraceUsed).toBe(true);
    const painted = windowAt(114_000,100_000,114_000);
    expect(painted.done).toBe(true);
    expect(painted.renderDelayMs).toBe(14_000);
    expect(painted.deadline).toBe(130_000);
  });
  it('ends a no-card run at 30 seconds and cannot silently lengthen the grace', () => {
    expect(windowAt(129_999,100_000).done).toBe(false);
    expect(windowAt(130_000,100_000).done).toBe(true);
    expect(renderWindow({now:130_000,agentCompletedAt:100_000,visibleAt:null,capAt:900_000,graceMs:60_000}).deadline).toBe(130_000);
  });
  it('clips grace at the original cap, including an agent that finishes near it', () => {
    expect(windowAt(895_000,890_000).done).toBe(false);
    expect(windowAt(900_000,890_000).done).toBe(true);
    expect(windowAt(900_000,890_000).deadline).toBe(900_000);
  });
  it('does not apply terminal grace to a still-building agent or an earlier card', () => {
    expect(windowAt(500_000,null).done).toBe(false);
    expect(windowAt(500_000,null).renderGraceUsed).toBe(false);
    expect(windowAt(100_000,100_000,99_000).renderGraceUsed).toBe(false);
    expect(windowAt(100_000,100_000,99_000).renderDelayMs).toBe(0);
  });
});

describe('controls exposed between screenshots', () => {
  const initial = [{index:0,label:'General tab'},{index:1,label:'Advanced tab'}];
  it('fails an untested dead control even when a later tab hides it again', () => {
    const dead = {index:2,label:'Send alerts'};
    const snapshots = [
      {inventoryAfter:{actionIndex:0,kind:'click'},controls:[...initial,dead]},
      {inventoryAfter:{actionIndex:1,kind:'click'},controls:initial},
    ];
    expect(unexercisedControls(initial,snapshots)).toEqual([{...dead,exposedAfter:{actionIndex:0,kind:'click'}}]);
  });
  it('retains a newly exposed twin and deduplicates repeated observations by identity', () => {
    const twin = {index:2,label:'General tab'};
    const snapshots = [0,1,2].map(actionIndex => ({inventoryAfter:{actionIndex,kind:'click'},controls:[...initial,twin]}));
    expect(unexercisedControls(initial,snapshots)).toHaveLength(1);
    expect(unexercisedControls(initial,snapshots)[0].index).toBe(2);
    expect(unexercisedControls(initial,[{controls:initial}])).toEqual([]);
  });
  it('inserts an inventory immediately after every interaction and delayed observation', () => {
    const actions = [['click','#advanced'],['drag','#slider',0,0,1,0],['key','Enter','#choice'],['wait',450],['click','#general']];
    const expanded = observeInteractions(actions,'readControls()');
    expect(expanded).toHaveLength(10);
    actions.forEach((action,index) => {
      expect(expanded[index*2]).toEqual(action);
      expect(expanded[index*2+1][0]).toBe('eval');
      expect(expanded[index*2+1][1]).toContain(`"actionIndex":${index}`);
      expect(expanded[index*2+1][1]).toContain('controls:readControls()');
    });
  });
});
