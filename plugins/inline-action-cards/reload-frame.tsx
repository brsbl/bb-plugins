import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";

// The timeline remounts offscreen directives. Reserve their measured space until
// the RPC returns so a short loading card cannot move the reader's scroll anchor.
const sizes = new Map<string, { width: number; height: number }>();
const maxEntries = 500;

export function ReloadFrame({ cacheKey, children }: { cacheKey: string; children: (loaded: () => void) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [previous] = useState(() => sizes.get(cacheKey));
  const [loaded, setLoaded] = useState(false);
  const onLoaded = useCallback(() => setLoaded(true), []);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      const { width, height } = node.getBoundingClientRect();
      if (!loaded) {
        // A measurement from another layout cannot predict this card's height.
        node.style.minHeight = previous && Math.abs(previous.width - width) < 1 ? `${previous.height}px` : "";
      } else if (width > 0 && height > 0) {
        sizes.delete(cacheKey);
        sizes.set(cacheKey, { width, height });
        if (sizes.size > maxEntries) sizes.delete(sizes.keys().next().value!);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [cacheKey, loaded, previous]);
  return <div className="iac-container" ref={ref} style={{ minHeight: !loaded ? previous?.height : undefined }}>{children(onLoaded)}</div>;
}
