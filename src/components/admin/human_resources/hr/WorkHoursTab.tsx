"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, RefreshCw, Shuffle, X } from "lucide-react";
import { listAll } from "@/lib/api";
import { JALALI_MONTHS, toGregorian, todayJalali, toPersianDigits } from "@/lib/jalali";
import type { HumanResource } from "../humanResourceApi";
import { Badge, EmptyState, ErrorBox, Field, GhostButton, PrimaryButton, Select, TextInput } from "./hrUi";
import { WH_LABEL, WH_CLS, monthLabel, canDecideMonth, decisionLockMessage } from "./workHoursShared";
import Pager from "./Pager";
import MonthlyApprovalBanner from "./MonthlyApprovalBanner";
import JalaliMonthPicker from "./JalaliMonthPicker";
import { useDialogs } from "@/components/ui/useDialogs";
import { hrApi, errorMessage, fmtNum, type WorkHoursReview, type WorkHoursStatus } from "./hrApi";

const DOC_URL = "/document/api/v1/";
const LABEL = WH_LABEL;
const CLS = WH_CLS;

export default function WorkHoursTab({ canManage }: { canManage: boolean }) {
  const router = useRouter();
  const [jy0, jm0] = todayJalali();
  const [docs, setDocs] = useState<HumanResource[]>([]);
  const [docId, setDocId] = useState("");
  const pickRandom = () => {
    if (docs.length === 0) return;
    const idx = Math.floor(Math.random() * docs.length);
    setDocId(String(docs[idx].id));
    toast(`انتخاب تصادفی: ${docs[idx].employee_name || docs[idx].title}`);
  };
  const [status, setStatus] = useState("");
  const [year, setYear] = useState(String(jy0));
  const [month, setMonth] = useState(String(jm0));
  const [pg, setPg] = useState(1);
  const [pages, setPages] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [items, setItems] = useState<WorkHoursReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<number | "create" | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [err, setErr] = useState<string | null>(null);
  const { confirm, toast, dialog } = useDialogs();

  // گزارش ماه انتخاب‌شده (اگر وجود داشته باشد) برای غیرفعال کردن «به‌روزرسانی» پس از تصمیم
  const [sy, sm] = [Number(year), Number(month)];
  const selIso = sy && sm ? (() => { const [a, b, c] = toGregorian(sy, sm, 1); return `${a}-${String(b).padStart(2, "0")}-${String(c).padStart(2, "0")}`; })() : "";
  const selReview = items.find((r) => r.month.slice(0, 7) === selIso.slice(0, 7));
  const locked = !!selReview && selReview.status !== "pending";

  useEffect(() => { listAll<HumanResource>(DOC_URL).then(setDocs).catch(() => setDocs([])); }, []);

  const load = useCallback(async () => {
    if (!docId) { setItems([]); return; }
    setLoading(true); setErr(null);
    try {
      const iso = (v: string, end: boolean) => { if (!/^\d{4}-\d{1,2}$/.test(v)) return undefined; const [y, m] = v.split("-").map(Number); const [a, b, c] = toGregorian(y, m, 1); return `${a}-${String(b).padStart(2, "0")}-${String(c).padStart(2, "0")}`; };
      const r = await hrApi.workHours.list(Number(docId), { status, page: pg, page_size: 20, month_from: iso(from, false), month_to: iso(to, true) });
      setItems(r.results); setPages(Math.max(1, Math.ceil(r.count / 20)));
    }
    catch (e) { setItems([]); setErr((e as { response?: { status?: number } })?.response?.status === 404 ? "سرویس ساعت کارکرد روی سرور فعال نیست (۴۰۴). بک‌اند جدید را deploy و migrate 0006 را اجرا کنید." : errorMessage(e)); }
    finally { setLoading(false); }
  }, [docId, status, pg, from, to]);
  useEffect(() => { setPg(1); }, [docId, status, from, to]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    const [gy, gm, gd] = toGregorian(Number(year), Number(month), 1);
    setBusy("create"); setErr(null);
    try { await hrApi.workHours.create(Number(docId), `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`); toast("گزارش ساعت کارکرد ایجاد شد"); await load(); }
    catch (e) { const m = errorMessage(e); setErr(/guild|ساعت مصوب|ساعت کار/.test(m) ? `${m} — ساعت مصوب ماهانه را از «فرم اطلاعات منابع انسانی» پرسنل تنظیم کنید.` : m); } finally { setBusy(null); }
  };
  const decide = async (r: WorkHoursReview, st: "approved" | "rejected") => {
    if (!canDecideMonth(r.month)) { setErr(decisionLockMessage(r.month)); return; }
    const ok = await confirm({ title: st === "approved" ? "تأیید گزارش" : "رد گزارش", message: st === "approved" ? "با تأیید، ساعت به‌عنوان ساعت تأییدشده ثبت می‌شود و قابل تغییر نیست." : "با رد گزارش، تصمیم نهایی می‌شود و قابل تغییر نیست.", confirmText: st === "approved" ? "تأیید" : "رد", danger: st === "rejected" });
    if (!ok) return;
    setBusy(r.id); setErr(null);
    try { await hrApi.workHours.decide(r.id, { status: st, note: notes[r.id] ?? "" }); toast(st === "approved" ? "گزارش تأیید شد" : "گزارش رد شد"); await load(); }
    catch (e) { setErr(errorMessage(e)); } finally { setBusy(null); }
  };

  const th = "px-3 py-2 text-right text-[10.5px] font-extrabold text-gray-500";
  const td = "px-3 py-2 text-[11.5px] font-bold text-gray-700 dark:text-gray-200";
  return (
    <div className="space-y-4" dir="rtl">
      {canManage && docs.length > 0 && <MonthlyApprovalBanner docs={docs} onComplete={load} />}
      <div className="grid grid-cols-1 gap-3 rounded-[1.45rem] border border-gray-100 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4 dark:border-white/[0.06] dark:bg-[#111827]">
        <Field label="پرسنل">
          <div className="flex gap-2">
            <Select value={docId} onChange={(e) => setDocId(e.target.value)} className="flex-1">
              <option value="">انتخاب کنید</option>
              {docs.map((d) => <option key={d.id} value={d.id}>{d.employee_name || d.title}</option>)}
            </Select>
            <button
              type="button"
              onClick={pickRandom}
              disabled={docs.length === 0}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition hover:bg-indigo-100 disabled:opacity-50 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20"
              title="انتخاب تصادفی"
            >
              <Shuffle size={16} />
            </button>
          </div>
        </Field>
        <Field label="وضعیت"><Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">همه</option>
          {Object.entries(LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
        <Field label="از ماه"><JalaliMonthPicker value={from} onChange={setFrom} placeholder="مثلاً فروردین ۱۴۰۵" /></Field>
        <Field label="تا ماه"><JalaliMonthPicker value={to} onChange={setTo} placeholder="مثلاً اسفند ۱۴۰۵" /></Field>
        {canManage && docId && (<>
          <Field label="ماه شمسی گزارش">
            <JalaliMonthPicker value={`${year}-${String(month).padStart(2, "0")}`}
              onChange={(v) => { const m = /^(\d{4})-(\d{1,2})$/.exec(v); if (m) { setYear(m[1]); setMonth(String(Number(m[2]))); } }}
              placeholder="انتخاب ماه" />
          </Field>
          <div className="flex items-end"><PrimaryButton loading={busy === "create"} disabled={locked} onClick={create}>ساخت / به‌روزرسانی گزارش</PrimaryButton></div>
        </>)}
      </div>
      <p className="text-[10px] font-semibold text-gray-400">ساعت مصوب ماهانه (guild_work_hours) باید در پرونده کارمند تنظیم شده باشد. گزارش تصمیم‌گیری‌شده قابل تغییر نیست.</p>
      <ErrorBox message={err} />
      {loading && <Loader2 size={16} className="animate-spin text-indigo-500" />}
      {!docId ? <p className="text-[11.5px] font-bold text-gray-400">یک پرسنل انتخاب کنید.</p>
        : !loading && items.length === 0 ? <EmptyState icon={<RefreshCw size={20} />} title="گزارشی ثبت نشده است" />
        : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm dark:border-white/[0.07]">
          <table className="w-full min-w-[900px]">
            <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-white/10"><tr>
              <th className={th}>ماه</th><th className={th}>ساعت مصوب</th><th className={th}>ساعت تولید</th>
              <th className={th}>ساعت تأییدشده</th><th className={th}>کسری</th><th className={th}>وضعیت</th>
              <th className={th}>تصمیم‌گیری</th><th className={th}>یادداشت</th>{canManage && <th className={th}>اقدام</th>}<th className={th}>جزئیات</th>
            </tr></thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t border-gray-100 transition-colors odd:bg-white even:bg-gray-50/60 hover:bg-indigo-50/50 dark:border-white/[0.06] dark:odd:bg-transparent dark:even:bg-white/[0.02] dark:hover:bg-white/[0.05]">
                  <td className={td}>{monthLabel(r.month)}</td>
                  <td className={td}>{fmtNum(r.expected_hours)}</td><td className={td}>{fmtNum(r.production_hours)}</td>
                  <td className={td}>{r.approved_hours != null ? fmtNum(r.approved_hours) : "—"}</td>
                  <td className={td}>{fmtNum(r.shortage_hours)}</td>
                  <td className={td}><Badge className={CLS[r.status]}>{LABEL[r.status]}</Badge></td>
                  <td className={td}>{r.decided_at ? toPersianDigits(new Date(r.decided_at).toLocaleDateString("fa-IR")) : "—"}{r.decided_by ? ` (کاربر ${toPersianDigits(String(r.decided_by))})` : ""}</td>
                  <td className={td}>{r.status === "pending" && canManage
                    ? <TextInput value={notes[r.id] ?? r.note ?? ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
                    : r.note || "—"}</td>
                  {canManage && <td className={td}>{r.status === "pending" && (
                    <div className="flex gap-2">
                      <GhostButton disabled={busy === r.id || !canDecideMonth(r.month)} onClick={() => decide(r, "rejected")}><X size={13} /> رد</GhostButton>
                      <button disabled={busy === r.id || !canDecideMonth(r.month)} title={canDecideMonth(r.month) ? undefined : decisionLockMessage(r.month)} onClick={() => decide(r, "approved")}
                        className="flex h-9 items-center gap-1 rounded-full bg-emerald-600 px-4 text-[12px] font-extrabold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"><Check size={13} /> تأیید</button>
                      {!canDecideMonth(r.month) && <span className="self-center text-[10.5px] font-bold text-blue-600">{decisionLockMessage(r.month)}</span>}
                    </div>)}</td>}
                  <td className={td}><button onClick={() => {
                    const doc = docs.find((d) => String(d.id) === docId);
                    const q = new URLSearchParams({ documentId: docId, month: r.month, status: r.status });
                    if (doc) q.set("employeeName", doc.employee_name || doc.title);
                    router.push(`/admin/human-resources/workhours/month?${q.toString()}`);
                  }} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-extrabold text-white transition hover:bg-indigo-700">دیدن اطلاعات ماه</button></td>
                </tr>))}
            </tbody>
          </table>
        </div>)}
      <Pager page={pg} pages={pages} onChange={setPg} />
      {dialog}
    </div>
  );
}
