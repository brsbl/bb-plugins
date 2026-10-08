import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

// A per-surface toast line (page, side panel, inline calendar). Undo for a
// delete lives here, so it shows beside the calendar it came from.

export interface ToastInput { message: string; action?: { label: string; run: () => void }; duration?: number; tone?: "info" | "error" }
interface Toast extends ToastInput { id: number }
interface ToastApi { show(toast: ToastInput): () => void }

const ToastContext = createContext<ToastApi>({ show: () => () => {} });
export const useToasts = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);
  const show = useCallback((toast: ToastInput) => {
    const id = ++next.current;
    setToasts((list) => [...list.slice(-2), { ...toast, id }]);
    timers.current.set(id, setTimeout(() => dismiss(id), toast.duration ?? 4000));
    return () => dismiss(id);
  }, [dismiss]);
  useEffect(() => () => { for (const timer of timers.current.values()) clearTimeout(timer); }, []);
  const api = useMemo(() => ({ show }), [show]);
  return <ToastContext.Provider value={api}>
    {children}
    <div className="cc-toasts" role="status" aria-live="polite">
      {toasts.map((toast) => <div key={toast.id} className={toast.tone === "error" ? "cc-toast cc-toast-error" : "cc-toast"}>
        <span>{toast.message}</span>
        {toast.action && <button type="button" className="cc-link" onClick={() => { toast.action!.run(); dismiss(toast.id); }}>{toast.action.label}</button>}
      </div>)}
    </div>
  </ToastContext.Provider>;
}
