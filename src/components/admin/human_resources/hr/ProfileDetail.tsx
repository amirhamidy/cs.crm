"use client";
import { useCallback, useEffect, useState } from "react";
import { Wallet, FileSignature, Clock } from "lucide-react";
import GlassModal from "@/components/customcomponents/shared/GlassModal";
import { Field, TextInput, Select, ErrorBox, PrimaryButton, InfoRow } from "./hrUi";
import {
  hrApi, errorMessage, fmtDate, fmtNum, personOf, PERIOD_LABEL, CONTRACT_KINDS,
  type HRProfile, type HRSalary, type HRContract, type HROvertime, type PeriodType,
} from "./hrApi";

const today = () => new Date().toISOString().slice(0, 10);
const H = ({ icon, t }: { icon: React.ReactNode; t: string }) => (
  <h4 className="mb-2 mt-5 flex items-center gap-2 text-[12px] font-extrabold text-gray-800 dark:text-white">{icon}{t}</h4>
);

export default function ProfileDetail({ profile, onClose, onChanged }: {
  profile: HRProfile | null; onClose: () => void; onChanged: () => void;
}) {
  const id = profile?.id;
  const [salaries, setSalaries] = useState<HRSalary[]>([]);
  const [contracts, setContracts] = useState<HRContract[]>([]);
  const [overtime, setOvertime] = useState<HROvertime[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sal, setSal] = useState({ period_type: "monthly" as PeriodType, amount: "", effective_from: today() });
  const [con, setCon] = useState({ document: "", kind: "permanent", start_date: today(), end_date: "" });
  const [ot, setOt] = useState({ date: today(), hours: "" });

  const load = useCallback(async () => {
    if (!id) return;
    const [s, c, o] = await Promise.allSettled([
      hrApi.salary.list(id), hrApi.contracts.list(id), hrApi.overtime.list({ profile: id, page_size: 50 }),
    ]);
    if (s.status === "fulfilled") setSalaries(s.value.results);
    if (c.status === "fulfilled") setContracts(c.value.results);
    if (o.status === "fulfilled") setOvertime(o.value.results);
  }, [id]);
  useEffect(() => { setErr(null); load(); }, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setErr(null);
    try { await fn(); await load(); onChanged(); } catch (e) { setErr(errorMessage(e)); } finally { setBusy(false); }
  };

  if (!profile) return null;
  const p = personOf(profile.person);
  const row = "flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 text-[11px] font-bold text-gray-700 dark:border-white/[0.06] dark:text-gray-200";

  return (
    <GlassModal open onClose={onClose} title={p.name} description="جزئیات پرونده پرسنلی" maxWidth="max-w-2xl">
      <div className="max-h-[75vh] space-y-2 overflow-y-auto p-6" dir="rtl">
        <ErrorBox message={err} />
        <div className="grid grid-cols-2 gap-2">
          <InfoRow label="تاریخ استخدام" value={fmtDate(profile.hire_date)} />
          <InfoRow label="ساعت کار روزانه" value={fmtNum(profile.daily_work_hours)} />
          <InfoRow label="نرخ اضافه‌کاری" value={fmtNum(profile.overtime_rate_per_hour)} />
          <InfoRow label="ساعت قانونی ماهانه" value={fmtNum(profile.legal_monthly_hours)} />
        </div>

        <H icon={<Wallet size={14} />} t="سوابق حقوق پایه" />
        {salaries.length === 0 && <p className="text-[11px] text-gray-400">سابقه‌ای ثبت نشده است.</p>}
        {salaries.map((s, i) => (
          <div key={s.id ?? i} className={row}>
            <span>{PERIOD_LABEL[s.period_type]} — {fmtNum(s.amount)}</span>
            <span className="text-gray-400">از {fmtDate(s.effective_from)} تا {fmtDate(s.effective_to)}</span>
          </div>
        ))}
        <form className="grid grid-cols-4 items-end gap-2" onSubmit={(e) => { e.preventDefault(); run(() => hrApi.salary.create(profile.id, sal)); }}>
          <Field label="دوره"><Select value={sal.period_type} onChange={(e) => setSal({ ...sal, period_type: e.target.value as PeriodType })}>
            <option value="monthly">ماهانه</option><option value="daily">روزانه</option></Select></Field>
          <Field label="مبلغ"><TextInput type="number" required value={sal.amount} onChange={(e) => setSal({ ...sal, amount: e.target.value })} /></Field>
          <Field label="تاریخ اعمال"><TextInput type="date" required value={sal.effective_from} onChange={(e) => setSal({ ...sal, effective_from: e.target.value })} /></Field>
          <PrimaryButton type="submit" loading={busy}>ثبت</PrimaryButton>
        </form>

        <H icon={<FileSignature size={14} />} t="قراردادها" />
        {contracts.length === 0 && <p className="text-[11px] text-gray-400">قراردادی ثبت نشده است.</p>}
        {contracts.map((c) => (
          <div key={c.id} className={row}>
            <span>{CONTRACT_KINDS[c.kind] ?? c.kind}{c.is_current ? " (جاری)" : ""}</span>
            <span className="text-gray-400">{fmtDate(c.start_date)} تا {fmtDate(c.end_date)}</span>
          </div>
        ))}
        <form className="grid grid-cols-5 items-end gap-2" onSubmit={(e) => {
          e.preventDefault();
          run(() => hrApi.contracts.create(profile.id, { document: Number(con.document), kind: con.kind, start_date: con.start_date, end_date: con.end_date || null }));
        }}>
          <Field label="شناسه سند"><TextInput type="number" group={false} required value={con.document} onChange={(e) => setCon({ ...con, document: e.target.value })} /></Field>
          <Field label="نوع"><Select value={con.kind} onChange={(e) => setCon({ ...con, kind: e.target.value })}>
            {Object.entries(CONTRACT_KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
          <Field label="شروع"><TextInput type="date" required value={con.start_date} onChange={(e) => setCon({ ...con, start_date: e.target.value })} /></Field>
          <Field label="پایان"><TextInput type="date" value={con.end_date} onChange={(e) => setCon({ ...con, end_date: e.target.value })} /></Field>
          <PrimaryButton type="submit" loading={busy}>ثبت</PrimaryButton>
        </form>

        <H icon={<Clock size={14} />} t="اضافه‌کاری" />
        {overtime.length === 0 && <p className="text-[11px] text-gray-400">موردی ثبت نشده است.</p>}
        {overtime.map((o) => (
          <div key={o.id} className={row}>
            <span>{fmtDate(o.date)} — {fmtNum(o.hours)} ساعت</span>
            <span className="text-gray-400">{fmtNum(o.amount)}</span>
          </div>
        ))}
        <form className="grid grid-cols-3 items-end gap-2" onSubmit={(e) => { e.preventDefault(); run(() => hrApi.overtime.create({ profile: profile.id, ...ot })); }}>
          <Field label="تاریخ"><TextInput type="date" required value={ot.date} onChange={(e) => setOt({ ...ot, date: e.target.value })} /></Field>
          <Field label="ساعت"><TextInput type="number" decimal group={false} required value={ot.hours} onChange={(e) => setOt({ ...ot, hours: e.target.value })} /></Field>
          <PrimaryButton type="submit" loading={busy}>ثبت</PrimaryButton>
        </form>
      </div>
    </GlassModal>
  );
}
