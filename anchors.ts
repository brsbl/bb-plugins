export interface StoredSelector {
  version: 1;
  coordinateSpace: "rendered-text-utf16";
  start: number;
  end: number;
  exact: string;
  prefix: string;
  suffix: string;
}

export interface RestoredAnchor {
  range: Range;
  strategy: "offset" | "context";
}

interface TextSegment {
  node: Text;
  start: number;
  end: number;
}

function indexText(root: Element): { text: string; segments: TextSegment[] } {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const segments: TextSegment[] = [];
  let text = "";
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const value = node.nodeValue ?? "";
    segments.push({
      node: node as Text,
      start: text.length,
      end: text.length + value.length,
    });
    text += value;
  }
  return { text, segments };
}

function boundaryAt(
  segments: TextSegment[],
  offset: number,
  preferNext: boolean,
): { node: Text; offset: number } | null {
  for (const [index, segment] of segments.entries()) {
    if (
      offset < segment.end ||
      (offset === segment.end && (!preferNext || index === segments.length - 1))
    ) {
      return { node: segment.node, offset: offset - segment.start };
    }
    if (preferNext && offset === segment.end) continue;
  }
  return null;
}

function rangeForOffsets(
  segments: TextSegment[],
  start: number,
  end: number,
): Range | null {
  const startBoundary = boundaryAt(segments, start, true);
  const endBoundary = boundaryAt(segments, end, false);
  if (startBoundary === null || endBoundary === null) return null;
  const range = document.createRange();
  range.setStart(startBoundary.node, startBoundary.offset);
  range.setEnd(endBoundary.node, endBoundary.offset);
  return range;
}

function contextMatches(
  text: string,
  at: number,
  selector: StoredSelector,
): boolean {
  const prefix = text.slice(Math.max(0, at - selector.prefix.length), at);
  const suffixStart = at + selector.exact.length;
  const suffix = text.slice(suffixStart, suffixStart + selector.suffix.length);
  return prefix === selector.prefix && suffix === selector.suffix;
}

/** Restore only an exact, unambiguous rendered-text range. Never guesses. */
export function restoreSelector(
  root: Element,
  selector: StoredSelector,
): RestoredAnchor | null {
  const { text, segments } = indexText(root);
  if (
    text.slice(selector.start, selector.end) === selector.exact &&
    contextMatches(text, selector.start, selector)
  ) {
    const range = rangeForOffsets(segments, selector.start, selector.end);
    return range === null ? null : { range, strategy: "offset" };
  }

  const occurrences: number[] = [];
  const candidates: number[] = [];
  let at = text.indexOf(selector.exact);
  while (at !== -1) {
    occurrences.push(at);
    if (contextMatches(text, at, selector)) candidates.push(at);
    at = text.indexOf(selector.exact, at + 1);
  }
  const start =
    candidates.length === 1
      ? candidates[0]
      : occurrences.length === 1
        ? occurrences[0]
        : undefined;
  if (start === undefined) return null;
  const range = rangeForOffsets(segments, start, start + selector.exact.length);
  return range === null ? null : { range, strategy: "context" };
}

export type GutterSide = "left" | "right";

export function chooseNearestGutter(
  fragments: readonly Pick<DOMRect, "left" | "right">[],
  rail: Pick<DOMRect, "left" | "right" | "width">,
): GutterSide {
  if (rail.width < 520 || fragments.length === 0) return "right";
  const leftDistance = Math.min(
    ...fragments.map((rect) => Math.abs(rect.left - rail.left)),
  );
  const rightDistance = Math.min(
    ...fragments.map((rect) => Math.abs(rail.right - rect.right)),
  );
  return leftDistance < rightDistance ? "left" : "right";
}

export interface MarkerCandidate {
  id: string;
  desiredY: number;
}

export interface MarkerPlacement {
  ids: string[];
  y: number;
}

/**
 * De-overlap one gutter. Locally colliding candidates cluster immediately;
 * any remaining rail overflow collapses into the smallest possible group.
 */
export function layoutGutterMarkers(
  candidates: readonly MarkerCandidate[],
  top: number,
  bottom: number,
  markerSize = 24,
  gap = 4,
): MarkerPlacement[] {
  if (candidates.length === 0 || bottom <= top) return [];
  const sorted = [...candidates].sort(
    (a, b) => a.desiredY - b.desiredY || a.id.localeCompare(b.id),
  );
  const capacity = Math.max(
    1,
    Math.floor((bottom - top + gap) / (markerSize + gap)),
  );
  const proximityGroups: MarkerCandidate[][] = [];
  for (const candidate of sorted) {
    const previous = proximityGroups.at(-1);
    const previousDesiredY = previous?.at(-1)?.desiredY;
    if (
      previous !== undefined &&
      previousDesiredY !== undefined &&
      candidate.desiredY - previousDesiredY < markerSize + gap
    ) {
      previous.push(candidate);
    } else {
      proximityGroups.push([candidate]);
    }
  }

  const groups =
    proximityGroups.length <= capacity
      ? proximityGroups
      : [
          ...proximityGroups.slice(0, capacity - 1),
          proximityGroups.slice(capacity - 1).flat(),
        ];

  const placements = groups.map((group) => ({
    ids: group.map(({ id }) => id),
    y: Math.min(
      bottom - markerSize,
      Math.max(
        top,
        group.reduce((sum, item) => sum + item.desiredY, 0) / group.length -
          markerSize / 2,
      ),
    ),
  }));
  for (let index = 1; index < placements.length; index += 1) {
    placements[index]!.y = Math.max(
      placements[index]!.y,
      placements[index - 1]!.y + markerSize + gap,
    );
  }
  const overflow = placements.at(-1)!.y + markerSize - bottom;
  if (overflow > 0) {
    for (const placement of placements) placement.y -= overflow;
  }
  return placements;
}
