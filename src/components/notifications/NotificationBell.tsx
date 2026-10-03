"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Bell,
    BellOff,
    CheckCheck,
    ClipboardList,
    Clock,
    Inbox,
    Info,
    MessageSquare,
    Repeat,
    Trash2,
    type LucideIcon,
} from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import type { AppNotification, NotificationKind } from "./types";

const KIND_ICON: Record<NotificationKind, LucideIcon> = {
    ticket_received: Inbox,
    ticket_message: MessageSquare,
    ticket_status: CheckCheck,
    ticket_deadline: Clock,
    routine_ready: Repeat,
    task_assigned: ClipboardList,
    system: Info,
};

const rtf = new Intl.RelativeTimeFormat("fa", { numeric: "auto" });

function timeAgo(iso: string): string {
    const diffSec = (Date.parse(iso) - Date.now()) / 1000;
    if (Number.isNaN(diffSec)) return "";
    const abs = Math.abs(diffSec);
    if (abs < 45) return "همین حالا";
    if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
    if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
    return rtf.format(Math.round(diffSec / 86400), "day");
}

function Row({
    item,
    onSelect,
}: {
    item: AppNotification;
    onSelect: (item: AppNotification) => void;
}) {
    const Icon = KIND_ICON[item.kind] ?? Info;

    return (
        <button
            type="button"
            onClick={() => onSelect(item)}
            className={`flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${item.read ? "" : "bg-indigo-500/[0.06]"
                }`}
        >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                <Icon size={15} strokeWidth={1.75} />
            </span>

            <span className="min-w-0 flex-1">
                <span
                    className={`block text-[13px] leading-5 ${item.read
                            ? "font-medium text-gray-600 dark:text-gray-400"
                            : "font-semibold text-gray-900 dark:text-white"
                        }`}
                >
                    {item.title}
                </span>
                {item.body && (
                    <span className="mt-0.5 block line-clamp-2 text-[12px] leading-5 text-gray-500 dark:text-gray-500">
                        {item.body}
                    </span>
                )}
                <span className="mt-1 block text-[11px] text-gray-400 dark:text-gray-600">
                    {timeAgo(item.createdAt)}
                </span>
            </span>

            {!item.read && (
                <span
                    aria-label="خوانده نشده"
                    className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-500"
                />
            )}
        </button>
    );
}

export function NotificationBell() {
    const items = useNotificationStore((s) => s.items);
    const unread = useNotificationStore((s) =>
        s.items.reduce((count, n) => count + (n.read ? 0 : 1), 0),
    );
    const markRead = useNotificationStore((s) => s.markRead);
    const markAllRead = useNotificationStore((s) => s.markAllRead);
    const clearAll = useNotificationStore((s) => s.clearAll);

    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (e: PointerEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };

        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    // کلیک روی اعلان فقط آن را «خوانده» می‌کند؛ لینک/ریدایرکتی ندارد
    const handleSelect = (item: AppNotification) => {
        if (!item.read) markRead(item.id);
    };

    return (
        <div ref={rootRef} className="relative">
            <motion.button
                type="button"
                onClick={() => setOpen((v) => !v)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={
                    unread > 0 ? `اعلان‌ها، ${unread} خوانده نشده` : "اعلان‌ها"
                }
                aria-haspopup="dialog"
                aria-expanded={open}
                className="relative rounded-lg p-1.5 transition-colors hover:bg-gray-100/80 dark:hover:bg-white/10"
            >
                <Bell
                    className="h-5 w-5 text-gray-700 dark:text-gray-300"
                    strokeWidth={1.5}
                />

                {unread > 0 && (
                    <motion.span
                        key={unread}
                        initial={{ scale: 0.6 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                        className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
                    >
                        {unread > 99 ? "99+" : unread.toLocaleString("fa-IR")}
                    </motion.span>
                )}
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        role="dialog"
                        aria-label="اعلان‌ها"
                        dir="rtl"
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-x-3 top-[72px] z-50 overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-[0_12px_40px_rgb(0,0,0,0.14)] sm:absolute sm:inset-x-auto sm:left-[100%] sm:top-full sm:mt-2 sm:w-[360px] dark:border-white/10 dark:bg-slate-900 dark:shadow-[0_12px_40px_rgb(0,0,0,0.5)]"
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/5">
                            <div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    اعلان‌ها
                                </h3>
                                <p className="text-[11px] text-gray-400 dark:text-gray-600">
                                    {unread > 0
                                        ? `${unread.toLocaleString("fa-IR")} مورد خوانده نشده`
                                        : "همه خوانده شده"}
                                </p>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={markAllRead}
                                    disabled={unread === 0}
                                    className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-indigo-600 transition-colors hover:bg-indigo-500/10 disabled:pointer-events-none disabled:opacity-40 dark:text-indigo-400"
                                >
                                    خواندن همه
                                </button>

                                <button
                                    type="button"
                                    onClick={clearAll}
                                    disabled={items.length === 0}
                                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-red-600 transition-colors hover:bg-red-500/10 disabled:pointer-events-none disabled:opacity-40 dark:text-red-400"
                                >
                                    <Trash2 size={13} strokeWidth={1.75} />
                                    پاکسازی
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[min(70vh,28rem)] divide-y divide-gray-100 overflow-y-auto overscroll-contain dark:divide-white/5">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                                    <BellOff
                                        size={26}
                                        className="text-gray-300 dark:text-gray-700"
                                    />
                                    <p className="text-[13px] font-semibold text-gray-600 dark:text-gray-400">
                                        اعلان جدیدی نداری
                                    </p>
                                    <p className="text-[12px] text-gray-400 dark:text-gray-600">
                                        تیکت یا تسک تازه که برات بیاد، همین‌جا نشون داده می‌شه.
                                    </p>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <Row key={item.id} item={item} onSelect={handleSelect} />
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}