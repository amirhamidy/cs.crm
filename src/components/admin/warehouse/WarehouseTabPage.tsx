"use client";

import { ComponentType, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
    BellRing,
    Boxes,
    ClipboardList,
    FileText,
    LayoutGrid,
    Loader2,
    Package,
    PackagePlus,
    PackageSearch,
    Plus,
    ReceiptText,
    ShieldCheck,
    ShoppingBag,
    UsersRound,
} from "lucide-react";
import { useTheme } from "next-themes";

import WarehouseOverview from "@/components/admin/warehouse/Warehouseoverview";
import AddCategoryModal from "@/components/admin/warehouse/AddCategoryModal";
import WarehouseCategoryCard from "@/components/admin/warehouse/WarehouseCategoryCard";
import WarehouseStaffCard from "@/components/admin/warehouse/WarehouseStaffCard";
import AddWarehouseStaffModal from "@/components/admin/warehouse/AddWarehouseStaffModal";
import StockLimitsModal from "@/components/admin/warehouse/StockLimitsModal";
import {
    DeadlineCard,
    Pagination,
    StockCard,
    muted,
    cardBg,
    cardShadow,
} from "@/components/admin/warehouse/WarehouseCards";
import CreateOrderTaskModal from "@/components/user/warehouse/CreateOrderTaskModal";
import WarehouseEmployeeTransactionCard from "@/components/user/warehouse/WarehouseEmployeeTransactionCard";
import WarehouseEmployeeProductCard from "@/components/user/warehouse/WarehouseEmployeeProductCard";
import WarehouseEmployeeProductWizardModal from "@/components/user/warehouse/WarehouseEmployeeProductWizardModal";
import WarehouseEmployeeTaskCard from "@/components/user/warehouse/WarehouseEmployeeTaskCard";
import WarehouseEmployeeOrderTaskCard from "@/components/user/warehouse/WarehouseEmployeeOrderTaskCard";
import WarehouseEmployeeStockLedger from "@/components/user/warehouse/Warehouseemployeestockledger";
import OrderInvoiceCard from "@/components/user/warehouse/OrderInvoiceCard";
import OrderInvoiceModal from "@/components/user/warehouse/OrderInvoiceModal";

import {
    buildSalesInvoices,
    getOrderTaskTitle,
    paginate,
} from "@/utils/warehouseEmployee";
import type { SalesInvoice } from "@/utils/warehouseEmployee";
import useWarehouseAccess from "@/hooks/useWarehouseAccess";
import useWarehouses from "@/hooks/useWarehouses";
import useWarehouseTab from "@/hooks/useWarehouseTab";
import type { WarehouseTab as Tab } from "@/hooks/useWarehouseTab";
import { PAGE_SIZE } from "@/lib/warehouseApi";
import type { ApiStockInfo, ApiWarehouseTask } from "@/types/warehouse";

interface AdminCategory {
    id: number;
    name: string;
}

interface WarehouseStaff {
    id: number;
    employee: number;
    employee_id: number;
    full_name: string;
    is_active: boolean;
    joined_at: string;
}

const TABS: Array<[Tab, string, ComponentType<{ size?: number }>]> = [
    ["overview", "نمای کلی", LayoutGrid],
    ["products", "محصولات", ShoppingBag],
    ["tasks", "وظایف انبار", ClipboardList],
    ["stock", "موجودی انبار", Boxes],
    ["transactions", "تراکنش‌ها", ReceiptText],
    ["orders", "درخواست‌های داخلی", PackageSearch],
    ["deadlines", "مهلت‌ها", BellRing],
    ["ledger", "گردش محصول", BellRing],
    ["categories", "دسته‌بندی‌ها", Package],
    ["invoices", "فاکتور فروش", FileText],
    ["staff", "انباردارها", UsersRound],
];

/** تب‌هایی که کاربرِ بدون دسترسی کامل انبار هم می‌بیند */
const LIMITED_TABS: Tab[] = ["orders", "stock", "tasks"];

export default function WarehouseTabPage({ tab }: { tab: Tab }) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const basePath = useMemo(
        () => `/${pathname.split("/").filter(Boolean)[0] ?? "admin"}/warehouse`,
        [pathname],
    );

    const warehouseParam = searchParams.get("warehouse");
    const warehouseId =
        warehouseParam && Number.isFinite(Number(warehouseParam))
            ? Number(warehouseParam)
            : null;
    const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
    const productParam = Number(searchParams.get("product"));
    const ledgerProductId =
        Number.isFinite(productParam) && productParam > 0 ? productParam : null;

    const {
        ready,
        employeeId,
        myStaff,
        hasFullAccess: hasFullWarehouseAccess,
        limitedAccess,
    } = useWarehouseAccess();

    const { warehouses } = useWarehouses();
    const warehouse = warehouses.find((item) => item.id === warehouseId) ?? null;

    const tabAllowed = hasFullWarehouseAccess || LIMITED_TABS.includes(tab);

    const { data, setData, loading, refreshing, error, reload } = useWarehouseTab({
        enabled: ready && limitedAccess && warehouseId !== null && tabAllowed,
        tab,
        warehouseId: warehouseId ?? 0,
        page: currentPage,
        hasFullAccess: hasFullWarehouseAccess,
        employeeId,
    });

    const [productWizardOpen, setProductWizardOpen] = useState(false);
    const [createOrderTaskOpen, setCreateOrderTaskOpen] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
    const [showAddStaffModal, setShowAddStaffModal] = useState(false);
    const [limitsStock, setLimitsStock] = useState<ApiStockInfo | null>(null);

    /* ------------------------------ مسیریابی ------------------------------ */

    const buildUrl = useCallback(
        (target: Tab, page = 1, extra = "") =>
            `${basePath}/${target}?warehouse=${warehouseId}${
                page > 1 ? `&page=${page}` : ""
            }${extra}`,
        [basePath, warehouseId],
    );

    const goToPage = useCallback(
        (page: number) => router.push(buildUrl(tab, page)),
        [router, buildUrl, tab],
    );

    const goToTab = useCallback(
        (target: Tab) => router.push(buildUrl(target)),
        [router, buildUrl],
    );

    /** اگر همان تب هستیم فقط رفرش، وگرنه رفتن به تب */
    const goOrReload = useCallback(
        (target: Tab) => {
            if (target === tab && currentPage === 1) void reload(true);
            else router.push(buildUrl(target));
        },
        [tab, currentPage, reload, router, buildUrl],
    );

    useEffect(() => {
        if (warehouseId === null) router.replace(basePath);
    }, [warehouseId, router, basePath]);

    useEffect(() => {
        if (ready && warehouseId !== null && !tabAllowed) {
            router.replace(buildUrl("orders"));
        }
    }, [ready, warehouseId, tabAllowed, router, buildUrl]);

    const salesInvoices = useMemo(
        () => buildSalesInvoices(data.archived),
        [data.archived],
    );
    const paginatedInvoices = useMemo(
        () => paginate(salesInvoices, currentPage, PAGE_SIZE),
        [salesInvoices, currentPage],
    );

    const totalPages =
        tab === "invoices" ? paginatedInvoices.totalPages : data.totalPages;

    // اگر شماره‌ی صفحه از تعداد صفحات بیشتر بود (مثلاً بعد از حذف) برگرد به آخرین صفحه
    useEffect(() => {
        if (!loading && warehouseId !== null && currentPage > totalPages) {
            router.replace(buildUrl(tab, totalPages));
        }
    }, [loading, warehouseId, currentPage, totalPages, router, buildUrl, tab]);

    /* ------------------------------ داده‌ها ------------------------------ */

    const products = data.products;
    const stockInfos = data.stockInfos;
    const transactions = data.transactions;
    const orderTasks = data.orderTasks;
    const categories = data.categories;
    const taskItems = data.tasks;
    const adminCategories = data.categories as AdminCategory[];
    const warehouseStaff = data.staffList as unknown as WarehouseStaff[];
    const taskEmployeeId = myStaff?.id ?? null;

    const stockByProduct = useMemo(
        () => new Map(stockInfos.map((item) => [item.product, item])),
        [stockInfos],
    );

    const productNames = useMemo(
        () => Object.fromEntries(products.map((p) => [p.id, p.name])),
        [products],
    );

    const qualityTasks = useMemo(
        () => taskItems.filter((task) => task.quality_control_id !== null),
        [taskItems],
    );

    const pendingQualityTasks = useMemo(
        () => qualityTasks.filter((task) => task.status === "pending"),
        [qualityTasks],
    );

    const paginatedProducts = { items: products, totalPages: data.totalPages };
    const paginatedTasks = { items: taskItems, totalPages: data.totalPages };
    const paginatedStock = { items: stockInfos, totalPages: data.totalPages };
    const paginatedTransactions = { items: transactions, totalPages: data.totalPages };
    const paginatedOrders = { items: orderTasks, totalPages: data.totalPages };
    const paginatedDeadlines = { items: data.deadlines, totalPages: data.totalPages };
    const paginatedCategories = { items: adminCategories, totalPages: data.totalPages };
    const paginatedStaff = { items: warehouseStaff, totalPages: data.totalPages };

    /* ------------------------------ هندلرها ------------------------------ */

    const refresh = useCallback(() => {
        void reload(true);
    }, [reload]);

    const refreshOrderTasks = refresh;

    // لودینگ اصلی هر تب بیرون از محتوا نمایش داده می‌شود
    const adminLoading = false;
    const staffLoading = false;
    const archiveLoading = refreshing;
    const fetchArchive = refresh;

    const handleTaskUpdated = useCallback(
        (updated: ApiWarehouseTask) => {
            setData((current) => ({
                ...current,
                tasks: current.tasks.map((task) =>
                    task.id === updated.id ? updated : task,
                ),
            }));
        },
        [setData],
    );

    const handleProductCreated = useCallback(() => {
        setProductWizardOpen(false);
        goOrReload("products");
    }, [goOrReload]);

    const handleOrderTaskCreated = useCallback(async () => {
        setCreateOrderTaskOpen(false);
        goOrReload("orders");
    }, [goOrReload]);

    const handleViewLedger = useCallback(
        (productId: number) =>
            router.push(buildUrl("ledger", 1, `&product=${productId}`)),
        [router, buildUrl],
    );

    const handleDeleteStaff = useCallback(
        (id: number) => {
            setData((current) => ({
                ...current,
                staffList: current.staffList.filter((staff) => staff.id !== id),
            }));
            void reload(true);
        },
        [setData, reload],
    );

    const handleUpdateStaff = useCallback(
        (updated: WarehouseStaff) => {
            setData((current) => ({
                ...current,
                staffList: current.staffList.map((staff) =>
                    staff.id === updated.id
                        ? (updated as unknown as typeof staff)
                        : staff,
                ),
            }));
        },
        [setData],
    );

    const handleStaffSuccess = useCallback(() => goOrReload("staff"), [goOrReload]);

    const handleDeleteCategory = useCallback(
        (id: number) => {
            setData((current) => ({
                ...current,
                categories: current.categories.filter((c) => c.id !== id),
            }));
            void reload(true);
        },
        [setData, reload],
    );

    const handleUpdateCategory = useCallback(
        (updated: AdminCategory) => {
            setData((current) => ({
                ...current,
                categories: current.categories.map((c) =>
                    c.id === updated.id ? updated : c,
                ),
            }));
        },
        [setData],
    );

    const handleCategorySuccess = useCallback(() => {
        setShowCategoryModal(false);
        void reload(true);
    }, [reload]);

    const handleLimitsSaved = useCallback(() => {
        setLimitsStock(null);
        void reload(true);
    }, [reload]);

    const renderEmpty = useCallback(
        (text: string) => (
            <p
                className="col-span-full py-16 text-center text-[12.5px]"
                style={{ color: muted(isDark) }}
            >
                {text}
            </p>
        ),
        [isDark],
    );

    if (!ready) {
        return (
            <div
                dir="rtl"
                className="flex min-h-screen items-center justify-center"
                style={{
                    background: isDark ? "#0f172a" : "#f8fafc",
                }}
            >
                <Loader2
                    size={24}
                    className="animate-spin"
                    style={{ color: "#6366f1" }}
                />
            </div>
        );
    }

    if (!limitedAccess) {
        return (
            <div
                dir="rtl"
                className="flex min-h-screen items-center justify-center p-6"
                style={{
                    background: isDark ? "#0f172a" : "#f8fafc",
                }}
            >
                <div
                    className="w-full max-w-md rounded-3xl border p-8 text-center"
                    style={{
                        background: cardBg(isDark),
                        borderColor: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(15,23,42,0.06)",
                        boxShadow: cardShadow(isDark),
                    }}
                >
                    <div
                        className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{
                            background: isDark
                                ? "rgba(99,102,241,0.12)"
                                : "rgba(99,102,241,0.08)",
                        }}
                    >
                        <Boxes
                            size={18}
                            className="text-indigo-500"
                        />
                    </div>

                    <h2 className="mt-5 text-[14px] font-extrabold text-gray-900 dark:text-white">
                        دسترسی به انبار ندارید
                    </h2>

                    <p className="mt-2 text-[11.5px] leading-7 text-gray-500 dark:text-gray-400">
                        حساب کاربری شما امکان مشاهده اطلاعات انبار را ندارد.
                    </p>
                </div>
            </div>
        );
    }


    const counts: Record<string, number> = {
        products: tab === "products" ? data.total : 0,
        tasks: tab === "tasks" ? data.total : 0,
        orders: tab === "orders" ? data.total : 0,
        deadlines: tab === "deadlines" ? data.total : 0,
        categories: tab === "categories" ? data.total : 0,
        staff: tab === "staff" ? data.total : 0,
        invoices: tab === "invoices" ? salesInvoices.length : 0,
    };

    const visibleTabs = TABS.filter(
        ([id]) => hasFullWarehouseAccess || LIMITED_TABS.includes(id),
    );

    return (
        <div
            dir="rtl"
            className="flex min-h-screen flex-col gap-6 p-6"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                            background: isDark
                                ? "rgba(99,102,241,0.14)"
                                : "rgba(99,102,241,0.08)",
                        }}
                    >
                        <Boxes
                            size={18}
                            className="text-indigo-500"
                        />
                    </div>

                    <div>
                        <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                            {warehouse ? `انبار ${warehouse.name}` : "انبار"}
                        </h1>

                        <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">
                            مدیریت وظایف، محصولات، موجودی و فرآیندهای ورود و خروج کالا
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => router.push(basePath)}
                    className="flex h-10 items-center justify-center gap-2 rounded-2xl px-4 text-[12.5px] font-bold text-indigo-500 transition-colors hover:bg-indigo-500/10"
                >
                    تغییر انبار
                </motion.button>

                <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={refresh}
                    disabled={refreshing}
                    className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                    <Loader2
                        size={15}
                        className={refreshing ? "animate-spin" : ""}
                    />
                    بروزرسانی
                </motion.button>
                </div>
            </div>

            <div
                className="flex flex-wrap gap-2 rounded-2xl p-1.5"
                style={{
                    background: isDark
                        ? "rgba(255,255,255,.04)"
                        : "rgba(15,23,42,.04)",
                }}
            >
                {visibleTabs.map(([id, label, Icon]) => {
                    const active = tab === id;
                    const count = counts[id] ?? 0;

                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => goToTab(id)}
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
                                    ? "0 4px 12px rgba(99,102,241,.25)"
                                    : "none",
                            }}
                        >
                            <Icon size={14} />
                            {label}

                            {count > 0 && (
                                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] text-white">
                                    {count}
                                </span>
                            )}

                            {id === "tasks" &&
                                pendingQualityTasks.length > 0 && (
                                    <span
                                        className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] text-white"
                                        style={{ background: "#8b5cf6" }}
                                    >
                                        {pendingQualityTasks.length}
                                    </span>
                                )}
                        </button>
                    );
                })}
            </div>

            {error && (
                <div
                    className="rounded-2xl border px-4 py-3 text-[12px] font-bold"
                    style={{
                        background: isDark
                            ? "rgba(239,68,68,.08)"
                            : "rgba(239,68,68,.05)",
                        borderColor: "rgba(239,68,68,.15)",
                        color: "#ef4444",
                    }}
                >
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2
                        size={22}
                        className="animate-spin"
                        style={{ color: "#6366f1" }}
                    />
                </div>
            ) : (
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${tab}-${currentPage}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                >
                    {tab === "overview" &&
                        hasFullWarehouseAccess && (
                            <div className="space-y-6">
                                <WarehouseOverview
                                    products={products}
                                    stockInfos={stockInfos}
                                    transactions={transactions}
                                    tasks={taskItems}
                                    orderTasks={orderTasks}
                                />

                                {pendingQualityTasks.length > 0 && (
                                    <div
                                        className="rounded-3xl border p-4"
                                        style={{
                                            background: isDark
                                                ? "rgba(139,92,246,.06)"
                                                : "rgba(139,92,246,.04)",
                                            borderColor:
                                                "rgba(139,92,246,.12)",
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="flex h-10 w-10 items-center justify-center rounded-xl"
                                                style={{
                                                    background:
                                                        "rgba(139,92,246,.1)",
                                                    color: "#8b5cf6",
                                                }}
                                            >
                                                <ShieldCheck size={18} />
                                            </div>

                                            <div>
                                                <p className="text-[12px] font-extrabold text-gray-900 dark:text-white">
                                                    وظایف کنترل کیفیت
                                                </p>

                                                <p className="mt-1 text-[10.5px] text-gray-500 dark:text-gray-400">
                                                    {pendingQualityTasks.length}{" "}
                                                    وظیفه کنترل کیفیت در انتظار انجام است
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    {tab === "products" &&
                        hasFullWarehouseAccess && (
                            <div className="space-y-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                            محصولات انبار
                                        </h2>

                                        <p className="mt-1 text-[11.5px] text-gray-500 dark:text-gray-400">
                                            مدیریت محصولات و عملیات مربوط به موجودی
                                        </p>
                                    </div>

                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() =>
                                            setProductWizardOpen(true)
                                        }
                                        className="flex h-11 items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 text-[13px] font-bold text-white transition-colors hover:bg-indigo-500"
                                    >
                                        <PackagePlus size={16} />
                                        افزودن محصول
                                    </motion.button>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {paginatedProducts.items.length ? (
                                        paginatedProducts.items.map(
                                            (product, index) => (
                                                <WarehouseEmployeeProductCard
                                                    key={product.id}
                                                    product={product}
                                                    stockInfo={
                                                        stockByProduct.get(
                                                            product.id,
                                                        ) ?? null
                                                    }
                                                    index={index}
                                                    categories={categories}
                                                    staff={
                                                        myStaff
                                                            ? [myStaff]
                                                            : []
                                                    }
                                                    performedById={
                                                        myStaff?.id ?? null
                                                    }
                                                    warehouseId={warehouseId}
                                                    onUpdated={refresh}
                                                    onStockChanged={refresh}
                                                    onDeleted={refresh}
                                                />
                                            ),
                                        )
                                    ) : (
                                        renderEmpty(
                                            "محصولی برای نمایش وجود ندارد",
                                        )
                                    )}
                                </div>

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={
                                        paginatedProducts.totalPages
                                    }
                                    onPageChange={goToPage}
                                    isDark={isDark}
                                />
                            </div>
                        )}

                    {tab === "tasks" && (
                        <div className="space-y-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        وظایف انبار
                                    </h2>

                                    <p className="mt-1 text-[11.5px] text-gray-500 dark:text-gray-400">
                                        وظایف دریافت کالا و درخواست‌های کنترل کیفیت
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {hasFullWarehouseAccess &&
                                        qualityTasks.length > 0 && (
                                            <div
                                                className="flex items-center gap-2 rounded-xl px-3 py-2"
                                                style={{
                                                    background: isDark
                                                        ? "rgba(139,92,246,.08)"
                                                        : "rgba(139,92,246,.06)",
                                                    color: "#8b5cf6",
                                                }}
                                            >
                                                <ShieldCheck size={15} />

                                                <span className="text-[10.5px] font-extrabold">
                                                    {qualityTasks.length}{" "}
                                                    وظیفه کنترل کیفیت
                                                </span>
                                            </div>
                                        )}

                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() =>
                                            setCreateOrderTaskOpen(true)
                                        }
                                        className="flex h-11 items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 text-[13px] font-bold text-white transition-colors hover:bg-indigo-500"
                                    >
                                        <Plus size={15} />
                                        ثبت وظیفه برای انبار
                                    </motion.button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {paginatedTasks.items.length ? (
                                    paginatedTasks.items.map(
                                        (task, index) => (
                                            <WarehouseEmployeeTaskCard
                                                key={task.id}
                                                task={task}
                                                index={index}
                                                employeeId={
                                                    taskEmployeeId
                                                }
                                                onUpdated={
                                                    handleTaskUpdated
                                                }
                                            />
                                        ),
                                    )
                                ) : (
                                    renderEmpty(
                                        "وظیفه‌ای برای شما وجود ندارد",
                                    )
                                )}
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={paginatedTasks.totalPages}
                                onPageChange={goToPage}
                                isDark={isDark}
                            />
                        </div>
                    )}

                    {tab === "stock" && (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {paginatedStock.items.length ? (
                                    paginatedStock.items.map(
                                        (stock, index) => (
                                            <StockCard
                                                key={stock.id}
                                                stock={stock}
                                                index={index}
                                                isDark={isDark}
                                                productNames={productNames}
                                                onViewLedger={
                                                    hasFullWarehouseAccess
                                                        ? handleViewLedger
                                                        : undefined
                                                }
                                                onEditLimits={
                                                    hasFullWarehouseAccess
                                                        ? setLimitsStock
                                                        : undefined
                                                }
                                            />
                                        ),
                                    )
                                ) : (
                                    renderEmpty(
                                        "موجودی‌ای برای نمایش وجود ندارد",
                                    )
                                )}
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={paginatedStock.totalPages}
                                onPageChange={goToPage}
                                isDark={isDark}
                            />
                        </>
                    )}

                    {tab === "transactions" &&
                        hasFullWarehouseAccess && (
                            <>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {paginatedTransactions.items.length ? (
                                        paginatedTransactions.items.map(
                                            (transaction) => (
                                                <WarehouseEmployeeTransactionCard
                                                    key={transaction.id}
                                                    transaction={transaction}
                                                />
                                            ),
                                        )
                                    ) : (
                                        renderEmpty(
                                            "تراکنشی برای نمایش وجود ندارد",
                                        )
                                    )}
                                </div>

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={
                                        paginatedTransactions.totalPages
                                    }
                                    onPageChange={goToPage}
                                    isDark={isDark}
                                />
                            </>
                        )}

                    {tab === "orders" && (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {paginatedOrders.items.length ? (
                                    paginatedOrders.items.map(
                                        (orderTask, index) => (
                                            <WarehouseEmployeeOrderTaskCard
                                                key={orderTask.id}
                                                orderTask={orderTask}
                                                products={products}
                                                index={index}
                                                isStaff={!!myStaff}
                                                staffId={
                                                    myStaff?.id ?? null
                                                }
                                                canChangeStatus={
                                                    hasFullWarehouseAccess
                                                }
                                                onRefresh={
                                                    refreshOrderTasks
                                                }
                                            />
                                        ),
                                    )
                                ) : (
                                    renderEmpty(
                                        "درخواست داخلی‌ای برای انبار ثبت نشده است",
                                    )
                                )}
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={paginatedOrders.totalPages}
                                onPageChange={goToPage}
                                isDark={isDark}
                            />
                        </>
                    )}

                    {tab === "deadlines" &&
                        hasFullWarehouseAccess && (
                            <>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {paginatedDeadlines.items.length ? (
                                        paginatedDeadlines.items.map(
                                            (deadline, index) => {
                                                const order =
                                                    orderTasks.find(
                                                        (item) =>
                                                            item.id ===
                                                            deadline.order_task,
                                                    );

                                                return (
                                                    <DeadlineCard
                                                        key={deadline.id}
                                                        deadline={deadline}
                                                        orderTitle={
                                                            order
                                                                ? getOrderTaskTitle(
                                                                    order,
                                                                )
                                                                : `سفارش #${deadline.order_task ?? "—"}`
                                                        }
                                                        index={index}
                                                        isDark={isDark}
                                                    />
                                                );
                                            },
                                        )
                                    ) : (
                                        renderEmpty(
                                            "مهلتی برای نمایش وجود ندارد",
                                        )
                                    )}
                                </div>

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={
                                        paginatedDeadlines.totalPages
                                    }
                                    onPageChange={goToPage}
                                    isDark={isDark}
                                />
                            </>
                        )}

                    {tab === "ledger" &&
                        hasFullWarehouseAccess && (
                            <WarehouseEmployeeStockLedger
                                products={products}
                                stockInfos={stockInfos}
                                transactions={transactions}
                                defaultProductId={ledgerProductId}
                            />
                        )}

                    {tab === "categories" &&
                        hasFullWarehouseAccess && (
                            <div className="space-y-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                            دسته‌بندی محصولات
                                        </h2>

                                        <p className="mt-1 text-[11.5px] text-gray-500 dark:text-gray-400">
                                            دسته‌بندی‌های موجود در انبار
                                        </p>
                                    </div>

                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() =>
                                            setShowCategoryModal(true)
                                        }
                                        className="flex h-11 items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 text-[13px] font-bold text-white transition-colors hover:bg-indigo-500"
                                    >
                                        <Package size={16} />
                                        افزودن دسته‌بندی
                                    </motion.button>
                                </div>

                                {adminLoading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2
                                            size={22}
                                            className="animate-spin"
                                            style={{
                                                color: "#6366f1",
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                            {paginatedCategories.items.length ? (
                                                paginatedCategories.items.map(
                                                    (
                                                        category,
                                                        index,
                                                    ) => (
                                                        <WarehouseCategoryCard
                                                            key={
                                                                category.id
                                                            }
                                                            category={
                                                                category
                                                            }
                                                            index={
                                                                index
                                                            }
                                                            onDelete={
                                                                handleDeleteCategory
                                                            }
                                                            onUpdated={
                                                                handleUpdateCategory
                                                            }
                                                        />
                                                    ),
                                                )
                                            ) : (
                                                renderEmpty(
                                                    "هنوز دسته‌بندی ثبت نشده",
                                                )
                                            )}
                                        </div>

                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={
                                                paginatedCategories.totalPages
                                            }
                                            onPageChange={goToPage}
                                            isDark={isDark}
                                        />
                                    </>
                                )}
                            </div>
                        )}

                    {tab === "staff" &&
                        hasFullWarehouseAccess && (
                            <div className="space-y-5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                            انباردارها
                                        </h2>
                                        <p className="mt-1 text-[11.5px] text-gray-500 dark:text-gray-400">
                                            مدیریت انباردارهای ثبت‌شده در سیستم
                                        </p>
                                    </div>
                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setShowAddStaffModal(true)}
                                        className="flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-[11.5px] font-bold text-white transition-colors hover:bg-blue-500"
                                    >
                                        <Plus size={15} />
                                        افزودن انباردار
                                    </motion.button>
                                </div>

                                {staffLoading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2
                                            size={22}
                                            className="animate-spin"
                                            style={{ color: "#6366f1" }}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {paginatedStaff.items.length ? (
                                                paginatedStaff.items.map((staff, index) => (
                                                    <WarehouseStaffCard
                                                        key={staff.id}
                                                        staff={staff}
                                                        index={index}
                                                        onDelete={handleDeleteStaff}
                                                        onUpdated={handleUpdateStaff}
                                                    />
                                                ))
                                            ) : (
                                                renderEmpty("هنوز انبارداری ثبت نشده است")
                                            )}
                                        </div>

                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={paginatedStaff.totalPages}
                                            onPageChange={goToPage}
                                            isDark={isDark}
                                        />
                                    </>
                                )}
                            </div>
                        )}

                    {tab === "invoices" &&
                        hasFullWarehouseAccess && (
                            <div className="space-y-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                                            style={{
                                                background: isDark
                                                    ? "rgba(99,102,241,0.14)"
                                                    : "rgba(99,102,241,0.08)",
                                            }}
                                        >
                                            <FileText
                                                size={18}
                                                className="text-indigo-500"
                                            />
                                        </div>

                                        <div>
                                            <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                                فاکتورهای فروش
                                            </h2>

                                            <p className="mt-1 text-[11.5px] text-gray-500 dark:text-gray-400">
                                                فاکتورهای صادر شده بر اساس سفارش‌های آرشیو شده
                                            </p>
                                        </div>
                                    </div>

                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => fetchArchive()}
                                        disabled={archiveLoading}
                                        className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        <Loader2
                                            size={14}
                                            className={
                                                archiveLoading
                                                    ? "animate-spin"
                                                    : ""
                                            }
                                        />
                                        بروزرسانی
                                    </motion.button>
                                </div>

                                {archiveLoading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2
                                            size={22}
                                            className="animate-spin"
                                            style={{
                                                color: "#6366f1",
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {paginatedInvoices.items.length ? (
                                                paginatedInvoices.items.map(
                                                    (
                                                        invoice: SalesInvoice,
                                                        index: number,
                                                    ) => (
                                                        <OrderInvoiceCard
                                                            key={
                                                                invoice.orderTaskId
                                                            }
                                                            invoice={
                                                                invoice
                                                            }
                                                            index={
                                                                index
                                                            }
                                                            onOpen={
                                                                setSelectedInvoice
                                                            }
                                                        />
                                                    ),
                                                )
                                            ) : (
                                                renderEmpty(
                                                    "فاکتوری برای نمایش وجود ندارد",
                                                )
                                            )}
                                        </div>

                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={
                                                paginatedInvoices.totalPages
                                            }
                                            onPageChange={goToPage}
                                            isDark={isDark}
                                        />
                                    </>
                                )}
                            </div>
                        )}
                </motion.div>
            </AnimatePresence>
            )}

            <StockLimitsModal
                isOpen={!!limitsStock}
                stock={limitsStock}
                onClose={() => setLimitsStock(null)}
                onSaved={handleLimitsSaved}
            />

            <CreateOrderTaskModal
                isOpen={createOrderTaskOpen}
                onClose={() =>
                    setCreateOrderTaskOpen(false)
                }
                onCreated={handleOrderTaskCreated}
            />

            {hasFullWarehouseAccess && (
                <>
                    <WarehouseEmployeeProductWizardModal
                        isOpen={productWizardOpen}
                        onClose={() => setProductWizardOpen(false)}
                        categories={categories}
                        staff={myStaff ? [myStaff] : []}
                        performedById={myStaff?.id ?? null}
                        warehouseId={warehouseId}
                        onCreated={handleProductCreated}
                    />

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

                    <OrderInvoiceModal
                        isOpen={!!selectedInvoice}
                        onClose={() =>
                            setSelectedInvoice(null)
                        }
                        invoice={selectedInvoice}
                    />

                    <AddWarehouseStaffModal
                        isOpen={showAddStaffModal}
                        onClose={() => setShowAddStaffModal(false)}
                        onSuccess={handleStaffSuccess}
                    />
                </>
            )}
        </div>
    );
}
