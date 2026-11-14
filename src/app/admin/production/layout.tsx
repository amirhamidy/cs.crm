"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Factory, Plus, BarChart3, ClipboardList, Users, CalendarCogIcon } from "lucide-react";
import {
    ProductionProvider,
    useProductionContext,
} from "@/components/admin/production/ProductionContext";
import {
    ErrorBanner,
    MachineModal,
    LogModal,
    ConfirmDeleteLog,
    ViewNoteModal,
} from "@/components/admin/production/shared";

const TABS: { href: string; label: string; icon: ReactNode }[] = [
    { href: "/admin/production/dashboard", label: "داشبورد", icon: <BarChart3 size={14} /> },
    { href: "/admin/production/machines", label: "ماشین‌آلات", icon: <Factory size={14} /> },
    { href: "/admin/production/logs", label: "سوابق تولید", icon: <ClipboardList size={14} /> },
    { href: "/admin/production/monthly", label: "عملکرد نیرو", icon: <Users size={14} /> },
    { href: "/admin/production/machine-summary", label: "عملکرد ماشین", icon: <CalendarCogIcon size={14} /> },
    { href: "/admin/production/machine-monthly", label: " عملکرد ماهانه ماشین ", icon: <CalendarCogIcon size={14} /> },
];

function Shell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const {
        machines,
        pageError,
        setPageError,
        machineModal,
        setMachineModal,
        showLogModal,
        setShowLogModal,
        logToDelete,
        setLogToDelete,
        logToView,
        setLogToView,
        ensure,
        refresh,
    } = useProductionContext();

    // LogModal needs the machine list
    useEffect(() => {
        if (showLogModal) ensure(["machines"]);
    }, [showLogModal, ensure]);

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6" dir="rtl">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                        <Factory size={20} />
                    </div>
                    <div>
                        <h1 className="text-[16px] font-extrabold text-gray-900 dark:text-white">
                            مدیریت تولید و ماشین‌آلات
                        </h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-400">
                            آمار کلیدی، کنترل دستگاه‌ها و سوابق تولید
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowLogModal(true)}
                        className="flex h-11 items-center gap-2 rounded-full bg-emerald-600 px-5 text-[12.5px] font-bold text-white transition-colors hover:bg-emerald-500"
                    >
                        <ClipboardList size={15} />
                        ثبت عملکرد جدید
                    </motion.button>
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setMachineModal({ open: true, machine: null })}
                        className="flex h-11 items-center gap-2 rounded-full bg-blue-600 px-5 text-[12.5px] font-bold text-white transition-colors hover:bg-blue-500"
                    >
                        <Plus size={15} />
                        تعریف ماشین
                    </motion.button>
                </div>
            </div>

            <ErrorBanner message={pageError} onClose={() => setPageError("")} />

            <div className="flex flex-wrap gap-2 rounded-2xl border border-black/[0.06] bg-[#fafafa] p-2 dark:border-white/[0.06] dark:bg-white/[0.02]">
                {TABS.map((t) => {
                    const active = pathname === t.href || pathname?.startsWith(t.href + "/");
                    return (
                        <Link
                            key={t.href}
                            href={t.href}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-bold transition-all ${active
                                ? "bg-white text-blue-600 shadow-sm dark:bg-white/[0.06] dark:text-blue-400"
                                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                }`}
                        >
                            {t.icon}
                            {t.label}
                        </Link>
                    );
                })}
            </div>

            {children}

            <AnimatePresence>
                {machineModal.open && (
                    <MachineModal
                        key={machineModal.machine?.id ?? "new"}
                        machine={machineModal.machine}
                        onClose={() => setMachineModal({ open: false, machine: null })}
                        onSaved={() => {
                            setMachineModal({ open: false, machine: null });
                            refresh();
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showLogModal && (
                    <LogModal
                        key="log-modal"
                        machines={machines}
                        onClose={() => setShowLogModal(false)}
                        onSaved={() => {
                            setShowLogModal(false);
                            refresh();
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {logToDelete && (
                    <ConfirmDeleteLog
                        key="delete-log"
                        log={logToDelete}
                        onClose={() => setLogToDelete(null)}
                        onDeleted={() => {
                            setLogToDelete(null);
                            refresh();
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {logToView && (
                    <ViewNoteModal
                        key="view-log-note"
                        log={logToView}
                        onClose={() => setLogToView(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

export default function AdminProductionLayout({ children }: { children: ReactNode }) {
    return (
        <ProductionProvider>
            <Shell>{children}</Shell>
        </ProductionProvider>
    );
}
