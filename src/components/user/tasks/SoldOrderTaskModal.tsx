"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CalendarDays, Check, ChevronDown, ClipboardList, Loader2, Package, Paperclip, Pencil, Search, ShoppingBag, Star, Upload, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiStockInfo } from "@/types/warehouse";
import TimeRangeModal from "./TimeRangeModal";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    taskId: number;
    onSubmit: (data: { product_id: number; quantity: number; note: string; file?: File; started_at?: string; deadline?: string; score: number; score_reason: string }) => Promise<void>;
    submitting?: boolean;
}

const faDigits = (v: string) => v.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
const numberValue = (v: string) => Number(faDigits(v).replace(/,/g, ""));
const formatNumber = (v: number) => new Intl.NumberFormat("fa-IR").format(v);

function parseError(error: any) {
    const data = error?.response?.data;
    if (!data) return "دریافت موجودی انبار با خطا مواجه شد.";
    if (typeof data === "string") return data;
    const first = Object.values(data)[0];
    return Array.isArray(first) ? String(first[0]) : String(first ?? "خطا در دریافت اطلاعات");
}

const toIso = (value: string) => (value ? new Date(value).toISOString() : undefined);
const GRADIENTS = ["from-blue-500 to-indigo-500", "from-violet-500 to-fuchsia-500", "from-emerald-500 to-teal-500", "from-amber-500 to-orange-500", "from-rose-500 to-pink-500", "from-cyan-500 to-sky-500"];
const gradientOf = (seed: number) => GRADIENTS[Math.abs(seed) % GRADIENTS.length];
const initialOf = (text: string) => (text || "").trim().charAt(0) || "؟";

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
            <button type="button" disabled={disabled} onClick={() => setOpen((v) => !v)} className={`flex h-[52px] w-full items-center gap-2.5 rounded-2xl border px-3 text-right transition-all duration-200 ${open ? "border-blue-500 bg-blue-50/50 dark:border-blue-500/50 dark:bg-blue-500/[0.06]" : "border-gray-100 bg-gray-50 hover:border-gray-200 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12]"} ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}>
                {selectedOption ? (
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(selectedOption.id)}`}>{initialOf(selectedOption.label)}</span>
                ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.06]"><Package size={13} className="text-gray-400" /></span>
                )}
                <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[12.5px] font-bold ${selectedOption ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>{selectedOption?.label || placeholder}</span>
                    {selectedOption?.sub && <span className="mt-0.5 block truncate text-[10.5px] text-gray-400">{selectedOption.sub}</span>}
                </span>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={14} className="shrink-0 text-gray-400" /></motion.span>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ type: "spring", damping: 24, stiffness: 340 }} className="absolute z-50 mt-2 w-full origin-top overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-xl shadow-black/5 dark:border-white/[0.08] dark:bg-[#0f172a] dark:shadow-black/40">
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
                                        <motion.button key={o.id} type="button" initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} onClick={() => { onChange(o.id); setOpen(false); }} className={`flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-right transition-colors ${active ? "bg-blue-50 dark:bg-blue-500/10" : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"}`}>
                                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(o.id)}`}>{initialOf(o.label)}</span>
                                            <span className="min-w-0 flex-1">
                                                <span className={`block truncate text-[12.5px] font-bold ${active ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>{o.label}</span>
                                                {o.sub && <span className="mt-0.5 block truncate text-[10.5px] text-gray-400">{o.sub}</span>}
                                            </span>
                                            {active && <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600"><Check size={11} className="text-white" strokeWidth={3} /></span>}
                                        </motion.button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const JALALI_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const toPersianDigits = (v: string | number) => String(v).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
const pad2 = (n: number) => String(n).padStart(2, "0");

function toJalali(gy: number, gm: number, gd: number): [number, number, number] {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = gy <= 1600 ? 0 : 979;
    gy -= gy <= 1600 ? 621 : 1600;
    const gy2 = gm > 2 ? gy + 1 : gy;
    let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
    const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
    return [jy, jm, jd];
}

function formatJalaliDateTime(iso: string) {
    const d = new Date(iso);
    const [jy, jm, jd] = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} — ${toPersianDigits(pad2(d.getHours()))}:${toPersianDigits(pad2(d.getMinutes()))}`;
}

export default function SoldOrderTaskModal({ isOpen, onClose, taskId, onSubmit, submitting = false }: Props) {
    const [products, setProducts] = useState<ApiStockInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [productId, setProductId] = useState<number | null>(null);
    const [quantity, setQuantity] = useState("");
    const [note, setNote] = useState("");
    const [file, setFile] = useState<File | undefined>();
    const [startedAt, setStartedAt] = useState("");
    const [deadline, setDeadline] = useState("");
    const [score, setScore] = useState(0);
    const [scoreReason, setScoreReason] = useState("");
    const [timeModalOpen, setTimeModalOpen] = useState(false);

    const selectedProduct = useMemo(() => products.find((item) => item.product === productId) ?? null, [products, productId]);

    useEffect(() => {
        if (!isOpen) return;
        let mounted = true;
        setProductId(null); setQuantity(""); setNote(""); setFile(undefined); setStartedAt(""); setDeadline(""); setScore(0); setScoreReason(""); setError(""); setProducts([]); setLoading(true);
        axiosInstance.get("/warehouse/api/v1/process/stock/").then(({ data }) => { if (mounted) setProducts(Array.isArray(data) ? data : data?.results ?? []); }).catch((e) => mounted && setError(parseError(e))).finally(() => mounted && setLoading(false));
        return () => { mounted = false; };
    }, [isOpen]);

    useEffect(() => {
        if (!selectedProduct) return;
        const value = numberValue(quantity);
        if (value > selectedProduct.current_quantity) setQuantity(String(selectedProduct.current_quantity));
    }, [selectedProduct]);

    if (typeof document === "undefined") return null;

    const qty = numberValue(quantity);
    const quantityError = selectedProduct && qty > selectedProduct.current_quantity ? `حداکثر ${formatNumber(selectedProduct.current_quantity)} ${selectedProduct.unit_label} قابل درخواست است.` : "";
    const valid = !!productId && qty > 0 && !!selectedProduct && qty <= selectedProduct.current_quantity && score >= 1 && !!scoreReason.trim() && (!startedAt || !deadline || new Date(deadline).getTime() >= new Date(startedAt).getTime());

    async function submit() {
        if (!valid || !selectedProduct) return;
        setError("");
        try {
            await onSubmit({ product_id: selectedProduct.product, quantity: qty, note: note.trim(), file, started_at: toIso(startedAt), deadline: toIso(deadline), score, score_reason: scoreReason.trim() });
        } catch (e) { setError(parseError(e)); }
    }

    const productOptions: Option[] = useMemo(() => products.map((item) => ({ id: item.product, label: item.product_name, sub: `موجودی: ${formatNumber(item.current_quantity)} ${item.unit_label}` })), [products]);
    const hasTime = !!startedAt || !!deadline;

    return createPortal(
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }} onClick={onClose}>
                        <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} onClick={(e) => e.stopPropagation()} dir="rtl" className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.22)] dark:border-white/[0.06] dark:bg-[#0f172a]">
                            <div className="flex shrink-0 items-center justify-between px-8 pb-6 pt-8">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10"><ShoppingBag size={15} className="text-blue-500" /></div>
                                    <div>
                                        <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">ثبت فروش و درخواست انبار</h3>
                                        <p className="mt-0.5 text-[11px] text-gray-400">ابتدا درخواست کالا ثبت می‌شود، سپس فروش نهایی خواهد شد</p>
                                    </div>
                                </div>
                                <button type="button" onClick={onClose} disabled={submitting} className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"><X size={15} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-8 pb-2">
                                {loading ? (
                                    <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={25} /></div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        <NiceSelect label="کالا از موجودی انبار" placeholder="انتخاب کالا" emptyText="کالایی یافت نشد" options={productOptions} value={productId} onChange={(id) => { setProductId(id); setError(""); }} />
                                        <AnimatePresence>
                                            {selectedProduct && (
                                                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-2.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
                                                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400"><Package size={12} /> موجودی فعلی</span>
                                                    <span className="text-[12px] font-black text-blue-500">{formatNumber(selectedProduct.current_quantity)} {selectedProduct.unit_label}</span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        <div>
                                            <FloatingInput id="sold_quantity" label="مقدار درخواستی" value={quantity} onChange={(v) => { setQuantity(v); setError(""); }} inputMode="decimal" />
                                            <AnimatePresence>
                                                {quantityError && (
                                                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-1.5 flex items-center gap-1 pr-2 text-[10px] font-bold text-red-500"><AlertCircle size={11} /> {quantityError}</motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <FloatingTextarea id="sold_note" label="یادداشت درخواست" value={note} onChange={(v) => setNote(v)} rows={3} />
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="mb-2 block text-[11.5px] font-bold text-gray-400">ضمیمه (اختیاری)</label>
                                                <label className="flex h-[52px] cursor-pointer items-center gap-2.5 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-3.5 transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-white/[0.1] dark:bg-white/[0.02] dark:hover:border-blue-500/40 dark:hover:bg-blue-500/[0.05]">
                                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm dark:bg-white/[0.06]"><Upload size={14} /></span>
                                                    <span className="min-w-0 flex-1 truncate text-[11.5px] font-bold text-gray-500 dark:text-gray-400">{file?.name || "افزودن فایل"}</span>
                                                    <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0])} />
                                                </label>
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-[11.5px] font-bold text-gray-400">بازه زمانی</label>
                                                <button type="button" onClick={() => setTimeModalOpen(true)} className={`flex h-[52px] w-full items-center gap-2.5 rounded-2xl border px-3.5 text-right transition-all duration-200 ${hasTime ? "border-blue-500 bg-blue-50/50 dark:border-blue-500/50 dark:bg-blue-500/[0.06]" : "border-gray-100 bg-gray-50 hover:border-gray-200 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12]"}`}>
                                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${hasTime ? "bg-blue-500 text-white" : "bg-white text-gray-400 shadow-sm dark:bg-white/[0.06]"}`}><CalendarDays size={14} /></span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className={`block truncate text-[11.5px] font-bold ${hasTime ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}>{hasTime ? "بازه تعیین شد" : "تعیین بازه زمانی"}</span>
                                                        {hasTime && <span className="mt-0.5 block truncate text-[10px] text-gray-400">برای ویرایش کلیک کنید</span>}
                                                    </span>
                                                    {hasTime && <Pencil size={12} className="shrink-0 text-blue-400" />}
                                                </button>
                                            </div>
                                        </div>
                                        <AnimatePresence>
                                            {hasTime && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-2 gap-2 overflow-hidden">
                                                    {startedAt && (
                                                        <div className="rounded-2xl border border-blue-500/20 bg-blue-50/60 px-3 py-2 dark:border-blue-500/20 dark:bg-blue-500/[0.06]">
                                                            <div className="mb-0.5 text-[10px] font-bold text-blue-400">شروع</div>
                                                            <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">{formatJalaliDateTime(startedAt)}</div>
                                                        </div>
                                                    )}
                                                    {deadline && (
                                                        <div className="rounded-2xl border border-blue-500/20 bg-blue-50/60 px-3 py-2 dark:border-blue-500/20 dark:bg-blue-500/[0.06]">
                                                            <div className="mb-0.5 text-[10px] font-bold text-blue-400">مهلت انجام</div>
                                                            <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">{formatJalaliDateTime(deadline)}</div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50/60 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                                            <div className="mb-3 flex items-center gap-2 text-[11.5px] font-bold text-gray-500"><ClipboardList size={13} className="text-blue-500" /> ارزیابی فروش</div>
                                            <div className="mb-3 flex gap-1.5">
                                                {[1, 2, 3, 4, 5].map((item) => (
                                                    <motion.button key={item} type="button" whileTap={{ scale: 0.94 }} onClick={() => { setScore(item); setError(""); }} className={`flex h-10 flex-1 items-center justify-center rounded-full transition-all ${score >= item ? "bg-yellow-50 text-yellow-500 dark:bg-yellow-500/10" : "bg-white text-gray-300 hover:bg-gray-100 dark:bg-white/[0.05] dark:text-gray-600 dark:hover:bg-white/[0.08]"}`}>
                                                        <Star size={18} fill={score >= item ? "currentColor" : "none"} strokeWidth={1.5} />
                                                    </motion.button>
                                                ))}
                                            </div>
                                            <textarea value={scoreReason} onChange={(e) => { setScoreReason(e.target.value); setError(""); }} rows={2} placeholder="دلیل و نظر شما درباره این فروش..." className="w-full resize-none rounded-2xl border border-gray-100 bg-white p-3 text-[11px] font-semibold text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-blue-500/50" />
                                        </div>
                                        <AnimatePresence>
                                            {error && (
                                                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10">
                                                    <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                                                    <p className="flex-1 text-[11.5px] font-semibold leading-5 text-red-500 dark:text-red-400">{error}</p>
                                                    <button type="button" onClick={() => setError("")} className="shrink-0 text-red-400 transition-colors hover:text-red-600"><X size={13} /></button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                            <div className="flex shrink-0 flex-col gap-2 px-8 pb-8 pt-5">
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={onClose} disabled={submitting} className="flex h-11 flex-1 items-center justify-center rounded-full border border-gray-100 bg-gray-50 text-[13px] font-bold text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-40 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white/50 dark:hover:text-white/80">انصراف</button>
                                    <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={submit} disabled={!valid || submitting} className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-full bg-blue-600 text-[13px] font-bold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40">
                                        {submitting ? <Loader2 size={15} className="animate-spin" /> : <><Check size={14} strokeWidth={3} /> ثبت درخواست و فروش</>}
                                    </motion.button>
                                </div>
                                <div className="flex items-center justify-center gap-1.5 text-[9.5px] font-bold text-gray-400"><Paperclip size={10} /> ابتدا درخواست به انبار ارسال می‌شود و سپس فروش ثبت خواهد شد</div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <TimeRangeModal open={timeModalOpen} initialStartedAt={startedAt || null} initialDeadline={deadline || null} onClose={() => setTimeModalOpen(false)} onSubmit={async (s, d) => { setStartedAt(s); setDeadline(d); setTimeModalOpen(false); }} />
        </>,
        document.body
    );
}