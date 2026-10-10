import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as k from '../kit/iso-kit.mjs';
import { kitScript } from '../scripts/inline-kit.mjs';
import { initialState, LIMITS, PRESETS } from './model.mjs';
import { drawRig } from './art.mjs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const inlineModule = path => read(path).replace(/^export /gm, '');
const names = ['fitProjection', 'iso', 'solidSvg', 'slabOf', 'cylinder', 'lineSvg', 'segment', 'planOutline', 'haloOf', 'sideArc', 'sideSeam', 'radialTicks', 'knurl', 'ring', 'coil', 'translateAlong', 'topTicks'];

export async function createPayload() {
  const controls = Object.entries(LIMITS).map(([key, [min, max, step]]) => `<div><label for="${key}">${key === 'stiffness' ? 'Spring stiffness · k' : 'Damping · c'}<output id="${key}-value" for="${key}">${initialState[key]}</output></label><input id="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${initialState[key]}" aria-describedby="${key}-value"></div>`).join('');
  const license = read('../LICENSE').replace(/--/g, '—');
  // The upstream kit contains an HTML builder; escape every script boundary,
  // including those inside string literals, before the HTML parser sees it.
  const script = `(() => {\n${kitScript()}\nconst k = { ${names.join(', ')} };\n${inlineModule('./model.mjs')}\n${inlineModule('./art.mjs')}\n${read('./live.js')}\n})();`.replace(/<\/script/gi, '<\\/script');
  const html = `<!-- Anatomy drawing kit: https://github.com/wheresryan22/anatomy\n${license} -->
<style>${k.ISO_CSS}\n${read('./styles.css')}</style>
<section class="motion-lab" aria-label="Interface motion rig">
<p class="eyebrow">Anatomy / Product design / 02</p>
<h2>Give an interface a little weight</h2>
<p class="intro">Drag a spring-mounted drawer. Tune how it settles. The interface below follows the very same position, frame for frame.</p>
<div class="rig-stage iso" data-theme="light">
<div class="stage-top"><span>Fig. 02 &nbsp; Linear motion rig</span><span id="motion-status">At rest</span></div>
<div class="rig-drag" id="motion-drag" tabindex="0" role="slider" aria-label="Drawer target" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" aria-describedby="drag-hint">
<svg id="motion-svg" class="iso-svg" viewBox="0 0 720 355" aria-hidden="true">${drawRig(k, 1, 1)}</svg>
</div>
<div class="stage-bottom"><p id="drag-hint">Drag the drawer, then let go.<br>Arrow keys move the target; Home / End close / open.</p><div class="goal-buttons"><button data-goal="0" aria-pressed="false">Close</button><button data-goal="1" aria-pressed="true">Open</button></div></div>
</div>
<div class="design-grid">
<section aria-label="Live product interface"><div class="panel-heading"><h3>Feel it in the interface</h3><span>One shared spring</span></div>
<div class="product-window"><div class="product-top"><strong>Workspace</strong><span>3 members</span></div><div class="product-content"><h4>Product systems</h4><p>A place for your team's decisions and small discoveries.</p><button id="preview-open">Project details</button><div class="product-line"></div><div class="product-line short"></div></div>
<aside class="interface-drawer" id="interface-drawer" aria-label="Project details"><div class="drawer-top"><span>Project details</span><button id="preview-close" aria-label="Close project details">×</button></div><div class="drawer-content"><p>Keep useful context close to the work.</p><div class="drawer-row"><span>Visibility</span><span>Private</span></div><div class="drawer-row"><span>Owner</span><span>You</span></div><span class="drawer-tag">Product design</span></div></aside></div>
<p class="preview-caption">Change direction before it stops. Position and velocity carry through the interruption.</p></section>
<section aria-label="Motion controls"><h3>Set the character</h3><div class="controls">${controls}</div><p class="preset-label">Presets · replay an opening from rest</p><div class="presets">${Object.entries(PRESETS).map(([name, preset]) => `<button data-preset="${name}" aria-pressed="false">${preset.label}</button>`).join('')}</div><p class="preset-note" id="preset-note">Stiffness pulls toward the target. Damping removes speed. Change either while the drawer is moving.</p><div class="reset-line"><button id="reset">Reset rig</button><span>Target <output id="target-value">100%</output></span></div></section>
</div>
<dl class="metrics"><div><dt>Drawer position</dt><dd id="position-value">100%</dd></div><div><dt>Velocity · travel / second</dt><dd id="velocity-value">0.00/s</dd></div><div><dt>Damping ratio · ζ</dt><dd><span id="damping-ratio">0.67</span><small id="regime">Underdamped</small></dd></div><div><dt>Ideal step overshoot</dt><dd><span id="ideal-overshoot">5.8%</span><small>From rest, without stops</small></dd></div></dl>
<div class="trace-heading"><span id="trace-label">Last 3 seconds of simulated motion</span><div class="trace-keys"><span>Position</span><span>Target</span></div></div>
<svg class="trace" viewBox="0 0 600 91" role="img" aria-labelledby="trace-description"><desc id="trace-description">The last three seconds of simulated drawer position and its target. Solid is position; dashed is target. The numeric readouts above show the current values.</desc><g fill="none" stroke="var(--pg-hairline)" stroke-width=".7"><path d="M46 24.1H586M46 56.9H586M46 11V70M586 11V70"/></g><g fill="currentColor" font-size="10.5"><text x="6" y="27">100%</text><text x="20" y="60">0%</text><text x="46" y="86">3 s ago</text><text x="568" y="86">now</text></g><polyline id="target-trace" points="" fill="none" stroke="var(--pg-meta)" stroke-width="1.2" stroke-dasharray="4 4"/><polyline id="motion-trace" points="" fill="none" stroke="var(--pg-ink)" stroke-width="1.6"/></svg>
<p class="try-this"><strong>Try three small experiments.</strong> Replay Gentle, then Crisp to compare arrival. Try Bouncy and watch the overshoot. Finally, press Close while it is opening: a responsive interface changes its destination immediately while keeping its current momentum.</p>
<details><summary>What the rig is teaching</summary><p>The model is x″ = k(target − x) − cx′ with mass normalized to 1 and closed-to-open travel normalized to 1. Stiffness k has units s⁻²; damping c has units s⁻¹. The damping ratio is ζ = c / (2√k). Below 1, a release can oscillate; at 1, a release from rest reaches a stationary target without overshooting as quickly as a critically damped spring allows. Above 1, it settles more slowly. Interrupting a moving spring can produce a different response.</p><p>The physical drawer and product panel use one simulated position. The target index and adjustment knobs show the controller's settings; the opposed coils illustrate the effective spring's displacement. Geometry is illustrative. Travel stops at −40% and 140% contain extreme settings, so observed overshoot can be smaller than the ideal, unstopped prediction. Pointer dragging is constrained to 0–100%. On release, measured pointer velocity is retained; holding still first removes it. Presets restart a comparison from closed. Open, Close and parameter changes preserve current position and velocity.</p><p>Reduced motion jumps to resting positions, while the damping ratio and ideal step overshoot still explain the chosen settings. Motion pauses offscreen and in hidden tabs. Saved copies restore settings and the requested resting position, without recording animation frames.</p><p><a href="https://openstax.org/books/university-physics-volume-1/pages/15-5-damped-oscillations" target="_blank" rel="noreferrer">Model reference: OpenStax, damped oscillations</a></p></details>
<footer><a href="https://skills.wheresryan.sh/anatomy" target="_blank" rel="noreferrer">Drawing kit: Anatomy by Ryan</a><a href="https://x.com/thebuggeddev/status/2108720133422395590?s=20" target="_blank" rel="noreferrer">Learning-demo inspiration: The Bugged Dev</a></footer>
<p class="sr-only" id="status" aria-live="polite"></p>
</section>
<script>${script}</script>`;
  if (html.length > 400_000) throw new Error('Motion rig exceeds the Playgrounds HTML limit.');
  return { title: 'Interface motion rig · Anatomy', width: 820, html };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [flag, output, ...extra] = process.argv.slice(2);
  if (flag !== '--out' || !output || extra.length) throw new Error('Usage: node build.mjs --out <new payload.json>');
  const payload = await createPayload();
  writeFileSync(resolve(output), JSON.stringify(payload) + '\n', { flag: 'wx' });
  console.log(`Wrote ${resolve(output)} (${payload.html.length} HTML characters).`);
}
