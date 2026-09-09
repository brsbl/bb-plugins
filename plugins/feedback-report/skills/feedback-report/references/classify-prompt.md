# Reader prompt: classify one batch

Substitute `{BATCH}` with the batch file path, `{RESULTS}` with the results file path, and `{TAXONOMY}` with the taxonomy file path (`<run>/classification/taxonomy.md`).

---

You are classifying community feedback records for bb (an agentic IDE for managing coding agents across projects, threads, environments, and machines). Read every record in `{BATCH}` (one JSON object per line) and write one JSON object per line to `{RESULTS}`. Every input id must appear exactly once in the output. Do not skip records; do not sample. Do not modify anything else on disk. Do not use the network.

Taxonomy: read `{TAXONOMY}` first (the primary areas, each with a purpose and a cluster list).

Input fields: id, src (github-issue | github-comment | discord-thread | discord-channel), date, author, assoc (GitHub author association, if any), labels, title (issues), on_issue (comments: the issue number and title), channel and thread_starter (Discord), text (may be truncated).

Output schema per line:
`{"id": "...", "kind": "...", "area": "...", "cluster": "...", "sentiment": "...", "confidence": "high|low"}`

kind, what the record is:
- "bug": reports something broken, wrong, crashing, slow, or not working as expected (including papercuts).
- "request": asks for a capability, change, or improvement that does not exist yet.
- "question": asks how to do something or whether something is supported, without asserting a defect.
- "praise": expresses appreciation, excitement, or satisfaction with bb without a defect or request.
- "complaint": expresses frustration or dissatisfaction with bb without a specific reproducible defect.
- "showcase": shares something the author built, a plugin, or a link, without feedback about bb itself.
- "maintainer": a maintainer or collaborator reply, status update, announcement, triage, or implementation note.
- "chatter": greetings, thanks-only replies, off-topic, "+1" or "same", bot output, test posts, or anything with no product signal.
If praise or complaint is combined with a bug or request in one message, choose the kind that carries the product signal (bug or request) and record the affect in sentiment.

area, the product capability that owns the behavior, not the UI surface where it appears. Use exactly one of the area names from the taxonomy, spelled exactly, or:
- "General": about bb as a whole (praise, overall experience, pricing, comparisons) with no specific capability.
- "Non-product": repository, CI, or test infrastructure, the marketing website, community meta, contributor process.
- "Unclear": the text does not establish an owner.
For Discord thread replies, use thread_starter to inherit the topic only when the reply is plainly about the same thing. For GitHub comments, use on_issue the same way.

Boundary rules (apply them literally):
- A provider or model failure shown inside a thread belongs to Providers & agent execution, not Threads. This includes ACP, OMP, Pi, Codex, and Claude CLI bridges, model lists, reasoning or effort levels, subagent model selection, rate limits, provider auth.
- Git state, diffs, branches, PRs, worktrees, files and previews, environment provisioning or cleanup belong to Environments & Git, even when shown in a thread panel.
- Composer, prompt input, attachments, queued messages, steering, timeline rendering, approvals and questions, forks, sections, archiving, thread status belong to Threads & agent work.
- Sidebar, split panes, tabs, breadcrumbs, project picker, command palette, responsive layout, window behavior belong to Navigation & layout.
- Themes, keybindings, preferences belong to Settings & personalization.
- Mobile app, iOS or TestFlight, using bb from a phone, Connect handles or pairing, daemon connectivity, machine enrollment or status belong to Machines & remote access.
- Install, first run, updates, nightly, release channels, packaging, startup of the bundled server or daemon belong to Setup, installation & updates.
- Plugins (platform, SDK, marketplace, install or enable, plugin UI) and plugin-delivered features (automations, workflows, tasks, side chat, GitHub plugin, docs, memory, secrets) belong to Extensions & integrations.
- Skills, AGENTS.md or CLAUDE.md context, instruction injection belong to Skills & agent context.
- Terminals (thread, environment, host terminals, PTY, shell env) belong to Terminals.
- In-app browser or webview belongs to Browser & web navigation.
- Projects, repository sources, project settings or defaults belong to Projects & sources.
- A workaround message belongs to the area of the underlying problem, not the tool used to work around it.
- A CI or test-flakiness issue is Non-product even if it names a product area.

cluster: the best matching cluster label from that area's list, spelled exactly, or "Other" if none fits. For General, Non-product, Unclear, and chatter use "".

sentiment, the author's expressed affect toward bb in this record, not the severity of the problem:
- "positive": appreciation, delight, "works great", thanks for a fix.
- "negative": frustration, annoyance, disappointment, giving up, unfavorable comparison, strong words about brokenness.
- "neutral": a plain report, question, or statement with no affect. Most bug reports are neutral.

confidence: "low" when the text is ambiguous, truncated so the point is hidden, or a sparse reply.

Work through the file in order; read it in chunks if it is large. Write results with a small script so the output is valid JSONL with exactly one line per input id. When done, verify the output line count equals the input line count and every id matches, and fix any gap. Reply with only: record count, counts by kind, counts by area, and any ids you could not classify.
