// @vitest-environment jsdom

import { installTestPluginRuntime } from "@bb/plugin-sdk/testing/app";
import { describe, expect, it, vi } from "vitest";

interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(error: unknown): void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

async function loadApp() {
  installTestPluginRuntime();
  return (await import("./app.js")).default;
}

function composerBuilder(customize: ReturnType<typeof vi.fn>) {
  return { customize };
}

describe("Improve Prompt app registration", () => {
  it("persists helper choices in selection order and ignores stale failures", async () => {
    installTestPluginRuntime();
    const { createHelperExecutionSaveQueue } = await import("./app.js");
    const first = deferred<void>();
    const second = deferred<void>();
    const save = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const results: boolean[] = [];
    const enqueue = createHelperExecutionSaveQueue(save, (failed) =>
      results.push(failed),
    );
    const firstChoice = {
      mode: "fixed" as const,
      providerId: "codex",
      model: "first",
    };
    const latestChoice = {
      mode: "fixed" as const,
      providerId: "codex",
      model: "latest",
    };

    enqueue(firstChoice);
    enqueue(latestChoice);
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save).toHaveBeenLastCalledWith(firstChoice);

    first.reject(new Error("stale save failed"));
    await first.promise.catch(() => undefined);
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    expect(save).toHaveBeenLastCalledWith(latestChoice);
    expect(results).toEqual([]);

    second.resolve();
    await second.promise;
    await vi.waitFor(() => expect(results).toEqual([false]));
  });

  it.each(["contentScripts", "experimental_contentScripts"] as const)(
    "registers thread status through the %s builder",
    async (builderKey) => {
      const app = await loadApp();
      const customize = vi.fn();
      const register = vi.fn();

      Reflect.apply(app.setup, undefined, [
        {
          composer: composerBuilder(customize),
          [builderKey]: { register },
        },
      ]);

      expect(register).toHaveBeenCalledWith(
        expect.objectContaining({ id: "thread-status" }),
      );
      expect(customize).toHaveBeenCalledWith(
        expect.objectContaining({ id: "improve-prompt" }),
      );
    },
  );

  it("prefers the stable builder when both names are present", async () => {
    const app = await loadApp();
    const stableRegister = vi.fn();
    const legacyRegister = vi.fn();

    Reflect.apply(app.setup, undefined, [
      {
        composer: composerBuilder(vi.fn()),
        contentScripts: { register: stableRegister },
        experimental_contentScripts: { register: legacyRegister },
      },
    ]);

    expect(stableRegister).toHaveBeenCalledOnce();
    expect(legacyRegister).not.toHaveBeenCalled();
  });

  it("still registers the composer when content scripts are unavailable", async () => {
    const app = await loadApp();
    const customize = vi.fn();

    expect(() =>
      Reflect.apply(app.setup, undefined, [
        { composer: composerBuilder(customize) },
      ]),
    ).not.toThrow();
    expect(customize).toHaveBeenCalledWith(
      expect.objectContaining({ id: "improve-prompt" }),
    );
  });
});
