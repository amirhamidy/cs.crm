"use client";
import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, RefreshCw, X } from "lucide-react";
import { listAll } from "@/lib/api";
import { JALALI_MONTHS, toGregorian, todayJalali, toPersianDigits } from "@/lib/jalali";
import type { HumanResource } from "../humanResourceApi";
import { Badge, EmptyState, ErrorBox, Field, GhostButton, PrimaryButton, Select, TextInput } from "./hrUi";
import { WH_LABEL, WH_CLS, monthLabel } from "./workHoursShared";
import Pager from "./Pager";
import JalaliMonthPicker from "./JalaliMonthPicker";
import { hrApi, errorMessage, fmtNum, type WorkHoursReview, type WorkHoursStatus } from "./hrApi";

const DOC_URL = "/document/api/v1/";
const LABEL = WH_LABEL;
const CLS = WH_CLS;

export default function WorkHoursTab({ canManage }: { canManage: boolean }) {
  const [jy0, jm0] = todayJalali();
  const [docs, setDocs] = useState<HumanResource[]>([]);
  const [docId, setDocId] = useState("");
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
    try { await hrApi.workHours.create(Number(docId), `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`); await load(); }
    catch (e) { const m = errorMessage(e); setErr(/guild|ساعت مصوب|ساعت کار/.test(m) ? `${m} — ساعت مصوب ماهانه را از «فرم اطلاعات منابع انسانی» پرسنل تنظیم کنید.` : m); } finally { setBusy(null); }
  };
  const decide = async (r: WorkHoursReview, st: "approved" | "rejected") => {
    if (!window.confirm(st === "approved" ? "با تأیید، ساعت تولید به‌عنوان ساعت تأییدشده ثبت می‌شود و قابل تغییر نیست. ادامه می‌دهید؟" : "با رد گزارش، تصمیم نهایی می‌شود و قابل تغییر نیست. ادامه می‌دهید؟")) return;
    setBusy(r.id); setErr(null);
    try { await hrApi.workHours.decide(r.id, { status: st, note: notes[r.id] ?? "" }); await load(); }
    catch (e) { setErr(errorMessage(e)); } finally { setBusy(null); }
  };

  const th = "px-3 py-2 text-right text-[10.5px] font-extrabold text-gray-500";
  const td = "px-3 py-2 text-[11.5px] font-bold text-gray-700 dark:text-gray-200";
  return (
    <div className="space-y-4" dir="rtl">
      <div className="grid grid-cols-1 gap-3 rounded-[1.45rem] border border-gray-100 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4 dark:border-white/[0.06] dark:bg-[#111827]">
        <Field label="پرسنل"><Select value={docId} onChange={(e) => setDocId(e.target.value)}>
          <option value="">انتخاب کنید</option>
          {docs.map((d) => <option key={d.id} value={d.id}>{d.employee_name || d.title}</option>)}</Select></Field>
        <Field label="وضعیت"><Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">همه</option>
          {Object.entries(LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
        <Field label="از ماه"><JalaliMonthPicker value={from} onChange={setFrom} placeholder="مثلاً فروردین ۱۴۰۵" /></Field>
        <Field label="تا ماه"><JalaliMonthPicker value={to} onChange={setTo} placeholder="مثلاً اسفند ۱۴۰۵" /></Field>
        {canManage && docId && (<>
          <Field label="ماه شمسی گزارش"><div className="flex gap-2">
            <Select value={month} onChange={(e) => setMonth(e.target.value)}>
              {JALALI_MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</Select>
            <TextInput value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))} />
          </div></Field>
          <div className="flex items-end"><PrimaryButton loading={busy === "create"} onClick={create}>ساخت / به‌روزرسانی گزارش</PrimaryButton></div>
        </>)}
      </div>
      <p className="text-[10px] font-semibold text-gray-400">ساعت مصوب ماهانه (guild_work_hours) باید در پرونده کارمند تنظیم شده باشد. گزارش تصمیم‌گیری‌شده قابل تغییر نیست.</p>
      <ErrorBox message={err} />
      {loading && <Loader2 size={16} className="animate-spin text-indigo-500" />}
      {!docId ? <p className="text-[11.5px] font-bold text-gray-400">یک پرسنل انتخاب کنید.</p>
        : !loading && items.length === 0 ? <EmptyState icon={<RefreshCw size={20} />} title="گزارشی ثبت نشده است" />
        : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/[0.07]">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 dark:bg-white/5"><tr>
              <th className={th}>ماه</th><th className={th}>ساعت مصوب</th><th className={th}>ساعت تولید</th>
              <th className={th}>ساعت تأییدشده</th><th className={th}>کسری</th><th className={th}>وضعیت</th>
              <th className={th}>تصمیم‌گیری</th><th className={th}>یادداشت</th>{canManage && <th className={th}>اقدام</th>}
            </tr></thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t border-gray-100 dark:border-white/[0.06]">
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
                      <GhostButton disabled={busy === r.id} onClick={() => decide(r, "rejected")}><X size={13} /> رد</GhostButton>
                      <button disabled={busy === r.id} onClick={() => decide(r, "approved")}
                        className="flex h-9 items-center gap-1 rounded-full bg-emerald-600 px-4 text-[12px] font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50"><Check size={13} /> تأیید</button>
                    </div>)}</td>}
                </tr>))}
            </tbody>
          </table>
        </div>)}
      <Pager page={pg} pages={pages} onChange={setPg} />
    </div>
  );
}
