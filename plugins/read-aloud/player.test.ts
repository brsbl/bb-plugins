// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ReadAloudPlayer, type FetchSpeech } from "./player";

let requests: Array<{ text: string; speed: number; signal: AbortSignal; resolve(): void }>;
let playing: HTMLMediaElement | null;

beforeEach(() => {
  requests = [];
  playing = null;
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(async function (
    this: HTMLMediaElement,
  ) {
    playing = this;
  });
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  let nextUrl = 0;
  URL.createObjectURL = vi.fn(() => `blob:chunk-${nextUrl++}`);
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => vi.restoreAllMocks());

// Like fetch, a request rejects as soon as its signal aborts.
const fetchSpeech: FetchSpeech = (text, speed, signal) =>
  new Promise((resolve, reject) => {
    signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    requests.push({ text, speed, signal, resolve: () => resolve(new Blob([text])) });
  });

const flush = async () => {
  for (let tick = 0; tick < 5; tick += 1) await new Promise((resolve) => setTimeout(resolve, 0));
};

describe("ReadAloudPlayer", () => {
  it("prefetches two chunks ahead and plays them in order", async () => {
    const player = new ReadAloudPlayer(fetchSpeech);
    const onFinished = vi.fn();
    player.speak("m", ["One.", "Two.", "Three.", "Four."], 1, {
      onPlaying: vi.fn(),
      onFinished,
      onError: vi.fn(),
    });
    expect(requests.map((request) => request.text)).toEqual(["One.", "Two.", "Three."]);
    for (const request of requests) request.resolve();
    await flush();
    for (let index = 0; index < 4; index += 1) {
      playing!.onended?.(new Event("ended"));
      await flush();
      requests.at(-1)!.resolve();
      await flush();
    }
    expect(requests.map((request) => request.text)).toEqual(["One.", "Two.", "Three.", "Four."]);
    expect(onFinished).toHaveBeenCalledOnce();
  });

  it("re-requests audio that has not started playing at the new speed", async () => {
    const player = new ReadAloudPlayer(fetchSpeech);
    player.speak("m", ["One.", "Two.", "Three."], 1, {
      onPlaying: vi.fn(),
      onFinished: vi.fn(),
      onError: vi.fn(),
    });
    const original = [...requests];
    player.setSpeed(2);
    expect(original.every((request) => request.signal.aborted)).toBe(true);
    expect(requests.slice(3).map((request) => [request.text, request.speed])).toEqual([
      ["One.", 2],
      ["Two.", 2],
      ["Three.", 2],
    ]);
    requests[3]!.resolve();
    await flush();
    expect(playing?.src).toBe("blob:chunk-0");
  });

  it("stop cancels outstanding requests and never reports finishing", async () => {
    const player = new ReadAloudPlayer(fetchSpeech);
    const onFinished = vi.fn();
    player.speak("m", ["One.", "Two."], 1, { onPlaying: vi.fn(), onFinished, onError: vi.fn() });
    player.stop();
    expect(requests.every((request) => request.signal.aborted)).toBe(true);
    expect(player.isReading("m")).toBe(false);
    for (const request of requests) request.resolve();
    await flush();
    expect(onFinished).not.toHaveBeenCalled();
  });
});
