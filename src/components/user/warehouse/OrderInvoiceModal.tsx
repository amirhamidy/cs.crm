"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
    X,
    ReceiptText,
    Building2,
    User,
    Users,
    Hash,
    Package,
    FileText,
} from "lucide-react";
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

export default function OrderInvoiceModal({ isOpen, onClose, invoice }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const tone = invoice ? getStatusTone(invoice.status) : "neutral";
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
    }[tone];

    return (
        <AnimatePresence>
            {isOpen && invoice && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 12 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl"
                        style={{
                            background: isDark ? "#0f172a" : "#ffffff",
                            border: isDark
                                ? "1px solid rgba(255,255,255,0.06)"
                                : "1px solid rgba(15,23,42,0.06)",
                            boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
                        }}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between border-b px-5 py-4"
                            style={{
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(15,23,42,0.06)",
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-2xl"
                                    style={{
                                        background: isDark
                                            ? "rgba(99,102,241,0.14)"
                                            : "rgba(99,102,241,0.08)",
                                    }}
                                >
                                    <ReceiptText size={18} className="text-indigo-500" />
                                </div>
                                <div>
                                    <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        فاکتور فروش
                                    </h2>
                                    <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                                        {invoice.invoiceNumber}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span
                                    className="rounded-xl px-2.5 py-1.5 text-[10.5px] font-extrabold"
                                    style={{
                                        background: statusColors.bg,
                                        color: statusColors.text,
                                    }}
                                >
                                    {getStatusLabel(invoice.status)}
                                </span>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                                >
                                    <X
                                        size={16}
                                        className="text-gray-500 dark:text-gray-400"
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div
                            className="flex-1 overflow-y-auto px-6 py-5"
                            style={{
                                background: isDark ? "#0f172a" : "#ffffff",
                            }}
                        >
                            {/* Top info */}
                            <div
                                className="rounded-3xl border p-4"
                                style={{
                                    background: isDark
                                        ? "rgba(255,255,255,0.02)"
                                        : "#fafafa",
                                    borderColor: isDark
                                        ? "rgba(255,255,255,0.06)"
                                        : "rgba(15,23,42,0.06)",
                                }}
                            >
                                <div className="mb-4 flex items-center justify-between">
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
                                            تاریخ
                                        </p>
                                        <p className="mt-1 text-[12.5px] font-extrabold text-gray-900 dark:text-white">
                                            {formatDate(invoice.archivedAt)}
                                        </p>
                                    </div>
                                </div>

                                {invoice.title && invoice.title !== "—" && (
                                    <div
                                        className="mb-4 rounded-2xl px-3 py-2.5"
                                        style={{
                                            background: isDark
                                                ? "rgba(99,102,241,0.08)"
                                                : "rgba(99,102,241,0.05)",
                                        }}
                                    >
                                        <div className="flex items-start gap-2">
                                            <FileText
                                                size={13}
                                                className="mt-0.5 shrink-0 text-indigo-500"
                                            />
                                            <p className="text-[11.5px] font-bold leading-6 text-gray-700 dark:text-gray-200">
                                                {invoice.title}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <InfoBox
                                        icon={<User size={13} />}
                                        label="خریدار"
                                        value={invoice.customerName}
                                        isDark={isDark}
                                    />
                                    <InfoBox
                                        icon={<Building2 size={13} />}
                                        label="دپارتمان"
                                        value={invoice.departmentName}
                                        isDark={isDark}
                                    />
                                    <InfoBox
                                        icon={<User size={13} />}
                                        label="انجام‌دهنده"
                                        value={invoice.performedByName}
                                        isDark={isDark}
                                    />
                                </div>

                                {invoice.assignedEmployees.length > 0 && (
                                    <div className="mt-3">
                                        <div className="mb-2 flex items-center gap-1.5">
                                            <Users size={12} className="text-gray-400" />
                                            <span className="text-[10.5px] font-bold text-gray-500 dark:text-gray-400">
                                                کارمندان مسئول
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {invoice.assignedEmployees.map((name, i) => (
                                                <span
                                                    key={i}
                                                    className="rounded-lg px-2 py-1 text-[10.5px] font-bold"
                                                    style={{
                                                        background: isDark
                                                            ? "rgba(139,92,246,0.12)"
                                                            : "rgba(139,92,246,0.08)",
                                                        color: isDark ? "#c4b5fd" : "#7c3aed",
                                                    }}
                                                >
                                                    {name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Items table */}
                            <div
                                className="mt-5 overflow-hidden rounded-3xl border"
                                style={{
                                    borderColor: isDark
                                        ? "rgba(255,255,255,0.06)"
                                        : "rgba(15,23,42,0.06)",
                                }}
                            >
                                <table className="w-full">
                                    <thead>
                                        <tr
                                            style={{
                                                background: isDark
                                                    ? "rgba(99,102,241,0.1)"
                                                    : "rgba(99,102,241,0.06)",
                                            }}
                                        >
                                            <Th isDark={isDark}>#</Th>
                                            <Th isDark={isDark}>شرح کالا / خدمات</Th>
                                            <Th isDark={isDark}>قیمت واحد</Th>
                                            <Th isDark={isDark}>تعداد</Th>
                                            <Th isDark={isDark}>جمع</Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.lines.map((line, i) => (
                                            <tr
                                                key={line.id}
                                                style={{
                                                    borderTop: isDark
                                                        ? "1px solid rgba(255,255,255,0.05)"
                                                        : "1px solid rgba(15,23,42,0.05)",
                                                }}
                                            >
                                                <Td isDark={isDark}>{formatNumber(i + 1)}</Td>
                                                <Td isDark={isDark}>
                                                    <div>
                                                        <p className="text-[12px] font-extrabold text-gray-900 dark:text-white">
                                                            {line.productName}
                                                        </p>
                                                        <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                                                            {line.caseTitle}
                                                        </p>
                                                    </div>
                                                </Td>
                                                <Td isDark={isDark}>
                                                    {formatNumber(line.unitPrice)}
                                                </Td>
                                                <Td isDark={isDark}>
                                                    {formatNumber(line.quantity)}
                                                </Td>
                                                <Td isDark={isDark}>
                                                    <span className="font-extrabold text-gray-900 dark:text-white">
                                                        {formatNumber(line.lineTotal)}
                                                    </span>
                                                </Td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary */}
                            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <SummaryBox
                                    icon={<Package size={14} className="text-indigo-500" />}
                                    label="تعداد کل اقلام"
                                    value={formatNumber(invoice.totalQuantity)}
                                    color="#6366f1"
                                    isDark={isDark}
                                />
                                <SummaryBox
                                    icon={<Hash size={14} className="text-cyan-500" />}
                                    label="تعداد ردیف‌ها"
                                    value={formatNumber(invoice.lines.length)}
                                    color="#06b6d4"
                                    isDark={isDark}
                                />
                                <SummaryBox
                                    icon={<ReceiptText size={14} className="text-emerald-500" />}
                                    label="مبلغ قابل پرداخت"
                                    value={formatNumber(invoice.total)}
                                    color="#10b981"
                                    isDark={isDark}
                                    suffix="ریال"
                                />
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
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
            className="flex items-center gap-2 rounded-2xl px-3 py-2.5"
            style={{
                background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,1)",
                border: isDark
                    ? "1px solid rgba(255,255,255,0.05)"
                    : "1px solid rgba(15,23,42,0.05)",
            }}
        >
            <span className="text-indigo-500">{icon}</span>
            <div className="min-w-0">
                <p className="text-[9.5px] font-bold text-gray-400 dark:text-gray-500">
                    {label}
                </p>
                <p className="truncate text-[11.5px] font-extrabold text-gray-900 dark:text-white">
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
    color,
    isDark,
    suffix,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: string;
    isDark: boolean;
    suffix?: string;
}) {
    return (
        <div
            className="flex flex-col items-center justify-center gap-1 rounded-3xl border px-3 py-4"
            style={{
                background: isDark ? "rgba(255,255,255,0.02)" : "#fafafa",
                borderColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(15,23,42,0.06)",
            }}
        >
            <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: `${color}18` }}
            >
                {icon}
            </div>
            <p className="mt-1 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                {label}
            </p>
            <p className="text-[16px] font-black" style={{ color }}>
                {value}
                {suffix && (
                    <span className="mr-1 text-[10px] font-bold text-gray-400">
                        {suffix}
                    </span>
                )}
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