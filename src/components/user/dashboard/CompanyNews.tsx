"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type NewsCategory = "announcement" | "update" | "event" | "alert";

interface NewsItem {
  id: string;
  title: string;
  body: string;
  category: NewsCategory;
  date: Date;
  isNew: boolean;
}

const categoryMap: Record<
  NewsCategory,
  { bg: string; border: string; text: string; dot: string; label: string }
> = {
  announcement: {
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
    border: "border-blue-500/30",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-400",
    label: "اطلاعیه",
  },
  update: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    border: "border-emerald-500/30",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-400",
    label: "بروزرسانی",
  },
  event: {
    bg: "bg-purple-500/10 dark:bg-purple-500/15",
    border: "border-purple-500/30",
    text: "text-purple-700 dark:text-purple-300",
    dot: "bg-purple-400",
    label: "رویداد",
  },
  alert: {
    bg: "bg-red-500/10 dark:bg-red-500/15",
    border: "border-red-500/30",
    text: "text-red-700 dark:text-red-300",
    dot: "bg-red-400",
    label: "فوری",
  },
};

const formatDate = (date: Date) =>
  date.toLocaleDateString("fa-IR", {
    month: "long",
    day: "numeric",
  });

const NEWS: NewsItem[] = [
  {
    id: "1",
    title: "جلسه عمومی تیم — سه‌شنبه ساعت ۱۱",
    body: "حضور همه اعضا الزامیه. دستور جلسه: مرور اهداف فصل جدید و بررسی عملکرد تیم‌ها.",
    category: "event",
    date: new Date("2026-08-03"),
    isNew: true,
  },
  {
    id: "2",
    title: "سیستم CRM بروزرسانی شد",
    body: "نسخه جدید با بهبود عملکرد گزارش‌گیری و رفع چند باگ گزارش‌شده از دیروز فعاله.",
    category: "update",
    date: new Date("2026-08-02"),
    isNew: true,
  },
];

export default function CompanyNews() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const newCount = NEWS.filter((n) => n.isNew).length;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-sky-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              اخبار شرکت
            </h3>
            <p className="text-xs text-zinc-400">{NEWS.length} خبر</p>
          </div>
        </div>
        {newCount > 0 && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            {newCount} جدید
          </span>
        )}
      </div>

      <div className="p-4 space-y-2.5 max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
        <AnimatePresence initial={false}>
          {NEWS.map((item) => {
            const c = categoryMap[item.category];
            const isOpen = expanded === item.id;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`rounded-xl border cursor-pointer select-none ${c.bg} ${c.border}`}
                onClick={() => setExpanded(isOpen ? null : item.id)}
              >
                <div className="flex items-start gap-3 p-3.5">
                  <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium leading-snug ${c.text} truncate`}>
                        {item.title}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {item.isNew && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-500/15 text-sky-500 font-medium">
                            جدید
                          </span>
                        )}
                        <motion.svg
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                          />
                        </motion.svg>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-zinc-400">{formatDate(item.date)}</span>
                      <span className={`text-[10px] font-medium ${c.text} opacity-70`}>
                        {c.label}
                      </span>
                    </div>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div
                        className={`px-4 pb-3.5 pt-0 border-t ${item.category === "announcement"
                            ? "border-blue-500/20"
                            : item.category === "update"
                              ? "border-emerald-500/20"
                              : item.category === "event"
                                ? "border-purple-500/20"
                                : "border-red-500/20"
                          }`}
                      >
                        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 pt-2.5">
                          {item.body}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
