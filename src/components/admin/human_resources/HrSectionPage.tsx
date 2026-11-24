"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarOff, ChevronLeft, UserCog, Wallet } from "lucide-react";
import HumanResourceHrModal from "./HumanResourceHrModal";
import { HumanResource, getDocumentsPage } from "./humanResourceApi";
import { gradientOf, initialOf } from "./hrUtils";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import CardSkeletonGrid from "@/components/ui/CardSkeletonGrid";
import { EmptyState, ErrorState } from "@/components/ui/States";

export type HrSection = "info" | "salaries" | "leaves";

export const SECTIONS = {
    info: { label: "اطلاعات", title: "اطلاعات پرسنلی و قرارداد", hint: "ساعت کار، نرخ اضافه‌کار، قرارداد", icon: UserCog },
    salaries: { label: "پایه حقوق", title: "پایه حقوق", hint: "تاریخچه پایه حقوق روزانه و ماهانه", icon: Wallet },
    leaves: { label: "مرخصی", title: "مرخصی‌ها", hint: "مرخصی با حقوق و بدون حقوق", icon: CalendarOff },
} as const;

const GRID = "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";
const PAGE_SIZE = 12;

export default function HrSectionPage({ section }: { section: HrSection }) {
    const [selected, setSelected] = useState<HumanResource | null>(null);
    const cur = SECTIONS[section];

    // جستجو سمت سرور: عنوان، نام شخص و سازنده
    const list = usePaginatedList<HumanResource>(
        (p, signal) => getDocumentsPage({ page: p.page, page_size: p.page_size, search: p.search }, signal),
        { pageSize: PAGE_SIZE, scrollTop: true },
    );
    const { data, page, totalPages, search, setSearch, loading, error, setPage, refetch } = list;

    return (
        <div className="space-y-4" dir="rtl">
            <div className="rounded-[2rem] border border-gray-100 bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#111827]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">{cur.title}</h1>
                        <p className="mt-0.5 text-[11px] text-gray-400">{cur.hint}</p>
                    </div>
                    <SearchInput value={search} onChange={setSearch} placeholder="جستجوی نام شخص یا عنوان..." className="w-full sm:w-72" />
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
                    {data.map((d, i) => (
                        <motion.button key={d.id} type="button" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }} whileHover={{ y: -3 }} onClick={() => setSelected(d)}
                            className="flex items-center gap-3 rounded-[2rem] border border-gray-100 bg-white p-3 text-right shadow-sm transition-shadow hover:shadow-xl hover:shadow-black/[0.04] dark:border-white/[0.06] dark:bg-[#111827]">
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientOf(d.id)} text-[14px] font-extrabold text-white`}>
                                {initialOf(d.employee_name || d.title, "م")}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">{d.employee_name || d.title}</h3>
                                <p className="mt-1 truncate text-[10.5px] font-semibold text-gray-400">{d.employee_name ? d.title : "شخصی تعیین نشده"}</p>
                            </div>
                            <ChevronLeft size={15} className="text-gray-300" />
                        </motion.button>
                    ))}
                </div>
            )}

            {!error && totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}

            <HumanResourceHrModal section={section} open={!!selected} document={selected} onClose={() => setSelected(null)} onChange={refetch} />
        </div>
    );
}
