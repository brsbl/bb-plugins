# Thread Kanban

Threads as a kanban board by section. Every bb thread section becomes a
column, every live top-level thread becomes a card, and dragging a card to
another column moves the thread into that section. A Dashboard view on the
same page shows what is running, what is waiting on you, and thread counts per
section.

![Thread Kanban board with one column per thread section](docs/screenshot.png)

![Thread Kanban dashboard with active, waiting, and per-section threads](docs/dashboard.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/thread-kanban --yes
```

## Use

Open **Thread Kanban** from the sidebar.

- Columns follow your thread sections in the same order as the sidebar,
  including any manual reordering you did there. Threads outside every section
  appear in a leading "No section" column only while any exist.
- Archived, hidden, and child threads stay off the board.
- Drag a card to another column to move that thread into the section. The
  move goes through bb's thread update, so the sidebar follows immediately.
- Click a card to open the thread. Each card shows the thread's live
  status, whether it needs your input or has unread output, and when it was
  last updated.
- Cards use bb's sidebar typography, theme colors, hover colors, and keyboard
  focus ring. Theme changes apply immediately. When Thread Hover Cards is
  installed, hovering or focusing a card opens the same thread preview.
- The board refreshes live from bb thread changes and re-reads sections every
  ten seconds while visible.
- Switch to **Dashboard** with the toggle in the title bar. It lists threads
  active right now, threads waiting on you (a pending question or approval, or
  unread output on an idle thread), and a count per section. Click any thread
  row to open it.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-thread-kanban
bb plugin install "path:$PWD/plugins/thread-kanban" --yes
```
