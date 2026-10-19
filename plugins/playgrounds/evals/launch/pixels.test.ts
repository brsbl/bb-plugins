import { afterEach, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-expect-error eval-only ESM is not part of the shipped TypeScript bundle
import { visualDelta } from './pixels.mjs';
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
