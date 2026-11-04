"use client";
import { FormSkeleton } from "@/components/ui/skeletons";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Backdrop } from "@/components/ui/Backdrop";
import { panelMotion } from "@/lib/motion";
import { AlertCircle, Check, ChevronDown, ClipboardList, Package, Search, ShoppingBag, Star, X } from "lucide-react";
import { salesApi } from "@/lib/api/sales";
import type { Product } from "@/types/sales";
import { BusyContent } from "@/components/ui/Button";

export interface SaleSubmitData {
    product: number;
    quantity_kg: string;
    unit_price: string;
    sale_date: string;
    description: string;
    score: number;
    score_reason: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: SaleSubmitData) => Promise<void>;
    submitting?: boolean;
}

const faDigits = (v: string) => v.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
const normalizeNumber = (v: string) => faDigits(v).replace(/[,٬\s]/g, "").replace("٫", ".");
const GRADIENTS = ["from-blue-500 to-indigo-500", "from-violet-500 to-fuchsia-500", "from-emerald-500 to-teal-500", "from-amber-500 to-orange-500", "from-rose-500 to-pink-500", "from-cyan-500 to-sky-500"];
const gradientOf = (seed: number) => GRADIENTS[Math.abs(seed) % GRADIENTS.length];
const initialOf = (text: string) => (text || "").trim().charAt(0) || "؟";

function todayIso() {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function FloatingInput({ label, id, value, onChange, inputMode = "text" }: { label: string; id: string; value: string; onChange: (v: string) => void; inputMode?: "text" | "decimal" | "numeric" }) {
    return (
        <div className="relative">
            <input id={id} type="text" placeholder=" " inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} className="peer h-[52px] w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 pt-4 text-[12.5px] font-bold text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:focus:border-blue-500/50" />
            <label htmlFor={id} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-gray-400 transition-all duration-200 peer-focus:top-[15px] peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-[15px] peer-[:not(:placeholder-shown)]:text-[10px]">{label}</label>
        </div>
    );
}

function FloatingTextarea({ label, id, value, onChange, rows = 3 }: { label: string; id: string; value: string; onChange: (v: string) => void; rows?: number }) {
    return (
        <div className="relative">
            <textarea id={id} placeholder=" " rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className="peer w-full resize-none rounded-2xl border border-gray-100 bg-gray-50 px-4 pb-3 pt-5 text-[12px] font-semibold text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:focus:border-blue-500/50" />
            <label htmlFor={id} className="pointer-events-none absolute right-4 top-4 text-[12px] font-semibold text-gray-400 transition-all duration-200 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px]">{label}</label>
        </div>
    );
}

interface Option { id: number; label: string; sub?: string }

function NiceSelect({ label, options, value, onChange, placeholder, disabled, emptyText }: { label: string; options: Option[]; value: number | null; onChange: (id: number) => void; placeholder: string; disabled?: boolean; emptyText: string }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    const selectedOption = options.find((o) => o.id === value) ?? null;

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => { if (!open) setQuery(""); }, [open]);
    useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
    }, [options, query]);

    return (
        <div ref={ref} className="relative">
            <label className="mb-2 block text-[11.5px] font-bold text-gray-400">{label}</label>
            <button type="button" disabled={disabled} onClick={() => setOpen((v) => !v)} className={`flex h-[52px] w-full items-center gap-2.5 rounded-2xl border px-3 text-right transition-all duration-200 ${open ? "border-blue-500 bg-blue-50/50 dark:border-blue-500/50 dark:bg-blue-500/[0.06]" : "border-gray-100 bg-gray-50 hover:border-gray-200 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12]"}`}>
                {selectedOption ? (
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(selectedOption.id)}`}>{initialOf(selectedOption.label)}</span>
                ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.06]"><Package size={13} className="text-gray-400" /></span>
                )}
                <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[12.5px] font-bold ${selectedOption ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>{selectedOption?.label || placeholder}</span>
                    {selectedOption?.sub && <span className="mt-0.5 block truncate text-[10.5px] text-gray-400">{selectedOption.sub}</span>}
                </span>
                <m.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={14} className="shrink-0 text-gray-400" /></m.span>
            </button>
            <AnimatePresence>
                {open && (
                    <m.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ type: "spring", damping: 24, stiffness: 340 }} className="absolute z-50 mt-2 w-full origin-top overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-xl shadow-black/5 dark:border-white/[0.08] dark:bg-[#111827] dark:shadow-black/40">
                        {options.length > 5 && (
                            <div className="border-b border-gray-100 px-3 py-2.5 dark:border-white/[0.06]">
                                <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.04]">
                                    <Search size={13} className="shrink-0 text-gray-400" />
                                    <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجو..." className="w-full bg-transparent text-[12px] font-semibold text-gray-900 outline-none placeholder:text-gray-400 dark:text-white" />
                                </div>
                            </div>
                        )}
                        <div className="max-h-56 overflow-y-auto p-1.5">
                            {visible.length === 0 ? (
                                <p className="py-6 text-center text-[12px] text-gray-400">{emptyText}</p>
                            ) : (
                                visible.map((o, i) => {
                                    const active = o.id === value;
                                    return (
                                        <m.button key={o.id} type="button" initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} onClick={() => { onChange(o.id); setOpen(false); }} className={`flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-right transition-colors ${active ? "bg-blue-50 dark:bg-blue-500/10" : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"}`}>
                                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(o.id)}`}>{initialOf(o.label)}</span>
                                            <span className="min-w-0 flex-1">
                                                <span className={`block truncate text-[12.5px] font-bold ${active ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>{o.label}</span>
                                                {o.sub && <span className="mt-0.5 block truncate text-[10.5px] text-gray-400">{o.sub}</span>}
                                            </span>
                                            {active && <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600"><Check size={11} className="text-white" strokeWidth={3} /></span>}
                                        </m.button>
                                    );
                                })
                            )}
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function SaleRegistrationModal({ isOpen, onClose, onSubmit, submitting = false }: Props) {
    const reduced = useReducedMotion();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [productId, setProductId] = useState<number | null>(null);
    const [quantity, setQuantity] = useState("");
    const [unitPrice, setUnitPrice] = useState("");
    const [saleDate, setSaleDate] = useState(todayIso());
    const [description, setDescription] = useState("");
    const [score, setScore] = useState(0);
    const [scoreReason, setScoreReason] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        setProductId(null); setQuantity(""); setUnitPrice(""); setSaleDate(todayIso());
        setDescription(""); setScore(0); setScoreReason(""); setError(""); setLoading(true);
        salesApi.products.active()
            .then((page) => { if (!cancelled) setProducts(page.results); })
            .catch(() => { if (!cancelled) setError("دریافت فهرست کالاها با خطا مواجه شد."); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [isOpen]);

    const productOptions = useMemo<Option[]>(() => products.map((p) => ({ id: p.id, label: p.name })), [products]);

    const qtyNumber = Number(normalizeNumber(quantity));
    const priceNumber = Number(normalizeNumber(unitPrice));
    const qtyValid = normalizeNumber(quantity) !== "" && Number.isFinite(qtyNumber) && qtyNumber > 0;
    const priceValid = normalizeNumber(unitPrice) !== "" && Number.isFinite(priceNumber) && priceNumber >= 0;
    const valid = productId != null && qtyValid && priceValid && !!saleDate && score >= 1 && !!scoreReason.trim();

    async function submit() {
        if (!valid || productId == null) return;
        setError("");
        try {
            await onSubmit({
                product: productId,
                quantity_kg: normalizeNumber(quantity),
                unit_price: normalizeNumber(unitPrice),
                sale_date: saleDate,
                description: description.trim(),
                score,
                score_reason: scoreReason.trim(),
            });
        } catch {
            // the parent surfaces the error message
        }
    }

    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
                    <Backdrop onClick={onClose} />
                    <m.div
                        {...panelMotion(false, !!reduced)}
                        dir="rtl"
                        className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.22)] dark:border-white/[0.06] dark:bg-[#111827]"
                    >
                        <div className="flex shrink-0 items-center justify-between px-8 pb-6 pt-8">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10"><ShoppingBag size={15} className="text-blue-500" /></div>
                                <div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">ثبت فروش</h3>
                                    <p className="mt-0.5 text-[11px] text-gray-400">اطلاعات فروش ثبت و وظیفه به «فروخته‌شده» تغییر می‌کند</p>
                                </div>
                            </div>
                            <button type="button" onClick={onClose} disabled={submitting} className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"><X size={15} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-8 pb-2">
                            {loading ? (
                                <FormSkeleton fields={4} />
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                                        <div className="mb-3 flex items-center gap-2 text-[11.5px] font-bold text-gray-500"><Package size={13} className="text-blue-500" /> مشخصات فروش</div>
                                        <div className="flex flex-col gap-3">
                                            <NiceSelect label="کالا" placeholder="انتخاب کالا" emptyText="کالای فعالی یافت نشد" options={productOptions} value={productId} onChange={(id) => { setProductId(id); setError(""); }} />
                                            <FloatingInput id="sale_quantity_kg" label="مقدار (کیلوگرم)" value={quantity} onChange={(v) => { setQuantity(v); setError(""); }} inputMode="decimal" />
                                            {quantity !== "" && !qtyValid && <p className="text-[10.5px] font-semibold text-red-500">مقدار باید بزرگ‌تر از صفر باشد.</p>}
                                            <FloatingInput id="sale_unit_price" label="قیمت واحد (هر کیلوگرم)" value={unitPrice} onChange={(v) => { setUnitPrice(v); setError(""); }} inputMode="decimal" />
                                            {unitPrice !== "" && !priceValid && <p className="text-[10.5px] font-semibold text-red-500">قیمت واحد معتبر نیست.</p>}
                                            <div className="relative">
                                                <label htmlFor="sale_date" className="mb-1 block text-[10.5px] font-bold text-gray-400">تاریخ فروش (میلادی)</label>
                                                <input id="sale_date" type="date" value={saleDate} onChange={(e) => { setSaleDate(e.target.value); setError(""); }} className="h-[46px] w-full rounded-2xl border border-gray-100 bg-white px-4 text-[12px] font-semibold text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-blue-500/50" />
                                            </div>
                                            <FloatingTextarea id="sale_description" label="توضیحات (اختیاری)" value={description} onChange={setDescription} rows={2} />
                                        </div>
                                        <p className="mt-3 text-[10px] font-semibold text-gray-400">مبلغ کل توسط سرور محاسبه و ثبت می‌شود.</p>
                                    </div>

                                    <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50/60 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                                        <div className="mb-3 flex items-center gap-2 text-[11.5px] font-bold text-gray-500"><ClipboardList size={13} className="text-blue-500" /> ارزیابی فروش</div>
                                        <div className="mb-3 flex gap-1.5">
                                            {[1, 2, 3, 4, 5].map((item) => (
                                                <m.button key={item} type="button" whileTap={{ scale: 0.94 }} onClick={() => { setScore(item); setError(""); }} className={`flex h-10 flex-1 items-center justify-center rounded-full transition-all ${score >= item ? "bg-yellow-50 text-yellow-500 dark:bg-yellow-500/10" : "bg-white text-gray-300 hover:bg-gray-100 dark:bg-white/[0.05] dark:text-gray-600 dark:hover:bg-white/[0.08]"}`}>
                                                    <Star size={18} fill={score >= item ? "currentColor" : "none"} strokeWidth={1.5} />
                                                </m.button>
                                            ))}
                                        </div>
                                        <textarea value={scoreReason} onChange={(e) => { setScoreReason(e.target.value); setError(""); }} rows={2} placeholder="دلیل و نظر شما درباره این فروش..." className="w-full resize-none rounded-2xl border border-gray-100 bg-white p-3 text-[11px] font-semibold text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-blue-500/50" />
                                    </div>

                                    <AnimatePresence>
                                        {error && (
                                            <m.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10">
                                                <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                                                <p className="flex-1 text-[11.5px] font-semibold leading-5 text-red-500 dark:text-red-400">{error}</p>
                                                <button type="button" onClick={() => setError("")} className="shrink-0 text-red-400 transition-colors hover:text-red-600"><X size={13} /></button>
                                            </m.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        <div className="flex shrink-0 items-center gap-2 px-8 pb-8 pt-5">
                            <button type="button" onClick={onClose} disabled={submitting} className="flex h-11 flex-1 items-center justify-center rounded-full border border-gray-100 bg-gray-50 text-[13px] font-bold text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-40 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white/50 dark:hover:text-white">انصراف</button>
                            <m.button type="button" whileTap={{ scale: 0.97 }} onClick={submit} disabled={!valid || submitting || loading} className="relative flex h-11 flex-[2] items-center justify-center gap-2 rounded-full bg-blue-600 text-[13px] font-bold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40">
                                <BusyContent busy={submitting}>
                                    <><Check size={14} strokeWidth={3} /> ثبت فروش</>
                                </BusyContent>
                            </m.button>
                        </div>
                    </m.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
