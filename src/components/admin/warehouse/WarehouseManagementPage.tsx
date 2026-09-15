"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Boxes,
    Package,
    UserPlus,
    type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import WarehouseStaffCard from "./WarehouseStaffCard";
import WarehouseCategoryCard from "./WarehouseCategoryCard";
import AddWarehouseStaffModal from "./AddWarehouseStaffModal";
import AddCategoryModal from "./AddCategoryModal";
import axiosInstance from "@/lib/axiosInstance";

interface WarehouseStaff {
    id: number;
    employee: number;
    employee_id: number;
    full_name: string;
    is_active: boolean;
    joined_at: string;
}

interface Category {
    id: number;
    name: string;
}

type Tab = "staff" | "categories";

interface TabItem {
    id: Tab;
    label: string;
    icon: LucideIcon;
}

const tabs: TabItem[] = [
    {
        id: "staff",
        label: "انبارداران",
        icon: UserPlus,
    },
    {
        id: "categories",
        label: "دسته‌بندی‌ها",
        icon: Package,
    },
];

export default function WarehouseManagementPage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [tab, setTab] = useState<Tab>("staff");
    const [staff, setStaff] = useState<WarehouseStaff[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            const [staffRes, categoriesRes] = await Promise.all([
                axiosInstance.get("/warehouse/api/v1/staff/"),
                axiosInstance.get("/warehouse/api/v1/products/categories/"),
            ]);

            setStaff(
                Array.isArray(staffRes.data) ? staffRes.data : []
            );

            setCategories(
                Array.isArray(categoriesRes.data)
                    ? categoriesRes.data
                    : []
            );
        } catch {
            setStaff([]);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleteStaff = (id: number) => {
        setStaff((prev) =>
            prev.filter((s) => s.id !== id)
        );
    };

    const handleUpdateStaff = (updatedStaff: WarehouseStaff) => {
        setStaff((prev) =>
            prev.map((s) =>
                s.id === updatedStaff.id ? updatedStaff : s
            )
        );
    };

    const handleDeleteCategory = (id: number) => {
        setCategories((prev) =>
            prev.filter((c) => c.id !== id)
        );
    };

    const handleUpdateCategory = (updatedCategory: Category) => {
        setCategories((prev) =>
            prev.map((c) =>
                c.id === updatedCategory.id
                    ? updatedCategory
                    : c
            )
        );
    };

    const handleStaffSuccess = () => {
        setShowStaffModal(false);
        fetchData();
    };

    const handleCategorySuccess = () => {
        setShowCategoryModal(false);
        fetchData();
    };

    return (
        <div
            className="flex flex-col gap-6 p-4 md:p-6"
            dir="rtl"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[22px] font-extrabold text-gray-900 dark:text-white leading-tight">
                        مدیریت انبار
                    </h1>

                    <p className="text-[12.5px] text-gray-400 dark:text-gray-500 mt-0.5">
                        مدیریت انبارداران و دسته‌بندی محصولات
                    </p>
                </div>
            </div>

            <div
                className="flex flex-wrap gap-2 rounded-2xl p-1.5"
                style={{
                    background: isDark
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(15,23,42,0.04)",
                }}
            >
                {tabs.map((item) => {
                    const active = tab === item.id;

                    const count =
                        item.id === "staff"
                            ? staff.length
                            : categories.length;

                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setTab(item.id)}
                            className="relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-extrabold"
                            style={{
                                background: active
                                    ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                                    : "transparent",
                                color: active
                                    ? "#fff"
                                    : isDark
                                        ? "#94a3b8"
                                        : "#475569",
                                boxShadow: active
                                    ? "0 4px 12px rgba(99,102,241,0.25)"
                                    : "none",
                            }}
                        >
                            <Icon size={14} />

                            {item.label}

                            {count > 0 && (
                                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] text-white">
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                </div>
            ) : (
                <>
                    {tab === "staff" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-[16px] font-extrabold text-gray-900 dark:text-white">
                                        انبارداران
                                    </h2>

                                    <p className="text-[11.5px] text-gray-400 dark:text-gray-500 mt-0.5">
                                        کارمندان دارای دسترسی انبار
                                    </p>
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() =>
                                        setShowStaffModal(true)
                                    }
                                    className="flex items-center gap-2 text-[13px] font-bold text-white px-4 py-2 rounded-xl"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                        boxShadow:
                                            "0 4px 14px rgba(99,102,241,0.3)",
                                    }}
                                    type="button"
                                >
                                    <UserPlus size={15} />

                                    افزودن انباردار
                                </motion.button>
                            </div>

                            {staff.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Boxes
                                        className="text-gray-400"
                                        size={40}
                                    />

                                    <p className="text-[13px] text-gray-400 dark:text-gray-500">
                                        هنوز انبارداری ثبت نشده
                                    </p>
                                </div>
                            ) : (
                                <motion.div
                                    layout
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                                >
                                    <AnimatePresence mode="popLayout">
                                        {staff.map((s, i) => (
                                            <WarehouseStaffCard
                                                key={s.id}
                                                staff={s}
                                                index={i}
                                                onDelete={
                                                    handleDeleteStaff
                                                }
                                                onUpdated={
                                                    handleUpdateStaff
                                                }
                                            />
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {tab === "categories" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-[16px] font-extrabold text-gray-900 dark:text-white">
                                        دسته‌بندی محصولات
                                    </h2>

                                    <p className="text-[11.5px] text-gray-400 dark:text-gray-500 mt-0.5">
                                        دسته‌بندی‌های موجود در انبار
                                    </p>
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() =>
                                        setShowCategoryModal(true)
                                    }
                                    className="flex items-center gap-2 text-[13px] font-bold text-white px-4 py-2 rounded-xl"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                        boxShadow:
                                            "0 4px 14px rgba(99,102,241,0.3)",
                                    }}
                                    type="button"
                                >
                                    <Package size={15} />

                                    افزودن دسته‌بندی
                                </motion.button>
                            </div>

                            {categories.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Boxes
                                        className="text-gray-400"
                                        size={40}
                                    />

                                    <p className="text-[13px] text-gray-400 dark:text-gray-500">
                                        هنوز دسته‌بندی ثبت نشده
                                    </p>
                                </div>
                            ) : (
                                <motion.div
                                    layout
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                                >
                                    <AnimatePresence mode="popLayout">
                                        {categories.map((c, i) => (
                                            <WarehouseCategoryCard
                                                key={c.id}
                                                category={c}
                                                index={i}
                                                onDelete={
                                                    handleDeleteCategory
                                                }
                                                onUpdated={
                                                    handleUpdateCategory
                                                }
                                            />
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </div>
                    )}
                </>
            )}

            <AnimatePresence>
                {showStaffModal && (
                    <AddWarehouseStaffModal
                        isOpen={showStaffModal}
                        onClose={() =>
                            setShowStaffModal(false)
                        }
                        onSuccess={handleStaffSuccess}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showCategoryModal && (
                    <AddCategoryModal
                        isOpen={showCategoryModal}
                        onClose={() =>
                            setShowCategoryModal(false)
                        }
                        onSuccess={handleCategorySuccess}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}