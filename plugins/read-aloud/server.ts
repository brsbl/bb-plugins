import type { BbPluginApi } from "@get-bb/plugin-sdk";

export const voices = [
  "af_heart",
  "af_alloy",
  "af_aoede",
  "af_bella",
  "af_jessica",
  "af_kore",
  "af_nicole",
  "af_nova",
  "af_river",
  "af_sarah",
  "af_sky",
  "am_adam",
  "am_echo",
  "am_eric",
  "am_fenrir",
  "am_liam",
  "am_michael",
  "am_onyx",
  "am_puck",
  "am_santa",
  "bf_alice",
  "bf_emma",
  "bf_isabella",
  "bf_lily",
  "bm_daniel",
  "bm_fable",
  "bm_george",
  "bm_lewis",
] as const;

export const speeds = ["0.75", "1", "1.25", "1.5", "1.75", "2"] as const;

export const devices = ["auto", "webgpu", "wasm"] as const;

export interface ReadAloudSettings {
  voice: (typeof voices)[number];
  speed: number;
  device: (typeof devices)[number];
}

export default function plugin(bb: BbPluginApi): void {
  const settings = bb.settings.define({
    voice: {
      type: "select",
      label: "Voice",
      options: [...voices],
      default: "af_heart",
    },
    speed: {
      type: "select",
      label: "Speed",
      options: [...speeds],
      default: "1",
    },
    device: {
      type: "select",
      label: "Engine (auto uses WebGPU when the browser supports it)",
      options: [...devices],
      default: "auto",
    },
  });

  bb.http.route("GET", "/settings", async (context) => {
    const current = await settings.get();
    const body: ReadAloudSettings = {
      voice: current.voice as ReadAloudSettings["voice"],
      speed: Number(current.speed) || 1,
      device: current.device as ReadAloudSettings["device"],
    };
    return context.json(body);
  });
}
