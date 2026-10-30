"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { customerPortalApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import { toast } from "@/components/notifications/toast";

export default function SetPortalPasswordModal({ accountId, onClose, onGenerated }: { accountId: number; onClose: () => void; onGenerated: (password: string) => void }) {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [random, setRandom] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    if (!random && !password.trim()) { setError("رمز عبور را وارد کنید یا ساخت رمز تصادفی را فعال کنید"); return; }
    setBusy(true);
    setError("");
    try {
      const result = await customerPortalApi.accounts.setPassword(accountId, random || !password.trim() ? undefined : password);
      if (result.generated_password) onGenerated(result.generated_password);
      else { toast.success("رمز عبور تغییر کرد"); onClose(); }
    } catch (e) {
      setError(apiMessage(e, "تغییر رمز انجام نشد"));
    } finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" dir="rtl">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 dark:bg-slate-900">
        <h2 className="font-black">تغییر رمز پرتال</h2>
        <label className="mt-4 flex items-center gap-2 text-xs"><input type="checkbox" checked={random} onChange={(e) => setRandom(e.target.checked)} />ساخت رمز تصادفی توسط سرور</label>
        {!random && <div className="relative mt-3"><input type={visible ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="رمز جدید؛ خالی برای رمز تصادفی" className="w-full rounded-xl border border-slate-200 bg-transparent p-3 pl-12 text-sm dark:border-white/10" /><button type="button" onClick={() => setVisible(!visible)} className="absolute left-3 top-3 text-slate-400">{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>}
        {error && <p className="mt-3 text-xs text-rose-500">{error}</p>}
        <div className="mt-5 flex gap-2"><button disabled={busy} onClick={() => void submit()} className="flex-1 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white disabled:opacity-50">{busy ? "در حال ثبت..." : "ثبت رمز جدید"}</button><button onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-3 text-xs dark:bg-white/10">انصراف</button></div>
      </div>
    </div>
  );
}
