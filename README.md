# Thread Hover Cards

Busy sidebars make it hard to remember what every thread is doing. Thread Hover Cards gives you the useful context—status, latest agent message, execution details, repository, and pull request—without making you open each one, and does the same for a whole section without making you expand it.

![A bb thread hover card showing live worker context](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/thread-hover-cards --yes
```

## Use

Hover over a thread row, or focus it with the keyboard. Its card opens beside the row while your active thread stays put.

Section headers get their own card, which is the only way to see inside a section without expanding it — a collapsed section renders none of its rows.

![A bb section hover card over a collapsed sidebar section](docs/screenshot-section.png)

| Card | What it answers |
| --- | --- |
| Thread row | What is this thread doing right now? |
| Section header | How much is in here, and does any of it need me? |

The section card only carries what reading the whole section would tell you. Thread titles are one click away and the row already shows its own activity glyph, so neither is repeated here. Every figure on it has to answer a question and trigger an action, which is what rules out anything time-based.

| Band | Carries | Answers |
| --- | --- | --- |
| Context | `moss · Personal +3` | Where does this work actually live? A section is not scoped to one project. |
| Headline | `2 questions` `1 failed` | Is something waiting on me, and is it an answer or a fix? |
| Counts | `9 threads` `1 working` `0 unread` | How much is here, how much is moving, how much have I not seen? |

The headline is **absent** when nothing wants action — not replaced with a reassurance line. Questions take foreground weight with a muted glyph and only failures are red, matching bb's own sidebar, so a routine prompt does not read as an incident. Counts hold fixed positions and dim at zero rather than disappearing, so the row can be read by position.

Unread follows bb's own rule, so the count agrees with the app. A section nested under a project counts only that project's threads. Built-in groups such as Pinned and Unorganized reuse the same header markup but are not sections, so they get no card.

Resolving a section name costs bb's `/sidebar-bootstrap`, so a background service keeps that directory warm and the hover never pays for it — a section hover is one scoped thread query, around 15ms.

Both cards are a sighted-pointer convenience layered over information the sidebar already gives you another way, and only one is ever open at a time.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-thread-hover-cards
bb plugin install "path:$PWD/plugins/thread-hover-cards" --yes
```
