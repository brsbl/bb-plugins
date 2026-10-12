import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as kit from '../kit/iso-kit.mjs';
import { kitScript } from '../scripts/inline-kit.mjs';
import { check, report } from './check.mjs';

const here = new URL('.', import.meta.url);
const skills = fileURLToPath(new URL('../../', here));
const read = (path) => readFileSync(path, 'utf8');
const escape = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const strip = (source) => source.replace(/^export (default )?/gm, '');
const kitNames = [...read(new URL('../kit/iso-kit.mjs', here)).matchAll(/^export (?:async )?(?:function\*?|const|let|class) ([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
const LIMIT = 400_000;

// components: ['product-building/flow'] resolves to <skills>/playground-product-building/components/flow.js
function component(name) {
  const [skill, file] = String(name).split('/');
  const path = join(skills, `playground-${skill}`, 'components', `${file}.js`);
  if (!skill || !file || !existsSync(path)) throw new Error(`Unknown component ${name}`);
  const css = path.replace(/\.js$/, '.css');
  return { script: read(path), style: existsSync(css) ? read(css) : '' };
}

export async function buildFigure(dir) {
  const at = (name) => join(dir, name);
  for (const name of ['figure.mjs', 'card.html', 'live.js']) if (!existsSync(at(name))) throw new Error(`Missing ${name} in ${dir}`);
  const figureSource = read(at('figure.mjs'));
  if (/^\s*import\s/m.test(figureSource)) throw new Error('figure.mjs must not import anything; the builder supplies k (the Anatomy kit) and ui.');
  const mod = await import(pathToFileURL(at('figure.mjs')).href + `?v=${Date.now()}`);
  if (!mod.meta) throw new Error('figure.mjs must export meta');
  const { meta } = mod;
  const drawn = typeof mod.draw === 'function';
  if (drawn) for (const name of ['initial', 'projection']) if (!(name in mod)) throw new Error(`figure.mjs must export ${name} when it draws an object`);
  const card = read(at('card.html'));
  let figure = '';
  if (drawn) {
    if (!card.includes('{{figure}}')) throw new Error('card.html must place the drawn figure with {{figure}}');
    const [width, height] = meta.viewBox ?? [600, 300];
    figure = `<figure class="pg-fig iso" data-theme="light" data-figure>`
      + `<figcaption class="pg-fig-head"><span>${escape(meta.fig ?? 'Fig. 1')}</span><span>${escape(meta.name ?? meta.title)}</span></figcaption>`
      + `<div class="pg-fig-body"><svg class="iso-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(meta.label ?? meta.name ?? meta.title)}">${mod.draw(kit, mod.normalize ? mod.normalize(mod.initial) : mod.initial)}</svg></div>`
      + `<div class="pg-fig-foot"><span data-hint>${escape(meta.hint ?? '')}</span><output data-readout aria-live="polite"></output></div>`
      + `</figure>`;
  }
  const parts = (meta.components ?? []).map(component);
  const styles = [drawn ? kit.ISO_CSS : '', ...parts.map((p) => p.style), existsSync(at('styles.css')) ? read(at('styles.css')) : ''].join('\n');
  const runtime = [
    read(new URL('./ui.js', here)),
    ...parts.map((p) => p.script),
    drawn ? `const k = (() => {\n${kitScript()}\nreturn { ${kitNames.join(', ')} };\n})();` : '',
    strip(figureSource),
    drawn ? [
      `const P = projection(k);`,
      `const root = document.querySelector('[data-figure]');`,
      `const figure = { root, svg: root.querySelector('svg'), readout: root.querySelector('[data-readout]'), hint: root.querySelector('[data-hint]') };`,
      `const reduced = ui.reduced;`,
      `const theme = (value) => { root.dataset.theme = value && value.scheme === 'dark' ? 'dark' : 'light'; };`,
      `theme(window.playground.theme); window.playground.onTheme(theme);`,
    ].join('\n') : '',
    read(at('live.js')),
  ].join('\n');
  const script = `(() => {\n${runtime}\n})();`.replace(/<\/script/gi, '<\\/script');
  const license = drawn ? `<!-- Anatomy drawing kit: https://github.com/wheresryan22/anatomy\n${read(new URL('../LICENSE', here)).replace(/--/g, '—')} -->\n` : '';
  const credit = drawn ? `\n<p class="pg-meta" style="margin:14px 0 0">Drawing kit: <a href="https://skills.wheresryan.sh/anatomy" target="_blank" rel="noreferrer">Anatomy by Ryan</a></p>` : '';
  const html = license
    + (styles.trim() ? `<style>${styles}</style>\n` : '')
    + card.replace('{{figure}}', figure)
    + `${credit}\n<script>${script}</script>`;
  if (html.length > LIMIT) throw new Error(`The playground is ${html.length} characters; the limit is ${LIMIT}.`);
  return { title: meta.title, width: meta.width ?? 540, html };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [dir, flag, output, ...extra] = process.argv.slice(2);
  if (!dir || flag !== '--out' || !output || extra.length) throw new Error('Usage: node figure/build.mjs <card dir> --out <payload.json>');
  const payload = await buildFigure(resolve(dir));
  writeFileSync(resolve(output), JSON.stringify(payload) + '\n');
  console.log(`Wrote ${resolve(output)} (${payload.html.length} HTML characters).`);
  const result = check(payload);
  console.log(report(result));
  if (result.errors.length) process.exitCode = 1;
}
