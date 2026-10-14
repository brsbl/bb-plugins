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

## Theme derivation

Colors come from the active theme's computed surface, text, border, primary, and timeline tokens. Transparent tokens are composited over the canvas.

The frame retains the sidebar color and sidebar accent. Primary and timeline colors contribute separate OKLCH reflections with bounded brightness. No named theme has a special case or stored palette.

Pill fills combine the card with that palette; selection adds the theme's selected surface. Text and icon lightness adjusts toward 4.6:1 contrast against all normal and selected gradient stops. Borders, highlights, and shadows also use theme tokens. This check covers pill colors, not the entire app.

Theme changes and route remounts update the effect. The frame, rail, and title bar share one animation clock and window coordinates. The frame layer is masked to the window padding, preserving Ambient behind content.

## Lifecycle and cost

Rendering is capped at 30 fps and 900,000 shader pixels across all surfaces. Hidden tabs pause; reduced motion and Still mode draw once. WebGL failure leaves a static gradient and stops animation when all renderers are unavailable. Restoration resumes rendering. Disabling or unloading removes styles, canvases, observers, listeners, and GPU resources.

## Develop

From the repository root, use `npm run check --workspace=bb-plugin-prism-frame` for the plugin’s typecheck, build, and color regression checks. CI builds and publishes the install branch after merge. `bb plugin dev plugins/prism-frame` supports live iteration. Runtime imports are limited to bb’s shared React and public Plugin SDK.

Thread, workspace, and page headers keep their normal theme backgrounds.

