"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Loader, ClipboardList } from "lucide-react";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { portalApi } from "@/lib/portal/portalApi";
import type { PortalOrder, OrderStatus } from "@/types/portal";
import Pagination from "@/components/ui/Pagination";
import { apiMessage } from "@/lib/apiMessage";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ModalShell } from "@/components/ui/ModalShell";
import { toast } from "@/components/notifications/toast";

const LABELS: Record<OrderStatus, string> = {
    pending: "در انتظار بررسی",
    confirmed: "تأیید شد",
    rejected: "رد شد",
    cancelled: "لغو توسط مشتری",
};

// Same tones as the admin orders page
const TONES: Record<OrderStatus, string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    cancelled: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
};

function StatusPill({ order }: { order: PortalOrder }) {
    return (
        <span className={`rounded-full px-3 py-1 text-[11.5px] font-bold ${TONES[order.status]}`}>
            {order.status_display || LABELS[order.status]}
        </span>
    );
}

export default function PortalOrdersPage() {
    const list = usePaginatedList<PortalOrder>((p, s) => portalApi.orders(p, s), { pageSize: 10 });
    const [selected, setSelected] = useState<PortalOrder | null>(null);
    const [busy, setBusy] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);

    const close = () => {
        if (busy) return;
        setSelected(null);
        setConfirming(false);
        setCancelError(null);
    };

    const cancel = async () => {
        if (!selected || selected.status !== "pending") return;
        setBusy(true);
        setCancelError(null);
        try {
            await portalApi.cancelOrder(selected.id);
            setSelected({ ...selected, status: "cancelled", status_display: LABELS.cancelled });
            setConfirming(false);
            list.refetch();
            toast.success("سفارش لغو شد");
        } catch (e) {
            setCancelError(apiMessage(e, "لغو سفارش انجام نشد"));
        } finally {
            setBusy(false);
        }
    };

    return (
        <section dir="rtl">
            <div className="mb-5">
                <h1 className="text-[15px] font-black text-gray-900 dark:text-white">سفارش‌های من</h1>
                <p className="mt-1 text-[11.5px] text-gray-500 dark:text-gray-400">پیگیری وضعیت سفارش‌های ثبت‌شده</p>
            </div>

            {list.loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader size={24} className="animate-spin text-indigo-500" />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">در حال دریافت سفارش‌ها...</p>
                </div>
            ) : list.error ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                    <p className="text-[12.5px] text-rose-500">دریافت سفارش‌ها انجام نشد</p>
                    <button onClick={list.refetch} className="text-[12.5px] font-bold text-indigo-600 underline">
                        تلاش مجدد
                    </button>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {list.data.length === 0 ? (
                        <m.div
                            key="empty"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="flex flex-col items-center justify-center gap-2 py-16"
                        >
                            <ClipboardList size={28} className="text-gray-300 dark:text-gray-700" />
                            <p className="text-[12.5px] text-gray-500 dark:text-gray-400">هنوز سفارشی ثبت نکرده‌اید</p>
                        </m.div>
                    ) : (
                        <m.div
                            key={`list-${list.page}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-3"
                        >
                            {list.data.map((order) => (
                                <button
                                    key={order.id}
                                    onClick={() => setSelected(order)}
                                    className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-right transition-colors hover:border-indigo-300 dark:border-white/10 dark:bg-white/[0.04]"
                                >
                                    <div>
                                        <p className="text-[15px] font-extrabold">سفارش #{order.id}</p>
                                        <p className="mt-1 text-[11.5px] text-gray-500">
                                            {new Date(order.created_at).toLocaleDateString("fa-IR")} · {order.items.length} قلم
                                        </p>
                                    </div>
                                    <div className="text-left">
                                        <StatusPill order={order} />
                                        <p className="mt-2 text-[15px] font-black">
                                            {order.total_price.toLocaleString("fa-IR")} تومان
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </m.div>
                    )}
                </AnimatePresence>
            )}

            {!list.loading && list.totalPages > 1 && (
                <div className="mt-5">
                    <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />
                </div>
            )}

            <ModalShell
                open={selected !== null}
                onClose={close}
                busy={busy}
                title={selected ? `جزئیات سفارش #${selected.id}` : ""}
                maxWidth="max-w-xl"
            >
                {selected && (
                    <div>
                        <StatusPill order={selected} />
                        <div className="my-4 space-y-2">
                            {selected.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between gap-3 border-b border-gray-100 py-2 text-[13px] dark:border-white/10"
                                >
                                    <span>
                                        {item.product_name} × {item.quantity}
                                    </span>
                                    <b>{item.line_total.toLocaleString("fa-IR")} تومان</b>
                                </div>
                            ))}
                        </div>
                        {selected.note && (
                            <p className="mb-3 rounded-xl bg-gray-50 p-3 text-[11.5px] dark:bg-white/5">
                                توضیحات شما: {selected.note}
                            </p>
                        )}
                        {selected.staff_note && (
                            <p className="mb-3 rounded-xl bg-indigo-50 p-3 text-[11.5px] text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-200">
                                پیام کارشناس: {selected.staff_note}
                            </p>
                        )}
                        <p className="mb-4 text-left text-[15px] font-black">
                            {selected.total_price.toLocaleString("fa-IR")} تومان
                        </p>
                        {selected.status === "pending" && (
                            <button
                                disabled={busy}
                                onClick={() => setConfirming(true)}
                                className="w-full rounded-xl bg-rose-600 py-3 text-[13px] font-bold text-white disabled:opacity-50"
                            >
                                لغو سفارش
                            </button>
                        )}
                    </div>
                )}
            </ModalShell>

            <ConfirmModal
                open={confirming}
                danger
                title="لغو سفارش"
                message="از لغو این سفارش مطمئن هستید؟"
                confirmLabel="لغو سفارش"
                loading={busy}
                error={cancelError}
                onConfirm={() => void cancel()}
                onClose={() => {
                    if (!busy) {
                        setConfirming(false);
                        setCancelError(null);
                    }
                }}
            />
        </section>
    );
}
