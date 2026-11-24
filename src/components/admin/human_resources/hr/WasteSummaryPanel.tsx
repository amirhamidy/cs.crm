"use client";
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { JALALI_MONTHS, todayJalali, toPersianDigits } from "@/lib/jalali";
import { ErrorBox, Field, Select, TextInput } from "./hrUi";
import { hrApi, errorMessage, fmtNum, type WasteGroup, type WasteSummary, type WasteSummaryParams } from "./hrApi";

const GROUPS: [WasteGroup, string][] = [["day", "روزانه"], ["week", "هفتگی"], ["month", "ماهانه"], ["year", "سالانه"]];

export default function WasteSummaryPanel({ documentId }: { documentId: number | null }) {
  const [jy0, jm0] = todayJalali();
  const [group, setGroup] = useState<WasteGroup>("month");
  const [mode, setMode] = useState<"jalali" | "range">("jalali");
  const [year, setYear] = useState(String(jy0));
  const [month, setMonth] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<WasteSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!documentId) return;
    let params: WasteSummaryParams;
    if (mode === "range") {
      if (!from || !to) { setData(null); return; }
      params = { group_by: group, date_from: from, date_to: to };
    } else {
      if (!year) return;
      params = { group_by: group, year: Number(year), ...(month ? { month: Number(month) } : {}) };
    }
    setLoading(true); setErr(null);
    try { setData(await hrApi.wasteDeductions.summary(documentId, params)); }
    catch (e) { setData(null); setErr(errorMessage(e)); }
    finally { setLoading(false); }
  }, [documentId, group, mode, year, month, from, to]);
  useEffect(() => { load(); }, [load]);

  if (!documentId) return <p className="text-[11.5px] font-bold text-gray-400">این فرد به پرونده منابع انسانی متصل نیست.</p>;
  const monthly = group === "month";
  const th = "px-3 py-2 text-right text-[10.5px] font-extrabold text-gray-500";
  const td = "px-3 py-2 text-[11.5px] font-bold text-gray-700 dark:text-gray-200";
  const t = data?.totals;

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex flex-wrap items-end gap-2">
        <Field label="تفکیک"><Select value={group} onChange={(e) => setGroup(e.target.value as WasteGroup)}>
          {GROUPS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
        <Field label="بازه"><Select value={mode} onChange={(e) => setMode(e.target.value as "jalali" | "range")}>
          <option value="jalali">سال / ماه شمسی</option><option value="range">از تاریخ تا تاریخ</option></Select></Field>
        {mode === "jalali" ? (<>
          <Field label="سال"><TextInput type="number" value={year} onChange={(e) => setYear(e.target.value)} /></Field>
          <Field label="ماه"><Select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">کل سال</option>
            {JALALI_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</Select></Field>
        </>) : (<>
          <Field label="از"><TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="تا"><TextInput type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        </>)}
        {loading && <Loader2 size={16} className="mb-3 animate-spin text-indigo-500" />}
      </div>
      {group === "day" && <p className="text-[10px] font-semibold text-gray-400">برای تفکیک روزانه بازه حداکثر ۴۰۰ روز است.</p>}
      <ErrorBox message={err} />
      {data && t && (<>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {([["تعداد ردیف", fmtNum(t.count)], ["ضایعات اضافه", fmtNum(t.excess_qty)],
            ["تأییدشده (قطعی)", fmtNum(t.approved_amount)], ["در انتظار (احتمالی)", fmtNum(t.pending_amount)],
            ["کسر نشد", fmtNum(t.waived_amount)], ["محاسبه‌شده", fmtNum(t.calculated_amount)],
            ["نیاز به بازبینی", fmtNum(t.needs_review)]] as [string, string][]).map(([l, v]) => (
            <div key={l} className="rounded-xl border border-gray-100 p-3 dark:border-white/[0.07]">
              <p className="text-[10px] font-bold text-gray-400">{l}</p>
              <p className="mt-1 text-[13px] font-extrabold text-gray-800 dark:text-white">{v}</p>
            </div>))}
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/[0.07]">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 dark:bg-white/5"><tr>
              <th className={th}>دوره</th><th className={th}>ضایعات</th><th className={th}>اضافه</th>
              <th className={th}>تأییدشده</th><th className={th}>در انتظار</th><th className={th}>کسر نشد</th>
              {monthly && <><th className={th}>حقوق پایه</th><th className={th}>خالص</th></>}
            </tr></thead>
            <tbody>
              {data.periods.map((p) => (
                <tr key={p.key} className="border-t border-gray-100 dark:border-white/[0.06]">
                  <td className={td}>{toPersianDigits(p.label)}{p.needs_review > 0 && <span className="mr-1 text-amber-500">●</span>}</td>
                  <td className={td}>{fmtNum(p.waste_qty)}</td><td className={td}>{fmtNum(p.excess_qty)}</td>
                  <td className={td}>{fmtNum(p.approved_amount)}</td><td className={td}>{fmtNum(p.pending_amount)}</td>
                  <td className={td}>{fmtNum(p.waived_amount)}</td>
                  {monthly && <><td className={td}>{p.base_salary != null ? fmtNum(p.base_salary) : "—"}</td>
                    <td className={`${td} text-emerald-600`}>{p.net_after_waste != null ? fmtNum(p.net_after_waste) : "—"}</td></>}
                </tr>))}
            </tbody>
          </table>
        </div>
        {monthly && <p className="text-[10px] font-semibold text-gray-400">خالص = حقوق پایه ماهانه − کسرهای تأییدشده. برای حقوق روزانه مقدار نمایش داده نمی‌شود.</p>}
      </>)}
    </div>
  );
}
