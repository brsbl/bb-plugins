---
name: desktop-apps
description: Make a bb plugin open in the Desktop plugin's Windows XP windows, Start menu, and Quick Launch. Use when a plugin author wants their panel, tool, or controls to be a Desktop "program", or asks to make a plugin compatible with Desktop.
---

# Desktop apps

The Desktop plugin turns bb's new-thread page into Windows XP. Any plugin can opt in so its UI opens as an XP window on that desktop:

- The app appears under **Programs** in the Start menu and can be pinned to **Quick Launch**.
- Opening it creates a draggable, resizable, minimizable XP window with a taskbar button.
- The plugin renders its own React UI inside the window. Its SDK hooks (`useRpc`, `useSettings`, sidebar threads, and so on) keep working, because the UI is portaled from one of the plugin's own slots.

Opting in is optional and safe: when Desktop is not installed, turned off, or on a phone-sized screen, nothing renders and the plugin behaves as before.

## Steps

1. Copy [desktop-app.tsx](desktop-app.tsx) into the plugin (for example `desktop-app.tsx` next to `app.tsx`). It has no dependencies beyond React.
2. Register a homepage section that renders `DesktopApp`. Desktop hides this section automatically; it only exists to keep the app mounted on the page where the desktop lives.

```tsx
import { definePluginApp } from "@get-bb/plugin-sdk/app";

import { DesktopApp } from "./desktop-app";
import { MyPanel } from "./my-panel";

export default definePluginApp((app) => {
  app.slots.homepageSection({
    id: "desktop-app",
    title: "My plugin",
    component: () => (
      <DesktopApp
        app={{
          pluginId: "my-plugin",
          id: "main",
          title: "My plugin",
          description: "One line for the Start menu",
          icon: "/api/v1/plugins/my-plugin/assets/icon.svg",
          width: 420,
          height: 520,
        }}
      >
        {() => <MyPanel />}
      </DesktopApp>
    ),
  });
});
```

3. Optional: open the window from elsewhere in your plugin, falling back to your normal UI when Desktop is not active.

```tsx
import { openInDesktop } from "./desktop-app";

if (!openInDesktop("my-plugin", "main")) {
  openMyUsualPanel();
}
```

## Fields

| Field | Required | Meaning |
| --- | --- | --- |
| `pluginId` | Yes | Your plugin's id (letters, digits, `-`, `_`). Use the same value every time; it keys saved windows and Quick Launch pins. |
| `id` | Yes | The app's id within your plugin. Register several apps with different ids if you have several tools. |
| `title` | Yes | Window title, taskbar button, Start menu, and Quick Launch label (80 characters max). |
| `description` | No | One line under the title in the Start menu. |
| `icon` | No | An image URL: a same-origin path such as your plugin's asset route, an `https:` URL, or a `data:image/` URI. Without one, Desktop shows a generic program icon. |
| `width`, `height` | No | The window's first size in CSS pixels (240 to 2000). |

`children` is a function that receives the window's id and returns the UI to render in that window. It renders once per open window of the app (Desktop opens at most one window per app).

## Design

Your UI sits inside an XP window body. Keep bb's own components and tokens for the content; Desktop supplies the window chrome. For icons, follow the icon rules in Desktop's `docs/DESIGN.md` if you want the app to feel native: an angled object lit from the upper left, a colored outline, and room for a soft drop shadow.

## Sidebar footer panels need nothing

If your plugin already has a sidebar footer panel (`experimental_sidebarFooter` with `kind: "disclosure"`), Desktop shows that panel as an XP window when the sidebar is collapsed, with no changes on your side. Use a Desktop app when you want a real window with a taskbar button and a Start menu entry.

## Contract

- Desktop publishes `window.bbDesktopApps` with `version: 1` and dispatches a `bb-desktop-apps:ready` event when it loads or reloads. The helper waits for that event, so load order does not matter.
- `registerApp` returns an unregister function; the helper calls it on unmount. Registering the same `pluginId`/`id` again replaces the earlier registration.
- Invalid registrations are ignored with a console warning.
- The registry lives in the browser tab. There is no CLI for it, because the apps exist only while their plugins are loaded in a bb window.
- A future breaking change would ship as a new `version`; the helper only talks to version 1.
