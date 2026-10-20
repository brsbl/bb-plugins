// Decode the moving content, not the intentionally held three-second credits.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { ffmpegPath } from '../skills/how-it-works/scripts/clip-tools.mjs';
const out = resolve('clip-evidence');
mkdirSync(out, { recursive: true });
const html = `${out}/motion.html`, video = `${out}/motion.mp4`;
writeFileSync(html, `<!doctype html><style>html,body{margin:0;background:#000}canvas{display:block}</style><canvas width="720" height="720"></canvas><script>
const ctx=document.querySelector('canvas').getContext('2d');
const start=performance.now();
function draw(now){const x=Math.floor(((now-start)%7000)/7000*630);ctx.fillStyle='#000';ctx.fillRect(0,0,720,720);ctx.fillStyle='#fff';ctx.fillRect(x,300,12,100);requestAnimationFrame(draw)}
requestAnimationFrame(draw);
</script>`);
execFileSync(process.execPath, [resolve('plugins/playgrounds/skills/how-it-works/scripts/clip.mjs'), '--file', html, '--prompt', 'Show a marker moving smoothly across the screen.', '--out', video, '--seconds', '10'], {stdio:'inherit', timeout:240000});
const rows=execFileSync(await ffmpegPath(), ['-v','error','-i',video,'-frames:v','210','-vf','crop=720:2:0:350,format=gray','-f','rawvideo','pipe:1'], {maxBuffer:2_000_000});
assert.equal(rows.length,210*720*2);
const positions=Array.from({length:210},(_,i)=>rows.subarray(i*1440,i*1440+720).findIndex(v=>v>220));
assert.ok(positions.every(x=>x>=0 && x<640),'Every moving-content frame must contain the marker');
const distinct=new Set(positions).size;
writeFileSync(`${out}/motion.json`,JSON.stringify({frames:210,distinct,ratio:distinct/210,positions},null,2)+'\n');
assert.ok(distinct>=189, `Moving content has ${distinct}/210 distinct frames; at least 90% required`);
