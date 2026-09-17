"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle, CalendarDays, Check, FileText, Loader2,
    Package, Paperclip, ShoppingBag, Upload, X
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiStockInfo } from "@/types/warehouse";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    taskId: number;
    onSubmit: (data: {
        product_id: number;
        quantity: number;
        note: string;
        file?: File;
        started_at?: string;
        deadline?: string;
        score: number;
        score_reason: string;
    }) => Promise<void>;
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

function toIso(value: string) {
    return value ? new Date(value).toISOString() : undefined;
}

export default function SoldOrderTaskModal({
    isOpen,
    onClose,
    taskId,
    onSubmit,
    submitting = false,
}: Props) {
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

    const selectedProduct = useMemo(
        () => products.find((item) => item.product === productId) ?? null,
        [products, productId]
    );

    useEffect(() => {
        if (!isOpen) return;

        let mounted = true;

        setProductId(null);
        setQuantity("");
        setNote("");
        setFile(undefined);
        setStartedAt("");
        setDeadline("");
        setScore(0);
        setScoreReason("");
        setError("");
        setProducts([]);
        setLoading(true);

        axiosInstance.get("/warehouse/api/v1/process/stock/")
            .then(({ data }) => {
                if (mounted) setProducts(Array.isArray(data) ? data : data?.results ?? []);
            })
            .catch((e) => mounted && setError(parseError(e)))
            .finally(() => mounted && setLoading(false));

        return () => {
            mounted = false;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!selectedProduct) return;
        const value = numberValue(quantity);
        if (value > selectedProduct.current_quantity) {
            setQuantity(String(selectedProduct.current_quantity));
        }
    }, [selectedProduct]);

    if (typeof document === "undefined") return null;

    const qty = numberValue(quantity);
    const quantityError =
        selectedProduct && qty > selectedProduct.current_quantity
            ? `حداکثر ${formatNumber(selectedProduct.current_quantity)} ${selectedProduct.unit_label} قابل درخواست است.`
            : "";

    const valid =
        !!productId &&
        qty > 0 &&
        !!selectedProduct &&
        qty <= selectedProduct.current_quantity &&
        score >= 1 &&
        !!scoreReason.trim() &&
        (!startedAt || !deadline || new Date(deadline).getTime() >= new Date(startedAt).getTime());

    async function submit() {
        if (!valid || !selectedProduct) return;

        setError("");

        try {
            await onSubmit({
                product_id: selectedProduct.product,
                quantity: qty,
                note: note.trim(),
                file,
                started_at: toIso(startedAt),
                deadline: toIso(deadline),
                score,
                score_reason: scoreReason.trim(),
            });
        } catch (e) {
            setError(parseError(e));
        }
    }

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: .97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: .97 }}
                        transition={{ duration: .2 }}
                        dir="rtl"
                        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] border border-white/60 bg-white p-4 shadow-2xl dark:border-white/[.06] dark:bg-[#111827]"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                                    <ShoppingBag size={21} />
                                </div>
                                <div>
                                    <h2 className="text-[15px] font-black text-gray-900 dark:text-white">ثبت فروش و درخواست انبار</h2>
                                    <p className="mt-0.5 text-[10px] text-gray-400">ابتدا درخواست کالا ثبت می‌شود، سپس فروش نهایی خواهد شد</p>
                                </div>
                            </div>
                            <button onClick={onClose} disabled={submitting} className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-white/[.05]">
                                <X size={17} />
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex h-48 items-center justify-center">
                                <Loader2 className="animate-spin text-indigo-500" size={25} />
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 dark:border-white/[.05] dark:bg-white/[.035]">
                                        <div className="mb-2 flex items-center gap-2 text-[10px] font-black text-gray-500">
                                            <Package size={13} className="text-indigo-500" />
                                            کالا از موجودی انبار
                                        </div>

                                        <select
                                            value={productId ?? ""}
                                            onChange={(e) => setProductId(Number(e.target.value) || null)}
                                            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[11px] font-bold outline-none focus:border-indigo-400 dark:border-white/[.08] dark:bg-[#151e31] dark:text-white"
                                        >
                                            <option value="">انتخاب کالا</option>
                                            {products.map((item) => (
                                                <option key={item.product} value={item.product}>
                                                    {item.product_name} — موجودی: {formatNumber(item.current_quantity)} {item.unit_label}
                                                </option>
                                            ))}
                                        </select>

                                        {selectedProduct && (
                                            <div className="mt-2 flex items-center justify-between rounded-xl bg-white px-3 py-2 dark:bg-white/[.04]">
                                                <span className="text-[10px] font-bold text-gray-400">موجودی فعلی</span>
                                                <span className="text-[11px] font-black text-emerald-500">
                                                    {formatNumber(selectedProduct.current_quantity)} {selectedProduct.unit_label}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-[10px] font-extrabold text-gray-400">مقدار درخواستی</label>
                                        <input
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            inputMode="decimal"
                                            placeholder="مثلاً ۲"
                                            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-left text-[12px] font-bold outline-none focus:border-indigo-400 dark:border-white/[.08] dark:bg-[#151e31] dark:text-white"
                                        />
                                        {quantityError && (
                                            <p className="mt-1.5 flex items-center gap-1 text-[9px] font-bold text-red-500">
                                                <AlertCircle size={11} />{quantityError}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-[10px] font-extrabold text-gray-400">یادداشت درخواست</label>
                                        <textarea
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            rows={3}
                                            placeholder="توضیحات مورد نیاز انبار..."
                                            className="w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-[11px] font-medium outline-none focus:border-indigo-400 dark:border-white/[.08] dark:bg-[#151e31] dark:text-white"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <label className="cursor-pointer rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 dark:border-white/[.08] dark:bg-white/[.03]">
                                            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0])} />
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                                                <Paperclip size={13} />{file?.name || "ضمیمه فایل"}
                                            </div>
                                        </label>

                                        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 dark:border-white/[.08] dark:bg-white/[.03]">
                                            <CalendarDays size={13} className="text-gray-400" />
                                            <input
                                                type="datetime-local"
                                                value={startedAt}
                                                onChange={(e) => setStartedAt(e.target.value)}
                                                className="min-w-0 flex-1 bg-transparent text-[9px] font-bold outline-none dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-[10px] font-extrabold text-gray-400">مهلت درخواست</label>
                                        <input
                                            type="datetime-local"
                                            value={deadline}
                                            min={startedAt || undefined}
                                            onChange={(e) => setDeadline(e.target.value)}
                                            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-left text-[10px] font-bold outline-none focus:border-indigo-400 dark:border-white/[.08] dark:bg-[#151e31] dark:text-white"
                                        />
                                    </div>

                                    <div className="rounded-2xl border border-amber-500/10 bg-amber-500/[.035] p-3">
                                        <div className="mb-2 text-[10px] font-black text-gray-500">ارزیابی فروش</div>
                                        <div className="mb-3 flex gap-1.5">
                                            {[1, 2, 3, 4, 5].map((item) => (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    onClick={() => setScore(item)}
                                                    className={`flex h-9 flex-1 items-center justify-center rounded-xl text-[11px] font-black transition ${score === item ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "bg-white text-gray-400 dark:bg-white/[.05]"}`}
                                                >
                                                    {item}
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            value={scoreReason}
                                            onChange={(e) => setScoreReason(e.target.value)}
                                            rows={2}
                                            placeholder="دلیل و نظر شما درباره این فروش..."
                                            className="w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-[10px] font-medium outline-none focus:border-amber-400 dark:border-white/[.08] dark:bg-[#151e31] dark:text-white"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-[10px] font-bold text-red-500">
                                        <AlertCircle size={13} />{error}
                                    </div>
                                )}

                                <div className="mt-4 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={submitting}
                                        className="h-11 flex-1 rounded-xl bg-gray-100 text-[10px] font-black text-gray-500 dark:bg-white/[.05]"
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        type="button"
                                        onClick={submit}
                                        disabled={!valid || submitting}
                                        className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-amber-500 to-orange-500 text-[10px] font-black text-white shadow-lg shadow-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                                        {submitting ? "در حال ثبت..." : "ثبت درخواست و فروش"}
                                    </button>
                                </div>

                                <div className="mt-2 flex items-center justify-center gap-1.5 text-[8.5px] font-bold text-gray-400">
                                    <Upload size={10} />
                                    ابتدا درخواست به انبار ارسال می‌شود و سپس فروش ثبت خواهد شد
                                </div>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}