"use client";
import { useState } from "react";
import { Check, Eye, Trash2, X } from "lucide-react";
import { useHrList } from "./useHrList";
import Pager from "./Pager";
import { Badge, EmptyState, ErrorBox, Field, PrimaryButton, Select, TextInput } from "./hrUi";
import WasteSummaryPanel from "./WasteSummaryPanel";
import GlassModal from "@/components/customcomponents/shared/GlassModal";
import { useDialogs } from "@/components/ui/useDialogs";
import { hrApi, errorMessage, fmtDate, fmtNum, type WasteDeduction, type WasteStatus } from "./hrApi";

const LABEL: Record<WasteStatus, string> = { pending: "در انتظار تصمیم", approved: "تأییدشده", waived: "کسر نشد" };
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
        {row.needs_review && <p className="rounded-xl bg-amber-50 p-3 text-[11.5px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">ثبت تولید بعد از تصمیم تغییر کرده؛ نیاز به بازبینی دارد.</p>}
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
        {canManage && (<>
          <div className="flex flex-wrap justify-end gap-2">
            <button onClick={onClose} className="flex h-9 items-center gap-1 rounded-full bg-gray-100 px-4 text-[12px] font-extrabold text-gray-700 transition hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15">بستن</button>
            <button onClick={() => save()} className="flex h-9 items-center gap-1 rounded-full bg-gray-100 px-4 text-[12px] font-extrabold text-gray-700 transition hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15">ذخیره مبلغ</button>
            <button onClick={() => save("waived")} className="flex h-9 items-center gap-1 rounded-full bg-gray-100 px-4 text-[12px] font-extrabold text-gray-700 transition hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15">کسر نشود</button>
            <PrimaryButton loading={busy} onClick={() => save("approved")}>کسر شود</PrimaryButton>
          </div>
        </>)}
      </div>
    </GlassModal>
  );
}

export default function PersonnelWastePanel({ documentId, canManage }: { documentId: number; canManage: boolean }) {
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const list = useHrList<WasteDeduction>((p, s) => hrApi.wasteDeductions.list({ ...p, document_id: documentId }, s),
    { status, date_from: from, date_to: to });
  const [sel, setSel] = useState<WasteDeduction | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { toast, dialog } = useDialogs();
  const quick = async (r: WasteDeduction, st: WasteStatus) => {
    setBusyId(r.id);
    try { setErr(null); await hrApi.wasteDeductions.update(r.id, { status: st }); toast(st === "approved" ? "کسر تأیید شد" : "کسر لغو شد"); list.reload(); } catch (e) { setErr(errorMessage(e)); } finally { setBusyId(null); }
  };

  const th = "px-3 py-2 text-right text-[10.5px] font-extrabold text-gray-500";
  const td = "px-3 py-2 text-[11.5px] font-bold text-gray-700 dark:text-gray-200";

  return (
    <div className="space-y-4" dir="rtl">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-gray-800">
        <WasteSummaryPanel documentId={documentId} />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Field label="وضعیت">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">همه</option>
            {Object.entries(LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        <Field label="از تاریخ"><TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="تا تاریخ"><TextInput type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
      </div>

      <ErrorBox message={err || list.error} />

      {!list.loading && list.items.length === 0 ? (
        <EmptyState icon={<Trash2 size={20} />} title="کسر ضایعاتی ثبت نشده است" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm dark:border-white/[0.07]">
          <table className="w-full min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-white/10"><tr>
              <th className={th}>تاریخ</th><th className={th}>محصول</th><th className={th}>اضافه</th>
              <th className={th}>محاسبه‌شده</th><th className={th}>مبلغ کسر</th><th className={th}>وضعیت</th>
              <th className={th}>اقدام</th>
            </tr></thead>
            <tbody>
              {list.items.map((r) => (
                <tr key={r.id} className="border-t border-gray-100 transition-colors odd:bg-white even:bg-gray-50/60 hover:bg-indigo-50/50 dark:border-white/[0.06] dark:odd:bg-transparent dark:even:bg-white/[0.02] dark:hover:bg-white/[0.05]">
                  <td className={td}>{fmtDate(r.date)}</td>
                  <td className={td}>
                    <div className="flex items-center gap-1">
                      {r.product_name || "—"}
                      {r.needs_review && <span className="rounded px-1 py-0.5 text-[9px] font-extrabold bg-amber-100 text-amber-700 dark:bg-amber-500/20">بازبینی</span>}
                    </div>
                  </td>
                  <td className={td}>{fmtNum(r.excess_qty)}</td>
                  <td className={td}>{fmtNum(r.calculated_amount)}</td>
                  <td className={`${td} text-rose-600`}>{fmtNum(r.deduction_amount)}</td>
                  <td className={td}><Badge className={CLS[r.status]}>{LABEL[r.status]}</Badge></td>
                  <td className={td}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSel(r)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5" title="جزئیات">
                        <Eye size={13} />
                      </button>
                      {canManage && r.status === "pending" && (<>
                        <button disabled={busyId === r.id} onClick={() => quick(r, "waived")} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-white/5" title="کسر نشود">
                          <X size={13} />
                        </button>
                        <button disabled={busyId === r.id} onClick={() => quick(r, "approved")} className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 dark:hover:bg-emerald-500/10" title="کسر شود">
                          <Check size={13} />
                        </button>
                      </>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={list.page} pages={list.pages} onChange={list.setPage} />
      {sel && <Detail row={sel} canManage={canManage} onClose={() => setSel(null)} onSaved={() => { setSel(null); toast("تغییرات ذخیره شد"); list.reload(); }} />}
      {dialog}
    </div>
  );
}
