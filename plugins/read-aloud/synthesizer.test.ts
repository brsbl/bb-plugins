import { describe, expect, it, vi } from "vitest";

import { SynthesisBusyError, SynthesisQueue } from "./synthesizer";

const audio = { sampleRate: 24_000, pcm: new Uint8Array(2) };
const request = (text: string, signal?: AbortSignal) => ({ text, voice: "af_heart", speed: 1, signal });

describe("SynthesisQueue", () => {
  it("runs two chunks at a time in order", async () => {
    const queue = new SynthesisQueue(2, 12);
    const send = vi.fn();
    queue.attach(send);
    const results = ["a", "b", "c"].map((text) => queue.enqueue(request(text)));
    expect(send.mock.calls.map((call) => call[1].text)).toEqual(["a", "b"]);
    queue.settle(send.mock.calls[0]![0], audio);
    expect(send.mock.calls.map((call) => call[1].text)).toEqual(["a", "b", "c"]);
    await expect(results[0]).resolves.toBe(audio);
  });

  it("drops cancelled requests immediately so repeated speed changes never fill it", async () => {
    const queue = new SynthesisQueue(2, 3);
    const send = vi.fn();
    queue.attach(send);
    queue.enqueue(request("playing-1"));
    queue.enqueue(request("playing-2"));
    for (let change = 0; change < 5; change += 1) {
      const controllers = [0, 1, 2].map(() => new AbortController());
      const pending = controllers.map((controller, index) =>
        queue.enqueue(request(`chunk-${index}`, controller.signal)),
      );
      for (const controller of controllers) controller.abort();
      await Promise.allSettled(pending);
    }
    expect(queue.size).toBe(0);
    void queue.enqueue(request("next"));
    expect(queue.size).toBe(1);
  });

  it("reports busy only when live requests exceed capacity", async () => {
    const queue = new SynthesisQueue(1, 1);
    queue.attach(vi.fn());
    void queue.enqueue(request("running"));
    void queue.enqueue(request("waiting"));
    await expect(queue.enqueue(request("overflow"))).rejects.toBeInstanceOf(SynthesisBusyError);
  });

  it("puts the first chunk of a new reading ahead of queued prefetches", () => {
    const queue = new SynthesisQueue(1, 12);
    const send = vi.fn();
    queue.attach(send);
    void queue.enqueue(request("running"));
    void queue.enqueue(request("prefetch"));
    void queue.enqueue({ ...request("opening"), first: true });
    queue.settle(send.mock.calls[0]![0], audio);
    expect(send.mock.calls.map((call) => call[1].text)).toEqual(["running", "opening"]);
  });

  it("recognizes when only abandoned audio is being computed", () => {
    const queue = new SynthesisQueue(2, 12);
    queue.attach(vi.fn());
    const controller = new AbortController();
    void queue.enqueue(request("old", controller.signal)).catch(() => {});
    expect(queue.onlyAbandonedWork).toBe(false);
    controller.abort();
    expect(queue.onlyAbandonedWork).toBe(true);
    queue.detach(new Error("Cancelled"));
    expect(queue.idle).toBe(true);
  });
});
