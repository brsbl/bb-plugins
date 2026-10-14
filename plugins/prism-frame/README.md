# Prism Frame

Prism Frame adds a slowly moving WebGL sheen across bb's app frame, left navigation rail, and outer window title bar and colors mention pills from the active theme. It is a standalone plugin; no bb core changes or theme-file edits are required.

![Light frame with normal and selected mention pills](https://github.com/user-attachments/assets/b9ac396f-a79e-49f5-9fd6-44b512067efb)

![Dark frame with normal and selected mention pills](https://github.com/user-attachments/assets/961e1f3f-9831-412e-b344-0e1354a3509d)

## Install

Requires bb 0.46 or newer. Once merged, install with:

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/prism-frame --yes
```

## Use

Its controls appear in Settings → Plugins → Prism Frame.

- `bb prism-frame status` shows the effective settings.
- `bb prism-frame on` enables the frame and the configured pill treatment.
- `bb prism-frame off` restores the active theme's original styling.
- `bb plugin config prism-frame set motion still|slow|flowing` changes motion.
- `bb plugin config prism-frame set strength subtle|balanced|vivid` changes iridescence.
- `bb plugin config prism-frame set pills true|false` controls mention styling separately.

The SDK exposes the same settings through the plugin settings API; the built-in plugin configuration CLI and settings form share that API.

## Theme derivation

The plugin resolves the active theme's computed canvas, ink, foreground, sidebar, sidebar accent, card, primary, timeline accent, border, and selected-surface colors, including CSS variables and translucent colors. Transparent tokens are composited over the canvas before derivation.

The frame retains the sidebar color and sidebar accent. Primary and timeline colors contribute separate reflections, mixed in OKLCH with brightness bounded relative to the existing surface. Moving bands travel between these colors without averaging every accent together or introducing new hue rotations. No named theme has a special case or stored palette.

Pill fills combine the card with that palette. Selected fills additionally incorporate the theme's selected surface. Text and icons start from the theme's foreground and ink; their lightness is adjusted only when needed to reach 4.6:1 against all normal/selected gradient stops. Borders, selected borders, highlights, and shadows derive from their corresponding theme colors. This is a local pill contrast check, not an accessibility guarantee for the entire app.

The plugin reacts to theme stylesheet replacement, light/dark/system changes, and route remounts. It paints behind the existing app frame, navigation rail, and outer window title bar without moving the app's layout. The surfaces share one animation clock and window coordinates, keeping their colors continuous. Content panels retain their existing surfaces. The frame is independent of Ambient.

## Lifecycle and cost

Rendering is capped at 30 fps and 900,000 shader pixels shared across the painted surfaces. Hidden tabs stop rendering; reduced motion and Still mode draw a static frame. WebGL failure or context loss leaves a static theme-derived gradient. Context restoration rebuilds the shader. Disabling or unloading removes the canvas, styles, observers, listeners, and GPU resources.

## Develop

From the repository root, use `npm run check --workspace=bb-plugin-prism-frame` for the plugin’s typecheck, build, and color regression checks. CI builds and publishes the install branch after merge. `bb plugin dev plugins/prism-frame` supports live iteration. Runtime imports are limited to bb’s shared React and public Plugin SDK.

Thread, workspace, and page headers keep their normal theme backgrounds.

## Verification

Verified in an isolated source bb app in Chrome for Testing and in the macOS Electron development app. All 11 user themes were captured in light and dark with the plugin disabled and enabled, including normal and selected mention pills. The 44 desktop renderer captures used a 1280 × 900 viewport at 2× density; OS traffic lights and window shadows were excluded. Sampled normal/selected text and icon contrast across three intensity levels stayed above 4.5:1.

The web interaction pass covered theme changes, navigation, reload, reduced motion, disable/reenable, and WebGL context loss and restoration.
