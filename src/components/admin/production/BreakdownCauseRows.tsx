"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Factory, Wrench } from "lucide-react";
import { toPersianDigits } from "@/lib/jalali";
import { formatProductionHours, formatProductionInteger, formatProductionPercent } from "@/lib/productionFormat";
import { PriorityBadge, priorityMap } from "./priority";
import type { CauseEntry, MachineBreakdown } from "./reportTypes";

type Dir = "desc" | "asc";

function CauseRowList({ causes, dir }: { causes: CauseEntry[]; dir: Dir }) {
    const real = causes
        .filter((c) => c.cause_id !== null)
        .sort((a, b) => (dir === "desc" ? b.downtime_minutes - a.downtime_minutes : a.downtime_minutes - b.downtime_minutes));
    const none = causes.find((c) => c.cause_id === null);
    const max = Math.max(1, ...causes.map((c) => c.downtime_minutes));

    const Row = ({ c, rank }: { c: CauseEntry; rank: number | null }) => (
        <li className="flex items-center gap-3 px-3 py-2.5">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${rank === 1 && dir === "desc" ? "bg-red-500 text-white" : "bg-black/[0.05] text-gray-500 dark:bg-white/[0.08] dark:text-gray-300"}`}>
                {rank === null ? "—" : toPersianDigits(rank)}
            </span>
            <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                    <span className={`truncate text-[12px] font-bold ${rank === null ? "text-gray-400" : "text-gray-800 dark:text-gray-100"}`}>{c.cause_name}</span>
                    <span className="shrink-0 text-[11px] font-bold text-gray-500">
                        {formatProductionInteger(c.downtime_minutes)} دقیقه
                        <span className="mr-1 font-medium text-gray-400">({formatProductionHours(c.downtime_hours)})</span>
                    </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
                    <div
                        className={`h-full rounded-full ${rank === null ? "bg-gray-400" : "bg-amber-500"}`}
                        style={{ width: `${Math.max(2, (c.downtime_minutes / max) * 100)}%` }}
                    />
                </div>
            </div>
            <div className="w-20 shrink-0 text-left text-[11px] text-gray-500">
                {c.share_percent == null ? "—" : `${formatProductionPercent(c.share_percent)}٪`}
                <div className="text-[10px] text-gray-400">{formatProductionInteger(c.logs)} ثبت</div>
            </div>
        </li>
    );

    if (real.length === 0 && !none) {
        return <p className="px-3 py-6 text-center text-[12px] text-gray-400">خرابی‌ای ثبت نشده است.</p>;
    }

    return (
        <ul className="divide-y divide-black/5 dark:divide-white/5">
            {real.map((c, i) => <Row key={c.cause_id} c={c} rank={i + 1} />)}
            {none && <Row c={none} rank={null} />}
        </ul>
    );
}

/**
 * علت‌های خرابی / توقف دستگاه به شکل ردیف‌های رتبه‌بندی‌شده:
 * ردیف اول بیشترین توقف را دارد. «بدون علت» همیشه آخر و بی‌رتبه است.
 * زیر آن، علت‌های هر دستگاه همراه با اولویت دستگاه می‌آید.
 */
export default function BreakdownCauseRows({
    causes,
    byMachine,
    totalMinutes,
}: {
    causes: CauseEntry[];
    byMachine: MachineBreakdown[];
    totalMinutes: number;
}) {
    const [dir, setDir] = useState<Dir>("desc");
    const priorities = priorityMap(byMachine, (m) => m.total_minutes);

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                        <Wrench size={15} className="text-amber-500" />
                        علت‌های خرابی و توقف دستگاه
                    </h3>
                    <p className="mt-1 text-[10.5px] text-gray-400">
                        کل توقف در بازه: {formatProductionInteger(totalMinutes)} دقیقه ({formatProductionHours(totalMinutes / 60)})
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setDir((d) => (d === "desc" ? "asc" : "desc"))}
                    className="flex h-8 items-center gap-1.5 rounded-full bg-black/[0.04] px-3.5 text-[11.5px] font-bold text-gray-600 transition-colors hover:bg-black/[0.07] dark:bg-white/[0.06] dark:text-gray-300"
                >
                    {dir === "desc" ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
                    {dir === "desc" ? "بیشترین توقف اول" : "کمترین توقف اول"}
                </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
                <CauseRowList causes={causes} dir={dir} />
            </div>

            {byMachine.length > 0 && (
                <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-[12px] font-extrabold text-gray-800 dark:text-gray-100">
                        <Factory size={14} className="text-indigo-500" />
                        علت خرابی به تفکیک دستگاه
                    </h4>
                    {byMachine.map((m) => (
                        <div key={m.machine_id} className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 bg-gray-50 px-3 py-2.5 dark:border-white/5 dark:bg-white/[0.03]">
                                <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-extrabold text-gray-800 dark:text-gray-100">{m.machine_name}</span>
                                    <span className="font-mono text-[10px] text-gray-400">({m.machine_code})</span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                                    <span>{formatProductionInteger(m.total_minutes)} دقیقه</span>
                                    <PriorityBadge info={priorities.get(m.machine_id)} />
                                </div>
                            </div>
                            <CauseRowList causes={m.causes} dir={dir} />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
