"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: "success" | "error" | "info";
}

type ToastType = "success" | "error" | "info";

const DURATION_MS: Record<ToastType, number> = {
  success: 3000,
  info: 4000,
  error: 6000,
};

const MAX_VISIBLE = 4;

const SERVER_UNREACHABLE =
  "Cannot reach the server. It may be restarting, so please try again in a moment.";

const TRANSPORT_ERROR_PATTERNS = [
  /^failed to fetch$/i,
  /^networkerror when attempting to fetch resource\.?$/i,
  /^load failed$/i,
  /^network request failed$/i,
  /^err_(network|connection|internet|addressfamily)/i,
  /^the server could not be reached/i,
  /^request timed out after/i,
];

function normalizeDescription(description?: string): string | undefined {
  if (!description) return description;
  const trimmed = description.trim();
  if (!trimmed) return description;
  return TRANSPORT_ERROR_PATTERNS.some((pattern) => pattern.test(trimmed))
    ? SERVER_UNREACHABLE
    : description;
}

interface ToastContextType {
  toast: (
    title: string,
    description?: string,
    type?: "success" | "error" | "info",
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastsRef = useRef<ToastMessage[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const clearTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const removeFromState = useCallback((id: string) => {
    const current = toastsRef.current;
    const next = current.filter((t) => t.id !== id);
    if (next.length === current.length) return;
    toastsRef.current = next;
    setToasts(next);
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id);
      removeFromState(id);
    },
    [clearTimer, removeFromState],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const scheduleRemoval = useCallback(
    (id: string, type: ToastType) => {
      clearTimer(id);
      const timer = setTimeout(() => {
        timersRef.current.delete(id);
        removeFromState(id);
      }, DURATION_MS[type]);
      timersRef.current.set(id, timer);
    },
    [clearTimer, removeFromState],
  );

  const toast = useCallback(
    (
      title: string,
      description?: string,
      type: ToastType = "success",
    ) => {
      const resolvedDescription = normalizeDescription(description);
      const current = toastsRef.current;

      const duplicate = current.find(
        (t) =>
          t.title === title &&
          t.description === resolvedDescription &&
          t.type === type,
      );
      if (duplicate) {
        scheduleRemoval(duplicate.id, type);
        return;
      }

      const id = Math.random().toString(36).substring(2, 9);
      let next = [...current, { id, title, description: resolvedDescription, type }];

      if (next.length > MAX_VISIBLE) {
        next
          .slice(0, next.length - MAX_VISIBLE)
          .forEach((t) => clearTimer(t.id));
        next = next.slice(next.length - MAX_VISIBLE);
      }

      toastsRef.current = next;
      setToasts(next);
      scheduleRemoval(id, type);
    },
    [clearTimer, scheduleRemoval],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start p-4 rounded-lg shadow-lg border text-sm transition-all duration-200 animate-in slide-in-from-bottom-5",
              t.type === "success" &&
                "bg-white dark:bg-slate-900 border-emerald-500 text-emerald-950 dark:text-emerald-100",
              t.type === "error" &&
                "bg-white dark:bg-slate-900 border-red-500 text-red-950 dark:text-red-100",
              t.type === "info" &&
                "bg-white dark:bg-slate-900 border-blue-500 text-blue-950 dark:text-blue-100",
            )}
          >
            <div className="mr-3 mt-0.5">
              {t.type === "success" && (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              )}
              {t.type === "error" && (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              {t.type === "info" && <Info className="h-5 w-5 text-blue-600" />}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">{t.title}</h4>
              {t.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t.description}
                </p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};
