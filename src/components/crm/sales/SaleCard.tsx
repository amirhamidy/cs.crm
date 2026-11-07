"use client";

import { memo, useState } from "react";
import { CalendarDays, MoreVertical, Package, Paperclip, Pencil, Trash2 } from "lucide-react";
import { formatJalaliDate, formatMoney, formatWeight } from "@/lib/crm/format";
import { ActionSheet, type ActionSheetItem } from "@/components/ui/ActionSheet";
import { cn } from "@/lib/utils";
import type { Sale } from "@/types/crm";
import { IssueChips, TradeBadge } from "../shared/TradeBits";

interface Props {
    sale: Sale;
    canEdit: boolean;
    canDelete: boolean;
    onEdit: (sale: Sale) => void;
    onDelete: (sale: Sale) => void;
    onDetails?: (sale: Sale) => void;
}

const SIDE: Record<Sale["trade_type"], string> = {
    sale: "bg-emerald-400",
    purchase: "bg-amber-400",
    brokerage: "bg-sky-400",
};

function SaleCardBase({ sale, canEdit, canDelete, onEdit, onDelete, onDetails }: Props) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const badge = sale.attachments_count + sale.open_issues_count;

    const sheetItems: ActionSheetItem[] = [];
    if (onDetails) {
        sheetItems.push({
            key: "details",
            label: "فایل‌ها و پیگیری بار",
            icon: <Paperclip size={16} />,
            onSelect: () => onDetails(sale),
        });
    }
    if (canEdit) {
        sheetItems.push({
            key: "edit",
            label: "ویرایش معامله",
            icon: <Pencil size={16} />,
            onSelect: () => onEdit(sale),
        });
    }
    if (canDelete) {
        sheetItems.push({
            key: "delete",
            label: "حذف معامله",
            icon: <Trash2 size={16} />,
            danger: true,
            onSelect: () => onDelete(sale),
        });
    }

    const bar = [
        onDetails && {
            key: "details",
            label: "فایل‌ها و پیگیری",
            icon: Paperclip,
            tone: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/15 dark:text-indigo-300",
            run: () => onDetails(sale),
        },
        canEdit && {
            key: "edit",
            label: "ویرایش",
            icon: Pencil,
            tone: "text-sky-600 bg-sky-50 dark:bg-sky-500/15 dark:text-sky-300",
            run: () => onEdit(sale),
        },
        canDelete && {
            key: "delete",
            label: "حذف",
            icon: Trash2,
            tone: "text-red-600 bg-red-50 dark:bg-red-500/15 dark:text-red-300",
            run: () => onDelete(sale),
        },
    ].filter(Boolean) as {
        key: string;
        label: string;
        icon: typeof Paperclip;
        tone: string;
        run: () => void;
    }[];

    return (
        <div className="group relative flex min-w-0 flex-col gap-3 overflow-hidden rounded-3xl border border-gray-100 bg-white p-4 text-[13px] text-gray-900 transition-shadow hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white">
            <span className={cn("absolute inset-x-0 top-0 h-1", SIDE[sale.trade_type])} />

            <div className="flex items-center justify-between gap-2 pt-1">
                {sheetItems.length > 0 ? (
                    <button
                        type="button"
                        onClick={() => setSheetOpen(true)}
                        aria-label="گزینه‌ها"
                        className="relative -m-1 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10 md:hidden"
                    >
                        <MoreVertical size={16} />
                        {badge > 0 && (
                            <span className="absolute -end-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand" />
                        )}
                    </button>
                ) : (
                    <span className="md:hidden" />
                )}
                <TradeBadge type={sale.trade_type} />
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <CalendarDays size={12} />
                    {formatJalaliDate(sale.sale_date)}
                </span>
            </div>

            <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[14px] font-bold">
                    <Package size={14} className="shrink-0 text-gray-400" />
                    <span className="truncate">{sale.product_name}</span>
                </div>
                <div className="mt-2 flex flex-col gap-1 text-[12px] text-gray-500 dark:text-gray-400">
                    <span className="truncate">
                        از <b className="font-bold text-gray-800 dark:text-gray-100">{sale.seller_name}</b>
                    </span>
                    <span className="truncate">
                        به <b className="font-bold text-gray-800 dark:text-gray-100">{sale.buyer_name}</b>
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-50 p-2.5 text-[11.5px] dark:bg-white/[0.05]">
                <div className="min-w-0">
                    <div className="text-[10px] text-gray-400">مقدار</div>
                    <div className="truncate font-bold">{formatWeight(sale.quantity_kg)}</div>
                </div>
                <div className="min-w-0">
                    <div className="text-[10px] text-gray-400">قیمت واحد</div>
                    <div className="truncate font-bold">{formatMoney(sale.unit_price)}</div>
                </div>
            </div>

            <IssueChips sale={sale} />

            <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-2.5 dark:border-white/[0.06]">
                <span className="text-[10.5px] text-gray-400">مبلغ کل</span>
                <span className="truncate text-[14px] font-black">{formatMoney(sale.total_amount)}</span>
            </div>

            {bar.length > 0 && (
                <div className="absolute inset-x-0 bottom-0 hidden translate-y-full items-center justify-center gap-2 bg-white/95 p-2.5 opacity-0 backdrop-blur transition-all group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 md:flex dark:bg-[#1b1b24]/95">
                    {bar.map(({ key, label, icon: Icon, tone, run }) => (
                        <button
                            key={key}
                            type="button"
                            title={label}
                            aria-label={label}
                            onClick={run}
                            className={cn(
                                "relative flex h-9 w-9 items-center justify-center rounded-xl transition-transform hover:scale-110",
                                tone,
                            )}
                        >
                            <Icon size={16} />
                            {key === "details" && badge > 0 && (
                                <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-black text-white">
                                    {badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            <ActionSheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                title={sale.product_name}
                items={sheetItems}
            />
        </div>
    );
}

export default memo(SaleCardBase);
