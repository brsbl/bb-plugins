import { experimental_Icon as Icon } from "@get-bb/plugin-sdk/app";

// bb's file icon rule from resolveRightPanelFileIconName
// (apps/app/src/components/secondary-panel/rightPanelFileVisuals.ts), which the SDK does not export.
function fileIconName(path: string): string {
  const name = path.slice(path.lastIndexOf("/") + 1) || path;
  const dotIndex = name.lastIndexOf(".");
  const extension = dotIndex <= 0 ? "" : name.slice(dotIndex + 1).toLowerCase();
  const inReports = path.toLowerCase().split("/").slice(0, -1).includes("reports");
  const isMarkdown = extension === "md" || extension === "markdown";
  const isHtml = extension === "html" || extension === "htm";
  if (inReports && (isMarkdown || isHtml)) return "ChartColumn";
  if (isMarkdown) return "File";
  if (isHtml) return "AppWindow";
  return "Code";
}

export function ReferenceIcon({ path }: { path: string }) {
  return <Icon name={fileIconName(path)} className="size-3.5 shrink-0" />;
}
