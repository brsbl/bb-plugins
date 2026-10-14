import assert from 'node:assert/strict';
import {test} from 'node:test';
import {contrast, derive, mix} from './colors.ts';

const themes = [
  {canvas:[1,1,1],ink:[.19,.2,.22],foreground:[.19,.2,.22],sidebar:[.96,.97,.98],sidebarAccent:[.9,.92,.95],card:[1,1,1],primary:[.18,.22,.29],timeline:[.4,.55,.72],border:[.8,.82,.86],selected:[.88,.9,.94]},
  {canvas:[.16,.16,.21],ink:[.97,.97,.95],foreground:[.97,.97,.95],sidebar:[.19,.2,.26],sidebarAccent:[.26,.27,.35],card:[.16,.16,.21],primary:[.74,.58,.98],timeline:[.55,.91,.99],border:[.28,.29,.36],selected:[.28,.29,.4]},
];

test('light and dark pill text stays readable through normal and selected gradients',()=>{
  for(const theme of themes) for(const strength of [.55,.78,1]) {
    const d=derive(theme,strength);
    for(const stops of [d.normal,d.selected]) for(let i=0;i<stops.length-1;i++) for(let j=0;j<=32;j++) {
      const background=mix(stops[i],stops[i+1],j/32);
      assert.ok(contrast(d.text,background)>=4.5);
      assert.ok(contrast(d.icon,background)>=4.5);
    }
  }
});

test('the frame preserves distinct theme surfaces and does not invent color in neutral themes',()=>{
  for(const theme of themes) assert.deepEqual(derive(theme,.78).base,theme.sidebar);
  assert.notDeepEqual(derive(themes[0],.78).palette,derive(themes[1],.78).palette);
  const neutral=Object.fromEntries(Object.entries(themes[0]).map(([key,color])=>[key,Array(3).fill(color[0])]));
  for(const color of derive(neutral,1).palette) assert.ok(Math.max(...color)-Math.min(...color)<.001);
});
