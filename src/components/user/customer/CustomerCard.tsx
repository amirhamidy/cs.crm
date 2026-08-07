"use client";

import { useState, useRef } from "react";
import { motion, useAnimationFrame } from "framer-motion";
import { useTheme } from "next-themes";
import { Phone, Building2, Trash2, SquarePen, User, CalendarDays } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { Customer } from "@/types/customer";
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

function AnimatedBorder({ active, isDark }: { active: boolean; isDark: boolean }) {
    const angleRef = useRef(0);
    const divRef = useRef<HTMLDivElement>(null);

    useAnimationFrame((_, delta) => {
        if (!divRef.current) return;

        if (active) {
            angleRef.current = (angleRef.current + delta * 0.18) % 360;
        }

        const angle = angleRef.current;

        divRef.current.style.background = active
            ? `conic-gradient(
                from ${angle}deg,
                transparent 0deg,
                transparent 50deg,
                #a5b4fc 100deg,
                #6366f1 160deg,
                #818cf8 200deg,
                #a5b4fc 250deg,
                transparent 300deg,
                transparent 360deg
            )`
            : isDark
                ? "rgba(255,255,255,0.07)"
                : "rgba(0,0,0,0.07)";
    });

    return (
        <div
            ref={divRef}
            className="absolute inset-0 rounded-2xl"
            style={{ padding: "2.5px" }}
            aria-hidden
        />
    );
}

export default function CustomerCard({ customer, onDeleted, onEdited }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [hovered, setHovered] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showEdit, setShowEdit] = useState(false);

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
                className="relative rounded-2xl"
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                style={{
                    padding: "2.5px",
                    background: hovered
                        ? undefined
                        : isDark
                            ? "rgba(255,255,255,0.07)"
                            : "rgba(0,0,0,0.07)",
                }}
            >
                <AnimatedBorder active={hovered} isDark={isDark} />

                <div
                    className={`relative z-10 rounded-[calc(1rem-2px)] p-4 flex flex-col gap-3 ${isDark ? "bg-[#0f1117]" : "bg-white"
                        }`}
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${isDark
                                        ? "bg-indigo-500/15 text-indigo-400"
                                        : "bg-indigo-100 text-indigo-600"
                                    }`}
                            >
                                {customer.full_name?.charAt(0) ?? "?"}
                            </div>
                            <div>
                                <p
                                    className={`text-sm font-bold leading-tight ${isDark ? "text-white" : "text-gray-900"
                                        }`}
                                >
                                    {customer.full_name}
                                </p>
                                <p
                                    className={`text-xs mt-0.5 ${isDark ? "text-white/40" : "text-gray-400"
                                        }`}
                                >
                                    #{customer.id}
                                </p>
                            </div>
                        </div>
                        <span
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${statusStyle[customer.status] ??
                                "bg-gray-500/15 text-gray-400"
                                }`}
                        >
                            {customer.status_display}
                        </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div
                            className={`flex items-center gap-2 text-xs ${isDark ? "text-white/50" : "text-gray-500"
                                }`}
                        >
                            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                            <span dir="ltr">{customer.phone_number}</span>
                        </div>
                        {customer.company_name && (
                            <div
                                className={`flex items-center gap-2 text-xs ${isDark ? "text-white/50" : "text-gray-500"
                                    }`}
                            >
                                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{customer.company_name}</span>
                            </div>
                        )}
                        <div
                            className={`flex items-center gap-2 text-xs ${isDark ? "text-white/50" : "text-gray-500"
                                }`}
                        >
                            <User className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>ثبت‌کننده: {customer.created_by_username}</span>
                        </div>
                        <div
                            className={`flex items-center gap-2 text-xs ${isDark ? "text-white/50" : "text-gray-500"
                                }`}
                        >
                            <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{formatDate(customer.created_at)}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <motion.button
                            whileTap={{ scale: 0.94 }}
                            onClick={() => setShowEdit(true)}
                            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl transition-colors ${isDark
                                    ? "bg-white/5 hover:bg-indigo-500/20 text-white/60 hover:text-indigo-400"
                                    : "bg-gray-100 hover:bg-indigo-100 text-gray-500 hover:text-indigo-600"
                                }`}
                        >
                            <SquarePen className="w-3.5 h-3.5" />
                            ویرایش
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.94 }}
                            onClick={() => setShowConfirm(true)}
                            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl transition-colors ${isDark
                                    ? "bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400"
                                    : "bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500"
                                }`}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            حذف
                        </motion.button>
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

