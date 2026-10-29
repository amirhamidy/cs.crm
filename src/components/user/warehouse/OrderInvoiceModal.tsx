
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { useTheme } from "next-themes";
import {
    AlertCircle,
    Building2,
    FileText,
    Hash,
    Loader2,
    Package,
    ReceiptText,
    User,
    Users,
    X,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import {
    formatDate,
    formatNumber,
    getStatusLabel,
    getStatusTone,
    type SalesInvoice,
} from "@/utils/warehouseEmployee";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    invoice: SalesInvoice | null;
}

interface InvoiceLine {
    id?: number | string;
    product_id?: number | string;
    product_name?: string;
    name_product?: string;
    product?: number | string | { id?: number; name?: string };
    product_sale_price?: number | string;
    completed_quantity?: number | string;
    quantity?: number | string;
    shelf_code?: string;
    stock_transaction_id?: number | string | null;
    status?: string;
}

interface InvoiceDetail {
    id?: number;
    title?: string;
    status?: string;
    created_at?: string;
    archived_at?: string;
    order_task?: number;
    task_id?: number;
    warehouse_name?: string;
    warehouse_code?: string;
    description?: string;
    note?: string;
    completion_note?: string;
    order_task_created_at?: string;
    customer?: { full_name?: string } | string | null;
    department?: { name?: string } | string | null;
    performed_by?: { full_name?: string } | string | null;
    assigned_employee?: Array<{ full_name?: string }> | null;
    assigned_employees?: Array<{ full_name?: string }> | null;
    case?: { title?: string } | string | null;
    items?: InvoiceLine[];
    [key: string]: unknown;
}

function normalizeDetail(value: unknown): InvoiceDetail | null {
    if (!value || typeof value !== "object") return null;

    const response = value as Record<string, unknown>;
    const nested = response.data;

    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
        return nested as InvoiceDetail;
    }

    return response as InvoiceDetail;
}

function getName(
    value: { full_name?: string; name?: string } | string | null | undefined,
) {
    if (typeof value === "string") return value || "نامشخص";
    return value?.full_name || value?.name || "نامشخص";
}

function getProductName(item: InvoiceLine) {
    if (item.product_name || item.name_product) {
        return item.product_name || item.name_product || "نامشخص";
    }

    if (item.product && typeof item.product === "object") {
        return item.product.name || "نامشخص";
    }

    return "نامشخص";
}

function getQuantity(item: InvoiceLine) {
    return Number(item.completed_quantity ?? item.quantity ?? 0);
}

function getPrice(item: InvoiceLine) {
    return Number(item.product_sale_price ?? 0);
}

function parseError(error: unknown) {
    const err = error as {
        response?: {
            data?: {
                detail?: string;
                message?: string;
            };
        };
        message?: string;
    };

    return (
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "دریافت جزئیات فاکتور انجام نشد."
    );
}

export default function OrderInvoiceModal({
    isOpen,
    onClose,
    invoice,
}: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [detail, setDetail] = useState<InvoiceDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen || !invoice) {
            setDetail(null);
            setError("");
            return;
        }

        const controller = new AbortController();

        const fetchInvoice = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await axiosInstance.get(
                    `/warehouse/api/v1/order_task_archive/${invoice.archiveId}/`,
                    { signal: controller.signal },
                );

                setDetail(normalizeDetail(response.data));
            } catch (error) {
                if (controller.signal.aborted) return;

                setError(parseError(error));
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        void fetchInvoice();

        return () => controller.abort();
    }, [isOpen, invoice]);

    if (!invoice) return null;

    const task = detail;
    const tone = getStatusTone(task?.status ?? invoice.status);

    const statusColors = {
        success: {
            bg: isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)",
            text: isDark ? "#6ee7b7" : "#059669",
        },
        warning: {
            bg: isDark ? "rgba(234,179,8,0.12)" : "rgba(234,179,8,0.08)",
            text: isDark ? "#fde047" : "#ca8a04",
        },
        danger: {
            bg: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)",
            text: isDark ? "#fca5a5" : "#dc2626",
        },
        neutral: {
            bg: isDark ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.08)",
            text: isDark ? "#cbd5e1" : "#475569",
        },
    }[tone] || {
        bg: "rgba(148,163,184,0.08)",
        text: "#475569",
    };

    const items = (task?.items ?? invoice.lines.map((line) => ({
        id: line.id,
        product_id: line.productId ?? undefined,
        product_name: line.productName,
        product_sale_price: line.unitPrice,
        completed_quantity: line.quantity,
        quantity: line.quantity,
        shelf_code: line.shelfCode,
        stock_transaction_id: line.stockTransactionId,
        status: "success",
    }))) as InvoiceLine[];

    const successfulItems = items.filter(
        (item) => item.status === "success" || !item.status,
    );

    const totalQuantity = successfulItems.reduce(
        (sum, item) => sum + getQuantity(item),
        0,
    );

    const totalPrice = successfulItems.reduce(
        (sum, item) => sum + getPrice(item) * getQuantity(item),
        0,
    );

    const customerName = getName(task?.customer as InvoiceDetail["customer"]) ||
        invoice.customerName;

    const departmentName =
        getName(task?.department as InvoiceDetail["department"]) ||
        invoice.departmentName;

    const performedByName = getName(
        task?.performed_by as InvoiceDetail["performed_by"],
    ) || invoice.performedByName;

    const assignedEmployees = (Array.isArray(task?.assigned_employees)
        ? task.assigned_employees
        : Array.isArray(task?.assigned_employee)
            ? task.assigned_employee
            : [])
        .map((employee) => employee.full_name)
        .filter((name): name is string => Boolean(name));

    const caseValue = task?.case;
    const caseTitle =
        (caseValue && typeof caseValue === "object" ? caseValue.title : undefined) ||
        invoice.title ||
        "—";

    return (
        <AnimatePresence>
            {isOpen && (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-5"
                    dir="rtl"
                >
                    <m.div
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 12 }}
                        transition={{ duration: 0.2 }}
                        onClick={(event) => event.stopPropagation()}
                        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl"
                        style={{
                            background: isDark ? "#0f172a" : "#fff",
                            border: isDark
                                ? "1px solid rgba(255,255,255,0.06)"
                                : "1px solid rgba(15,23,42,0.06)",
                            boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
                        }}
                    >
                        <header
                            className="flex items-center justify-between gap-3 border-b px-4 py-4 sm:px-5"
                            style={{
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(15,23,42,0.06)",
                            }}
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10">
                                    <ReceiptText
                                        size={18}
                                        className="text-indigo-500"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        فاکتور فروش
                                    </h2>
                                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                        {invoice.invoiceNumber}
                                    </p>
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                <span
                                    className="rounded-xl px-2.5 py-1.5 text-[10px] font-extrabold"
                                    style={{
                                        background: statusColors.bg,
                                        color: statusColors.text,
                                    }}
                                >
                                    {getStatusLabel(task?.status ?? invoice.status)}
                                </span>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="بستن فاکتور"
                                    className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </header>

                        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                            {loading ? (
                                <div className="flex min-h-64 flex-col items-center justify-center gap-3">
                                    <Loader2
                                        size={28}
                                        className="animate-spin text-indigo-500"
                                    />
                                    <p className="text-[12px] font-semibold text-gray-500 dark:text-gray-400">
                                        در حال دریافت جزئیات فاکتور...
                                    </p>
                                </div>
                            ) : error ? (
                                <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-3xl border border-red-200 bg-red-50 p-5 text-center dark:border-red-500/20 dark:bg-red-500/5">
                                    <AlertCircle
                                        size={28}
                                        className="text-red-500"
                                    />
                                    <p className="text-[12px] font-bold leading-6 text-red-600 dark:text-red-400">
                                        {error}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setError("");
                                            setDetail(null);
                                            setLoading(true);
                                            void axiosInstance
                                                .get(
                                                    `/warehouse/api/v1/order_task_archive/${invoice.archiveId}/`,
                                                )
                                                .then((response) => {
                                                    setDetail(
                                                        normalizeDetail(response.data),
                                                    );
                                                })
                                                .catch((err) => {
                                                    setError(parseError(err));
                                                })
                                                .finally(() => setLoading(false));
                                        }}
                                        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-[11px] font-bold text-white transition-colors hover:bg-indigo-700"
                                    >
                                        تلاش دوباره
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <section className="rounded-3xl border border-gray-200 p-4 dark:border-white/[0.06]">
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-[10.5px] font-bold text-gray-500 dark:text-gray-400">
                                                    شماره فاکتور
                                                </p>
                                                <p className="mt-1 text-[16px] font-black text-indigo-600 dark:text-indigo-400">
                                                    {invoice.invoiceNumber}
                                                </p>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10.5px] font-bold text-gray-500 dark:text-gray-400">
                                                    تاریخ صدور
                                                </p>
                                                <p className="mt-1 text-[12px] font-extrabold text-gray-900 dark:text-white">
                                                    {formatDate(
                                                        task?.archived_at ??
                                                        task?.created_at ??
                                                        invoice.archivedAt,
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {caseTitle !== "—" && (
                                            <div className="mb-4 flex items-start gap-2 rounded-2xl bg-indigo-500/[0.06] px-3 py-2.5">
                                                <FileText
                                                    size={13}
                                                    className="mt-1 shrink-0 text-indigo-500"
                                                />
                                                <p className="text-[11.5px] font-bold leading-6 text-gray-700 dark:text-gray-200">
                                                    {caseTitle}
                                                </p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                            <InfoBox
                                                icon={<User size={13} />}
                                                label="خریدار"
                                                value={customerName}
                                                isDark={isDark}
                                            />
                                            <InfoBox
                                                icon={<Building2 size={13} />}
                                                label="دپارتمان"
                                                value={departmentName}
                                                isDark={isDark}
                                            />
                                            <InfoBox
                                                icon={<User size={13} />}
                                                label="انجام‌دهنده"
                                                value={performedByName}
                                                isDark={isDark}
                                            />
                                        </div>

                                        {assignedEmployees.length > 0 && (
                                            <div className="mt-4">
                                                <div className="mb-2 flex items-center gap-1.5">
                                                    <Users
                                                        size={12}
                                                        className="text-gray-400"
                                                    />
                                                    <span className="text-[10.5px] font-bold text-gray-500 dark:text-gray-400">
                                                        کارمندان مسئول
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {assignedEmployees.map(
                                                        (name, index) => (
                                                            <span
                                                                key={`${name}-${index}`}
                                                                className="rounded-lg bg-violet-500/10 px-2 py-1 text-[10.5px] font-bold text-violet-600 dark:text-violet-300"
                                                            >
                                                                {name}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </section>

                                    <section className="mt-5 overflow-x-auto rounded-3xl border border-gray-200 dark:border-white/[0.06]">
                                        <table className="w-full min-w-[520px]">
                                            <thead>
                                                <tr className="bg-indigo-500/[0.06] dark:bg-indigo-500/10">
                                                    <Th isDark={isDark}>#</Th>
                                                    <Th isDark={isDark}>شرح کالا</Th>
                                                    <Th isDark={isDark}>قیمت واحد</Th>
                                                    <Th isDark={isDark}>تعداد</Th>
                                                    <Th isDark={isDark}>جمع</Th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {successfulItems.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={5}
                                                            className="px-3 py-10 text-center text-[12px] text-gray-400"
                                                        >
                                                            کالایی برای نمایش در فاکتور وجود ندارد.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    successfulItems.map(
                                                        (line, index) => {
                                                            const quantity =
                                                                getQuantity(line);
                                                            const price =
                                                                getPrice(line);

                                                            return (
                                                                <tr
                                                                    key={
                                                                        line.id ??
                                                                        `${getProductName(line)}-${index}`
                                                                    }
                                                                    className="border-t border-gray-100 dark:border-white/[0.05]"
                                                                >
                                                                    <Td isDark={isDark}>
                                                                        {formatNumber(
                                                                            index + 1,
                                                                        )}
                                                                    </Td>
                                                                    <Td isDark={isDark}>
                                                                        <p className="font-extrabold text-gray-900 dark:text-white">
                                                                            {getProductName(
                                                                                line,
                                                                            )}
                                                                        </p>
                                                                        {line.shelf_code && (
                                                                            <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                                                                                قفسه: {line.shelf_code}
                                                                            </p>
                                                                        )}
                                                                        {line.stock_transaction_id != null && (
                                                                            <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                                                                                تراکنش انبار: {formatNumber(line.stock_transaction_id)}
                                                                            </p>
                                                                        )}
                                                                    </Td>
                                                                    <Td isDark={isDark}>
                                                                        {formatNumber(
                                                                            price,
                                                                        )}
                                                                    </Td>
                                                                    <Td isDark={isDark}>
                                                                        {formatNumber(
                                                                            quantity,
                                                                        )}
                                                                    </Td>
                                                                    <Td isDark={isDark}>
                                                                        <span className="font-extrabold text-gray-900 dark:text-white">
                                                                            {formatNumber(
                                                                                price *
                                                                                quantity,
                                                                            )}
                                                                        </span>
                                                                    </Td>
                                                                </tr>
                                                            );
                                                        },
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </section>

                                    <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <SummaryBox
                                            icon={<Package size={14} />}
                                            label="تعداد کل"
                                            value={formatNumber(totalQuantity)}
                                            isDark={isDark}
                                        />
                                        <SummaryBox
                                            icon={<Hash size={14} />}
                                            label="تعداد ردیف"
                                            value={formatNumber(
                                                successfulItems.length,
                                            )}
                                            isDark={isDark}
                                        />
                                        <SummaryBox
                                            icon={<ReceiptText size={14} />}
                                            label="جمع کل"
                                            value={formatNumber(
                                                totalPrice ||
                                                invoice.total,
                                            )}
                                            isDark={isDark}
                                        />
                                    </section>
                                </>
                            )}
                        </main>

                        <footer className="flex justify-end border-t border-gray-100 p-4 dark:border-white/[0.06] sm:px-5">
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-10 rounded-2xl bg-indigo-600 px-5 text-[12px] font-bold text-white transition-colors hover:bg-indigo-700"
                            >
                                بستن فاکتور
                            </button>
                        </footer>
                    </m.div>
                </m.div>
            )}
        </AnimatePresence>
    );
}

function InfoBox({
    icon,
    label,
    value,
    isDark,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    isDark: boolean;
}) {
    return (
        <div
            className="flex min-w-0 items-center gap-2 rounded-2xl px-3 py-2.5"
            style={{
                background: isDark
                    ? "rgba(255,255,255,0.03)"
                    : "#fff",
                border: isDark
                    ? "1px solid rgba(255,255,255,0.05)"
                    : "1px solid rgba(15,23,42,0.05)",
            }}
        >
            <span className="shrink-0 text-indigo-500">{icon}</span>
            <div className="min-w-0">
                <p className="text-[9.5px] font-bold text-gray-400">{label}</p>
                <p className="mt-1 truncate text-[11px] font-extrabold text-gray-800 dark:text-gray-200">
                    {value}
                </p>
            </div>
        </div>
    );
}

function SummaryBox({
    icon,
    label,
    value,
    isDark,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    isDark: boolean;
}) {
    return (
        <div
            className="flex flex-col items-center rounded-2xl px-3 py-3"
            style={{
                background: isDark
                    ? "rgba(255,255,255,0.03)"
                    : "#fafafa",
                border: isDark
                    ? "1px solid rgba(255,255,255,0.05)"
                    : "1px solid rgba(15,23,42,0.05)",
            }}
        >
            <span className="text-indigo-500">{icon}</span>
            <p className="mt-1 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                {label}
            </p>
            <p className="mt-1 text-[13px] font-black text-gray-900 dark:text-white">
                {value}
            </p>
        </div>
    );
}

function Th({
    children,
    isDark,
}: {
    children: React.ReactNode;
    isDark: boolean;
}) {
    return (
        <th
            className="px-3 py-3 text-right text-[11px] font-extrabold"
            style={{ color: isDark ? "#e2e8f0" : "#334155" }}
        >
            {children}
        </th>
    );
}

function Td({
    children,
    isDark,
}: {
    children: React.ReactNode;
    isDark: boolean;
}) {
    return (
        <td
            className="px-3 py-3 text-[11.5px]"
            style={{ color: isDark ? "#cbd5e1" : "#475569" }}
        >
            {children}
        </td>
    );
}
