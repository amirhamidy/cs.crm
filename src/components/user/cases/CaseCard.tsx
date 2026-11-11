"use client";

import { memo, useEffect, useState, useMemo } from "react";
import { ActionSheet, type ActionSheetItem } from "@/components/ui/ActionSheet";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { Backdrop } from "@/components/ui/Backdrop";
import { panelMotion } from "@/lib/motion";
import { useTheme } from "next-themes";
import { Trash2, SquarePen, CalendarDays, MoreVertical, AlertCircle, User, ListTodo, FileText, Power } from "lucide-react";
import type { CaseItem } from "@/types/case";
import type { Customer } from "@/types/customer";
import type { Department } from "@/types/department";
import type { Employee } from "@/types/employee";
import type { TaskItem } from "@/types/task";

import { BusyContent } from "@/components/ui/Button";
export type CaseView = "tasks" | "report" | "edit";

export interface CaseInfo {
    id: number;
    title: string;
}

interface CaseCardProps {
    item: CaseItem;
    index: number;
    users?: Employee[];
    customers?: Customer[];
    departments?: Department[];
    isDeleting?: boolean;
    hasActiveTasks?: boolean;
    caseTasks?: TaskItem[];
    onOpen?: (item: CaseItem, view: CaseView) => void;
    onDelete?: (item: CaseItem) => void;
    canManageActivation?: boolean;
    onToggleActive?: (item: CaseItem, nextActive: boolean) => void | Promise<void>;
}

function formatDate(iso?: string | null) {
    if (!iso) return "نامشخص";
    return new Date(iso).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function Avatar({ name, id }: { name: string; id: number }) {
    const hue = (Math.abs(id) * 53) % 360;
    return (
        <div
            className="flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-2xl text-[15px] font-extrabold text-white"
            style={{
                background: `linear-gradient(135deg, oklch(55% 0.18 ${hue}), oklch(45% 0.22 ${(hue + 30) % 360}))`,
            }}
        >
            {name?.charAt(0) ?? "؟"}
        </div>
    );
}

const isFilled = (v?: string | null): v is string =>
    typeof v === "string" && v.trim().length > 0;

type NameLike = {
    id?: unknown;
    full_name?: string | null;
    name?: string | null;
    title?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    username?: string | null;
};

const nameFromObject = (input: unknown): string => {
    if (!input || typeof input !== "object") return "";
    const value = input as NameLike;
    const full = value.full_name ?? value.name ?? value.title ?? "";
    if (isFilled(full)) return full.trim();
    const composed = `${value.first_name ?? ""} ${value.last_name ?? ""}`.trim();
    if (isFilled(composed)) return composed;
    if (isFilled(value.username)) return value.username.trim();
    return "";
};

const resolveName = (
    value: unknown,
    directName?: string | null,
    pool?: readonly unknown[]
): string => {
    if (isFilled(directName)) return directName!.trim();
    const fromObj = nameFromObject(value);
    if (isFilled(fromObj)) return fromObj;
    if (typeof value === "string" && !/^\d+$/.test(value.trim()))
        return value.trim();
    const id =
        typeof value === "number" || typeof value === "string"
            ? String(value)
            : value && typeof value === "object" && (value as NameLike).id !== undefined
                ? String((value as NameLike).id)
                : "";
    if (!id || !pool?.length) return "";
    const found = pool.find(
        (p) =>
            p &&
            typeof p === "object" &&
            (p as NameLike).id !== undefined &&
            String((p as NameLike).id) === id
    );
    return nameFromObject(found);
};

function CaseCard({
    item,
    index,
    customers,
    isDeleting = false,
    hasActiveTasks = false,
    caseTasks = [],
    onOpen,
    onDelete,
    canManageActivation = false,
    onToggleActive,
}: CaseCardProps) {
    const reduced = useReducedMotion() ?? false;
    const { resolvedTheme } = useTheme();

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const isDark = mounted && resolvedTheme === "dark";


    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeletingState, setIsDeletingState] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [showMenu, setShowMenu] = useState(false);

    const customerName = useMemo(
        () =>
            resolveName(
                item.customer,
                item.customerName ?? item.customer_name,
                customers
            ) || "بدون مشتری",
        [item.customer, item.customerName, item.customer_name, customers]
    );

    const description =
        typeof item.description === "string" ? item.description.trim() : "";
    const canDelete = !hasActiveTasks;
    const isActive = item.active ?? item.is_active ?? true;


    const handleDelete = async () => {
        if (!canDelete || !onDelete) return;
        setIsDeletingState(true);
        setDeleteError("");
        try {
            await onDelete(item);
            setShowConfirm(false);
        } catch {
            setDeleteError("حذف پرونده با خطا مواجه شد");
        } finally {
            setIsDeletingState(false);
        }
    };

    const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    const surfaceBg = isDark ? "rgba(255,255,255,0.02)" : "#fafafa";
    const dividerColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";

    const menuItems: ActionSheetItem[] = [
        ...(canManageActivation && onToggleActive ? [{
            key: "activation",
            label: isActive ? "غیرفعال‌سازی پرونده" : "فعال‌سازی پرونده",
            icon: <Power size={17} />,
            onSelect: () => {
                setShowMenu(false);
                void onToggleActive(item, !isActive);
            },
        } satisfies ActionSheetItem] : []),
        {
            key: "tasks",
            label: caseTasks.length > 0 ? `مشاهده وظایف (${caseTasks.length})` : "مشاهده وظایف",
            icon: <ListTodo size={17} />,
            onSelect: () => {
                setShowMenu(false);
                onOpen?.(item, "tasks");
            },
        },
        {
            key: "report",
            label: "گزارش مسیر پرونده",
            icon: <FileText size={17} />,
            onSelect: () => {
                setShowMenu(false);
                onOpen?.(item, "report");
            },
        },
        {
            key: "edit",
            label: "ویرایش پرونده",
            icon: <SquarePen size={17} />,
            onSelect: () => {
                setShowMenu(false);
                onOpen?.(item, "edit");
            },
        },
        {
            key: "delete",
            label: canDelete ? "حذف پرونده" : "دارای وظیفه فعال",
            icon: <Trash2 size={17} />,
            danger: true,
            disabled: !canDelete,
            onSelect: () => {
                setShowMenu(false);
                setDeleteError("");
                setShowConfirm(true);
            },
        },
    ];

    return (
        <>
            <m.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: Math.min(index, 12) * 0.03 }}
                onClick={() => onOpen?.(item, "tasks")}
                className="case-card group relative z-[1] flex flex-col gap-3 overflow-visible rounded-2xl p-4 transition-[filter,box-shadow] duration-300 hover:z-50 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.35),0_14px_40px_rgba(99,102,241,0.25)] dark:hover:shadow-[0_0_0_1px_rgba(129,140,248,0.45),0_14px_44px_rgba(99,102,241,0.35)]"
                style={{
                    border: `1px solid ${borderColor}`,
                    background: surfaceBg,
                    direction: "rtl",
                    cursor: onOpen ? "pointer" : "default",
                }}
            >
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(true);
                    }}
                    className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-gray-500 transition-colors hover:bg-black/10 active:scale-95 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15"
                    aria-label="گزینه‌ها"
                    aria-haspopup="dialog"
                >
                    <MoreVertical size={15} />
                </button>

                <div className="flex items-center gap-3 pt-1">
                    <Avatar name={item.title || "؟"} id={item.id} />
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="truncate text-[13.5px] font-extrabold leading-tight text-gray-800 dark:text-gray-100">
                            {item.title || "بدون عنوان"}
                        </p>
                        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                            #{item.id}
                        </p>
                    </div>
                </div>

                <div
                    className="flex flex-col gap-2 border-t pt-2.5"
                    style={{ borderColor: dividerColor }}
                >
                    <div className="flex items-center gap-2 text-[11.5px] text-gray-400 dark:text-gray-500">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        <span>
                            مشتری :
                        </span>
                        <span className="truncate">{customerName}</span>
                    </div>

                    {description && (
                        <div className="flex items-start gap-2 text-[11.5px] text-gray-400 dark:text-gray-500">
                            <span>
                                توضیحات :
                            </span>
                            <span className="line-clamp-2 flex-1">{description}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-1.5 text-[11.5px] text-gray-400 dark:text-gray-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>{formatDate(item.created_at)}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {hasActiveTasks && (
                            <span
                                className="rounded-lg bg-rose-50 px-2 py-0.5 text-[10.5px] font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                                style={{ border: "1px solid rgba(244,63,94,0.25)" }}
                            >
                                {caseTasks.length > 0
                                    ? `${caseTasks.length} وظیفه فعال`
                                    : "دارای وظیفه فعال"}
                            </span>
                        )}
                    </div>
                </div>
            </m.div>


            <ActionSheet
                open={showMenu}
                onClose={() => setShowMenu(false)}
                title={item.title || "بدون عنوان"}
                items={menuItems}
            />

            <AnimatePresence>
                {showConfirm && (
                    <div
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                        dir="rtl"
                    >
                        <Backdrop
                            onClick={() => !isDeletingState && setShowConfirm(false)}
                        />

                        <m.div
                            initial={{ opacity: 0, scale: 0.95, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 12 }}
                            transition={{ duration: 0.2 }}
                            className="relative z-10 w-full max-w-sm rounded-3xl p-5 shadow-2xl"
                            style={{
                                background: isDark ? "#12141c" : "#ffffff",
                                border: `1px solid ${borderColor}`,
                            }}
                        >
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                                    <AlertCircle size={22} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-gray-800 dark:text-gray-100">
                                        حذف پرونده
                                    </h3>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        از حذف این پرونده مطمئن هستید؟
                                    </p>
                                </div>
                            </div>

                            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                {item.title || "بدون عنوان"}
                            </p>

                            {deleteError && (
                                <p className="mt-3 text-[11.5px] font-semibold text-red-500">
                                    {deleteError}
                                </p>
                            )}

                            <div className="mt-5 flex gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => !isDeletingState && setShowConfirm(false)}
                                    disabled={isDeletingState}
                                    className="flex-1 rounded-[1.25rem] py-2.5 text-[12.5px] font-bold text-gray-600 transition-all active:scale-[0.98] disabled:opacity-50 dark:text-gray-300"
                                    style={{
                                        background: isDark
                                            ? "rgba(255,255,255,0.05)"
                                            : "rgba(0,0,0,0.05)",
                                        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                                    }}
                                >
                                    انصراف
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isDeletingState || !canDelete}
                                    className="relative flex flex-1 items-center justify-center gap-2 rounded-[1.25rem] py-2.5 text-[12.5px] font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
                                    style={{
                                        background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                        border: "1px solid rgba(239,68,68,0.3)",
                                    }}
                                >
                                    <BusyContent busy={isDeletingState}>
                                        <Trash2 size={14} />
                                        حذف پرونده
                                    </BusyContent>
                                </button>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

export default memo(CaseCard);
