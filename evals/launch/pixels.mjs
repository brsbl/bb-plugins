import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
// Optional absolute module path supports an existing bb checkout without adding
// a browser/image stack to the shipped plugin's runtime dependencies.
const { PNG } = require(process.env.LAUNCH_PNGJS || 'pngjs');
export const readPng = file => PNG.sync.read(readFileSync(file));
const distance = (a, b, ai, bi) => Math.max(...[0, 1, 2].map(channel => Math.abs(a.data[ai + channel] - b.data[bi + channel])));
const masked = (x,y,masks) => masks.some(r => x >= r.x - 6 && x <= r.x+r.w+6 && y >= r.y-6 && y <= r.y+r.h+6);
function compareRegion(images, rects, masks) {
  // Align each output at its own origin. Page growth and translations are not
  // evidence. Compare only the shared extent; do not stretch/reflow screenshots.
  const starts = rects.map(r => ({x:Math.max(0,Math.round(r.x)),y:Math.max(0,Math.round(r.y))}));
  const width = Math.max(0,Math.floor(Math.min(...rects.map((r,i) => Math.min(r.w,images[i].width-starts[i].x)))));
  const height = Math.max(0,Math.floor(Math.min(...rects.map((r,i) => Math.min(r.h,images[i].height-starts[i].y)))));
  let stable=0,changed=0,ambient=0;
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    if(starts.some((start,i) => masked(start.x+x,start.y+y,masks[i]))) continue;
    const indices=starts.map((start,i) => ((start.y+y)*images[i].width+start.x+x)*4);
    const delta=(a,b) => distance(images[a],images[b],indices[a],indices[b]);
    if(delta(0,1)>12 || delta(1,2)>12) {ambient++;continue;}
    stable++;
    if(delta(2,3)>18 && delta(2,4)>18 && delta(3,4)<=12) changed++;
  }
  const required=Math.max(24,ambient*4),pass=changed>=required;
  return {pass,status:pass?'live':'unproven',changed,required,ambient,stable,comparedWidth:width,comparedHeight:height,
    reason:pass?'stable output changed outside controls':'no proven output change outside controls'};
}
export function stableSemanticChanges(signatures) {
  const keys=new Set(signatures.flatMap(signature => Object.keys(signature)));
  return [...keys].filter(key => signatures[0][key]===signatures[1][key] && signatures[1][key]===signatures[2][key] &&
    signatures[3][key]===signatures[4][key] && signatures[2][key]!==signatures[3][key]);
}
export function visualDelta(files,masks=[],frames) {
  const images=files.map(readPng);
  if(images.length!==5) throw new Error('Need three baseline and two post-input screenshots');
  if(frames) {
    if(frames.length!==5 || frames.some(frame => !frame?.outputs)) return {pass:false,status:'unproven',reason:'Output-region evidence missing'};
    const regions=frames[0].outputs.map(output => {
      const samples=frames.map(frame => frame.outputs.find(candidate => candidate.id===output.id));
      if(samples.some(sample => !sample)) return {id:output.id,pass:false,status:'unproven',reason:'Output region disappeared or was replaced'};
      const semanticChanges=stableSemanticChanges(samples.map(sample => sample.semantics));
      if(!semanticChanges.length) return {id:output.id,pass:false,status:'unproven',reason:'No persistent text or SVG geometry change; layout/style alone is not proof'};
      const comparison=compareRegion(images,samples.map(sample => sample.rect),samples.map(sample => sample.masks));
      return {id:output.id,kind:output.kind,...comparison,semanticChanges};
    });
    // A stable readout need not overcome unrelated animation elsewhere in the
    // figure. It still needs its own semantic AND persistent pixel evidence.
    const best=regions.find(region => region.pass) || regions.find(region => region.changed!==undefined);
    return {...(best || {pass:false,status:'unproven',reason:'No proven output change outside controls'}),regions,
      dimensions:images.map(image => ({width:image.width,height:image.height})),comparison:'aligned-output-regions'};
  }
  // Legacy evidence with no region metadata is safe only on a fixed canvas.
  // New measurements always supply metadata; differing page dimensions alone
  // neither pass nor fail a control.
  if(images.some(image => image.width!==images[0].width || image.height!==images[0].height))
    return {pass:false,status:'unproven',reason:'Output-region evidence needed to align legacy resized screenshots'};
  return compareRegion(images,images.map(image => ({x:0,y:0,w:image.width,h:image.height})),images.map(() => masks));
}
export function hasInk(file) {
  const p = readPng(file);
  const colors = new Set();
  for (let i = 0; i < p.data.length; i += 16) colors.add(`${p.data[i] >> 4},${p.data[i+1] >> 4},${p.data[i+2] >> 4}`);
  return p.width > 80 && p.height > 40 && colors.size > 8;
}
