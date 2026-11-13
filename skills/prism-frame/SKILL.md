---
name: prism-frame
description: Control the animated theme-derived app frame and glass mention pills provided by Prism Frame.
---

Use `bb prism-frame status|on|off` to inspect, enable, or disable the effect. Change motion with `bb plugin config prism-frame set motion still|slow|flowing`, intensity with `bb plugin config prism-frame set strength subtle|balanced|vivid`, and mention styling with `bb plugin config prism-frame set pills true|false`. These are the same settings shown on the plugin's settings page.

The shader and all pill colors derive from the active theme. Switch themes through `bb theme set <id>`; do not edit the user's theme file to adjust this plugin. Reduced motion produces a still image, and hidden tabs pause. The shader covers the existing app frame, left navigation rail, and outer window title bar backgrounds. It sits behind controls with no pointer interaction or layout changes. Missing WebGL uses a static gradient. Turning the plugin off restores the theme's original frame and pill styling.

Thread, workspace, and page headers keep their normal theme backgrounds.
