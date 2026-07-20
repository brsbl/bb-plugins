import { useState } from "react";
import { definePluginApp } from "@bb/plugin-sdk/app";
import type { PluginComposerAccessoryProps } from "@bb/plugin-sdk";
import { GalleryShell, type GalleryNavigation } from "./gallery-shell.js";
import { useSourceBrowserData } from "./source-browser-data.js";
import { Button } from "./components/ui/button.js";
import { Icon } from "./components/ui/icon.js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./components/ui/tooltip.js";

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

function UiPatternsComposerAccessory({
  openThreadPanel,
  threadId,
}: PluginComposerAccessoryProps) {
  if (threadId === null || openThreadPanel == null) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground"
              aria-label="Open UI Patterns"
              onMouseDown={(event) => {
                event.preventDefault();
              }}
              onClick={() => {
                openThreadPanel({
                  actionId: "library-panel",
                  title: "UI Patterns",
                });
              }}
            >
              <span className="inline-flex size-4 items-center justify-center">
                <Icon name="GridView" aria-hidden="true" />
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Open UI Patterns</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
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
  app.slots.composerAccessory({
    id: "library-button",
    component: UiPatternsComposerAccessory,
  });
});
