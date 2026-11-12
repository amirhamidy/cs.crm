"use client";

import { Copy, KeyRound } from "lucide-react";
import { m } from "framer-motion";
import { toast } from "@/components/notifications/toast";
import { ModalShell } from "@/components/ui/ModalShell";

interface OneTimePasswordModalProps {
    password: string;
    onClose: () => void;
}

export default function OneTimePasswordModal({ password, onClose }: OneTimePasswordModalProps) {
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(password);
            toast.success("رمز کپی شد");
        } catch {
            toast.error("کپی انجام نشد؛ رمز را دستی کپی کنید");
        }
    };

    return (
        <ModalShell
            open
            onClose={onClose}
            title="رمز عبور جدید"
            subtitle="فقط یک بار نمایش داده می‌شود"
            icon={<KeyRound size={18} />}
            maxWidth="max-w-sm"
        >
            <div className="flex flex-col gap-4">
                <p className="rounded-2xl bg-amber-50 p-3 text-[11.5px] leading-6 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    این رمز دیگر نمایش داده نمی‌شود. آن را همین حالا ذخیره و به مشتری تحویل دهید.
                </p>
                <div
                    dir="ltr"
                    className="select-all rounded-3xl bg-gray-50 p-4 text-center font-mono text-lg font-black tracking-wider text-gray-900 dark:bg-white/[0.05] dark:text-white"
                >
                    {password}
                </div>
                <m.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => void copy()}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500"
                >
                    <Copy size={16} /> کپی رمز
                </m.button>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full rounded-full bg-gray-100 py-3 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-300"
                >
                    بستن
                </button>
            </div>
        </ModalShell>
    );
}
