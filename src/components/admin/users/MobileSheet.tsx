"use client";

import { m } from "framer-motion";
import {
    AlertCircle,
    Camera,
    Crown,
    KeyRound,
    SlidersHorizontal,
    SquarePen,
    Trash2,
} from "lucide-react";
import type { ApiEmployee } from "@/types/users";
import UserAvatar from "@/components/ui/UserAvatar";
import { ModalFrame } from "./ModalFrame";
import { StatusSwitch } from "./StatusSwitch";
import { SHEET_DISABLED, SHEET_TONES } from "./userCardUtils";
import type { ReactNode } from "react";

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

export function MobileSheet({
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
                className="w-full max-w-lg rounded-t-[28px] border-t border-black/[0.08] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl dark:border-white/10 dark:bg-[#12141c]"
            >
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />

                <div className="mb-4 flex items-center justify-between border-b border-black/5 pb-3 dark:border-white/5">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <UserAvatar src={employee.avatar} name={employee.full_name || "؟"} id={employee.id} />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-gray-800 dark:text-gray-100">
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
