"use client";
import { useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { accountsApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import { toast } from "@/components/notifications/toast";

export default function SetPasswordModal({ userId, userName, onClose }: { userId: number; userName: string; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    if (password.length < 8) { setError("رمز عبور باید حداقل ۸ کاراکتر باشد"); return; }
    setBusy(true); setError("");
    try { await accountsApi.users.setPassword(userId, password); toast.success("رمز عبور کاربر تغییر کرد"); onClose(); }
    catch (e) { setError(apiMessage(e, "تغییر رمز عبور انجام نشد")); }
    finally { setBusy(false); }
  };
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" dir="rtl">
    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
      <div className="mb-5 flex items-center justify-between"><h2 className="font-extrabold">تغییر رمز {userName}</h2><button onClick={onClose} aria-label="بستن"><X /></button></div>
      <div className="relative"><input type={visible ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="رمز جدید (حداقل ۸ کاراکتر)" className="w-full rounded-xl border border-gray-200 bg-transparent p-3 pl-12 text-sm outline-none focus:border-indigo-500 dark:border-white/10"  readOnly onFocus={(event) => { event.currentTarget.readOnly = false; }}/><button type="button" onClick={() => setVisible(!visible)} className="absolute left-3 top-3 text-gray-400">{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
      <p className="mt-3 text-xs text-amber-600">نشست‌های فعلی کاربر تا زمان انقضا معتبر می‌مانند.</p>
      {error && <p className="mt-3 text-xs text-rose-500">{error}</p>}
      <div className="mt-5 flex gap-2"><button disabled={busy} onClick={() => void submit()} className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "در حال ثبت..." : "ثبت رمز جدید"}</button><button onClick={onClose} className="rounded-xl bg-gray-100 px-4 py-3 text-sm dark:bg-white/10">انصراف</button></div>
    </div>
  </div>;
}
