"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    PackagePlus,
    Search,
    SlidersHorizontal,
} from "lucide-react";
import type {
    ApiCategory,
    ApiProduct,
    ApiStockInfo,
    ApiWarehouseStaff,
} from "@/types/warehouse";
import WarehouseEmployeeProductCard from "./WarehouseEmployeeProductCard";
import WarehouseEmployeeProductWizardModal from "./WarehouseEmployeeProductWizardModal";

interface WarehouseEmployeeProductsProps {
    products: ApiProduct[];
    categories: ApiCategory[];
    staff: ApiWarehouseStaff[];
    stockInfos: ApiStockInfo[];
    performedById?: number | null;
    onProductCreated?: (
        product: ApiProduct,
        stockInfo?: ApiStockInfo
    ) => void;
    onProductUpdated?: (product: ApiProduct) => void;
    onStockChanged?: (stock: ApiStockInfo) => void;
    onProductDeleted?: (productId: number) => void;
}

export default function WarehouseEmployeeProducts({
    products,
    categories,
    staff,
    stockInfos,
    performedById,
    onProductCreated,
    onProductUpdated,
    onStockChanged,
    onProductDeleted,
}: WarehouseEmployeeProductsProps) {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [wizardOpen, setWizardOpen] = useState(false);

    const filteredProducts = useMemo(() => {
        const value = search.trim().toLowerCase();

        return products.filter(product => {
            const matchesSearch =
                !value ||
                [
                    product.name,
                    product.code,
                    product.sku,
                    product.id,
                ]
                    .filter(Boolean)
                    .some(item =>
                        String(item).toLowerCase().includes(value)
                    );

            const matchesCategory =
                !category ||
                String(product.category?.id ?? product.category_id ?? "") ===
                category;

            return matchesSearch && matchesCategory;
        });
    }, [products, search, category]);

    function handleCreated(
        product: ApiProduct,
        stockInfo?: ApiStockInfo
    ) {
        setWizardOpen(false);
        onProductCreated?.(product, stockInfo);

        if (stockInfo) {
            onStockChanged?.(stockInfo);
        }
    }

    return (
        <div dir="rtl" className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-[16px] font-extrabold text-slate-900 dark:text-white">
                        محصولات انبار
                    </h2>

                    <p className="mt-1 text-[12px] font-medium text-slate-500 dark:text-slate-400">
                        مدیریت محصولات، موجودی و عملیات انبار
                    </p>
                </div>

                <motion.button
                    type="button"
                    whileTap={{ scale: .97 }}
                    onClick={() => setWizardOpen(true)}
                    className="flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-5 text-[12px] font-bold text-white shadow-lg shadow-indigo-500/10"
                >
                    <PackagePlus size={17} />
                    افزودن محصول
                </motion.button>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                    <Search
                        size={16}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="جستجوی محصول، کد یا شناسه..."
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white pr-11 pl-4 text-[12px] font-medium outline-none transition focus:border-indigo-400 dark:border-white/[.07] dark:bg-white/[.03] dark:text-white"
                    />
                </div>

                <div className="relative lg:w-56">
                    <SlidersHorizontal
                        size={15}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-white pr-11 pl-4 text-[12px] font-medium outline-none dark:border-white/[.07] dark:bg-white/[.03] dark:text-white"
                    >
                        <option value="">همه دسته‌بندی‌ها</option>

                        {categories.map(item => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {filteredProducts.length} محصول
                </span>
            </div>

            {filteredProducts.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-slate-200 px-6 py-16 text-center dark:border-white/[.08]">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10">
                        <PackagePlus
                            size={23}
                            className="text-indigo-500"
                        />
                    </div>

                    <h3 className="mt-4 text-[13px] font-extrabold text-slate-800 dark:text-white">
                        محصولی پیدا نشد
                    </h3>

                    <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                        برای ایجاد محصول جدید از دکمه افزودن محصول استفاده کنید.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {filteredProducts.map(product => (
                        <WarehouseEmployeeProductCard
                            key={product.id}
                            product={product}
                            staff={staff}
                            stockInfos={stockInfos}
                            performedById={performedById}
                            onUpdated={onProductUpdated}
                            onStockChanged={onStockChanged}
                            onDeleted={onProductDeleted}
                        />
                    ))}
                </div>
            )}

            <WarehouseEmployeeProductWizardModal
                isOpen={wizardOpen}
                onClose={() => setWizardOpen(false)}
                categories={categories}
                staff={staff}
                performedById={performedById}
                onCreated={handleCreated}
            />
        </div>
    );
}