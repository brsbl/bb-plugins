<!--
  Generated file: do not edit by hand.
  Source template: tooling/bootstrap/bootstrap-prompt.template.md
  Parameters:      tooling/bootstrap/variants.json ({{VARIANT_KEY}})
  Regenerate:      node tooling/bootstrap/render-bootstrap.mjs --write
  Repository hygiene fails if a committed variant drifts from this template.
-->

# Personalize {{PLUGIN_NAME}} from your bb history

One copy/paste prompt that adapts {{PLUGIN_NAME}} (stable id `{{PLUGIN_ID}}`) to your own product-design work and keeps it current without you re-triggering it. Paste it into a fresh bb thread on your fork; the recurring automation it sets up in step 5 does the ongoing maintenance.

```text
You are personalizing the {{PLUGIN_NAME}} bb plugin (package `{{PACKAGE_NAME}}`, stable id `{{PLUGIN_ID}}`) from brsbl/bb-plugins so it reflects my product-design judgment instead of its author's. Work in one worker and do not merge until every step below has passed.

1. Fork and branch. Fork and clone brsbl/bb-plugins and cut a working branch. Read {{PLUGIN_README}} and {{MAINTENANCE_DOC}} to learn how {{PLUGIN_NAME}} is structured and maintained. Keep the `{{PLUGIN_ID}}` package and plugin id and do not change plugin runtime behavior beyond {{ARTIFACT}}.

2. Seed evidence from my bb threads. Collect my own direct feedback as redacted, previewable evidence — never paste raw transcripts:
     node tooling/bb-history.mjs scan --state ./.bb-evidence-state.json {{EVIDENCE_FILTERS}} --format jsonl > {{EVIDENCE_FILE}}
   The reader redacts emails, URLs, bb ids, secrets, and local paths by default and skips relayed [bb ...] messages. Review {{EVIDENCE_FILE}} and keep only durable signal that repeats; ignore one-offs and anything an agent produced.

3. Adapt the plugin and its companion skill. {{ADAPT_INSTRUCTION}}

4. Install, test, and validate:
     npm ci
     npm run check --workspace={{PACKAGE_NAME}}
     bb plugin install "path:$PWD/{{PLUGIN_SOURCE}}" --yes
   Exercise it in a real thread before trusting it.

5. Make it ongoing with a bb automation. Create a first-party bb automation so newer history is ingested and {{ARTIFACT}} updated on a schedule, with no further manual passes from me:
     bb plugin run automations create --project <my-project-id> \
       --name "{{AUTOMATION_NAME}}" \
       --cron "{{CRON}}" --timezone <my-timezone> \
       --provider <my-provider-id> --model <my-model> \
       --permission-mode full \
       --prompt "Run one incremental {{PLUGIN_NAME}} maintenance batch exactly as {{MAINTENANCE_DOC}} describes, then stop."
   Confirm the exact flags first with `bb plugin run automations create --help`. Use `bb plugin run automations` — not a deprecated API. `--permission-mode full` is accepted by every current bb build and is what an unattended edit-and-commit run needs; older builds also list `workspace-write`/`readonly`, which newer builds fold into `accept-edits`, so prefer `full` unless help output says otherwise.

6. Stay safe across runs. Every scheduled run processes one bounded, checkpointed batch exactly as {{MAINTENANCE_DOC}} describes: read new history through the saved cursor, hold its lease so two runs never advance the same cursor, refuse to start if {{ARTIFACT_TREE}} already has uncommitted work (preserving it for me), commit only {{ARTIFACT_TREE}}, and advance the cursor only after that commit succeeds. Report anything conflicting and stop; do not resolve it yourself.

7. Reference, do not reinvent. Follow {{MAINTENANCE_DOC}}, tooling/README.md, and docs/provenance.md for implementation and provenance detail instead of restating them.
```
