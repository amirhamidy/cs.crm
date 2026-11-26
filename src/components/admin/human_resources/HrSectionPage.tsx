"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarOff, ChevronLeft, UserCog, Wallet, Trash2, Pencil, Loader2 } from "lucide-react";
import HumanResourceHrModal from "./HumanResourceHrModal";
import { HumanResource, getDocumentsPage, HrInfo, HrSalary, getHrInfo, getHrSalaries } from "./humanResourceApi";
import { gradientOf, initialOf } from "./hrUtils";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import CardSkeletonGrid from "@/components/ui/CardSkeletonGrid";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { todayJalali } from "@/lib/jalali";
import { hrApi, fmtNum } from "./hr/hrApi";

export type HrSection = "info" | "salaries" | "leaves" | "waste";

export const SECTIONS = {
    info: { label: "اطلاعات", title: "اطلاعات پرسنلی و قرارداد", hint: "ساعت کار، نرخ اضافه‌کار، قرارداد", icon: UserCog },
    salaries: { label: "پایه حقوق", title: "پایه حقوق", hint: "تاریخچه پایه حقوق روزانه و ماهانه", icon: Wallet },
    leaves: { label: "مرخصی", title: "مرخصی‌ها", hint: "مرخصی با حقوق و بدون حقوق", icon: CalendarOff },
    waste: { label: "ضایعات", title: "کسر ضایعات", hint: "کسرهای ضایعات تولید", icon: Trash2 },
} as const;

const GRID = "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";
const PAGE_SIZE = 12;

// کارت‌های پیش‌نمایش برای بخش‌های مختلف
function InfoCard({ doc, onClick }: { doc: HumanResource; onClick: () => void }) {
    const [info, setInfo] = useState<HrInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        getHrInfo(doc.id).then((r) => alive && setInfo(r.data))
            .catch(() => alive && setInfo(null))
            .finally(() => alive && setLoading(false));
        return () => { alive = false; };
    }, [doc.id]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative flex flex-col gap-3 rounded-[2rem] border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-xl hover:shadow-black/[0.04] dark:border-white/[0.06] dark:bg-[#111827]"
            dir="rtl"
        >
            <button
                type="button"
                onClick={onClick}
                className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10"
            >
                <Pencil size={14} />
            </button>
            <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientOf(doc.id)} text-[14px] font-extrabold text-white`}>
                    {initialOf(doc.employee_name || doc.title, "م")}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">{doc.employee_name || doc.title}</h3>
                    <p className="mt-0.5 truncate text-[10.5px] font-semibold text-gray-400">{doc.employee_name ? doc.title : "شخصی تعیین نشده"}</p>
                </div>
            </div>
            {loading ? (
                <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-indigo-500" /></div>
            ) : info ? (
                <div className="space-y-2 text-[11px] text-gray-600 dark:text-gray-300">
                    <div className="flex justify-between"><span>ساعت کار روزانه:</span><span className="font-bold">{info.daily_work_hours || "—"}</span></div>
                    <div className="flex justify-between"><span>نرخ اضافه‌کار:</span><span className="font-bold">{fmtNum(info.overtime_rate_per_hour)}</span></div>
                    <div className="flex justify-between"><span>ساعت کار اصناف:</span><span className="font-bold">{info.guild_work_hours || "—"}</span></div>
                    {info.contract_start_date && (
                        <div className="flex justify-between"><span>قرارداد:</span><span className="font-bold">{new Date(info.contract_start_date).toLocaleDateString("fa-IR")}</span></div>
                    )}
                    {info.current_salary && (
                        <div className="mt-2 rounded-xl bg-indigo-50 px-3 py-2 text-[11px] font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                            حقوق فعلی: {fmtNum(info.current_salary.amount)} ({info.current_salary.period_type_display})
                        </div>
                    )}
                </div>
            ) : (
                <p className="py-2 text-center text-[10.5px] text-gray-400">اطلاعات ثبت نشده</p>
            )}
        </motion.div>
    );
}

function SalariesCard({ doc, onClick }: { doc: HumanResource; onClick: () => void }) {
    const [salaries, setSalaries] = useState<HrSalary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        getHrSalaries(doc.id).then((r) => alive && setSalaries(r.data))
            .catch(() => alive && setSalaries([]))
            .finally(() => alive && setLoading(false));
        return () => { alive = false; };
    }, [doc.id]);

    const current = salaries.filter(s => !s.effective_to)[0];
    const history = salaries.filter(s => s.effective_to).slice(0, 2);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative flex flex-col gap-3 rounded-[2rem] border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-xl hover:shadow-black/[0.04] dark:border-white/[0.06] dark:bg-[#111827]"
            dir="rtl"
        >
            <button
                type="button"
                onClick={onClick}
                className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10"
            >
                <Pencil size={14} />
            </button>
            <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientOf(doc.id)} text-[14px] font-extrabold text-white`}>
                    {initialOf(doc.employee_name || doc.title, "م")}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">{doc.employee_name || doc.title}</h3>
                    <p className="mt-0.5 truncate text-[10.5px] font-semibold text-gray-400">{doc.employee_name ? doc.title : "شخصی تعیین نشده"}</p>
                </div>
            </div>
            {loading ? (
                <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-indigo-500" /></div>
            ) : salaries.length === 0 ? (
                <p className="py-2 text-center text-[10.5px] text-gray-400">پایه حقوق ثبت نشده</p>
            ) : (
                <div className="space-y-2">
                    {current && (
                        <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">پایه فعلی</p>
                            <p className="mt-1 text-[13px] font-extrabold text-emerald-700 dark:text-emerald-300">{fmtNum(current.amount)}</p>
                            <p className="mt-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">{current.period_type_display ?? (current.period_type === "daily" ? "روزانه" : "ماهانه")}</p>
                        </div>
                    )}
                    {history.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400">تاریخچه</p>
                            {history.map((s) => (
                                <div key={s.id} className="flex justify-between rounded-lg bg-gray-50 px-3 py-2 text-[10.5px] dark:bg-white/5">
                                    <span className="text-gray-600 dark:text-gray-300">{fmtNum(s.amount)}</span>
                                    <span className="text-gray-400">{new Date(s.effective_from).toLocaleDateString("fa-IR")}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}

function WasteCard({ doc, onClick }: { doc: HumanResource; onClick: () => void }) {
    const [summary, setSummary] = useState<{ pending: string; approved: string; count: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        const [y] = todayJalali();
        hrApi.wasteDeductions.summary(doc.id, { group_by: "year", year: y })
            .then((r) => {
                if (alive) {
                    setSummary({
                        pending: r.totals.pending_amount,
                        approved: r.totals.approved_amount,
                        count: r.totals.count,
                    });
                }
            })
            .catch(() => alive && setSummary(null))
            .finally(() => alive && setLoading(false));
        return () => { alive = false; };
    }, [doc.id]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative flex flex-col gap-3 rounded-[2rem] border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-xl hover:shadow-black/[0.04] dark:border-white/[0.06] dark:bg-[#111827]"
            dir="rtl"
        >
            <button
                type="button"
                onClick={onClick}
                className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10"
            >
                <Pencil size={14} />
            </button>
            <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientOf(doc.id)} text-[14px] font-extrabold text-white`}>
                    {initialOf(doc.employee_name || doc.title, "م")}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">{doc.employee_name || doc.title}</h3>
                    <p className="mt-0.5 truncate text-[10.5px] font-semibold text-gray-400">{doc.employee_name ? doc.title : "شخصی تعیین نشده"}</p>
                </div>
            </div>
            {loading ? (
                <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-indigo-500" /></div>
            ) : summary ? (
                <div className="space-y-2">
                    <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-500/10">
                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">در انتظار تصمیم</p>
                        <p className="mt-1 text-[13px] font-extrabold text-amber-700 dark:text-amber-300">{fmtNum(summary.pending)}</p>
                    </div>
                    <div className="rounded-xl bg-rose-50 p-3 dark:bg-rose-500/10">
                        <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400">تأییدشده (قطعی)</p>
                        <p className="mt-1 text-[13px] font-extrabold text-rose-700 dark:text-rose-300">{fmtNum(summary.approved)}</p>
                    </div>
                    <p className="text-center text-[10.5px] text-gray-400">تعداد کل: {summary.count} مورد</p>
                </div>
            ) : (
                <p className="py-2 text-center text-[10.5px] text-gray-400">کسری ثبت نشده</p>
            )}
        </motion.div>
    );
}

// کارت ساده برای بخش مرخصی (بدون تغییر)
function SimpleCard({ doc, onClick }: { doc: HumanResource; onClick: () => void }) {
    return (
        <motion.button
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onClick}
            className="flex items-center gap-3 rounded-[2rem] border border-gray-100 bg-white p-3 text-right shadow-sm transition-shadow hover:shadow-xl hover:shadow-black/[0.04] dark:border-white/[0.06] dark:bg-[#111827]"
        >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientOf(doc.id)} text-[14px] font-extrabold text-white`}>
                {initialOf(doc.employee_name || doc.title, "م")}
            </div>
            <div className="min-w-0 flex-1">
                <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">{doc.employee_name || doc.title}</h3>
                <p className="mt-1 truncate text-[10.5px] font-semibold text-gray-400">{doc.employee_name ? doc.title : "شخصی تعیین نشده"}</p>
            </div>
            <ChevronLeft size={15} className="text-gray-300" />
        </motion.button>
    );
}

export default function HrSectionPage({ section }: { section: HrSection }) {
    const [selected, setSelected] = useState<HumanResource | null>(null);
    const cur = SECTIONS[section];

    // جستجو سمت سرور: عنوان، نام شخص و سازنده
    const list = usePaginatedList<HumanResource>(
        (p, signal) => getDocumentsPage({ page: p.page, page_size: p.page_size, search: p.search }, signal),
        { pageSize: PAGE_SIZE, scrollTop: true },
    );
    const { data, page, totalPages, search, setSearch, loading, error, setPage, refetch } = list;

    // انتخاب کامپوننت کارت بر اساس بخش
    const CardComponent = section === "info" ? InfoCard : section === "salaries" ? SalariesCard : section === "waste" ? WasteCard : SimpleCard;

    return (
        <div className="space-y-4" dir="rtl">
            <div className="rounded-[2rem] border border-gray-100 bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#111827]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">{cur.title}</h1>
                        <p className="mt-0.5 text-[11px] text-gray-400">{cur.hint}</p>
                    </div>
                    <SearchInput value={search} onChange={setSearch} placeholder="جستجو..." className="w-full sm:w-72" />
                </div>
            </div>

            {loading ? (
                <CardSkeletonGrid count={PAGE_SIZE} className={GRID} />
            ) : error ? (
                <ErrorState onRetry={refetch} />
            ) : data.length === 0 ? (
                <EmptyState title="موردی پیدا نشد" />
            ) : (
                <div className={GRID}>
                    {data.map((d) => (
                        <CardComponent key={d.id} doc={d} onClick={() => setSelected(d)} />
                    ))}
                </div>
            )}

            {!error && totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}

            <HumanResourceHrModal section={section} open={!!selected} document={selected} onClose={() => setSelected(null)} onChange={refetch} />
        </div>
    );
}
