"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Phone, Building2, MapPin, Trash2, Eye } from "lucide-react";
import { Customer } from "./types";

interface CustomerCardProps {
    customer: Customer;
    index: number;
    onDelete: (customer: Customer) => void;
    onView: (customer: Customer) => void;
}

export default function CustomerCard({
    customer,
    index,
    onDelete,
    onView,
}: CustomerCardProps) {
    const [hovered, setHovered] = useState(false);
    const initials =
        customer.avatarInitials ??
        `${customer.firstName[0]}${customer.lastName[0]}`;
    const accent = customer.source.color;

    return (
        <motion.div
            initial={{ opacity: 0, y: 36, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
                duration: 0.45,
                delay: index * 0.06,
                ease: [0.23, 1, 0.32, 1],
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="relative flex flex-col justify-between rounded-2xl p-2 border backdrop-blur-xl  transition-colors duration-300"
            style={{
                borderColor: `${accent}22`,
                boxShadow: `0 0 0 1px ${accent}11, 0 4px 24px 0 ${accent}0a`,
                background: `radial-gradient(ellipse at top right, ${accent}0f 0%, transparent 65%)`,
            }}
        >
            <div
                className="absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl opacity-10 pointer-events-none"
                style={{ background: accent }}
            />

            <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div
                        className="flex-shrink-0 flex items-center justify-center rounded-xl font-bold text-white text-sm"
                        style={{
                            background: `linear-gradient(135deg, ${accent}cc, ${accent}66)`,
                            boxShadow: `0 4px 16px ${accent}35`,
                            width: 42,
                            height: 42,
                        }}
                    >
                        {initials}
                    </div>
                    <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">
                            {customer.firstName} {customer.lastName}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            {customer.jobTitle}
                        </p>
                    </div>
                </div>

                <span
                    className="flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{
                        background: `${accent}18`,
                        color: accent,
                        border: `1px solid ${accent}35`,
                    }}
                >
                    {customer.source.label}
                </span>
            </div>

            <div className="relative z-10 mt-4 space-y-2 pb-2">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Building2 size={12} />
                    <span className="truncate text-[11px]">{customer.company}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Phone size={12} />
                    <span className="font-mono text-[11px]">{customer.phone}</span>
                </div>
                <div className="flex items-start gap-2 text-gray-500 dark:text-gray-400">
                    <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                    <span className="truncate text-[11px]">{customer.address}</span>
                </div>
                {customer.description && (
                    <p
                        className="text-[11px] text-gray-400 dark:text-gray-500 pt-1 leading-relaxed line-clamp-2 rounded-lg px-2 py-1.5"
                        style={{ background: `${accent}08` }}
                    >
                        {customer.description}
                    </p>
                )}
            </div>

            <AnimatePresence>
                {hovered && (
                    <>
                        <motion.button
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 10, opacity: 0 }}
                            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                            onClick={() => onView(customer)}
                            className="absolute bottom-0 left-0 z-20 flex items-center justify-center gap-1.5
                                w-1/2 py-3 text-xs font-medium
                                text-gray-600 dark:text-gray-300
                                bg-gray-100/90 dark:bg-white/[0.07]
                                hover:bg-gray-200/90 dark:hover:bg-white/[0.12]
                                rounded-bl-2xl rounded-tr-2xl
                                border-t border-r border-gray-200/60 dark:border-white/10
                                transition-colors duration-200"
                        >
                            <Eye size={13} />
                            مشاهده
                        </motion.button>

                        <motion.button
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 10, opacity: 0 }}
                            transition={{ duration: 0.28, delay: 0.04, ease: [0.23, 1, 0.32, 1] }}
                            onClick={() => onDelete(customer)}
                            className="absolute bottom-0 right-0 z-20 flex items-center justify-center gap-1.5
                                w-1/2 py-3 text-xs font-medium
                                text-red-400
                                bg-gray-100 dark:bg-white/[0.07]
                                hover:bg-red-500
                                hover:text-white
                                rounded-br-2xl rounded-tl-2xl
                                border-t border-l border-gray-200/60 dark:border-white/10
                                transition-colors duration-200"
                        >
                            <Trash2 size={13} />
                            حذف
                        </motion.button>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
