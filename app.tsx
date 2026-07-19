import { useRef, useState } from "react";
import { definePluginApp, useBbNavigate } from "@bb/plugin-sdk/app";
import {
  entryIdFromSubPath,
  entrySubPath,
  inspectorCloseMode,
  parseStandaloneRoute,
} from "./gallery-state.js";
import {
  GalleryShell,
  type GalleryNavigation,
} from "./gallery-shell.js";
import { Button } from "./components/ui/button.js";
import { Icon } from "./components/ui/icon.js";
import { atlasPluginStyles } from "./plugin-styles.js";

function AtlasPluginStyles() {
  return (
    <style data-ui-pattern-atlas-styles="">{atlasPluginStyles}</style>
  );
}

function useBbGalleryNavigation(subPath: string): GalleryNavigation {
  const navigate = useBbNavigate();
  const openedFromGallery = useRef(false);
  const initialPathEntry =
    typeof window === "undefined"
      ? null
      : parseStandaloneRoute(window.location.pathname).entryId;
  const entryId = entryIdFromSubPath(subPath) ?? initialPathEntry;

  return {
    entryId,
    openEntry(id) {
      openedFromGallery.current = true;
      navigate.toPluginPanel("library", { subPath: entrySubPath(id) });
    },
    closeInspector() {
      if (inspectorCloseMode(openedFromGallery.current) === "back") {
        openedFromGallery.current = false;
        window.history.back();
      } else {
        navigate.toPluginPanel("library", { subPath: "", replace: true });
      }
    },
  };
}

function UiPatternsPanel({ subPath }: { subPath: string }) {
  const navigation = useBbGalleryNavigation(subPath);
  return (
    <>
      <AtlasPluginStyles />
      <GalleryShell navigation={navigation} showTitle={false} />
    </>
  );
}

function UiPatternsThreadPanel() {
  const [entryId, setEntryId] = useState<string | null>(null);
  const navigation: GalleryNavigation = {
    entryId,
    openEntry: setEntryId,
    closeInspector: () => setEntryId(null),
  };

  return (
    <>
      <AtlasPluginStyles />
      <GalleryShell
        navigation={navigation}
        showTitle={false}
        mode="panel"
      />
    </>
  );
}

function UiPatternsComposerAccessory() {
  const navigate = useBbNavigate();

  // SDK 0.4.0 composerAccessory receives only projectId/threadId and has no
  // host callback for invoking this plugin's registered threadPanelAction.
  // Keep the control useful without impersonating a native panel: the supported
  // fallback opens the Atlas nav panel until the host adds that callback.
  return (
    <>
      <AtlasPluginStyles />
      <span className="inline-flex" title="Open UI Patterns">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 rounded p-0 text-muted-foreground hover:text-foreground [&_svg]:size-3.5 max-md:pointer-coarse:h-9 max-md:pointer-coarse:w-9 max-md:pointer-coarse:[&_svg]:size-5"
          aria-label="Open UI Patterns"
          onClick={() => navigate.toPluginPanel("library")}
        >
          <Icon name="GridView" aria-hidden="true" />
        </Button>
      </span>
    </>
  );
}

export default definePluginApp((app) => {
  app.slots.navPanel({
    id: "library",
    title: "UI Patterns",
    icon: "GridView",
    path: "library",
    component: UiPatternsPanel,
  });
  app.slots.threadPanelAction({
    id: "library-panel",
    title: "UI Patterns",
    icon: "GridView",
    component: UiPatternsThreadPanel,
  });
  app.slots.composerAccessory({
    id: "library-button",
    component: UiPatternsComposerAccessory,
  });
});
