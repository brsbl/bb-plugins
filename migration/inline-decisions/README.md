# Inline Decisions migration snapshot

This directory preserves a **Ladle-only proposal**, not production UI. Do not merge this directory into the product. The existing plugin still renders inline forms.

The migration branch starts at `cf3dd87ccbdbed1de85b92633d071eec84700a67`. The plugin code at that commit is the installed 0.2.6 dogfood candidate. These saved story files are independent of its runtime bundle.

## Approval boundary

The most recent instruction is to hold bubble-up, revise-in-place and stale-flag work, and not start new UI until the lead sends the decision. A previously requested log-only prototype was already completed before that hold. Its product implementation and every currently open PR still need approval.

The prototype explores compact timeline rows for waiting, answered and failed decisions. A row opens the Decision log in a right-panel tab focused on that item. The log contains the full brief, options, inline note and submit controls, grouped by org and source thread, with age labels. A second story shows the sidebar log and a third shows a multi-decision sheet. Answering and notes only mutate story-local state. Do not treat mock dispatch, age ordering or source navigation as a finished implementation.

## Recreate the existing preview

The prototype was developed against get-bb/bb source commit `e9dafb6c0245a37c6972dffa71134d546f3d497e`, in an extracted task-local source tree. It uses real bb `ConversationMessageContent`, `ThreadSecondaryPanel`, shared UI Button/Icon and MarkdownPreview, plus this plugin's production decision components. Use that source revision to recover the same component signatures; Linux or macOS can run the web preview.

1. Copy `InlineDecisionsLog.stories.tsx` and `inline-decisions-log-prototype.css` together into `apps/app/src/components/plugin/` in the bb source checkout.
2. In `apps/app/.ladle/config.mjs`, set `stories` to `["src/components/plugin/InlineDecisionsLog.stories.tsx"]` to keep this preview bounded.
3. In `.ladle/vite.config.ts`, add the alias `@inline-decisions` pointing to the absolute `plugins/inline-action-cards` directory in this plugin checkout. Keep the bb source's other aliases and plugins. Add the plugin checkout to `server.fs.allow`; if dependencies are symlinked, also allow their actual node_modules and packages roots. This was needed to fix the initial Vite filesystem-access rejection.
4. Add a Tailwind `@source` directive in `.ladle/ladle.css` naming that same absolute plugin directory, so production component utility classes are generated.
5. From `apps/app`, launch Ladle through a persistent BB terminal: `BB_SERVER_PORT=<isolated-port> node node_modules/@ladle/react/lib/cli/cli.js serve --port 61000 --host 0.0.0.0`. The stories have no backend dependency; the old API proxy pointed to a retired isolated dev server. Do not point it to a personal production server.
6. Open these exact routes:
   - `/?story=plugins--inline-decisions--log-first--thread-and-panel&theme=light&mode=preview`
   - `/?story=plugins--inline-decisions--log-first--sidebar-log&theme=light&mode=preview`
   - `/?story=plugins--inline-decisions--log-first--decision-sheet&theme=light&mode=preview`

All fixtures are synthetic. The story's question/outcome examples are not real approvals or actions. The shared sidebar shell in the full-page story is illustrative; the right-panel shell and listed controls are real components.

## Verified prototype interactions

One bounded Chrome for Testing pass exercised:

- Waiting/answered/failed row focus into the matching log entry; answered selection switches to All.
- Inline note save with Enter, submit enabled by a choice or note, outcome and waiting count updates.
- Sheet partial submission: two selected decisions answered, one remains waiting.
- Light/dark, 390px touch mode, close panel and reopen focused failed row, no horizontal spill or runtime page errors.
- Full-window light captures at 1440x900 CSS pixels / 2880x1800 PNG; mobile self-checks at 390x844 / 780x1688.

This is prototype interaction verification, **not release QA**. Screenshots stay outside git. Their existing copies and the preview lifetime details are in the migration handoff.

## Production work already saved in this branch's ancestry

Native GitHub stack 446 remains open and draft, in this order:

| PR | Head | Base | Scope |
| --- | --- | --- | --- |
| [444](https://github.com/brsbl/bb-plugins/pull/444) | `372b9a852a7246ee69f2193e49f482323ea47675` | `main` | Preserve last measured height while an already seen timeline card/sheet reloads. |
| [445](https://github.com/brsbl/bb-plugins/pull/445) | `50c12e4509f1cd3b2d47849f3c8fc4fbfd23037c` | `bb/inline-decisions-scroll-thr_kxmba4wvva` | Contain long words, URLs, code and wide tables. |
| [447](https://github.com/brsbl/bb-plugins/pull/447) | `9945996774b53395f416df56a9323550342329fc` | `bb/inline-decisions-overflow-thr_kxmba4wvva` | Complete briefs, visible context, source-thread metadata, non-fatal CLI warning for missing context. |

The installed 0.2.6 branch `bb/inline-decisions-lifecycle-thr_kxmba4wvva` adds the superseded-card fix above #447 and has no PR yet:

- `143ddb172`: regression test first. [Remote red CI](https://github.com/brsbl/bb-plugins/actions/runs/38486110009) failed only the expected safely-failed-card resolve assertion.
- `cf3dd87cc`: allow `resolve` on ready cards or failed cards with a retryable result; preserve the original attempt and record the settlement message. Pending and nonretryable/unknown outcomes remain blocked for reconciliation. No schema rewrite or new dispatch.
- [Remote green CI](https://github.com/brsbl/bb-plugins/actions/runs/38486592146): 88 plugin tests and release artifact validation passed.
- Fresh isolated dev data and the actual CLI verified a persisted retryable failure settles, leaves waiting and retains its attempt; uncertain and pending cases still fail safely. The tests also reject a late report and verify no new agent send.
- The old server was verified running 0.2.6 from the exact cf3dd87 commit. Migration does not install anything on the destination server. Last known good rollback is 0.2.5 at #447's head.

Before release, validate the edge where a legacy failed attempt has choice `later` or `skip`: existing deferred predicates may still classify the preserved attempt as deferred/resumable. This was identified by code inspection, not reproduced; the requested obsolete merge-card path passed. Do not describe that edge as fixed or change it without checking actual persisted behavior.

## Relevant completed work

- #398 design system and #434 publisher CSS / legacy `itemIds` compatibility fixes are merged. Do not redo them.
- #438 composer-safe dispatch and inline notes plus #439 Inline Decisions rename/gavel are merged; main is `396c25f7996060b130c4994ef71786df8ef1546d`, published plugin version 0.2.2 at install-ref `ffb15b51692446e975beefde4248bbd8ff6c882b` at migration time.
- [bb issue 5435](https://github.com/get-bb/bb/issues/5435) already documents the core anchoring bug and links to the public plugin folder/install command. No edit is owed.

## Keep these contracts

Display name Inline Decisions; sidebar Decision log; gavel icon. Plugin ID `inline-action-cards`, CLI `bb action-cards`, skill name, persisted IDs/attempts and `::action` directives stay compatible. Notes still accompany answers as `note`; note-only submissions are comments. Legacy sheet `itemIds` reads stay supported without rewriting stored bytes.

Do not infer authorization from an installed dogfood build. Merge approval remains separate and absent for this stack. Remote CI only; no local tests/typecheck/lint. Future release QA must exercise the generated published-install artifact, not merely a path/source build.
