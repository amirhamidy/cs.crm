"use client";
import { useEffect, useState } from "react";
import { Calendar, Check, Loader2, X } from "lucide-react";
import { todayJalali, toPersianDigits, toGregorian } from "@/lib/jalali";
import { ErrorBox, GhostButton, PrimaryButton, TextInput } from "./hrUi";
import { WH_LABEL, WH_CLS, monthLabel, canDecideMonth, decisionLockMessage } from "./workHoursShared";
import { useDialogs } from "@/components/ui/useDialogs";
import { hrApi, errorMessage, fmtNum, type WorkHoursReview, type WorkHoursStatus } from "./hrApi";

interface Props {
  docs: Array<{ id: number; employee_name?: string | null; title: string }>;
  onComplete: () => void;
}

export default function MonthlyApprovalBanner({ docs, onComplete }: Props) {
  const [jy, jm, jd] = todayJalali();
  const isFirstDay = jd === 1;
  const [expanded, setExpanded] = useState(isFirstDay);
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<WorkHoursReview[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { confirm, toast } = useDialogs();

  // ماه قبل
  const [prevY, prevM] = jm === 1 ? [jy - 1, 12] : [jy, jm - 1];
  const prevMonthIso = (() => {
    const [gy, gm, gd] = toGregorian(prevY, prevM, 1);
    return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
  })();

  useEffect(() => {
    if (!expanded) return;
    const ac = new AbortController();
    setLoading(true);
    setErr(null);
    const tasks = docs.map(async (d) => {
      try {
        const r = await hrApi.workHours.list(d.id, { status: "pending", page_size: 100 }, ac.signal);
        return r.results.filter((rev) => rev.month.startsWith(prevMonthIso));
      } catch {
        return [];
      }
    });
    Promise.all(tasks)
      .then((lists) => setReviews(lists.flat()))
      .finally(() => !ac.signal.aborted && setLoading(false));
    return () => ac.abort();
  }, [expanded, docs, prevMonthIso]);

  const decide = async (r: WorkHoursReview, status: "approved" | "rejected") => {
    if (!canDecideMonth(r.month)) { setErr(decisionLockMessage(r.month)); return; }
    const ok = await confirm({
      title: status === "approved" ? "تأیید" : "رد",
      message:
        status === "approved"
          ? "با تأیید، ساعت به‌عنوان ساعت تأییدشده ثبت می‌شود."
          : "با رد، تصمیم نهایی می‌شود.",
      confirmText: status === "approved" ? "تأیید" : "رد",
      danger: status === "rejected",
    });
    if (!ok) return;
    setBusy(r.id);
    setErr(null);
    try {
      await hrApi.workHours.decide(r.id, { status, note: notes[r.id] ?? "" });
      toast(status === "approved" ? "تأیید شد" : "رد شد");
      setReviews((prev) => prev.filter((x) => x.id !== r.id));
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const bulkApprove = async () => {
    if (!canDecideMonth(prevMonthIso)) { setErr(decisionLockMessage(prevMonthIso)); return; }
    const ok = await confirm({
      title: "تأیید دسته‌جمعی",
      message: `${toPersianDigits(String(reviews.length))} گزارش را تأیید می‌کنید؟`,
      confirmText: "تأیید همه",
    });
    if (!ok) return;
    setErr(null);
    for (const r of reviews) {
      try {
        await hrApi.workHours.decide(r.id, { status: "approved", note: notes[r.id] ?? "" });
      } catch (e) {
        setErr(errorMessage(e));
        break;
      }
    }
    toast("تأیید دسته‌جمعی انجام شد");
    setReviews([]);
    onComplete();
  };

  if (!expanded && reviews.length === 0) {
    return (
      <div className="rounded-[1.45rem] border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 dark:border-indigo-500/20 dark:from-indigo-500/5 dark:to-transparent" dir="rtl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20">
              <Calendar size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-[13px] font-extrabold text-gray-800 dark:text-gray-100">
                تصمیم‌گیری ماهانه ساعت کارکرد
              </h3>
              <p className="text-[10.5px] font-semibold text-gray-500">
                {isFirstDay
                  ? `امروز اول ${["", "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"][jm]} است — گزارش‌های ماه قبل را بررسی کنید.`
                  : `گزارش‌های ماه ${monthLabel(prevMonthIso)} را بررسی کنید.`}
              </p>
            </div>
          </div>
          <PrimaryButton onClick={() => setExpanded(true)}>بررسی</PrimaryButton>
        </div>
      </div>
    );
  }

  if (!expanded) return null;

  const th = "px-3 py-2 text-right text-[10.5px] font-extrabold text-gray-500";
  const td = "px-3 py-2 text-[11.5px] font-bold text-gray-700 dark:text-gray-200";

  return (
    <div className="space-y-3 rounded-[1.45rem] border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-lg dark:border-indigo-500/20 dark:from-indigo-500/5 dark:to-transparent" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20">
            <Calendar size={18} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-[13px] font-extrabold text-gray-800 dark:text-gray-100">
              تصمیم‌گیری ماهانه — {monthLabel(prevMonthIso)}
            </h3>
            <p className="text-[10.5px] font-semibold text-gray-500">
              {reviews.length === 0
                ? "همه گزارش‌های ماه قبل تصمیم‌گیری شده‌اند."
                : `${toPersianDigits(String(reviews.length))} گزارش در انتظار تصمیم`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {reviews.length > 1 && canDecideMonth(prevMonthIso) && (
            <button
              onClick={bulkApprove}
              className="flex h-10 items-center gap-2 rounded-full bg-emerald-600 px-5 text-[12px] font-extrabold text-white hover:bg-emerald-700"
            >
              <Check size={14} /> تأیید همه
            </button>
          )}
          <GhostButton onClick={() => setExpanded(false)}>بستن</GhostButton>
        </div>
      </div>

      <ErrorBox message={err} />
      {loading && <Loader2 size={16} className="animate-spin text-indigo-500" />}

      {reviews.length === 0 && !loading ? (
        <p className="text-center text-[11.5px] font-bold text-gray-400">
          هیچ گزارش در انتظاری وجود ندارد.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm dark:border-white/[0.07]">
          <table className="w-full min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-white/10">
              <tr>
                <th className={th}>پرسنل</th>
                <th className={th}>ماه</th>
                <th className={th}>ساعت مصوب</th>
                <th className={th}>ساعت تولید</th>
                <th className={th}>کسری</th>
                <th className={th}>یادداشت</th>
                <th className={th}>اقدام</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id} className="border-t border-gray-100 transition-colors odd:bg-white even:bg-gray-50/60 hover:bg-indigo-50/50 dark:border-white/[0.06] dark:odd:bg-transparent dark:even:bg-white/[0.02] dark:hover:bg-white/[0.05]">
                  <td className={td}>{r.employee_name}</td>
                  <td className={td}>{monthLabel(r.month)}</td>
                  <td className={td}>{fmtNum(r.expected_hours)}</td>
                  <td className={td}>{fmtNum(r.production_hours)}</td>
                  <td className={`${td} text-rose-600`}>{fmtNum(r.shortage_hours)}</td>
                  <td className={td}>
                    <TextInput
                      value={notes[r.id] ?? ""}
                      onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                      placeholder="یادداشت (اختیاری)"
                    />
                  </td>
                  <td className={td}>
                    <div className="flex gap-2">
                      <GhostButton disabled={busy === r.id || !canDecideMonth(r.month)} onClick={() => decide(r, "rejected")}>
                        <X size={13} /> رد
                      </GhostButton>
                      <button
                        disabled={busy === r.id || !canDecideMonth(r.month)}
                        title={canDecideMonth(r.month) ? undefined : decisionLockMessage(r.month)}
                        onClick={() => decide(r, "approved")}
                        className="flex h-9 items-center gap-1 rounded-full bg-emerald-600 px-4 text-[12px] font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Check size={13} /> تأیید
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
