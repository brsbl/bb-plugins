import { definePluginApp } from "@get-bb/plugin-sdk/app";
import { toast } from "sonner";

const MARKDOWN_EXTENSION = /\.(?:md|markdown)$/iu;
const fallbackEvents = new WeakSet<Event>();
// Other errors mean no Mac has the file, so bb opens it without a toast.
const MOSS_FAILURES = new Set<unknown>(["open_failed", "host_unavailable"]);

interface MarkdownFileLink {
  anchor: HTMLAnchorElement;
  path: string;
}

function markdownFileLinkFromClick(event: MouseEvent): MarkdownFileLink | null {
  if (
    event.button !== 0 ||
    event.defaultPrevented
  ) {
    return null;
  }

  const anchor = event
    .composedPath()
    .find((target): target is HTMLAnchorElement =>
      target instanceof HTMLAnchorElement,
    );
  if (!anchor) return null;

  const encodedPath = encodedFilePath(anchor);
  if (encodedPath === null) return null;

  let filePath: string;
  try {
    filePath = decodeURIComponent(encodedPath);
  } catch {
    return null;
  }
  if (!filePath.startsWith("/") || !MARKDOWN_EXTENSION.test(filePath)) {
    return null;
  }
  return { anchor, path: filePath };
}

// bb's experimental_FileLink renders `./${encodeURIComponent(path)}`, so its
// whole path is one href segment with no raw `/`, `?`, or `#`.
const BB_FILE_LINK_HREF = /^\.\/([^/?#]+)$/u;

function encodedFilePath(anchor: HTMLAnchorElement): string | null {
  const fileLink = BB_FILE_LINK_HREF.exec(anchor.getAttribute("href") ?? "");
  if (fileLink) return fileLink[1]!;

  let url: URL;
  try {
    url = new URL(anchor.href);
  } catch {
    return null;
  }
  if (url.protocol !== "file:" || url.hostname !== "" || url.search !== "") {
    return null;
  }
  return url.pathname;
}

function openInBb(anchor: HTMLAnchorElement): boolean {
  if (!anchor.isConnected) return false;
  const fallbackEvent = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    button: 0,
  });
  fallbackEvents.add(fallbackEvent);
  return !anchor.dispatchEvent(fallbackEvent);
}

async function requestMossOpen(
  pluginId: string,
  link: MarkdownFileLink,
): Promise<void> {
  try {
    const response = await fetch(
      `/api/v1/plugins/${encodeURIComponent(pluginId)}/http/open`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: link.path }),
      },
    );
    if (response.ok) return;
    const code = await response
      .json()
      .then((body: { error?: { code?: unknown } }) => body.error?.code)
      .catch(() => undefined);
    if (code !== undefined && !MOSS_FAILURES.has(code)) {
      openInBb(link.anchor);
      return;
    }
    throw new Error("Moss did not accept the file");
  } catch {
    const openedInBb = openInBb(link.anchor);
    toast.error("Moss couldn’t open this file", {
      description: openedInBb
        ? "It was opened in bb instead."
        : "Right-click the link to choose another app.",
    });
  }
}

export default definePluginApp((app) => {
  app.contentScripts.register({
    id: "open-markdown-links",
    mount({ pluginId }) {
      const handleClick = (event: MouseEvent) => {
        if (fallbackEvents.has(event)) return;
        const link = markdownFileLinkFromClick(event);
        if (link === null) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        void requestMossOpen(pluginId, link);
      };
      document.addEventListener("click", handleClick, true);
      return () => document.removeEventListener("click", handleClick, true);
    },
  });
});
