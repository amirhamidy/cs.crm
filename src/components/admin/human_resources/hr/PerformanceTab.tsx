"use client";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronLeft, Download, Loader2, Plus, Lock } from "lucide-react";
import { toGregorian, toJalali, todayJalali, toPersianDigits } from "@/lib/jalali";
import { Badge, EmptyState, ErrorBox, GhostButton, PrimaryButton } from "./hrUi";
import JalaliMonthPicker from "./JalaliMonthPicker";
import WorkHoursDailyPanel from "./WorkHoursDailyPanel";
import { useDialogs } from "@/components/ui/useDialogs";
import { hrApi, errorMessage, fmtNum, type PerformanceMonth, type PerformanceRow, type PerfStatus } from "./hrApi";

// وضعیت‌ها به زبان ساده
const HOURS_ST: Record<PerfStatus, { t: string; c: string }> = {
  missing: { t: "گزارش ساخته نشده", c: "bg-rose-50 text-rose-600" },
  pending: { t: "منتظر تأیید", c: "bg-amber-50 text-amber-700" },
  approved: { t: "تأیید شد", c: "bg-emerald-50 text-emerald-700" },
  rejected: { t: "رد شد", c: "bg-slate-100 text-slate-600" },
};
const WASTE_ST: Record<PerfStatus, { t: string; c: string }> = {
  missing: { t: "داده‌ای نیست", c: "bg-slate-100 text-slate-500" },
  pending: { t: "منتظر تأیید", c: "bg-amber-50 text-amber-700" },
  approved: { t: "تأیید شد", c: "bg-emerald-50 text-emerald-700" },
  rejected: { t: "رد شد", c: "bg-slate-100 text-slate-600" },
};

const num = (v: string | null) => (v == null ? "—" : fmtNum(Number(v)));
const sum = (rows: PerformanceRow[], k: keyof PerformanceRow) =>
  rows.reduce((a, r) => a + (Number(r[k]) || 0), 0);
const iso = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  const [gy, gm, gd] = toGregorian(y, m, 1);
  return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
};
const jDate = (d: string) => {
  const [y, m, dd] = d.slice(0, 10).split("-").map(Number);
  const [jy, jm, jd] = toJalali(y, m, dd);
  return toPersianDigits(`${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`);
};
const HEAD = ["کارمند", "ساعت کارکرد", "ساعت استاندارد", "ضایعات", "ضایعات مجاز", "حقوق پایه", "حقوق نهایی"];
const HEAD_CSV = ["کارمند", "ساعت کارکرد", "ساعت استاندارد", "ضایعات", "ضایعات مجاز", "حقوق پایه", "حقوق نهایی"];

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 dark:bg-[#111827] dark:ring-white/[0.06]">
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-extrabold text-slate-800 dark:text-white">{value}</div>
      {hint && <div className="mt-0.5 text-[10px] text-slate-400">{hint}</div>}
    </div>
  );
}

function Step({ n, title, done, active }: { n: number; title: string; done: boolean; active: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-[12px] font-bold ${done ? "text-emerald-600" : active ? "text-indigo-600" : "text-slate-400"}`}>
      {done ? <CheckCircle2 size={16} /> : <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${active ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"}`}>{toPersianDigits(n)}</span>}
      {title}
    </div>
  );
}

export default function PerformanceTab() {
  const [jy, jm] = todayJalali();
  const [ym, setYm] = useState(jm === 1 ? `${jy - 1}-12` : `${jy}-${String(jm - 1).padStart(2, "0")}`);
  const [data, setData] = useState<PerformanceMonth | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const { confirm, toast, dialog } = useDialogs();

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setErr(null);
    try { setData(await hrApi.performance.month(iso(ym), signal)); }
    catch (e) { if (!signal?.aborted) setErr(errorMessage(e)); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [ym]);

  useEffect(() => {
    setOpen(null); setData(null);
    const ac = new AbortController(); load(ac.signal); return () => ac.abort();
  }, [load]);

  const rows = data?.rows ?? [];
  const missing = useMemo(() => rows.filter((r) => r.hours_status === "missing"), [rows]);
  const pendH = rows.some((r) => r.hours_status === "pending");
  const pendW = rows.some((r) => r.waste_status === "pending");
  const hoursDone = rows.length > 0 && rows.every((r) => r.hours_status === "approved" || r.hours_status === "rejected");
  const locked = !data?.can_approve;

  const approve = async (scope: "hours" | "waste") => {
    const label = scope === "hours" ? "ساعت کارکرد" : "ضایعات";
    if (!(await confirm({ title: `تأیید ${label}`, message: `${label} همهٔ کارمندان این ماه تأیید می‌شود. پس از تأیید، تغییر آن ساده نیست.`, confirmText: "تأیید" }))) return;
    setBusy(scope); setErr(null);
    try {
      const r = await hrApi.performance.approve(iso(ym), scope);
      toast(`${toPersianDigits(r.approved)} مورد تأیید شد`);
      await load();
    } catch (e) { setErr(errorMessage(e)); } finally { setBusy(null); }
  };

  const createMissing = async () => {
    setBusy("create"); setErr(null);
    const results = await Promise.allSettled(missing.map((r) => hrApi.workHours.create(r.document_id, iso(ym))));
    const failed = results.filter((x) => x.status === "rejected").length;
    if (failed) setErr(`ساخت ${toPersianDigits(failed)} گزارش ناموفق بود.`);
    else toast("گزارش‌های ناقص ساخته شد");
    await load(); setBusy(null);
  };

  const exportCsv = () => {
    const lines = [HEAD_CSV, ...rows.map((r) => [r.employee_name, r.actual_hours, r.expected_hours, r.actual_waste, r.expected_waste, r.base_salary, r.adjusted_salary])]
      .map((l) => l.map((c) => `"${c ?? ""}"`).join(","));
    const url = URL.createObjectURL(new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `performance-${ym}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5" dir="rtl">
      {dialog}

      {/* هدر */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 dark:text-white">کارکرد کارمندان</h2>
          <p className="mt-1 text-[12px] text-slate-500">خلاصهٔ ساعت و ضایعات هر نفر در ماه، و حقوق نهایی او.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-44"><JalaliMonthPicker value={ym} onChange={setYm} /></div>
          <GhostButton onClick={exportCsv} disabled={!rows.length}><Download size={14} /> دانلود اکسل</GhostButton>
        </div>
      </div>

      {/* مراحل */}
      {data && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/[0.03]">
          <Step n={1} title="ساخت گزارش ساعت" done={missing.length === 0} active={missing.length > 0} />
          <Step n={2} title="تأیید ساعت کارکرد" done={hoursDone} active={!hoursDone && missing.length === 0} />
          <Step n={3} title="تأیید ضایعات" done={rows.length > 0 && !pendW} active={pendW} />
        </div>
      )}

      {/* هشدارها */}
      {data && locked && (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-[12px] text-amber-800">
          <Lock size={15} /> تأیید این ماه از {jDate(data.approval_window.opens_at)} فعال می‌شود.
        </div>
      )}
      {data && !locked && missing.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-[12px] text-rose-700">
          <AlertTriangle size={15} className="shrink-0" />
          <span className="flex-1">
            برای {toPersianDigits(missing.length)} نفر هنوز گزارش ساعت ساخته نشده: {missing.map((m) => m.employee_name).join("، ")}.
            تا ساخته نشدن، تأیید ساعت‌ها فعال نمی‌شود.
          </span>
          <GhostButton onClick={createMissing} disabled={busy !== null}>
            {busy === "create" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} ساخت گزارش‌ها
          </GhostButton>
        </div>
      )}
      <ErrorBox message={err} />

      {/* خلاصه */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="جمع ساعت کارکرد" value={fmtNum(sum(rows, "actual_hours"))} />
          <Stat label="جمع ضایعات" value={fmtNum(sum(rows, "actual_waste"))} />
          <Stat label="جمع حقوق پایه" value={fmtNum(sum(rows, "base_salary"))} hint="ریال" />
          <Stat label="حقوق نهایی" value={rows.some((r) => r.adjusted_salary != null) ? fmtNum(sum(rows, "adjusted_salary")) : "—"} hint={rows.some((r) => r.adjusted_salary != null) ? undefined : "فرمول هنوز تعریف نشده"} />
        </div>
      )}

      {/* جدول */}
      {loading && !data ? (
        <div className="space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : rows.length === 0 ? <EmptyState title="برای این ماه داده‌ای نیست" /> : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-[#111827] dark:ring-white/[0.06]">
          <table className="w-full min-w-[820px] text-[13px]">
            <thead>
              <tr className="text-[11px] text-slate-500">
                <th className="w-8 p-3" />
                {HEAD.map((h) => <th key={h} className="p-3 text-right font-semibold">{h}</th>)}
                <th className="p-3 text-right font-semibold">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isOpen = open === r.document_id;
                const canOpen = r.hours_status !== "missing";
                return (
                  <Fragment key={r.document_id}>
                    <tr
                      className={`border-t border-slate-100 transition dark:border-white/[0.06] ${canOpen ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03]" : "bg-rose-50/40"}`}
                      onClick={() => canOpen && setOpen(isOpen ? null : r.document_id)}
                    >
                      <td className="p-3 text-slate-400">{canOpen && (isOpen ? <ChevronDown size={14} /> : <ChevronLeft size={14} />)}</td>
                      <td className="p-3 font-bold text-slate-800 dark:text-white">{r.employee_name}</td>
                      <td className="p-3">{num(r.actual_hours)}</td>
                      <td className="p-3 text-slate-500">{num(r.expected_hours)}</td>
                      <td className="p-3">{num(r.actual_waste)}</td>
                      <td className="p-3 text-slate-500">{num(r.expected_waste)}</td>
                      <td className="p-3">{num(r.base_salary)}</td>
                      <td className="p-3 font-bold">{r.adjusted_salary == null ? <span className="text-[11px] font-normal text-slate-400">به‌زودی</span> : num(r.adjusted_salary)}</td>
                      <td className="p-3">
                        <div className="flex flex-col items-start gap-1">
                          <Badge className={HOURS_ST[r.hours_status].c}>ساعت: {HOURS_ST[r.hours_status].t}</Badge>
                          <Badge className={WASTE_ST[r.waste_status].c}>ضایعات: {WASTE_ST[r.waste_status].t}</Badge>
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-t border-slate-100 bg-slate-50/70 dark:border-white/[0.06]">
                        <td colSpan={10} className="p-4">
                          <WorkHoursDailyPanel documentId={r.document_id} month={data!.month} status={r.hours_status as "pending" | "approved" | "rejected"} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* اقدام‌ها */}
      {rows.length > 0 && (
        <div className="sticky bottom-3 flex flex-wrap items-center justify-end gap-2 rounded-2xl bg-white/90 p-3 shadow-lg ring-1 ring-slate-100 backdrop-blur dark:bg-[#111827]/90 dark:ring-white/[0.06]">
          <span className="ml-auto text-[11px] text-slate-500">
            {locked ? "تأیید از ابتدای ماه بعد باز می‌شود." : pendH || pendW ? "موارد منتظر تأیید را تأیید کنید." : "همه موارد این ماه تأیید شده‌اند."}
          </span>
          <PrimaryButton disabled={locked || !pendH || busy !== null || missing.length > 0} onClick={() => approve("hours")}>
            {busy === "hours" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} تأیید ساعت‌های ماه
          </PrimaryButton>
          <PrimaryButton disabled={locked || !pendW || busy !== null} onClick={() => approve("waste")}>
            {busy === "waste" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} تأیید ضایعات ماه
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
