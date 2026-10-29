import { afterEach, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-expect-error eval-only ESM is not part of the shipped TypeScript bundle
import { visualDelta, stableSemanticChanges } from './pixels.mjs';
const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');
const directories: string[] = [];
afterEach(() => { for (const dir of directories.splice(0)) rmSync(dir,{recursive:true,force:true}); });
function shots(paint: (frame: number, x: number, y: number) => number) {
  const dir = mkdtempSync(join(tmpdir(),'launch-pixels-')); directories.push(dir);
  return Array.from({length:5},(_,frame) => {
    const png = new PNG({width:64,height:64});
    for (let y=0;y<64;y++) for (let x=0;x<64;x++) {
      const i = (y*64+x)*4, value = paint(frame,x,y);
      png.data[i]=png.data[i+1]=png.data[i+2]=value; png.data[i+3]=255;
    }
    const path=join(dir,`${frame}.png`);writeFileSync(path,PNG.sync.write(png));return path;
  });
}
describe('control screenshot evidence',() => {
  it('fails a completely dead control',() => expect(visualDelta(shots(() => 255)).pass).toBe(false));
  it('does not accept a checkbox changing without output',() => {
    const files=shots((f,x,y) => f>=3 && x<10 && y<10 ? 0 : 255);
    expect(visualDelta(files,[{x:0,y:0,w:12,h:12}]).pass).toBe(false);
  });
  it('does not count ongoing ambient animation as a live response',() => {
    const files=shots((f,x,y) => x<30 && y<30 ? (f%2 ? 0 : 255) : 255);
    expect(visualDelta(files).pass).toBe(false);
  });
  it('accepts persistent output change outside the control mask',() => {
    const files=shots((f,x,y) => f>=3 && x>30 && y>30 ? 0 : 255);
    expect(visualDelta(files,[{x:0,y:0,w:12,h:12}]).pass).toBe(true);
  });
});


// Metadata follows output elements through page growth and translation; the
// image itself is never scaled to make changed dimensions look like a response.
function regionShots(change: boolean, resize: boolean, translate = false) {
  const dir=mkdtempSync(join(tmpdir(),'launch-region-'));directories.push(dir);
  const frames: any[]=[];
  const files=Array.from({length:5},(_,frame)=>{
    const after=frame>=3,height=resize && after?96:64,y=translate && after?24:8;
    const png=new PNG({width:64,height});png.data.fill(255);
    const extent=change && after?24:10;
    for(let dy=0;dy<20;dy++) for(let x=8;x<8+extent;x++) {
      const i=((y+dy)*64+x)*4;png.data[i]=png.data[i+1]=png.data[i+2]=0;
    }
    frames.push({outputs:[{id:0,kind:'svg',rect:{x:8,y,w:32,h:24},masks:[],semantics:{geometry:String(extent)}}]});
    const path=join(dir,`${frame}.png`);writeFileSync(path,PNG.sync.write(png));return path;
  });
  return {files,frames};
}
describe('aligned output-region proof',()=>{
  it('accepts actual output change despite different body heights',()=>{
    const {files,frames}=regionShots(true,true);
    expect(visualDelta(files,[],frames).pass).toBe(true);
  });
  it('aligns moved output locally instead of counting page reflow as change',()=>{
    const {files,frames}=regionShots(false,true,true);
    expect(visualDelta(files,[],frames).pass).toBe(false);
    // Even if another semantic attribute changes, mere translation supplies no pixels.
    frames[3].outputs[0].semantics.extra='x';frames[4].outputs[0].semantics.extra='x';
    expect(visualDelta(files,[],frames).changed).toBe(0);
  });
  it('requires both content evidence and pixels, never style alone or a semantic-only pass',()=>{
    const {files,frames}=regionShots(true,true);
    frames.forEach(frame=>frame.outputs[0].semantics={geometry:'unchanged'});
    expect(visualDelta(files,[],frames).pass).toBe(false);
    const unchanged=regionShots(false,false);
    unchanged.frames[3].outputs[0].semantics.geometry='different';unchanged.frames[4].outputs[0].semantics.geometry='different';
    expect(visualDelta(unchanged.files,[],unchanged.frames).pass).toBe(false);
  });
  it('does not call missing or replaced output evidence dead',()=>{
    const {files,frames}=regionShots(true,true);frames[4].outputs=[];
    expect(visualDelta(files,[],frames)).toMatchObject({pass:false,status:'unproven'});
  });
  it('excludes continuously changing semantics while retaining stable changes',()=>{
    const signatures=[0,1,2,3,4].map((n)=>({clock:String(n),result:n<3?'old':'new',style:'unchanged'}));
    expect(stableSemanticChanges(signatures)).toEqual(['result']);
  });
});
