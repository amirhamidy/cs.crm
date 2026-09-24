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

                className="flex h-64 flex-col items-center justify-center gap-3"

            >

                <Loader2 size={22} className="animate-spin text-[#2563EB]" />

                <span className="text-[11.5px] font-bold text-gray-400">

                    در حال بررسی دسترسی...

                </span>

            </div>

        );

    }



    if (error || !hasAccess) {

        return (

            <div dir="rtl" className="flex min-h-[60vh] items-center justify-center p-4">

                <div className="relative w-full max-w-[420px] overflow-hidden rounded-[1.9rem] border border-red-500/20 bg-white p-6 text-center shadow-[0_6px_22px_rgba(15,23,42,.04)] dark:bg-[#0A1930]">

                    <div

                        className="absolute inset-y-0 right-0 w-1"

                        style={{ background: "linear-gradient(180deg,#ef4444,#ef444445)" }}

                    />



                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">

                        <ShieldAlert size={24} className="text-red-500" />

                    </div>



                    <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">

                        دسترسی محدود شده است

                    </h2>



                    <p className="mt-2 text-[11px] leading-6 text-gray-400">

                        {error ??

                            "شما مجاز به مشاهده بخش فرآیند خرید نیستید. اگر فکر می‌کنید این یک خطا است، با مدیر سیستم تماس بگیرید."}

                    </p>

                </div>

            </div>

        );

    }



    return <>{children}</>;

}



