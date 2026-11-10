"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { FileBarChart2, X } from "lucide-react";
import {
    ReportError,
    ReportHero,
    ReportLoading,
    ReportPanel,
    ReportTabs,
    useCaseReport,
} from "./CaseReportParts";
import type { ReportTab } from "./CaseReportParts";

interface CaseReportModalProps {
    caseId: number;
    caseTitle: string;
    onClose: () => void;
}

export default function CaseReportModal({ caseId, caseTitle, onClose }: CaseReportModalProps) {
    const { report, error, loading } = useCaseReport(caseId);
    const [tab, setTab] = useState<ReportTab>("overview");

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = previous;
        };
    }, [onClose]);

    return (
        <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
            onClick={onClose}
        >
            <m.div
                role="dialog"
                aria-modal="true"
                dir="rtl"
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#16181d]"
            >
                <div className="relative flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-white/[0.06]">
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-l from-indigo-500 via-violet-500 to-emerald-500" />
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
                            <FileBarChart2 size={18} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-[14px] font-black text-gray-900 dark:text-white">گزارش پرونده</h2>
                            <p className="truncate text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                                {caseTitle}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="بستن"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                    {loading && <ReportLoading />}
                    {!loading && error && <ReportError message={error} />}
                    {!loading && !error && report && (
                        <>
                            <ReportHero report={report} />
                            <ReportTabs report={report} active={tab} onChange={setTab} />
                            <m.div
                                key={tab}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ReportPanel report={report} tab={tab} />
                            </m.div>
                        </>
                    )}
                </div>
            </m.div>
        </m.div>
    );
}
