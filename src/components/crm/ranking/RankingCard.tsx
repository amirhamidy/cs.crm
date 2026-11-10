"use client";

import { memo } from "react";
import { BarChart3, Building2, MessageCircle, Phone, Route, ShoppingBag, Trophy } from "lucide-react";
import { formatMoney, formatScore } from "@/lib/crm/format";
import { cn } from "@/lib/utils";
import type { RankedCustomer } from "@/types/crm";
import StarRating from "../shared/StarRating";
import { CARD_HOVER, Chip, Divider, INSET, Meter, SURFACE, gradientOf, initialOf } from "../shared/kit";

export type RankingView = "overview" | "comments" | "sales" | "path";

const ACTIONS: { key: RankingView; label: string; icon: typeof BarChart3; tone: string }[] = [
    { key: "overview", label: "خلاصه", icon: BarChart3, tone: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300" },
    { key: "comments", label: "نظرات", icon: MessageCircle, tone: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300" },
    { key: "sales", label: "فروش‌ها", icon: ShoppingBag, tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300" },
    { key: "path", label: "مسیر پرونده", icon: Route, tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300" },
];

const MEDAL: Record<number, string> = {
    1: "bg-amber-400 text-white",
    2: "bg-slate-400 text-white",
    3: "bg-orange-400 text-white",
};

interface Props {
    customer: RankedCustomer;
    highlight: boolean;
    onOpen: (customerId: number, view: RankingView) => void;
}

function RankingCardBase({ customer, highlight, onOpen }: Props) {
    const isActive = customer.status === 2;
    const score = customer.avg_score;

    return (
        <div className={cn(SURFACE, CARD_HOVER, "flex h-full min-w-0 flex-col p-3", highlight && "ring-1 ring-amber-300/70 dark:ring-amber-400/30")}>
            <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientOf(customer.id)} text-[14px] font-extrabold text-white shadow-sm`}>
                        {initialOf(customer.full_name)}
                    </div>
                    <span
                        className={cn(
                            "absolute -bottom-1.5 -left-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white px-1 text-[9px] font-extrabold dark:border-[#111827]",
                            MEDAL[customer.rank] ?? "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-200",
                        )}
                    >
                        {customer.rank.toLocaleString("fa-IR")}
                    </span>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">{customer.full_name}</h3>
                        {highlight ? (
                            <Chip tone="amber" icon={<Trophy size={9} />}>برترین</Chip>
                        ) : (
                            <Chip tone={isActive ? "emerald" : "amber"}>{customer.status_display}</Chip>
                        )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-white/[0.06]">
                            <Building2 size={10} className="text-gray-400" />
                        </span>
                        <span className="truncate text-[10.5px] font-semibold text-gray-400">{customer.company_name || "شرکت ندارد"}</span>
                    </div>
                </div>
            </div>

            <div className="mt-3"><Divider /></div>

            <div className="mt-3 space-y-1.5">
                <div className={INSET}>
                    <div className="flex items-center justify-between gap-2">
                        <StarRating value={score} size={12} showNumber={false} count={customer.scores_count || undefined} />
                        <span className="text-[13px] font-extrabold text-gray-800 dark:text-white">{formatScore(score)}</span>
                    </div>
                    <div className="mt-2">
                        <Meter value={score ?? 0} max={5} tone={highlight ? "amber" : "indigo"} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                    <div className={cn(INSET, "min-w-0")}>
                        <p className="text-[9.5px] font-semibold text-gray-400">مجموع فروش</p>
                        <p className="mt-0.5 truncate text-[11px] font-extrabold text-gray-800 dark:text-white">
                            {customer.total_sales ? formatMoney(customer.total_sales) : "—"}
                        </p>
                    </div>
                    <div className={cn(INSET, "min-w-0")}>
                        <p className="text-[9.5px] font-semibold text-gray-400">تماس</p>
                        {customer.phone_number ? (
                            <a
                                href={`tel:${customer.phone_number}`}
                                dir="ltr"
                                className="mt-0.5 flex items-center justify-end gap-1 truncate text-[11px] font-extrabold text-gray-800 transition hover:text-indigo-500 dark:text-white"
                            >
                                <Phone size={10} className="shrink-0 text-gray-400" />
                                {customer.phone_number}
                            </a>
                        ) : (
                            <p className="mt-0.5 text-[11px] font-extrabold text-gray-300">—</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-auto grid grid-cols-4 gap-1.5 pt-3">
                {ACTIONS.map(({ key, label, icon: Icon, tone }) => (
                    <button
                        key={key}
                        type="button"
                        aria-label={label}
                        onClick={() => onOpen(customer.id, key)}
                        className={cn("flex min-w-0 flex-col items-center gap-1 rounded-xl py-2 text-[9.5px] font-extrabold transition active:scale-95", tone)}
                    >
                        <Icon size={14} />
                        <span className="max-w-full truncate px-0.5">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export const RankingCard = memo(RankingCardBase);
