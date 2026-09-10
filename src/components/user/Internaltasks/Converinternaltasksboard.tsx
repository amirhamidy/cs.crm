"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquareText, Ticket } from "lucide-react";

import AdminInternalTasksBoard from "@/components/user/Internaltasks/AdminInternalTasksBoard";
import SentTicketsBoard from "@/components/user/Internaltasks/Sentticketsboard";
import ReceivedTicketsBoard from "@/components/user/Internaltasks/Receivedticketsboard";

type AdminTab = "users" | "mine";

const TABS: { id: AdminTab; label: string; icon: typeof MessageSquareText }[] = [
    {
        id: "users",
        label: "گفتگوی کاربران",
        icon: MessageSquareText,
    },
    {
        id: "mine",
        label: "تیکت‌های من",
        icon: Ticket,
    },
];

const ConverInternalTasksBoard = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>("users");

    return (
        <div dir="rtl" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6 inline-flex items-center gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-white/[0.05]">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className="relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-bold transition-colors"
                            style={{
                                color: isActive ? "#ffffff" : undefined,
                            }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="admin-tab-pill"
                                    className="absolute inset-0 rounded-xl bg-indigo-600"
                                    transition={{
                                        type: "spring",
                                        duration: 0.4,
                                    }}
                                />
                            )}

                            <span
                                className={`relative z-10 flex items-center gap-1.5 ${isActive
                                        ? "text-white"
                                        : "text-gray-500 dark:text-gray-400"
                                    }`}
                            >
                                <Icon size={14} />
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {activeTab === "users" ? (
                <AdminInternalTasksBoard />
            ) : (
                <div className="flex flex-col gap-10">
                    <SentTicketsBoard />
                    <ReceivedTicketsBoard />
                </div>
            )}
        </div>
    );
};

export default ConverInternalTasksBoard;