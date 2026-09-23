export const kokoroModuleUrl =
  "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js";
export const kokoroModelId = "onnx-community/Kokoro-82M-v1.0-ONNX";

export type EngineDevice = "webgpu" | "wasm";

export type WorkerRequest =
  | {
      type: "speak";
      id: number;
      text: string;
      voice: string;
      speed: number;
      device: EngineDevice;
    }
  | { type: "cancel"; id: number };

export type WorkerResponse =
  | { type: "loading"; id: number; device: EngineDevice }
  | { type: "chunk"; id: number; audio: Float32Array; sampleRate: number }
  | { type: "done"; id: number }
  | { type: "error"; id: number; message: string };

/**
 * Module worker source. Kokoro runs off the main thread so synthesis never
 * blocks the timeline; each device's model loads once per page and the browser
 * caches the weights between sessions.
 */
export const kokoroWorkerSource = `
import { KokoroTTS, TextSplitterStream } from ${JSON.stringify(kokoroModuleUrl)};

const models = new Map();
let activeId = 0;

function load(device) {
  let model = models.get(device);
  if (!model) {
    model = KokoroTTS.from_pretrained(${JSON.stringify(kokoroModelId)}, {
      dtype: device === "webgpu" ? "fp32" : "q8",
      device,
    });
    models.set(device, model);
    model.catch(() => models.delete(device));
  }
  return model;
}

async function speak({ id, text, voice, speed, device }) {
  let tts;
  if (!models.has(device)) postMessage({ type: "loading", id, device });
  try {
    tts = await load(device);
  } catch (error) {
    if (device !== "webgpu") throw error;
    postMessage({ type: "loading", id, device: "wasm" });
    tts = await load("wasm");
  }
  if (id !== activeId) return;
  const splitter = new TextSplitterStream();
  splitter.push(text);
  splitter.close();
  for await (const { audio } of tts.stream(splitter, { voice, speed })) {
    if (id !== activeId) return;
    const samples = audio.audio;
    postMessage(
      { type: "chunk", id, audio: samples, sampleRate: audio.sampling_rate },
      [samples.buffer],
    );
  }
  if (id === activeId) postMessage({ type: "done", id });
}

self.onmessage = (event) => {
  const request = event.data;
  if (request.type === "cancel") {
    if (request.id === activeId) activeId = 0;
    return;
  }
  activeId = request.id;
  speak(request).catch((error) => {
    postMessage({
      type: "error",
      id: request.id,
      message: error instanceof Error ? error.message : String(error),
    });
  });
};
`;
