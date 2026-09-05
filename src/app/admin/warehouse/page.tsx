"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Boxes, Loader2, Plus, Tags, UserCog, PackageSearch } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import {
    ApiCategory,
    ApiProduct,
    ApiWarehouseStaff,
    ApiWarehouseTask,
} from "@/types/warehouse";
import CategoryModal from "@/components/admin/warehouse/CategoryModal";
import StaffModal from "@/components/admin/warehouse/StaffModal";
import ProductWizardModal from "@/components/admin/warehouse/ProductWizardModal";
import ProductCard from "@/components/admin/warehouse/ProductCard";
import StaffCard from "@/components/admin/warehouse/StaffCard";
import WarehouseTaskCard from "@/components/admin/warehouse/WarehouseTaskCard";

type Tab = "products" | "categories" | "staff" | "tasks";

const TABS: { id: Tab; label: string; icon: typeof Boxes }[] = [
    { id: "products", label: "محصولات", icon: Boxes },
    { id: "categories", label: "دسته‌بندی‌ها", icon: Tags },
    { id: "staff", label: "کارمندان انبار", icon: UserCog },
    { id: "tasks", label: "وظایف دریافتی", icon: PackageSearch },
];

function extractList<T>(data: unknown): T[] {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;
        if (Array.isArray(record.results)) return record.results as T[];
        if (Array.isArray(record.data)) return record.data as T[];
    }
    return [];
}

export default function WarehousePage() {
    const [tab, setTab] = useState<Tab>("products");

    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [staff, setStaff] = useState<ApiWarehouseStaff[]>([]);
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [tasks, setTasks] = useState<ApiWarehouseTask[]>([]);

    const [loading, setLoading] = useState(true);

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showProductWizard, setShowProductWizard] = useState(false);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [categoriesRes, staffRes, productsRes, tasksRes] = await Promise.all([
                axiosInstance.get("/warehouse/api/v1/products/categories/").catch(() => null),
                axiosInstance.get("/warehouse/api/v1/staff/").catch(() => null),
                axiosInstance.get("/warehouse/api/v1/products/").catch(() => null),
                axiosInstance.get("/warehouse/api/v1/task/").catch(() => null),
            ]);

            setCategories(categoriesRes ? extractList<ApiCategory>(categoriesRes.data) : []);
            setStaff(staffRes ? extractList<ApiWarehouseStaff>(staffRes.data) : []);
            setProducts(productsRes ? extractList<ApiProduct>(productsRes.data) : []);
            setTasks(tasksRes ? extractList<ApiWarehouseTask>(tasksRes.data) : []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const pendingTasksCount = useMemo(
        () => tasks.filter((t) => t.status !== "completed").length,
        [tasks]
    );

    function handleAddClick() {
        if (tab === "categories") setShowCategoryModal(true);
        else if (tab === "staff") setShowStaffModal(true);
        else if (tab === "products") setShowProductWizard(true);
    }

    return (
        <div dir="rtl" className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[18px] font-extrabold text-gray-900 dark:text-white">انبار</h1>
                    <p className="mt-1 text-[12px] text-gray-400">
                        مدیریت محصولات، موجودی و فرآیندهای ورود و خروج کالا
                    </p>
                </div>

                {tab !== "tasks" && (
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={handleAddClick}
                        className="flex items-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2.5 text-[12.5px] font-bold text-white transition-colors hover:bg-blue-500"
                    >
                        <Plus size={15} />
                        {tab === "categories" && "دسته‌بندی جدید"}
                        {tab === "staff" && "افزودن کارمند"}
                        {tab === "products" && "محصول جدید"}
                    </motion.button>
                )}
            </div>

            <div className="flex flex-wrap gap-2 rounded-2xl bg-gray-100 p-1.5 dark:bg-white/[0.05]">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={`relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-extrabold transition-colors ${tab === t.id
                                ? "bg-white text-blue-600 shadow-sm dark:bg-[#1e293b]"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                    >
                        <t.icon size={14} />
                        {t.label}
                        {t.id === "tasks" && pendingTasksCount > 0 && (
                            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-extrabold text-white">
                                {pendingTasksCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                    <Loader2 size={22} className="animate-spin" />
                </div>
            ) : (
                <>
                    {tab === "products" && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {products.length === 0 ? (
                                <p className="col-span-full py-16 text-center text-[12.5px] text-gray-400">
                                    هنوز محصولی ثبت نشده است
                                </p>
                            ) : (
                                products.map((product, index) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        index={index}
                                        categories={categories}
                                        staff={staff}
                                        onUpdated={(updated) =>
                                            setProducts((prev) =>
                                                prev.map((p) => (p.id === updated.id ? updated : p))
                                            )
                                        }
                                        onStockChanged={() => loadAll()}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {tab === "categories" && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {categories.length === 0 ? (
                                <p className="col-span-full py-16 text-center text-[12.5px] text-gray-400">
                                    هنوز دسته‌بندی‌ای ثبت نشده است
                                </p>
                            ) : (
                                categories.map((category, index) => (
                                    <motion.div
                                        key={category.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: index * 0.03 }}
                                        className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.02]"
                                    >
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
                                            <Tags size={15} className="text-indigo-500" />
                                        </div>
                                        <span className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                                            {category.name}
                                        </span>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}

                    {tab === "staff" && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {staff.length === 0 ? (
                                <p className="col-span-full py-16 text-center text-[12.5px] text-gray-400">
                                    هنوز کارمندی به انبار اضافه نشده است
                                </p>
                            ) : (
                                staff.map((member, index) => (
                                    <StaffCard
                                        key={member.id}
                                        staff={member}
                                        index={index}
                                        onUpdated={(updated) =>
                                            setStaff((prev) =>
                                                prev.map((s) => (s.id === updated.id ? updated : s))
                                            )
                                        }
                                        onDeleted={(id) =>
                                            setStaff((prev) => prev.filter((s) => s.id !== id))
                                        }
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {tab === "tasks" && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {tasks.length === 0 ? (
                                <p className="col-span-full py-16 text-center text-[12.5px] text-gray-400">
                                    وظیفه‌ای برای دریافت کالا وجود ندارد
                                </p>
                            ) : (
                                tasks.map((task, index) => (
                                    <WarehouseTaskCard
                                        key={task.id}
                                        task={task}
                                        index={index}
                                        staff={staff}
                                        onUpdated={(updated) =>
                                            setTasks((prev) =>
                                                prev.map((t) => (t.id === updated.id ? updated : t))
                                            )
                                        }
                                    />
                                ))
                            )}
                        </div>
                    )}
                </>
            )}

            <CategoryModal
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                onCreated={(category) => setCategories((prev) => [...prev, category])}
            />

            <StaffModal
                isOpen={showStaffModal}
                onClose={() => setShowStaffModal(false)}
                existingStaff={staff}
                onCreated={(member) => setStaff((prev) => [...prev, member])}
            />

            <ProductWizardModal
                isOpen={showProductWizard}
                onClose={() => setShowProductWizard(false)}
                categories={categories}
                staff={staff}
                onCreated={() => loadAll()}
            />
        </div>
    );
}