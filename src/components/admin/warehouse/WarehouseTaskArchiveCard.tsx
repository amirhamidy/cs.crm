"use client";

import { motion } from "framer-motion";
import { Archive, Clock3, Package, User } from "lucide-react";
import { useTheme } from "next-themes";
import { cardBg, cardBorder, cardShadow } from "@/components/admin/warehouse/WarehouseCards";
import { resolveMediaUrl } from "@/lib/media";
import { formatDate, formatNumber, getStatusLabel } from "@/utils/warehouseEmployee";
import type { ApiWarehouseTaskArchive } from "@/types/warehouse";

export default function WarehouseTaskArchiveCard({
    item,
    index,
}: {
    item: ApiWarehouseTaskArchive;
    index: number;
}) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const name = item.product_name?.trim() || `وظیفه #${item.warehouse_task ?? item.id}`;
    const status = item.status_display || getStatusLabel(item.status);
    const date = item.archived_at ?? item.completed_at ?? item.created_at;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.04 }}
            className="flex flex-col gap-3 rounded-3xl p-4"
            style={{
                background: cardBg(isDark),
                border: cardBorder(isDark),
                boxShadow: cardShadow(isDark),
            }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                    <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
                        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                    >
                        <Archive size={18} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">
                            {name}
                        </h3>
                        <p className="mt-0.5 text-[10.5px] font-semibold text-gray-500 dark:text-gray-400">
                            آرشیو #{item.id}
                        </p>
                    </div>
                </div>

                <span className="shrink-0 rounded-xl bg-indigo-500/10 px-2 py-1 text-[10.5px] font-extrabold text-indigo-500">
                    {status}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-indigo-500/5 px-3 py-2">
                    <p className="flex items-center gap-1 text-[9.5px] font-bold text-gray-400">
                        <Package size={10} />
                        مقدار مورد انتظار
                    </p>
                    <p className="mt-1 text-[12px] font-black text-gray-900 dark:text-white">
                        {formatNumber(item.expected_quantity ?? 0)}
                    </p>
                </div>
                <div className="rounded-2xl bg-emerald-500/5 px-3 py-2">
                    <p className="flex items-center gap-1 text-[9.5px] font-bold text-gray-400">
                        <Package size={10} />
                        مقدار دریافتی
                    </p>
                    <p className="mt-1 text-[12px] font-black text-gray-900 dark:text-white">
                        {formatNumber(item.received_quantity ?? 0)}
                    </p>
                </div>
            </div>

            {item.note && (
                <p className="text-[11px] leading-6 text-gray-500 dark:text-gray-400">{item.note}</p>
            )}

            <div className="flex items-center justify-between border-t border-gray-100 pt-2.5 text-[10px] font-semibold text-gray-500 dark:border-white/[0.06] dark:text-gray-400">
                <span className="flex items-center gap-1">
                    <Clock3 size={10} />
                    {formatDate(date)}
                </span>

                <span className="flex items-center gap-3">
                    {item.assigned_to_name && (
                        <span className="flex items-center gap-1">
                            <User size={10} />
                            {item.assigned_to_name}
                        </span>
                    )}
                    {item.file && (
                        <a
                            href={resolveMediaUrl(item.file)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-500 hover:underline"
                        >
                            فایل
                        </a>
                    )}
                </span>
            </div>
        </motion.div>
    );
}
