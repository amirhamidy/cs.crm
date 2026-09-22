"use client";

import { Loader2, ShieldAlert } from "lucide-react";
import { usePurchasingAccess } from "@/hooks/usePurchasingAccess";

interface Props {
    children: React.ReactNode;
}

export default function PurchasingAccessGate({ children }: Props) {
    const { loading, hasAccess, error } = usePurchasingAccess();

    if (loading) {
        return (
            <div
                dir="rtl"
                className="flex min-h-screen items-center justify-center bg-[#F3F8FF] dark:bg-[#050B18]"
            >
                <div className="flex flex-col items-center gap-3">
                    <Loader2
                        size={26}
                        className="animate-spin text-[#2563EB] dark:text-[#38BDF8]"
                    />
                    <span className="text-[12px] font-bold text-[#5D7595] dark:text-[#8FAAD1]">
                        در حال بررسی دسترسی...
                    </span>
                </div>
            </div>
        );
    }

    if (error || !hasAccess) {
        return (
            <div
                dir="rtl"
                className="flex min-h-screen items-center justify-center bg-[#F3F8FF] p-4 dark:bg-[#050B18]"
            >
                <div className="w-full max-w-[440px] rounded-[2rem] border border-rose-500/20 bg-white p-6 text-center shadow-xl dark:border-rose-500/25 dark:bg-[#0A1930]">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                        <ShieldAlert size={24} />
                    </div>

                    <h2 className="text-[15px] font-black text-[#0F2647] dark:text-white">
                        دسترسی محدود شده است
                    </h2>

                    <p className="mt-2 text-[11px] leading-6 text-[#5D7595] dark:text-[#8FAAD1]">
                        {error ??
                            "شما مجاز به مشاهده بخش فرآیند خرید نیستید. اگر فکر می‌کنید این یک خطا است، با مدیر سیستم تماس بگیرید."}
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}