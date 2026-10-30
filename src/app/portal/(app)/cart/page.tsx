"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingBag } from "lucide-react";
import { usePortalCartStore } from "@/store/portalCartStore";
import { portalApi } from "@/lib/portal/portalApi";
import { apiMessage } from "@/lib/apiMessage";
import { toEnglishDigits } from "@/lib/digits";
import { toast } from "@/components/notifications/toast";

export default function PortalCartPage() {
  const {items,setQuantity,remove,clear,total}=usePortalCartStore();
  const [note,setNote]=useState(""); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  const router=useRouter();
  const submit=async()=>{if(!items.length)return;setBusy(true);setError("");try{await portalApi.createOrder({note,items:items.map(i=>({product:i.product.id,quantity:i.quantity}))});clear();toast.success("سفارش ثبت شد؛ موجودی رزرو نمی‌شود و کارمند سفارش را بررسی می‌کند");router.push("/portal/orders/");}catch(e){setError(apiMessage(e,"ثبت سفارش انجام نشد"));}finally{setBusy(false)}};
  return <section dir="rtl"><h1 className="mb-5 text-xl font-black">سبد خرید</h1>
    {error&&<div className="mb-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}
    {!items.length?<div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500 dark:border-white/10"><ShoppingBag className="mx-auto mb-3" size={30}/>سبد خرید شما خالی است</div>:<div className="grid gap-4 lg:grid-cols-[1fr_320px]"><div className="space-y-3">{items.map(({product,quantity})=><article key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]"><div className="min-w-0"><h2 className="font-bold">{product.name}</h2><p className="mt-1 text-xs text-slate-500">{Number(product.sale_price).toLocaleString("fa-IR")} تومان / واحد</p></div><div className="flex items-center gap-2"><input dir="ltr" inputMode="decimal" value={quantity} onChange={e=>setQuantity(product.id,Number(toEnglishDigits(e.target.value)))} className="w-24 rounded-lg border border-slate-200 bg-transparent px-2 py-2 text-center text-sm dark:border-white/10" autoComplete="off" readOnly onFocus={(event) => { event.currentTarget.readOnly = false; }}/><button onClick={()=>remove(product.id)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" aria-label="حذف"><Trash2 size={17}/></button></div><p className="w-full text-left text-sm font-black text-indigo-600 dark:text-indigo-300">{(Number(product.sale_price)*quantity).toLocaleString("fa-IR")} تومان</p></article>)}</div>
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"><label className="mb-2 block text-xs font-bold">توضیحات سفارش</label><textarea value={note} onChange={e=>setNote(e.target.value)} rows={4} className="w-full rounded-xl border border-slate-200 bg-transparent p-3 text-sm outline-none dark:border-white/10" placeholder="توضیحات تکمیلی..."/><div className="my-5 flex justify-between text-sm"><span>جمع تقریبی</span><strong>{total().toLocaleString("fa-IR")} تومان</strong></div><p className="mb-4 text-[11px] leading-6 text-amber-600">قیمت و موجودی نهایی توسط سرور بررسی می‌شود. ثبت سفارش موجودی را رزرو نمی‌کند.</p><button disabled={busy||!items.length} onClick={()=>void submit()} className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-black text-white disabled:opacity-50">{busy?"در حال ثبت...":"ثبت سفارش"}</button></aside></div>}
  </section>;
}
