import { legacyRouteEntryId } from "./atlas-compatibility.js";

function decodeRouteValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizePath(path: string) {
  return path.replace(/^\/+|\/+$/g, "");
}

export function parseStandaloneRoute(pathname: string) {
  const match = pathname.match(/^(.*?)(?:\/(entry|gallery)\/([^/]+))\/?$/);
  if (match?.[2] && match[3]) {
    const routeKind = match[2];
    const routeValue = decodeRouteValue(match[3]);
    return {
      basePath: `${match[1] || ""}/`.replace(/\/+/g, "/"),
      entryId: routeKind === "entry"
        ? legacyRouteEntryId(routeValue) ?? routeValue
        : routeValue,
    };
  }

  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return {
    basePath: normalized.replace(/\/+/g, "/"),
    entryId: null,
  };
}

export function entryIdFromSubPath(subPath: string) {
  const match = normalizePath(subPath).match(/^(entry|gallery)\/([^/]+)$/);
  if (!match?.[1] || !match[2]) return null;
  const routeValue = decodeRouteValue(match[2]);
  return match[1] === "entry"
    ? legacyRouteEntryId(routeValue) ?? routeValue
    : routeValue;
}

export function entrySubPath(entryId: string) {
  return `gallery/${encodeURIComponent(entryId)}`;
}

export function standaloneEntryPath(basePath: string, entryId: string) {
  return `${basePath.replace(/\/+$/, "")}/gallery/${encodeURIComponent(entryId)}`;
}

export function inspectorCloseMode(openedFromGallery: boolean) {
  return openedFromGallery ? "back" : "replace";
}
