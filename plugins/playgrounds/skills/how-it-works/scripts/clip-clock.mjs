export const FRAME_MS = 1000 / 30;

// Chromium's virtual clock drives timers, Date, performance.now, rAF and CSS.
// A completed BeginFrame is the paint barrier; wall-clock encoder/CDP latency
// never consumes animation time. Only dedicated headless shell supports this.
export async function clipClock(send, onceEvent) {
  const paused = await send("Emulation.setVirtualTimePolicy", { policy: "pause" });
  const base = paused.result.virtualTimeTicksBase;
  let elapsed = 0;
  return {
    async advanceTo(ms) {
      const budget = ms - elapsed;
      if (budget <= 0) return;
      const expired = onceEvent("Emulation.virtualTimeBudgetExpired");
      await send("Emulation.setVirtualTimePolicy", { policy: "pauseIfNetworkFetchesPending", budget, maxVirtualTimeTaskStarvationCount: 100000 });
      await expired;
      elapsed = ms;
    },
    async capture() {
      const frame = await send("HeadlessExperimental.beginFrame", {
        frameTimeTicks: base + Math.max(0.01, elapsed), interval: FRAME_MS,
        screenshot: { format: "png" },
      });
      if (!frame.result?.screenshotData) throw new Error("Chrome did not capture the requested virtual frame.");
      return Buffer.from(frame.result.screenshotData, "base64");
    },
  };
}
