"use client";

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { t } from "@/lib/i18n";

type Kind = "success" | "error" | "warning" | "info";
type Toast = { id: number; kind: Kind; message: string };
type ConfirmOptions = { title: string; message: string; confirmText?: string; danger?: boolean };

type Feedback = {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const FeedbackContext = createContext<Feedback | null>(null);

const STYLES: Record<Kind, { box: string; icon: React.ReactNode }> = {
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: <CheckCircle2 className="size-5 text-emerald-600" /> },
  error: { box: "border-red-200 bg-red-50 text-red-800", icon: <XCircle className="size-5 text-red-600" /> },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-800", icon: <AlertTriangle className="size-5 text-amber-600" /> },
  info: { box: "border-sky-200 bg-sky-50 text-sky-800", icon: <Info className="size-5 text-sky-600" /> },
};

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(value: boolean) => void>(null);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const push = useCallback((kind: Kind, message: string) => {
    const id = nextId.current++;
    setToasts((all) => [...all, { id, kind, message }]);
    setTimeout(() => dismiss(id), kind === "error" ? 7000 : 4000);
  }, [dismiss]);

  const value = useMemo<Feedback>(() => ({
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    warning: (m) => push("warning", m),
    confirm: (options) => new Promise((resolve) => {
      resolver.current = resolve;
      setDialog(options);
    }),
  }), [push]);

  const answer = (result: boolean) => {
    resolver.current?.(result);
    setDialog(null);
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div className="no-print fixed right-4 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`flex items-start gap-3 rounded-xl border p-3 shadow-lg ${STYLES[toast.kind].box}`}>
            {STYLES[toast.kind].icon}
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button onClick={() => dismiss(toast.id)} aria-label={t("Close")}><X className="size-4 opacity-60" /></button>
          </div>
        ))}
      </div>

      {dialog && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" role="alertdialog" aria-modal="true">
            <h2 className="text-lg font-semibold">{dialog.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{dialog.message}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium" onClick={() => answer(false)}>{t("Cancel")}</button>
              <button
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${dialog.danger ? "bg-red-600 hover:bg-red-700" : "bg-brand-600 hover:bg-brand-700"}`}
                onClick={() => answer(true)}
              >
                {dialog.confirmText ?? t("Yes, continue")}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useFeedback must be used inside FeedbackProvider");
  return context;
}
