"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PackagePlus, Search, SlidersHorizontal } from "lucide-react";
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

    const stockByProduct = useMemo(
        () =>
            new Map(
                stockInfos.map(stock => [stock.product, stock])
            ),
        [stockInfos]
    );

    const filteredProducts = useMemo(() => {
        const value = search.trim().toLowerCase();

        return products.filter(product => {
            const item = product as ApiProduct & {
                code?: string | number | null;
                sku?: string | number | null;
                category_id?: number | null;
            };

            const matchesSearch =
                !value ||
                [
                    product.name,
                    product.id,
                    item.code,
                    item.sku,
                ].some(field =>
                    String(field ?? "")
                        .toLowerCase()
                        .includes(value)
                );

            const productCategory = String(
                item.category_id ?? product.category ?? ""
            );

            const matchesCategory =
                !category || productCategory === category;

            return matchesSearch && matchesCategory;
        });
    }, [products, search, category]);

    return (
        <>
            <div className="space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-[16px] font-extrabold">
                            محصولات انبار
                        </h2>

                        <p className="mt-1 text-[11.5px] text-slate-400">
                            مدیریت محصولات و عملیات مربوط به موجودی
                        </p>
                    </div>

                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setWizardOpen(true)}
                        className="flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-[12px] font-extrabold text-white"
                        style={{
                            background:
                                "linear-gradient(135deg,#6366f1,#8b5cf6)",
                        }}
                    >
                        <PackagePlus size={16} />
                        افزودن محصول
                    </motion.button>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                        <Search
                            size={15}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            value={search}
                            onChange={event =>
                                setSearch(event.target.value)
                            }
                            placeholder="جستجوی محصول، کد یا شناسه..."
                            className="h-11 w-full rounded-xl border bg-transparent pr-9 pl-3 text-[12px] outline-none"
                        />
                    </div>

                    <div className="relative sm:w-56">
                        <SlidersHorizontal
                            size={15}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <select
                            value={category}
                            onChange={event =>
                                setCategory(event.target.value)
                            }
                            className="h-11 w-full appearance-none rounded-xl border bg-transparent px-9 text-[12px] outline-none"
                        >
                            <option value="">همه دسته‌بندی‌ها</option>

                            {categories.map(item => (
                                <option
                                    key={item.id}
                                    value={item.id}
                                >
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.length === 0 ? (
                        <p className="col-span-full py-16 text-center text-[12.5px] text-slate-400">
                            محصولی برای نمایش وجود ندارد
                        </p>
                    ) : (
                        filteredProducts.map((product, index) => (
                            <WarehouseEmployeeProductCard
                                key={product.id}
                                product={product}
                                stockInfo={
                                    stockByProduct.get(product.id) ??
                                    null
                                }
                                index={index}
                                categories={categories}
                                staff={staff}
                                performedById={performedById}
                                onUpdated={onProductUpdated}
                                onDeleted={onProductDeleted}
                            />
                        ))
                    )}
                </div>
            </div>

            <WarehouseEmployeeProductWizardModal
                isOpen={wizardOpen}
                onClose={() => setWizardOpen(false)}
                categories={categories}
                staff={staff}
                performedById={performedById}
                onCreated={(product, stockInfo) => {
                    onProductCreated?.(product, stockInfo);
                    setWizardOpen(false);
                }}
            />
        </>
    );
}