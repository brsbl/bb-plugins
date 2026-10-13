# Theme Preview

A skeleton of the bb app in every configuration — sidebar, splits, side panels,
overlays, real thread timelines and controls — drawn from the active theme's
tokens, so a palette can be judged on app-shaped surfaces before it ships.

![Theme Preview in bb](docs/screenshot.png)

## Install

Requires bb 0.38 or newer.

```sh
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/theme-preview --yes
```

## Use

Open **Theme Preview** from the sidebar.

- **Main stage:** an app mock at bb's real sizes — thread, timeline TOC, side
  panel, and the overlays that sit on top of them. Switch views with the compact
  control in the top bar: Thread · New thread · Split · Settings.
- **Right:** the live theme picker and surface values. Picking a theme applies
  it immediately.
- **Below:** the style guide — type, visual-only control specimens, sidebar row
  states, and resolved ink, accent, status, and line tokens. Ink and status
  values include their WCAG ratio against the surface they sit on (4.5:1 is the
  pass mark).

The picker is one control for palette and mode: each row previews the theme it
names with its own colours and typefaces, and picking a row applies both at
once. It lists everything you have — custom themes, plugin themes, and bb's
bundled palettes.

### Iterating on a theme with an agent

The panel is built for a split: your agent in one pane, this preview in the
other.

1. Open a thread and ask an agent to edit your theme's CSS
   (`<data-dir>/theme/<name>/theme.css`, or a plugin theme's `bb.themes[].css`).
2. Open Theme Preview in a split beside it (⌘⇧O on the sidebar row).
3. Keep prompting. The plugin's background watcher detects custom-theme edits
   and tells every open preview to refresh immediately. The panel also checks
   the active custom or plugin theme's file as a fallback; when it changes, the
   plugin re-applies the palette. The mock, token values and ratios update on
   their own — and so does the rest of bb, since re-applying pushes the palette
   to every open window.

No copy-paste, no restart, no reload: the agent writes the file and you watch
the surfaces change.

The plugin ships a skill, **bb-theme-authoring**, that is injected into agent
threads while the plugin is installed. It tells the agent where themes live,
the file shape and token vocabulary, how bb uses each token, how to apply and
verify a theme, and that this panel live-reloads — so "make me a theme" works
without the user explaining any of it.

## Develop

```sh
npm install
npm run check   # typecheck, build, test
bb plugin install "path:$PWD" --yes
```

The preview reads CSS custom properties directly (`var(--sidebar)`,
`var(--surface-selected)`, …) rather than Tailwind classes, so it renders the
same under any host build.
