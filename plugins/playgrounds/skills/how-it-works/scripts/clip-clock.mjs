export const FRAME_MS = 1000 / 30;

// Installed before card scripts can retain a wall-clock callback or timestamp.
// CSS/Web Animations use CDP's frozen animation timeline and are sought below.
function installClock() {
  let now = 0, nextId = 1;
  const NativeDate = Date, epoch = NativeDate.now();
  const timers = new Map(), frames = new Map(), animations = new WeakMap();
  globalThis.Date = new Proxy(NativeDate, {
    apply: () => new NativeDate(epoch + now).toString(),
    construct: (target, args, newTarget) => Reflect.construct(target, args.length ? args : [epoch + now], newTarget),
    get: (target, key) => key === "now" ? () => Math.floor(epoch + now) : Reflect.get(target, key),
  });
  Object.defineProperty(performance, "now", { value: () => now });
  globalThis.requestAnimationFrame = (callback) => { const id = nextId++; frames.set(id, callback); return id; };
  globalThis.cancelAnimationFrame = (id) => frames.delete(id);
  function timer(callback, delay, repeat, args) {
    if (typeof callback !== "function") throw new TypeError("Clip timers require a function callback.");
    const id = nextId++, wait = Math.max(1, Number(delay) || 0);
    timers.set(id, { callback, args, at: now + wait, repeat: repeat ? wait : 0 });
    return id;
  }
  globalThis.setTimeout = (callback, delay, ...args) => timer(callback, delay, false, args);
  globalThis.setInterval = (callback, delay, ...args) => timer(callback, delay, true, args);
  globalThis.clearTimeout = globalThis.clearInterval = (id) => timers.delete(id);
  function seekAnimations() {
    for (const animation of document.getAnimations()) {
      const last = animations.get(animation);
      if (last !== undefined && animation.playState === "running") {
        animation.currentTime = (animation.currentTime ?? 0) + (now - last) * animation.playbackRate;
      }
      animations.set(animation, now);
    }
  }
  Object.defineProperty(globalThis, "__bbClipClock", { value: async (time) => {
    if (!Number.isFinite(time) || time < now) throw new Error("Invalid clip time.");
    let count = 0;
    for (;;) {
      let due;
      for (const entry of timers) if (entry[1].at <= time && (!due || entry[1].at < due[1].at)) due = entry;
      if (!due) break;
      if (++count > 10000) throw new Error("Too many timer callbacks in one clip frame.");
      const [id, task] = due;
      now = task.at;
      if (task.repeat) task.at += task.repeat; else timers.delete(id);
      task.callback(...task.args);
      await Promise.resolve();
    }
    now = time;
    seekAnimations();
    const batch = [...frames];
    for (const [id, callback] of batch) {
      if (!frames.delete(id)) continue;
      callback(now);
      await Promise.resolve();
    }
    seekAnimations();
  }});
}

export const CLOCK_SOURCE = `(${installClock.toString()})();`;

export function clipClock(send, evaluate) {
  return {
    advanceTo: (ms) => evaluate(`window.__bbClipClock(${JSON.stringify(ms)})`),
    async capture() {
      const frame = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      return Buffer.from(frame.result.data, "base64");
    },
  };
}
