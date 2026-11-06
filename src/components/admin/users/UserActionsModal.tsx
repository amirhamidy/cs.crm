"use client";

import type { ReactNode } from "react";
import {
    AlertCircle,
    Camera,
    Crown,
    KeyRound,
    ShieldCheck,
    SlidersHorizontal,
    SquarePen,
    Trash2,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ModalViews } from "@/components/ui/ModalViews";
import { BusyContent } from "@/components/ui/Button";
import { useModalFlow } from "@/components/ui/useModalFlow";
import { StatusSwitch } from "./StatusSwitch";
import { SHEET_DISABLED, SHEET_TONES } from "./userCardUtils";

type View = "menu" | "delete";

function Row({
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
            className={`flex min-h-11 w-full items-center gap-3 rounded-2xl border p-3.5 text-[13.5px] font-bold ${disabled ? SHEET_DISABLED : SHEET_TONES[tone]}`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}

interface Props {
    open: boolean;
    name: string;
    isActive: boolean;
    togglingActive: boolean;
    isSelf: boolean;
    isAdmin: boolean;
    canDelete: boolean;
    deleteHint: string;
    canManageProfile: boolean;
    hasUserId: boolean;
    isDeleting: boolean;
    deleteError: string;
    onClose: () => void;
    onToggleActive: () => void;
    onEdit: () => void;
    onAdjust: () => void;
    onManager: () => void;
    onPassword: () => void;
    onPermissions: () => void;
    onAvatar: () => void;
    onConfirmDelete: () => void;
}

/** One modal for all user actions; delete confirmation is a view inside it. */
export default function UserActionsModal(p: Props) {
    const flow = useModalFlow<View>("menu");
    const close = () => {
        flow.reset();
        p.onClose();
    };
    const pick = (fn: () => void) => () => {
        close();
        fn();
    };

    return (
        <Modal
            open={p.open}
            onClose={close}
            presentation="center"
            maxWidth="max-w-sm"
            busy={p.isDeleting}
            title={flow.view === "delete" ? "حذف کاربر" : p.name}
            onBack={flow.view === "delete" ? flow.back : undefined}
        >
            <ModalViews view={flow.view}>
                {flow.view === "menu" ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between px-1 pb-1">
                            <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400">
                                {p.isActive ? "فعال" : "غیرفعال"}
                            </span>
                            <StatusSwitch
                                isActive={p.isActive}
                                loading={p.togglingActive}
                                disabled={p.isSelf}
                                onToggle={p.onToggleActive}
                            />
                        </div>
                        <Row tone="blue" icon={<SquarePen size={18} />} label="ویرایش اطلاعات کاربر" onClick={pick(p.onEdit)} />
                        <Row tone="emerald" icon={<SlidersHorizontal size={18} />} label="تغییر امتیاز" disabled={p.isAdmin} onClick={pick(p.onAdjust)} />
                        <Row tone="amber" icon={<Crown size={18} />} label="تعیین مدیر دپارتمان" onClick={pick(p.onManager)} />
                        <Row tone="blue" icon={<ShieldCheck size={18} />} label="سطح دسترسی" disabled={p.isAdmin || !p.hasUserId} onClick={pick(p.onPermissions)} />
                        {p.canManageProfile && (
                            <>
                                <Row tone="blue" icon={<KeyRound size={18} />} label="تغییر رمز عبور" disabled={!p.hasUserId} onClick={pick(p.onPassword)} />
                                <Row tone="emerald" icon={<Camera size={18} />} label="عکس پروفایل" disabled={!p.hasUserId} onClick={pick(p.onAvatar)} />
                            </>
                        )}
                        <Row tone="rose" icon={<Trash2 size={18} />} label="حذف کاربر" disabled={!p.canDelete} onClick={() => flow.push("delete")} />
                        {!p.canDelete && p.deleteHint && (
                            <div className="flex items-center gap-1.5 px-2 text-[11.5px] text-rose-500 dark:text-rose-400">
                                <AlertCircle size={14} className="shrink-0" />
                                <span>{p.deleteHint}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <p className="text-[12.5px] leading-6 text-gray-600 dark:text-gray-400">
                            آیا از حذف حساب{" "}
                            <span className="font-bold text-gray-900 dark:text-white">«{p.name}»</span>{" "}
                            اطمینان دارید؟ این عملیات قابل بازگشت نیست.
                        </p>
                        {p.deleteError && (
                            <p role="alert" className="mt-3 text-[11.5px] font-bold text-red-500">{p.deleteError}</p>
                        )}
                        <div className="mt-5 flex gap-2">
                            <button
                                type="button"
                                onClick={flow.back}
                                disabled={p.isDeleting}
                                className="min-h-11 flex-1 rounded-2xl border border-black/10 text-[12.5px] font-bold text-gray-700 disabled:opacity-60 dark:border-white/10 dark:text-gray-200"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={p.onConfirmDelete}
                                disabled={p.isDeleting}
                                aria-busy={p.isDeleting}
                                className="relative flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-red-500 text-[12.5px] font-bold text-white disabled:opacity-60"
                            >
                                <BusyContent busy={p.isDeleting}>
                                    <Trash2 size={14} />
                                    حذف کن
                                </BusyContent>
                            </button>
                        </div>
                    </div>
                )}
            </ModalViews>
        </Modal>
    );
}
