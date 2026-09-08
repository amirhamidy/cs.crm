"use client";

import {
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Package,
    X,
} from "lucide-react";
import { ApiWarehouseTask } from "@/types/warehouse";
import {
    formatDate,
    formatNumber,
    getStatusLabel,
    getStatusTone,
    getTaskProductName,
} from "@/utils/warehouseEmployee";

interface Props {
    task: ApiWarehouseTask | null;
    open: boolean;
    onClose: () => void;
}

interface DetailField {
    label: string;
    value: string;
}

export default function WarehouseEmployeeTaskDetails({
    task,
    open,
    onClose,
}: Props) {
    if (!open || !task) return null;

    const data = task as unknown as Record<string, unknown>;

    const status =
        typeof data.status === "string" || typeof data.status === "number"
            ? String(data.status)
            : "";

    const tone = getStatusTone(status);

    const expected = Number(
        data.expected_quantity ??
        data.quantity ??
        data.requested_quantity ??
        0
    );

    const received = Number(
        data.received_quantity ??
        data.completed_quantity ??
        0
    );

    const remaining = Math.max(expected - received, 0);

    const getDisplayValue = (value: unknown): string => {
        if (value === null || value === undefined || value === "") {
            return "—";
        }

        if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
        ) {
            return String(value);
        }

        return "—";
    };

    const description =
        typeof data.note === "string" && data.note.trim()
            ? data.note
            : typeof data.description === "string" &&
                data.description.trim()
                ? data.description
                : "";

    const fields: DetailField[] = [
        {
            label: "شناسه وظیفه",
            value: getDisplayValue(data.id),
        },
        {
            label: "کالای مرتبط",
            value: getTaskProductName(task),
        },
        {
            label: "وضعیت",
            value: getStatusLabel(status),
        },
        {
            label: "مقدار مورد انتظار",
            value: formatNumber(expected),
        },
        {
            label: "مقدار دریافت شده",
            value: formatNumber(received),
        },
        {
            label: "مقدار باقی‌مانده",
            value: formatNumber(remaining),
        },
        {
            label: "شناسه سفارش",
            value: getDisplayValue(
                data.order_task_id ?? data.order_id
            ),
        },
        {
            label: "شناسه خرید",
            value: getDisplayValue(data.purchase_task_id),
        },
        {
            label: "کنترل کیفیت",
            value: getDisplayValue(data.quality_control_id),
        },
        {
            label: "آخرین بروزرسانی",
            value: getDisplayValue(
                formatDate(
                    data.updated_at ??
                    data.modified_at ??
                    data.created_at
                )
            ),
        },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5">
            <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] border border-white/[0.08] bg-[#0e0f11] shadow-2xl sm:max-w-2xl sm:rounded-[28px]">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.07] bg-[#0e0f11]/95 px-5 py-4 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-white/50 transition hover:bg-white/[0.08] hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div>
                            <p className="text-sm font-bold text-white">
                                جزئیات وظیفه
                            </p>

                            <p className="mt-0.5 text-xs text-white/30">
                                وظیفه #
                                {getDisplayValue(data.id)}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl bg-orange-500/10 p-2.5 text-orange-300">
                        <ClipboardList className="h-5 w-5" />
                    </div>
                </div>

                <div className="space-y-5 p-5">
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300">
                                <Package className="h-5 w-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] text-white/30">
                                    کالای مرتبط
                                </p>

                                <p className="mt-1 text-base font-bold text-white">
                                    {getTaskProductName(task)}
                                </p>

                                <div className="mt-3">
                                    <span
                                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${tone === "success"
                                                ? "border-emerald-400/15 bg-emerald-400/10 text-emerald-300"
                                                : tone === "danger"
                                                    ? "border-red-400/15 bg-red-400/10 text-red-300"
                                                    : tone === "warning"
                                                        ? "border-amber-400/15 bg-amber-400/10 text-amber-300"
                                                        : "border-white/[0.08] bg-white/[0.04] text-white/50"
                                            }`}
                                    >
                                        {getStatusLabel(status)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {fields.map((field) => (
                            <div
                                key={field.label}
                                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                            >
                                <p className="text-[10px] text-white/30">
                                    {field.label}
                                </p>

                                <p className="mt-1 break-words text-xs font-semibold text-white/75">
                                    {field.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {description ? (
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                            <p className="text-xs text-white/30">
                                توضیحات
                            </p>

                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/65">
                                {description}
                            </p>
                        </div>
                    ) : null}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/[0.06] bg-emerald-400/[0.05] p-4">
                            <div className="flex items-center gap-2 text-emerald-300">
                                <CheckCircle2 className="h-4 w-4" />

                                <span className="text-xs">
                                    دریافت شده
                                </span>
                            </div>

                            <p className="mt-2 text-xl font-bold text-white">
                                {formatNumber(received)}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/[0.06] bg-orange-400/[0.05] p-4">
                            <div className="flex items-center gap-2 text-orange-300">
                                <CalendarDays className="h-4 w-4" />

                                <span className="text-xs">
                                    باقی‌مانده
                                </span>
                            </div>

                            <p className="mt-2 text-xl font-bold text-white">
                                {formatNumber(remaining)}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-black transition hover:bg-white/90"
                    >
                        <ArrowRight className="h-4 w-4" />
                        بازگشت به وظایف
                    </button>
                </div>
            </div>
        </div>
    );

}
