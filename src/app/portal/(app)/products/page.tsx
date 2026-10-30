"use client";

import { useEffect, useMemo, useState } from "react";
import { ShoppingCart, Package, AlertCircle, Check } from "lucide-react";
import { portalApi } from "@/lib/portal/portalApi";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import Pagination from "@/components/ui/Pagination";
import CardSkeletonGrid from "@/components/ui/CardSkeletonGrid";
import { FloatingInput } from "@/components/ui/FloatingField";
import { toast } from "@/components/notifications/toast";
import { usePortalCartStore } from "@/store/portalCartStore";
import { toEnglishDigits } from "@/lib/digits";
import { UNIT_TYPE_LABELS } from "@/types/warehouse";
import type { PortalProduct } from "@/types/portal";

const PAGE_SIZE = 12;

interface CategoryOption {
    id: number;
    name: string;
}

const fmt = (n: number) => n.toLocaleString("fa-IR");

// Returns a Persian error message or the parsed quantity.
function parseQuantity(
    raw: string,
    available: number,
): { value: number; error: null } | { value: null; error: string } {
    const text = toEnglishDigits(raw).trim().replace("٫", ".").replace(",", ".");
    if (!text) return { value: null, error: "تعداد را وارد کنید" };
    if (!/^\d+(\.\d+)?$/.test(text)) {
        return { value: null, error: "تعداد نامعتبر است" };
    }
    const value = Number(text);
    if (!Number.isFinite(value) || value <= 0) {
        return { value: null, error: "تعداد باید بیشتر از صفر باشد" };
    }
    if (value > available) {
        return {
            value: null,
            error: `حداکثر موجودی ${fmt(available)} است`,
        };
    }
    return { value, error: null };
}

const chipClass = (active: boolean) =>
    `h-9 rounded-xl px-3.5 text-[11.5px] font-bold transition-colors ${
        active
            ? "bg-indigo-600 text-white"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/10"
    }`;

export default function PortalProductsPage() {
    const list = usePaginatedList<PortalProduct>(
        (params, signal) => portalApi.products(params, signal),
        { pageSize: PAGE_SIZE, delay: 300 },
    );
    const add = usePortalCartStore((s) => s.add);
    const cart = usePortalCartStore((s) => s.items);

    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [category, setCategory] = useState("");
    const [quantities, setQuantities] = useState<Record<number, string>>({});
    const [errors, setErrors] = useState<Record<number, string>>({});

    // Build the category chips from the first products page.
    useEffect(() => {
        let active = true;
        portalApi
            .products({ page: 1, page_size: 100 })
            .then((r) => {
                if (!active) return;
                const map = new Map<number, string>();
                r.results.forEach((p) => {
                    if (p.category != null) map.set(p.category, p.category_name);
                });
                setCategories(
                    [...map].map(([id, name]) => ({ id, name })),
                );
            })
            .catch(() => {});
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        list.setFilters({ category: category ? Number(category) : undefined });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category]);

    const cartIds = useMemo(
        () => new Set(cart.map((i) => i.product.id)),
        [cart],
    );

    const setQuantity = (id: number, value: string) => {
        setQuantities((s) => ({ ...s, [id]: value }));
        setErrors((s) => {
            if (!s[id]) return s;
            const next = { ...s };
            delete next[id];
            return next;
        });
    };

    const handleAdd = (p: PortalProduct) => {
        const result = parseQuantity(quantities[p.id] ?? "1", p.available_quantity);
        if (result.error !== null) {
            setErrors((s) => ({ ...s, [p.id]: result.error }));
            toast.error(result.error);
            return;
        }
        add(p, result.value);
        toast.success("به سبد خرید اضافه شد");
    };

    return (
        <section dir="rtl" className="flex flex-col gap-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                        کالاهای قابل سفارش
                    </h1>
                    <p className="mt-1 text-[11.5px] text-gray-500">
                        کالاهای دارای موجودی انبار
                    </p>
                </div>
                <div className="w-full sm:max-w-xs">
                    <FloatingInput
                        id="portal-product-search"
                        label="جستجوی نام کالا"
                        value={list.search}
                        onChange={(e) => list.setSearch(e.target.value)}
                        autoComplete="off"
                        name="radco-portal-product-search"
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setCategory("")}
                    className={chipClass(!category)}
                >
                    همه دسته‌ها
                </button>
                {categories.map((c) => (
                    <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategory(String(c.id))}
                        className={chipClass(category === String(c.id))}
                    >
                        {c.name}
                    </button>
                ))}
            </div>

            {list.loading ? (
                <CardSkeletonGrid />
            ) : list.error ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-8 text-center dark:border-red-500/20 dark:bg-red-500/10">
                    <AlertCircle size={28} className="text-red-500" />
                    <p className="text-[12.5px] text-red-600 dark:text-red-400">
                        دریافت کالاها انجام نشد
                    </p>
                    <button
                        type="button"
                        onClick={list.refetch}
                        className="h-9 rounded-xl bg-red-600 px-4 text-[11.5px] font-bold text-white hover:bg-red-500"
                    >
                        تلاش مجدد
                    </button>
                </div>
            ) : list.data.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-300 p-12 text-center text-[12.5px] text-gray-500 dark:border-white/10">
                    <Package size={30} className="text-gray-400" />
                    کالایی با این مشخصات پیدا نشد
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {list.data.map((p) => {
                        const inCart = cartIds.has(p.id);
                        return (
                            <article
                                key={p.id}
                                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.04]"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-[12.5px] font-extrabold text-gray-900 dark:text-white">
                                            {p.name}
                                        </h2>
                                        <p className="mt-1 text-[11px] text-gray-500">
                                            {p.category_name || "بدون دسته"}
                                        </p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10.5px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                        {fmt(p.available_quantity)} {UNIT_TYPE_LABELS[p.unit_type]}
                                    </span>
                                </div>

                                <p className="mt-5 text-[15px] font-extrabold text-indigo-600 dark:text-indigo-300">
                                    {fmt(Number(p.sale_price))}{" "}
                                    <span className="text-[11px] font-bold">تومان</span>
                                </p>

                                <div className="mt-4 flex gap-2">
                                    <input
                                        dir="ltr"
                                        inputMode="decimal"
                                        aria-label="تعداد"
                                        aria-invalid={!!errors[p.id]}
                                        disabled={inCart}
                                        value={quantities[p.id] ?? "1"}
                                        onChange={(e) => setQuantity(p.id, e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleAdd(p);
                                        }}
                                        autoComplete="off"
                                        name={`radco-qty-${p.id}`}
                                        className={`min-w-0 flex-1 rounded-4xl border bg-white px-5 py-2.5 text-sm text-black outline-none transition-colors disabled:opacity-50 dark:bg-white/[0.04] dark:text-white ${
                                            errors[p.id]
                                                ? "border-red-400"
                                                : "border-gray-200 focus:border-gray-400 dark:border-white/[0.08] dark:focus:border-blue-500"
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        disabled={inCart}
                                        onClick={() => handleAdd(p)}
                                        className="flex h-10 items-center gap-2 rounded-2xl bg-indigo-600 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                                    >
                                        {inCart ? <Check size={15} /> : <ShoppingCart size={15} />}
                                        {inCart ? "در سبد" : "افزودن"}
                                    </button>
                                </div>
                                {errors[p.id] && (
                                    <p role="alert" className="mt-2 text-[11px] text-red-500">
                                        {errors[p.id]}
                                    </p>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}

            {!list.loading && !list.error && list.totalPages > 1 && (
                <Pagination
                    page={list.page}
                    totalPages={list.totalPages}
                    onChange={list.setPage}
                />
            )}

            <p className="text-[11px] text-gray-400">
                موجودی هنگام ثبت سفارش بررسی می‌شود و تا زمان تأیید کارمند رزرو نخواهد شد.
            </p>
        </section>
    );
}
