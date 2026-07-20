# Omega banner redesign progress

STEP 0 is complete. The workspace is `/Users/brsbl/.bb/personal-workspaces/bb-plugin-omega`, and the required Node v22.22.0 binary reports `arm64`.

The local design-doctrine service reported that bb was not running, and the Pattern Atlas CLI was unavailable. The named bb workflow components remain the implementation reference.

Vendor step 1 is complete. `vendor/workflow-progress.tsx` is an exact copy of bb's shared workflow-progress source.

Vendor step 2 is complete. `vendor/activity-row-styles.ts` is an exact copy of bb's shared activity-row styles.

Vendor step 3 is complete. `vendor/cn.ts` provides the local `clsx` + `tailwind-merge` helper.

Vendor step 4 is complete. `vendor/icon.tsx` maps the workflow icon names to lucide-react, including an animated `Loader2` spinner.

Vendor step 5 is complete. Both vendored sources now import the local `cn` helper; workflow-progress keeps its local icon import.

The server step is complete. Agent RPC rows now include token totals from result usage and terminal-or-live `durationMs`, with the zod schema updated and run selection unchanged.

The app step is complete. The preserved portal/scoping/realtime shell now renders a bb-style workflow header, phase strip, capped `WorkflowProgress` tree, uniform provider/model/effort metadata, live duration, and explicit running/queued/done/failed counts.

The typecheck step ran under arm64 Node. Its only diagnostic is the brief-allowed cosmetic `react-dom` declaration lookup; the redesigned app, server, and vendored workflow code produced no diagnostics.

The build step is complete under arm64 Node. `bb plugin build` emitted server/app artifacts and CSS; the bundled app contains the phase-strip implementation plus `metadata`, `xhigh`, worker-count, and `gpt-5.6-sol` paths.

The reload step is complete. `bb plugin reload omega` and `bb plugin list` both report `omega@0.1.0 running`, with the watch service running and no omega error.

The computer-use verification step is complete. I saw the live card collapsed and expanded in bb: the header shows 117 workers, `codex · gpt-5.6-sol`, 5 running, 110 queued, 2 done, 0 failed, elapsed time, and the phase strip; expanded rows show status icons, `codex · gpt-5.6-sol · xhigh`, and aligned durations inside a bounded scroll area. The expanded proof is saved at `/tmp/omega-redesign-proof.png`.

The live-headline implementation is complete. The banner now derives an A–J acceptance section from the earliest running agent in workflow order, falls back to the most recently started agent when none are running, and falls back to the workflow name when no section can be derived. All other banner rendering and behavior is unchanged.

The live-headline build and reload are complete under arm64 Node. The bundle contains the acceptance headline and all ten section labels; `omega@0.1.0` and its watch service report `running` with no omega error.

The live-headline computer-use verification is complete. In the target bb thread, the rendered accessibility tree showed `Acceptance · section H — CLI + converter`; the same card retained 120 workers, `codex · gpt-5.6-sol`, 5 running, 110 queued, 5 done, 0 failed, elapsed time, and the phase strip.

The plugin-icon update is complete. The live banner uses Huge Icons' `WorkflowCircle03Icon`, and the light/dark logo assets use the same four-path glyph. The arm64 build and reload succeeded, and the rendered icon was visually verified in bb.

The header-hierarchy pass is complete. The icon is followed by the new `Running workflow` preface and live section on the primary row; elapsed time remains at the far edge. Worker count, provider/model, and running/queued/done/failed counts now form a quieter secondary row with the running count emphasized. The phase strip and expanded workflow tree are unchanged.

The hierarchy build and reload are complete under arm64 Node. `bb plugin build` succeeded and `omega@0.1.0` reports `running`; the only standalone typecheck diagnostic remains the pre-existing missing `react-dom` declaration.

The hierarchy computer-use verification is complete. The rendered banner showed `Running workflow · section H — CLI + converter`, 123 workers, `codex · gpt-5.6-sol`, 5 running, 110 queued, 8 done, 0 failed, elapsed time, and the phase strip without truncating the primary label.

The expanded-row enrichment is complete. Every agent line now shows its acceptance section description and state glyph alongside the existing provider, model, `xhigh`, and duration. Active and terminal rows also surface growing log size and token usage when available; untouched queued rows omit meaningless `0s`.

The expanded-row build and reload are complete under arm64 Node. `bb plugin build` succeeded and `omega@0.1.0` reports `running`; the only standalone typecheck diagnostic remains the pre-existing missing `react-dom` declaration.

The expanded-row computer-use verification is complete. The live card showed rows such as `H-17 · CLI + converter · Running · codex · gpt-5.6-sol · xhigh · 101 KB log · 5m47s`, while queued rows showed their section and `Queued` state without fake duration. Row height, phase grouping, scroll bounds, and visible worker density remained intact.

The final type hierarchy is complete. The entire card now uses bb's sans UI family: 14px for the primary workflow context and 12px for summary, phase, task, status, provider/model, effort, log size, tokens, and duration. Weight and semantic color provide hierarchy; elapsed and row durations use the same type treatment with tabular numerals for alignment.

The typography build and reload are complete under arm64 Node. `bb plugin build` succeeded and `omega@0.1.0` reports `running`; the only standalone typecheck diagnostic remains the pre-existing missing `react-dom` declaration.

The typography computer-use verification is complete. In the expanded live card I saw `Running workflow · section H — CLI + converter`, 132 workers, `codex · gpt-5.6-sol`, 5 running, 110 queued, 17 done, and 0 failed. A visible active row read `H-22 · CLI + converter · Running · codex · gpt-5.6-sol · xhigh · 237 KB log · 7m16s`; the primary header, secondary summary, phase heading, task meaning, and technical metadata were distinctly ranked without crowding or truncation.

The live progress-strip pass is complete. Each Build/Verify segment is now a real track whose fill is computed from the full workflow agent set rather than the 16-row detail cap. The fill grows as agents settle, intensifies as completion advances, turns green when complete, turns red when failures are present, and carries a restrained moving highlight while agents are running; reduced-motion users receive a static fill.

The progress-strip build and reload are complete under arm64 Node. `bb plugin build` emitted the final server/app artifacts, and `bb plugin list` reports `omega@0.1.0 running` with its watch service running.

Before Computer Use was stopped at the user's request, I saw the expanded live card with the unified sans typography and matched duration styling. The Build track was partially filled red for the live failed state, while the untouched Verify track remained gray; the final widened shimmer highlight was built and reloaded afterward, with no further UI capture performed.

The expanded-row status-icon pass is complete. The leading spinner, failure X, queued circle, and terminal-state glyphs are now the sole visible per-agent status signals; the redundant `Running`, `Failed`, and `Queued` strings were removed from the metadata column. Each state name remains present as screen-reader-only text, and the collapsed header's status counts are unchanged.

The status-icon build is complete under arm64 Node. The typecheck produced no new diagnostic, and `bb plugin build` emitted the server/app artifacts and CSS successfully.

Live reload is pending because bb is currently offline: doctrine, Pattern Atlas, reload, and status commands could not reach the app. Per the user's instruction, Computer Use was not invoked.

The relocation bug is reproduced and captured. In the pre-fix collapsed state, Omega was visually fused to the composer; after expanding it, the composer left a large unexplained white region below the prompt box. bb's native `Running background command` card remained a separate rounded item in the prompt stack. The before captures are `/Users/brsbl/.bb/thread-storage/thr_urpnukd4ns/omega-relocation-before-collapsed.png` and `/Users/brsbl/.bb/thread-storage/thr_urpnukd4ns/omega-relocation-before-expanded.png`.

The prompt-stack relocation is implemented. The thread-scoped portal holder is now inserted as the composer's previous sibling with an 8px bottom gap, outside bb's composer-managed height. The Omega root now uses bb's standalone prompt-stack chrome: full `rounded-lg` corners, `border-border`, and `bg-surface-raised-solid`; composer-derived top-radius and border-bottom-only styling were removed. Workflow content and behavior are otherwise unchanged.

The relocation build and reload are complete under arm64 Node v22.22.0. `bb plugin build` emitted the app, server, metadata, and CSS artifacts; `bb plugin reload omega` succeeded, and `bb plugin list` reports `omega@0.1.0 running` with its watch service active. The only standalone typecheck diagnostic remains the known missing `react-dom` declaration.

The first after-state check found and fixed a host-reconciliation edge case. The standalone card initially appeared with the correct rounded prompt-stack spacing, then bb's next composer render removed the foreign sibling node. The same thread-scoped previous-sibling mount now observes only its prompt-stack parent and immediately restores the holder if reconciliation evicts it; placement and banner content are unchanged.

The reconciliation-safe relocation is built and reloaded. The current bb app bundle was missing its optional `@esbuild/darwin-arm64` binary, so the build used a temporary matching esbuild 0.28.1 arm64 binary via `ESBUILD_BINARY_PATH`; no x64 fallback or app-bundle modification was used. The build emitted all artifacts, and `omega@0.1.0` is running with its watch service active.

The refreshed-host scoping issue is fixed. Chrome confirmed that Omega's new frontend resources and pinned `threadId` setting loaded, but the current composer accessory did not receive a matching `threadId` prop and returned before mounting. Scoping now accepts either the SDK prop or the current `/threads/:id` route, while still requiring the configured pinned thread id; no other thread can render the card.

The holder recovery now handles full composer replacement, not only child reconciliation. A live expanded check showed bb can replace the composer or stack wrapper while retaining the accessory, leaving an observer attached to stale DOM. The mount now re-resolves the composer from the thread-scoped accessory after coalesced document subtree changes and re-inserts the same holder immediately before the current composer.

The true composer target is now identified semantically. Live DOM geometry showed the earlier walk stopped at an inner `min-h-0 overflow-hidden` editor wrapper inside bb's animated prompt form, so the holder still participated in composer sizing. The mount now prefers the enclosing rounded `<form class="group/promptbox …">` and uses the first input-containing ancestor only as a compatibility fallback; the holder is therefore a sibling of the actual composer form.

The remaining overflow source is fixed at the prompt-stack level. Expanded metrics showed the card still lived inside bb's constrained `relative z-20` composer unit: that wrapper was 536px tall but had 1,012px of scroll content, and the 476px overflow became the blank area below the prompt. The mount now climbs from the prompt form to the direct composer unit under the enclosing `.space-y-2` layout and inserts the holder before that unit. The stack supplies its native 8px gap, so no duplicate inline margin is added there.

The holder now uses bb's actual native context-card stack. A follow-up metric check showed the outer sticky shell still retained stale overflow when Omega was merely adjacent to the inner card stack. The mount now appends Omega to the existing inner `.space-y-2` container that owns bb's native `Running background command` and related cards, falling back to the outer previous-sibling placement only when that native stack is unavailable.

The disclosure now preserves the prompt stack's bottom anchor across expansion and collapse. bb's sticky thread shell continued shifting upward by the card's expansion delta even after Omega moved into the native card stack. The toggle records the prompt box's bottom gap within the thread scroll viewport, renders the new state, and restores that same gap after immediate and settled layout, preventing the host's stale sticky overflow from appearing as white space below the composer.

The final Computer Use verification passes in the full-size bb viewport. Before the fix, expanding Omega shifted the composer upward and left a large blank region beneath it. After the fix, the expanded card grows upward inside bb's native prompt stack, the prompt form and Local/status row remain pinned at the bottom, and no added white space appears below the composer. The rendered headline was `Running workflow · section J — Deliverables`, with 157 workers, `codex · gpt-5.6-sol`, 5 running, 108 queued, 42 done, and 2 failed; Build/Verify phases and the bounded agent tree remained visible. Final captures are `/Users/brsbl/.bb/thread-storage/thr_urpnukd4ns/omega-relocation-after-collapsed.png` and `/Users/brsbl/.bb/thread-storage/thr_urpnukd4ns/omega-relocation-after-expanded.png`.
