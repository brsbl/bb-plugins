import { useComposer } from "@bb/plugin-sdk/app";
import { Button } from "./components/ui/button.js";
import { Icon } from "./components/ui/icon.js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./components/ui/tooltip.js";

interface ExperimentalComposerThreadPanelApi {
  experimental_openThreadPanel?: (options: {
    actionId: string;
    title?: string;
  }) => boolean;
}

export function UiPatternsComposerAction() {
  const composer = useComposer() as ReturnType<typeof useComposer> &
    ExperimentalComposerThreadPanelApi;

  if (typeof composer.experimental_openThreadPanel !== "function") return null;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground"
            aria-label="Open UI Patterns"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() =>
              composer.experimental_openThreadPanel?.({
                actionId: "library-panel",
                title: "UI Patterns",
              })
            }
          >
            <Icon name="GridView" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Open UI Patterns</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
