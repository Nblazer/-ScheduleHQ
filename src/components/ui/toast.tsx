"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";

type Tone = "success" | "error" | "info" | "warning";
type Toast = { id: number; tone: Tone; title: string; description?: string };

type Ctx = {
  push: (tone: Tone, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const ToastCtx = React.createContext<Ctx | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const idRef = React.useRef(0);

  const push = React.useCallback((tone: Tone, title: string, description?: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, tone, title, description }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const api = React.useMemo<Ctx>(
    () => ({
      push,
      success: (t, d) => push("success", t, d),
      error: (t, d) => push("error", t, d),
      info: (t, d) => push("info", t, d),
    }),
    [push],
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto rounded-lg border bg-card shadow-lg p-3 flex items-start gap-3 animate-slide-up",
              t.tone === "success" && "border-emerald-500/30",
              t.tone === "error" && "border-rose-500/40",
              t.tone === "warning" && "border-amber-500/40",
              t.tone === "info" && "border-sky-500/30",
            )}
          >
            {t.tone === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />}
            {t.tone === "error" && <XCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />}
            {t.tone === "warning" && <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />}
            {t.tone === "info" && <Info className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />}
            <div className="min-w-0">
              <div className="font-medium text-sm">{t.title}</div>
              {t.description ? <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
