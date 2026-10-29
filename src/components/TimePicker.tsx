"use client";

const H = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const M = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const fa = (s: string) => s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const CLS =
  "h-11 w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 px-3 text-center text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-slate-900 dark:text-white";


export default function TimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [h = "", m = ""] = value ? value.split(":") : [];
  const set = (nh: string, nm: string) => onChange(`${nh || "00"}:${nm || "00"}`);
  return (
    <div className="flex items-center gap-2" dir="ltr">
      <select aria-label="ساعت" value={h} onChange={(e) => set(e.target.value, m)} className={CLS}>
        <option value="" disabled>ساعت</option>
        {H.map((x) => <option key={x} value={x}>{fa(x)}</option>)}
      </select>
      <span className="font-bold text-gray-400">:</span>
      <select aria-label="دقیقه" value={m} onChange={(e) => set(h, e.target.value)} className={CLS}>
        <option value="" disabled>دقیقه</option>
        {M.map((x) => <option key={x} value={x}>{fa(x)}</option>)}
      </select>
    </div>
  );
}
