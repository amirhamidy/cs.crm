"use client";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import GlassModal from "@/components/customcomponents/shared/GlassModal";
import { Field, TextInput, ErrorBox, PrimaryButton, GhostButton } from "./hrUi";
import { hrApi, errorMessage, personOf, type HRProfile, type HRProfilePayload } from "./hrApi";

export default function ProfileForm({ open, profile, onClose, onSaved }: {
  open: boolean; profile: HRProfile | null; onClose: () => void; onSaved: () => void;
}) {
  const editing = !!profile;
  const [personId, setPersonId] = useState(profile ? String(personOf(profile.person).id ?? "") : "");
  const [employee, setEmployee] = useState<number | null>(profile?.employee ?? null);
  const [hire, setHire] = useState(profile?.hire_date ?? "");
  const [daily, setDaily] = useState(profile?.daily_work_hours ?? "8");
  const [rate, setRate] = useState(profile?.overtime_rate_per_hour ?? "");
  const [legal, setLegal] = useState(profile?.legal_monthly_hours ?? "");
  const [active, setActive] = useState(profile?.is_active ?? true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing && !personId) return setErr("شناسه شخص الزامی است.");
    setBusy(true); setErr(null);
    const body: HRProfilePayload = {
      employee, hire_date: hire || null, daily_work_hours: daily,
      overtime_rate_per_hour: rate || "0", legal_monthly_hours: legal || null, is_active: active,
    };
    if (!editing) body.person = Number(personId);
    try {
      if (profile) await hrApi.profiles.update(profile.id, body);
      else await hrApi.profiles.create(body);
      onSaved();
    } catch (x) { setErr(errorMessage(x)); } finally { setBusy(false); }
  };

  return (
    <GlassModal open={open} onClose={onClose} title={editing ? "ویرایش پرونده پرسنلی" : "پرونده پرسنلی جدید"}
      description="مشخصات اصلی و تنظیمات ساعت کار" icon={<UserPlus size={18} />} maxWidth="max-w-xl">
      <form onSubmit={submit} className="space-y-3 p-6" dir="rtl">
        <ErrorBox message={err} />
        {!editing && (
          <Field label="شناسه شخص (Person)" hint="شناسه شخص ثبت‌شده در سیستم">
            <TextInput type="number" min={1} value={personId} onChange={(e) => setPersonId(e.target.value)} />
          </Field>
        )}
        <Field label="کاربر سیستم (اختیاری)">
          <TextInput type="number" min={1} placeholder="شناسه کاربر" value={employee ?? ""} onChange={(e) => setEmployee(e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="تاریخ استخدام"><TextInput type="date" value={hire} onChange={(e) => setHire(e.target.value)} /></Field>
          <Field label="ساعت کار روزانه"><TextInput type="number" step="0.25" value={daily} onChange={(e) => setDaily(e.target.value)} /></Field>
          <Field label="نرخ اضافه‌کاری (هر ساعت)"><TextInput type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
          <Field label="ساعت قانونی ماهانه" hint="مثلاً بر اساس ساعت کار اصناف"><TextInput type="number" value={legal} onChange={(e) => setLegal(e.target.value)} /></Field>
        </div>
        <label className="flex items-center gap-2 text-[12px] font-bold text-gray-600 dark:text-gray-300">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> فعال
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <GhostButton onClick={onClose}>انصراف</GhostButton>
          <PrimaryButton type="submit" loading={busy}>ذخیره</PrimaryButton>
        </div>
      </form>
    </GlassModal>
  );
}
