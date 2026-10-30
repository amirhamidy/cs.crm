"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { usePortalLogin } from "@/hooks/usePortalLogin";

export default function PortalLoginClient() {
  const [username,setUsername] = useState(""); const [password,setPassword] = useState("");
  const [show,setShow] = useState(false); const [error,setError] = useState("");
  const {login,loading} = usePortalLogin(); const router = useRouter();
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setError(""); const result = await login(username.trim(),password); if (result.ok) router.replace("/portal/products/"); else setError(result.message); };
  return <main dir="rtl" className="grid min-h-screen place-items-center bg-slate-950 px-4 py-10 text-white">
    <form onSubmit={submit} autoComplete="off" className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 shadow-2xl backdrop-blur-xl sm:p-9">
      <div className="mb-8 text-center"><img src="/radco.png" alt="رادکو" className="mx-auto mb-4 h-14 w-14 object-contain"/><h1 className="text-xl font-black">ورود به پرتال مشتریان</h1><p className="mt-2 text-xs text-slate-400">برای ثبت و پیگیری سفارش وارد شوید</p></div>
      <label className="mb-2 block text-xs text-slate-300" htmlFor="portal-username">نام کاربری</label><input id="portal-username" autoComplete="new-password" name="radco-portal-username" value={username} onChange={e=>setUsername(e.target.value)} className="mb-4 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-indigo-400" readOnly onFocus={(event) => { event.currentTarget.readOnly = false; }}/>
      <label className="mb-2 block text-xs text-slate-300" htmlFor="portal-password">رمز عبور</label><div className="relative"><input id="portal-password" autoComplete="new-password" name="radco-portal-password" type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 pl-12 text-sm outline-none focus:border-indigo-400" readOnly onFocus={(event) => { event.currentTarget.readOnly = false; }}/><button type="button" onClick={()=>setShow(!show)} className="absolute left-4 top-3.5 text-slate-400">{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-300">{error}</p>}
      <button disabled={loading || !username.trim() || !password} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3.5 text-sm font-black disabled:opacity-50">{loading?<Loader2 className="animate-spin" size={17}/>:null}ورود به پرتال</button>
      <Link href="/login/" className="mt-5 block text-center text-xs text-slate-400 hover:text-white">ورود کارمندان</Link>
    </form>
  </main>;
}
