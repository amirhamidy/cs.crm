"use client";

import {
  Menu,
  Bell,
  User,
  ChevronDown,
  Settings,
  LogOut,
  Shield,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSidebar } from "@/hooks/useSidebar";
import { ThemeToggle } from "../ThemeToggle";

const notifications = [
  { id: 1, title: "سفارش جدید ثبت شد", time: "2 دقیقه پیش", unread: true },
  { id: 2, title: "پرداخت با موفقیت انجام شد", time: "10 دقیقه پیش", unread: true },
  { id: 3, title: "کاربر جدید وارد شد", time: "30 دقیقه پیش", unread: false },
];

const adminMenuItems = [
  { id: 1, title: "پروفایل", description: "مدیریت اطلاعات حساب", icon: UserRound },
  { id: 2, title: "تنظیمات", description: "تنظیمات داشبورد", icon: Settings },
  { id: 3, title: "سطح دسترسی", description: "مدیریت نقش‌ها", icon: Shield },
];

import { motion, AnimatePresence, type Variants } from "framer-motion";

const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: 8, filter: "blur(8px)", scale: 0.98 },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", scale: 1 },
  exit: { opacity: 0, y: 6, filter: "blur(6px)", scale: 0.98 },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 6, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.16, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

export default function Topbar() {
  const { toggle } = useSidebar();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [readIds, setReadIds] = useState<number[]>([]);

  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const adminRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter(
    (n) => n.unread && !readIds.includes(n.id)
  ).length;

  const handleOpenNotifications = () => {
    setIsNotificationsOpen((prev) => !prev);
    setIsAdminOpen(false);
  };

  const markAllRead = () => {
    setReadIds(notifications.map((n) => n.id));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notificationsRef.current && !notificationsRef.current.contains(target))
        setIsNotificationsOpen(false);
      if (adminRef.current && !adminRef.current.contains(target))
        setIsAdminOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
        setIsAdminOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="fixed top-0 right-0 left-0 h-16 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl z-50 dark:border-white/10 dark:bg-slate-950/80">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={toggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-1.5 rounded-lg hover:bg-gray-100/80 transition-colors dark:hover:bg-white/10"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={1.5} />
          </motion.button>

          <div className="hidden md:block">
            <h1 className="text-[14px] font-medium text-gray-900 dark:text-white">
              داشبورد مدیریت
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <div className="relative" ref={notificationsRef}>
            <motion.button
              onClick={handleOpenNotifications}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-1.5 rounded-lg hover:bg-gray-100/80 transition-colors dark:hover:bg-white/10"
              aria-label="Notifications"
              aria-expanded={isNotificationsOpen}
            >
              <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={1.5} />

              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-blue-600 text-white text-[9px] font-bold"
                    style={{
                      boxShadow: "0 0 0 2px white, 0 0 8px 2px rgba(37,99,235,0.5)",
                    }}
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>

              {unreadCount > 0 && (
                <motion.span
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-blue-500/40"
                  animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </motion.button>

            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-[290px] rounded-2xl border border-gray-200/70 bg-white/90 p-2 shadow-[0_12px_40px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90"
                >
                  <div className="px-2 py-1.5 flex items-center justify-between">
                    <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">
                      نوتیفیکیشن‌ها
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        همه را خواندم
                      </button>
                    )}
                  </div>

                  <div className="mt-1 space-y-1">
                    {notifications.map((item, index) => {
                      const isUnread = item.unread && !readIds.includes(item.id);
                      return (
                        <motion.button
                          key={item.id}
                          custom={index}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          onClick={() => setReadIds((prev) => [...prev, item.id])}
                          className={`w-full rounded-xl px-3 py-2.5 text-right transition-colors ${isUnread
                              ? "bg-blue-50/60 dark:bg-blue-500/5"
                              : "hover:bg-gray-50/90 dark:hover:bg-white/5"
                            }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <motion.span
                              animate={isUnread ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                              transition={{ duration: 2, repeat: isUnread ? Infinity : 0 }}
                              className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${isUnread ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                                }`}
                            />
                            <div className="min-w-0">
                              <p className="text-[12px] font-medium text-gray-800 dark:text-gray-100">
                                {item.title}
                              </p>
                              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                {item.time}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="mt-1 border-t border-gray-100 pt-1 dark:border-white/5">
                    <button className="w-full rounded-xl px-3 py-2 text-[12px] font-medium text-blue-600 hover:bg-blue-50/70 transition-colors dark:text-blue-400 dark:hover:bg-blue-500/10">
                      مشاهده همه
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative" ref={adminRef}>
            <motion.button
              onClick={() => {
                setIsAdminOpen((prev) => !prev);
                setIsNotificationsOpen(false);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-100/80 transition-colors dark:hover:bg-white/10"
              aria-label="Admin Menu"
              aria-expanded={isAdminOpen}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm shadow-blue-500/30">
                <User className="w-4 h-4 text-white" strokeWidth={1.5} />
              </div>
              <span className="hidden md:block text-[13px] font-medium text-gray-900 dark:text-white">
                ادمین
              </span>
              <motion.div
                animate={{ rotate: isAdminOpen ? 180 : 0 }}
                transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="hidden md:block"
              >
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" strokeWidth={1.5} />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {isAdminOpen && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="absolute top-[calc(100%+10px)] left-0 w-[260px] rounded-2xl border border-gray-200/70 bg-white/90 p-2 shadow-[0_12px_40px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90"
                >
                  <div className="px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-[0_0_12px_rgba(37,99,235,0.35)]">
                        <User className="w-5 h-5 text-white" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 dark:text-white">ادمین</p>
                        <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">مدیر سیستم</p>
                      </div>
                    </div>
                  </div>

                  <div className="my-1 h-px bg-gray-100 dark:bg-white/5" />

                  <div className="space-y-0.5">
                    {adminMenuItems.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <motion.button
                          key={item.id}
                          custom={index}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover={{ x: -2 }}
                          className="w-full rounded-xl px-3 py-2.5 text-right hover:bg-gray-50/90 transition-colors dark:hover:bg-white/5"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center dark:bg-white/5">
                              <Icon className="w-4 h-4 text-gray-600 dark:text-gray-300" strokeWidth={1.5} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[12px] font-medium text-gray-800 dark:text-gray-100">
                                {item.title}
                              </p>
                              <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="my-1 h-px bg-gray-100 dark:bg-white/5" />

                  <motion.button
                    custom={3}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ x: -2 }}
                    className="w-full rounded-xl px-3 py-2.5 text-right hover:bg-red-50/80 transition-colors dark:hover:bg-red-500/10"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center dark:bg-red-500/10">
                        <LogOut className="w-4 h-4 text-red-500" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[12px] font-medium text-red-500">خروج از حساب</p>
                        <p className="mt-0.5 text-[11px] text-red-400/80">بستن نشست فعلی</p>
                      </div>
                    </div>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
