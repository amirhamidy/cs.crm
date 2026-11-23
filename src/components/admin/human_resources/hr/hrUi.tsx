"use client";

import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

export const inputCls =
  "h-10 w-full rounded-xl border border-gray-100 bg-gray-50 px-3 text-[12px] font-semibold text-gray-800 outline-none transition focus:border-indigo-400 disabled:opacity-60 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400">{label}</span>
      {children}
      {hint && <span className="block text-[10px] font-semibold text-gray-400">{hint}</span>}
    </label>
  );
}

export const TextInput = (p: InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} className={`${inputCls} ${p.className ?? ""}`} />
);

export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={`${inputCls} ${p.className ?? ""}`} />
);

export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
      <AlertCircle size={14} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function PrimaryButton({
  loading,
  children,
  ...rest
}: { loading?: boolean; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-indigo-600 px-5 text-[12px] font-extrabold text-white transition hover:bg-indigo-500 disabled:opacity-60 ${rest.className ?? ""}`}
    >
      {loading && <Loader2 size={13} className="animate-spin" />}
      {children}
    </button>
  );
}

export function GhostButton(p: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...p}
      className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-gray-200 px-5 text-[12px] font-extrabold text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5 ${p.className ?? ""}`}
    />
  );
}

export function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text?: string }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-[1.45rem] border border-dashed border-gray-200 bg-white text-center dark:border-white/[0.07] dark:bg-[#111827]">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-400 dark:bg-indigo-500/10">
        {icon}
      </div>
      <h3 className="text-[12.5px] font-extrabold text-gray-800 dark:text-white">{title}</h3>
      {text && <p className="mt-1.5 max-w-xs text-[10.5px] font-semibold leading-5 text-gray-400">{text}</p>}
    </div>
  );
}

export function Badge({ className, children }: { className: string; children: ReactNode }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${className}`}>{children}</span>;
}

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
      <span className="text-[10.5px] font-bold text-gray-400">{label}</span>
      <span className="text-[11.5px] font-extrabold text-gray-800 dark:text-white">{value}</span>
    </div>
  );
}
