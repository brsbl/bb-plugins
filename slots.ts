/** Marks plugin-owned DOM that renders outside `.bbd-root` scopes, such as portals on `document.body`. */
export const PLUGIN_SCOPE = { "data-bb-plugin": "desktop" } as const;

/** bb's DOM id for the Desktop homepage section registered in `app.tsx`. */
export const HOMEPAGE_SLOT_ID = "plugin-homepage:desktop:desktop";

/** bb's test id for the Desktop footer action registered in `app.tsx`; the tray skips mirroring it. */
export const OWN_FOOTER_ITEM = "plugin-sidebar-footer-action-desktop-toggle";
