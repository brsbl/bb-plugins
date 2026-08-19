import type { PluginBrowserActionProps } from "@bb/plugin-sdk/app";

export const AGENT_CONTROL_FRAME_ID = "bb-browser-context-agent-control-frame";

interface AgentControlFrameInput {
  enabled: boolean;
  accent: string;
  glow: string;
}

export function pageAgentControlFrameController({
  input,
}: {
  input: AgentControlFrameInput;
}) {
  const frameId = "bb-browser-context-agent-control-frame";
  document.getElementById(frameId)?.remove();
  if (input.enabled !== true) return { enabled: false };

  const frame = document.createElement("div");
  frame.id = frameId;
  frame.setAttribute("aria-hidden", "true");
  frame.style.all = "initial";
  frame.style.position = "fixed";
  frame.style.inset = "0";
  frame.style.zIndex = "2147483647";
  frame.style.boxSizing = "border-box";
  frame.style.pointerEvents = "none";
  frame.style.border = `1px solid ${input.accent}`;
  frame.style.boxShadow = `inset 0 0 18px ${input.glow}`;
  document.documentElement.append(frame);
  return { enabled: true };
}

const PAGE_AGENT_CONTROL_FRAME_SOURCE =
  pageAgentControlFrameController.toString();

function hostRingColor(): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--ring")
    .trim();
  return value.length > 0 && value.length <= 128 ? value : "#3867e8";
}

export async function setBrowserAgentControlFrame(
  props: Pick<PluginBrowserActionProps, "experimental_runPageContentScript">,
  enabled: boolean,
  signal: AbortSignal,
): Promise<void> {
  const accent = hostRingColor();
  await props.experimental_runPageContentScript(
    {
      source: PAGE_AGENT_CONTROL_FRAME_SOURCE,
      input: {
        enabled,
        accent,
        glow: `color-mix(in srgb, ${accent} 18%, transparent)`,
      },
      timeoutMs: 2_000,
    },
    { signal },
  );
}
