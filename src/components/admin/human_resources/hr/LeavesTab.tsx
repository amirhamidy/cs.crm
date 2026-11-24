"use client";
import { useState } from "react";
import { CalendarOff, Check, Plus, X } from "lucide-react";
import GlassModal from "@/components/customcomponents/shared/GlassModal";
import { useHrList } from "./useHrList";
import Pager from "./Pager";
import { Badge, EmptyState, ErrorBox, Field, GhostButton, PrimaryButton, Select, TextInput } from "./hrUi";
import {
  hrApi, errorMessage, fmtDate, fmtNum, profileName, profileIdOf, LEAVE_TYPE_LABEL, STATUS_CLASS, STATUS_LABEL,
  type HRLeave, type LeaveType,
} from "./hrApi";

function LeaveForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ profile: "", leave_type: "paid" as LeaveType, start_date: "", end_date: "", hours: "", reason: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      await hrApi.leaves.create({ profile: Number(f.profile), leave_type: f.leave_type, start_date: f.start_date,
        end_date: f.end_date || f.start_date, hours: f.hours || null, reason: f.reason });
      onSaved();
    } catch (x) { setErr(errorMessage(x)); } finally { setBusy(false); }
  };
  return (
    <GlassModal open onClose={onClose} title="ثبت مرخصی" icon={<CalendarOff size={18} />} maxWidth="max-w-lg">
      <form onSubmit={submit} className="space-y-3 p-6" dir="rtl">
        <ErrorBox message={err} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="شناسه پرونده پرسنلی"><TextInput type="number" group={false} required value={f.profile} onChange={(e) => set("profile", e.target.value)} /></Field>
          <Field label="نوع"><Select value={f.leave_type} onChange={(e) => set("leave_type", e.target.value)}>
            <option value="paid">با حقوق</option><option value="unpaid">بدون حقوق</option></Select></Field>
          <Field label="از تاریخ"><TextInput type="date" required value={f.start_date} onChange={(e) => set("start_date", e.target.value)} /></Field>
          <Field label="تا تاریخ"><TextInput type="date" value={f.end_date} onChange={(e) => set("end_date", e.target.value)} /></Field>
          <Field label="ساعت (مرخصی ساعتی)"><TextInput type="number" decimal group={false} value={f.hours} onChange={(e) => set("hours", e.target.value)} /></Field>
        </div>
        <Field label="توضیحات"><TextInput value={f.reason} onChange={(e) => set("reason", e.target.value)} /></Field>
        <div className="flex justify-end gap-2"><GhostButton onClick={onClose}>انصراف</GhostButton><PrimaryButton type="submit" loading={busy}>ثبت</PrimaryButton></div>
      </form>
    </GlassModal>
  );
}

export default function LeavesTab({ canManage }: { canManage: boolean }) {
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const list = useHrList<HRLeave>((p, s) => hrApi.leaves.list(p, s), { status, leave_type: type });
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const act = async (fn: () => Promise<unknown>) => {
    try { setErr(null); await fn(); list.reload(); } catch (e) { setErr(errorMessage(e)); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select className="!w-auto min-w-[160px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">همه وضعیت‌ها</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select className="!w-auto min-w-[160px]" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">همه انواع</option><option value="paid">با حقوق</option><option value="unpaid">بدون حقوق</option>
        </Select>
        <PrimaryButton className="mr-auto" onClick={() => setOpen(true)}><Plus size={14} />ثبت مرخصی</PrimaryButton>
      </div>
      <ErrorBox message={err || list.error} />
      {!list.loading && list.items.length === 0 ? (
        <EmptyState icon={<CalendarOff size={20} />} title="مرخصی‌ای ثبت نشده است" />
      ) : (
        <div className="space-y-2">
          {list.items.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 dark:border-white/[0.07] dark:bg-[#111827]">
              <div>
                <p className="text-[12.5px] font-extrabold text-gray-800 dark:text-white">{profileName(l)}</p>
                <p className="mt-1 text-[10.5px] font-semibold text-gray-400">
                  {LEAVE_TYPE_LABEL[l.leave_type]} • {fmtDate(l.start_date)} تا {fmtDate(l.end_date)}
                  {l.hours ? ` • ${fmtNum(l.hours)} ساعت` : ""}{l.reason ? ` • ${l.reason}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={STATUS_CLASS[l.status]}>{STATUS_LABEL[l.status]}</Badge>
                {canManage && l.status === "pending" && (<>
                  <button title="تأیید" className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600" onClick={() => act(() => hrApi.leaves.approve(l.id))}><Check size={14} /></button>
                  <button title="رد" className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600" onClick={() => act(() => hrApi.leaves.reject(l.id))}><X size={14} /></button>
                </>)}
              </div>
            </div>
          ))}
        </div>
      )}
      <Pager page={list.page} pages={list.pages} onChange={list.setPage} />
      {open && <LeaveForm onClose={() => setOpen(false)} onSaved={() => { setOpen(false); list.reload(); }} />}
    </div>
  );
}
