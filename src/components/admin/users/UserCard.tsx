"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { m, AnimatePresence } from "framer-motion";
import { Phone, Trash2, SquarePen, CalendarDays, Star, Loader2, MoreVertical, AlertCircle, ShieldCheck, Check, Power, SlidersHorizontal, Crown, Building2, X, KeyRound, Camera } from "lucide-react";
import { accountsApi, departmentsApi } from "@/lib/api";
import type { ApiEmployee } from "@/types/users";
import EditUserModal from "@/components/admin/users/EditUserModal";
import AdjustScoreModal from "@/components/admin/users/AdjustScoreModal";
import UserAvatar from "@/components/ui/UserAvatar";
import AvatarUploader from "@/components/ui/AvatarUploader";
import SetPasswordModal from "@/components/admin/users/SetPasswordModal";
import { useAuthStore } from "@/store/authStore";
import { useAvatarStore } from "@/store/avatarStore";
import { apiMessage } from "@/lib/apiMessage";





export interface UserInfo {
    id: number;
    phone: string | null;
    isActive: boolean | null;
}

interface UserCardProps {
    employee: ApiEmployee;
    departmentName?: string | null;
    activeTaskTitles?: string[];
    index: number;
    hasActiveTasks?: boolean;
    userInfo?: UserInfo | null;
    score?: number | null;
    onDelete: (id: number) => void;
    onUpdated: (employee: ApiEmployee) => void;
    onScoreChanged?: (
        employeeId: number,
        action: "add" | "deduct",
        amount: number
    ) => void;
}

type Placement = "left" | "right";
type ActionKey = "toggleActive" | "edit" | "adjustScore" | "manager" | "delete" | "password" | "avatar";

type DepartmentMembership = {
    id: number;
    employee: number;
    employee_name: string;
    department: number;
    department_name: string;
    created_at?: string;
    updated_at?: string;
    is_manager?: boolean;
};





const EMPTY_TITLES: string[] = [];

const SWEEP_GRADIENTS: Record<string, string> = {
    edit: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
    adjustScore: "linear-gradient(90deg, #f59e0b, #10b981)",
    manager: "linear-gradient(90deg, #f59e0b, #f97316)",
    delete: "#ef4444",
    password: "linear-gradient(90deg, #6366f1, #8b5cf6)",
    avatar: "linear-gradient(90deg, #10b981, #06b6d4)",
};

const SHEET_TONES = {
    blue: "border-blue-500/15 bg-blue-500/[0.08] text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/[0.12] dark:text-blue-400",
    emerald:
        "border-emerald-500/15 bg-emerald-500/[0.08] text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/[0.12] dark:text-emerald-400",
    amber:
        "border-amber-500/15 bg-amber-500/[0.08] text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/[0.12] dark:text-amber-400",
    rose: "border-rose-500/15 bg-rose-500/[0.08] text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/[0.12] dark:text-rose-400",
} as const;

const SHEET_DISABLED =
    "cursor-not-allowed border-black/[0.06] bg-black/[0.03] text-gray-400 opacity-50 dark:border-white/[0.06] dark:bg-white/[0.03]";

const PANEL_BASE =
    "w-full rounded-[2rem] border border-gray-900/[0.08] bg-white p-5 shadow-2xl dark:border-white/[0.08] dark:bg-gray-900";

const SOFT_BUTTON =
    "rounded-2xl bg-gray-900/5 py-2.5 text-[12.5px] font-bold text-gray-600 disabled:opacity-50 dark:bg-white/5 dark:text-gray-300";





let dateFormatter: Intl.DateTimeFormat | null = null;

function formatDate(iso?: string | null) {
    if (!iso) return "نامشخص";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "نامشخص";
    if (!dateFormatter) {
        dateFormatter = new Intl.DateTimeFormat("fa-IR", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }
    return dateFormatter.format(date);
}

function getErrorMessage(error: unknown, fallback: string) {
    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: unknown }).response === "object"
    ) {
        const response = (
            error as {
                response?: {
                    data?: {
                        detail?: string;
                        message?: string;
                    };
                };
            }
        ).response;

        const detail = response?.data?.detail || response?.data?.message;
        if (detail) return detail;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }
    return fallback;
}



let lastRawUser: string | null = null;
let lastLoggedUserId: number | null = null;

function readLoggedUserId(): number | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem("user");
        if (raw === lastRawUser) return lastLoggedUserId;
        lastRawUser = raw;
        const parsed = raw ? JSON.parse(raw) : null;
        lastLoggedUserId = typeof parsed?.id === "number" ? parsed.id : null;
    } catch {
        lastRawUser = null;
        lastLoggedUserId = null;
    }
    return lastLoggedUserId;
}

const subscribeNoop = () => () => { };
const getServerLoggedUserId = () => null;

function useLoggedUserId() {
    return useSyncExternalStore(
        subscribeNoop,
        readLoggedUserId,
        getServerLoggedUserId
    );
}



function useMountedOnce(flag: boolean) {
    const ref = useRef(false);
    if (flag) ref.current = true;
    return ref.current;
}



function useModalBehavior(onClose: () => void, locked: boolean) {
    const onCloseRef = useRef(onClose);
    const lockedRef = useRef(locked);

    useEffect(() => {
        onCloseRef.current = onClose;
        lockedRef.current = locked;
    });

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !lockedRef.current) onCloseRef.current();
        };
        document.addEventListener("keydown", onKeyDown);

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, []);
}





function StatusSwitch({
    isActive,
    loading,
    disabled,
    title,
    onToggle,
}: {
    isActive: boolean;
    loading: boolean;
    disabled: boolean;
    title?: string;
    onToggle: () => void;
}) {
    const trackClass = isActive
        ? "border-emerald-500/30 bg-emerald-500/[0.14] dark:border-emerald-500/40 dark:bg-emerald-500/20"
        : "border-gray-400/35 bg-[#e9ecf1] dark:border-gray-400/30 dark:bg-gray-400/[0.16]";

    const knobClass = isActive
        ? "translate-x-0 bg-emerald-500"
        : "translate-x-6 bg-gray-400 dark:bg-gray-500";

    return (
        <button
            type="button"
            role="switch"
            aria-checked={isActive}
            dir="ltr"
            title={title}
            disabled={disabled || loading}
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled && !loading) onToggle();
            }}
            className={`relative inline-flex h-7 w-[52px] shrink-0 items-center rounded-full border-[1.5px] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 ${trackClass} ${disabled
                ? "cursor-not-allowed opacity-55"
                : loading
                    ? "cursor-wait"
                    : "cursor-pointer"
                }`}
        >
            <span
                className={`absolute left-[1.5px] top-[1.5px] flex h-6 w-6 items-center justify-center rounded-full text-white shadow-[0_2px_6px_rgba(15,23,42,0.22)] transition-[transform,background-color] duration-200 ${knobClass}`}
            >
                {loading ? (
                    <Loader2 size={12} className="animate-spin" />
                ) : isActive ? (
                    <Check size={13} strokeWidth={3.2} />
                ) : (
                    <Power size={12} strokeWidth={2.6} />
                )}
            </span>
        </button>
    );
}

function ActionButton({
    sweepKey,
    icon,
    label,
    disabled,
    onClick,
}: {
    sweepKey: string;
    icon: ReactNode;
    label: string;
    disabled: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            aria-disabled={disabled}
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled) onClick();
            }}
            className={`relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-black/[0.14] bg-[#e2e2e2] transition-[color,transform] duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 dark:border-white/[0.13] dark:bg-[#1e1e1e] ${disabled
                ? "cursor-not-allowed text-gray-400 opacity-45 dark:text-gray-500"
                : "cursor-pointer text-gray-700 active:scale-95 group-hover/btn:text-white dark:text-gray-200"
                }`}
        >
            {!disabled && (
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 origin-left scale-x-0 rounded-full transition-transform duration-300 ease-out group-hover/btn:scale-x-100"
                    style={{ background: SWEEP_GRADIENTS[sweepKey] ?? "#6366f1" }}
                />
            )}
            <span className="relative z-10 flex items-center justify-center">
                {icon}
            </span>
        </button>
    );
}





function Portal({ children }: { children: ReactNode }) {
    if (typeof document === "undefined") return null;
    return createPortal(children, document.body);
}

function ModalFrame({
    onClose,
    locked = false,
    label,
    position = "center",
    className = "",
    children,
}: {
    onClose: () => void;
    locked?: boolean;
    label: string;
    position?: "center" | "bottom";
    className?: string;
    children: ReactNode;
}) {
    useModalBehavior(onClose, locked);

    return (
        <Portal>
            <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => {
                    if (!locked) onClose();
                }}
                role="dialog"
                aria-modal="true"
                aria-label={label}
                dir="rtl"
                className={`fixed inset-0 z-[100] flex justify-center bg-black/60 ${position === "bottom" ? "items-end" : "items-center p-4"
                    } ${className}`}
            >
                {children}
            </m.div>
        </Portal>
    );
}





function DepartmentManagerModal({
    employeeId,
    employeeName,
    onClose,
}: {
    employeeId: number;
    employeeName: string;
    onClose: () => void;
}) {
    const [memberships, setMemberships] = useState<DepartmentMembership[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [savingId, setSavingId] = useState<number | null>(null);
    const [actionError, setActionError] = useState("");

    useEffect(() => {
        let alive = true;

        departmentsApi
            .employees()
            .then((list) => {
                if (!alive) return;
                setMemberships(list);
            })
            .catch((err) => {
                if (!alive) return;
                setLoadError(
                    getErrorMessage(err, "دریافت لیست دپارتمان‌ها با خطا مواجه شد")
                );
            })
            .finally(() => {
                if (!alive) return;
                setLoading(false);
            });

        return () => {
            alive = false;
        };
    }, []);

    const myMemberships = useMemo(
        () => memberships.filter((item) => Number(item.employee) === Number(employeeId)),
        [memberships, employeeId]
    );

    const managersByDepartment = useMemo(() => {
        const map: Record<number, string[]> = {};
        memberships.forEach((item) => {
            if (!item.is_manager) return;
            const key = Number(item.department);
            if (!map[key]) map[key] = [];
            map[key].push(item.employee_name);
        });
        return map;
    }, [memberships]);

    const handleToggleManager = async (membership: DepartmentMembership) => {
        if (savingId !== null) return;

        const nextValue = !membership.is_manager;
        setSavingId(membership.id);
        setActionError("");

        try {
            await departmentsApi.updateAssignment(membership.id, {
                department: membership.department,
                is_manager: nextValue,
            });

            setMemberships((prev) =>
                prev.map((item) =>
                    item.id === membership.id ? { ...item, is_manager: nextValue } : item
                )
            );
        } catch (err) {
            setActionError(
                getErrorMessage(err, "تغییر وضعیت مدیر دپارتمان با خطا مواجه شد")
            );
        } finally {
            setSavingId(null);
        }
    };

    const busy = savingId !== null;

    return (
        <ModalFrame onClose={onClose} locked={busy} label="مدیر دپارتمان">
            <m.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.16 }}
                onClick={(e) => e.stopPropagation()}
                className={`${PANEL_BASE} max-w-[420px]`}
            >
                <div className="mb-4 flex items-center justify-between gap-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 dark:bg-amber-500/[0.14]">
                            <Crown size={16} className="text-amber-500" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                مدیر دپارتمان
                            </h3>
                            <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                                {employeeName}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 text-gray-500 transition-colors disabled:opacity-50 dark:bg-white/10 dark:text-gray-300"
                        aria-label="بستن"
                    >
                        <X size={15} />
                    </button>
                </div>

                <p className="mb-3 text-[11.5px] leading-6 text-gray-500 dark:text-gray-400">
                    با روشن کردن سوییچ هر دپارتمان، این کارمند مدیر همان دپارتمان می‌شود.
                </p>

                <div className="max-h-[340px] overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 size={22} className="animate-spin text-indigo-500" />
                        </div>
                    ) : loadError ? (
                        <div className="flex items-center gap-1.5 rounded-2xl p-3 text-[12px] font-semibold text-red-500">
                            <AlertCircle size={15} className="shrink-0" />
                            <span>{loadError}</span>
                        </div>
                    ) : myMemberships.length === 0 ? (
                        <div className="rounded-2xl bg-black/[0.03] p-4 text-center text-[12px] text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
                            این کاربر عضو هیچ دپارتمانی نیست
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {myMemberships.map((membership) => {
                                const isManager = Boolean(membership.is_manager);
                                const managers =
                                    managersByDepartment[Number(membership.department)] ?? [];

                                return (
                                    <div
                                        key={membership.id}
                                        className={`flex items-center justify-between gap-3 rounded-2xl border p-3 ${isManager
                                            ? "border-amber-500/30 bg-amber-500/[0.08] dark:bg-amber-500/10"
                                            : "border-black/[0.06] bg-black/[0.03] dark:border-white/[0.06] dark:bg-white/[0.03]"
                                            }`}
                                    >
                                        <div className="flex min-w-0 flex-col gap-1">
                                            <div className="flex items-center gap-1.5">
                                                <Building2
                                                    size={14}
                                                    className="shrink-0 text-gray-400 dark:text-gray-500"
                                                />
                                                <span className="truncate text-[13px] font-extrabold text-gray-800 dark:text-gray-100">
                                                    {membership.department_name}
                                                </span>
                                                {isManager && (
                                                    <span className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-500/[0.16] px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                                        <Crown size={10} />
                                                        مدیر
                                                    </span>
                                                )}
                                            </div>
                                            <span className="truncate text-[10.5px] text-gray-500 dark:text-gray-400">
                                                {managers.length > 0
                                                    ? `مدیر فعلی: ${managers.join("، ")}`
                                                    : "مدیری برای این دپارتمان تعیین نشده"}
                                            </span>
                                        </div>

                                        <StatusSwitch
                                            isActive={isManager}
                                            loading={savingId === membership.id}
                                            disabled={busy && savingId !== membership.id}
                                            title={
                                                isManager
                                                    ? "حذف از مدیریت این دپارتمان"
                                                    : "تعیین به عنوان مدیر این دپارتمان"
                                            }
                                            onToggle={() => handleToggleManager(membership)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {actionError && (
                    <p className="mt-3 text-[11.5px] font-semibold text-red-500">
                        {actionError}
                    </p>
                )}

                <div className="mt-5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className={`w-full ${SOFT_BUTTON}`}
                    >
                        بستن
                    </button>
                </div>
            </m.div>
        </ModalFrame>
    );
}





function ConfirmDeleteDialog({
    name,
    isDeleting,
    error,
    onCancel,
    onConfirm,
}: {
    name: string;
    isDeleting: boolean;
    error: string;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <ModalFrame onClose={onCancel} locked={isDeleting} label="حذف کاربر">
            <m.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.16 }}
                onClick={(e) => e.stopPropagation()}
                className={`${PANEL_BASE} max-w-[360px]`}
            >
                <div className="mb-4 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-500/[0.08] dark:bg-red-500/[0.14]">
                        <Trash2 size={16} className="text-red-500" />
                    </div>
                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                        حذف کاربر
                    </h3>
                </div>

                <p className="text-[12.5px] leading-6 text-gray-600 dark:text-gray-400">
                    آیا از حذف حساب{" "}
                    <span className="font-extrabold text-gray-900 dark:text-white">
                        «{name}»
                    </span>{" "}
                    اطمینان دارید؟ این عملیات قابل بازگشت نیست.
                </p>

                {error && (
                    <p className="mt-3 text-[11.5px] font-semibold text-red-500">{error}</p>
                )}

                <div className="mt-5 flex gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isDeleting}
                        className={`flex-1 ${SOFT_BUTTON}`}
                    >
                        انصراف
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 py-2.5 text-[12.5px] font-bold text-white shadow-[0_10px_24px_rgba(239,68,68,0.22)] disabled:opacity-60"
                    >
                        {isDeleting ? (
                            <Loader2 size={15} className="animate-spin" />
                        ) : (
                            <Trash2 size={14} />
                        )}
                        {isDeleting ? "در حال حذف..." : "حذف کن"}
                    </button>
                </div>
            </m.div>
        </ModalFrame>
    );
}





function SheetButton({
    tone,
    icon,
    label,
    disabled = false,
    onClick,
}: {
    tone: keyof typeof SHEET_TONES;
    icon: ReactNode;
    label: string;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-[13.5px] font-bold transition-transform ${disabled ? SHEET_DISABLED : `${SHEET_TONES[tone]} active:scale-[0.98]`
                }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}

function MobileSheet({
    employee,
    departmentName,
    isActive,
    togglingActive,
    isSelf,
    isAdmin,
    canDelete,
    deleteTooltipText,
    onClose,
    onToggleActive,
    onEdit,
    onAdjust,
    onManager,
    onRequestDelete,
    canManageProfile,
    userId,
    onPassword,
    onAvatar,
}: {
    employee: ApiEmployee;
    departmentName: string | null;
    isActive: boolean;
    togglingActive: boolean;
    isSelf: boolean;
    isAdmin: boolean;
    canDelete: boolean;
    deleteTooltipText: string;
    onClose: () => void;
    onToggleActive: () => void;
    onEdit: () => void;
    onAdjust: () => void;
    onManager: () => void;
    onRequestDelete: () => void;
    canManageProfile: boolean;
    userId: number | null;
    onPassword: () => void;
    onAvatar: () => void;
}) {
    return (
        <ModalFrame
            onClose={onClose}
            label="گزینه‌های کاربر"
            position="bottom"
            className="md:hidden"
        >
            <m.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 340 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-t-[28px] border-t border-black/[0.08] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl dark:border-white/10 dark:bg-[#12141c]"
            >
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />

                <div className="mb-4 flex items-center justify-between border-b border-black/5 pb-3 dark:border-white/5">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <UserAvatar src={employee.avatar} name={employee.full_name || "؟"} id={employee.id} />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-extrabold text-gray-800 dark:text-gray-100">
                                {employee.full_name || "بدون نام"}
                            </p>
                            <p className="truncate text-[11px] text-gray-400 dark:text-gray-500">
                                @{employee.username}
                                {departmentName ? ` • ${departmentName}` : ""}
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                            {isActive ? "فعال" : "غیرفعال"}
                        </span>
                        <StatusSwitch
                            isActive={isActive}
                            loading={togglingActive}
                            disabled={isSelf}
                            title={
                                isSelf
                                    ? "امکان تغییر وضعیت حساب خود وجود ندارد"
                                    : isActive
                                        ? "حساب فعال است"
                                        : "حساب غیرفعال است"
                            }
                            onToggle={onToggleActive}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <SheetButton
                        tone="blue"
                        icon={<SquarePen size={18} />}
                        label="ویرایش اطلاعات کاربر"
                        onClick={onEdit}
                    />
                    <SheetButton
                        tone="emerald"
                        icon={<SlidersHorizontal size={18} />}
                        label="تغییر امتیاز"
                        disabled={isAdmin}
                        onClick={onAdjust}
                    />
                    <SheetButton
                        tone="amber"
                        icon={<Crown size={18} />}
                        label="تعیین مدیر دپارتمان"
                        onClick={onManager}
                    />
                    {canManageProfile && (
                        <>
                            <SheetButton tone="blue" icon={<KeyRound size={18} />} label="تغییر رمز عبور" disabled={!userId} onClick={onPassword} />
                            <SheetButton tone="emerald" icon={<Camera size={18} />} label="عکس پروفایل" disabled={!userId} onClick={onAvatar} />
                        </>
                    )}

                    <div className="flex flex-col gap-1.5 pt-1">
                        <SheetButton
                            tone="rose"
                            icon={<Trash2 size={18} />}
                            label="حذف کاربر"
                            disabled={!canDelete}
                            onClick={onRequestDelete}
                        />

                        {!canDelete && deleteTooltipText && (
                            <div className="flex items-center gap-1.5 px-2 text-[11.5px] text-rose-500 dark:text-rose-400">
                                <AlertCircle size={14} className="shrink-0" />
                                <span>{deleteTooltipText}</span>
                            </div>
                        )}
                    </div>
                </div>
            </m.div>
        </ModalFrame>
    );
}





function UserCard({
    employee,
    departmentName = null,
    activeTaskTitles = EMPTY_TITLES,
    hasActiveTasks = false,
    userInfo = null,
    score = null,
    onDelete,
    onUpdated,
    onScoreChanged,
}: UserCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const aliveRef = useRef(true);

    useEffect(() => {
        aliveRef.current = true;
        return () => {
            aliveRef.current = false;
        };
    }, []);

    const [placement, setPlacement] = useState<Placement>("right");

    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [showEdit, setShowEdit] = useState(false);
    const [showAdjust, setShowAdjust] = useState(false);
    const [showManager, setShowManager] = useState(false);
    const [showMobileSheet, setShowMobileSheet] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const loggedUserType = useAuthStore((state) => state.userType);
    const setMyAvatar = useAvatarStore((state) => state.setMyAvatar);
    const canManageProfile = loggedUserType === 1;

    const editMounted = useMountedOnce(showEdit);

    const phoneNumber = userInfo?.phone ?? null;
    const userId = userInfo?.id ?? employee.user_id ?? employee.user ?? null;

    const [isActive, setIsActive] = useState<boolean>(
        userInfo?.isActive ??
        (employee as unknown as { is_active?: boolean }).is_active ??
        true
    );
    const [togglingActive, setTogglingActive] = useState(false);

    useEffect(() => {
        if (typeof userInfo?.isActive === "boolean") setIsActive(userInfo.isActive);
    }, [userInfo?.isActive]);

    const isRight = placement === "right";

    const checkPosition = useCallback(() => {
        const card = cardRef.current;
        const parent = card?.parentElement;
        if (!card || !parent) return;

        const cardRect = card.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();

        const spaceRight = parentRect.right - cardRect.right;
        const spaceLeft = cardRect.left - parentRect.left;

        setPlacement(spaceRight >= spaceLeft ? "right" : "left");
    }, []);

    const loggedUserId = useLoggedUserId();
    const isSelf = userId !== null && loggedUserId !== null && loggedUserId === userId;

    const isAdmin = employee.type === 1;
    const canDelete = !isAdmin && !isSelf && !hasActiveTasks;

    const deleteTooltipText = useMemo(() => {
        if (isAdmin) return "امکان حذف مدیر سیستم وجود ندارد";
        if (isSelf) return "شما نمی‌توانید حساب خود را حذف کنید";
        if (hasActiveTasks) return "این کاربر دارای تسک فعال است";
        return "حذف کاربر";
    }, [isAdmin, isSelf, hasActiveTasks]);

    const formattedDate = useMemo(
        () => formatDate(employee.created_at),
        [employee.created_at]
    );

    const handleToggleActive = useCallback(async () => {
        if (togglingActive || !userId || isSelf) return;

        const nextState = !isActive;
        setTogglingActive(true);

        try {
            await accountsApi.users.update(userId, {
                username: employee.username,
                phone_number: phoneNumber || "",
                type: employee.type ?? 2,
                is_active: nextState,
            });

            if (aliveRef.current) setIsActive(nextState);
            onUpdated({
                ...employee,
                is_active: nextState,
            } as ApiEmployee);
        } catch (err) {
            console.error("خطا در تغییر وضعیت حساب:", err);
        } finally {
            if (aliveRef.current) setTogglingActive(false);
        }
    }, [togglingActive, userId, isSelf, isActive, employee, phoneNumber, onUpdated]);

    const handleDelete = useCallback(async () => {
        if (!canDelete) return;
        setIsDeleting(true);
        setDeleteError("");

        try {
            const normalizedUsername = (employee.username || "").trim().toLowerCase();

            const [users, matchedEmployee] = await Promise.all([
                accountsApi.users.lookup(normalizedUsername).catch(() => []),
                accountsApi.employees.get(employee.id).catch(() => null),
            ]);

            const matchedUser = users.find(
                (user) => user.username?.trim().toLowerCase() === normalizedUsername
            );

            const employeeDeleteId = matchedEmployee?.id;
            const userDeleteId = matchedUser?.id;

            if (!employeeDeleteId && !userDeleteId) {
                throw new Error("شناسه حذف کاربر پیدا نشد");
            }

            if (employeeDeleteId) {
                await accountsApi.employees.remove(employeeDeleteId);
            }

            if (userDeleteId && matchedUser?.type !== 1) {
                await accountsApi.users.remove(userDeleteId);
            }

            onDelete(employee.id);
            if (aliveRef.current) setShowConfirm(false);
        } catch (err) {
            if (aliveRef.current) {
                setDeleteError(getErrorMessage(err, "حذف کاربر با خطا مواجه شد"));
            }
        } finally {
            if (aliveRef.current) setIsDeleting(false);
        }
    }, [canDelete, employee.id, employee.username, onDelete]);

    const closeSheetThen = useCallback((fn: () => void) => {
        setShowMobileSheet(false);
        fn();
    }, []);

    const actions: {
        key: ActionKey;
        tooltip: string;
        disabled: boolean;
        icon: ReactNode;
        onClick: () => void;
    }[] = [
            {
                key: "toggleActive",
                tooltip: isSelf
                    ? "امکان تغییر وضعیت حساب خود وجود ندارد"
                    : isActive
                        ? "غیرفعال‌سازی کاربر"
                        : "فعال‌سازی کاربر",
                disabled: isSelf,
                icon: null,
                onClick: handleToggleActive,
            },
            {
                key: "edit",
                tooltip: "ویرایش اطلاعات",
                disabled: false,
                icon: <SquarePen size={16} />,
                onClick: () => setShowEdit(true),
            },
            {
                key: "adjustScore",
                tooltip: isAdmin ? "امتیاز مدیر سیستم قابل تغییر نیست" : "تغییر امتیاز",
                disabled: isAdmin,
                icon: <SlidersHorizontal size={16} />,
                onClick: () => setShowAdjust(true),
            },
            {
                key: "manager",
                tooltip: "تعیین مدیر دپارتمان",
                disabled: false,
                icon: <Crown size={16} />,
                onClick: () => setShowManager(true),
            },
            ...(canManageProfile ? [
                {
                    key: "password" as const,
                    tooltip: userId == null ? "شناسه کاربر در دسترس نیست" : "تغییر رمز عبور",
                    disabled: userId == null,
                    icon: <KeyRound size={16} />,
                    onClick: () => setShowPasswordModal(true),
                },
                {
                    key: "avatar" as const,
                    tooltip: userId == null ? "شناسه کاربر در دسترس نیست" : "تغییر عکس پروفایل",
                    disabled: userId == null,
                    icon: <Camera size={16} />,
                    onClick: () => setShowAvatarModal(true),
                },
            ] : []),
            {
                key: "delete",
                tooltip: deleteTooltipText,
                disabled: !canDelete,
                icon: <Trash2 size={16} />,
                onClick: () => setShowConfirm(true),
            },
        ];

    const tooltipPositionClass = isRight
        ? "left-full top-1/2 ml-2.5 -translate-y-1/2"
        : "right-full top-1/2 mr-2.5 -translate-y-1/2";

    return (
        <>
            <div
                ref={cardRef}
                onMouseEnter={checkPosition}
                dir="rtl"
                className="user-card group/card relative z-[1] flex flex-col gap-3 rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 transition-shadow duration-200 hover:z-50 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.35),0_14px_40px_rgba(99,102,241,0.25)] focus-within:z-50 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:shadow-[0_0_0_1px_rgba(129,140,248,0.45),0_14px_44px_rgba(99,102,241,0.35)]"
            >
                
                <div
                    className={`peer pointer-events-none absolute top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-2.5 opacity-0 transition-opacity duration-150 group-focus-within/card:pointer-events-auto group-focus-within/card:opacity-100 group-hover/card:pointer-events-auto group-hover/card:opacity-100 md:flex ${isRight ? "-right-[59px] pl-6" : "-left-[59px] pr-6"
                        }`}
                >
                    {actions.map((act) => (
                        <div
                            key={act.key}
                            className="group/btn relative flex items-center justify-center"
                        >
                            {act.key === "toggleActive" ? (
                                <StatusSwitch
                                    isActive={isActive}
                                    loading={togglingActive}
                                    disabled={isSelf}
                                    onToggle={handleToggleActive}
                                />
                            ) : (
                                <ActionButton
                                    sweepKey={act.key}
                                    icon={act.icon}
                                    label={act.tooltip}
                                    disabled={act.disabled}
                                    onClick={act.onClick}
                                />
                            )}

                            <span
                                role="tooltip"
                                dir="rtl"
                                className={`pointer-events-none absolute z-[60] whitespace-nowrap rounded-2xl border border-white/[0.08] bg-gray-800 px-3 py-2 text-center text-[11px] font-bold text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover/btn:opacity-100 dark:bg-gray-900 ${tooltipPositionClass}`}
                            >
                                {act.tooltip}
                            </span>
                        </div>
                    ))}
                </div>

                
                {hasActiveTasks && (
                    <div
                        className={`pointer-events-none absolute top-1/2 z-[70] hidden -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover/card:opacity-100 peer-hover:!opacity-0 md:block ${isRight ? "left-full ml-[70px]" : "right-full mr-[70px]"
                            }`}
                    >
                        <div
                            dir="rtl"
                            className="w-56 rounded-2xl border border-white/[0.08] bg-gray-800 p-3 shadow-2xl dark:bg-gray-900"
                        >
                            <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5 text-[11px] font-extrabold text-rose-400">
                                <AlertCircle size={13} />
                                <span>لیست تسک‌های در حال انجام</span>
                            </div>
                            {activeTaskTitles.length > 0 ? (
                                <ul className="mt-2 space-y-1.5">
                                    {activeTaskTitles.map((title, idx) => (
                                        <li
                                            key={`${title}-${idx}`}
                                            className="flex items-start gap-1.5 text-[10.5px] leading-4 text-gray-300"
                                        >
                                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-400" />
                                            <span className="line-clamp-2 min-w-0 break-words">
                                                {title}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-1.5 text-[10px] text-gray-400">
                                    این کاربر تسک دارد ولی هیچ‌کدام در حال انجام نیست
                                </p>
                            )}
                        </div>
                    </div>
                )}

                
                <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMobileSheet(true);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-gray-500 transition-transform active:scale-95 dark:bg-white/10 dark:text-gray-300 md:hidden"
                        aria-label="گزینه‌ها"
                    >
                        <MoreVertical size={15} />
                    </button>

                    {score !== null && (
                        <div
                            className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-black text-amber-600 dark:border-amber-500/25 dark:bg-amber-500/[0.14] dark:text-amber-400"
                            title="امتیاز عملکرد"
                        >
                            <Star size={12} fill="currentColor" />
                            <span>{score}</span>
                        </div>
                    )}
                </div>

                
                <div className="flex items-center gap-3 pt-1">
                    <UserAvatar src={employee.avatar} name={employee.full_name || "؟"} id={employee.id} />
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="truncate text-[13.5px] font-extrabold leading-tight text-gray-800 dark:text-gray-100">
                            {employee.full_name || "بدون نام"}
                        </p>
                        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                            @{employee.username}
                        </p>
                    </div>
                </div>

                
                <div className="flex flex-col gap-2 border-t border-black/5 pt-2.5 dark:border-white/5">
                    {phoneNumber && (
                        <div className="flex items-center gap-2 text-[11.5px] text-gray-400 dark:text-gray-500">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span dir="ltr">{phoneNumber}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-[11.5px] text-gray-400 dark:text-gray-500">
                        <div className="flex min-w-0 items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                                {isAdmin ? "ادمین سیستم" : "کارمند"}
                                {departmentName ? ` • ${departmentName}` : ""}
                            </span>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span>{formattedDate}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span
                            className={`rounded-lg border bg-gradient-to-br px-2 py-0.5 text-[10.5px] font-bold ${isAdmin
                                ? "border-amber-500/25 from-amber-500/[0.18] to-amber-600/[0.18] text-amber-600 dark:text-amber-400"
                                : "border-indigo-500/25 from-indigo-500/[0.18] to-violet-500/[0.18] text-indigo-500 dark:text-indigo-300"
                                }`}
                        >
                            {isAdmin ? "مدیر کل" : "کاربر سامانه"}
                        </span>

                        {hasActiveTasks && (
                            <span className="rounded-lg border border-rose-500/25 bg-rose-50 px-2 py-0.5 text-[10.5px] font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                                {activeTaskTitles.length > 0
                                    ? `${activeTaskTitles.length} تسک فعال`
                                    : "دارای تسک"}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            
            <AnimatePresence>
                {showMobileSheet && (
                    <MobileSheet
                        key="mobile-sheet"
                        employee={employee}
                        departmentName={departmentName}
                        isActive={isActive}
                        togglingActive={togglingActive}
                        isSelf={isSelf}
                        isAdmin={isAdmin}
                        canDelete={canDelete}
                        deleteTooltipText={deleteTooltipText}
                        onClose={() => setShowMobileSheet(false)}
                        onToggleActive={handleToggleActive}
                        onEdit={() => closeSheetThen(() => setShowEdit(true))}
                        onAdjust={() => {
                            if (!isAdmin) closeSheetThen(() => setShowAdjust(true));
                        }}
                        onManager={() => closeSheetThen(() => setShowManager(true))}
                        onRequestDelete={() => {
                            if (canDelete) closeSheetThen(() => setShowConfirm(true));
                        }}
                        canManageProfile={canManageProfile}
                        userId={userId}
                        onPassword={() => closeSheetThen(() => setShowPasswordModal(true))}
                        onAvatar={() => closeSheetThen(() => setShowAvatarModal(true))}
                    />
                )}
            </AnimatePresence>

            
            <AnimatePresence>
                {showConfirm && (
                    <ConfirmDeleteDialog
                        key="confirm-delete"
                        name={employee.full_name || employee.username}
                        isDeleting={isDeleting}
                        error={deleteError}
                        onCancel={() => setShowConfirm(false)}
                        onConfirm={handleDelete}
                    />
                )}
            </AnimatePresence>

            
            <AnimatePresence>
                {showManager && (
                    <DepartmentManagerModal
                        key={`manager-modal-${employee.id}`}
                        employeeId={employee.id}
                        employeeName={employee.full_name || employee.username}
                        onClose={() => setShowManager(false)}
                    />
                )}
            </AnimatePresence>

            
            {editMounted && (
                <EditUserModal
                    isOpen={showEdit}
                    onClose={() => setShowEdit(false)}
                    employee={employee}
                    onUpdated={(updatedEmployee: ApiEmployee) => {
                        onUpdated(updatedEmployee);
                        setShowEdit(false);
                    }}
                />
            )}

            
            {showPasswordModal && userId != null && (
                <SetPasswordModal userId={userId} userName={employee.full_name || employee.username} onClose={() => setShowPasswordModal(false)} />
            )}
            {showAvatarModal && userId != null && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" dir="rtl">
                    <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-gray-900">
                        <div className="mb-5 flex items-center justify-between"><h3 className="font-black">عکس پروفایل {employee.full_name}</h3><button onClick={() => setShowAvatarModal(false)}>✕</button></div>
                        <AvatarUploader
                            current={employee.avatar}
                            name={employee.full_name || employee.username}
                            id={userId}
                            onUpload={async (file) => {
                                try {
                                    const avatar = await accountsApi.users.uploadAvatar(userId, file);
                                    onUpdated({ ...employee, avatar });
                                    if (isSelf) setMyAvatar(avatar);
                                    else setMyAvatar(useAvatarStore.getState().myAvatar);
                                } catch (error) { throw new Error(apiMessage(error, "آپلود عکس انجام نشد")); }
                            }}
                            onRemove={async () => {
                                try {
                                    await accountsApi.users.removeAvatar(userId);
                                    onUpdated({ ...employee, avatar: null });
                                    if (isSelf) setMyAvatar(null);
                                    else setMyAvatar(useAvatarStore.getState().myAvatar);
                                } catch (error) { throw new Error(apiMessage(error, "حذف عکس انجام نشد")); }
                            }}
                        />
                    </div>
                </div>
            )}
            <AnimatePresence>
                {showAdjust && (
                    <AdjustScoreModal
                        isOpen={showAdjust}
                        employeeId={employee.id}
                        employeeName={employee.full_name || employee.username}
                        currentScore={score}
                        onClose={() => setShowAdjust(false)}
                        onSuccess={(action, amount) =>
                            onScoreChanged?.(employee.id, action, amount)
                        }
                    />
                )}
            </AnimatePresence>
        </>
    );
}

export default memo(UserCard);