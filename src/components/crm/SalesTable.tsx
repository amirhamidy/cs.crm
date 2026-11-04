"use client";

import { CalendarDays, Package, Pencil, Trash2, User } from "lucide-react";
import { formatJalaliDate, formatMoney, formatWeight } from "@/lib/crm/format";
import type { Sale } from "@/types/crm";

interface Props {
  sales: Sale[];
  /** در پروفایل مشتری ستون مشتری لازم نیست */
  showCustomer?: boolean;
  /** فقط ادمین یا ثبت‌کننده می‌تواند ویرایش/حذف کند */
  canModify: (sale: Sale) => boolean;
  onEdit: (sale: Sale) => void;
  onDelete: (sale: Sale) => void;
}

function Actions({ sale, canModify, onEdit, onDelete }: Omit<Props, "sales" | "showCustomer"> & { sale: Sale }) {
  if (!canModify(sale)) return null;
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        aria-label="ویرایش فروش"
        onClick={() => onEdit(sale)}
        className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10"
      >
        <Pencil size={14} />
      </button>
      <button
        type="button"
        aria-label="حذف فروش"
        onClick={() => onDelete(sale)}
        className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export default function SalesTable({ sales, showCustomer = true, canModify, onEdit, onDelete }: Props) {
  return (
    <>
      {/* دسکتاپ */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-right text-[12.5px]">
          <thead>
            <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 dark:border-white/[0.06]">
              <th className="px-3 py-2.5">تاریخ</th>
              {showCustomer && <th className="px-3 py-2.5">مشتری</th>}
              <th className="px-3 py-2.5">کالا</th>
              <th className="px-3 py-2.5">مقدار</th>
              <th className="px-3 py-2.5">قیمت هر کیلو</th>
              <th className="px-3 py-2.5">مبلغ کل</th>
              <th className="w-20 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr
                key={s.id}
                className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/60 dark:border-white/[0.04] dark:hover:bg-white/[0.03]"
              >
                <td className="whitespace-nowrap px-3 py-3 font-semibold text-gray-600 dark:text-gray-300">
                  {formatJalaliDate(s.sale_date)}
                </td>
                {showCustomer && (
                  <td className="px-3 py-3">
                    <div className="font-extrabold text-gray-900 dark:text-white">{s.customer_name}</div>
                    {s.company_name && (
                      <div className="text-[10.5px] text-gray-400">{s.company_name}</div>
                    )}
                  </td>
                )}
                <td className="px-3 py-3 font-bold text-gray-800 dark:text-gray-100">
                  {s.product_name}
                  {s.description && (
                    <div className="max-w-[220px] truncate text-[10.5px] font-normal text-gray-400" title={s.description}>
                      {s.description}
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-gray-700 dark:text-gray-200">
                  {formatWeight(s.quantity_kg)}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-gray-700 dark:text-gray-200">
                  {formatMoney(s.unit_price)}
                </td>
                <td className="whitespace-nowrap px-3 py-3 font-black text-gray-900 dark:text-white">
                  {formatMoney(s.total_amount)}
                </td>
                <td className="px-3 py-3">
                  <Actions sale={s} canModify={canModify} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* موبایل */}
      <ul className="flex flex-col gap-2.5 md:hidden">
        {sales.map((s) => (
          <li
            key={s.id}
            className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.03]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                {showCustomer && (
                  <div className="flex items-center gap-1.5 text-[13px] font-extrabold text-gray-900 dark:text-white">
                    <User size={12} className="shrink-0 text-gray-400" />
                    <span className="truncate">{s.customer_name}</span>
                  </div>
                )}
                <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] font-bold text-gray-700 dark:text-gray-200">
                  <Package size={12} className="shrink-0 text-gray-400" />
                  {s.product_name}
                </div>
              </div>
              <Actions sale={s} canModify={canModify} onEdit={onEdit} onDelete={onDelete} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11.5px] text-gray-500 dark:text-gray-400">
              <span>{formatWeight(s.quantity_kg)}</span>
              <span>{formatMoney(s.unit_price)} / کیلو</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 dark:border-white/[0.06]">
              <span className="flex items-center gap-1 text-[10.5px] text-gray-400">
                <CalendarDays size={11} /> {formatJalaliDate(s.sale_date)}
              </span>
              <span className="text-[13px] font-black text-gray-900 dark:text-white">
                {formatMoney(s.total_amount)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
