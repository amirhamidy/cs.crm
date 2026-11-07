"use client";

import { memo, type ReactNode } from "react";
import { m } from "framer-motion";
import { Building2, MessageCircle, Phone, ShoppingBag, Star, Trophy } from "lucide-react";
import { formatJalaliDate, formatMoney, formatNumber } from "@/lib/crm/format";
import { cn } from "@/lib/utils";
import type { RankedCustomer } from "@/types/crm";
import StarRating from "../shared/StarRating";
import { CARD } from "../shared/ui";

const NO_DATA = "داده‌ای نیست";

const MEDAL_TONES = [
    "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    "bg-slate-500/15 text-slate-600 dark:text-slate-300",
    "bg-orange-500/15 text-orange-600 dark:text-orange-300",
];

const PLAIN_RANK_TONE =
    "border border-gray-200 text-gray-500 dark:border-white/10 dark:text-gray-300";

function RankBadge({ rank, medal }: { rank: number; medal: boolean }) {
    const tone = medal && rank <= 3 ? MEDAL_TONES[rank - 1] : PLAIN_RANK_TONE;
    return (
        <span
            className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[13px] font-bold",
                tone,
            )}
        >
            {medal && rank === 1 ? <Trophy size={18} /> : rank.toLocaleString("fa-IR")}
        </span>
    );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
    return (
        <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="flex shrink-0 items-center gap-1 text-[13px] text-gray-400">
                {icon}
                {label}
            </span>
            <span className="truncate text-[13px] font-normal text-gray-800 dark:text-gray-100">
                {value}
            </span>
        </div>
    );
}

interface Props {
    customer: RankedCustomer;
    /** ترتیب در صفحه؛ فقط برای انیمیشن ورود پله‌ای */
    index: number;
    /** نمایش مدال برای سه نفر اول */
    medal: boolean;
    onOpen: (customerId: number) => void;
}

function RankingCardBase({ customer, index, medal, onOpen }: Props) {
    const isTopRanked = customer.rank <= 3 && customer.avg_score != null;
    const isActive = customer.status === 2;

    return (
        <m.button
            type="button"
            onClick={() => onOpen(customer.id)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: Math.min(index, 10) * 0.025 }}
            className={cn(
                CARD,
                "flex w-full flex-col justify-around overflow-hidden p-3.5 text-right text-[13px] transition-shadow hover:shadow-md",
            )}
        >
            <div className="flex w-full items-center justify-between">
                <RankBadge rank={customer.rank} medal={medal && customer.avg_score != null} />
                <span
                    className={cn(
                        "shrink-0 rounded-full px-3 py-1.5 text-[13px]",
                        isActive
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
                    )}
                >
                    {customer.status_display}
                </span>
            </div>

            <div className="my-2 flex w-full min-w-0 items-center justify-between gap-3">
                <div
                    className={cn(
                        "min-w-0 flex-1 truncate text-[13px] text-gray-900 dark:text-white",
                        isTopRanked ? "font-bold" : "font-normal",
                    )}
                >
                    {customer.full_name}
                </div>
                <div className="mt-0.5 flex min-w-0 flex-col gap-2 text-[13px] text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1 truncate">
                        <Building2 size={12} className="shrink-0" />
                        <span className="truncate">{customer.company_name || "شرکت ندارد"}</span>
                    </span>
                    {customer.phone_number && (
                        <span className="flex items-center gap-1" dir="ltr">
                            <Phone size={12} className="shrink-0" /> {customer.phone_number}
                        </span>
                    )}
                </div>
            </div>

            <div className="my-2 flex w-full min-w-0 justify-between [&_*]:text-[13px]">
                <span>امتیاز :</span>
                <StarRating value={customer.avg_score} count={customer.scores_count || undefined} />
            </div>

            <div className="my-2 flex w-full flex-col gap-3 border-t border-gray-100 pt-3 dark:border-white/[0.06]">
                <Metric
                    icon={<ShoppingBag size={13} />}
                    label="مجموع فروش"
                    value={customer.total_sales ? formatMoney(customer.total_sales) : NO_DATA}
                />
                <Metric
                    icon={<Star size={13} />}
                    label="آخرین خرید"
                    value={
                        customer.last_sale_date
                            ? formatJalaliDate(customer.last_sale_date)
                            : NO_DATA
                    }
                />
                <Metric
                    icon={<MessageCircle size={13} />}
                    label="نظرات"
                    value={
                        customer.comments_count ? formatNumber(customer.comments_count) : NO_DATA
                    }
                />
            </div>
        </m.button>
    );
}

export const RankingCard = memo(RankingCardBase);
