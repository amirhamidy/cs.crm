"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Boxes,
    LayoutGrid,
    Loader2,
    PackageSearch,
    Plus,
    Send,
    Tags,
    UserCog,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import {
    ApiCategory,
    ApiOrderTask,
    ApiOrderTaskDeadline,
    ApiProduct,
    ApiStockInfo,
    ApiStockTransaction,
    ApiWarehouseStaff,
    ApiWarehouseTask,
} from "@/types/warehouse";
import CategoryModal from "@/components/admin/warehouse/CategoryModal";
import CategoryCard from "@/components/admin/warehouse/Categorycard";
import StaffModal from "@/components/admin/warehouse/StaffModal";
import StaffCard from "@/components/admin/warehouse/StaffCard";
import ProductWizardModal from "@/components/admin/warehouse/ProductWizardModal";
import ProductCard from "@/components/admin/warehouse/ProductCard";
import WarehouseTaskCard from "@/components/admin/warehouse/WarehouseTaskCard";
import OrderTaskCard from "@/components/admin/warehouse/Ordertaskcard";
import WarehouseOverview from "@/components/admin/warehouse/Warehouseoverview";

type Tab = "overview" | "products" | "categories" | "staff" | "tasks" | "orders";

const TABS: { id: Tab; label: string; icon: typeof Boxes }[] = [
    { id: "overview", label: "نمای کلی", icon: LayoutGrid },
    { id: "products", label: "محصولات", icon: Boxes },
    { id: "categories", label: "دسته‌بندی‌ها", icon: Tags },
    { id: "staff", label: "کارمندان انبار", icon: UserCog },
    { id: "tasks", label: "وظایف دریافت کالا", icon: PackageSearch },
    { id: "orders", label: "درخواست‌های داخلی", icon: Send },
];

const ITEMS_PER_PAGE = 8;

function extractList<T>(data: unknown): T[] {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;
        if (Array.isArray(record.results)) return record.results as T[];
        if (Array.isArray(record.data)) return record.data as T[];
    }
    return [];
}

function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    isDark,
}: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isDark: boolean;
}) {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        if (totalPages <= 5) return i + 1;
        if (currentPage <= 3) return i + 1;
        if (currentPage >= totalPages - 2) return totalPages - 4 + i;
        return currentPage - 2 + i;
    });

    return (
        <div className="flex items-center justify-center gap-1.5 mt-4">
            <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors disabled:opacity-40"
                style={{
                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)",
                    color: isDark ? "#94a3b8" : "#475569",
                }}
            >
                <ChevronRight size={15} />
            </button>

            {pages.map((page) => {
                const isActive = page === currentPage;
                return (
                    <button
                        key={page}
                        type="button"
                        onClick={() => onPageChange(page)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-[12px] font-extrabold transition-all"
                        style={{
                            background: isActive
                                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                                : isDark
                                    ? "rgba(255,255,255,0.04)"
                                    : "rgba(15,23,42,0.04)",
                            color: isActive ? "#ffffff" : isDark ? "#94a3b8" : "#475569",
                            boxShadow: isActive ? "0 4px 12px rgba(99,102,241,0.25)" : "none",
                        }}
                    >
                        {page}
                    </button>
                );
            })}

            <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors disabled:opacity-40"
                style={{
                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)",
                    color: isDark ? "#94a3b8" : "#475569",
                }}
            >
                <ChevronLeft size={15} />
            </button>
        </div>
    );
}

export default function WarehousePage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [tab, setTab] = useState<Tab>("overview");
    const [currentPage, setCurrentPage] = useState(1);

    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [staff, setStaff] = useState<ApiWarehouseStaff[]>([]);
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [stockInfos, setStockInfos] = useState<ApiStockInfo[]>([]);
    const [transactions, setTransactions] = useState<ApiStockTransaction[]>([]);
    const [tasks, setTasks] = useState<ApiWarehouseTask[]>([]);
    const [orderTasks, setOrderTasks] = useState<ApiOrderTask[]>([]);
    const [orderTaskDeadlines, setOrderTaskDeadlines] = useState<ApiOrderTaskDeadline[]>([]);

    const [loading, setLoading] = useState(true);

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showProductWizard, setShowProductWizard] = useState(false);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [
                categoriesRes,
                staffRes,
                productsRes,
                stockRes,
                transactionsRes,
                tasksRes,
                orderTasksRes,
                deadlinesRes,
            ] = await Promise.all([
                axiosInstance.get("/warehouse/api/v1/products/categories/").catch(() => null),
                axiosInstance.get("/warehouse/api/v1/staff/").catch(() => null),
                axiosInstance.get("/warehouse/api/v1/products/").catch(() => null),
                axiosInstance.get("/warehouse/api/v1/process/stock/").catch(() => null),
                axiosInstance.get("/warehouse/api/v1/process/transactions/").catch(() => null),
                axiosInstance.get("/warehouse/api/v1/task/").catch(() => null),
                axiosInstance.get("/warehouse/api/v1/order_task/").catch(() => null),
                axiosInstance.get("/warehouse/api/v1/order_task/deadlines/").catch(() => null),
            ]);

            setCategories(categoriesRes ? extractList<ApiCategory>(categoriesRes.data) : []);
            setStaff(staffRes ? extractList<ApiWarehouseStaff>(staffRes.data) : []);
            setProducts(productsRes ? extractList<ApiProduct>(productsRes.data) : []);
            setStockInfos(stockRes ? extractList<ApiStockInfo>(stockRes.data) : []);
            setTransactions(transactionsRes ? extractList<ApiStockTransaction>(transactionsRes.data) : []);
            setTasks(tasksRes ? extractList<ApiWarehouseTask>(tasksRes.data) : []);
            setOrderTasks(orderTasksRes ? extractList<ApiOrderTask>(orderTasksRes.data) : []);
            setOrderTaskDeadlines(deadlinesRes ? extractList<ApiOrderTaskDeadline>(deadlinesRes.data) : []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    useEffect(() => {
        setCurrentPage(1);
    }, [tab]);

    const stockByProduct = useMemo(
        () => new Map(stockInfos.map((s) => [s.product, s])),
        [stockInfos]
    );

    const deadlineByOrderTask = useMemo(
        () => new Map(orderTaskDeadlines.map((d) => [d.order_task, d])),
        [orderTaskDeadlines]
    );

    const pendingTasksCount = useMemo(
        () => tasks.filter((t) => t.status !== "completed").length,
        [tasks]
    );

    const pendingOrderTasksCount = useMemo(
        () => orderTasks.filter((t) => t.status !== "completed").length,
        [orderTasks]
    );

    function handleAddClick() {
        if (tab === "categories") setShowCategoryModal(true);
        else if (tab === "staff") setShowStaffModal(true);
        else if (tab === "products") setShowProductWizard(true);
    }

    // Pagination logic
    const getPaginatedData = useCallback(
        <T,>(data: T[]) => {
            const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
            const start = (currentPage - 1) * ITEMS_PER_PAGE;
            const end = start + ITEMS_PER_PAGE;
            return {
                items: data.slice(start, end),
                totalPages,
            };
        },
        [currentPage]
    );

    const paginatedProducts = useMemo(
        () => getPaginatedData(products),
        [products, getPaginatedData]
    );

    const paginatedCategories = useMemo(
        () => getPaginatedData(categories),
        [categories, getPaginatedData]
    );

    const paginatedStaff = useMemo(
        () => getPaginatedData(staff),
        [staff, getPaginatedData]
    );

    const paginatedTasks = useMemo(
        () => getPaginatedData(tasks),
        [tasks, getPaginatedData]
    );

    const paginatedOrderTasks = useMemo(
        () => getPaginatedData(orderTasks),
        [orderTasks, getPaginatedData]
    );

    return (
        <div
            dir="rtl"
            className="flex flex-col gap-6 p-6"
            style={{
                background: isDark ? "#0f172a" : "#f8fafc",
                minHeight: "100vh",
            }}
        >
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-[18px] font-extrabold text-gray-900 dark:text-white">انبار</h1>
                    <p className="mt-1 text-[12px] text-gray-400">
                        مدیریت محصولات، موجودی و فرآیندهای ورود و خروج کالا
                    </p>
                </div>

                {(tab === "categories" || tab === "staff" || tab === "products") && (
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={handleAddClick}
                        className="flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[12.5px] font-bold text-white transition-colors hover:bg-indigo-500"
                        style={{ background: "#6366f1" }}
                    >
                        <Plus size={15} />
                        {tab === "categories" && "دسته‌بندی جدید"}
                        {tab === "staff" && "افزودن کارمند"}
                        {tab === "products" && "محصول جدید"}
                    </motion.button>
                )}
            </div>

            {/* Tabs */}
            <div
                className="flex flex-wrap gap-2 rounded-2xl p-1.5"
                style={{
                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)",
                }}
            >
                {TABS.map((t) => {
                    const isActive = tab === t.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setTab(t.id)}
                            className="relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-extrabold transition-all"
                            style={{
                                background: isActive
                                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                                    : "transparent",
                                color: isActive
                                    ? "#ffffff"
                                    : isDark
                                        ? "#94a3b8"
                                        : "#475569",
                                boxShadow: isActive ? "0 4px 12px rgba(99,102,241,0.25)" : "none",
                            }}
                        >
                            <t.icon size={14} />
                            {t.label}
                            {t.id === "tasks" && pendingTasksCount > 0 && (
                                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-extrabold text-white">
                                    {pendingTasksCount}
                                </span>
                            )}
                            {t.id === "orders" && pendingOrderTasksCount > 0 && (
                                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-extrabold text-white">
                                    {pendingOrderTasksCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={22} className="animate-spin" style={{ color: "#6366f1" }} />
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tab + currentPage}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                    >
                        {tab === "overview" && (
                            <WarehouseOverview
                                products={products}
                                stockInfos={stockInfos}
                                transactions={transactions}
                                tasks={tasks}
                                orderTasks={orderTasks}
                            />
                        )}

                        {tab === "products" && (
                            <>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {paginatedProducts.items.length === 0 ? (
                                        <p className="col-span-full py-16 text-center text-[12.5px] text-gray-400">
                                            هنوز محصولی ثبت نشده است
                                        </p>
                                    ) : (
                                        paginatedProducts.items.map((product, index) => (
                                            <ProductCard
                                                key={product.id}
                                                product={product}
                                                stockInfo={stockByProduct.get(product.id) ?? null}
                                                index={index}
                                                categories={categories}
                                                staff={staff}
                                                onUpdated={(updated) =>
                                                    setProducts((prev) =>
                                                        prev.map((p) => (p.id === updated.id ? updated : p))
                                                    )
                                                }
                                                onStockChanged={() => loadAll()}
                                                onDeleted={(id) =>
                                                    setProducts((prev) => prev.filter((p) => p.id !== id))
                                                }
                                            />
                                        ))
                                    )}
                                </div>
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={paginatedProducts.totalPages}
                                    onPageChange={setCurrentPage}
                                    isDark={isDark}
                                />
                            </>
                        )}

                        {tab === "categories" && (
                            <>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {paginatedCategories.items.length === 0 ? (
                                        <p className="col-span-full py-16 text-center text-[12.5px] text-gray-400">
                                            هنوز دسته‌بندی‌ای ثبت نشده است
                                        </p>
                                    ) : (
                                        paginatedCategories.items.map((category, index) => (
                                            <CategoryCard
                                                key={category.id}
                                                category={category}
                                                index={index}
                                                onUpdated={(updated) =>
                                                    setCategories((prev) =>
                                                        prev.map((c) => (c.id === updated.id ? updated : c))
                                                    )
                                                }
                                                onDeleted={(id) =>
                                                    setCategories((prev) => prev.filter((c) => c.id !== id))
                                                }
                                            />
                                        ))
                                    )}
                                </div>
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={paginatedCategories.totalPages}
                                    onPageChange={setCurrentPage}
                                    isDark={isDark}
                                />
                            </>
                        )}

                        {tab === "staff" && (
                            <>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {paginatedStaff.items.length === 0 ? (
                                        <p className="col-span-full py-16 text-center text-[12.5px] text-gray-400">
                                            هنوز کارمندی به انبار اضافه نشده است
                                        </p>
                                    ) : (
                                        paginatedStaff.items.map((member, index) => (
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
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={paginatedStaff.totalPages}
                                    onPageChange={setCurrentPage}
                                    isDark={isDark}
                                />
                            </>
                        )}

                        {tab === "tasks" && (
                            <>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {paginatedTasks.items.length === 0 ? (
                                        <p className="col-span-full py-16 text-center text-[12.5px] text-gray-400">
                                            وظیفه‌ای برای دریافت کالا وجود ندارد
                                        </p>
                                    ) : (
                                        paginatedTasks.items.map((task, index) => (
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
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={paginatedTasks.totalPages}
                                    onPageChange={setCurrentPage}
                                    isDark={isDark}
                                />
                            </>
                        )}

                        {tab === "orders" && (
                            <>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {paginatedOrderTasks.items.length === 0 ? (
                                        <p className="col-span-full py-16 text-center text-[12.5px] text-gray-400">
                                            درخواست داخلی‌ای برای انبار ثبت نشده است
                                        </p>
                                    ) : (
                                        paginatedOrderTasks.items.map((orderTask, index) => (
                                            <OrderTaskCard
                                                key={orderTask.id}
                                                orderTask={orderTask}
                                                deadline={deadlineByOrderTask.get(orderTask.id) ?? null}
                                                index={index}
                                            />
                                        ))
                                    )}
                                </div>
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={paginatedOrderTasks.totalPages}
                                    onPageChange={setCurrentPage}
                                    isDark={isDark}
                                />
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}

            {/* Modals */}
            <CategoryModal
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                onSaved={(category) => setCategories((prev) => [...prev, category])}
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