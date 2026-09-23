// Runtime code comes from jsDelivr, so every file is pinned to the SHA-384 of
// its npm tarball and rejected by fetch() if the CDN serves anything else.
const transformersDist =
  "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1/dist";
const runtimeFiles = {
  kokoro: {
    url: "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js",
    integrity:
      "sha384-suR1TeKe6Fe8fT0n/uTWoohnPJrp1zu3z0bj4VH2anmmq739wlmFSnMFJyMYszAC",
    type: "text/javascript",
  },
  mjs: {
    url: `${transformersDist}/ort-wasm-simd-threaded.jsep.mjs`,
    integrity:
      "sha384-7GJqH5vc83Yt7VHwrMXTM8bNCrt/e/8eCtok8zlB2u5dwqmhzSakzCkQWrfYGRN4",
    type: "text/javascript",
  },
  wasm: {
    url: `${transformersDist}/ort-wasm-simd-threaded.jsep.wasm`,
    integrity:
      "sha384-u/bDsx39c+wt0LbHmOCydxt4fyiig3118hQgOTfOvrfkgScM4hRo2IwTtlxyoI02",
    type: "application/wasm",
  },
} as const;
const kokoroModelId = "onnx-community/Kokoro-82M-v1.0-ONNX";

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
const files = ${JSON.stringify(runtimeFiles)};

async function verifiedUrl({ url, integrity, type }) {
  const response = await fetch(url, { integrity });
  if (!response.ok) throw new Error("Couldn’t download " + url);
  const bytes = await response.arrayBuffer();
  return URL.createObjectURL(new Blob([bytes], { type }));
}

let runtime = null;

function loadRuntime() {
  if (!runtime) {
    runtime = Promise.all([
      verifiedUrl(files.kokoro).then((url) => import(url)),
      verifiedUrl(files.mjs),
      verifiedUrl(files.wasm),
    ]).then(([kokoro, mjs, wasm]) => {
      kokoro.env.wasmPaths = { mjs, wasm };
      return kokoro;
    });
    runtime.catch(() => (runtime = null));
  }
  return runtime;
}

const models = new Map();
let activeId = 0;
let queue = Promise.resolve();

function load(device) {
  let model = models.get(device);
  if (!model) {
    model = loadRuntime().then(({ KokoroTTS }) => KokoroTTS.from_pretrained(${JSON.stringify(kokoroModelId)}, {
      dtype: device === "webgpu" ? "fp32" : "q8",
      device,
    }));
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
    models.set("webgpu", Promise.resolve(tts));
  }
  if (id !== activeId) return;
  const { TextSplitterStream } = await loadRuntime();
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
  // One ONNX session cannot run concurrently; a cancelled reading stops at its
  // next sentence boundary before the next one starts.
  queue = queue
    .then(() => (request.id === activeId ? speak(request) : undefined))
    .catch((error) => {
      postMessage({
        type: "error",
        id: request.id,
        message: error instanceof Error ? error.message : String(error),
      });
    });
};
`;
