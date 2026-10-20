# Claude full-prototype latency breakdown

Retained traces only; generated 2026-10-20T05:08:55.502206+00:00. This supplements [the baseline and two-case pilot analysis](claude-timing-analysis.md), which is unchanged. No browser, server, provider turn or saved-card replay was started for this analysis.

**All 20 prototype attempts produced a visible card: median 3.93 minutes, p90 5.52 minutes.** Exact values are 236,051.5 ms and 331,297 ms. Recorded clarifying questions: 0; visible progress: 19/20, with none observed for narrow-toggle. Five cards arrived within three minutes. The median target remains missed; delivery alone does not prove live controls. These are the original send-to-visible measurements from [the raw summary](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/summary.json), not the later control rescore.

For the **17 figures with all five ordered markers**, mean elapsed time is 9s to first tool + 160s from first tool to first source write + 11s from source write to first browser-check command + 64s checking/revising before publication + 12s from publish attempt to visible card = 256s. Reading/design/generation/building before the first browser check still accounts for 171s after startup. This subset excludes the two settings mockups and thermos; it is not an additive breakdown of the all-20 median.

## Definitions and limits

All table entries are **seconds**, rounded to one decimal. Full timestamps, row IDs, command excerpts and hashes, source hashes, database completion-event references, phase coverage and every unattributed interval are in [the JSON](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/claude-full-prototype-timing.json). Each case links to its retained agent timeline; sibling `result.json` provides its visibility proof.

- **Send → tool:** runner `sentAt` to the first work row. Includes provisioning, dispatch and initial provider response; it is not pure startup service time.
- **Tool → source write:** first work row to first generated source/model write. Includes skill/example reading, API lookup, design, code/tool-argument generation and unknown waits. Generated text exists before a write tool begins; this is not measured disk-read time.
- **Write → browser check:** first source write to the containing command's first actual `capture.mjs`, `drive.mjs` or `lines.mjs` invocation with a target. Help/no-target invocations are excluded. A combined write/build/check command shares one start timestamp, so a 0.0s envelope does **not** mean zero building time. Invoking a browser command is not proof that its first attempt succeeded.
- **Check/revise → publish:** first browser-check command to the first real publish attempt. Includes revisions, reads, checks and gaps. These are the agent's own checks, not the evaluator's control tests.
- **Publish → visible:** first publish-containing command or `bb:playground` tool with `action=publish` to on-screen proof. Help is excluded. Compound commands, unsuccessful attempts/retries, later state checks and directive emission can be inside this envelope; it is not publish API latency.
- **Missing is not zero:** a dash denotes a missing boundary and a phase that is unavailable/not comparable. Only the same complete set of rows enters each five-phase mean; available-only columns are not averaged into a fictional full breakdown.
- **Observed spans and gaps:** union work-row start/completion envelopes, clipped to send→visible; missing normalized completions are recovered from read-only `bb.db` `item/completed` events by call ID. All included work rows have completion evidence. 84.7% of all-20 elapsed time is outside those spans. That remainder is explicitly unattributed: the trace cannot split model generation, reasoning, scheduling, host stalls, background descendants or UI time. Tool envelopes themselves are not CPU measurements.
- **External test time is excluded:** fixture preflights are before `sentAt`; eval control-driving and later saved-card replays occur after first visibility or in separate processes. None contributes to these durations. Agent self-checks before visibility do contribute. Work after visibility is excluded even when retained in the timeline.

The extraction corrects two marker ambiguities without changing the old report: DNS's first actual browser target begins at 122.1s; the 118.4s invocation only requests driver usage. Thermos's 92.3s command writes HTML and runs `publish --help`; its real publish attempt begins at 98.4s. Classification always comes from `cardVisible` and `proof.at`, never a prompt name. **Prototype seat belt is visible at 316.735s; only baseline seat belt is capped.**

## All 20 prototype attempts

| Case | Send → tool | Tool → source write | Write → browser check | Check/revise → publish | Publish → visible | Total visible |
|---|---:|---:|---:|---:|---:|---:|
| [bicycle-pump](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/bicycle-pump/timeline.json) | 8.5 | 149.3 | 5.0 | 56.1 | 19.0 | 238.0 |
| [cdn](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/cdn/timeline.json) | 30.4 | 165.2 | 5.3 | 17.8 | 24.7 | 243.5 |
| [database-index](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/database-index/timeline.json) | 7.1 | 158.1 | 14.6 | 57.0 | 11.4 | 248.1 |
| [dns](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/dns/timeline.json) | 7.4 | 107.3 | 7.3 | 50.7 | 12.0 | 184.8 |
| [door-lock](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/door-lock/timeline.json) | 16.0 | 179.1 | 17.2 | 31.9 | 10.8 | 255.0 |
| [git-merge](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/git-merge/timeline.json) | 6.2 | 107.8 | 0.0 | 37.6 | 9.7 | 161.3 |
| [load-balancer](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/load-balancer/timeline.json) | 7.2 | 124.0 | 35.2 | 133.2 | 13.6 | 313.2 |
| [narrow-toggle](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/narrow-toggle/timeline.json) | 6.5 | — | — | — | 8.8 | 50.4 |
| [notification-settings](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/notification-settings/timeline.json) | 7.0 | 27.6 | — | — | 11.9 | 46.5 |
| [refrigerator](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/refrigerator/timeline.json) | 6.5 | 173.8 | 0.0 | 179.8 | 9.4 | 369.5 |
| [seat-belt](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/seat-belt/timeline.json) | 6.8 | 182.6 | 20.9 | 88.3 | 18.2 | 316.7 |
| [spray-bottle](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/spray-bottle/timeline.json) | 6.9 | 164.1 | 13.1 | 52.7 | 7.1 | 244.0 |
| [stapler](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/stapler/timeline.json) | 7.2 | 261.4 | 9.9 | 91.4 | 11.0 | 380.9 |
| [thermos](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/thermos/timeline.json) | 8.7 | 83.6 | — | — | 20.3 | 118.7 |
| [toaster](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/toaster/timeline.json) | 8.2 | 130.2 | 11.2 | 68.1 | 6.4 | 224.1 |
| [toilet](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/toilet/timeline.json) | 5.9 | 221.9 | 6.0 | 88.1 | 9.5 | 331.3 |
| [umbrella](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/umbrella/timeline.json) | 6.9 | 116.9 | 11.8 | 31.8 | 11.3 | 178.8 |
| [washing-machine](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/washing-machine/timeline.json) | 7.0 | 151.4 | 17.4 | 32.6 | 10.6 | 219.0 |
| [websocket](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/websocket/timeline.json) | 6.8 | 141.0 | 11.0 | 42.8 | 7.9 | 209.5 |
| [zipper](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/zipper/timeline.json) | 8.3 | 185.5 | 0.0 | 32.4 | 8.0 | 234.1 |


The source-write and first-browser starts coincide for Git merge, refrigerator and zipper because one shell command contains both. Their intervening work is folded into the following envelope.

The three incomplete phase traces are preserved explicitly:

- **Narrow toggle:** loads the Playgrounds skill, calls the guide at 24.8s, directly publishes HTML through `bb:playground` at 41.7s and becomes visible at 50.4s. No separate source-write or browser-check marker exists. The 35.2s from first tool to publish is an unsplit reading/generation interval, not a substitute write phase. No progress text was observed before visibility.
- **Notification settings:** first tool at 7.0s; at 34.7s one shell command writes HTML through `$f` (visibly assigned `notif.html`) and attempts publication; another publish command follows at 38.0s. Visible at 46.5s. No browser-check marker exists, so its write/check/revise phases cannot be compared with the figures.
- **Thermos:** first source write at 92.3s, real publish at 98.4s, visible at 118.7s. It performs CLI state/parameter checks and `node --check`, but no retained browser-check invocation. Its 6.2s write-to-publish envelope is measurable; browser verification duration is not. All 20 observations have `proof.kind=html`; the mockups are not misreported as native-document cards.

## Matched visible-baseline comparison

The baseline had 15 visible attempts, four infrastructure failures and one capped delivery. Compare those **same 15 visible topics** with the prototype: mean 9.21 → 4.13 minutes (55.1% lower), median 9.13 → 3.97 minutes. Median per-case reduction is 303.6s; every matched case is faster. These conditional diagnostics do not replace the original all-20 gate baseline of 9.93-minute median / 15.00-minute p90.

| Case | Baseline visible | Prototype visible | Reduction |
|---|---:|---:|---:|
| [bicycle-pump](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/bicycle-pump/result.json) | 521.5 | 238.0 | 283.6 |
| [cdn](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/cdn/result.json) | 447.0 | 243.5 | 203.6 |
| [door-lock](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/door-lock/result.json) | 667.9 | 255.0 | 412.9 |
| [git-merge](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/git-merge/result.json) | 470.7 | 161.3 | 309.3 |
| [load-balancer](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/load-balancer/result.json) | 340.8 | 313.2 | 27.6 |
| [refrigerator](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/refrigerator/result.json) | 691.1 | 369.5 | 321.6 |
| [spray-bottle](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/spray-bottle/result.json) | 547.6 | 244.0 | 303.6 |
| [stapler](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/stapler/result.json) | 617.8 | 380.9 | 236.9 |
| [thermos](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/thermos/result.json) | 544.6 | 118.7 | 425.9 |
| [toaster](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/toaster/result.json) | 449.1 | 224.1 | 224.9 |
| [toilet](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/toilet/result.json) | 581.9 | 331.3 | 250.6 |
| [umbrella](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/umbrella/result.json) | 609.8 | 178.8 | 431.1 |
| [washing-machine](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/washing-machine/result.json) | 817.2 | 219.0 | 598.2 |
| [websocket](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/websocket/result.json) | 575.1 | 209.5 | 365.6 |
| [zipper](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/claude-code/zipper/result.json) | 407.8 | 234.1 | 173.6 |


Thermos lacks the prototype browser boundary, so it remains in the 15-case **total** comparison but is excluded from the **14-case phase** comparison below. Both columns use exactly the same 14 topics and recomputed marker rules.

| Same 14 cases | Send → tool | Tool → write | Write → check | Check/revise → publish | Publish → visible | Total mean |
|---|---:|---:|---:|---:|---:|---:|
| Baseline | 10.0 | 334.8 | 62.1 | 133.3 | 13.0 | 553.2 |
| Prototype | 9.4 | 162.3 | 10.2 | 64.0 | 11.4 | 257.3 |


For those 14, first-tool-to-browser work falls from 396.8s to 172.5s; checking/revising falls from 133.3s to 64.0s. Publish-to-visible remains roughly 11–13s. Most of the observed improvement precedes publication. These are descriptive paired observations on a shared host, not a controlled causal estimate of wording alone.

The four baseline infrastructure cases—notification settings, narrow toggle, DNS and database index—have no comparable agent-generation trace. Their 900s scores remain in the baseline gate, but are not treated as 900s of Claude work. Baseline seat belt has publication evidence but no visible-card proof and a 900s cap; it is also excluded from the matched-visible set. All five now have visible prototype results and remain in the full-20 table. Original classifications and source hashes are retained in JSON.

## Reading and self-verification evidence

The 17 complete-phase figures all read the bundled dial-indicator source; exact read rows are indexed in JSON. The other three do not show that example read. Across all 20 runs, the broad read/setup category has a median 9.5 calls and 4.3s of union observed tool envelopes. This category includes skill loading, lists, copies, reference/API reads and read-only CLI calls. Interpretation and generation between tools are outside those envelopes; these figures do not mean Claude spent only four seconds reading.

Concrete remaining costs, linked to the retained timelines:

- [Door lock](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/door-lock/timeline.json) makes 17 read/setup calls, repeatedly searches the parameter API, and reads installed `controls.ts` at 76s; its first source write is at 195s. The 111s largest gap has no causal attribution. [Washing machine](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/washing-machine/timeline.json) now writes at 158s versus 607s in baseline and is visible at 219s versus 817s.
- [Refrigerator](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/refrigerator/timeline.json) has a 180s check/revise envelope. Its command at 216.1s occupies a 120.4s tool envelope; the output explicitly says it hit the 120s timeout and moved to the background. A repeat at 344.3s finishes in 9.1s. The compound command contains a bare `cat > /tmp/fr-actions.json` before its actions heredoc, but the retained trace does not prove which subcommand blocked. This is a concrete tool/wait anomaly, not an inferred 120s model-thinking delay.
- [Load balancer](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/load-balancer/timeline.json) spends 133s checking/revising. Two compound browser-check envelopes last 48.9s and 45.6s; their action scripts explicitly wait 20s and 40s to observe simulation behavior. The latter runs multiple checks in parallel inside the originating command; the report uses wall-clock union, not summed browser durations.
- [Stapler](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/stapler/timeline.json) first writes at 269s and starts checking at 278s, then revises detail geometry and labels before publishing at 370s; visible at 381s. [Seat belt](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/seat-belt/timeline.json) invokes browser checks in seven work rows and revises geometry/viewpoint before publication; visible at 317s. These are repeated pre-delivery craft/check loops still present in quick mode.
- The [CDN](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/claude-code/cdn/timeline.json) result remains the original first pilot observation: 30s before first tool, write at 196s, check at 201s, publish at 219s, visible at 243s. CLI parameter changes and another browser check occur inside that final envelope. Pump/CDN are included once in the full set, not rerun or counted twice.

The evidence still points to reducing the pre-publication design/generation surface, repeated API discovery and self-check loops. It does not justify assigning the unattributed gaps to CPU saturation, model reasoning or network/CDN delay. Plugin source and execution conditions remain those in [baseline manifest](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/baseline/manifest.json), [prototype manifest](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/prototype/manifest.json) and [conditions](/home/bersabel/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_vv8zgxmczt-1/bb-plugins/.launch/results/conditions.json); the prototype also includes R2 control changes. This timing report makes no new live-control claim and does not alter baseline, pilot or saved-replay evidence.
