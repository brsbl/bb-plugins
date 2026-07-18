import { useEffect, useSyncExternalStore } from "react";

type ComposerScope =
  | { kind: "thread"; threadId: string }
  | {
      kind: "queued-message";
      threadId: string;
      queuedMessageId: string;
    }
  | { kind: "new-thread"; projectId: string | null };
type TextEffect = "shimmer" | null;
type RpcHandler = (input: unknown) => unknown | Promise<unknown>;

interface TestRuntime {
  text: string;
  attachments: string[];
  scope: ComposerScope;
  textEffect: TextEffect;
  textEffectCalls: TextEffect[];
  focusCount: number;
  rpcHandlers: Map<string, RpcHandler>;
  rpcCalls: Array<{ method: string; input: unknown }>;
}

const listeners = new Set<() => void>();
const realtimeHandlers = new Map<string, Set<(payload: unknown) => void>>();

const runtime: TestRuntime = {
  text: "",
  attachments: [],
  scope: { kind: "new-thread", projectId: null },
  textEffect: null,
  textEffectCalls: [],
  focusCount: 0,
  rpcHandlers: new Map(),
  rpcCalls: [],
};

function notify(): void {
  for (const listener of [...listeners]) listener();
}

export function resetTestPluginRuntime(input?: {
  text?: string;
  attachments?: string[];
  scope?: ComposerScope;
  rpc?: Record<string, RpcHandler>;
}): void {
  runtime.text = input?.text ?? "";
  runtime.attachments = [...(input?.attachments ?? [])];
  runtime.scope =
    input?.scope ?? ({ kind: "new-thread", projectId: null } as const);
  runtime.textEffect = null;
  runtime.textEffectCalls = [];
  runtime.focusCount = 0;
  runtime.rpcHandlers = new Map(Object.entries(input?.rpc ?? {}));
  runtime.rpcCalls = [];
  realtimeHandlers.clear();
  notify();
}

export function setTestComposerText(text: string): void {
  runtime.text = text;
  notify();
}

export function getTestPluginRuntime(): Readonly<TestRuntime> {
  return runtime;
}

export function definePluginApp(setup: (app: unknown) => void) {
  return { __bbPluginApp: true as const, setup };
}

export function useComposer() {
  const text = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => runtime.text,
    () => runtime.text,
  );

  return {
    scope: runtime.scope,
    text,
    setText(next: string) {
      runtime.text = next;
      notify();
    },
    updateText(updater: (current: string) => string) {
      runtime.text = updater(runtime.text);
      notify();
    },
    clear() {
      runtime.text = "";
      notify();
    },
    setTextEffect(effect: TextEffect) {
      runtime.textEffect = effect;
      runtime.textEffectCalls.push(effect);
    },
    addQuote() {},
    insertMention() {},
    focus() {
      runtime.focusCount += 1;
    },
  };
}

export function useRpc() {
  return {
    async call(method: string, input: unknown) {
      runtime.rpcCalls.push({ method, input });
      const handler = runtime.rpcHandlers.get(method);
      if (!handler) throw new Error(`No test RPC handler for ${method}`);
      return handler(input);
    },
  };
}

export function useRealtime(
  channel: string,
  handler: (payload: unknown) => void,
): void {
  useEffect(() => {
    let handlers = realtimeHandlers.get(channel);
    if (!handlers) {
      handlers = new Set();
      realtimeHandlers.set(channel, handlers);
    }
    handlers.add(handler);
    return () => {
      handlers.delete(handler);
    };
  }, [channel, handler]);
}
