"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, ClipboardCheck, Clock3, ShieldCheck, Users, XCircle, type LucideIcon } from "lucide-react";
import { toPersianDigits } from "@/lib/jalali";
import type { ApiQualityControlEmployee, ApiQualityControlItem } from "@/types/quality_control";
import { formatDate } from "./qcUtils";

interface Props {
    items: ApiQualityControlItem[];
    employees: ApiQualityControlEmployee[];
    onOpenItems: () => void;
    onOpenEmployees: () => void;
}

const card = "rounded-[1.45rem] border border-gray-100 bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#111827]";

const TONES = {
    amber: "bg-amber-50 text-amber-500 dark:bg-amber-500/10",
    green: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10",
    red: "bg-red-50 text-red-500 dark:bg-red-500/10",
    blue: "bg-blue-50 text-blue-500 dark:bg-blue-500/10",
};

function Stat({ label, value, icon: Icon, tone, index }: { label: string; value: string | number; icon: LucideIcon; tone: keyof typeof TONES; index: number }) {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className={`${card} flex items-center gap-3`}>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${TONES[tone]}`}>
                <Icon size={18} />
            </div>
            <div className="min-w-0">
                <p className="text-[10.5px] font-semibold text-gray-400">{label}</p>
                <p className="mt-0.5 text-[20px] font-extrabold leading-none text-gray-900 dark:text-white">{value}</p>
            </div>
        </motion.div>
    );
}

export default function QCOverview({ items, employees, onOpenItems, onOpenEmployees }: Props) {
    const count = (s: string) => items.filter((i) => i.status === s).length;
    const pending = count("pending");
    const approved = count("approved");
    const rejected = count("rejected");
    const active = employees.filter((e) => e.is_active).length;
    const done = approved + rejected;
    const rate = done ? Math.round((approved / done) * 100) : 0;
    const teamPct = employees.length ? (active / employees.length) * 100 : 0;
    const recent = items
        .filter((i) => i.checked_at)
        .sort((a, b) => new Date(b.checked_at as string).getTime() - new Date(a.checked_at as string).getTime())
        .slice(0, 6);

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Stat index={0} label="در انتظار بررسی" value={pending} icon={Clock3} tone="amber" />
                <Stat index={1} label="تایید شده" value={approved} icon={CheckCircle2} tone="green" />
                <Stat index={2} label="رد شده" value={rejected} icon={XCircle} tone="red" />
                <Stat index={3} label="کارمندان فعال" value={`${active}/${employees.length}`} icon={Users} tone="blue" />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_.6fr]">
                <div className={card}>
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                                <ShieldCheck size={15} className="text-blue-500" />
                            </span>
                            <div>
                                <h2 className="text-[13px] font-extrabold text-gray-900 dark:text-white">وضعیت کلی کنترل کیفی</h2>
                                <p className="mt-0.5 text-[10.5px] font-semibold text-gray-400">خلاصه‌ی بررسی‌های ثبت‌شده</p>
                            </div>
                        </div>
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold text-blue-500 dark:bg-blue-500/10">{toPersianDigits(items.length)} مورد</span>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2">
                        {([["در انتظار", pending, "text-amber-500"], ["تایید", approved, "text-emerald-500"], ["رد", rejected, "text-red-500"]] as const).map(([l, v, c]) => (
                            <div key={l} className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
                                <p className="text-[9.5px] font-semibold text-gray-400">{l}</p>
                                <p className={`mt-0.5 text-[15px] font-extrabold ${c}`}>{toPersianDigits(v)}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-5">
                        <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-[10.5px] font-semibold text-gray-400">نرخ تایید موارد بررسی‌شده</span>
                            <span className="text-[11px] font-extrabold text-gray-800 dark:text-white">{toPersianDigits(rate)}٪</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${rate}%` }} transition={{ duration: 0.7, ease: "easeOut" }} className="h-full rounded-full bg-emerald-500" />
                        </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                        <button type="button" onClick={onOpenItems} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-blue-600 text-[11.5px] font-extrabold text-white transition hover:bg-blue-500">
                            <ClipboardCheck size={13} />
                            مشاهده بررسی‌ها
                            <ArrowLeft size={12} />
                        </button>
                        <button type="button" onClick={onOpenEmployees} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-gray-100 text-[11.5px] font-extrabold text-gray-600 transition hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.08]">
                            <Users size={13} />
                            تیم کنترل کیفی
                        </button>
                    </div>
                </div>

                <div className={card}>
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                            <Users size={15} className="text-emerald-500" />
                        </span>
                        <div>
                            <h2 className="text-[13px] font-extrabold text-gray-900 dark:text-white">تیم کنترل کیفی</h2>
                            <p className="mt-0.5 text-[10.5px] font-semibold text-gray-400">وضعیت فعلی نیروها</p>
                        </div>
                    </div>
                    <div className="mt-5 flex items-end gap-2">
                        <span className="text-[30px] font-extrabold leading-none text-gray-900 dark:text-white">{toPersianDigits(active)}</span>
                        <span className="pb-0.5 text-[10.5px] font-semibold text-gray-400">فعال از {toPersianDigits(employees.length)} نفر</span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
                        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${teamPct}%` }} />
                    </div>
                </div>
            </div>

            <div className={card}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-50 dark:bg-white/[0.04]">
                            <Clock3 size={14} className="text-gray-400" />
                        </span>
                        <div>
                            <h2 className="text-[13px] font-extrabold text-gray-900 dark:text-white">آخرین بررسی‌ها</h2>
                            <p className="mt-0.5 text-[10.5px] font-semibold text-gray-400">آخرین مواردی که بررسی شده‌اند</p>
                        </div>
                    </div>
                    <button type="button" onClick={onOpenItems} className="text-[10.5px] font-extrabold text-blue-500 transition hover:text-blue-400">همه موارد</button>
                </div>

                {recent.length === 0 ? (
                    <div className="mt-4 flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 text-center dark:border-white/[0.07]">
                        <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/10">
                            <ClipboardCheck size={18} className="text-blue-400" />
                        </span>
                        <p className="text-[11.5px] font-extrabold text-gray-800 dark:text-white">هنوز بررسی‌ای ثبت نشده است</p>
                    </div>
                ) : (
                    <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                        {recent.map((item) => {
                            const ok = item.status === "approved";
                            return (
                                <div key={item.id} className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-2.5 py-2 dark:bg-white/[0.035]">
                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ok ? TONES.green : TONES.red}`}>
                                        {ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[11.5px] font-extrabold text-gray-800 dark:text-white">{item.product_name}</p>
                                        <p className="mt-0.5 truncate text-[9.5px] font-semibold text-gray-400">{item.checked_by_name || "—"} · {formatDate(item.checked_at, " · ")}</p>
                                    </div>
                                    <span className={`shrink-0 text-[10px] font-extrabold ${ok ? "text-emerald-500" : "text-red-500"}`}>{item.status_display}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}