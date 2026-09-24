import { createFakePluginHost, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
import { describe, expect, it, vi } from "vitest";

import { registerReadAloud } from "./server";
import { SynthesisBusyError, SynthesisUnavailableError, type Synthesizer } from "./synthesizer";

function setup(synthesize: Synthesizer["synthesize"]) {
  const { bb, harness } = createFakePluginHost({ pluginId: "read-aloud" });
  registerReadAloud(bb, { synthesize });
  const speak = (body: unknown) =>
    harness.fetchHttp("POST", "/speak", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  const idle = (lastAssistantText: string) =>
    harness.emitThreadEvent("thread.idle", { thread: makeThreadResponse(), lastAssistantText });
  return { harness, speak, idle };
}

const audio = { sampleRate: 24_000, pcm: new Uint8Array([1, 0, 2, 0]) };

describe("Read Aloud speech route", () => {
  it("returns a WAV of the requested chunk in the configured voice", async () => {
    const synthesize = vi.fn(async () => ({
      sampleRate: 24_000,
      pcm: new Uint8Array([1, 0, 2, 0]),
    }));
    const { harness, speak } = setup(synthesize);
    const response = await speak({ text: "Hello there.", speed: 1.5 });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("audio/wav");
    const wav = new Uint8Array(await response.arrayBuffer());
    expect(new TextDecoder().decode(wav.slice(0, 4))).toBe("RIFF");
    expect(new DataView(wav.buffer).getUint32(24, true)).toBe(24_000);
    expect(wav.byteLength).toBe(48);
    expect(synthesize).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Hello there.", voice: "af_heart", speed: 1.5 }),
    );
    await harness.lifecycle.dispose();
  });

  it("rejects empty, oversized, or unsupported-speed requests", async () => {
    const synthesize = vi.fn();
    const { harness, speak } = setup(synthesize);
    for (const body of [{ text: "", speed: 1 }, { text: "x".repeat(401), speed: 1 }, { text: "Hi", speed: 3 }]) {
      expect((await speak(body)).status).toBe(400);
    }
    expect(synthesize).not.toHaveBeenCalled();
    await harness.lifecycle.dispose();
  });

  it("reports a full queue as busy", async () => {
    const { harness, speak } = setup(async () => {
      throw new SynthesisBusyError("Too many requests");
    });
    expect((await speak({ text: "Hi", speed: 1 })).status).toBe(429);
    await harness.lifecycle.dispose();
  });

  it("tells the client to retry while the voice process restarts", async () => {
    const { harness, speak } = setup(async () => {
      throw new SynthesisUnavailableError("The voice server is restarting");
    });
    const response = await speak({ text: "Hi", speed: 1 });
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("1");
    await harness.lifecycle.dispose();
  });

  it("prepares a finished reply in the background and serves it from cache", async () => {
    const synthesize = vi.fn<Synthesizer["synthesize"]>(async () => audio);
    const { harness, speak, idle } = setup(synthesize);
    await idle("## Done\n\nIt works. Here is the rest of the reply.\n\nAnd a third chunk.");
    await vi.waitFor(() => expect(synthesize).toHaveBeenCalledTimes(2));
    expect(synthesize.mock.calls.map(([request]) => [request.text, request.background])).toEqual([
      ["Done.", true],
      ["It works.", true],
    ]);
    const response = await speak({ text: "Done.", speed: 1, first: true });
    expect(response.status).toBe(200);
    expect(synthesize).toHaveBeenCalledTimes(2);
    await harness.lifecycle.dispose();
  });

  it("does not prepare replies when the setting is off", async () => {
    const synthesize = vi.fn(async () => audio);
    const { harness, idle } = setup(synthesize);
    await harness.setSettings({ prepare: false });
    await idle("It works.");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(synthesize).not.toHaveBeenCalled();
    await harness.lifecycle.dispose();
  });

  it("takes over from preparation that has not started yet", async () => {
    const signals: AbortSignal[] = [];
    const synthesize = vi.fn(
      (request: Parameters<Synthesizer["synthesize"]>[0]) =>
        request.background
          ? new Promise<typeof audio>((_, reject) => {
              signals.push(request.signal!);
              request.signal!.addEventListener("abort", () => reject(new Error("Cancelled")));
            })
          : Promise.resolve(audio),
    );
    const { harness, speak, idle } = setup(synthesize);
    await idle("It works.");
    await vi.waitFor(() => expect(signals).toHaveLength(1));
    const response = await speak({ text: "It works.", speed: 1, first: true });
    expect(response.status).toBe(200);
    expect(signals[0]!.aborted).toBe(true);
    expect(synthesize).toHaveBeenLastCalledWith(expect.objectContaining({ first: true }));
    await harness.lifecycle.dispose();
  });
});
