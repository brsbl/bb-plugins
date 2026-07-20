# Brief — redesign the omega banner to MATCH bb's workflow UI and be scannable

You are a codex worker. Your working dir IS this plugin: `/Users/brsbl/.bb/personal-workspaces/bb-plugin-omega`.
STEP 0 FIRST: `cd /Users/brsbl/.bb/personal-workspaces/bb-plugin-omega` and
`export PATH="$HOME/.nvm/versions/node/v22.22.0/bin:$HOME/.local/bin:$PATH"` (node -p process.arch → arm64).
The plugin files live at the ROOT (`app.tsx`, `server.ts`, `react-dom.d.ts`) — there is NO `src/` dir, so
vendored files go in a new root-level `vendor/` dir. Work efficiently: read ONLY the files named below —
do NOT explore the repo widely (that burns tokens and kills runs). Persist a short `PROGRESS.md` here after
each numbered step so progress survives a restart.

Icon availability CONFIRMED in this plugin's `lucide-react@1.25.0`: Check, X, ChevronDown, Circle,
CircleCheck, Pause, Loader2, Workflow all resolve — use them directly (Spinner→Loader2).

## Goal
The banner above this thread's prompt box currently lists individual rubric rows (H-05, H-04 …) with byte
sizes. It does NOT look like how bb renders workflows, and you cannot tell **how many workers, their type
(provider/model), or aggregate status** at a glance. Redesign it to (a) reuse bb's workflow visual language
and (b) be SCANNABLE: worker count, worker TYPE (provider/model — here `codex · gpt-5.6-sol`), and status
(running / queued / done / failed).

## Reference files in ~/Code/bb (READ these, do not modify them)
- `~/Code/bb/apps/app/src/components/promptbox/banner/ThreadWorkflowCard.tsx` — bb's workflow card header
  layout to mirror (icon · name · phase strip · `N/M agents` · live duration · rotating ChevronDown).
- `~/Code/bb/packages/shared-ui/src/components/ui/workflow-progress.tsx` — the components to VENDOR
  (`WorkflowProgress`, `WorkflowPhaseStrip`, types `WorkflowProgressSnapshot`/`WorkflowProgressAgent`).
- `~/Code/bb/packages/shared-ui/src/components/ui/activity-row-styles.ts` — its dependency (pure, 70 lines).
- `~/Code/bb/plugins/workflows/src/app.tsx` — THE template: a plugin that builds a snapshot and renders
  these. See ~lines 195-214 (agent mapping incl. `metadata: [provider, shortModelName(model), reasoningLevel]`)
  and ~438-616 (header + `WorkflowPhaseStrip` + `WorkflowProgress`).

## Why vendor (not import): a STANDALONE plugin cannot import `@bb/shared-ui`
`bb plugin build` only shims react + radix/sonner/vaul; everything else bundles per-plugin. So copy the
source in and bundle it:
1. Copy `workflow-progress.tsx` → `vendor/workflow-progress.tsx`.
2. Copy `activity-row-styles.ts` → `vendor/activity-row-styles.ts`.
3. Create `vendor/cn.ts`: `import {clsx} from "clsx"; import {twMerge} from "tailwind-merge"; export function cn(...a:any[]){return twMerge(clsx(a));}` (clsx + tailwind-merge are already in package.json).
4. Create `vendor/icon.tsx`: an `Icon({name,className,...rest})` mapping bb's icon names to lucide-react —
   Check→Check, ChevronDown→ChevronDown, Circle→Circle, CircleCheck→CircleCheck, Pause→Pause,
   Spinner→Loader2 (ensure `animate-spin` is in its className), X→X, Workflow→Workflow. Match the call shape
   `<Icon name="Spinner" className="…" aria-hidden="true" />`.
5. In the two copied files fix imports: `./icon` stays `./icon`; `../../lib/utils` → `./cn`.

## Server change (`server.ts`) — give each agent what the snapshot needs
The `runs` RPC already returns agents `{index,label,phase,provider,model,state,startedAt,bytes}`. ADD two
fields per agent, read from the journal you already parse: `tokens` (result `usage.inputTokens +
usage.outputTokens`, 0 if none) and `durationMs` (result `durationMs` for terminal agents; else
`Date.now() - startedAt` for running). Update the zod AgentSchema accordingly. Change nothing else in the
run-selection logic.

## App change (`app.tsx`) — render bb's components
Rewrite the banner body (keep the OUTER behaviors intact — see "preserve" below). Build a
`WorkflowProgressSnapshot`:
- phases: `[{index:0,title:'Build'},{index:1,title:'Verify'}]`
- agents: map each server agent to a `WorkflowProgressAgent`:
  - `label`: strip the `build:`/`verify:` prefix → the row (e.g. `H-05`)
  - `state`: running→`'running'`, queued→`'queued'`, completed→`'done'`, failed→`'failed'`
  - `model`: `agent.model || 'gpt-5.6-sol'`
  - `metadata: [agent.provider || 'codex', agent.model || 'gpt-5.6-sol', 'xhigh']`  ← the scannable TYPE
  - `phaseIndex`: `agent.phase === 'Verify' ? 1 : 0`
  - `attempt:1, cached:false, lastProgressAt: agent.startedAt || Date.now(), tokens: agent.tokens, durationMs: agent.durationMs`
- Header (mirror ThreadWorkflowCard): Workflow icon · workflow name · `<WorkflowPhaseStrip progress settled={false}/>`
  · a SCANNABLE summary — running/queued counts AND the uniform worker type (`codex · gpt-5.6-sol`) · live
  duration · `ChevronDown` that rotates when open.
- Expanded: `<WorkflowProgress collapsiblePhases progress={snapshot} settled={false} />`.

### PRESERVE (do not regress these — they already work):
- The flush, borderless placement as the FIRST child INSIDE this thread's composer box (the `createPortal`
  + `useAboveComposerTarget` walk-up + top-corner-radius match).
- Thread-scoping: render only when `props.threadId === pinned threadId` setting.
- The 1s live re-tick and the realtime `omega` refresh.
- The `AGENT_CAP` cap so the expanded list can't grow unbounded (bb caps + scrolls; keep a max-height scroll).

## Build + verify (ARM64 node — mandatory)
`export PATH="$HOME/.nvm/versions/node/v22.22.0/bin:$HOME/.local/bin:$PATH"` — `node -p process.arch` MUST
print `arm64` (bb plugin build needs the arm64 lightningcss binding; x64/Rosetta fails "Cannot find native
binding").
- `npx tsc --noEmit` clean (ignore only a cosmetic react-dom note if it persists).
- `bb plugin build` → emits `dist/app.js` + `dist/app.css`. Grep `dist/app.js` to confirm the workflow code
  bundled (e.g. a phase-strip class or `metadata` rendering is present).
- `bb plugin reload omega`; `bb plugin list` → `omega … running`, NO error.

## SELF-VERIFY with computer use (this is why a codex thread does this)
A live omegacode run exists (`wf_5b57d1c404b9`, ~115 rows, codex/gpt-5.6-sol), so the banner renders above
this thread's composer. Use your computer-use plugin to LOOK at the bb prompt box and confirm:
1. It reads like bb's own workflow card (phase strip; phase-grouped agent lines each with a status icon —
   spinner / check / circle; quiet muted meta; rounded, restrained).
2. It is SCANNABLE without expanding: worker count, worker TYPE (`codex · gpt-5.6-sol`), status counts.
3. Expanded, each agent line shows `codex · gpt-5.6-sol · xhigh` in the meta slot + a duration.
Iterate until it matches bb. Save proof to `/tmp/omega-redesign-proof.png` (computer use, or
`screencapture -o -l<windowId>` — window owner `bb`, title contains `Moss Collab`). Do NOT report done
until you have SEEN the rendered banner match. If computer use is unavailable, say so and use screencapture.

## Scope
Touch ONLY files under this plugin dir. Do NOT touch the acceptance harness, the rubric, `~/.omegacode`, or
`~/Code/bb`. Keep the diff focused; bb's aesthetic is quiet — don't over-build.

## Report when done
Files vendored; the server field addition; the app render approach; tsc/build/reload results; and the
self-verification outcome (what the screenshot showed: matches bb? scannable? provider/model visible?).
