/** Marks the content shell's <main> while it shows a page (Settings, Plugins, a plugin page) rather than a thread or home. */
export const PAGE_ATTRIBUTE = "data-ambient-page";

const SHELL = '[data-testid="app-layout-content-shell"]';
/** What makes <main> a thread, a composer or home rather than a page. */
const APP_MARKERS = '[data-thread-window], [data-app-composer], [role="img"][aria-label="bb"]';
const MARKER_ATTRIBUTES = ["data-thread-window", "data-app-composer", "role", "aria-label"];

/**
 * Keeps PAGE_ATTRIBUTE on the shell's <main> exactly when it holds no app marker. A route change replaces <main>'s
 * children, so those mutations update at once and a new view never paints with a stale attribute. Other mutations,
 * including a marker attribute changing on a node already in <main>, schedule one check per frame. While the marker
 * found last is still inside <main> and still a marker, that check is a few pointer reads and one match, so a streaming
 * reply costs nothing.
 */
export function mountPageMark(): () => void {
  const root = document.getElementById("root");
  if (!root) return () => undefined;

  let shell: Element | null = null;
  let main: Element | null = null;
  let marker: Element | null = null;
  let frame = 0;

  const update = () => {
    frame = 0;
    if (!shell?.isConnected) shell = root.querySelector(SHELL);
    if (main?.parentElement !== shell) {
      main = shell?.querySelector(":scope > main") ?? null;
      marker = null;
    }
    if (!main) return;
    if (!marker || !main.contains(marker) || !marker.matches(APP_MARKERS)) marker = main.querySelector(APP_MARKERS);
    main.toggleAttribute(PAGE_ATTRIBUTE, marker === null);
  };
  const mutations = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "childList" && (record.target === main || record.target === shell)) {
        cancelAnimationFrame(frame);
        update();
        return;
      }
    }
    if (!frame) frame = requestAnimationFrame(update);
  });
  // PAGE_ATTRIBUTE is not in the filter, so marking <main> never notifies this observer.
  mutations.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: MARKER_ATTRIBUTES });
  update();

  return () => {
    cancelAnimationFrame(frame);
    mutations.disconnect();
    // <main> may have been replaced since it was marked.
    for (const marked of root.querySelectorAll(`[${PAGE_ATTRIBUTE}]`)) marked.removeAttribute(PAGE_ATTRIBUTE);
  };
}
