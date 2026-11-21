/** Hide scrolling content behind composers without painting over Ambient's glass. */
export function mountScrollClip(): () => void {
  const root = document.getElementById("root");
  if (!root) return () => undefined;

  const clipped = new Set<HTMLElement>();
  const observed = new Set<Element>();
  let insetPanes = new Set<HTMLElement>();
  const insetProperty = "--ambient-thread-inset-end";
  let frame = 0;

  const measure = () => {
    frame = 0;
    const nextClipped = new Set<HTMLElement>();
    const nextObserved = new Set<Element>();
    const nextInsetPanes = new Set<HTMLElement>();
    const clip = (content: HTMLElement, edge: Element, viewport: Element) => {
      const bounds = content.getBoundingClientRect();
      const bottom = Math.min(bounds.height, Math.max(0, bounds.bottom - edge.getBoundingClientRect().top));
      const value = `${Math.ceil(bottom)}px`;
      if (content.style.getPropertyValue("--ambient-scroll-clip-bottom") !== value) {
        content.style.setProperty("--ambient-scroll-clip-bottom", value);
      }
      if (!clipped.has(content)) content.setAttribute("data-ambient-scroll-clip", "");
      nextClipped.add(content);
      for (const element of [content, edge, viewport]) nextObserved.add(element);
    };

    for (const footer of root.querySelectorAll<HTMLElement>("[data-thread-window] [data-scroll-footer]")) {
      // bb may put an invisible scroll floor first; the transcript is the element just above the footer.
      const content = footer.previousElementSibling;
      const viewport = footer.closest(".thread-scrollbar");
      if (content instanceof HTMLElement && viewport) clip(content, footer, viewport);

      // bb reserves room for a context card on the scroll content. Its header and glass are ancestors.
      const container = footer.parentElement;
      if (!container || container.parentElement !== viewport) continue;
      nextObserved.add(container);
      const inset = container.style.paddingInlineEnd;
      const pane = footer.closest<HTMLElement>("[data-split-pane-id]") ?? footer.closest<HTMLElement>("[data-thread-window]");
      if (pane && inset) {
        if (pane.style.getPropertyValue(insetProperty) !== inset) pane.style.setProperty(insetProperty, inset);
        nextInsetPanes.add(pane);
      }
    }
    for (const home of root.querySelectorAll("[data-testid=root-compose-compact-home]")) {
      const composer = home.querySelector("[data-testid=root-compose-compact-composer]");
      const viewport = home.querySelector("[data-testid=root-compose-compact-scroll-viewport]");
      const recent = home.querySelector("[data-root-compose-mobile-recents]");
      if (!composer || !viewport || !recent) continue;
      // Clip the rows, not the glass pane: clipping the pane would isolate its backdrop blur.
      for (const child of recent.children) {
        if (child instanceof HTMLElement) clip(child, composer, viewport);
      }
    }
    for (const pane of insetPanes) {
      if (!nextInsetPanes.has(pane)) pane.style.removeProperty(insetProperty);
    }
    insetPanes = nextInsetPanes;
    for (const element of clipped) {
      if (!nextClipped.has(element)) clear(element);
    }
    clipped.clear();
    for (const element of nextClipped) clipped.add(element);
    for (const element of observed) {
      if (!nextObserved.has(element)) resize.unobserve(element);
    }
    for (const element of nextObserved) {
      if (!observed.has(element)) resize.observe(element);
    }
    observed.clear();
    for (const element of nextObserved) observed.add(element);
  };
  const clear = (element: HTMLElement) => {
    element.style.removeProperty("--ambient-scroll-clip-bottom");
    element.removeAttribute("data-ambient-scroll-clip");
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(measure);
  };
  const resize = new ResizeObserver(schedule);
  const mutations = new MutationObserver(schedule);
  mutations.observe(root, { childList: true, subtree: true });
  document.addEventListener("scroll", schedule, true);
  window.addEventListener("resize", schedule);
  measure();

  return () => {
    cancelAnimationFrame(frame);
    resize.disconnect();
    for (const pane of insetPanes) pane.style.removeProperty(insetProperty);
    mutations.disconnect();
    document.removeEventListener("scroll", schedule, true);
    window.removeEventListener("resize", schedule);
    for (const element of clipped) clear(element);
  };
}
