# Claude launch latency phases

Retained evidence only; generated 2026-10-20T03:57:15.197549+00:00. All 20 Claude baseline attempts and the first two Claude prototype attempts are included. No reruns, browser sessions or running-pipeline mutations were performed.

**The ten-minute baseline is mainly pre-publication work.** The official 20-case median remains 9.93 min and p90 15.00 min; four infrastructure failures and one no-visible-card cap contribute five 15-minute scores. Among the 15 attempts with a proven visible card, the median is 9.13 min. These conditional diagnostics do not replace the gate numbers.

For those 15 visible cards, the **mean** additive breakdown is: 10s to first tool, 401s reading/designing/generating/building before the first browser check, 128s checking/revising, and 13s from the first publish-containing command to the visible card. That is 9.21 min total, with 73% before the first browser check and 23% in checking/revision. Means are used here so the components add; per-phase medians must not be added.

The two-prompt pilot reduced the matched pump/CDN mean from 8.07 to 4.01 min. Its mean additive breakdown is 19s startup, 162s before the first browser check, 37s checking/revision, and 22s publish-command-to-visible. Both still exceed three minutes. This is a two-topic pilot on a pressured shared host, not a representative percentile or a controlled causal estimate.

## What the timestamps can prove

All table durations below are **seconds**, rounded to whole seconds. Original millisecond timestamps, source hashes, every retained work row, raw database completion timestamps and every unattributed interval are in [the JSON analysis](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/claude-timing-analysis.json). Source links point to immutable per-case results; their sibling `timeline.json` is the event evidence. The script is [`.launch/analyze-claude-timing.py`](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/analyze-claude-timing.py).

- **Send → first tool:** runner `sentAt` to the first work-row `startedAt`, including thread provisioning, provider startup and response latency. Median 9s for the 15 visible baseline cards. It is not a pure dispatch-service measurement.
- **Read/design/generation → first write:** first tool to first generated source/model write event. It includes example/skill reads, source/API lookups, research, design, code/tool-argument generation and unknown waits. A file-change event starts after its arguments have been generated, so the preceding minutes cannot honestly be called filesystem read time. All compound commands retain their own start/completion bounds.
- **Write/build → first browser check:** first source write to the first command that actually invokes `capture.mjs`, `drive.mjs` or `lines.mjs` (excluding help). It can contain more generated files, compilation and later reads. A combined write/check command has only one start boundary.
- **Check/revise → publish command:** first browser check to the first command containing `bb playgrounds publish`. Includes screenshot inspection, layout/geometry corrections, further builds and checks, and unattributed gaps. This is agent self-verification, not the external eval's post-visible control tests.
- **Publish command → visible/cap:** start of that command to the real visible-card proof (or cap for seat-belt). A compound command may first rebuild/check; state checks and prose/directive generation may follow publication. This is an envelope, not publish API latency. See each marker's command and end timestamp in JSON.
- **Observed tool spans:** union of work-row start/completion intervals, clipped to the endpoint, with file-change completion recovered from `events` (`item/completed`) where needed. They are wall-clock tool envelopes, not CPU time. Overlapping calls are merged. Commands that hand work into the background can finish before their descendants, so this is not a complete measure of active execution.
- **Unattributed intervals:** everything outside those observed work intervals, including startup, provider generation, reasoning, scheduling, background execution, UI time and host stalls. Across the 15 visible baseline runs, 87.6% of elapsed time is outside observed work spans. The retained events do not distinguish those causes; there is no defensible exact “thinking vs host stall” split.

## All baseline phase envelopes

| Case | Send → first tool | Read/design/generation → first write | Write/build → first browser check | Check/revise → publish command | Publish command → visible/cap | Visible / scored |
|---|---:|---:|---:|---:|---:|---:|
| [bicycle-pump](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/bicycle-pump/result.json) | 6 | 136 | 252 | 112 | 16 | 522 / 522 |
| [cdn](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/cdn/result.json) | 10 | 346 | 11 | 65 | 15 | 447 / 447 |
| [database-index](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/database-index/result.json) | — | — | — | — | — | — / 900 |
| [dns](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/dns/result.json) | — | — | — | — | — | — / 900 |
| [door-lock](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/door-lock/result.json) | 9 | 412 | 17 | 220 | 10 | 668 / 668 |
| [git-merge](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/git-merge/result.json) | 9 | 312 | 15 | 126 | 9 | 471 / 471 |
| [load-balancer](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/load-balancer/result.json) | 6 | 243 | 7 | 74 | 11 | 341 / 341 |
| [narrow-toggle](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/narrow-toggle/result.json) | — | — | — | — | — | — / 900 |
| [notification-settings](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/notification-settings/result.json) | — | — | — | — | — | — / 900 |
| [refrigerator](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/refrigerator/result.json) | 9 | 377 | 150 | 130 | 25 | 691 / 691 |
| [seat-belt](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/seat-belt/result.json) | 8 | 449 | 134 | 199 | 110 | — / 900 |
| [spray-bottle](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/spray-bottle/result.json) | 10 | 378 | 16 | 130 | 13 | 548 / 548 |
| [stapler](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/stapler/result.json) | 9 | 347 | 58 | 190 | 15 | 618 / 618 |
| [thermos](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/thermos/result.json) | 9 | 324 | 140 | 59 | 13 | 545 / 545 |
| [toaster](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/toaster/result.json) | 11 | 342 | 10 | 73 | 13 | 449 / 449 |
| [toilet](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/toilet/result.json) | 8 | 172 | 288 | 105 | 8 | 582 / 582 |
| [umbrella](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/umbrella/result.json) | 31 | 385 | 17 | 161 | 16 | 610 / 610 |
| [washing-machine](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/washing-machine/result.json) | 5 | 601 | 9 | 188 | 13 | 817 / 817 |
| [websocket](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/websocket/result.json) | 8 | 364 | 8 | 183 | 12 | 575 / 575 |
| [zipper](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/zipper/result.json) | 9 | 271 | 10 | 110 | 7 | 408 / 408 |


A dash means unavailable, not zero. The four infrastructure cases have no tool phase trace and are separated below. The seat-belt row ends at the 900s scoring cap; its actual runner wall duration is 920s.

## First prototype pilot

| Case | Send → first tool | Read/design/generation → first write | Write/build → first browser check | Check/revise → publish command | Publish command → visible/cap | Visible / scored |
|---|---:|---:|---:|---:|---:|---:|
| [bicycle-pump](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/bicycle-pump/result.json) | 8 | 149 | 5 | 56 | 19 | 238 / 238 |
| [cdn](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/cdn/result.json) | 30 | 165 | 5 | 18 | 25 | 243 / 243 |


Pump's first publish command also rebuilds and runs a 12-second browser check; its 19-second final envelope cannot be labeled publish overhead. CDN publishes at 219s, then exercises `setParams`/read and another browser check before the card is visible at 243s. Its initial first-tool delay is 30s versus 10s in the baseline. Both pilot traces still perform repeated parameter-API searches before writing.

## Skill/example reading and repeated verification

The 15 visible baseline cards have a median 16 read/setup calls; their observed read/setup spans have a median 7.7s. This category includes skill loading, copies, lists, source/reference reads and shell lookups; it excludes web research. It does **not** mean Claude spent only that long reading: interpreting their output occurs in the unattributed gaps. Both pilot runs read the bundled dial-indicator example; the pilot pump has 8 read/setup calls and CDN 14.

Concrete evidence:

- Baseline washing machine: first tool 5s, generated 811-line `build.mjs` write starts 607s, first build/check command 616s, publish 804s, visible 817s. At 432s it was still reading kit lighting definitions, followed by a roughly 174s gap before the write. No execution timestamp explains that gap as disk, network, model generation or scheduling alone. The long path predates screenshot checks.
- Baseline pump: a model file is written at 142s, a large figure file at 385s, first capture at 394s, then repeated captures/drive/line checks and repairs until publish at 506s. Pilot pump writes its figure in a shell command at 158s and starts its first check at 163s; it still revises width/framing before a combined check/publish at 219s.
- Baseline CDN: eight web fetch/search rows have 22s of union observed spans. Parameter-API investigation spans commands around 156–198s, including searching installed plugin code. Its source write starts at 356s, first capture 367s, publish 432s, visible 447s. Pilot CDN has no recorded web tools, writes at 196s and checks at 201s. Differences include both less research and less build/check work; quick-mode wording alone is not isolated.
- Baseline door lock spends 220s between first capture and publish, with multiple view/layout fixes, zoom captures and line-end checking. Baseline stapler spends 190s in that envelope, including several line-check repairs. These are observable repeated craft passes, not CDN/network waits.

## Infrastructure failures and capped case

| Case | Actual runner wall | Scored | Retained evidence |
|---|---:|---:|---|
| Notification settings | 25s | 900s | POST `/threads` returned 502: concurrency-limit dispatch hook did not decide within 10000ms; no thread ID returned. No provider-tool timing exists. |
| Narrow toggle | 28s | 900s | `fetch failed`; database has provisioning events and manual stop, no provider/tool events. |
| DNS | 41s | 900s | Runner timeout; database `system/error`: `thread_command_failed`, “Host is not connected”; no provider/tool events. |
| Database index | 119s | 900s | Runner timeout; database `system/error`: `thread_provisioning_failed`, “Timed out waiting for command result”; no provider/tool events. |
| Seat belt | 920s | 900s | First publish-containing command starts 790s and returns a directive; assistant includes that directive around 805s, but the observer proves no visible card. Publication/build completion is not visible-card proof. The exact render/observer failure remains unknown. |

These four infrastructure failures must stay in the official score, but they are not evidence that Claude spent 15 minutes generating each answer. Seat belt is separately a capped delivery failure despite retained publication evidence.

## Interpretation and limits

Prioritize shortening the generation/design surface and the repeated craft loop. The evidence supports retaining a compact worked starter and removing default zoom/line-audit passes; repeated parameter-API discovery is another concrete target. It does not support blaming `--playground-file` transport or CDN fetching for the whole delay: publish-to-visible envelopes are generally seconds, and most topics use no web tools.

The baseline source is `a632572aa58adc9b6ddf947c9e527587d09f22ca`; pilot source is `9de99949792c2c59b70693c1dcda6aa8cf36b428` and also includes R2 control changes. Models are default Claude Opus 5.5. Shared-host pressure and provider/bridge timing are confounders ([conditions](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/conditions.json), [pilot host snapshot](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/host-status-prototype-pilot.json), [gate report](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/gate-1-first.md)). No phase breakdown here claims a clean model-speed benchmark or extrapolates the two-prompt pilot to the full corpus. Raw baseline result hashes and timeline hashes are preserved in the JSON; official scorer corrections do not alter this source evidence.
