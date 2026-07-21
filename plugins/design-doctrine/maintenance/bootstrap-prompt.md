<!--
  Generated file: do not edit by hand.
  Source template: tooling/bootstrap/bootstrap-prompt.template.md
  Parameters:      catalog/plugins.json personalization entry (design-doctrine)
  Regenerate:      node tooling/bootstrap/render-bootstrap.mjs --write
  Repository hygiene fails if a committed variant drifts from this template.
-->

# Personalize Design Doctrine from your bb history

One copy/paste prompt that adapts Design Doctrine (stable id `design-doctrine`) to your own product-design work and keeps it current without you re-triggering it. Paste it into a fresh bb thread on your fork; the recurring automation it sets up in step 5 does the ongoing maintenance.

```text
You are personalizing the Design Doctrine bb plugin (package `bb-plugin-design-doctrine`, stable id `design-doctrine`) from brsbl/bb-plugins so it reflects my product-design judgment instead of its author's. Work in one worker and do not merge until every step below has passed.

1. Fork and branch. Fork and clone brsbl/bb-plugins and cut a working branch. Read plugins/design-doctrine/README.md and plugins/design-doctrine/maintenance/automation-prompt.md to learn how Design Doctrine is structured and maintained. Keep the `design-doctrine` package and plugin id and do not change plugin runtime behavior beyond its rule library.

2. Seed evidence from my bb threads. Collect my own direct feedback as redacted, previewable evidence — never paste raw transcripts:
     node tooling/bb-history.mjs scan --state ./.bb-evidence-state.json --limit 200 --format jsonl > seed-evidence.jsonl
   The reader redacts emails, URLs, bb ids, secrets, and local paths by default and skips relayed [bb ...] messages. Review seed-evidence.jsonl and keep only durable signal that repeats; ignore one-offs and anything an agent produced.

3. Adapt the plugin and its companion skill. Turn each durable signal into a versioned rule under rules/<domain>/ following governance.md, or clear rules/ first to grow doctrine from your own judgment. Leave the bundled design-doctrine skill in place; it reads whatever rules you keep. Rules carry short, anonymous evidence lines only.

4. Install, test, and validate:
     npm ci
     npm run check --workspace=bb-plugin-design-doctrine
     bb plugin install "path:$PWD/plugins/design-doctrine" --yes
   Exercise it in a real thread before trusting it.

5. Make it ongoing with a bb automation. Create a first-party bb automation so newer history is ingested and its rule library updated on a schedule, with no further manual passes from me:
     bb plugin run automations create --project <my-project-id> \
       --name "Design Doctrine refresh" \
       --cron "0 9 * * 1" --timezone <my-timezone> \
       --provider <my-provider-id> --model <my-model> \
       --permission-mode full \
       --prompt "Run one incremental Design Doctrine maintenance batch exactly as plugins/design-doctrine/maintenance/automation-prompt.md describes, then stop."
   Confirm the exact flags first with `bb plugin run automations create --help`. Use `bb plugin run automations` — not a deprecated API. `--permission-mode full` is accepted by every current bb build and is what an unattended edit-and-commit run needs; older builds also list `workspace-write`/`readonly`, which newer builds fold into `accept-edits`, so prefer `full` unless help output says otherwise.

6. Stay safe across runs. Every scheduled run processes one bounded, checkpointed batch exactly as plugins/design-doctrine/maintenance/automation-prompt.md describes: read new history through the saved cursor, hold its lease so two runs never advance the same cursor, refuse to start if the rules/ tree already has uncommitted work (preserving it for me), commit only the rules/ tree, and advance the cursor only after that commit succeeds. Report anything conflicting and stop; do not resolve it yourself.

7. Reference, do not reinvent. Follow plugins/design-doctrine/maintenance/automation-prompt.md, tooling/README.md, and docs/provenance.md for implementation and provenance detail instead of restating them.
```
