"use client";

import { ClipboardList, History, ListOrdered, Paperclip, ShoppingCart, UserCog } from "lucide-react";
import { toPersianDigits } from "@/lib/jalali";
import type { ApiPurchasingEmployee, ApiPurchasingStep, ApiPurchasingTask, ApiTaskAttachment } from "@/types/purchasing";
import { PURCHASING_TASK_STATUS_META } from "@/types/purchasing";

interface Props {
    employees?: ApiPurchasingEmployee[];
    steps?: ApiPurchasingStep[];
    tasks?: ApiPurchasingTask[];
    attachments?: ApiTaskAttachment[];
}

function OverviewRow({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
            <span className="text-[10.5px] font-semibold text-gray-400">{label}</span>
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[10.5px] font-extrabold text-indigo-600 dark:text-indigo-300">
                {toPersianDigits(value)}
            </span>
        </div>
    );
}

export default function PurchasingOverview({ employees = [], steps = [], tasks = [], attachments = [] }: Props) {
    const pendingCount = tasks.filter((item) => item.status === "pending").length;
    const inProgressCount = tasks.filter((item) => item.status === "in_progress").length;
    const completedCount = tasks.filter((item) => item.status === "completed").length;
    const activeEmployeeCount = employees.filter((item) => item.is_active).length;

    const statCards = [
        { title: "کل تسک‌ها", value: tasks.length, icon: ClipboardList, color: "#6366f1" },
        { title: "در انتظار", value: pendingCount, icon: ShoppingCart, color: PURCHASING_TASK_STATUS_META.pending.color },
        { title: "در حال انجام", value: inProgressCount, icon: ListOrdered, color: PURCHASING_TASK_STATUS_META.in_progress.color },
        { title: "تکمیل شده", value: completedCount, icon: History, color: PURCHASING_TASK_STATUS_META.completed.color },
        { title: "کارمندان فعال", value: activeEmployeeCount, icon: UserCog, color: "#8b5cf6" },
    ];

    const recentActivity = [...attachments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);

    return (
        <div dir="rtl" className="flex flex-col gap-4">
            <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 lg:grid lg:grid-cols-5 lg:overflow-visible">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.title}
                            className="relative min-w-[175px] overflow-hidden rounded-[1.8rem] border bg-white p-3.5 shadow-[0_8px_28px_rgba(15,23,42,0.035)] transition-all hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(15,23,42,0.08)] lg:min-w-0 dark:bg-[#111a2d]"
                            style={{ borderColor: `${card.color}28` }}
                        >
                            <div className="absolute inset-y-0 right-0 w-1" style={{ background: `linear-gradient(180deg,${card.color},${card.color}45)` }} />

                            <div className="flex items-center justify-between gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-2xl" style={{ background: `${card.color}18`, color: card.color }}>
                                    <Icon size={15} />
                                </div>
                                <span className="text-[20px] font-extrabold" style={{ color: card.color }}>
                                    {toPersianDigits(card.value)}
                                </span>
                            </div>

                            <p className="mt-2.5 text-[10.5px] font-bold text-gray-400">{card.title}</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
                <div className="relative overflow-hidden rounded-[1.8rem] border border-gray-100 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.035)] dark:border-white/[0.07] dark:bg-[#111a2d]">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-300">
                            <History size={16} />
                        </div>
                        <div>
                            <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">فعالیت‌های اخیر</h3>
                            <p className="mt-0.5 text-[10.5px] font-medium text-gray-400">آخرین تغییرات فرآیند خرید</p>
                        </div>
                    </div>

                    {recentActivity.length === 0 ? (
                        <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-2xl bg-gray-50 py-10 dark:bg-white/[0.035]">
                            <History size={22} className="text-gray-300 dark:text-gray-700" />
                            <span className="text-[11px] font-medium text-gray-400">هنوز فعالیتی ثبت نشده است</span>
                        </div>
                    ) : (
                        <div className="mt-4 flex flex-col gap-2">
                            {recentActivity.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-300">
                                        <Paperclip size={12} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-full bg-indigo-500/10 px-2 py-1 text-[9.5px] font-extrabold text-indigo-600 dark:text-indigo-300">
                                                {item.type_display}
                                            </span>
                                            <span className="truncate text-[10.5px] font-bold text-gray-600 dark:text-gray-300">{item.created_by_name}</span>
                                        </div>
                                        {item.note && <p className="mt-1 truncate text-[10.5px] font-medium text-gray-400">{item.note}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="relative overflow-hidden rounded-[1.8rem] border border-gray-100 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.035)] dark:border-white/[0.07] dark:bg-[#111a2d]">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500 dark:text-violet-300">
                            <ListOrdered size={16} />
                        </div>
                        <div>
                            <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">وضعیت فرآیند</h3>
                            <p className="mt-0.5 text-[10.5px] font-medium text-gray-400">ساختار فعلی خرید</p>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                        <OverviewRow label="مراحل تعریف شده" value={steps.length} />
                        <OverviewRow label="کارمندان خرید" value={employees.length} />
                        <OverviewRow label="کارمندان فعال" value={activeEmployeeCount} />
                        <OverviewRow label="فایل‌های ثبت شده" value={attachments.length} />
                    </div>
                </div>
            </div>
        </div>
    );
}