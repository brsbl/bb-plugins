# Design Doctrine

Design Doctrine turns the product-design feedback you give in bb threads into versioned rules that agents browse and apply while they design, build, and critique. Reach for it when you want an agent's design choices to reflect your own judgment instead of generic defaults.

![Design Doctrine rule library in bb's sidebar](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/design-doctrine --yes
```

## Use

Open the **Design Doctrine** sidebar panel to browse rules, ask an agent to apply your doctrine, or query from the CLI:

```bash
bb doctrine search "<task and surface>"
bb doctrine show ddr_001
```

Each rule is an ordinary Markdown file under `rules/<domain>/`, so Git is its history and rollback. The bundled `design-doctrine` skill loads the rules as a judgment layer over normal design work — it does not replace product requirements, accessibility, or platform conventions.

**Where rules come from.** Every rule traces to concrete feedback you gave directly — something you asked for, corrected, approved, or rejected. Agent output never counts as evidence, and independent repetitions raise a rule's confidence. [`governance.md`](governance.md) defines the allowed evidence and rule changes.

**How rules stay current.** Maintenance is an agent-run bounded pass, not a background automation. [`maintenance/automation-prompt.md`](maintenance/automation-prompt.md) drives one pass: `scripts/scan-history.py` reads new user messages through a saved cursor (by default at most 200 messages or 256 KiB), the agent makes at most five rule-file changes, then validates tests, types, and the build and commits only `rules/`. The pass refuses a dirty rules tree, holds a lease so two runs never process the same messages, and advances its cursor only after a commit or a verified no-change pass.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-design-doctrine
bb plugin install "path:$PWD/plugins/design-doctrine" --yes
```

**Adapt it to your own history.** Fork the repo, keep or clear `rules/`, then run a maintenance pass so your doctrine grows from your feedback. `scan-history.py` reads bb's local database (`~/.bb/bb.db`, overridable with `BB_DB_PATH` or `BB_DATA_DIR`) — every direct user message across your threads, not just this project. Run it from the plugin directory and follow [`maintenance/automation-prompt.md`](maintenance/automation-prompt.md) with an agent:

```bash
cd plugins/design-doctrine
python3 scripts/scan-history.py scan
```

See [import provenance](../../docs/provenance.md) for how this plugin entered the monorepo.
