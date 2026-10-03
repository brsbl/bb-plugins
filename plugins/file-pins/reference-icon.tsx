import { experimental_Icon as Icon } from "@get-bb/plugin-sdk/app";

export function ReferenceIcon({ name, moss = false, status = "available" }: { name: string; moss?: boolean; status?: string }) {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  const icon = status === "missing" ? "AlertTriangle" : status === "unavailable" ? "CloudOff" : moss ? "News01"
    : /^(json|js|jsx|ts|tsx|py|rs|go|css|html|sh|yaml|yml|toml)$/.test(extension) ? "Code"
    : /^(md|markdown|txt|pdf|doc|docx|rtf)$/.test(extension) ? "FileText" : "File";
  return <Icon name={icon} className="size-3.5 shrink-0" aria-label={moss && status === "available" ? "Moss note" : undefined} />;
}
