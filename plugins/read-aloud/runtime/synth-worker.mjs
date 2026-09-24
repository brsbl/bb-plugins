// Kokoro synthesis process, forked by the Read Aloud server with its runtime
// directory as cwd. It loads the model once and answers synthesize requests
// over IPC with 16-bit mono PCM.
import { env } from "@huggingface/transformers";
import { KokoroTTS } from "kokoro-js";

const modelId = "onnx-community/Kokoro-82M-v1.0-ONNX";
// Hugging Face commit of the weights; kokoro-js always asks for "main".
const modelRevision = "1939ad2a8e416c0acfeecc08a694d14ef25f2231";

env.cacheDir = process.env.READ_ALOUD_MODEL_CACHE;
env.remotePathTemplate = `{model}/resolve/${modelRevision}/`;

const tts = await KokoroTTS.from_pretrained(modelId, {
  dtype: "fp32",
  device: "cpu",
});
process.send({ type: "ready" });

function toPcm16(samples) {
  const pcm = Buffer.alloc(samples.length * 2);
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    pcm.writeInt16LE(Math.round(sample * 0x7fff), index * 2);
  }
  return pcm;
}

process.on("message", async (request) => {
  if (request?.type !== "synthesize") return;
  try {
    const audio = await tts.generate(request.text, { voice: request.voice });
    process.send({
      type: "audio",
      id: request.id,
      sampleRate: audio.sampling_rate,
      pcm: toPcm16(audio.audio),
    });
  } catch (error) {
    process.send({
      type: "error",
      id: request.id,
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
