<!--
  Generated file: do not edit by hand.
  Source template: tooling/bootstrap/bootstrap-prompt.template.md
  Parameters:      catalog/plugins.json personalization entry (improve-prompt)
  Regenerate:      node tooling/bootstrap/render-bootstrap.mjs --write
  Repository hygiene fails if a committed variant drifts from this template.
-->

# Personalize Improve Prompt from your bb history

One copy/paste prompt that adapts Improve Prompt (stable id `prompt-shaper`) to your own product-design work and keeps it current without you re-triggering it. Paste it into a fresh bb thread on your fork; the recurring automation it sets up in step 6 does the ongoing maintenance.

```text
You are personalizing the Improve Prompt bb plugin (package `bb-plugin-prompt-shaper`, stable id `prompt-shaper`) from brsbl/bb-plugins so it reflects my product-design judgment instead of its author's. Work in one worker and do not merge until every step below has passed.

1. Fork and branch. Fork and clone brsbl/bb-plugins and cut a working branch. Read plugins/improve-prompt/README.md and plugins/improve-prompt/maintenance/skill-tuning.md to learn how Improve Prompt is structured and maintained. Keep the `prompt-shaper` package and plugin id and do not change plugin runtime behavior beyond its prompt-shaper skill.

2. Seed evidence from my bb threads, through the same checkpoint the automation will use. From the fork root:
     node tooling/bb-history.mjs scan --state plugins/improve-prompt/maintenance/state.json --limit 200 > seed-evidence.json
   This reads new history through Improve Prompt's maintenance checkpoint (plugins/improve-prompt/maintenance/state.json) and takes a lease. Redaction of emails, URLs, bb ids, secrets, and local paths is best-effort and relayed [bb ...] messages are skipped, so preview seed-evidence.json and decide what anonymous signal to keep — repeats only, never one-offs or agent output. Note the returned lease_id and cursor_commit; you advance them in step 5.

3. Adapt the plugin and its companion skill. Fold each durable signal into skills/prompt-shaper/SKILL.md — tighten a role's include-when, add or narrow a rule, or fix a stopping convention. Do not touch the composer runtime; only the skill changes. The plugin runtime and the skill are separate parts.

4. Install, test, and validate:
     npm ci
     npm run check --workspace=bb-plugin-prompt-shaper
     bb plugin install "path:$PWD/plugins/improve-prompt" --yes
   Exercise it in a real thread before trusting it.

5. Land the initial pass on the checkpoint before automating, so the automation starts on a clean tree with nothing to reprocess. Once step 4 passes: if the adaptation produced artifact changes, stage and commit only the skills/prompt-shaper/ tree — plugins/improve-prompt/skills/prompt-shaper can hold new untracked files, so add before committing — then advance the seed cursor:
     git add -- plugins/improve-prompt/skills/prompt-shaper
     git commit --only -m "prompt-shaper: <what changed>" -- plugins/improve-prompt/skills/prompt-shaper
     node tooling/bb-history.mjs advance --state plugins/improve-prompt/maintenance/state.json --created-at <cursor_commit.created_at> --segment-id <cursor_commit.segment_id> --lease-id <lease_id>
   For a verified no-change batch — a non-null lease_id where you made no edits (skipped relays still move the cursor) — skip the add and commit but still advance. If the seed returned a null lease_id there was no new history; do nothing. If the pass cannot finish safely, release the lease without advancing so a later run retries the same evidence:
     node tooling/bb-history.mjs release --state plugins/improve-prompt/maintenance/state.json --lease-id <lease_id>

6. Make it ongoing with a bb automation. From the fork root, create a first-party bb automation so newer history is ingested and its prompt-shaper skill updated on a schedule, with no further manual passes from me:
     bb plugin run automations create --project <my-project-id> \
       --name "Prompt Shaper skill refresh" \
       --cron "0 9 * * 1" --timezone <my-timezone> \
       --environment "$PWD" \
       --provider <my-provider-id> --model <my-model> \
       --permission-mode full \
       --prompt "Run one incremental Improve Prompt maintenance batch exactly as plugins/improve-prompt/maintenance/skill-tuning.md describes, then stop."
   --environment "$PWD" reuses this fork checkout, so every run sees the skills/prompt-shaper/ tree and the same checkpoint at plugins/improve-prompt/maintenance/state.json. Confirm the exact flags first with `bb plugin run automations help --project <my-project-id>` (on bb 0.0.32 `create --help` errors before required args). Use `bb plugin run automations` — not a deprecated API. `--permission-mode full` is accepted by every current bb build and is what an unattended edit-and-commit run needs; older builds also list `workspace-write`/`readonly`, which newer builds fold into `accept-edits`, so prefer `full` unless the help output says otherwise.

7. Stay safe across runs. Every scheduled run processes one bounded, checkpointed batch exactly as plugins/improve-prompt/maintenance/skill-tuning.md describes: read new history through the saved cursor, hold its lease so two runs never advance the same cursor, refuse to start if the skills/prompt-shaper/ tree already has uncommitted work (preserving it for me), commit only the skills/prompt-shaper/ tree, and advance the cursor only after that commit succeeds. Treat a null lease_id as caught up; advance a non-null zero-message batch as a verified no-change decision. Report anything conflicting and stop; do not resolve it yourself.

8. Reference, do not reinvent. Follow plugins/improve-prompt/maintenance/skill-tuning.md, tooling/README.md, and docs/provenance.md for implementation and provenance detail instead of restating them.
```
