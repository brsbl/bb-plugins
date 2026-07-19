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
  const match = pathname.match(/^(.*?)(?:\/entry\/([^/]+))\/?$/);
  if (match?.[2]) {
    return {
      basePath: `${match[1] || ""}/`.replace(/\/+/g, "/"),
      entryId: decodeRouteValue(match[2]),
    };
  }

  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return {
    basePath: normalized.replace(/\/+/g, "/"),
    entryId: null,
  };
}

export function entryIdFromSubPath(subPath: string) {
  const match = normalizePath(subPath).match(/^entry\/([^/]+)$/);
  return match?.[1] ? decodeRouteValue(match[1]) : null;
}

export function entrySubPath(entryId: string) {
  return `entry/${encodeURIComponent(entryId)}`;
}

export function standaloneEntryPath(basePath: string, entryId: string) {
  return `${basePath.replace(/\/+$/, "")}/entry/${encodeURIComponent(entryId)}`;
}

export function inspectorCloseMode(openedFromGallery: boolean) {
  return openedFromGallery ? "back" : "replace";
}
