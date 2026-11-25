"use client";

import { useLayoutEffect, useRef, Children, type ReactElement, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import NiceSelect from "./NiceSelect";
export { EmptyState, ErrorBox } from "@/components/ui/States";
import JalaliDatePicker from "./JalaliDatePicker";
import { Loader2 } from "lucide-react";

export const inputCls =
  "h-11 w-full rounded-full border border-gray-200 bg-white px-5 text-sm text-black outline-none transition-all duration-200 hover:border-gray-300 focus:border-gray-400 focus:ring-4 focus:ring-gray-100 disabled:opacity-60 dark:border-white/10 dark:bg-[#0b1220] dark:text-white dark:hover:border-white/20 dark:focus:border-white/30 dark:focus:ring-white/5";

const FA = "۰۱۲۳۴۵۶۷۸۹";
const toEn = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String(FA.indexOf(d))).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660));
const toFa = (s: string) => s.replace(/[0-9]/g, (d) => FA[+d]);
const sepInt = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const sep = (s: string) => {
  const [i, d] = s.split(".");
  return d === undefined ? sepInt(i) : sepInt(i) + "." + d;
};
const clean = (s: string, decimal: boolean) => {
  let t = toEn(s).replace(/[٫\/]/g, ".");
  if (!decimal) return t.replace(/\D/g, "");
  t = t.replace(/[^\d.]/g, "");
  const k = t.indexOf(".");
  if (k >= 0) t = t.slice(0, k + 1) + t.slice(k + 1).replace(/\./g, "").slice(0, 2);
  return t;
};
const toFaD = (s: string) => toFa(s).replace(/\./g, "٫");

type NumProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { group?: boolean; decimal?: boolean };

/** Integer-only input: Persian digits, thousands separators, no spinner / wheel changes. */
function NumberInput({ group = true, decimal = false, value, onChange, min, max, step, className, ...rest }: NumProps) {
  const ref = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);
  const raw = clean(String(value ?? ""), decimal);
  const shown = toFaD(group ? sep(raw) : raw);

  useLayoutEffect(() => {
    if (caret.current !== null && ref.current && document.activeElement === ref.current) {
      ref.current.setSelectionRange(caret.current, caret.current);
    }
    caret.current = null;
  });

  return (
    <input
      {...rest}
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={shown}
      onWheel={(e) => e.currentTarget.blur()}
      onChange={(e) => {
        const el = e.target;
        const pos = el.selectionStart ?? el.value.length;
        const before = clean(el.value.slice(0, pos), decimal).length;
        let next = clean(el.value, decimal).replace(/^0+(?=\d)/, "");
        if (next.startsWith(".")) next = "0" + next;
        if (max !== undefined && next !== "" && Number(next) > Number(max)) next = String(max);
        const f = toFaD(group ? sep(next) : next);
        let seen = 0, idx = 0;
        while (idx < f.length && seen < before) { if (/[۰-۹٫]/.test(f[idx])) seen++; idx++; }
        caret.current = idx;
        onChange?.({ target: { value: next }, currentTarget: { value: next } } as never);
      }}
      className={`${inputCls} text-right font-bold ${className ?? ""}`}
    />
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="relative block">
      <span className="pointer-events-none absolute right-3 top-0 z-10 -translate-y-1/2 rounded bg-white px-1.5 text-[10.5px] font-extrabold text-gray-500 dark:bg-[#0b1220] dark:text-gray-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[10px] font-semibold text-gray-400">{hint}</span>}
    </div>
  );
}

export const TextInput = (p: InputHTMLAttributes<HTMLInputElement> & { group?: boolean; decimal?: boolean }) =>
  p.type === "number" ? (
    <NumberInput {...(p as NumProps)} />
  ) : p.type === "date" ? (
    <JalaliDatePicker value={String(p.value ?? "")} required={p.required} disabled={p.disabled}
      onChange={(v) => p.onChange?.({ target: { value: v } } as never)} />
  ) : (
    <input {...(({ group: _g, decimal: _d, ...r }) => r)(p)} className={`${inputCls} ${p.className ?? ""}`} />
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

export function PrimaryButton({
  loading,
  children,
  ...rest
}: { loading?: boolean; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-indigo-600 px-5 text-[12px] font-extrabold text-white transition hover:bg-indigo-500 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${rest.className ?? ""}`}
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
      className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-gray-200 px-5 text-[12px] font-extrabold text-gray-600 transition hover:bg-gray-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5 ${p.className ?? ""}`}
    />
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
