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
// Hugging Face commit of the weights and voices; kokoro-js always asks for
// "main", so the worker rewrites those requests to this immutable revision.
const kokoroRevision = "1939ad2a8e416c0acfeecc08a694d14ef25f2231";

export type EngineDevice = "webgpu" | "wasm";

export type WorkerRequest =
  | {
      type: "speak";
      id: number;
      chunks: string[];
      voice: string;
      speed: number;
      device: EngineDevice;
    }
  | { type: "pull"; id: number }
  | { type: "cancel"; id: number };

export type WorkerResponse =
  | { type: "loading"; id: number; device: EngineDevice }
  | { type: "chunk"; id: number; audio: Float32Array; sampleRate: number }
  | { type: "done"; id: number }
  | { type: "error"; id: number; message: string };

/**
 * Module worker source. Kokoro runs off the main thread so synthesis never
 * blocks the timeline. The worker keeps one model loaded, synthesizes one
 * chunk at a time, and waits for the player to pull before generating more
 * than it has buffered.
 */
export const kokoroWorkerSource = `
const files = ${JSON.stringify(runtimeFiles)};
const modelMain = "https://huggingface.co/${kokoroModelId}/resolve/main/";
const modelPinned = "https://huggingface.co/${kokoroModelId}/resolve/${kokoroRevision}/";

const networkFetch = self.fetch.bind(self);
self.fetch = (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  return networkFetch(
    url.startsWith(modelMain) ? modelPinned + url.slice(modelMain.length) : input,
    init,
  );
};

async function verifiedUrl({ url, integrity, type }) {
  const response = await networkFetch(url, { integrity });
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

let loaded = null;
let webgpuFailed = false;

function load(device) {
  if (loaded && loaded.device === device) return loaded.promise;
  const previous = loaded;
  const entry = { device, ready: false };
  entry.promise = loadRuntime().then(({ KokoroTTS }) =>
    KokoroTTS.from_pretrained(${JSON.stringify(kokoroModelId)}, {
      dtype: device === "webgpu" ? "fp32" : "q8",
      device,
    }),
  );
  entry.promise.then(
    () => (entry.ready = true),
    () => {
      if (loaded === entry) loaded = null;
    },
  );
  loaded = entry;
  // Only one engine stays resident; switching releases the other model.
  previous?.promise.then((tts) => tts.model.dispose?.()).catch(() => {});
  return entry.promise;
}

let activeId = 0;
let queue = Promise.resolve();
const waiting = new Map();

function release(id) {
  waiting.get(id)?.();
  waiting.delete(id);
}

async function speak({ id, chunks, voice, speed, device }) {
  if (device === "webgpu" && webgpuFailed) device = "wasm";
  if (!(loaded && loaded.device === device && loaded.ready)) {
    postMessage({ type: "loading", id, device });
  }
  let tts;
  try {
    tts = await load(device);
  } catch (error) {
    if (device !== "webgpu") throw error;
    webgpuFailed = true;
    postMessage({ type: "loading", id, device: "wasm" });
    tts = await load("wasm");
  }
  for (let index = 0; index < chunks.length; index += 1) {
    if (id !== activeId) return;
    const audio = await tts.generate(chunks[index], { voice, speed });
    if (id !== activeId) return;
    const samples = audio.audio;
    postMessage(
      { type: "chunk", id, audio: samples, sampleRate: audio.sampling_rate },
      [samples.buffer],
    );
    if (index < chunks.length - 1) {
      await new Promise((resolve) => waiting.set(id, resolve));
    }
  }
  if (id === activeId) postMessage({ type: "done", id });
}

self.onmessage = (event) => {
  const request = event.data;
  if (request.type === "pull") {
    release(request.id);
    return;
  }
  if (request.type === "cancel") {
    if (request.id === activeId) activeId = 0;
    release(request.id);
    return;
  }
  activeId = request.id;
  for (const id of [...waiting.keys()]) release(id);
  // One ONNX session cannot run concurrently; a cancelled reading stops after
  // its current chunk before the next one starts.
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
