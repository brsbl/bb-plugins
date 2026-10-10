import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as k from '../kit/iso-kit.mjs';
import { kitScript } from '../scripts/inline-kit.mjs';
import { DEFAULTS, EXPERIMENTS, LIMITS } from './model.mjs';
import { drawLever } from './art.mjs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const inlineModule = (path) => read(path).replace(/^export /gm, '');
const names = ['fitProjection', 'iso', 'solidSvg', 'slabOf', 'cylinder', 'lineSvg', 'segment', 'planOutline', 'pathOf', 'sideRing', 'sideArc'];

export function buildLeverPlayground() {
  const controls = Object.entries(LIMITS).map(([key, [min, max, step]]) => {
    const side = key.startsWith('left') ? 'Left' : 'Right';
    const quantity = key.endsWith('Mass') ? 'mass' : 'distance';
    const unit = quantity === 'mass' ? 'kg' : 'cm';
    return `<div class="${side.toLowerCase()}"><label for="${key}">${side} ${quantity}<output id="${key}-value" for="${key}">${DEFAULTS[key]} ${unit}</output></label><input id="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${DEFAULTS[key]}" aria-describedby="${key}-value"></div>`;
  }).join('');
  const license = read('../LICENSE').replace(/--/g, '—');
  const script = `(() => {\n${kitScript()}\nconst k = { ${names.join(', ')} };\n${inlineModule('./model.mjs')}\n${inlineModule('./art.mjs')}\n${read('./live.js')}\n})();`.replace(/<\/script/gi, '<\\/script');
  const html = `<!-- Anatomy drawing kit: https://github.com/wheresryan22/anatomy\n${license} -->
<style>${k.ISO_CSS}\n${read('./styles.css')}</style>
<section class="lever-lab" aria-label="Lever learning lab">
<h2>A little distance makes a big difference</h2>
<p class="intro">A lever turns because of both weight and reach. Move a mass along the beam and watch its turning effect change.</p>
<div class="lab-stage iso" data-theme="light">
<svg class="iso-svg" viewBox="0 0 680 355" role="img" aria-label="Beam balance on a central pivot with a purple mass on the left and an amber mass on the right"><g id="lever-parts">${drawLever(k, DEFAULTS, 0)}</g></svg>
<div class="stage-label"><span>Lever &amp; fulcrum</span><span>Each disc represents 0.1 kg</span></div>
</div>
<div class="lab-grid"><div>
<h3>The balance rule</h3><div class="equation">m₁ × d₁ = m₂ × d₂</div>
<p>Mass × distance is the same on both sides when the beam balances. Gravity acts equally on both.</p>
<dl class="metrics"><div><dt>Left torque</dt><dd id="left-torque">1.96 N·m</dd></div><div><dt>Right torque</dt><dd id="right-torque">1.96 N·m</dd></div><div><dt>Net gravitational torque</dt><dd id="net-torque">0.00 N·m</dd></div><div><dt>Beam tilt</dt><dd id="tilt">0.0°</dd></div></dl>
<p id="result" class="result" aria-live="polite">Balanced: the turning effects cancel.</p>
</div><div><h3>Change the experiment</h3><div class="controls">${controls}</div><div class="lab-actions"><button id="release">Release from level</button><button id="reset">Reset</button></div></div></div>
<div class="chart"><div id="time-label">Tilt over simulated time · 0–6 s</div>
<svg viewBox="0 0 650 88" role="img" aria-labelledby="trace-description"><desc id="trace-description">Beam tilt over time. Positive means the left end is lower.</desc><g fill="none" stroke="var(--pg-hairline)"><path d="M36 17H624M36 43H624M36 69H624M36 17V69M624 17V69"/></g><g fill="currentColor" font-size="10.5"><text x="0" y="21">+12°</text><text x="18" y="47">0°</text><text x="0" y="73">−12°</text><text x="36" y="86">6 s ago</text><text x="603" y="86">now</text></g><polyline id="tilt-trace" points="36,43 624,43" fill="none" stroke="#626bd3" stroke-width="2"/></svg></div>
<div class="experiments"><h3>Try it, then explain it</h3><ol>${EXPERIMENTS.map((item, i) => `<li><button data-experiment="${i}" aria-pressed="false"><span>${i + 1}.</span>${item.label}</button></li>`).join('')}</ol><p class="experiment-note" id="experiment-note">Predict which end will fall. Change a mass or its distance, then compare the two torques.</p></div>
<details><summary>Model &amp; assumptions</summary><p>A uniform 0.5 kg, 1 m beam rotates around its centre. Distances are measured along the beam. Each gravitational torque is m × 9.81 × d × cos(tilt), with d in metres. The trace numerically integrates Iθ″ = τleft − τright − 0.8θ′, with a fixed inertia for each chosen input and inelastic travel stops at ±12°. Hanging masses are treated as point masses; swinging and friction at the pivot are omitted. The drawing is illustrative. Positive tilt means the left end is lower. “Release from level” resets angle and velocity without changing inputs. Reduced motion jumps to the resting pose and omits the trace. Saved inputs restore a fresh release, not a recording of the motion.</p><p><a href="https://openstax.org/books/university-physics-volume-1/pages/12-1-conditions-for-static-equilibrium" target="_blank" rel="noreferrer">Physics reference: OpenStax, static equilibrium</a></p></details>
<footer><a href="https://skills.wheresryan.sh/anatomy" target="_blank" rel="noreferrer">Drawing kit: Anatomy by Ryan</a><a href="https://x.com/thebuggeddev/status/2108720133422395590" target="_blank" rel="noreferrer">Learning-demo inspiration: The Bugged Dev</a></footer>
</section>
<script>${script}</script>`;
  return { title: 'Lever & fulcrum · Anatomy', width: 820, html };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [flag, output, ...extra] = process.argv.slice(2);
  if (flag !== '--out' || !output || extra.length) throw new Error('Usage: node build.mjs --out <new payload.json>');
  const payload = buildLeverPlayground();
  if (payload.html.length > 400_000) throw new Error('Example exceeds the Playgrounds HTML limit.');
  writeFileSync(resolve(output), JSON.stringify(payload) + '\n', { flag: 'wx' });
  console.log(`Wrote ${resolve(output)} (${payload.html.length} HTML characters).`);
}
