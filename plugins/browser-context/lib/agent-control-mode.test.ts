// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";

import {
  AGENT_CONTROL_FRAME_ID,
  pageAgentControlFrameController,
} from "./agent-control-mode.js";

afterEach(() => {
  document.getElementById(AGENT_CONTROL_FRAME_ID)?.remove();
});

describe("Browser agent-control frame", () => {
  it("uses the supplied theme token colors and replaces duplicate frames", () => {
    const input = {
      enabled: true,
      accent: "rgb(20 90 220)",
      glow: "rgb(20 90 220 / 18%)",
    };
    expect(pageAgentControlFrameController({ input })).toEqual({
      enabled: true,
    });
    expect(pageAgentControlFrameController({ input })).toEqual({
      enabled: true,
    });

    const frames = document.querySelectorAll(`#${AGENT_CONTROL_FRAME_ID}`);
    expect(frames).toHaveLength(1);
    const frame = frames[0] as HTMLElement;
    expect(frame.getAttribute("aria-hidden")).toBe("true");
    expect(frame.style.pointerEvents).toBe("none");
    expect(frame.style.border).toContain("rgb(20, 90, 220)");
    expect(frame.style.boxShadow).toContain("rgb(20 90 220 / 18%)");
  });

  it("removes the frame when agent control exits", () => {
    pageAgentControlFrameController({
      input: {
        enabled: true,
        accent: "#3867e8",
        glow: "rgb(56 103 232 / 18%)",
      },
    });
    expect(document.getElementById(AGENT_CONTROL_FRAME_ID)).not.toBeNull();

    expect(
      pageAgentControlFrameController({
        input: { enabled: false, accent: "#3867e8", glow: "transparent" },
      }),
    ).toEqual({ enabled: false });
    expect(document.getElementById(AGENT_CONTROL_FRAME_ID)).toBeNull();
  });
});
