"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type ConfirmOptions = { title?: string; message: string; confirmText?: string; cancelText?: string; danger?: boolean };
type DialogState =
  | ({ kind: "confirm" } & ConfirmOptions)
  | { kind: "notice"; title?: string; message: string };

/**
 * Modal replacement for window.confirm / window.alert.
 * Usage:
 *   const { confirm, notify, dialog } = useDialogs();
 *   if (!(await confirm({ message: "حذف شود؟", danger: true }))) return;
 *   notify("ذخیره شد");
 *   ...return <>...{dialog}</>;
 */
export function useDialogs() {
  const [state, setState] = useState<DialogState | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const close = useCallback((v: boolean) => {
    resolver.current?.(v);
    resolver.current = null;
    setState(null);
  }, []);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setState({ kind: "confirm", ...opts });
    });
  }, []);

  const notify = useCallback((message: string, title = "توجه") => {
    resolver.current = null;
    setState({ kind: "notice", title, message });
  }, []);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toast = useCallback((message: string) => setToastMsg(message), []);
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2600);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const dialog: ReactNode = (
    <>
    <AnimatePresence>
      {toastMsg && (
        <motion.div
          key="toast"
          dir="rtl"
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-[110] flex -translate-x-1/2 items-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-[12px] font-extrabold text-white shadow-lg dark:bg-white dark:text-gray-900"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
        >
          <CheckCircle2 size={15} className="text-emerald-400 dark:text-emerald-600" />
          {toastMsg}
        </motion.div>
      )}
    </AnimatePresence>
    <AnimatePresence>
      {state && (
        <motion.div
          key="dialog-backdrop"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => close(false)}
        >
          <motion.div
            dir="rtl"
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-[1.6rem] bg-white p-5 shadow-xl dark:bg-[#111827]"
            initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${state.kind === "confirm" && !state.danger ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10" : "bg-rose-50 text-rose-600 dark:bg-rose-500/10"}`}>
                <AlertCircle size={18} />
              </div>
              <div className="min-w-0 flex-1">
                {state.title && <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">{state.title}</h3>}
                <p className="mt-1 text-[12px] font-semibold leading-6 text-gray-500 dark:text-gray-300">{state.message}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              {state.kind === "confirm" ? (
                <>
                  <button type="button" onClick={() => close(false)} className="rounded-full bg-gray-100 px-4 py-2 text-[12px] font-extrabold text-gray-600 hover:bg-gray-200 dark:bg-white/[0.06] dark:text-gray-300">
                    {state.cancelText ?? "انصراف"}
                  </button>
                  <button type="button" onClick={() => close(true)} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-extrabold text-white ${state.danger ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700"}`}>
                    {state.confirmText ?? "تأیید"}
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => close(true)} className="rounded-full bg-indigo-600 px-4 py-2 text-[12px] font-extrabold text-white hover:bg-indigo-700">
                  متوجه شدم
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );

  return { confirm, notify, toast, dialog };
}
