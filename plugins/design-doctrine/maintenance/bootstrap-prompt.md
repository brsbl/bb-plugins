<!--
  Generated file: do not edit by hand.
  Source template: tooling/bootstrap/bootstrap-prompt.template.md
  Parameters:      catalog/plugins.json personalization entry (design-doctrine)
  Regenerate:      node tooling/bootstrap/render-bootstrap.mjs --write
  Repository hygiene fails if a committed variant drifts from this template.
-->

# Personalize Design Doctrine from your bb history

One copy/paste prompt that adapts Design Doctrine (stable id `design-doctrine`) to your own product-design work and keeps it current without you re-triggering it. Paste it into a fresh bb thread on your fork; the recurring automation it sets up in step 6 does the ongoing maintenance.

```text
You are personalizing the Design Doctrine bb plugin (package `bb-plugin-design-doctrine`, stable id `design-doctrine`) from brsbl/bb-plugins so it reflects my product-design judgment instead of its author's. Work in one worker and do not merge until every step below has passed.

1. Fork and branch. Fork and clone brsbl/bb-plugins and cut a working branch. Read plugins/design-doctrine/README.md and plugins/design-doctrine/maintenance/automation-prompt.md to learn how Design Doctrine is structured and maintained. Keep the `design-doctrine` package and plugin id and do not change plugin runtime behavior beyond its rule library.

2. Seed evidence from my bb threads, through the same checkpoint the automation will use. From the fork root:
     node tooling/bb-history.mjs scan --state plugins/design-doctrine/maintenance/state.json --limit 200 > seed-evidence.json
   This reads new history through Design Doctrine's maintenance checkpoint (plugins/design-doctrine/maintenance/state.json) and takes a lease. Redaction of emails, URLs, bb ids, secrets, and local paths is best-effort and relayed [bb ...] messages are skipped, so preview seed-evidence.json and decide what anonymous signal to keep — repeats only, never one-offs or agent output. Note the returned lease_id and cursor_commit; you advance them in step 5.

3. Adapt the plugin and its companion skill. Turn each durable signal into a versioned rule under rules/<domain>/ following governance.md, or clear rules/ first to grow doctrine from your own judgment. Leave the bundled design-doctrine skill in place; it reads whatever rules you keep. Rules carry short, anonymous evidence lines only.

4. Install, test, and validate:
     npm ci
     npm run check --workspace=bb-plugin-design-doctrine
     bb plugin install "path:$PWD/plugins/design-doctrine" --yes
   Exercise it in a real thread before trusting it.

5. Land the initial pass on the checkpoint before automating, so the automation starts on a clean tree with nothing to reprocess. Once step 4 passes: if the adaptation produced artifact changes, stage and commit only the rules/ tree — plugins/design-doctrine/rules can hold new untracked files, so add before committing — then advance the seed cursor:
     git add -- plugins/design-doctrine/rules
     git commit --only -m "design-doctrine: <what changed>" -- plugins/design-doctrine/rules
     node tooling/bb-history.mjs advance --state plugins/design-doctrine/maintenance/state.json --created-at <cursor_commit.created_at> --segment-id <cursor_commit.segment_id> --lease-id <lease_id>
   For a verified no-change batch — a non-null lease_id where you made no edits (skipped relays still move the cursor) — skip the add and commit but still advance. If the seed returned a null lease_id there was no new history; do nothing. If the pass cannot finish safely, release the lease without advancing so a later run retries the same evidence:
     node tooling/bb-history.mjs release --state plugins/design-doctrine/maintenance/state.json --lease-id <lease_id>

6. Make it ongoing with a bb automation. From the fork root, create a first-party bb automation so newer history is ingested and its rule library updated on a schedule, with no further manual passes from me:
     bb plugin run automations create --project <my-project-id> \
       --name "Design Doctrine refresh" \
       --cron "0 9 * * 1" --timezone <my-timezone> \
       --environment "$PWD" \
       --provider <my-provider-id> --model <my-model> \
       --permission-mode full \
       --prompt "Run one incremental Design Doctrine maintenance batch exactly as plugins/design-doctrine/maintenance/automation-prompt.md describes, then stop."
   --environment "$PWD" reuses this fork checkout, so every run sees the rules/ tree and the same checkpoint at plugins/design-doctrine/maintenance/state.json. Confirm the exact flags first with `bb plugin run automations help --project <my-project-id>` (on bb 0.0.32 `create --help` errors before required args). Use `bb plugin run automations` — not a deprecated API. `--permission-mode full` is accepted by every current bb build and is what an unattended edit-and-commit run needs; older builds also list `workspace-write`/`readonly`, which newer builds fold into `accept-edits`, so prefer `full` unless the help output says otherwise.

7. Stay safe across runs. Every scheduled run processes one bounded, checkpointed batch exactly as plugins/design-doctrine/maintenance/automation-prompt.md describes: read new history through the saved cursor, hold its lease so two runs never advance the same cursor, refuse to start if the rules/ tree already has uncommitted work (preserving it for me), commit only the rules/ tree, and advance the cursor only after that commit succeeds. Treat a null lease_id as caught up; advance a non-null zero-message batch as a verified no-change decision. Report anything conflicting and stop; do not resolve it yourself.

8. Reference, do not reinvent. Follow plugins/design-doctrine/maintenance/automation-prompt.md, tooling/README.md, and docs/provenance.md for implementation and provenance detail instead of restating them.
```
