"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingCart, Package } from "lucide-react";
import { portalApi } from "@/lib/portal/portalApi";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import Pagination from "@/components/ui/Pagination";
import CardSkeletonGrid from "@/components/ui/CardSkeletonGrid";
import { usePortalCartStore } from "@/store/portalCartStore";
import { toEnglishDigits } from "@/lib/digits";
import { UNIT_TYPE_LABELS } from "@/types/warehouse";
import type { PortalProduct } from "@/types/portal";

const PAGE_SIZE=12;
export default function PortalProductsPage() {
  const list=usePaginatedList<PortalProduct>((params,signal)=>portalApi.products(params,signal),{pageSize:PAGE_SIZE,delay:300});
  const add=usePortalCartStore(s=>s.add); const cart=usePortalCartStore(s=>s.items);
  const [categories,setCategories]=useState<{id:number;name:string}[]>([]);
  const [category,setCategory]=useState("");
  const [quantities,setQuantities]=useState<Record<number,string>>({});
  useEffect(()=>{let active=true;portalApi.products({page:1,page_size:100}).then(r=>{if(!active)return;const map=new Map<number,string>();r.results.forEach(p=>{if(p.category!=null)map.set(p.category,p.category_name)});setCategories([...map].map(([id,name])=>({id,name})));}).catch(()=>{});return()=>{active=false}},[]);
  useEffect(()=>{list.setFilters({category:category?Number(category):undefined});},[category]);
  const cartIds=useMemo(()=>new Set(cart.map(i=>i.product.id)),[cart]);
  return <section dir="rtl">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-xl font-black">کالاهای قابل سفارش</h1><p className="mt-1 text-xs text-slate-500">کالاهای دارای موجودی انبار</p></div><div className="relative w-full sm:max-w-xs"><Search className="absolute right-3 top-3 text-slate-400" size={17}/><input value={list.search} onChange={e=>list.setSearch(e.target.value)} placeholder="جستجوی نام کالا..." className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-10 pl-3 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"/></div></div>
    <div className="mb-5 flex flex-wrap gap-2"><button onClick={()=>setCategory("")} className={`rounded-full px-4 py-2 text-xs font-bold ${!category?"bg-indigo-600 text-white":"bg-white text-slate-500 dark:bg-white/5"}`}>همه دسته‌ها</button>{categories.map(c=><button key={c.id} onClick={()=>setCategory(String(c.id))} className={`rounded-full px-4 py-2 text-xs font-bold ${category===String(c.id)?"bg-indigo-600 text-white":"bg-white text-slate-500 dark:bg-white/5"}`}>{c.name}</button>)}</div>
    {list.loading?<CardSkeletonGrid/>:list.error?<div className="rounded-2xl bg-rose-50 p-6 text-center text-sm text-rose-600 dark:bg-rose-500/10">دریافت کالاها انجام نشد <button onClick={list.refetch} className="mr-2 underline">تلاش مجدد</button></div>:list.data.length===0?<div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500 dark:border-white/10"><Package className="mx-auto mb-3" size={30}/>کالایی با این مشخصات پیدا نشد</div>:<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{list.data.map(p=><article key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"><div className="flex items-start justify-between gap-3"><div><h2 className="font-extrabold">{p.name}</h2><p className="mt-1 text-xs text-slate-500">{p.category_name||"بدون دسته"}</p></div><span className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{p.available_quantity.toLocaleString("fa-IR")} {UNIT_TYPE_LABELS[p.unit_type]}</span></div><p className="mt-5 text-lg font-black text-indigo-600 dark:text-indigo-300">{Number(p.sale_price).toLocaleString("fa-IR")} <span className="text-xs">تومان</span></p><div className="mt-4 flex gap-2"><input dir="ltr" inputMode="decimal" value={quantities[p.id]??"1"} onChange={e=>setQuantities(s=>({...s,[p.id]:e.target.value}))} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-white/10"/><button disabled={cartIds.has(p.id)} onClick={()=>{const q=Number(toEnglishDigits(quantities[p.id]??"1"));if(q>0&&q<=p.available_quantity)add(p,q);}} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"><ShoppingCart size={15}/>{cartIds.has(p.id)?"در سبد":"افزودن"}</button></div></article>)}</div>}
    {!list.loading&&!list.error&&list.totalPages>1&&<div className="mt-6"><Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage}/></div>}
    <p className="mt-5 text-[11px] text-slate-400">موجودی هنگام ثبت سفارش بررسی می‌شود و تا زمان تأیید کارمند رزرو نخواهد شد.</p>
  </section>;
}
