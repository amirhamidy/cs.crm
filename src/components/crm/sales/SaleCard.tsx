"use client";

import { memo } from "react";
import { CalendarDays, Paperclip, Pencil, Undo2, Ban, Repeat, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";
import { formatJalaliDate, formatMoney, formatTime, formatWeight } from "@/lib/crm/format";
import { cn } from "@/lib/utils";
import type { Sale } from "@/types/crm";
import { IssueChips, TRADE_LABEL } from "../shared/TradeBits";
import { CARD_HOVER, Chip, Divider, IconAction, IconTile, MiniStat, PillButton, SURFACE, type Tone } from "../shared/kit";

interface Props {
    sale: Sale;
    canEdit: boolean;
    canDelete: boolean;
    onEdit: (sale: Sale) => void;
    onDelete: (sale: Sale) => void;
    onDetails?: (sale: Sale) => void;
    onReturn?: (sale: Sale) => void;
    onUndoReturn?: (sale: Sale) => void;
}

const TRADE_TONE: Record<Sale["trade_type"], Tone> = {
    sale: "emerald",
    purchase: "amber",
    brokerage: "sky",
};

const TRADE_ICON = {
    sale: ShoppingBag,
    purchase: ShoppingCart,
    brokerage: Repeat,
};

function Party({ label, name, company, dot }: { label: string; name: string; company: string; dot: string }) {
    return (
        <div className="relative flex items-start gap-2.5">
            <span className={cn("relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-white dark:ring-[#111827]", dot)} />
            <div className="min-w-0 flex-1">
                <p className="text-[9.5px] font-semibold text-gray-400">{label}</p>
                <p className="truncate text-[11.5px] font-extrabold text-gray-800 dark:text-gray-100">
                    {name}
                    {company && <span className="ms-1 text-[10px] font-semibold text-gray-400">{company}</span>}
                </p>
            </div>
        </div>
    );
}

function SaleCardBase({ sale, canEdit, canDelete, onEdit, onDelete, onDetails, onReturn, onUndoReturn }: Props) {
    const tone = TRADE_TONE[sale.trade_type];
    const Icon = TRADE_ICON[sale.trade_type];
    const returned = sale.status === "returned";
    const badge = sale.attachments_count + sale.open_issues_count;

    return (
        <div className={cn(SURFACE, CARD_HOVER, "flex h-full min-w-0 flex-col p-3")}>
            <div className="flex items-start gap-3">
                <IconTile tone={tone}>
                    <Icon size={18} />
                </IconTile>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">{sale.product_name}</h3>
                            <div className="mt-1.5 flex items-center gap-1.5">
                                <Chip tone={tone}>{TRADE_LABEL[sale.trade_type]}</Chip>
                                {returned && <Chip tone="rose">برگشتی</Chip>}
                                <span className="flex items-center gap-1 truncate text-[10.5px] font-semibold text-gray-400">
                                    <CalendarDays size={10} className="shrink-0" />
                                    {formatJalaliDate(sale.sale_date)} · {formatTime(sale.sale_time)}
                                </span>
                            </div>
                        </div>

                        {(canEdit || canDelete || onReturn) && (
                            <div className="flex shrink-0 items-center gap-1">
                                {canEdit && onReturn && !returned && (
                                    <IconAction label="برگشت معامله" tone="gray" onClick={() => onReturn(sale)}>
                                        <Ban size={13} />
                                    </IconAction>
                                )}
                                {canEdit && onUndoReturn && returned && (
                                    <IconAction label="لغو برگشت" tone="indigo" onClick={() => onUndoReturn(sale)}>
                                        <Undo2 size={13} />
                                    </IconAction>
                                )}
                                {canEdit && !returned && (
                                    <IconAction label="ویرایش معامله" tone="sky" onClick={() => onEdit(sale)}>
                                        <Pencil size={13} />
                                    </IconAction>
                                )}
                                {canDelete && (
                                    <IconAction label="حذف معامله" tone="rose" onClick={() => onDelete(sale)}>
                                        <Trash2 size={13} />
                                    </IconAction>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-3"><Divider /></div>

            <div className="relative mt-3 space-y-2.5">
                <span className="absolute bottom-3 right-[4.5px] top-3 w-px bg-gray-200 dark:bg-white/10" />
                <Party label="فروشنده" name={sale.seller_name} company={sale.seller_company} dot="bg-emerald-500" />
                <Party label="خریدار" name={sale.buyer_name} company={sale.buyer_company} dot="bg-indigo-500" />
            </div>

            {sale.trader_name && (
                <p className="mt-2 text-[10.5px] font-semibold text-gray-400">
                    معامله‌گر: <span className="text-gray-600 dark:text-gray-300">{sale.trader_name}</span>
                </p>
            )}

            <div className="mt-3 grid grid-cols-2 gap-1.5">
                <MiniStat label="مقدار" value={formatWeight(sale.quantity_kg)} />
                <MiniStat label="مقدار مؤثر" value={formatWeight(sale.effective_quantity_kg)} />
                {sale.buy_price && <MiniStat label="فی خرید" value={formatMoney(sale.buy_price)} />}
                {sale.sell_price && <MiniStat label="فی فروش" value={formatMoney(sale.sell_price)} />}
                {sale.deal_type_name && <MiniStat label="نوع معامله" value={sale.deal_type_name} />}
                {sale.load_type_name && <MiniStat label="نوع بار" value={sale.load_type_name} />}
            </div>

            <IssueChips sale={sale} />

            <div className="mt-1.5 flex items-center justify-between gap-2 rounded-xl bg-indigo-50/70 px-3 py-2 dark:bg-indigo-500/[0.07]">
                <span className="text-[9.5px] font-semibold text-indigo-400">{sale.profit != null ? "سود" : "مبلغ کل"}</span>
                <span className="truncate text-[13px] font-extrabold text-indigo-600 dark:text-indigo-400">{formatMoney(sale.profit ?? sale.total_sell_amount ?? sale.total_buy_amount ?? "0")}</span>
            </div>

            {onDetails && (
                <div className="mt-auto pt-3">
                    <PillButton
                        variant="primary"
                        className="w-full"
                        icon={<Paperclip size={13} />}
                        onClick={() => onDetails(sale)}
                    >
                        فایل‌ها و پیگیری بار
                        {badge > 0 && (
                            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white/25 px-1 text-[9px] font-extrabold">
                                {badge.toLocaleString("fa-IR")}
                            </span>
                        )}
                    </PillButton>
                </div>
            )}
        </div>
    );
}

export default memo(SaleCardBase);
