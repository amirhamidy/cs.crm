"use client";

import PageHeader from "@/components/ui/PageHeader";
import PillTabs from "@/components/ui/PillTabs";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Factory, Plus, BarChart3, ClipboardList, Users, CalendarCogIcon, Package, AlertTriangle, Scale, Trophy, Timer, Search } from "lucide-react";
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
    { href: "/admin/production/products", label: "محصولات", icon: <Package size={14} /> },
    { href: "/admin/production/causes", label: "علت‌ها", icon: <AlertTriangle size={14} /> },
    { href: "/admin/production/variance", label: "اختلاف تولید", icon: <Scale size={14} /> },
    { href: "/admin/production/daily-standard", label: "استاندارد روزانه", icon: <Scale size={14} /> },
    { href: "/admin/production/logs", label: "سوابق تولید", icon: <ClipboardList size={14} /> },
    { href: "/admin/production/discrepancy-report", label: "گزارش علت‌ها", icon: <AlertTriangle size={14} /> },
    { href: "/admin/production/monthly", label: "عملکرد نیرو", icon: <Users size={14} /> },
    { href: "/admin/production/machine-summary", label: "عملکرد ماشین", icon: <CalendarCogIcon size={14} /> },
    { href: "/admin/production/highlights", label: "برترین‌ها و ضایعات کارکنان", icon: <Trophy size={14} /> },
    { href: "/admin/production/downtime", label: "آمار توقف دستگاه", icon: <Timer size={14} /> },
    { href: "/admin/production/search", label: "جستجو", icon: <Search size={14} /> },
];

function Shell({ children }: { children: ReactNode }) {
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
        logToEdit,
        setLogToEdit,
        logToView,
        setLogToView,
        ensure,
        refresh,
    } = useProductionContext();

    useEffect(() => {
        if (showLogModal || logToEdit) ensure(["machines"]);
    }, [showLogModal, logToEdit, ensure]);

    return (
        <div className="mx-auto space-y-6 px-2" dir="rtl">
            <PageHeader
                icon={<Factory size={20} />}
                title="مدیریت تولید و ماشین‌آلات"
                hint="آمار کلیدی، کنترل دستگاه‌ها و سوابق تولید"
                actions={<>
                    <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => setShowLogModal(true)}
                        className="flex h-11 items-center gap-2 rounded-full bg-emerald-600 px-5 text-[12.5px] font-bold text-white transition-colors hover:bg-emerald-500">
                        <ClipboardList size={15} />ثبت عملکرد جدید
                    </motion.button>
                    <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => setMachineModal({ open: true, machine: null })}
                        className="flex h-11 items-center gap-2 rounded-full bg-indigo-600 px-5 text-[12.5px] font-bold text-white transition-colors hover:bg-indigo-500">
                        <Plus size={15} />تعریف ماشین
                    </motion.button>
                </>}
            />

            <ErrorBanner message={pageError} onClose={() => setPageError("")} />

            <PillTabs tabs={TABS} />

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
                {logToEdit && (
                    <LogModal
                        key={`edit-log-${logToEdit.id}`}
                        machines={machines}
                        log={logToEdit}
                        onClose={() => setLogToEdit(null)}
                        onSaved={() => {
                            setLogToEdit(null);
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
