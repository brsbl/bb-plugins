// Decode the moving content, not the intentionally held three-second credits.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { ffmpegPath } from '../skills/how-it-works/scripts/clip-tools.mjs';
const out = resolve('clip-evidence');
mkdirSync(out, { recursive: true });
const html = `${out}/motion.html`, video = `${out}/motion.mp4`, actions = `${out}/motion-actions.json`;
writeFileSync(html, `<!doctype html><style>
html,body{margin:0;background:#000}canvas{display:block}
#css{position:absolute;left:0;top:440px;width:12px;height:40px;background:white;animation:travel 7s linear infinite}
@keyframes travel{from{transform:translateX(0)}to{transform:translateX(630px)}}
</style><canvas width="720" height="720"></canvas><div id="css"></div><script>
const ctx=document.querySelector('canvas').getContext('2d');
const start=performance.now(), epoch=Date.now();let ticks=0;
setInterval(()=>ticks++,100);
function draw(now){
  ctx.fillStyle='#000';ctx.fillRect(0,0,720,720);ctx.fillStyle='#fff';
  for(const [elapsed,y] of [[now-start,300],[performance.now()-start,520],[Date.now()-epoch,620]])
    ctx.fillRect(Math.floor((elapsed%7000)/7000*630),y,12,60);
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
addEventListener('message',async({data:m})=>{
  if(m?.source!=='playground'||m.type!=='command')return;
  const before=performance.now();await new Promise(done=>setTimeout(done,200));
  const elapsed=performance.now()-start;
  const ok=Math.abs(performance.now()-before-200)<35 && Math.abs(elapsed-(Date.now()-epoch))<2 && Math.abs(ticks-Math.floor(elapsed/100))<=1;
  postMessage({source:'playground',type:'result',cmdId:m.cmdId,ok,error:'Virtual timers and clocks diverged'},'*');
});
</script>`);
writeFileSync(actions,JSON.stringify([['wait',1000],['do','checkClocks',[]]]));
execFileSync(process.execPath, [resolve('plugins/playgrounds/skills/how-it-works/scripts/clip.mjs'), '--file', html, '--prompt', 'Show a marker moving smoothly across the screen.', '--out', video, '--seconds', '10', '--actions', actions], {stdio:'inherit', timeout:240000});
const evidence = {};
for(const [name,y] of [['raf',330],['css',450],['performance',550],['date',650]]) {
  const rows=execFileSync(await ffmpegPath(), ['-v','error','-i',video,'-frames:v','210','-vf',`crop=720:2:0:${y},format=gray`,'-f','rawvideo','pipe:1'], {maxBuffer:2_000_000});
  assert.equal(rows.length,210*720*2);
  const positions=Array.from({length:210},(_,i)=>rows.subarray(i*1440,i*1440+720).findIndex(v=>v>220));
  assert.ok(positions.every(x=>x>=0 && x<640),`${name}: every moving frame must contain its marker`);
  const distinct=new Set(positions).size;
  evidence[name]={frames:210,distinct,ratio:distinct/210,positions};
  writeFileSync(`${out}/motion.json`,JSON.stringify(evidence,null,2)+'\n');
  assert.ok(distinct>=189, `${name}: ${distinct}/210 distinct frames; at least 90% required`);
  assert.ok(positions.every((x,i)=>Math.abs(x-i*3)<=2),`${name}: marker must advance 3 pixels per 1/30 second, independent of capture speed`);
}
