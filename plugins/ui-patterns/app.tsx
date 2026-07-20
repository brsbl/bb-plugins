import { useState } from "react";
import { definePluginApp } from "@bb/plugin-sdk/app";
import { GalleryShell, type GalleryNavigation } from "./gallery-shell.js";
import { useSourceBrowserData } from "./source-browser-data.js";

function UiPatternsThreadPanel() {
  const [entryId, setEntryId] = useState<string | null>(null);
  const navigation: GalleryNavigation = {
    entryId,
    openEntry: setEntryId,
    replaceEntry: setEntryId,
    closeInspector: () => setEntryId(null),
  };
  const { snapshot, error } = useSourceBrowserData();

  if (!snapshot) {
    return (
      <main
        className="grid h-full min-h-40 place-items-center p-4 text-sm text-muted-foreground"
        role="status"
      >
        {error ?? "Loading upstream source records…"}
      </main>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <GalleryShell
        navigation={navigation}
        snapshot={snapshot}
        showTitle={false}
        mode="panel"
      />
    </div>
  );
}

export default definePluginApp((app) => {
  app.slots.threadPanelAction({
    id: "library-panel",
    title: "UI Patterns",
    icon: "GridView",
    component: UiPatternsThreadPanel,
    run: ({ openPanel }) => {
      openPanel({ title: "UI Patterns" });
    },
  });
});
