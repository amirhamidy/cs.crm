"use client";

import { useEffect, type ReactNode } from "react";
import { m } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  
  busy?: boolean;
  maxWidthClass?: string;
}

export default function Modal({ title, onClose, children, busy = false, maxWidthClass = "max-w-lg" }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [busy, onClose]);

  return (
    <m.div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <m.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        dir="rtl"
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-black/[0.06] bg-white shadow-2xl dark:border-white/[0.08] dark:bg-gray-900 sm:rounded-3xl ${maxWidthClass}`}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ duration: 0.18 }}
      >
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4 dark:border-white/5">
          <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="بستن"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/5 text-gray-500 transition-colors hover:bg-black/10 disabled:opacity-40 dark:bg-white/5 dark:text-gray-400"
          >
            <X size={15} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </m.div>
    </m.div>
  );
}
