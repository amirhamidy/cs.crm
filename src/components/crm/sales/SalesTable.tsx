"use client";

import { memo } from "react";
import { CalendarDays, Package, Paperclip, Pencil, Trash2 } from "lucide-react";
import { formatJalaliDate, formatMoney, formatWeight } from "@/lib/crm/format";
import { usePermissions } from "@/hooks/usePermissions";
import type { Sale } from "@/types/crm";
import { IssueChips, PartiesLine, TradeBadge } from "../shared/TradeBits";

interface Props {
    sales: Sale[];
    showCustomer?: boolean;
    canModify: (sale: Sale) => boolean;
    onEdit: (sale: Sale) => void;
    onDelete: (sale: Sale) => void;
    onDetails?: (sale: Sale) => void;
}

function Actions({
    sale,
    canModify,
    onEdit,
    onDelete,
    onDetails,
    allowEdit,
    allowDelete,
}: Omit<Props, "sales" | "showCustomer"> & {
    sale: Sale;
    allowEdit: boolean;
    allowDelete: boolean;
}) {
    return (
        <div className="flex shrink-0 items-center gap-1">
            {onDetails && (
                <button
                    type="button"
                    aria-label="فایل‌ها و پیگیری بار"
                    onClick={() => onDetails(sale)}
                    className="relative flex h-9 w-9 items-center justify-center rounded-xl md:h-8 md:w-8 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10"
                >
                    <Paperclip size={14} />
                    {(sale.attachments_count > 0 || sale.open_issues_count > 0) && (
                        <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-black text-white">
                            {sale.attachments_count + sale.open_issues_count}
                        </span>
                    )}
                </button>
            )}
            {canModify(sale) && allowEdit && (
                <button
                    type="button"
                    aria-label="ویرایش معامله"
                    onClick={() => onEdit(sale)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl md:h-8 md:w-8 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10"
                >
                    <Pencil size={14} />
                </button>
            )}
            {canModify(sale) && allowDelete && (
                <button
                    type="button"
                    aria-label="حذف معامله"
                    onClick={() => onDelete(sale)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl md:h-8 md:w-8 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                >
                    <Trash2 size={14} />
                </button>
            )}
        </div>
    );
}

function SalesTable({ sales, canModify, onEdit, onDelete, onDetails }: Props) {
    const { can } = usePermissions();
    const allowEdit = can("sales", "edit");
    const allowDelete = can("sales", "delete");
    const actionPermissions = { allowEdit, allowDelete };
    return (
        <>
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-right text-[12.5px]">
                    <thead className="bg-gray-50/70 dark:bg-white/[0.03]">
                        <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 dark:border-white/[0.06]">
                            <th className="px-3 py-2.5">تاریخ</th>
                            <th className="px-3 py-2.5">فروشنده / خریدار</th>
                            <th className="px-3 py-2.5">کالا</th>
                            <th className="px-3 py-2.5">مقدار</th>
                            <th className="px-3 py-2.5">قیمت هر کیلو</th>
                            <th className="px-3 py-2.5">مبلغ کل</th>
                            <th className="w-24 px-3 py-2.5" />
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map((sale) => (
                            <tr
                                key={sale.id}
                                className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/60 dark:border-white/[0.04] dark:hover:bg-white/[0.03]"
                            >
                                <td className="whitespace-nowrap px-3 py-3 font-semibold text-gray-600 dark:text-gray-300">
                                    {formatJalaliDate(sale.sale_date)}
                                </td>
                                <td className="px-3 py-3">
                                    <TradeBadge type={sale.trade_type} />
                                    <PartiesLine sale={sale} />
                                </td>
                                <td className="px-3 py-3 font-bold text-gray-800 dark:text-gray-100">
                                    {sale.product_name}
                                    {sale.description && (
                                        <div
                                            className="max-w-[220px] truncate text-[10.5px] font-normal text-gray-400"
                                            title={sale.description}
                                        >
                                            {sale.description}
                                        </div>
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 text-gray-700 dark:text-gray-200">
                                    {formatWeight(sale.quantity_kg)}
                                    <IssueChips sale={sale} />
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 text-gray-700 dark:text-gray-200">
                                    {formatMoney(sale.unit_price)}
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 font-black text-gray-900 dark:text-white">
                                    {formatMoney(sale.total_amount)}
                                </td>
                                <td className="px-3 py-3">
                                    <Actions
                                        sale={sale}
                                        canModify={canModify}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onDetails={onDetails}
                                        {...actionPermissions}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <ul className="flex flex-col gap-2.5 md:hidden">
                {sales.map((sale) => (
                    <li
                        key={sale.id}
                        className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <TradeBadge type={sale.trade_type} />
                                <PartiesLine sale={sale} />
                                <div className="mt-1 flex items-center gap-1.5 text-[12.5px] font-bold text-gray-700 dark:text-gray-200">
                                    <Package size={12} className="shrink-0 text-gray-400" />
                                    {sale.product_name}
                                </div>
                            </div>
                            <Actions
                                sale={sale}
                                canModify={canModify}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onDetails={onDetails}
                                {...actionPermissions}
                            />
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11.5px] text-gray-500 dark:text-gray-400">
                            <span>{formatWeight(sale.quantity_kg)}</span>
                            <span>{formatMoney(sale.unit_price)} / کیلو</span>
                        </div>
                        <IssueChips sale={sale} />
                        <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 dark:border-white/[0.06]">
                            <span className="flex items-center gap-1 text-[10.5px] text-gray-400">
                                <CalendarDays size={11} />
                                {formatJalaliDate(sale.sale_date)}
                            </span>
                            <span className="text-[13px] font-black text-gray-900 dark:text-white">
                                {formatMoney(sale.total_amount)}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </>
    );
}

/** با memo: وقتی فقط عبارت جستجو عوض می‌شود جدول دوباره رندر نمی‌شود. */
export default memo(SalesTable);
