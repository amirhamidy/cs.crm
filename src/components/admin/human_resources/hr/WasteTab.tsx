"use client";
import { useEffect, useState } from "react";
import { listAll } from "@/lib/api";
import type { HumanResource } from "../humanResourceApi";
import { AlertTriangle, CalendarDays, Check, Eye, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { gradientOf, initialOf } from "../hrUtils";
import GlassModal from "@/components/customcomponents/shared/GlassModal";
import { CARD, CARD_HOVER } from "@/components/ui/ds";
import { useDialogs } from "@/components/ui/useDialogs";
import { useHrList } from "./useHrList";
import Pager from "./Pager";
import { Badge, EmptyState, ErrorBox, Field, GhostButton, PrimaryButton, Select, TextInput } from "./hrUi";
import WasteSummaryPanel from "./WasteSummaryPanel";
import { hrApi, errorMessage, fmtDate, fmtNum, type WasteDeduction, type WasteStatus } from "./hrApi";

const DOC_URL = "/document/api/v1/";

const LABEL: Record<WasteStatus, string> = { pending: "در انتظار تصمیم", approved: "تأیید‌شده", waived: "کسر نشد" };
const CLS: Record<WasteStatus, string> = {
  pending: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  approved: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  waived: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300",
};

function Detail({ row, canManage, onClose, onSaved }: { row: WasteDeduction; canManage: boolean; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState(String(Number(row.deduction_amount)));
  const [note, setNote] = useState(row.note || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const save = async (status?: WasteStatus) => {
    setBusy(true); setErr(null);
    try {
      await hrApi.wasteDeductions.update(row.id, { ...(status ? { status } : {}), deduction_amount: amount, note });
      onSaved();
    } catch (x) { setErr(errorMessage(x)); } finally { setBusy(false); }
  };
  return (
    <GlassModal open onClose={onClose} title="جزئیات کسر ضایعات" icon={<Trash2 size={18} />} maxWidth="max-w-3xl">
      <div className="space-y-3 p-6" dir="rtl">
        <ErrorBox message={err} />
        {row.needs_review && <p className="rounded-xl bg-amber-50 p-3 text-[11.5px] font-bold text-amber-700">ثبت تولید بعد از تصمیم تغییر کرده؛ نیاز به بازبینی دارد.</p>}
        <p className="rounded-xl bg-gray-50 p-3 text-[12px] font-semibold leading-6 text-gray-700 dark:bg-white/5 dark:text-gray-200">{row.explanation}</p>
        <div className="grid grid-cols-2 gap-2 text-[11.5px] font-bold text-gray-600 dark:text-gray-300">
          <span>ضایعات: {fmtNum(row.waste_qty)}</span><span>مجاز: {fmtNum(row.expected_waste)}</span>
          <span>اضافه: {fmtNum(row.excess_qty)}</span><span>قیمت واحد: {fmtNum(row.unit_price)}</span>
          <span>مبلغ محاسبه‌شده: {fmtNum(row.calculated_amount)}</span><span>مبلغ کسر: {fmtNum(row.deduction_amount)}</span>
        </div>
        {canManage && (<>
          <Field label="مبلغ کسر (حداکثر مبلغ محاسبه‌شده)"><TextInput type="number" min={0} max={Number(row.calculated_amount) || undefined} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field label="یادداشت"><TextInput value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </>)}
        <details className="rounded-xl border border-gray-100 p-3 dark:border-white/[0.07]"><summary className="cursor-pointer text-[12px] font-extrabold">خلاصه کسر ضایعات این فرد</summary><div className="pt-3"><WasteSummaryPanel documentId={row.document_id} /></div></details>
        {canManage && <div className="flex flex-wrap justify-end gap-2">
          <GhostButton onClick={onClose}>بستن</GhostButton>
          <GhostButton onClick={() => save()}>ذخیره مبلغ</GhostButton>
          <GhostButton onClick={() => save("waived")}>کسر نشود</GhostButton>
          <PrimaryButton loading={busy} onClick={() => save("approved")}>کسر شود</PrimaryButton>
        </div>}
      </div>
    </GlassModal>
  );
}

export default function WasteTab({ canManage }: { canManage: boolean }) {
  const [view, setView] = useState<"list" | "summary">("list");
  const [docId, setDocId] = useState("");
  const [docs, setDocs] = useState<HumanResource[]>([]);
  useEffect(() => { listAll<HumanResource>(DOC_URL).then(setDocs).catch(() => setDocs([])); }, []);
  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex gap-2">
        <GhostButton aria-pressed={view === "list"} className={view === "list" ? "!border-indigo-200 !bg-indigo-50 !text-indigo-700 dark:!bg-indigo-500/10" : ""} onClick={() => setView("list")}>لیست کسرها</GhostButton>
        <GhostButton aria-pressed={view === "summary"} className={view === "summary" ? "!border-indigo-200 !bg-indigo-50 !text-indigo-700 dark:!bg-indigo-500/10" : ""} onClick={() => setView("summary")}>خلاصه به تفکیک پرسنل</GhostButton>
      </div>
      {view === "list" ? <WasteList canManage={canManage} /> : (<>
        <Field label="پرسنل"><Select value={docId} onChange={(e) => setDocId(e.target.value)}>
          <option value="">انتخاب کنید</option>
          {docs.map((d) => <option key={d.id} value={d.id}>{d.employee_name || d.title}</option>)}</Select></Field>
        {docId && <WasteSummaryPanel documentId={Number(docId)} />}
      </>)}
    </div>
  );
}

function WasteList({ canManage }: { canManage: boolean }) {
  const [status, setStatus] = useState("");
  const [review, setReview] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const list = useHrList<WasteDeduction>((p, s) => hrApi.wasteDeductions.list(p, s),
    { status, ...(review ? { needs_review: "1" } : {}), date_from: from, date_to: to });
  const [sel, setSel] = useState<WasteDeduction | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { toast, dialog } = useDialogs();
  const quick = async (r: WasteDeduction, st: WasteStatus) => {
    setBusyId(r.id);
    try { setErr(null); await hrApi.wasteDeductions.update(r.id, { status: st }); toast(st === "approved" ? "کسر تأیید شد" : "کسر لغو شد"); list.reload(); } catch (e) { setErr(errorMessage(e)); } finally { setBusyId(null); }
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 rounded-[1.45rem] border border-gray-100 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4 dark:border-white/[0.06] dark:bg-[#111827]">
        <Field label="وضعیت">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">همه وضعیت‌ها</option>
            {Object.entries(LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        <Field label="از تاریخ"><TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="تا تاریخ"><TextInput type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        <label className="flex h-11 items-center gap-2 text-[12px] font-bold text-gray-600 dark:text-gray-300">
          <input type="checkbox" checked={review} onChange={(e) => setReview(e.target.checked)} />نیاز به بازبینی
        </label>
      </div>
      <ErrorBox message={err || list.error} />
      {!list.loading && list.items.length === 0 ? (
        <EmptyState icon={<Trash2 size={20} />} title="کسر ضایعاتی ثبت نشده است" />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {list.items.map((r) => (
              <motion.div key={r.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: "spring", damping: 24, stiffness: 260 }}
                className={`overflow-hidden ${CARD} ${CARD_HOVER}`} dir="rtl">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientOf(r.document_id ?? r.id)} text-[14px] font-extrabold text-white shadow-sm`}>
                      {initialOf(r.employee_name, "؟")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">{r.employee_name}</h3>
                      <p className="mt-1 flex items-center gap-1 text-[10.5px] font-semibold text-gray-400"><CalendarDays size={11} />{fmtDate(r.date)} • {r.product_name || "—"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={CLS[r.status]}>{LABEL[r.status]}</Badge>
                      {r.needs_review && <Badge className="bg-amber-50 text-amber-600"><AlertTriangle size={11} /> بازبینی</Badge>}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-gray-50 p-2 dark:bg-white/5"><p className="text-[10px] font-bold text-gray-400">ضایعات اضافه</p><p className="mt-0.5 text-[12px] font-extrabold text-gray-800 dark:text-white">{fmtNum(r.excess_qty)}</p></div>
                    <div className="rounded-xl bg-gray-50 p-2 dark:bg-white/5"><p className="text-[10px] font-bold text-gray-400">محاسبه‌شده</p><p className="mt-0.5 text-[12px] font-extrabold text-gray-800 dark:text-white">{fmtNum(r.calculated_amount)}</p></div>
                    <div className="rounded-xl bg-rose-50 p-2 dark:bg-rose-500/10"><p className="text-[10px] font-bold text-rose-400">مبلغ کسر</p><p className="mt-0.5 text-[12px] font-extrabold text-rose-600">{fmtNum(r.deduction_amount)}</p></div>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <GhostButton onClick={() => setSel(r)}><Eye size={13} /> جزئیات</GhostButton>
                    {canManage && r.status === "pending" && (<>
                      <button disabled={busyId === r.id} className="flex h-9 items-center gap-1 rounded-full bg-gray-100 px-4 text-[12px] font-extrabold text-gray-600 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-white/10 dark:text-gray-200" onClick={() => quick(r, "waived")}><X size={13} /> کسر نشود</button>
                      <button disabled={busyId === r.id} className="flex h-9 items-center gap-1 rounded-full bg-emerald-600 px-4 text-[12px] font-extrabold text-white transition hover:bg-emerald-700 disabled:opacity-50" onClick={() => quick(r, "approved")}><Check size={13} /> کسر شود</button>
                    </>)}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      <Pager page={list.page} pages={list.pages} onChange={list.setPage} />
      {sel && <Detail row={sel} canManage={canManage} onClose={() => setSel(null)} onSaved={() => { setSel(null); toast("تغییرات ذخیره شد"); list.reload(); }} />}
      {dialog}
    </div>
  );
}
