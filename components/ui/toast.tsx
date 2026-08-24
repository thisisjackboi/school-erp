"use client";

import React, { createContext, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: "success" | "error" | "info";
}

interface ToastContextType {
  toast: (title: string, description?: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = (title: string, description?: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start p-4 rounded-lg shadow-lg border text-sm transition-all duration-200 animate-in slide-in-from-bottom-5",
              t.type === "success" && "bg-white dark:bg-slate-900 border-emerald-500 text-emerald-950 dark:text-emerald-100",
              t.type === "error" && "bg-white dark:bg-slate-900 border-red-500 text-red-950 dark:text-red-100",
              t.type === "info" && "bg-white dark:bg-slate-900 border-blue-500 text-blue-950 dark:text-blue-100"
            )}
          >
            <div className="mr-3 mt-0.5">
              {t.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              {t.type === "error" && <AlertCircle className="h-5 w-5 text-red-600" />}
              {t.type === "info" && <Info className="h-5 w-5 text-blue-600" />}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">{t.title}</h4>
              {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
            </div>
            <button onClick={() => removeToast(t.id)} className="ml-2 text-slate-400 hover:text-slate-600">
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
