import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  inspectorCloseMode,
  legacyQueryFromEntryId,
  parseStandaloneRoute,
  standaloneEntryPath,
} from "./gallery-state.js";
import {
  GalleryShell,
  type GalleryNavigation,
} from "./gallery-shell.js";
// The standalone demo has no bb RPC host. Keep its fixture isolated from the
// plugin composition path, which reads the provider snapshot through RPC.
import { sourceBrowserFixture } from "./source-browser-fixtures.js";

function useHistoryGalleryNavigation(): GalleryNavigation {
  const initialRoute = parseStandaloneRoute(window.location.pathname);
  const basePath = useRef(initialRoute.basePath);
  const openedFromGallery = useRef(
    Boolean(window.history.state?.openedFromGallery),
  );
  const [entryId, setEntryId] = useState<string | null>(
    legacyQueryFromEntryId(initialRoute.entryId) ? null : initialRoute.entryId,
  );

  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState(
        {
          view: entryId ? "inspector" : "browse",
          id: entryId,
          openedFromGallery: false,
        },
        "",
        window.location.pathname,
      );
    }

    const onPopState = () => {
      const route = parseStandaloneRoute(window.location.pathname);
      basePath.current = route.basePath;
      openedFromGallery.current = Boolean(
        window.history.state?.openedFromGallery,
      );
      setEntryId(legacyQueryFromEntryId(route.entryId) ? null : route.entryId);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [entryId]);

  return {
    entryId,
    legacyQuery: legacyQueryFromEntryId(parseStandaloneRoute(window.location.pathname).entryId),
    openEntry(id) {
      openedFromGallery.current = true;
      window.history.pushState(
        { view: "inspector", id, openedFromGallery: true },
        "",
        standaloneEntryPath(basePath.current, id),
      );
      setEntryId(id);
    },
    closeInspector() {
      if (inspectorCloseMode(openedFromGallery.current) === "back") {
        openedFromGallery.current = false;
        window.history.back();
      } else {
        window.history.replaceState(
          { view: "browse", openedFromGallery: false },
          "",
          basePath.current,
        );
        setEntryId(null);
      }
    },
  };
}

function StandaloneGallery() {
  const navigation = useHistoryGalleryNavigation();
  return (
    <>
      <a className="pa-skip-link" href="#pattern-results">
        Skip to patterns
      </a>
      <GalleryShell navigation={navigation} snapshot={sourceBrowserFixture} />
    </>
  );
}

const mount = document.querySelector<HTMLElement>(
  "[data-pattern-atlas-root]",
);
if (!mount) throw new Error("Pattern Atlas root is missing");

createRoot(mount).render(<StandaloneGallery />);
