// BB shared-ui at b33abbff098ac4c857578e7350d492dcaa65d489.
// Menus portal outside the mount, so they need their own plugin style root.
declare const __BB_PLUGIN_ID__: string | undefined;

export function usePortalScopeProps() {
  return {
    "data-bb-portaled-overlay": "",
    "data-bb-plugin-root": "",
    "data-bb-plugin": typeof __BB_PLUGIN_ID__ === "string" ? __BB_PLUGIN_ID__ : "video-markup",
  };
}
