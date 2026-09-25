import { definePluginApp } from "@get-bb/plugin-sdk/app";
import { toast } from "sonner";

const MARKDOWN_EXTENSION = /\.(?:md|markdown)$/iu;
const fallbackEvents = new WeakSet<Event>();

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

  let url: URL;
  try {
    url = new URL(anchor.href);
  } catch {
    return null;
  }
  if (url.protocol !== "file:" || url.hostname !== "" || url.search !== "") {
    return null;
  }

  let filePath: string;
  try {
    filePath = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
  if (!filePath.startsWith("/") || !MARKDOWN_EXTENSION.test(filePath)) {
    return null;
  }
  return { anchor, path: filePath };
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
    if (!response.ok) throw new Error("Moss did not accept the file");
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
