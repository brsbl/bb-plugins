import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { WindowTitleBar } from "../windows";

interface AskTextRequest {
  title: string;
  label: string;
  initial: string;
  confirmLabel: string;
  resolve: (value: string | null) => void;
}

let pending: AskTextRequest | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/**
 * Asks for a line of text in an XP dialog over the desktop. `window.prompt` does nothing in bb's desktop app, so
 * everything that asks for a name uses this instead. Resolves to the trimmed text, or null when cancelled or empty.
 */
export function askText(options: { title: string; label: string; initial?: string; confirmLabel?: string }): Promise<string | null> {
  pending?.resolve(null);
  return new Promise((resolve) => {
    pending = {
      title: options.title,
      label: options.label,
      initial: options.initial ?? "",
      confirmLabel: options.confirmLabel ?? "OK",
      resolve: (value) => {
        pending = null;
        emit();
        resolve(value);
      },
    };
    emit();
  });
}

function usePending(): AskTextRequest | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => pending,
  );
}

export function AskTextDialog() {
  const request = usePending();
  return request === null ? null : <AskTextForm key={request.title + request.initial} request={request} />;
}

function AskTextForm({ request }: { request: AskTextRequest }) {
  const [value, setValue] = useState(request.initial);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);
  const submit = () => {
    const text = value.trim();
    request.resolve(text === "" ? null : text);
  };
  return (
    <div className="bbd-ask" onPointerDown={(event) => event.stopPropagation()}>
      <form
        role="dialog"
        aria-label={request.title}
        className="bbd-window bbd-ask-window"
        data-focused="true"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Escape") request.resolve(null);
        }}
      >
        <WindowTitleBar title={request.title} icon={null} onClose={() => request.resolve(null)} />
        <div className="bbd-window-body bbd-ask-body">
          <label className="flex flex-col gap-1.5">
            <span>{request.label}</span>
            <input
              ref={inputRef}
              className="bbd-field bbd-sunken"
              value={value}
              maxLength={200}
              onChange={(event) => setValue(event.target.value)}
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="submit" className="bbd-button bbd-bevel" disabled={value.trim() === ""}>{request.confirmLabel}</button>
            <button type="button" className="bbd-button bbd-bevel" onClick={() => request.resolve(null)}>Cancel</button>
          </div>
        </div>
      </form>
    </div>
  );
}
