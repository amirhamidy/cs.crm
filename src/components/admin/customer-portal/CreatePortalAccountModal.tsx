"use client";
import { useState } from "react";
import AsyncSelect, { type AsyncOption } from "@/components/ui/AsyncSelect";
import { customersApi, customerPortalApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import type { Customer } from "@/types/customer";
import type { CreatePortalAccountResponse } from "@/types/portal";

export default function CreatePortalAccountModal({ onClose, onCreated, initialCustomer }: { onClose: () => void; onCreated: (r: CreatePortalAccountResponse) => void; initialCustomer?: Customer }) {
    const [customer, setCustomer] = useState<AsyncOption | null>(initialCustomer ? { id: initialCustomer.id, label: initialCustomer.full_name, sub: initialCustomer.company_name } : null);
    const [username, setUsername] = useState(""); const [password, setPassword] = useState(""); const [random, setRandom] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
    const submit = async (e: React.FormEvent) => { e.preventDefault(); if (!customer) { setError("مشتری را انتخاب کنید"); return; } if (!username.trim()) { setError("نام کاربری را وارد کنید"); return; } if (!random && !password.trim()) { setError("رمز عبور را وارد کنید یا ساخت رمز تصادفی را فعال کنید"); return; } setBusy(true); setError(""); try { const r = await customerPortalApi.accounts.create({ customer: customer.id, username: username.trim(), ...(random ? {} : { password }) }); onCreated(r); } catch (err) { setError(apiMessage(err, "ساخت حساب انجام نشد")); } finally { setBusy(false) } };
    return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" dir="rtl"><form autoComplete="off" onSubmit={submit} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900"><div className="mb-5 flex justify-between"><h2 className="font-black">ساخت دسترسی پرتال مشتری</h2><button type="button" onClick={onClose}>✕</button></div>
        <AsyncSelect<Customer> label="مشتری" placeholder="جستجوی مشتری..." emptyText="مشتری پیدا نشد" value={customer?.id ?? null} selected={customer} fetcher={(params, signal) => customersApi.page(params, signal)} toOption={c => ({ id: c.id, label: c.full_name, sub: c.company_name })} onChange={setCustomer} />
        <label className="mb-2 mt-4 block text-xs font-bold">نام کاربری</label><input value={username} onChange={e => setUsername(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-transparent p-3 text-sm dark:border-white/10" placeholder="مثلاً ali.rezaei" autoComplete="off" readOnly onFocus={(event) => { event.currentTarget.readOnly = false; }} />
        <label className="mt-4 flex items-center gap-2 text-xs"><input type="checkbox" checked={random} onChange={e => setRandom(e.target.checked)} />ساخت رمز تصادفی توسط سرور</label>
        {!random && <><label className="mb-2 mt-3 block text-xs font-bold">رمز عبور</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-transparent p-3 text-sm dark:border-white/10" autoComplete="new-password" readOnly onFocus={(event) => { event.currentTarget.readOnly = false; }} /></>}
        {error && <p className="mt-3 text-xs text-rose-500">{error}</p>}<div className="mt-6 flex gap-2"><button disabled={busy} className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "در حال ساخت..." : "ساخت حساب پرتال"}</button><button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-3 text-sm dark:bg-white/10">انصراف</button></div>
    </form></div>;
}
