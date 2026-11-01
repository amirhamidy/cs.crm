"use client";

import { m } from "framer-motion";
import { Trash2 } from "lucide-react";
import { ModalFrame } from "./ModalFrame";
import { PANEL_BASE, SOFT_BUTTON } from "./userCardUtils";

import { BusyContent } from "@/components/ui/Button";
export function ConfirmDeleteDialog({
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
                    <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">
                        حذف کاربر
                    </h3>
                </div>

                <p className="text-[12.5px] leading-6 text-gray-600 dark:text-gray-400">
                    آیا از حذف حساب{" "}
                    <span className="font-bold text-gray-900 dark:text-white">
                        «{name}»
                    </span>{" "}
                    اطمینان دارید؟ این عملیات قابل بازگشت نیست.
                </p>

                {error && (
                    <p className="mt-3 text-[11.5px] font-bold text-red-500">{error}</p>
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
                        className="relative flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 py-2.5 text-[12.5px] font-bold text-white shadow-[0_10px_24px_rgba(239,68,68,0.22)] disabled:opacity-60"
                    >
                        <BusyContent busy={isDeleting}>
                            <Trash2 size={14} />
                            حذف کن
                        </BusyContent>
                    </button>
                </div>
            </m.div>
        </ModalFrame>
    );
}
