<!--
  Generated file: do not edit by hand.
  Source template: tooling/bootstrap/bootstrap-prompt.template.md
  Parameters:      tooling/bootstrap/variants.json (improve-prompt)
  Regenerate:      node tooling/bootstrap/render-bootstrap.mjs --write
  Repository hygiene fails if a committed variant drifts from this template.
-->

# Personalize Improve Prompt from your bb history

One copy/paste prompt that adapts Improve Prompt (stable id `prompt-shaper`) to your own product-design work and keeps it current without you re-triggering it. Paste it into a fresh bb thread on your fork; the recurring automation it sets up in step 5 does the ongoing maintenance.

```text
You are personalizing the Improve Prompt bb plugin (package `bb-plugin-prompt-shaper`, stable id `prompt-shaper`) from brsbl/bb-plugins so it reflects my product-design judgment instead of its author's. Work in one worker and do not merge until every step below has passed.

1. Fork and branch. Fork and clone brsbl/bb-plugins and cut a working branch. Read plugins/improve-prompt/README.md and plugins/improve-prompt/maintenance/skill-tuning.md to learn how Improve Prompt is structured and maintained. Keep the `prompt-shaper` package and plugin id and do not change plugin runtime behavior beyond its prompt-shaper skill.

2. Seed evidence from my bb threads. Collect my own direct feedback as redacted, previewable evidence — never paste raw transcripts:
     node tooling/bb-history.mjs scan --state ./.bb-evidence-state.json --limit 200 --format jsonl > seed-evidence.jsonl
   The reader redacts emails, URLs, bb ids, secrets, and local paths by default and skips relayed [bb ...] messages. Review seed-evidence.jsonl and keep only durable signal that repeats; ignore one-offs and anything an agent produced.

3. Adapt the plugin and its companion skill. Fold each durable signal into skills/prompt-shaper/SKILL.md — tighten a role's include-when, add or narrow a rule, or fix a stopping convention. Do not touch the composer runtime; only the skill changes. The plugin runtime and the skill are separate parts.

4. Install, test, and validate:
     npm ci
     npm run check --workspace=bb-plugin-prompt-shaper
     bb plugin install "path:$PWD/plugins/improve-prompt" --yes
   Exercise it in a real thread before trusting it.

5. Make it ongoing with a bb automation. Create a first-party bb automation so newer history is ingested and its prompt-shaper skill updated on a schedule, with no further manual passes from me:
     bb plugin run automations create --project <my-project-id> \
       --name "Prompt Shaper skill refresh" \
       --cron "0 9 * * 1" --timezone <my-timezone> \
       --provider <my-provider-id> --model <my-model> \
       --permission-mode full \
       --prompt "Run one incremental Improve Prompt maintenance batch exactly as plugins/improve-prompt/maintenance/skill-tuning.md describes, then stop."
   Confirm the exact flags first with `bb plugin run automations create --help`. Use `bb plugin run automations` — not a deprecated API. `--permission-mode full` is accepted by every current bb build and is what an unattended edit-and-commit run needs; older builds also list `workspace-write`/`readonly`, which newer builds fold into `accept-edits`, so prefer `full` unless help output says otherwise.

6. Stay safe across runs. Every scheduled run processes one bounded, checkpointed batch exactly as plugins/improve-prompt/maintenance/skill-tuning.md describes: read new history through the saved cursor, hold its lease so two runs never advance the same cursor, refuse to start if the skills/prompt-shaper/ tree already has uncommitted work (preserving it for me), commit only the skills/prompt-shaper/ tree, and advance the cursor only after that commit succeeds. Report anything conflicting and stop; do not resolve it yourself.

7. Reference, do not reinvent. Follow plugins/improve-prompt/maintenance/skill-tuning.md, tooling/README.md, and docs/provenance.md for implementation and provenance detail instead of restating them.
```
