import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as k from '../kit/iso-kit.mjs';
import { kitScript } from '../scripts/inline-kit.mjs';
import { DEFAULTS, LIMITS, PRESETS, SAMPLE } from './model.mjs';
import { drawPress } from './art.mjs';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const inlineModule = path => read(path).replace(/^export /gm, '');
const escapeHtml = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const words = value => value.split(' ').map(word => `<span data-type>${escapeHtml(word)}</span>`).join(' ');
const sample = `<p class="sample-kicker">Field notes / 01</p><h4 class="sample-title">${words('Give ideas room.')}</h4><p class="sample-body">${words(SAMPLE)}</p><p class="sample-footer">A small study in product typography.</p>`;
export async function createPayload() {
  const labels = { fontSize: ['Type size', 'The voice of the paragraph'], measure: ['Line length', 'Measured in widths of the “0” glyph'], leading: ['Leading', 'Line height as a multiple of type size'], margin: ['Margins', 'Space around the composition'] };
  const controls = Object.entries(LIMITS).map(([key, [min, max, step]]) => `<div><label for="${key}">${labels[key][0]}<output id="${key}-value" for="${key}"></output></label><input id="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${DEFAULTS[key]}" aria-describedby="${key}-help"><p class="control-help" id="${key}-help">${labels[key][1]}</p></div>`).join('');
  const names = ['fitProjection', 'iso', 'solidSvg', 'slabOf', 'cylinder', 'lineSvg', 'segment', 'planOutline', 'pathOf', 'sideRing', 'knurl', 'faceTextSvg', 'topMatrix', 'translateAlong'];
  const script = `(() => {\n${kitScript()}\nconst k = { ${names.join(', ')} };\n${inlineModule('./model.mjs')}\n${inlineModule('./art.mjs')}\n${read('./live.js')}\n})();`.replace(/<\/script/gi, '<\\/script');
  const html = `<!-- Anatomy drawing kit: https://github.com/wheresryan22/anatomy\n${read('../LICENSE').replace(/--/g, '—')} -->
<style>${k.ISO_CSS}\n${read('./styles.css')}</style>
<section class="typography-press" aria-label="Typography printing press">
<h2>A printing press for your interface</h2><p class="intro">Set the type, pull an impression, read the result. Four small decisions change how the same words feel.</p>
<div class="press-stage iso" data-theme="light" aria-busy="false"><div class="figure-cap"><span>FIG. 01 / TYPOGRAPHY</span><span>Flatbed proof press</span></div><svg class="iso-svg" viewBox="0 0 720 360" role="img" aria-label="A detailed flatbed printing press. Metal type and spacing furniture sit in an iron chase between two rails. An impression cylinder moves over the type when Print proof is pressed.">${drawPress(k)}</svg><div class="figure-foot"><span id="press-status" aria-live="polite">Press ready · type and proof match</span><span id="draft-readout"></span></div></div>
<div class="controls">${controls}</div>
<div class="press-actions"><button id="print">Print proof ↗</button><button id="reset">Reset</button></div><p id="draft-status" aria-live="polite"></p>
<div class="proof-heading"><h3>Last printed proof</h3><span id="proof-settings"></span></div>
<div class="proof-bench" tabindex="0" role="region" aria-label="Printed typography proof. Scroll horizontally if the sheet is wider than the viewport."><article class="proof-sheet" id="printed-sheet" aria-label="Printed sample">${sample}</article></div>
<div class="proof-caption"><span id="proof-readout"></span><span>Actual CSS pixels · scroll wide sheets</span></div>
<div class="proof-sheet" id="draft-sheet" aria-hidden="true">${sample}</div>
<div class="presets" role="group" aria-label="Typography presets">${PRESETS.map((preset, index) => `<button data-preset="${index}" aria-pressed="false">${preset.name}</button>`).join('')}</div>
<p id="experiment-note">Change one setting, print, then compare the reading rhythm. The body copy stays the same.</p>
<details><summary>What this instrument shows</summary><p>Type size is in CSS pixels. Line length uses ch: the width of the font’s “0” glyph, so 44 ch is not a promise of 44 characters per line. Leading multiplies the type size. Margins surround the text without changing its chosen measure. The proof uses real browser text layout with Georgia and a serif fallback; line breaks can vary with the installed font.</p><p>The metal type follows measured word positions, including the heading. The press is an illustrative proofing mechanism, not a mechanical simulation. The line readout counts the body paragraph only. Adjustments set the type; Print proof commits that composition. Both the draft and last proof are saved. No readability score is inferred.</p><p><a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/line-height" target="_blank" rel="noreferrer">CSS reference: line height</a></p></details>
<footer><a href="https://skills.wheresryan.sh/anatomy" target="_blank" rel="noreferrer">Drawing kit: Anatomy by Ryan</a><a href="https://x.com/thebuggeddev/status/2108720133422395590?s=20" target="_blank" rel="noreferrer">Learning-demo inspiration: The Bugged Dev</a></footer>
</section><script>${script}</script>`;
  return { title: 'Typography printing press · Anatomy', width: 820, html };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [flag, output, ...extra] = process.argv.slice(2);
  if (flag !== '--out' || !output || extra.length) throw new Error('Usage: node build.mjs --out <new payload.json>');
  const payload = await createPayload();
  if (payload.html.length > 400_000) throw new Error('Example exceeds the Playgrounds HTML limit.');
  writeFileSync(resolve(output), JSON.stringify(payload) + '\n', { flag: 'wx' });
  console.log(`Wrote ${resolve(output)} (${payload.html.length} HTML characters).`);
}
