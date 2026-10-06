/**
 * Provider brand icons, vendored from bb's app (`@/lib/provider-icon`) so the
 * helper picker renders the same logos as the composer's model picker.
 * Unknown providers fall back to a letter badge.
 */
import type { ComponentType, ReactElement } from "react";
import { ClaudeIcon } from "./ClaudeIcon";
import { CursorIcon } from "./CursorIcon";
import { GrokIcon } from "./GrokIcon";
import { HermesAgentIcon } from "./HermesAgentIcon";
import { OmpIcon } from "./OmpIcon";
import { OpenAiIcon } from "./OpenAiIcon";
import { OpencodeIcon } from "./OpencodeIcon";
import { PiIcon } from "./PiIcon";

const PROVIDER_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  codex: OpenAiIcon,
  "claude-code": ClaudeIcon,
  pi: PiIcon,
  "acp-cursor": CursorIcon,
  "acp-grok": GrokIcon,
  "acp-hermes-agent": HermesAgentIcon,
  "acp-opencode": OpencodeIcon,
  "acp-omp": OmpIcon,
};

/** Mirrors the app's per-provider brand tint. */
function providerColorClass(providerId: string): string {
  if (providerId === "claude-code") return "text-[#D97757]";
  if (providerId === "pi") return "text-[#6D5DFB]";
  if (providerId === "acp-cursor") return "text-[#111827] dark:text-[#F5F5F5]";
  if (providerId === "acp-opencode") return "text-[#2563EB]";
  if (providerId === "acp-omp") return "text-[#9333EA]";
  return "text-foreground";
}

export function ProviderLogo({
  providerId,
  displayName,
}: {
  providerId: string;
  displayName: string;
}): ReactElement {
  const BrandIcon = PROVIDER_ICONS[providerId];
  if (BrandIcon !== undefined) {
    return (
      <BrandIcon
        className={`size-3.5 shrink-0 ${providerColorClass(providerId)}`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-4 shrink-0 items-center justify-center rounded-sm bg-state-hover text-2xs font-medium text-muted-foreground"
    >
      {displayName.charAt(0)}
    </span>
  );
}
