"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Phone, Building2, Trash2, SquarePen, User, CalendarDays } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { Customer } from "@/types/customer";
import { useEmployeeDirectory } from "@/hooks/useEmployeeDirectory";
import CustomerDeleteModal from "./DeleteModal";
import CustomerEditModal from "./CustomerEditModal";

interface Props {
    customer: Customer;
    onDeleted: (id: number) => void;
    onEdited: (updated: Customer) => void;
}

const statusStyle: Record<number, string> = {
    1: "bg-amber-500/15 text-amber-400",
    2: "bg-emerald-500/15 text-emerald-400",
    3: "bg-red-500/15 text-red-400",
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export default function CustomerCard({ customer, onDeleted, onEdited }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [hovered, setHovered] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const { resolveName } = useEmployeeDirectory();

    const creatorName = resolveName(customer.created_by_username, customer.created_by_username);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await axiosInstance.delete(`/customers/api/v1/customers/${customer.id}/delete/`);
            onDeleted(customer.id);
        } catch {
            setIsDeleting(false);
            setShowConfirm(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                className="relative rounded-2xl p-4 flex flex-col gap-3 overflow-hidden"
                style={{
                    border: isDark
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "1px solid rgba(0,0,0,0.06)",
                    minHeight: "130px",
                    background: isDark ? "rgba(255,255,255,0.02)" : "#fafafa",
                }}
            >
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ borderRadius: "1rem" }}
                >
                    <defs>
                        <linearGradient
                            id={`borderGrad-${customer.id}`}
                            x1="100%"
                            y1="100%"
                            x2="0%"
                            y2="0%"
                        >
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
                    <motion.rect
                        x="1"
                        y="1"
                        width="calc(100% - 2px)"
                        height="calc(100% - 2px)"
                        rx="15"
                        ry="15"
                        fill="none"
                        stroke={`url(#borderGrad-${customer.id})`}
                        strokeWidth="1.5"
                        pathLength="1"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={
                            hovered
                                ? { pathLength: 1, opacity: 1 }
                                : { pathLength: 0, opacity: 0 }
                        }
                        transition={{ duration: 0.55, ease: "easeInOut" }}
                    />
                </svg>

                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                    <button
                        onClick={() => setShowEdit(true)}
                        className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors"
                        style={{
                            background: isDark
                                ? "rgba(99,102,241,0.1)"
                                : "rgba(99,102,241,0.07)",
                            color: isDark ? "#a5b4fc" : "#6366f1",
                        }}
                        title="ویرایش"
                        type="button"
                    >
                        <SquarePen size={11} />
                    </button>
                    <button
                        onClick={() => setShowConfirm(true)}
                        className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors"
                        style={{
                            background: isDark
                                ? "rgba(239,68,68,0.1)"
                                : "rgba(239,68,68,0.07)",
                            color: "#ef4444",
                        }}
                        title="حذف"
                        type="button"
                    >
                        <Trash2 size={11} />
                    </button>
                </div>

                <div className="flex items-center gap-3 pt-1">
                    <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-[15px] font-extrabold flex-shrink-0"
                        style={{
                            background: `linear-gradient(135deg, #6366f1, #8b5cf6)`,
                        }}
                    >
                        {customer.full_name?.charAt(0) ?? "?"}
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                        <p className="text-[13.5px] font-extrabold text-gray-800 dark:text-gray-100 leading-tight truncate">
                            {customer.full_name}
                        </p>
                        <p className="text-[11.5px] text-gray-400 dark:text-gray-500 truncate">
                            #{customer.id}
                        </p>
                    </div>
                </div>

                <div
                    className="pt-2.5 border-t flex flex-col gap-1.5"
                    style={{
                        borderColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.05)",
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[11.5px] text-gray-400 dark:text-gray-500">
                            <Phone className="w-3.5 h-3.5" />
                            <span dir="ltr">{customer.phone_number}</span>
                        </div>
                        <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${statusStyle[customer.status] ??
                                "bg-gray-500/15 text-gray-400"
                                }`}
                        >
                            {customer.status_display}
                        </span>
                    </div>

                    {customer.company_name && (
                        <div className="flex items-center gap-2 text-[11.5px] text-gray-400 dark:text-gray-500">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{customer.company_name}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-[11.5px] text-gray-400 dark:text-gray-500">
                        <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5" />
                            <span>ثبت‌کننده: {creatorName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>{formatDate(customer.created_at)}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            <CustomerDeleteModal
                customerName={customer.full_name}
                isOpen={showConfirm}
                isDeleting={isDeleting}
                onConfirm={handleDelete}
                onClose={() => setShowConfirm(false)}
            />

            <CustomerEditModal
                customer={customer}
                isOpen={showEdit}
                onClose={() => setShowEdit(false)}
                onEdited={onEdited}
            />
        </>
    );
}