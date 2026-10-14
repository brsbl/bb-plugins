# Agent Channels QA migration

QA verdict: FAIL, with seven screenshot-verified differences. No product code was changed. The report was delivered to Ops Tools (old parent thr_6a86uy5ftb); no further QA or implementation was authorized. This migration snapshot preserves findings and measurements independently of the old server.

Old worker: thr_4jdu7fnpka, Agent Channels screenshot QA. Repository: brsbl/bb-plugins. Original branch: bb/agent-channels-screenshot-qa-thr_4jdu7fnpka, HEAD 960123dd4ac8ca94657c16d56a62612af8da0698. No PR and no children. Migration branch: migrate/thr_4jdu7fnpka.

## Acceptance and verdict

brsbl's acceptance rule, relayed by Ops Tools:

> visually should look exactly like a thread timeline, the only difference is who is messaging each other: main thread is on the right (as the user), the other agent is on the left, in each tab

> all rendering shuold be the same

The seven measured defects, ordered by visibility, are in handoff.json with exact values and six paired screenshot paths. They are: missing long-message collapse; unbounded expanded reading width; wrong canvas background in both themes; outgoing soft line breaks removed; 4px tighter message spacing; missing hover actions; missing scroll-to-latest control. At equal 559px pane width, basic bubble geometry, typography and standard rich markdown computed styles match.

Additional source-confirmed gap: plugins/delegation/dispatch-app.tsx conversationPage filters out non-conversation rows, preventing tool/activity parity. This was NOT verified with paired tool-row screenshots; do not count it among the seven screenshot-confirmed defects.

## SDK reuse

The plugin already reuses SDK Markdown. Full parity requires more than Markdown.

Core baseline: brsbl/bb commit 59a1fcc29f4fa470e6aa4fc6067853096da6abbe, local checkout /Users/brsbl/Code/bb.

- packages/plugin-sdk/src/app.ts:118 exports ThreadChat; :119 exports Markdown.
- packages/plugin-sdk/src/app-contract.ts:2989 defines ThreadChatProps: threadId, variants full/compact/timeline, contained/document layout; no arbitrary merged rows or role remapping.
- apps/app/src/components/plugin/PluginThreadChat.tsx:264 delegates timeline variant to the real ThreadTimelinePanelContent.
- apps/app/src/lib/plugin-sdk-app-impl.tsx:135-181 wraps MarkdownPreview without outgoing preserveSoftBreaks or core message wrappers/actions/collapse.
- apps/app/src/components/thread/timeline/ConversationMessageContent.tsx:245 preserves outgoing soft breaks, :267 handles collapse, :453 user bubble, :597 assistant markdown.

Proposed, not approved or implemented: an additive public SDK presentation API backed by the same core timeline renderer, accepting merged channel rows and role mapping. Existing ThreadChat cannot express this channel. Do not import private core components or break shipped SDK contracts.

## Saved evidence and local-only files

Committed: handoff.json (defects, versions, source pointers, pairs, preview command), styles-light.json and styles-dark.json (computed styles), fixture.json (identical message text), and this document.

Artifact root on the Mac:

`/Users/brsbl/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_4jdu7fnpka-1/bb-plugins/.agent-channels-qa-uOcJjH`

Screenshots remain there, outside Git, to preserve all original inline paths. Live fresh data is data/bb.db and sibling files; dev.log and capture scripts are also local. Never delete/overwrite shown images. Do not remove the environment while the handed-off preview or evidence is needed. A Linux successor can read committed findings but needs the Mac to obtain original screenshots or live fixture state. Do not copy this data directory onto another host and launch it blindly.

Use only the six approved pairs listed in handoff.json; earlier superseded captures have occlusion or scroll-position problems. Full-window PNGs accompany the pairs. All evidence is fresh 2x PNG from Chrome for Testing 154.0.8037.92, through one Browser Automation session, now closed.

Local seed.py is historical, not a complete replay: its initial request IDs were invalid and subsequently corrected directly in the isolated database to creq_ plus ten characters from 23456789abcdefghijkmnpqrstuvwxyz. Later additions (history reference and outgoing softbreak fixture) are also only in the database. The corrected live fixture passed reload. These setup errors are not product defects. Capture helper scripts assume existing page variables; don't run them blindly.

## Running preview

http://localhost:13941/projects/proj_channelsqa/threads/thr_qalead

HTTP 200 reverified during migration; persistent terminal term_smcckf42sg remains running on Mac host host_37m3sgpq59, environment env_xbcu45tjye. Core checkout /Users/brsbl/Code/bb; server port 21941, daemon 29941. Full launch command is in handoff.json. No port share was created. Browser session 6153ed80-ac51-4458-8ce5-59e67b75a6b4 is closed. No task schedules or automations were created.

Published plugin install: git:https://github.com/brsbl/bb-plugins.git@plugin/delegation, resolved 4bba814531ac8621c3a43c62773b04510d27c9ec, version 0.1.0. dispatch-app.tsx and app.css matched the inspected source byte-for-byte. Installed only in this isolated fresh data directory.

Requested scripts/bb-dev-app was absent in the core checkout. Installed ~/.local/bin/bb-dev-app would stop unrelated sessions and open desktop. Used the repository's web dev tasks directly with fresh data instead; no Nightly or personal app was driven. Initial Turbo concurrency 3 failed; 4 runs all three persistent tasks.

Fixtures: proj_channelsqa, env_channelsqa; thr_qalead, children thr_qavisual/thr_qaapi/thr_qadocs, peer thr_qapeer, references thr_qareference/thr_qahistory. Waiting-on-input state, child results, rich markdown and 31-turn history were exercised. No real agents were started by seeding these isolated records.

## Next owner

No open user question. No new worker is required solely to repeat completed QA. Ops Tools or the Agent Channels implementation owner should consume these findings. If further tool-row evidence is requested, preserve the running preview and use one new Browser Automation session at 2x; the prior session is closed. Do not rerun the entire completed matrix without changed behavior or a new request.

Migration freeze: after the migration handoff, this old worker must not commit or push again; if woken, it replies only “Moved to brsbl-bbox”.
