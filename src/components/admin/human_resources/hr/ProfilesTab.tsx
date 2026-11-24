"use client";
import { useState } from "react";
import { Plus, Search, Users, Pencil, Trash2, Eye } from "lucide-react";
import { CARD } from "@/components/ui/ds";
import { useHrList } from "./useHrList";
import Pager from "./Pager";
import ProfileForm from "./ProfileForm";
import ProfileDetail from "./ProfileDetail";
import { Badge, EmptyState, ErrorBox, PrimaryButton, Select, TextInput } from "./hrUi";
import { hrApi, errorMessage, fmtDate, fmtNum, personOf, PERIOD_LABEL, type HRProfile } from "./hrApi";

export default function ProfilesTab({ canManage }: { canManage: boolean }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState("");
  const list = useHrList<HRProfile>((p, s) => hrApi.profiles.list(p, s), { search: q, is_active: active });
  const [form, setForm] = useState<{ open: boolean; item: HRProfile | null }>({ open: false, item: null });
  const [detail, setDetail] = useState<HRProfile | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const remove = async (p: HRProfile) => {
    if (!confirm("این پرونده حذف شود؟")) return;
    try { await hrApi.profiles.remove(p.id); list.reload(); } catch (e) { setErr(errorMessage(e)); }
  };
  const ib = "flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:text-indigo-600 dark:bg-white/5";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="absolute right-3 top-3 text-gray-400" />
          <TextInput className="pr-9" placeholder="جستجوی نام..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select className="!w-auto min-w-[160px]" value={active} onChange={(e) => setActive(e.target.value)}>
          <option value="">همه</option><option value="true">فعال</option><option value="false">غیرفعال</option>
        </Select>
        {canManage && <PrimaryButton onClick={() => setForm({ open: true, item: null })}><Plus size={14} />پرونده جدید</PrimaryButton>}
      </div>
      <ErrorBox message={err || list.error} />
      {!list.loading && list.items.length === 0 ? (
        <EmptyState icon={<Users size={20} />} title="پرونده‌ای یافت نشد" text="برای شروع، یک پرونده پرسنلی ایجاد کنید." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.items.map((p) => {
            const sal = p.current_salary;
            return (
              <div key={p.id} className={`${CARD} p-4`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-extrabold text-gray-800 dark:text-white">{personOf(p.person).name}</h3>
                  <Badge className={p.is_active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}>{p.is_active ? "فعال" : "غیرفعال"}</Badge>
                </div>
                <div className="mt-3 space-y-1 text-[11px] font-semibold text-gray-500">
                  <p>استخدام: {fmtDate(p.hire_date)}</p>
                  <p>حقوق پایه: {sal ? `${fmtNum(sal.amount)} (${PERIOD_LABEL[sal.period_type]})` : "—"}</p>
                  <p>ساعت کار روزانه: {fmtNum(p.daily_work_hours)}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className={ib} title="جزئیات" onClick={() => setDetail(p)}><Eye size={14} /></button>
                  {canManage && <button className={ib} title="ویرایش" onClick={() => setForm({ open: true, item: p })}><Pencil size={14} /></button>}
                  {canManage && <button className={ib} title="حذف" onClick={() => remove(p)}><Trash2 size={14} /></button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {list.loading && <p className="text-center text-[11px] text-gray-400">در حال بارگذاری...</p>}
      <Pager page={list.page} pages={list.pages} onChange={list.setPage} />
      {form.open && (
        <ProfileForm key={form.item?.id ?? "new"} open profile={form.item}
          onClose={() => setForm({ open: false, item: null })}
          onSaved={() => { setForm({ open: false, item: null }); list.reload(); }} />
      )}
      {detail && <ProfileDetail profile={detail} onClose={() => setDetail(null)} onChanged={list.reload} />}
    </div>
  );
}
