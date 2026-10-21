"use client";

import { ComponentType, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
    BellRing,
    Boxes,
    ClipboardList,
    Archive,
    FileText,
    LayoutGrid,
    Loader2,
    Package,
    PackagePlus,
    PackageSearch,
    Plus,
    ReceiptText,
    ShieldCheck,
    Power,
    PowerOff,
    ShieldAlert,
    ShoppingBag,
    UploadCloud,
    UsersRound,
    UserPlus,
} from "lucide-react";
import { useTheme } from "next-themes";

import WarehouseOverview from "@/components/admin/warehouse/Warehouseoverview";
import AddCategoryModal from "@/components/admin/warehouse/AddCategoryModal";
import WarehouseCategoryCard from "@/components/admin/warehouse/WarehouseCategoryCard";
import WarehouseStaffCard, { type WarehouseStaff } from "@/components/admin/warehouse/WarehouseStaffCard";
import AddWarehouseStaffModal from "@/components/admin/warehouse/AddWarehouseStaffModal";
import StockLimitsModal from "@/components/admin/warehouse/StockLimitsModal";
import { WarehouseStatusModal } from "@/components/admin/warehouse/WarehouseFormModals";
import WarehouseTaskArchiveCard from "@/components/admin/warehouse/WarehouseTaskArchiveCard";
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
import WarehouseEmployeeBulkImportModal from "@/components/admin/warehouse/WarehouseEmployeeBulkImportModal";
import WarehouseEmployeeTaskCard from "@/components/user/warehouse/WarehouseEmployeeTaskCard";
import WarehouseEmployeeOrderTaskCard from "@/components/user/warehouse/WarehouseEmployeeOrderTaskCard";
import WarehouseEmployeeStockLedger from "@/components/user/warehouse/Warehouseemployeestockledger";
import OrderInvoiceCard from "@/components/user/warehouse/OrderInvoiceCard";
import OrderInvoiceModal from "@/components/user/warehouse/OrderInvoiceModal";
import ShelfFilterBar from "@/components/user/warehouse/ShelfFilterBar";
import { useWarehouseShelves } from "@/hooks/useWarehouseShelves";
import { useShelfProducts } from "@/hooks/useShelfProducts";
import { buildSalesInvoices, getOrderTaskTitle, paginate } from "@/utils/warehouseEmployee";
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
    ["task-archive", "بایگانی وظایف", Archive],
];

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
        warehouseParam && Number.isFinite(Number(warehouseParam)) ? Number(warehouseParam) : null;
    const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
    const shelfCode = (searchParams.get("shelf") ?? "").trim();
    const productParam = Number(searchParams.get("product"));
    const ledgerProductId = Number.isFinite(productParam) && productParam > 0 ? productParam : null;

    const {
        ready,
        employeeId,
        myStaff,
        assignedWarehouseIds,
        hasFullAccess: hasFullWarehouseAccess,
        limitedAccess,
        isAdmin,
    } = useWarehouseAccess();

    const { warehouses, loading: warehousesLoading, reload: reloadWarehouses } = useWarehouses();
    const warehouse = warehouses.find((item) => item.id === warehouseId) ?? null;
    const warehouseInactive = warehouse !== null && !warehouse.is_active;
    const warehouseBlocked = !isAdmin && warehouseInactive;
    const warehouseResolving = !isAdmin && warehousesLoading;
    const warehouseForbidden =
        !isAdmin && ready && warehouseId !== null && !assignedWarehouseIds.includes(warehouseId);

    const [bulkImportOpen, setBulkImportOpen] = useState(false);
    const [productWizardOpen, setProductWizardOpen] = useState(false);
    const [createOrderTaskOpen, setCreateOrderTaskOpen] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
    const [showAddStaffModal, setShowAddStaffModal] = useState(false);
    const [limitsStock, setLimitsStock] = useState<ApiStockInfo | null>(null);
    const [statusOpen, setStatusOpen] = useState(false);
    const [shelfReloadKey, setShelfReloadKey] = useState(0);

    const tabAllowed = tab === "staff" ? isAdmin : hasFullWarehouseAccess || LIMITED_TABS.includes(tab);

    const { data, setData, loading, refreshing, error, reload } = useWarehouseTab({
        enabled:
            ready &&
            limitedAccess &&
            warehouseId !== null &&
            tabAllowed &&
            !warehouseBlocked &&
            !warehouseForbidden &&
            !warehouseResolving,
        tab,
        warehouseId: warehouseId ?? 0,
        page: currentPage,
        hasFullAccess: hasFullWarehouseAccess,
        employeeId,
    });

    const buildUrl = useCallback(
        (target: Tab, page = 1, extra = "") =>
            `${basePath}/${target}?warehouse=${warehouseId}${page > 1 ? `&page=${page}` : ""}${extra}`,
        [basePath, warehouseId],
    );

    const shelfQuery = useMemo(
        () => (shelfCode ? `&shelf=${encodeURIComponent(shelfCode)}` : ""),
        [shelfCode],
    );

    const goToPage = useCallback(
        (page: number) => router.push(buildUrl(tab, page, tab === "products" ? shelfQuery : "")),
        [router, buildUrl, tab, shelfQuery],
    );

    const handleShelfChange = useCallback(
        (code: string) =>
            router.push(buildUrl("products", 1, code ? `&shelf=${encodeURIComponent(code)}` : "")),
        [router, buildUrl],
    );

    const goToTab = useCallback((target: Tab) => router.push(buildUrl(target)), [router, buildUrl]);

    const goOrReload = useCallback(
        (target: Tab) => {
            if (target === tab && currentPage === 1) void reload(true);
            else router.push(buildUrl(target));
        },
        [tab, currentPage, reload, router, buildUrl],
    );

    useEffect(() => {
        if (warehouseForbidden) router.replace(basePath);
    }, [warehouseForbidden, router, basePath]);

    useEffect(() => {
        if (warehouseId === null) router.replace(basePath);
    }, [warehouseId, router, basePath]);

    useEffect(() => {
        if (ready && warehouseId !== null && !tabAllowed) {
            router.replace(buildUrl(isAdmin ? "overview" : "stock"));
        }
    }, [ready, warehouseId, tabAllowed, isAdmin, router, buildUrl]);

    const salesInvoices = useMemo(() => buildSalesInvoices(data.archived), [data.archived]);
    const paginatedInvoices = useMemo(
        () => paginate(salesInvoices, currentPage, PAGE_SIZE),
        [salesInvoices, currentPage],
    );

    const totalPages = tab === "invoices" ? paginatedInvoices.totalPages : data.totalPages;

    useEffect(() => {
        if (!loading && warehouseId !== null && currentPage > totalPages) {
            router.replace(buildUrl(tab, totalPages));
        }
    }, [loading, warehouseId, currentPage, totalPages, router, buildUrl, tab]);

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

    const shelfFilterActive = tab === "products" && shelfCode !== "";

    const { shelves, loading: shelvesLoading } = useWarehouseShelves(
        tab === "products" && hasFullWarehouseAccess && ready,
        shelfReloadKey,
    );

    const shelfProducts = useShelfProducts({
        shelfCode,
        page: currentPage,
        enabled: shelfFilterActive && hasFullWarehouseAccess && ready,
        reloadKey: shelfReloadKey,
    });

    const paginatedProducts = shelfFilterActive
        ? { items: shelfProducts.items, totalPages: shelfProducts.totalPages }
        : { items: products, totalPages: data.totalPages };
    const paginatedTasks = { items: taskItems, totalPages: data.totalPages };
    const paginatedStock = { items: stockInfos, totalPages: data.totalPages };
    const paginatedTransactions = { items: transactions, totalPages: data.totalPages };
    const paginatedOrders = { items: orderTasks, totalPages: data.totalPages };
    const paginatedDeadlines = { items: data.deadlines, totalPages: data.totalPages };
    const paginatedCategories = { items: adminCategories, totalPages: data.totalPages };
    const paginatedTaskArchive = { items: data.taskArchive, totalPages: data.totalPages };

    const refresh = useCallback(() => {
        void reload(true);
        setShelfReloadKey((key) => key + 1);
    }, [reload]);

    const archiveLoading = refreshing;

    const handleTaskUpdated = useCallback(
        (updated: ApiWarehouseTask) => {
            setData((current) => ({
                ...current,
                tasks: current.tasks.map((task) => (task.id === updated.id ? updated : task)),
            }));
        },
        [setData],
    );

    const handleProductCreated = useCallback(() => {
        setProductWizardOpen(false);
        setShelfReloadKey((key) => key + 1);
        goOrReload("products");
    }, [goOrReload]);

    const handleOrderTaskCreated = useCallback(async () => {
        setCreateOrderTaskOpen(false);
        goOrReload("orders");
    }, [goOrReload]);

    const handleViewLedger = useCallback(
        (productId: number) => router.push(buildUrl("ledger", 1, `&product=${productId}`)),
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
                categories: current.categories.map((c) => (c.id === updated.id ? updated : c)),
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
            <p className="col-span-full py-16 text-center text-[12.5px]" style={{ color: muted(isDark) }}>
                {text}
            </p>
        ),
        [isDark],
    );

    const pageBg = isDark ? "#0f172a" : "#f8fafc";
    const cardBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)";
    const iconBg = isDark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)";

    if (!ready) {
        return (
            <div dir="rtl" className="flex min-h-screen items-center justify-center" style={{ background: pageBg }}>
                <Loader2 size={24} className="animate-spin" style={{ color: "#6366f1" }} />
            </div>
        );
    }

    if (!limitedAccess) {
        return (
            <div dir="rtl" className="flex min-h-screen items-center justify-center p-6" style={{ background: pageBg }}>
                <div
                    className="w-full max-w-md rounded-3xl border p-8 text-center"
                    style={{ background: cardBg(isDark), borderColor: cardBorder, boxShadow: cardShadow(isDark) }}
                >
                    <div
                        className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: iconBg }}
                    >
                        <Boxes size={18} className="text-indigo-500" />
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

    if (warehouseForbidden) return null;

    if (warehouseBlocked) {
        return (
            <div dir="rtl" className="flex min-h-screen items-center justify-center p-6" style={{ background: pageBg }}>
                <div
                    className="w-full max-w-md rounded-3xl border p-8 text-center"
                    style={{ background: cardBg(isDark), borderColor: cardBorder, boxShadow: cardShadow(isDark) }}
                >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
                        <ShieldAlert size={22} className="text-red-500" />
                    </div>
                    <h2 className="mt-5 text-[14px] font-extrabold text-gray-900 dark:text-white">
                        این انبار از دسترس خارج است
                    </h2>
                    <p className="mt-2 text-[11.5px] leading-7 text-gray-500 dark:text-gray-400">
                        انبار «{warehouse?.name}» توسط مدیر غیرفعال شده است و فعلاً امکان استفاده از آن وجود ندارد.
                    </p>
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => router.push(basePath)}
                        className="mt-6 flex h-11 w-full items-center justify-center rounded-2xl bg-indigo-600 text-[12.5px] font-bold text-white transition-colors hover:bg-indigo-500"
                    >
                        بازگشت به انبارها
                    </motion.button>
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
        "task-archive": 0,
    };

    const visibleTabs = TABS.filter(([id]) =>
        id === "staff" ? isAdmin : hasFullWarehouseAccess || LIMITED_TABS.includes(id),
    );

    const addButtonClass =
        "flex h-11 items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 text-[13px] font-bold text-white transition-colors hover:bg-indigo-500";
    const sectionHeaderClass = "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between";
    const titleClass = "text-[14px] font-extrabold text-gray-900 dark:text-white";
    const subtitleClass = "mt-1 text-[11.5px] text-gray-500 dark:text-gray-400";
    const spinner = (
        <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin" style={{ color: "#6366f1" }} />
        </div>
    );

    return (
        <div dir="rtl" className="flex min-h-screen flex-col gap-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                        style={{ background: iconBg }}
                    >
                        <Boxes size={18} className="text-indigo-500" />
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

                    {isAdmin && warehouse && (
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setStatusOpen(true)}
                            className={`flex h-10 items-center justify-center gap-2 rounded-2xl px-4 text-[12.5px] font-bold transition-colors ${warehouse.is_active
                                ? "text-amber-500 hover:bg-amber-500/10"
                                : "text-emerald-500 hover:bg-emerald-500/10"
                                }`}
                        >
                            {warehouse.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                            {warehouse.is_active ? "غیرفعال‌سازی انبار" : "فعال‌سازی انبار"}
                        </motion.button>
                    )}

                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={refresh}
                        disabled={refreshing}
                        className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <Loader2 size={15} className={refreshing ? "animate-spin" : ""} />
                        بروزرسانی
                    </motion.button>
                </div>
            </div>

            {isAdmin && warehouseInactive && (
                <div className="flex items-center gap-2.5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[11.5px] font-bold text-amber-600 dark:text-amber-400">
                    <ShieldAlert size={15} className="shrink-0" />
                    این انبار غیرفعال است و برای انباردارها از دسترس خارج شده است.
                </div>
            )}

            <div
                className="flex flex-wrap gap-2 rounded-2xl p-1.5"
                style={{ background: isDark ? "rgba(255,255,255,.04)" : "rgba(15,23,42,.04)" }}
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
                                background: active ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "transparent",
                                color: active ? "#fff" : isDark ? "#94a3b8" : "#475569",
                                boxShadow: active ? "0 4px 12px rgba(99,102,241,.25)" : "none",
                            }}
                        >
                            <Icon size={14} />
                            {label}
                            {count > 0 && (
                                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] text-white">
                                    {count}
                                </span>
                            )}
                            {id === "tasks" && pendingQualityTasks.length > 0 && (
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
                        background: isDark ? "rgba(239,68,68,.08)" : "rgba(239,68,68,.05)",
                        borderColor: "rgba(239,68,68,.15)",
                        color: "#ef4444",
                    }}
                >
                    {error}
                </div>
            )}

            {loading ? (
                spinner
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${tab}-${currentPage}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                    >
                        {tab === "overview" && hasFullWarehouseAccess && (
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
                                            background: isDark ? "rgba(139,92,246,.06)" : "rgba(139,92,246,.04)",
                                            borderColor: "rgba(139,92,246,.12)",
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="flex h-10 w-10 items-center justify-center rounded-xl"
                                                style={{ background: "rgba(139,92,246,.1)", color: "#8b5cf6" }}
                                            >
                                                <ShieldCheck size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[12px] font-extrabold text-gray-900 dark:text-white">
                                                    وظایف کنترل کیفیت
                                                </p>
                                                <p className="mt-1 text-[10.5px] text-gray-500 dark:text-gray-400">
                                                    {pendingQualityTasks.length} وظیفه کنترل کیفیت در انتظار انجام است
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {tab === "products" && hasFullWarehouseAccess && (
                            <div className="space-y-5">
                                <div className={sectionHeaderClass}>
                                    <div>
                                        <h2 className={titleClass}>محصولات انبار</h2>
                                        <p className={subtitleClass}>مدیریت محصولات و عملیات مربوط به موجودی</p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {!isAdmin && myStaff && (
                                            <motion.button
                                                type="button"
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => setBulkImportOpen(true)}
                                                className="flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 text-[13px] font-bold text-white transition-colors hover:bg-emerald-500"
                                            >
                                                <UploadCloud size={16} />
                                                ثبت گروهی محصولات
                                            </motion.button>
                                        )}

                                        <motion.button
                                            type="button"
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => setProductWizardOpen(true)}
                                            className={addButtonClass}
                                        >
                                            <PackagePlus size={16} />
                                            افزودن محصول
                                        </motion.button>
                                    </div>
                                </div>

                                <ShelfFilterBar
                                    shelves={shelves}
                                    value={shelfCode}
                                    onChange={handleShelfChange}
                                    loading={shelvesLoading}
                                />

                                {shelfFilterActive && shelfProducts.error && (
                                    <p className="text-center text-[12px] font-semibold text-red-500">
                                        {shelfProducts.error}
                                    </p>
                                )}

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {paginatedProducts.items.length
                                        ? paginatedProducts.items.map((product, index) => (
                                            <WarehouseEmployeeProductCard
                                                key={product.id}
                                                product={product}
                                                stockInfo={stockByProduct.get(product.id) ?? null}
                                                index={index}
                                                categories={categories}
                                                staff={myStaff ? [myStaff] : []}
                                                performedById={myStaff?.id ?? null}
                                                warehouseId={warehouseId}
                                                onUpdated={refresh}
                                                onStockChanged={refresh}
                                                onDeleted={refresh}
                                            />
                                        ))
                                        : renderEmpty(
                                            shelfFilterActive
                                                ? shelfProducts.loading
                                                    ? "در حال دریافت محصولات قفسه..."
                                                    : "محصولی در این قفسه یافت نشد"
                                                : "محصولی برای نمایش وجود ندارد",
                                        )}
                                </div>

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={paginatedProducts.totalPages}
                                    onPageChange={goToPage}
                                    isDark={isDark}
                                />
                            </div>
                        )}

                        {tab === "tasks" && (
                            <div className="space-y-5">
                                <div className={sectionHeaderClass}>
                                    <div>
                                        <h2 className={titleClass}>وظایف انبار</h2>
                                        <p className={subtitleClass}>وظایف دریافت کالا و درخواست‌های کنترل کیفیت</p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {hasFullWarehouseAccess && qualityTasks.length > 0 && (
                                            <div
                                                className="flex items-center gap-2 rounded-xl px-3 py-2"
                                                style={{
                                                    background: isDark ? "rgba(139,92,246,.08)" : "rgba(139,92,246,.06)",
                                                    color: "#8b5cf6",
                                                }}
                                            >
                                                <ShieldCheck size={15} />
                                                <span className="text-[10.5px] font-extrabold">
                                                    {qualityTasks.length} وظیفه کنترل کیفیت
                                                </span>
                                            </div>
                                        )}

                                        <motion.button
                                            type="button"
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => setCreateOrderTaskOpen(true)}
                                            className={addButtonClass}
                                        >
                                            <Plus size={15} />
                                            ثبت وظیفه برای انبار
                                        </motion.button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {paginatedTasks.items.length
                                        ? paginatedTasks.items.map((task, index) => (
                                            <WarehouseEmployeeTaskCard
                                                key={task.id}
                                                task={task}
                                                index={index}
                                                employeeId={taskEmployeeId}
                                                onUpdated={handleTaskUpdated}
                                            />
                                        ))
                                        : renderEmpty("وظیفه‌ای برای شما وجود ندارد")}
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
                                    {paginatedStock.items.length
                                        ? paginatedStock.items.map((stock, index) => (
                                            <StockCard
                                                key={stock.id}
                                                stock={stock}
                                                index={index}
                                                isDark={isDark}
                                                productNames={productNames}
                                                onViewLedger={hasFullWarehouseAccess ? handleViewLedger : undefined}
                                                onEditLimits={hasFullWarehouseAccess ? setLimitsStock : undefined}
                                            />
                                        ))
                                        : renderEmpty("موجودی‌ای برای نمایش وجود ندارد")}
                                </div>

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={paginatedStock.totalPages}
                                    onPageChange={goToPage}
                                    isDark={isDark}
                                />
                            </>
                        )}

                        {tab === "transactions" && hasFullWarehouseAccess && (
                            <>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {paginatedTransactions.items.length
                                        ? paginatedTransactions.items.map((transaction) => (
                                            <WarehouseEmployeeTransactionCard
                                                key={transaction.id}
                                                transaction={transaction}
                                            />
                                        ))
                                        : renderEmpty("تراکنشی برای نمایش وجود ندارد")}
                                </div>

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={paginatedTransactions.totalPages}
                                    onPageChange={goToPage}
                                    isDark={isDark}
                                />
                            </>
                        )}

                        {tab === "orders" && (
                            <>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {paginatedOrders.items.length
                                        ? paginatedOrders.items.map((orderTask, index) => (
                                            <WarehouseEmployeeOrderTaskCard
                                                key={orderTask.id}
                                                orderTask={orderTask}
                                                products={products}
                                                index={index}
                                                isStaff={!!myStaff}
                                                staffId={myStaff?.id ?? null}
                                                canChangeStatus={hasFullWarehouseAccess}
                                                warehouseId={warehouseId}
                                                onRefresh={refresh}
                                            />
                                        ))
                                        : renderEmpty("درخواست داخلی‌ای برای انبار ثبت نشده است")}
                                </div>

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={paginatedOrders.totalPages}
                                    onPageChange={goToPage}
                                    isDark={isDark}
                                />
                            </>
                        )}

                        {tab === "deadlines" && hasFullWarehouseAccess && (
                            <>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {paginatedDeadlines.items.length
                                        ? paginatedDeadlines.items.map((deadline, index) => {
                                            const order = orderTasks.find((item) => item.id === deadline.order_task);
                                            return (
                                                <DeadlineCard
                                                    key={deadline.id}
                                                    deadline={deadline}
                                                    orderTitle={
                                                        order
                                                            ? getOrderTaskTitle(order)
                                                            : `سفارش #${deadline.order_task ?? "—"}`
                                                    }
                                                    index={index}
                                                    isDark={isDark}
                                                />
                                            );
                                        })
                                        : renderEmpty("مهلتی برای نمایش وجود ندارد")}
                                </div>

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={paginatedDeadlines.totalPages}
                                    onPageChange={goToPage}
                                    isDark={isDark}
                                />
                            </>
                        )}

                        {tab === "ledger" && hasFullWarehouseAccess && (
                            <WarehouseEmployeeStockLedger
                                products={products}
                                stockInfos={stockInfos}
                                transactions={transactions}
                                defaultProductId={ledgerProductId}
                            />
                        )}

                        {tab === "categories" && hasFullWarehouseAccess && (
                            <div className="space-y-5">
                                <div className={sectionHeaderClass}>
                                    <div>
                                        <h2 className={titleClass}>دسته‌بندی محصولات</h2>
                                        <p className={subtitleClass}>دسته‌بندی‌های موجود در انبار</p>
                                    </div>

                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setShowCategoryModal(true)}
                                        className={addButtonClass}
                                    >
                                        <Package size={16} />
                                        افزودن دسته‌بندی
                                    </motion.button>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {paginatedCategories.items.length
                                        ? paginatedCategories.items.map((category, index) => (
                                            <WarehouseCategoryCard
                                                key={category.id}
                                                category={category}
                                                index={index}
                                                onDelete={handleDeleteCategory}
                                                onUpdated={handleUpdateCategory}
                                            />
                                        ))
                                        : renderEmpty("هنوز دسته‌بندی ثبت نشده")}
                                </div>

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={paginatedCategories.totalPages}
                                    onPageChange={goToPage}
                                    isDark={isDark}
                                />
                            </div>
                        )}

                        {tab === "staff" && isAdmin && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className={titleClass}>انباردارها</h2>
                                        <p className="mt-0.5 text-[11px] text-gray-400">
                                            مدیریت انبارداران و دسترسی‌های این انبار
                                        </p>
                                    </div>
                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setShowAddStaffModal(true)}
                                        className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-[12px] font-bold text-white shadow-md shadow-indigo-500/20 transition-colors hover:bg-indigo-500"
                                    >
                                        <UserPlus size={14} />
                                        افزودن انباردار
                                    </motion.button>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {(Array.isArray(warehouseStaff) ? warehouseStaff : []).map((staffMember, idx) => (
                                        <WarehouseStaffCard
                                            key={staffMember.id}
                                            staff={staffMember}
                                            index={idx}
                                            onDelete={handleDeleteStaff}
                                            onUpdated={refresh}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {tab === "task-archive" && hasFullWarehouseAccess && (
                            <div className="space-y-5">
                                <div>
                                    <h2 className={titleClass}>بایگانی وظایف انبار</h2>
                                    <p className={subtitleClass}>وظایف دریافت کالا که تکمیل و بایگانی شده‌اند</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {paginatedTaskArchive.items.length
                                        ? paginatedTaskArchive.items.map((item, index) => (
                                            <WarehouseTaskArchiveCard key={item.id} item={item} index={index} />
                                        ))
                                        : renderEmpty("وظیفه‌ی بایگانی‌شده‌ای وجود ندارد")}
                                </div>

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={paginatedTaskArchive.totalPages}
                                    onPageChange={goToPage}
                                    isDark={isDark}
                                />
                            </div>
                        )}

                        {tab === "invoices" && hasFullWarehouseAccess && (
                            <div className="space-y-5">
                                <div className={sectionHeaderClass}>
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                                            style={{ background: iconBg }}
                                        >
                                            <FileText size={18} className="text-indigo-500" />
                                        </div>
                                        <div>
                                            <h2 className={titleClass}>فاکتورهای فروش</h2>
                                            <p className={subtitleClass}>فاکتورهای صادر شده بر اساس سفارش‌های آرشیو شده</p>
                                        </div>
                                    </div>

                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.97 }}
                                        onClick={refresh}
                                        disabled={archiveLoading}
                                        className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        <Loader2 size={14} className={archiveLoading ? "animate-spin" : ""} />
                                        بروزرسانی
                                    </motion.button>
                                </div>

                                {archiveLoading ? (
                                    spinner
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {paginatedInvoices.items.length
                                                ? paginatedInvoices.items.map((invoice: SalesInvoice, index: number) => (
                                                    <OrderInvoiceCard
                                                        key={invoice.archiveId}
                                                        invoice={invoice}
                                                        index={index}
                                                        onOpen={setSelectedInvoice}
                                                    />
                                                ))
                                                : renderEmpty("فاکتوری برای نمایش وجود ندارد")}
                                        </div>

                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={paginatedInvoices.totalPages}
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

            <WarehouseStatusModal
                warehouse={statusOpen ? warehouse : null}
                onClose={() => setStatusOpen(false)}
                onChanged={() => {
                    setStatusOpen(false);
                    void reloadWarehouses();
                }}
            />

            <StockLimitsModal
                isOpen={!!limitsStock}
                stock={limitsStock}
                onClose={() => setLimitsStock(null)}
                onSaved={handleLimitsSaved}
            />

            <CreateOrderTaskModal
                warehouseId={warehouseId}
                isOpen={createOrderTaskOpen}
                onClose={() => setCreateOrderTaskOpen(false)}
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

                    {!isAdmin && myStaff && (
                        <WarehouseEmployeeBulkImportModal
                            isOpen={bulkImportOpen}
                            onClose={() => setBulkImportOpen(false)}
                            performedById={myStaff.id}
                            warehouseId={warehouseId}
                            onCompleted={refresh}
                        />
                    )}

                    <AnimatePresence>
                        {showCategoryModal && (
                            <AddCategoryModal
                                isOpen={showCategoryModal}
                                onClose={() => setShowCategoryModal(false)}
                                onSuccess={handleCategorySuccess}
                            />
                        )}
                    </AnimatePresence>

                    <OrderInvoiceModal
                        isOpen={!!selectedInvoice}
                        onClose={() => setSelectedInvoice(null)}
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