# Color Swatches

Renders an inline swatch beside every color literal in a thread — hex, `rgb()`,
`hsl()`, `oklch()` and friends — the way an editor decorates code.

![Color Swatches in bb](docs/screenshot.png)

## Install

```sh
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/color-swatches --yes
```

## Use

Nothing to configure. Once installed, any color literal an agent writes gets a
chip in front of it: inside fenced code blocks, inside diffs, and in the inline
`` `#070509` `` chips that appear in prose.

The chip shows alpha over a checkerboard and carries a faint ring, so
`#ffffff` and `#000000` stay visible on any theme.

Two deliberate limits:

- **Nothing is inserted into the page.** The chip is drawn in `::before` from a
  custom property, so selecting and copying a line still yields exactly the
  original text, and a streaming message can never end up with a stale wrapper
  in it.
- **A chip only appears where it can be placed exactly.** bb highlights code one
  token per element, so a literal reliably starts at a boundary; in an
  unhighlighted block a literal can begin mid-run, and the plugin leaves it
  alone rather than putting the chip in the wrong column.

The composer is never decorated.

## Develop

```sh
npm install
npm run check   # typecheck, build, test
bb plugin install "path:$PWD" --yes
```
