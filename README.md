# Design Doctrine

Design Doctrine is a Git-backed bb plugin and bundled skill for applying,
reviewing, and maintaining an evidence-backed set of product-design rules.

## What It Provides

| Surface | Job |
| --- | --- |
| **Design Doctrine** panel | Browse and filter active rules, candidates, evidence summaries, and review checks. |
| `bb doctrine` | Search the doctrine and inspect a complete rule from agents or terminals. |
| Bundled `design-doctrine` skill | Retrieve the smallest applicable active rule set during product design and critique. |
| Typed JSON corpus | Validate rule structure, taxonomy, lifecycle, applicability, evidence, and relationships. |
| Maintenance CLI | Incrementally mine bb history, propose candidates, append evidence, rebuild views, and protect human approval boundaries. |

The plugin reads `rules/**/*.json` directly. Generated Markdown, HTML, and
search indexes are rebuildable projections, not a second source of truth.

## Install

Install the public Git repository directly in bb:

```bash
bb plugin install git:https://github.com/brsbl/design-doctrine.git@main --yes
```

For a live development checkout:

```bash
git clone https://github.com/brsbl/design-doctrine.git
cd design-doctrine
npm ci
npm run build
bb plugin install "path:$PWD" --yes
```

The repository ships validated `dist/` artifacts, so a managed Git install does
not need to build the frontend locally.

## Use

Open **Design Doctrine** from bb's sidebar to browse the library. Search covers
statements, rationale, applicability, examples, checks, and evidence summaries.
Each card opens a deep-linkable rule inspector.

Use the compact command surface from agents or terminals:

```bash
bb doctrine status
bb doctrine search "compact utilities"
bb doctrine search "explicit click" --all
bb doctrine show ddr_001
```

Search returns active rules by default. `--all` also includes candidates and
historical lifecycle states.

## Maintain

The Python CLI validates the canonical corpus, runs retrieval evaluations, and
regenerates the derived library files:

```bash
python3 scripts/doctrine.py status
python3 scripts/doctrine.py validate
python3 scripts/doctrine.py verify-evidence
python3 scripts/doctrine.py test
python3 scripts/doctrine.py build
```

Operational state lives in the ignored `maintenance/state.json`; the CLI uses
safe defaults until the file exists. `maintenance/state.example.json` documents
its shape.

To connect the convenience controls to an existing bb automation:

```bash
python3 scripts/doctrine.py configure-automation \
  --automation-id <automation-id> \
  --project-id <project-id>
```

Use `maintenance/automation-prompt.md` as the maintainer prompt. The governance
contract keeps published evidence summaries immutable, requires new automated
evidence to resolve to direct bb user messages, and leaves activation or
semantic policy changes to a human.

## Repository Model

| Material | Role |
| --- | --- |
| `rules/**/*.json` | Canonical typed doctrine |
| `taxonomy.json` and `schema/` | Classification and validation contracts |
| `skills/design-doctrine/SKILL.md` and `governance.md` | Agent workflow and maintenance policy |
| `server.ts` and `app.tsx` | Native bb command and library surfaces |
| `maintenance/` | Automation prompt plus untracked operational state |
| `generated/` | Rebuildable Markdown, HTML, and search projections |
| Git | Diff, attribution, history, and rollback |

The public corpus retains short evidence summaries and anonymous context labels.
It does not contain original bb thread, project, automation, run, or message
locators. New local maintenance evidence can retain resolvable bb provenance in
an unshared checkout.

## Develop

```bash
npm ci
npm run typecheck
npm test
npm run build
python3 scripts/doctrine.py validate
python3 scripts/doctrine.py test
```

After changing plugin code, rebuild and run
`bb plugin reload design-doctrine`. Rule-only changes refresh automatically
after validation and projection rebuilds.

## License

[MIT](LICENSE)
