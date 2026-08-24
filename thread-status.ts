import type { PluginComposerThreadRowStatus } from "@get-bb/plugin-sdk/app";

export const THREAD_ROW_STATUS = {
  icon: "AiContentGenerator01",
  label: "Improve Prompt is improving the draft",
  tone: "running",
} as const satisfies PluginComposerThreadRowStatus;

export type PromptRunState = "running" | "terminal";

export interface TrackedPromptRun {
  getState(): Promise<PromptRunState>;
  requestId: string;
  threadId: string;
}

interface PromptThreadStatusControllerOptions {
  clearInterval?: (timer: number) => void;
  pollIntervalMs?: number;
  setInterval?: (callback: () => void, delayMs: number) => number;
}

type SetThreadRowStatus = (
  threadId: string,
  status: PluginComposerThreadRowStatus | null,
) => void;

export class PromptThreadStatusController {
  private readonly clearInterval: (timer: number) => void;
  private readonly pollIntervalMs: number;
  private readonly runs = new Map<
    string,
    TrackedPromptRun & { polling: boolean }
  >();
  private readonly setInterval: (
    callback: () => void,
    delayMs: number,
  ) => number;
  private timer: number | null = null;

  constructor(
    private readonly setThreadRowStatus: SetThreadRowStatus,
    options: PromptThreadStatusControllerOptions = {},
  ) {
    this.pollIntervalMs = options.pollIntervalMs ?? 2_000;
    this.setInterval =
      options.setInterval ??
      ((callback, delayMs) => window.setInterval(callback, delayMs));
    this.clearInterval =
      options.clearInterval ?? ((timer) => window.clearInterval(timer));
  }

  track(run: TrackedPromptRun): void {
    const previous = this.runs.get(run.requestId);
    this.runs.set(run.requestId, { ...run, polling: false });
    if (
      previous !== undefined &&
      previous.threadId !== run.threadId &&
      !this.hasRunForThread(previous.threadId)
    ) {
      this.setThreadRowStatus(previous.threadId, null);
    }
    this.setThreadRowStatus(run.threadId, THREAD_ROW_STATUS);
    this.ensureTimer();
  }

  clear(requestId: string): void {
    const run = this.runs.get(requestId);
    if (run === undefined) return;
    this.runs.delete(requestId);
    if (!this.hasRunForThread(run.threadId)) {
      this.setThreadRowStatus(run.threadId, null);
    }
    this.stopTimerIfIdle();
  }

  async reconcileNow(): Promise<void> {
    await Promise.all(
      [...this.runs.values()].map(async (run) => {
        if (run.polling) return;
        run.polling = true;
        try {
          if ((await run.getState()) === "terminal") {
            this.clear(run.requestId);
          }
        } catch {
          // Polling is only a reconciliation hint. Preserve the indicator and
          // retry while the durable plugin request can still be running.
        } finally {
          const current = this.runs.get(run.requestId);
          if (current === run) current.polling = false;
        }
      }),
    );
  }

  dispose(): void {
    if (this.timer !== null) {
      this.clearInterval(this.timer);
      this.timer = null;
    }
    const threadIds = new Set([...this.runs.values()].map((run) => run.threadId));
    this.runs.clear();
    for (const threadId of threadIds) {
      this.setThreadRowStatus(threadId, null);
    }
  }

  private ensureTimer(): void {
    if (this.timer !== null) return;
    this.timer = this.setInterval(() => {
      void this.reconcileNow();
    }, this.pollIntervalMs);
  }

  private hasRunForThread(threadId: string): boolean {
    return [...this.runs.values()].some((run) => run.threadId === threadId);
  }

  private stopTimerIfIdle(): void {
    if (this.runs.size > 0 || this.timer === null) return;
    this.clearInterval(this.timer);
    this.timer = null;
  }
}

let controller: PromptThreadStatusController | null = null;

export function installPromptThreadStatusController(
  setThreadRowStatus: SetThreadRowStatus,
): () => void {
  const next = new PromptThreadStatusController(setThreadRowStatus);
  controller?.dispose();
  controller = next;
  return () => {
    if (controller !== next) return;
    controller = null;
    next.dispose();
  };
}

export function trackPromptRun(run: TrackedPromptRun): void {
  controller?.track(run);
}

export function clearPromptRun(requestId: string): void {
  controller?.clear(requestId);
}
