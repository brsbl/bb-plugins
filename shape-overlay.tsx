import { useLayoutEffect, useRef, useState } from "react";
import { annotationGeometry } from "./annotation-geometry.js";
import type { Shape } from "./model.js";

export function ShapeOverlay({shapes, noteNumber}: {shapes: Shape[]; noteNumber?: number}) {
  const svg = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({width: 0, height: 0});
  useLayoutEffect(() => {
    const element = svg.current;
    if (!element) return;
    const measure = () => {
      const {width, height} = element.getBoundingClientRect();
      setSize({width, height});
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  // No stretched viewBox: strokes, arrowheads and labels stay round and readable
  // at any video aspect ratio or panel width. Saved coordinates remain normalized.
  return <svg ref={svg} className="video-markup-shapes" aria-hidden="true">
    {size.width > 0 && shapes.map((shape, index) => {
      const {outline, head, marker} = annotationGeometry(shape, size.width, size.height);
      return <g key={index}>
        {(["outer", "inner", "accent"] as const).map(layer => <g key={layer} className={`video-markup-shape-${layer}`}>
          <path d={outline} fill="none" strokeDasharray={shape.kind === "zoom" ? "8 5" : undefined} />
          {head && <path d={head} className="video-markup-arrowhead" />}
        </g>)}
        {noteNumber !== undefined && <g transform={`translate(${marker.x} ${marker.y})`}>
          <circle r="12" className="video-markup-shape-label" />
          <text className="video-markup-shape-number" textAnchor="middle" dominantBaseline="central">{noteNumber}</text>
        </g>}
      </g>;
    })}
  </svg>;
}
