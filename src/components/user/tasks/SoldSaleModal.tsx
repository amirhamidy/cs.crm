"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ShoppingBag, Star } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FloatingInput, FloatingTextarea } from "@/components/ui/FloatingField";
import { NiceSelect } from "@/components/ui/NiceSelect";
import JalaliDateField from "@/components/crm/shared/JalaliDateField";
import { productsApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import {
    cleanDecimal,
    formatMoney,
    formatWeight,
    isPositiveNumber,
    todayIso,
    toNumber,
} from "@/lib/crm/format";
import type { FeedProduct } from "@/types/crm";

export interface SoldSaleData {
    product: number;
    quantity_kg: string;
    sell_price: string;
    sale_date: string;
    description: string;
    score: number;
    score_reason: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    customerName?: string | null;
    submitting?: boolean;
    onSubmit: (data: SoldSaleData) => Promise<void>;
}

/** ثبت فروش (کالا، مقدار، قیمت) همراه با امتیاز مشتری، هنگام «فروخته شد» */
export default function SoldSaleModal({
    isOpen,
    onClose,
    customerName,
    submitting = false,
    onSubmit,
}: Props) {
    const [products, setProducts] = useState<FeedProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [productId, setProductId] = useState<number | null>(null);
    const [quantity, setQuantity] = useState("");
    const [price, setPrice] = useState("");
    const [saleDate, setSaleDate] = useState(todayIso());
    const [description, setDescription] = useState("");
    const [score, setScore] = useState(0);
    const [scoreReason, setScoreReason] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        let alive = true;
        setProductId(null);
        setQuantity("");
        setPrice("");
        setSaleDate(todayIso());
        setDescription("");
        setScore(0);
        setScoreReason("");
        setError("");
        setLoading(true);
        productsApi
            .active()
            .then((list) => alive && setProducts(list))
            .catch((e) => alive && setError(apiMessage(e, "دریافت لیست کالاها ناموفق بود")))
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, [isOpen]);

    const options = useMemo(
        () => products.map((p) => ({ id: p.id, label: p.name })),
        [products],
    );

    const total = toNumber(cleanDecimal(quantity)) * toNumber(cleanDecimal(price));
    const valid =
        productId != null &&
        isPositiveNumber(quantity) &&
        isPositiveNumber(price) &&
        !!saleDate &&
        score >= 1 &&
        !!scoreReason.trim();

    async function submit() {
        if (!valid || productId == null) return;
        setError("");
        try {
            await onSubmit({
                product: productId,
                quantity_kg: cleanDecimal(quantity),
                sell_price: cleanDecimal(price),
                sale_date: saleDate,
                description: description.trim(),
                score,
                score_reason: scoreReason.trim(),
            });
        } catch (e) {
            setError(apiMessage(e, "ثبت فروش ناموفق بود"));
        }
    }

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            busy={submitting}
            title="ثبت فروش"
            subtitle={customerName ? `مشتری: ${customerName}` : "مشخصات فروش را وارد کنید"}
            icon={<ShoppingBag size={18} />}
            footer={
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={onClose} disabled={submitting} className="flex-1">
                        انصراف
                    </Button>
                    <Button
                        onClick={submit}
                        disabled={!valid}
                        loading={submitting}
                        className="flex-[2]"
                    >
                        ثبت فروش
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col gap-4 px-1 pb-1">
                {!loading && products.length === 0 && !error && (
                    <p className="rounded-2xl bg-amber-50 px-3.5 py-3 text-[12px] font-semibold leading-6 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                        هنوز کالایی تعریف نشده است. مدیر سیستم باید از بخش «فروش ← کالاها» کالاها را اضافه کند.
                    </p>
                )}

                <NiceSelect
                    label="کالا"
                    placeholder={loading ? "در حال دریافت..." : "انتخاب کالا"}
                    emptyText="کالای فعالی یافت نشد"
                    options={options}
                    value={productId}
                    disabled={loading}
                    onChange={(id) => {
                        setProductId(id);
                        setError("");
                    }}
                />

                <div className="grid grid-cols-2 gap-3">
                    <FloatingInput
                        id="sale_quantity"
                        label="مقدار (کیلوگرم)"
                        inputMode="decimal"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                    />
                    <FloatingInput
                        id="sale_price"
                        label="قیمت هر کیلوگرم"
                        inputMode="decimal"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                </div>

                {total > 0 && (
                    <div className="flex items-center justify-between rounded-2xl bg-brand-soft px-4 py-3">
                        <span className="text-[12px] font-bold text-brand">
                            {formatWeight(cleanDecimal(quantity))}
                        </span>
                        <span className="text-[13px] font-black text-brand">
                            مبلغ کل: {formatMoney(total)}
                        </span>
                    </div>
                )}

                <JalaliDateField label="تاریخ فروش" value={saleDate} onChange={setSaleDate} />

                <FloatingTextarea
                    id="sale_description"
                    label="توضیحات (اختیاری)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <div className="rounded-3xl border border-gray-100 bg-gray-50/60 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                    <div className="mb-3 text-[12px] font-bold text-gray-500 dark:text-gray-400">
                        امتیاز شما به این مشتری
                    </div>
                    <div className="mb-3 flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                            <button
                                key={n}
                                type="button"
                                aria-label={`امتیاز ${n}`}
                                onClick={() => {
                                    setScore(n);
                                    setError("");
                                }}
                                className={`flex h-10 flex-1 items-center justify-center rounded-full transition-all ${
                                    score >= n
                                        ? "bg-yellow-50 text-yellow-500 dark:bg-yellow-500/10"
                                        : "bg-white text-gray-300 dark:bg-white/[0.04] dark:text-white/20"
                                }`}
                            >
                                <Star size={18} fill={score >= n ? "currentColor" : "none"} strokeWidth={1.5} />
                            </button>
                        ))}
                    </div>
                    <textarea
                        value={scoreReason}
                        onChange={(e) => {
                            setScoreReason(e.target.value);
                            setError("");
                        }}
                        rows={2}
                        placeholder="دلیل و نظر شما درباره این مشتری/فروش..."
                        className="w-full resize-none rounded-2xl border border-gray-100 bg-white p-3 text-[12px] font-semibold text-gray-900 outline-none focus:border-brand dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-white"
                    />
                </div>

                {error && (
                    <div role="alert" className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10">
                        <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                        <p className="flex-1 text-[12px] font-semibold leading-5 text-red-500 dark:text-red-400">
                            {error}
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
}
