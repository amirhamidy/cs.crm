"use client";

import { Loader2, MapPin } from "lucide-react";
import type { ShelfSummary } from "@/types/warehouseShelf";
import { formatQuantity } from "@/utils/warehouseShelf";

interface Props {
  shelves: ShelfSummary[];
  value: string;
  onChange: (shelfCode: string) => void;
  loading?: boolean;
  totalLabel?: string;
}

export default function ShelfFilterBar({
  shelves,
  value,
  onChange,
  loading = false,
  totalLabel = "همه قفسه‌ها",
}: Props) {
  if (!loading && shelves.length === 0) return null;

  const baseClass =
    "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11.5px] font-bold transition-colors";
  const activeClass =
    "border-indigo-500 bg-indigo-500 text-white shadow-sm shadow-indigo-500/30";
  const idleClass =
    "border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-300 dark:hover:border-indigo-400/40";

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1" dir="rtl">
      <button
        type="button"
        onClick={() => onChange("")}
        className={`${baseClass} ${value === "" ? activeClass : idleClass}`}
      >
        <MapPin size={12} />
        {totalLabel}
      </button>

      {shelves.map((shelf) => {
        const active = value.toLowerCase() === shelf.shelf_code.toLowerCase();
        return (
          <button
            key={shelf.shelf_code}
            type="button"
            onClick={() => onChange(active ? "" : shelf.shelf_code)}
            className={`${baseClass} ${active ? activeClass : idleClass}`}
          >
            <span dir="ltr">{shelf.shelf_code}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9.5px] font-extrabold ${
                active
                  ? "bg-white/25 text-white"
                  : "bg-gray-100 text-gray-500 dark:bg-white/[0.08] dark:text-gray-400"
              }`}
            >
              {formatQuantity(shelf.product_count)}
            </span>
          </button>
        );
      })}

      {loading && <Loader2 size={14} className="shrink-0 animate-spin text-gray-400" />}
    </div>
  );
}
