/**
 * Keep Radix portals inside the active renderer's isolated CSS scope.
 * The plugin and standalone app share the same vendored components.
 */
export function usePortalScopeProps(): {
  "data-bb-plugin-root"?: "";
  "data-pattern-atlas-root"?: "";
} {
  if (
    typeof document !== "undefined" &&
    document.querySelector("[data-pattern-atlas-root]")
  ) {
    return { "data-pattern-atlas-root": "" };
  }
  return { "data-bb-plugin-root": "" };
}
