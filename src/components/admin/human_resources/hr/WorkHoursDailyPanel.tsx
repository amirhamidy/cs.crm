"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { EmptyState, ErrorBox, Field, PrimaryButton, GhostButton, Badge } from "./hrUi";
import JalaliDatePicker from "./JalaliDatePicker";
import { WH_LABEL, WH_CLS, monthLabel } from "./workHoursShared";
import { hrApi, errorMessage, fmtDate, fmtNum, type WorkHoursDaily, type WorkHoursStatus } from "./hrApi";

/** علامت‌دار: مثبت = اضافه‌کار (سبز)، منفی = کسری (قرمز) */
function signed(v: string | number) {
  const x = Number(v);
  const s = fmtNum(Math.abs(x));
  return x > 0 ? `+${s}` : x < 0 ? `−${s}` : s;
}

const th = "px-3 py-2 text-right text-[10.5px] font-extrabold text-gray-500";
const td = "px-3 py-2 text-[11.5px] font-bold text-gray-700 dark:text-gray-200";

export default function WorkHoursDailyPanel({
  documentId, month, status,
}: { documentId: number; month: string; status: WorkHoursStatus }) {
  const [data, setData] = useState<WorkHoursDaily | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const rangeErr = range === null && (from || to) && !(from && to) ? "هر دو تاریخ «از» و «تا» لازم است." : from && to && from > to ? "تاریخ شروع بعد از پایان است." : null;

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true); setErr(null); setData(null);
    const params = range ? { date_from: range.from, date_to: range.to } : { month };
    hrApi.workHours.daily(documentId, params, ac.signal)
      .then(setData)
      .catch((e: unknown) => {
        if (ac.signal.aborted) return;
        const st = (e as { response?: { status?: number } })?.response?.status;
        setErr(st === 404 ? "سند موردنظر پیدا نشد." : errorMessage(e));
      })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, [documentId, month, range]);

  const applyRange = () => { if (from && to && from <= to) setRange({ from, to }); };
  const clearRange = () => { setRange(null); setFrom(""); setTo(""); };

  const t = data?.totals;
  const cards = t ? [
    { label: "ساعت لازم", value: fmtNum(t.expected_hours), cls: "text-gray-800 dark:text-gray-100" },
    { label: "ساعت کار تولید", value: fmtNum(t.production_hours), cls: "text-gray-800 dark:text-gray-100" },
    { label: "کسری", value: fmtNum(t.shortage_hours), cls: Number(t.shortage_hours) > 0 ? "text-rose-600" : "text-gray-800 dark:text-gray-100" },
    { label: "اضافه‌کار", value: fmtNum(t.overtime_hours), cls: Number(t.overtime_hours) > 0 ? "text-emerald-600" : "text-gray-800 dark:text-gray-100" },
  ] : [];

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-extrabold text-gray-800 dark:text-gray-100">{monthLabel(month)}</h3>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${WH_CLS[status]}`}>{WH_LABEL[status]}</span>
        </div>
      </div>

      <p className="text-[10px] font-semibold text-gray-400">
        فقط روزهایی که ثبت تولید دارند نمایش داده می‌شوند.
        {data && <> بازه: {fmtDate(data.date_from)} تا {fmtDate(data.date_to)}.</>}
        {status !== "pending" && " این ماه تصمیم‌گیری شده و ردیف‌های روزانه ثابت‌اند."}
      </p>

      <div className="flex flex-wrap items-end gap-2">
        <Field label="از تاریخ"><div className="w-44"><JalaliDatePicker value={from} onChange={setFrom} /></div></Field>
        <Field label="تا تاریخ"><div className="w-44"><JalaliDatePicker value={to} onChange={setTo} /></div></Field>
        <PrimaryButton type="button" onClick={applyRange} disabled={!from || !to || from > to}>اعمال بازه</PrimaryButton>
        {range && <GhostButton onClick={clearRange}>بازگشت به ماه</GhostButton>}
      </div>
      {rangeErr && <p className="text-[10px] font-bold text-rose-500">{rangeErr}</p>}
      <ErrorBox message={err} />
      {loading && <Loader2 size={16} className="animate-spin text-indigo-500" />}

      {data && t && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {cards.map((c) => (
              <div key={c.label} className="rounded-xl border border-gray-100 p-3 dark:border-white/[0.07]">
                <p className="text-[10px] font-bold text-gray-400">{c.label}</p>
                <p className={`mt-1 text-[13px] font-extrabold ${c.cls}`}>{c.value}</p>
              </div>
            ))}
          </div>

          {data.days.length === 0 ? (
            <EmptyState title="ردیف روزانه‌ای ثبت نشده است" hint="اگر گزارش ماهانه قدیمی است، باید دستور backfill_work_hours_days روی سرور اجرا شود." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm dark:border-white/[0.07]">
              <table className="w-full min-w-[820px]">
                <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-white/10"><tr>
                  <th className={th}>تاریخ</th><th className={th}>ساعت لازم</th><th className={th}>ساعت کار تولید</th>
                  <th className={th}>کسری</th><th className={th}>اضافه‌کار</th><th className={th}>اختلاف</th><th className={th}>تعداد ثبت</th><th className={th}>گزارش ماهانه</th>
                </tr></thead>
                <tbody>
                  {data.days.map((d) => (
                    <tr key={d.id} className="border-t border-gray-100 transition-colors odd:bg-white even:bg-gray-50/60 hover:bg-indigo-50/50 dark:border-white/[0.06] dark:odd:bg-transparent dark:even:bg-white/[0.02] dark:hover:bg-white/[0.05]">
                      <td className={td}>{fmtDate(d.date)}</td>
                      <td className={td}>{fmtNum(d.expected_hours)}</td>
                      <td className={td}>{fmtNum(d.production_hours)}</td>
                      <td className={`${td} ${Number(d.shortage_hours) > 0 ? "text-rose-600" : ""}`}>{fmtNum(d.shortage_hours)}</td>
                      <td className={`${td} ${Number(d.overtime_hours) > 0 ? "text-emerald-600" : ""}`}>{fmtNum(d.overtime_hours)}</td>
                      <td className={`${td} ${Number(d.difference_hours) < 0 ? "text-rose-600" : Number(d.difference_hours) > 0 ? "text-emerald-600" : ""}`} dir="ltr">
                        {signed(d.difference_hours)}
                      </td>
                      <td className={td}>{fmtNum(d.logs_count)}</td>
                      <td className={td}>#{d.review_id} <Badge className={WH_CLS[d.review_status]}>{WH_LABEL[d.review_status]}</Badge></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5"><tr>
                  <td className={td}>جمع ({fmtNum(t.days)} روز)</td>
                  <td className={td}>{fmtNum(t.expected_hours)}</td>
                  <td className={td}>{fmtNum(t.production_hours)}</td>
                  <td className={`${td} text-rose-600`}>{fmtNum(t.shortage_hours)}</td>
                  <td className={`${td} text-emerald-600`}>{fmtNum(t.overtime_hours)}</td>
                  <td className={td} colSpan={3}></td>
                </tr></tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
