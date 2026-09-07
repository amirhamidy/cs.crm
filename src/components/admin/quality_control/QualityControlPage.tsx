"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Activity,
    CheckCircle2,
    ChevronDown,
    ClipboardCheck,
    LayoutDashboard,
    Plus,
    RefreshCw,
    Search,
    ShieldCheck,
    SlidersHorizontal,
    Users,
    X,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type {
    ApiQualityControlEmployee,
    ApiQualityControlItem,
    QualityControlActionResponse,
    QualityControlStatus,
} from "@/types/quality_control";
import QCEmployeeCard from "@/components/admin/quality_control/QCEmployeeCard";
import QCEmployeeModal from "@/components/admin/quality_control/QCEmployeeModal";
import QCItemCard from "@/components/admin/quality_control/QCItemCard";
import QCOverview from "@/components/admin/quality_control/QCOverview";

type Tab = "overview" | "items" | "employees";
type SortMode = "newest" | "oldest";

const TABS: {
    id: Tab;
    label: string;
    icon: typeof LayoutDashboard;
}[] = [
        {
            id: "overview",
            label: "نمای کلی",
            icon: LayoutDashboard,
        },
        {
            id: "items",
            label: "بررسی‌های کنترل کیفی",
            icon: ClipboardCheck,
        },
        {
            id: "employees",
            label: "تیم کنترل کیفی",
            icon: Users,
        },
    ];

function extractList<T>(data: unknown): T[] {
    if (Array.isArray(data)) {
        return data as T[];
    }

    if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;

        if (Array.isArray(record.results)) {
            return record.results as T[];
        }

        if (Array.isArray(record.data)) {
            return record.data as T[];
        }
    }

    return [];
}

function getErrorMessage(error: unknown, fallback: string) {
    const response = (
        error as {
            response?: {
                data?: Record<string, unknown>;
            };
        }
    ).response;

    const data = response?.data;

    if (!data) return fallback;

    for (const key of [
        "detail",
        "message",
        "error",
        "non_field_errors",
    ]) {
        const value = data[key];

        if (typeof value === "string") {
            return value;
        }

        if (
            Array.isArray(value) &&
            typeof value[0] === "string"
        ) {
            return value[0];
        }
    }

    return fallback;
}

export default function QualityControlPage() {
    const [tab, setTab] = useState<Tab>("overview");

    const [items, setItems] = useState<
        ApiQualityControlItem[]
    >([]);

    const [employees, setEmployees] = useState<
        ApiQualityControlEmployee[]
    >([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<
        QualityControlStatus | "all"
    >("all");

    const [sort, setSort] =
        useState<SortMode>("newest");

    const [showFilters, setShowFilters] =
        useState(false);

    const [employeeModal, setEmployeeModal] =
        useState(false);

    const loadData = useCallback(
        async (silent = false) => {
            if (silent) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            try {
                const [itemsResult, employeesResult] =
                    await Promise.allSettled([
                        axiosInstance.get(
                            "/quality_control/api/v1/"
                        ),
                        axiosInstance.get(
                            "/quality_control/api/v1/employee/"
                        ),
                    ]);

                const itemError =
                    itemsResult.status === "rejected"
                        ? getErrorMessage(
                            itemsResult.reason,
                            "دریافت بررسی‌های کنترل کیفی انجام نشد"
                        )
                        : "";

                const employeeError =
                    employeesResult.status === "rejected"
                        ? getErrorMessage(
                            employeesResult.reason,
                            "دریافت کارکنان کنترل کیفی انجام نشد"
                        )
                        : "";

                if (itemsResult.status === "fulfilled") {
                    setItems(
                        extractList<ApiQualityControlItem>(
                            itemsResult.value.data
                        )
                    );
                }

                if (
                    employeesResult.status ===
                    "fulfilled"
                ) {
                    setEmployees(
                        extractList<ApiQualityControlEmployee>(
                            employeesResult.value.data
                        )
                    );
                }

                if (itemError && employeeError) {
                    setError(
                        "دریافت اطلاعات کنترل کیفی انجام نشد"
                    );
                } else if (itemError) {
                    setError(itemError);
                } else if (employeeError) {
                    setError(employeeError);
                }
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    useEffect(() => {
        loadData();
    }, [loadData]);

    const pendingCount = useMemo(
        () =>
            items.filter(
                (item) => item.status === "pending"
            ).length,
        [items]
    );

    const filteredItems = useMemo(() => {
        const query = search.trim().toLowerCase();

        const result = items.filter((item) => {
            const matchesStatus =
                status === "all" ||
                item.status === status;

            const matchesSearch =
                !query ||
                item.product_name
                    ?.toLowerCase()
                    .includes(query) ||
                String(item.id).includes(query) ||
                String(
                    item.purchase_task_id
                ).includes(query) ||
                item.checked_by_name
                    ?.toLowerCase()
                    .includes(query) ||
                item.note
                    ?.toLowerCase()
                    .includes(query);

            return (
                matchesStatus && matchesSearch
            );
        });

        result.sort((a, b) => {
            const aTime = new Date(
                a.created_at
            ).getTime();

            const bTime = new Date(
                b.created_at
            ).getTime();

            return sort === "newest"
                ? bTime - aTime
                : aTime - bTime;
        });

        return result;
    }, [items, search, status, sort]);

    const hasActiveFilters =
        search.trim().length > 0 ||
        status !== "all";

    function clearFilters() {
        setSearch("");
        setStatus("all");
    }

    function handleItemUpdated(
        response: QualityControlActionResponse
    ) {
        setItems((current) =>
            current.map((item) => {
                if (
                    item.id !==
                    response.quality_control_id
                ) {
                    return item;
                }

                return {
                    ...item,
                    status: response.status,
                    status_display:
                        response.status ===
                            "approved"
                            ? "تایید شده"
                            : "رد شده",
                    checked_by:
                        item.checked_by,
                    checked_at:
                        new Date().toISOString(),
                };
            })
        );

        loadData(true);
    }

    function addEmployee(
        employee: ApiQualityControlEmployee
    ) {
        setEmployees((current) => [
            employee,
            ...current,
        ]);
    }

    function updateEmployee(
        employee: ApiQualityControlEmployee
    ) {
        setEmployees((current) =>
            current.map((currentEmployee) =>
                currentEmployee.id === employee.id
                    ? employee
                    : currentEmployee
            )
        );
    }

    function deleteEmployee(id: number) {
        setEmployees((current) =>
            current.filter(
                (employee) => employee.id !== id
            )
        );
    }

    return (
        <div
            dir="rtl"
            className="min-h-full bg-gray-50/40 p-4 sm:p-6 lg:p-8 dark:bg-[#070d18]"
        >
            <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">
                <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                            <ShieldCheck size={25} />
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-[20px] font-black tracking-tight text-gray-900 dark:text-white">
                                    کنترل کیفی
                                </h1>

                                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black text-emerald-500">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    سیستم فعال
                                </span>
                            </div>

                            <p className="mt-1.5 text-[11px] font-medium text-gray-400">
                                مدیریت، بررسی و کنترل کیفیت محصولات فرآیند خرید
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                loadData(true)
                            }
                            disabled={
                                refreshing ||
                                loading
                            }
                            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/[0.05] bg-white text-gray-500 transition hover:bg-gray-50 disabled:opacity-40 dark:border-white/[0.06] dark:bg-white/[0.035] dark:text-gray-300"
                            title="بروزرسانی"
                        >
                            <RefreshCw
                                size={15}
                                className={
                                    refreshing
                                        ? "animate-spin"
                                        : ""
                                }
                            />
                        </button>

                        {tab ===
                            "employees" && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setEmployeeModal(
                                            true
                                        )
                                    }
                                    className="flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-4 text-[11px] font-black text-white shadow-lg shadow-blue-500/15 transition hover:bg-blue-500"
                                >
                                    <Plus size={15} />
                                    افزودن کارمند
                                </button>
                            )}
                    </div>
                </header>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-1 overflow-x-auto rounded-[20px] bg-gray-100 p-1.5 dark:bg-white/[0.045]">
                        {TABS.map((item) => {
                            const Icon = item.icon;
                            const active =
                                tab === item.id;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() =>
                                        setTab(
                                            item.id
                                        )
                                    }
                                    className={`relative flex h-10 shrink-0 items-center gap-2 rounded-2xl px-4 text-[10.5px] font-black transition ${active
                                            ? "bg-white text-blue-600 shadow-sm dark:bg-[#172033] dark:text-blue-400"
                                            : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                        }`}
                                >
                                    <Icon size={14} />

                                    {item.label}

                                    {item.id ===
                                        "items" &&
                                        pendingCount >
                                        0 && (
                                            <span className="flex min-w-[19px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] font-black text-white">
                                                {
                                                    pendingCount
                                                }
                                            </span>
                                        )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {tab === "items" && (
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-3 lg:flex-row">
                            <div className="relative flex-1">
                                <Search
                                    size={16}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    value={search}
                                    onChange={(
                                        event
                                    ) =>
                                        setSearch(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="جستجو بر اساس محصول، شناسه، وظیفه خرید، بررسی‌کننده یا توضیحات..."
                                    className="h-12 w-full rounded-2xl border border-black/[0.05] bg-white pr-11 pl-4 text-[11px] font-bold text-gray-800 outline-none transition focus:border-blue-500 dark:border-white/[0.06] dark:bg-white/[0.035] dark:text-white"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowFilters(
                                        (value) =>
                                            !value
                                    )
                                }
                                className={`flex h-12 items-center justify-center gap-2 rounded-2xl border px-4 text-[10.5px] font-black transition ${showFilters ||
                                        hasActiveFilters
                                        ? "border-blue-500/20 bg-blue-500/10 text-blue-500"
                                        : "border-black/[0.05] bg-white text-gray-500 dark:border-white/[0.06] dark:bg-white/[0.035] dark:text-gray-300"
                                    }`}
                            >
                                <SlidersHorizontal
                                    size={15}
                                />
                                فیلتر و مرتب‌سازی

                                {hasActiveFilters && (
                                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                                )}
                            </button>
                        </div>

                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        height: 0,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        height: "auto",
                                    }}
                                    exit={{
                                        opacity: 0,
                                        height: 0,
                                    }}
                                    className="overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 gap-3 rounded-[24px] border border-black/[0.05] bg-white p-4 sm:grid-cols-3 dark:border-white/[0.06] dark:bg-white/[0.025]">
                                        <FilterSelect
                                            label="وضعیت"
                                            value={
                                                status
                                            }
                                            onChange={(
                                                value
                                            ) =>
                                                setStatus(
                                                    value as
                                                    | QualityControlStatus
                                                    | "all"
                                                )
                                            }
                                            options={[
                                                {
                                                    value: "all",
                                                    label: "همه وضعیت‌ها",
                                                },
                                                {
                                                    value: "pending",
                                                    label: "در انتظار بررسی",
                                                },
                                                {
                                                    value: "approved",
                                                    label: "تایید شده",
                                                },
                                                {
                                                    value: "rejected",
                                                    label: "رد شده",
                                                },
                                            ]}
                                        />

                                        <FilterSelect
                                            label="مرتب‌سازی"
                                            value={
                                                sort
                                            }
                                            onChange={(
                                                value
                                            ) =>
                                                setSort(
                                                    value as SortMode
                                                )
                                            }
                                            options={[
                                                {
                                                    value: "newest",
                                                    label: "جدیدترین",
                                                },
                                                {
                                                    value: "oldest",
                                                    label: "قدیمی‌ترین",
                                                },
                                            ]}
                                        />

                                        <button
                                            type="button"
                                            onClick={
                                                clearFilters
                                            }
                                            disabled={
                                                !hasActiveFilters
                                            }
                                            className="mt-auto flex h-11 items-center justify-center gap-2 rounded-2xl bg-gray-100 text-[10.5px] font-black text-gray-500 transition hover:bg-gray-200 disabled:opacity-40 dark:bg-white/[0.05] dark:text-gray-300"
                                        >
                                            <X
                                                size={
                                                    14
                                                }
                                            />
                                            پاک کردن فیلترها
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity
                                    size={14}
                                    className="text-blue-500"
                                />

                                <span className="text-[10.5px] font-bold text-gray-400">
                                    نمایش{" "}
                                    <strong className="text-gray-800 dark:text-white">
                                        {
                                            filteredItems.length
                                        }
                                    </strong>{" "}
                                    مورد از{" "}
                                    <strong className="text-gray-800 dark:text-white">
                                        {
                                            items.length
                                        }
                                    </strong>
                                </span>
                            </div>

                            {search && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearch(
                                            ""
                                        )
                                    }
                                    className="text-[10px] font-black text-blue-500"
                                >
                                    پاک کردن جستجو
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-3 rounded-2xl border border-red-500/10 bg-red-500/[0.06] p-4 text-red-500">
                        <Activity
                            size={16}
                            className="shrink-0"
                        />

                        <p className="flex-1 text-[10.5px] font-bold">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                loadData()
                            }
                            className="rounded-xl bg-red-500 px-3 py-2 text-[9.5px] font-black text-white"
                        >
                            تلاش مجدد
                        </button>
                    </div>
                )}

                {loading ? (
                    <LoadingState />
                ) : (
                    <>
                        {tab === "overview" && (
                            <QCOverview
                                items={items}
                                employees={
                                    employees
                                }
                                onOpenItems={() =>
                                    setTab(
                                        "items"
                                    )
                                }
                                onOpenEmployees={() =>
                                    setTab(
                                        "employees"
                                    )
                                }
                            />
                        )}

                        {tab === "items" && (
                            <>
                                {filteredItems.length ===
                                    0 ? (
                                    <EmptyItems
                                        filtered={
                                            hasActiveFilters
                                        }
                                        onClear={
                                            clearFilters
                                        }
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {filteredItems.map(
                                            (
                                                item,
                                                index
                                            ) => (
                                                <QCItemCard
                                                    key={
                                                        item.id
                                                    }
                                                    item={
                                                        item
                                                    }
                                                    index={
                                                        index
                                                    }
                                                    employees={
                                                        employees
                                                    }
                                                    onUpdated={
                                                        handleItemUpdated
                                                    }
                                                />
                                            )
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {tab === "employees" && (
                            <>
                                {employees.length ===
                                    0 ? (
                                    <EmptyEmployees
                                        onAdd={() =>
                                            setEmployeeModal(
                                                true
                                            )
                                        }
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {employees.map(
                                            (
                                                employee,
                                                index
                                            ) => (
                                                <QCEmployeeCard
                                                    key={
                                                        employee.id
                                                    }
                                                    employee={
                                                        employee
                                                    }
                                                    index={
                                                        index
                                                    }
                                                    onUpdated={
                                                        updateEmployee
                                                    }
                                                    onDeleted={
                                                        deleteEmployee
                                                    }
                                                />
                                            )
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

            <QCEmployeeModal
                isOpen={employeeModal}
                existingEmployees={
                    employees
                }
                onClose={() =>
                    setEmployeeModal(false)
                }
                onCreated={addEmployee}
            />
        </div>
    );
}

function FilterSelect({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: {
        value: string;
        label: string;
    }[];
}) {
    return (
        <div>
            <label className="mb-2 block text-[9.5px] font-black text-gray-400">
                {label}
            </label>

            <div className="relative">
                <select
                    value={value}
                    onChange={(event) =>
                        onChange(
                            event.target.value
                        )
                    }
                    className="h-11 w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 text-[10.5px] font-black text-gray-700 outline-none dark:border-white/[0.07] dark:bg-white/[0.035] dark:text-gray-200"
                >
                    {options.map(
                        (option) => (
                            <option
                                key={
                                    option.value
                                }
                                value={
                                    option.value
                                }
                            >
                                {
                                    option.label
                                }
                            </option>
                        )
                    )}
                </select>

                <ChevronDown
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
            </div>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({
                length: 6,
            }).map((_, index) => (
                <motion.div
                    key={index}
                    initial={{
                        opacity: 0,
                    }}
                    animate={{
                        opacity: 1,
                    }}
                    className="h-[330px] animate-pulse rounded-[28px] border border-black/[0.04] bg-white dark:border-white/[0.05] dark:bg-white/[0.025]"
                />
            ))}
        </div>
    );
}

function EmptyItems({
    filtered,
    onClear,
}: {
    filtered: boolean;
    onClear: () => void;
}) {
    return (
        <div className="rounded-[30px] border border-black/[0.05] bg-white py-20 text-center dark:border-white/[0.06] dark:bg-white/[0.025]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-gray-100 text-gray-400 dark:bg-white/[0.05]">
                <ClipboardCheck size={25} />
            </div>

            <h3 className="mt-5 text-[14px] font-black text-gray-800 dark:text-white">
                {filtered
                    ? "موردی با این فیلترها پیدا نشد"
                    : "هنوز موردی برای کنترل کیفی وجود ندارد"}
            </h3>

            <p className="mx-auto mt-2 max-w-[380px] text-[10.5px] font-medium leading-6 text-gray-400">
                {filtered
                    ? "فیلترها یا عبارت جستجو را تغییر دهید تا موارد بیشتری نمایش داده شوند."
                    : "به محض ورود محصول به مرحله کنترل کیفی، موارد اینجا نمایش داده خواهند شد."}
            </p>

            {filtered && (
                <button
                    type="button"
                    onClick={onClear}
                    className="mt-5 rounded-2xl bg-blue-600 px-5 py-2.5 text-[10.5px] font-black text-white"
                >
                    حذف فیلترها
                </button>
            )}
        </div>
    );
}

function EmptyEmployees({
    onAdd,
}: {
    onAdd: () => void;
}) {
    return (
        <div className="rounded-[30px] border border-black/[0.05] bg-white py-20 text-center dark:border-white/[0.06] dark:bg-white/[0.025]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-blue-500/10 text-blue-500">
                <Users size={25} />
            </div>

            <h3 className="mt-5 text-[14px] font-black text-gray-800 dark:text-white">
                تیم کنترل کیفی هنوز ساخته نشده است
            </h3>

            <p className="mx-auto mt-2 max-w-[380px] text-[10.5px] leading-6 text-gray-400">
                اولین کارمند را اضافه کنید تا بررسی محصولات شروع شود.
            </p>

            <button
                type="button"
                onClick={onAdd}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-[10.5px] font-black text-white"
            >
                <Plus size={14} />
                افزودن اولین کارمند
            </button>
        </div>
    );
}