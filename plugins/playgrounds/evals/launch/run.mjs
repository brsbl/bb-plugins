#!/usr/bin/env node
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkControls } from './controls.mjs';
import { hasInk } from './pixels.mjs';
import { failureScore, providerSummary, resumeMismatch } from './metrics.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const prompts = JSON.parse(readFileSync(join(here, 'prompts.json'), 'utf8'));
const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const key = process.argv[i];
  if (!key.startsWith('--') || !process.argv[i+1] || process.argv[i+1].startsWith('--')) throw new Error(`Expected --option value: ${key}`);
  args[key.slice(2)] = process.argv[++i];
}
for (const key of ['url','host','out','label','plugin-root']) if (!args[key]) throw new Error(`Missing --${key}`);
const base = new URL(args.url);
if (!['127.0.0.1','localhost','[::1]'].includes(base.hostname)) throw new Error('Use a loopback isolated dev bb; production URLs are refused.');
const out = resolve(args.out), pluginRoot = resolve(args['plugin-root']);
const drivePath = join(pluginRoot, 'skills/how-it-works/scripts/drive.mjs');
if (!existsSync(drivePath)) throw new Error(`No bundled driver: ${drivePath}`);
const capMs = Number(args['cap-minutes'] || 15) * 60_000;
if (!(capMs > 0 && capMs <= 900_000)) throw new Error('Cap must be >0 and <=15 minutes');
const providers = (args.providers || 'claude-code,codex').split(',');
const selected = prompts.filter(p => !args.only || args.only.split(',').includes(p.id));
if (!selected.length) throw new Error('No prompt matched --only');
mkdirSync(out, { recursive: true });
mkdirSync(join(out, '.tmp'), { recursive: true });
const manifestPath = join(out, 'manifest.json');
const commit = args.commit || (() => { try { return execFileSync('git', ['-C', pluginRoot, 'rev-parse', 'HEAD'], {encoding:'utf8'}).trim(); } catch { return 'unverified'; } })();
const manifest = { label: args.label, url: base.origin, host: args.host, pluginRoot, commit, capMs,
  prompts, providers, modelSelection: 'omitted: default for each provider in fresh Personal project',
  concurrency: 1, timing: 'HTTP prompt send until loaded card is visible in real thread DOM; polling resolution 150 ms, screenshot corroboration',
  createdAt: new Date().toISOString() };
if (existsSync(manifestPath)) {
  const old = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const mismatch = resumeMismatch(old, manifest);
  if (mismatch) throw new Error(`Cannot resume changed ${mismatch}; use another output directory`);
} else writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

async function api(path, body, method = body === undefined ? 'GET' : 'POST') {
  const response = await fetch(new URL(`/api/v1${path}`, base), {
    method, headers: { 'content-type':'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${(await response.text()).slice(0, 500)}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
function save(path, value) {
  writeFileSync(`${path}.tmp`, JSON.stringify(value, null, 2));
  renameSync(`${path}.tmp`, path);
}
function rowsIn(value) {
  const rows = value?.rows || [];
  return rows.flatMap(row => [row, ...rowsIn({ rows: row.children || row.childRows || [] })]);
}
function questionEvidence(timeline, interactions) {
  const assistant = rowsIn(timeline).filter(r => r.role === 'assistant');
  const textQuestions = assistant.flatMap(row => {
    const clean = (row.text || '').replace(/```[\s\S]*?```/g, '').replace(/::[^\n]+/g, '');
    return (clean.match(/[^.!\n]*\?/g) || []).map(text => ({ rowId: row.id, text: text.trim(),
      likely: /\b(would you|could you|can you|do you|you want|you prefer|should I|which (?:one|version|kind|type|level)|what (?:kind|type|level)|before I|shall I)\b/i.test(text) }));
  });
  const list = Array.isArray(interactions) ? interactions : interactions?.interactions || [];
  const structured = list.filter(i => /question/i.test(i.payload?.kind || i.kind || i.type || ''));
  // Unclassified question marks are kept for explicit human adjudication. They
  // cannot silently turn into a zero-question launch pass.
  return { structured, textQuestions, count: structured.length + textQuestions.filter(q => q.likely).length,
    needsReview: textQuestions.some(q => !q.likely) };
}
function monitor(threadId) {
  const visible = el => {
    const r = el.getBoundingClientRect();
    return r.width > 80 && r.height > 40 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(el).visibility !== 'hidden';
  };
  const loaded = new WeakSet();
  window.__launch = { proof: null, progress: [], errors: [], terminal: false };
  document.addEventListener('load', event => { if (event.target?.tagName === 'IFRAME' && event.target.src) loaded.add(event.target); }, true);
  setInterval(() => {
    if (window.__launch.proof) return;
    const frame = document.querySelector('.pg-host .pg-widget iframe');
    const card = frame || document.querySelector('.pg-host .pg-answer:not([role="status"]):not(.pg-error)');
    if (!card) return;
    card.scrollIntoView({block:'center'});
    if (!visible(card) || (frame && !loaded.has(frame))) return;
    card.dataset.launchCard = 'visible';
    window.__launch.proof = { at: Date.now(), kind: frame ? 'html' : 'document', target: frame?.src || location.href,
      width: card.getBoundingClientRect().width, height: card.getBoundingClientRect().height };
  }, 150);
  const flatten = rows => rows.flatMap(row => [row, ...flatten(row.children || row.childRows || [])]);
  const normalize = text => text.replace(/[*_`#\[\]]/g, '').replace(/\s+/g, ' ').trim();
  setInterval(async () => {
    if (window.__launch.proof) return;
    try {
      const response = await fetch(`/api/v1/threads/${threadId}/timeline`);
      if (!response.ok) throw new Error(`timeline ${response.status}`);
      const timeline = await response.json();
      for (const row of flatten(timeline.rows || [])) if (row.role === 'assistant' && row.text?.trim()) {
        const needle = normalize(row.text).slice(0, 32);
        const elements = [...document.querySelectorAll('[data-message-column]')];
        const el = elements.find(el => normalize(el.innerText).includes(needle));
        if (el && el.getBoundingClientRect().height > 0 && el.getBoundingClientRect().bottom > 0 && el.getBoundingClientRect().top < innerHeight && !window.__launch.progress.some(p => p.rowId === row.id))
          window.__launch.progress.push({ rowId: row.id, at: Date.now(), text: row.text });
      }
      const thread = await (await fetch(`/api/v1/threads/${threadId}`)).json();
      if (['idle','error'].includes(thread.status) && flatten(timeline.rows || []).some(row => row.role === 'assistant')) window.__launch.terminal = true;
    } catch (error) { window.__launch.errors.push(String(error)); }
  }, 1500);
}

async function drive(target, actions, stem, width = 1280, { preload, timeout = 240_000 } = {}) {
  writeFileSync(`${stem}.actions.json`, JSON.stringify(actions, null, 2));
  const command = [drivePath, target, '--actions', `${stem}.actions.json`, '--width', String(width), '--height', '1100', '--reduced'];
  if (preload) command.push('--preload', preload);
  const child = spawn(process.execPath, command, { detached: true, env: { ...process.env, TMPDIR: join(out, '.tmp') }, stdio: ['ignore','pipe','pipe'] });
  writeFileSync(`${stem}.pid`, String(child.pid));
  let log = '';
  child.stdout.on('data', chunk => { log += chunk; });
  child.stderr.on('data', chunk => { log += chunk; });
  const kill = () => { try { process.kill(-child.pid, 'SIGTERM'); } catch {} };
  const timer = setTimeout(kill, timeout);
  const onSignal = () => kill();
  process.once('SIGTERM', onSignal); process.once('SIGINT', onSignal);
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => resolve(code ?? 124)); });
  clearTimeout(timer); process.removeListener('SIGTERM', onSignal); process.removeListener('SIGINT', onSignal);
  writeFileSync(`${stem}.log`, log);
  const evals = log.split('\n').filter(line => line.startsWith('eval: ')).flatMap(line => { try { return [JSON.parse(line.slice(6))]; } catch { return []; } });
  return { code, evals, log };
}
function summarize() {
  const results = providers.map(provider => {
    const all = prompts.map(p => {
      const path = join(out, provider, p.id, 'result.json');
      return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
    });
    return providerSummary(provider, all);
  });
  save(join(out,'summary.json'), { label: args.label, commit, updatedAt: new Date().toISOString(), providers: results });
  writeFileSync(join(out,'summary.md'), `# ${args.label}\n\nSource: ${commit}. Cap: ${capMs/60000} minutes. Fresh Personal threads; default models.\n\n` +
    '| Provider | Completed | Median | p90 | All controls live | Clarifying questions | Question reviews | Progress | Gate |\n|---|---:|---:|---:|---:|---:|---:|---:|---|\n' +
    results.map(r => `| ${r.provider} | ${r.completed}/20 | ${r.medianMs === null ? 'pending' : (r.medianMs/60000).toFixed(2)+' min'} | ${r.p90Ms === null ? 'pending' : (r.p90Ms/60000).toFixed(2)+' min'} | ${r.liveCards}/20 | ${r.clarifyingQuestions} | ${r.questionReviewsNeeded} | ${r.progressShown}/20 | ${r.pass ? 'PASS' : r.complete ? 'FAIL' : 'INCOMPLETE'} |`).join('\n') +
    '\n\nMedian uses the middle pair; p90 uses nearest rank. Every missing card and capped run is scored at the cap, including early failures. A visible card with failed controls retains its measured time and fails control quality. Partial runs do not produce launch percentiles. Review question evidence before declaring zero clarifications.\n');
}

// Fail infrastructure preflight before any scored prompt is sent. The fixture
// checks the driver, real input dispatch, masking, image decoding, and output diff.
const defaultModels = new Map();
const preflightDir = join(out,'preflight'); mkdirSync(preflightDir,{recursive:true});
await api('/projects/proj_personal');
const plugins = await api('/plugins'); save(join(preflightDir,'plugins.json'),plugins);
if (!JSON.stringify(plugins).includes('playgrounds')) throw new Error('Preflight: Playgrounds is not installed');
for (const provider of providers) {
  const options = await api(`/system/execution-options?hostId=${encodeURIComponent(args.host)}&projectId=proj_personal&providerId=${encodeURIComponent(provider)}`);
  save(join(preflightDir,`${provider}-models.json`),options);
  if (options.modelLoadError || !options.models?.some(m => m.isDefault)) throw new Error(`Preflight: no usable default model for ${provider}`);
  defaultModels.set(provider,options.models.find(m => m.isDefault).model);
}
const fixture = join(preflightDir,'fixture.html');
writeFileSync(fixture, '<!doctype html><html><body style="margin:16px;width:300px;height:260px;background:white;color:black"><button onclick="document.querySelector(\'output\').textContent=++window.count;document.querySelector(\'svg rect\').setAttribute(\'width\',100+window.count*80)">Change output</button><output style="display:block;font-size:32px">0</output><svg width="280" height="100"><rect width="100" height="90" fill="blue"/></svg><script>window.count=0</script></body></html>');
const fixtureResult = await checkControls({target:fixture,width:480,dir:preflightDir,drive});
if (!fixtureResult.pass) throw new Error(`Preflight: browser/control driver failed; see ${preflightDir}/controls.json`);
const ui = await drive(base.href,[['until','Boolean(document.querySelector("#root")?.children.length)',20_000],['eval','({ready:Boolean(document.querySelector("#root")?.children.length),text:document.body.innerText.slice(0,300)})'],['shot',join(preflightDir,'bb.png'),'body']],join(preflightDir,'ui'),1280);
if (ui.code || !ui.evals.some(v => v?.ready) || !hasInk(join(preflightDir,'bb.png'))) throw new Error('Preflight: dev bb UI did not render');

for (const provider of providers) for (const prompt of selected) {
  const dir = join(out,provider,prompt.id), resultPath = join(dir,'result.json');
  mkdirSync(dir,{recursive:true});
  if (existsSync(resultPath)) { summarize(); continue; }
  const inflightPath = join(dir,'inflight.json');
  if (existsSync(inflightPath)) {
    const interrupted = JSON.parse(readFileSync(inflightPath,'utf8'));
    if (interrupted.threadId) await api(`/threads/${interrupted.threadId}/stop`,{}).catch(() => {});
    save(resultPath, { ...interrupted, pass:false, cardVisible:false, scoreMs:capMs, error:'Runner interrupted: counted as capped failure. Use a new output directory for an independent rerun.' });
    summarize(); continue;
  }
  const result = { provider, promptId:prompt.id, prompt:prompt.prompt, label:args.label, sentAt:Date.now(), pass:false, cardVisible:false, scoreMs:capMs };
  save(inflightPath,result);
  console.log(`${new Date().toISOString()} ${provider}/${prompt.id}: sending`);
  try {
    const thread = await api('/threads', { projectId:'proj_personal', providerId:provider, origin:'app',
      input:[{type:'text',text:prompt.prompt}], environment:{type:'host',hostId:args.host,workspace:{type:'personal'}} });
    result.threadId = thread.id;
    result.actualProvider = thread.providerId;
    result.environmentId = thread.environmentId;
    save(inflightPath,result);
    const threadInfo = await api(`/threads/${thread.id}?include=environment`);
    save(join(dir,'thread.json'),threadInfo);
    const defaults = await api(`/threads/${thread.id}/default-execution-options`);
    save(join(dir,'execution-options.json'),defaults);
    result.model = defaults?.model || null;
    result.catalogDefaultModel = defaultModels.get(provider);
    if (thread.providerId !== provider || !result.model) throw new Error('Actual provider/model could not be verified');
    if (result.model !== result.catalogDefaultModel) throw new Error('Personal remembered a non-default model; reset the isolated instance before measuring');
    if (threadInfo.projectId !== 'proj_personal') throw new Error('Thread was not created in Personal');
    const preload = join(dir,'monitor.js');
    writeFileSync(preload, `(${monitor.toString()})(${JSON.stringify(thread.id)});`);
    const remaining = Math.max(1, capMs - (Date.now()-result.sentAt));
    const visible = await drive(new URL(`/threads/${thread.id}`,base).href,
      [['until','window.__launch?.proof || window.__launch?.terminal',remaining], ['eval','window.__launch'], ['shot',join(dir,'visible.png'),'[data-launch-card="visible"]']],
      join(dir,'visible'),prompt.width || 1280,{preload,timeout:remaining+20_000});
    const measurement = visible.evals.find(v => v && Object.hasOwn(v,'proof'));
    const proof = measurement?.proof;
    result.progress = measurement?.progress || [];
    result.browserErrors = measurement?.errors || [];
    result.proof = proof;
    result.wallMs = Date.now()-result.sentAt;
    result.cardVisible = Boolean(proof && proof.at <= result.sentAt+capMs && visible.code === 0 && hasInk(join(dir,'visible.png')));
    result.visibleMs = result.cardVisible ? Math.max(0,proof.at-result.sentAt) : null;
    result.scoreMs = failureScore(result.visibleMs,capMs);
    const timeline = await api(`/threads/${thread.id}/timeline`);
    const interactions = await api(`/threads/${thread.id}/interactions`);
    save(join(dir,'timeline.json'),timeline);
    save(join(dir,'interactions.json'),interactions);
    result.questions = questionEvidence(timeline,interactions);
    await api(`/threads/${thread.id}/stop`,{});
    if (result.cardVisible) {
      const widths = prompt.id === 'narrow-toggle' ? [360,390,480] : [Math.round(proof.width)];
      const views = [];
      for (const width of widths) {
        const viewDir = join(dir,`width-${width}`); mkdirSync(viewDir,{recursive:true});
        views.push({width,...await checkControls({ target:proof.target, scope:proof.kind === 'html' ? 'body' : '.pg-host .pg-answer',width,dir:viewDir,drive })});
      }
      result.controls = {pass:views.every(view => view.pass),views,reason:views.every(view => view.pass) ? 'All controls live at every width' : 'A control failed or needs review'};
    }
    else result.error = 'No loaded, visibly rendered card before cap (or browser proof failed)';
    result.pass = Boolean(result.cardVisible && result.controls?.pass && result.questions.count === 0 && !result.questions.needsReview && result.progress.length > 0);
  } catch (error) { result.error = String(error); }
  finally {
    if (result.threadId) await api(`/threads/${result.threadId}/stop`,{}).catch(error => { result.stopError = String(error); });
    result.finishedAt = Date.now();
    result.wallMs ??= result.finishedAt-result.sentAt;
    save(resultPath,result); summarize();
    console.log(`${provider}/${prompt.id}: ${result.pass ? 'PASS' : 'FAIL'} ${(result.scoreMs/60000).toFixed(2)} min; ${result.error || result.controls?.reason || ''}`);
  }
}
console.log(join(out,'summary.md'));
