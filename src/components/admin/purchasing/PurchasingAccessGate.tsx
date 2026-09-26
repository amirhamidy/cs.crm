"use client";

import { Loader, ShieldAlert } from "lucide-react";
import { usePurchasingAccess } from "@/hooks/usePurchasingAccess";

interface Props {
    children: React.ReactNode;
}

export default function PurchasingAccessGate({ children }: Props) {
    const { loading, hasAccess, error } = usePurchasingAccess();

    if (loading) {
        return (
            <div dir="rtl" className="flex h-64 flex-col items-center justify-center gap-3">
                <Loader size={22} className="animate-spin text-indigo-500" />
                <p className="text-[11.5px] font-bold text-gray-400 dark:text-gray-500">در حال بررسی دسترسی...</p>
            </div>
        );
    }

    if (error || !hasAccess) {
        return (
            <div dir="rtl" className="flex min-h-[60vh] items-center justify-center p-4">
                <div className="relative flex w-full max-w-[420px] flex-col items-center gap-3 overflow-hidden rounded-3xl border border-red-500/20 bg-red-500/5 px-6 py-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
                        <ShieldAlert size={26} className="text-red-500" />
                    </div>
                    <p className="text-[13.5px] font-bold text-red-500">دسترسی محدود شده است</p>
                    <p className="text-[11px] font-medium leading-6 text-gray-400 dark:text-gray-500">
                        {error ?? "شما مجاز به مشاهده بخش فرآیند خرید نیستید. اگر فکر می‌کنید این یک خطا است، با مدیر سیستم تماس بگیرید."}
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}