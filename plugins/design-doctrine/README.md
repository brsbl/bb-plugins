# Design Doctrine

Design Doctrine turns repeated product-design feedback into a set of rules, and
applies them while you design, build, and review. It's a plugin for
[bb](https://github.com/ymichael/bb): a panel for browsing the rules, a
`bb doctrine` command, and a skill that pulls the relevant ones into design
work.

Each rule is one Markdown file in `rules/<domain>/`, with YAML frontmatter for
the facts you filter on — kind, strength, confidence, status, surfaces — and
plain sections for the content: Why, Prefer, Avoid, Use when, Do not use when,
Evidence, Check.

## Install

```bash
bb plugin install git:https://github.com/brsbl/design-doctrine.git@main --yes
```

From a checkout: `npm ci && npm run build`, then
`bb plugin install "path:$PWD" --yes`.

## Use

Open **Design Doctrine** in bb's sidebar to browse. Agents load the skill on
their own for design, implementation, and critique — or just ask: "review this
toolbar against my design doctrine."

```bash
bb doctrine status                        # rule counts and Git state
bb doctrine search "compact utilities"    # rules in use
bb doctrine search "explicit click" --all # plus conflicted and retired
bb doctrine show ddr_001
```

## Updates

Rules come from real design feedback in bb, and go live at whatever confidence
their evidence supports. Repeated feedback raises confidence; contradictory
feedback narrows, replaces, or retires a rule. `scripts/scan-history.py` reads
new feedback and `maintenance/automation-prompt.md` is the pass that acts on it.
Git is the history and the undo button. See `governance.md`.

## Development

```bash
npm ci && npm run typecheck && npm test && npm run build
```

After changing plugin code, run `bb plugin reload design-doctrine`.

## Privacy and license

Rules carry short, anonymous evidence lines — not bb messages, thread IDs, or
source locators. [MIT](LICENSE).
