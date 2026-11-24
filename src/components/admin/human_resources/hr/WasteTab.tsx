"use client";
import { useEffect, useState } from "react";
import { listAll } from "@/lib/api";
import type { HumanResource } from "../humanResourceApi";
import { AlertTriangle, Check, Eye, Trash2, X } from "lucide-react";
import GlassModal from "@/components/customcomponents/shared/GlassModal";
import { useHrList } from "./useHrList";
import Pager from "./Pager";
import { Badge, EmptyState, ErrorBox, Field, GhostButton, PrimaryButton, Select, TextInput } from "./hrUi";
import WasteSummaryPanel from "./WasteSummaryPanel";
import { hrApi, errorMessage, fmtDate, fmtNum, type WasteDeduction, type WasteStatus } from "./hrApi";

const DOC_URL = "/document/api/v1/";

const LABEL: Record<WasteStatus, string> = { pending: "در انتظار تصمیم", approved: "تأیید‌شده", waived: "بخشوده" };
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
          <GhostButton onClick={() => save("waived")}>بخشودن</GhostButton>
          <PrimaryButton loading={busy} onClick={() => save("approved")}>تأیید کسر</PrimaryButton>
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
        <GhostButton onClick={() => setView("list")}>لیست کسرها</GhostButton>
        <GhostButton onClick={() => setView("summary")}>خلاصه به تفکیک پرسنل</GhostButton>
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
  const quick = async (r: WasteDeduction, st: WasteStatus) => {
    try { setErr(null); await hrApi.wasteDeductions.update(r.id, { status: st }); list.reload(); } catch (e) { setErr(errorMessage(e)); }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select className="!w-auto min-w-[160px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">همه وضعیت‌ها</option>
          {Object.entries(LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <TextInput className="!w-auto" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <TextInput className="!w-auto" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <label className="flex items-center gap-1 text-[12px] font-bold text-gray-600">
          <input type="checkbox" checked={review} onChange={(e) => setReview(e.target.checked)} />نیاز به بازبینی
        </label>
      </div>
      <ErrorBox message={err || list.error} />
      {!list.loading && list.items.length === 0 ? (
        <EmptyState icon={<Trash2 size={20} />} title="کسر ضایعاتی ثبت نشده است" />
      ) : (
        <div className="space-y-2">
          {list.items.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 dark:border-white/[0.07] dark:bg-[#111827]">
              <div>
                <p className="text-[12.5px] font-extrabold text-gray-800 dark:text-white">{r.employee_name} • {fmtDate(r.date)}</p>
                <p className="mt-1 text-[10.5px] font-semibold text-gray-400">
                  {r.product_name || "—"} • اضافه {fmtNum(r.excess_qty)} • کسر {fmtNum(r.deduction_amount)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {r.needs_review && <Badge className="bg-amber-50 text-amber-600"><AlertTriangle size={11} /> بازبینی</Badge>}
                <Badge className={CLS[r.status]}>{LABEL[r.status]}</Badge>
                <button title="جزئیات" className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600" onClick={() => setSel(r)}><Eye size={14} /></button>
                {canManage && r.status === "pending" && (<>
                  <button title="تأیید" className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600" onClick={() => quick(r, "approved")}><Check size={14} /></button>
                  <button title="بخشودن" className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600" onClick={() => quick(r, "waived")}><X size={14} /></button>
                </>)}
              </div>
            </div>
          ))}
        </div>
      )}
      <Pager page={list.page} pages={list.pages} onChange={list.setPage} />
      {sel && <Detail row={sel} canManage={canManage} onClose={() => setSel(null)} onSaved={() => { setSel(null); list.reload(); }} />}
    </div>
  );
}
