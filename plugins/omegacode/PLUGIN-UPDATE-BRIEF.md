# Codex worker brief — omegacode bb-plugin UI updates

You are updating an installed bb plugin. Plugin dir: `/Users/brsbl/.bb/personal-workspaces/bb-plugin-omega`
Frontend: `app.tsx` · Backend: `server.ts` · Manifest: `package.json`.

The plugin shows a banner ABOVE this thread's prompt box that mirrors omegacode run
progress (name · phases · per-agent state). It reads omegacode journals under `~/.omegacode/runs`.

## CRITICAL ENVIRONMENT GOTCHAS (each cost real time to discover)

1. **Build the app bundle with the ARM64 node, not x64.** This is an Apple M4 (arm64). The nvm
   node on the default PATH (`v22.22.1`) is an x64 build under Rosetta, and `bb plugin build` then
   fails with "Cannot find native binding" because bb ships `lightningcss-darwin-arm64`. Use:
   ```
   export PATH="$HOME/.nvm/versions/node/v22.22.0/bin:$PATH"   # arm64 — verify: node -p process.arch → arm64
   ```
   for `bb plugin build` / `bb plugin reload omega` / `npx tsc`.
2. **`branding.icon` resolves against BB's OWN icon set, NOT hugeicons.** The plugin's Greek-omega
   glyph is delivered via `branding.logo` (SVG files in `assets/`) and rendered live in the banner
   via `<HugeiconsIcon icon={AlphabetGreekIcon} />`. Do not try to name a hugeicons icon in
   `branding.icon`.
3. **A manifest change (branding/slots) needs `bb plugin install . --yes`**, not just reload.
   Frontend-only code changes need `bb plugin build` then `bb plugin reload omega`.
4. `react-dom` is runtime-shimmed by bb (not bundled) — `createPortal` is fine; keep the local
   `react-dom.d.ts` shim.

## TASKS

### 1. Pointer cursor on the collapse caret
The banner header is a `<button>` that toggles `open`. Ensure the whole clickable header uses a
pointer cursor (`cursor-pointer`), and the caret glyph specifically reads as clickable.

### 2. Make the caret match bb's own carets
Right now the caret is a literal `▸`/`▾` text glyph — that does NOT match bb. Find how BB renders
its own expand/collapse chevrons and match it. BB's frontend bundle is at
`/Applications/bb.app/Contents/Resources/app.asar.unpacked/node_modules/bb-app/app/dist/assets`.
BB uses **lucide-react** chevrons (e.g. `ChevronRight`/`ChevronDown`, or a single `ChevronDown`
that rotates). `lucide-react` is a normal bundleable dep — `npm install lucide-react` in the plugin
dir, then `import { ChevronDown } from "lucide-react"` and rotate it (or ChevronRight→ChevronDown on
open). Match BB's size (~14-16px), stroke, and muted color. Confirm the visual against a real BB
chevron in a screenshot, don't guess.

### 3. Remove the "Omega" sidebar page
`app.tsx` registers TWO slots: `composerAccessory` (the banner — KEEP) and `navPanel` (the sidebar
"Omega" page — REMOVE). Delete the `app.slots.navPanel({...})` registration and the now-unused
`OmegaPanel` component. The plugin should live ONLY above the prompt box of the thread it's used in.

### 4. Run /design, /architect, /crit on the plugin UI
These are BB skills (invoke via the bb skills system / your agent skill menu). Apply all three design
lenses to the banner UI specifically — layout, hierarchy, restraint, whether it earns its space,
whether it matches BB's composer chrome. Produce a short written critique AND apply the concrete,
safe improvements the critique surfaces (spacing, alignment, color-token use, empty/edge states).
Do not over-build; BB's aesthetic is quiet and restrained. Record the critique + what you changed
in `docs/CRIT.md` inside the plugin dir.

## VERIFY (mandatory — do not report done without this)
- `npx tsc --noEmit` clean (ignore only the cosmetic react-dom note if it persists).
- `bb plugin build` emits `dist/app.js` + `app.css`; `bb plugin reload omega` shows `omega@… running`.
- `bb plugin list` shows omega running with NO error status.
- **Screenshot proof:** the banner still lives ONLY above this thread's prompt box (bb window title
  contains 'Fable Ultracode: Moss Collab'), the sidebar no longer has an "Omega" entry, the caret is
  a real bb-style chevron with a pointer cursor. Capture the bb window with:
  ```
  screencapture -o -l<windowId> /tmp/omega-verify.png   # windowId via Quartz.CGWindowListCopyWindowInfo, owner 'bb'
  ```
  (The banner only renders when this thread's composer is visible AND an omegacode run is live —
  a `rubric-sweep` run is currently active, so it should show.)

## SCOPE
Only touch files under `/Users/brsbl/.bb/personal-workspaces/bb-plugin-omega`. Do NOT touch the
acceptance harness, the rubric, or `~/.omegacode` runs. Keep the diff tight.
