"use client";

import { Children, type ReactElement, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import NiceSelect from "./NiceSelect";
import JalaliDatePicker from "./JalaliDatePicker";
import { AlertCircle, Loader2 } from "lucide-react";

export const inputCls =
  "h-11 w-full rounded-full border border-gray-200 bg-white px-5 text-sm text-black outline-none transition-all duration-200 focus:border-gray-400 disabled:opacity-60 dark:border-white/10 dark:bg-[#0b1220] dark:text-white dark:focus:border-white/30";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="relative block">
      <span className="pointer-events-none absolute right-3 top-0 z-10 -translate-y-1/2 rounded bg-white px-1.5 text-[10.5px] font-extrabold text-gray-500 dark:bg-[#0b1220] dark:text-gray-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[10px] font-semibold text-gray-400">{hint}</span>}
    </div>
  );
}

export const TextInput = (p: InputHTMLAttributes<HTMLInputElement>) =>
  p.type === "date" ? (
    <JalaliDatePicker value={String(p.value ?? "")} required={p.required} disabled={p.disabled}
      onChange={(v) => p.onChange?.({ target: { value: v } } as never)} />
  ) : (
    <input {...p} className={`${inputCls} ${p.className ?? ""}`} />
  );

export const Select = ({ children, value, onChange, className, disabled }: SelectHTMLAttributes<HTMLSelectElement>) => {
  const options = Children.toArray(children).flatMap((c) => {
    const el = c as ReactElement<{ value?: string; children?: ReactNode }>;
    if (!el?.props) return [];
    return [{ value: String(el.props.value ?? el.props.children ?? ""), label: String(Children.toArray(el.props.children).join("")) }];
  });
  return <NiceSelect value={String(value ?? "")} options={options} disabled={disabled} className={className}
    onChange={(v) => onChange?.({ target: { value: v } } as never)} />;
};

export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-full bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
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
      className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-indigo-600 px-5 text-[12px] font-extrabold text-white transition hover:bg-indigo-500 disabled:opacity-60 ${rest.className ?? ""}`}
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
      className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-gray-200 px-5 text-[12px] font-extrabold text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5 ${p.className ?? ""}`}
    />
  );
}

export function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text?: string }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-gray-200 bg-white text-center dark:border-white/[0.07] dark:bg-[#111827]">
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
