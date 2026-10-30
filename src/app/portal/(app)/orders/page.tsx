"use client";
import { useState } from "react";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { portalApi } from "@/lib/portal/portalApi";
import type { PortalOrder, OrderStatus } from "@/types/portal";
import Pagination from "@/components/ui/Pagination";
import { apiMessage } from "@/lib/apiMessage";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "@/components/notifications/toast";

const labels:Record<OrderStatus,string>={pending:"در انتظار بررسی",confirmed:"تأیید شد",rejected:"رد شد",cancelled:"لغو توسط مشتری"};
const tones:Record<OrderStatus,string>={pending:"bg-amber-100 text-amber-700",confirmed:"bg-emerald-100 text-emerald-700",rejected:"bg-rose-100 text-rose-700",cancelled:"bg-gray-100 text-gray-600"};
export default function PortalOrdersPage() {
  const list=usePaginatedList<PortalOrder>((p,s)=>portalApi.orders(p,s),{pageSize:10});
  const [selected,setSelected]=useState<PortalOrder|null>(null); const [busy,setBusy]=useState(false);
  const [confirming,setConfirming]=useState(false); const [cancelError,setCancelError]=useState<string|null>(null);
  const close=()=>{if(busy)return;setSelected(null);setConfirming(false);setCancelError(null);};
  const cancel=async()=>{
    if(!selected||selected.status!=="pending")return;
    setBusy(true);setCancelError(null);
    try{
      await portalApi.cancelOrder(selected.id);
      setSelected({...selected,status:"cancelled",status_display:labels.cancelled});
      setConfirming(false);list.refetch();toast.success("سفارش لغو شد");
    }catch(e){setCancelError(apiMessage(e,"لغو سفارش انجام نشد"));}
    finally{setBusy(false);}
  };
  return <section dir="rtl"><div className="mb-5"><h1 className="text-[15px] font-black">سفارش‌های من</h1><p className="mt-1 text-xs text-gray-500">پیگیری وضعیت سفارش‌های ثبت‌شده</p></div>
    {list.loading?<div className="py-16 text-center text-sm text-gray-500">در حال دریافت سفارش‌ها...</div>:list.error?<div className="py-10 text-center text-sm text-rose-500">دریافت سفارش‌ها انجام نشد <button onClick={list.refetch} className="underline">تلاش مجدد</button></div>:!list.data.length?<div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500 dark:border-white/10">هنوز سفارشی ثبت نکرده‌اید</div>:<div className="space-y-3">{list.data.map(order=><button key={order.id} onClick={()=>setSelected(order)} className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-right dark:border-white/10 dark:bg-white/[0.04]"><div><p className="font-extrabold">سفارش #{order.id}</p><p className="mt-1 text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString("fa-IR")} · {order.items.length} قلم</p></div><div className="text-left"><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${tones[order.status]}`}>{order.status_display||labels[order.status]}</span><p className="mt-2 text-sm font-black">{order.total_price.toLocaleString("fa-IR")} تومان</p></div></button>)}</div>}
    {list.totalPages>1&&<div className="mt-5"><Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage}/></div>}
    {selected&&<div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"><div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 dark:bg-gray-900"><div className="mb-4 flex justify-between"><h2 className="font-black">جزئیات سفارش #{selected.id}</h2><button onClick={close}>✕</button></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${tones[selected.status]}`}>{selected.status_display||labels[selected.status]}</span><div className="my-4 space-y-2">{selected.items.map(item=><div key={item.id} className="flex justify-between gap-3 border-b border-gray-100 py-2 text-sm dark:border-white/10"><span>{item.product_name} × {item.quantity}</span><b>{item.line_total.toLocaleString("fa-IR")} تومان</b></div>)}</div>{selected.note&&<p className="mb-3 rounded-xl bg-gray-50 p-3 text-xs dark:bg-white/5">توضیحات شما: {selected.note}</p>}{selected.staff_note&&<p className="mb-3 rounded-xl bg-indigo-50 p-3 text-xs text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-200">پیام کارشناس: {selected.staff_note}</p>}<p className="mb-4 text-left font-black">{selected.total_price.toLocaleString("fa-IR")} تومان</p>{selected.status==="pending"&&<button disabled={busy} onClick={()=>setConfirming(true)} className="w-full rounded-xl bg-rose-600 py-3 text-sm font-bold text-white disabled:opacity-50">لغو سفارش</button>}<button onClick={close} className="mt-2 w-full rounded-xl bg-gray-100 py-3 text-sm font-bold dark:bg-white/10">بستن</button></div></div>}
    <ConfirmModal open={confirming} danger title="لغو سفارش" message="از لغو این سفارش مطمئن هستید؟" confirmLabel="لغو سفارش" loading={busy} error={cancelError} onConfirm={()=>void cancel()} onClose={()=>{if(!busy){setConfirming(false);setCancelError(null);}}}/>
  </section>;
}
