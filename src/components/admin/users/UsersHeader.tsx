"use client";

import { motion } from "framer-motion";
import { UserPlus, Users } from "lucide-react";

interface UsersHeaderProps {
    totalCount: number;
    onAddUser?: () => void;
}

export default function UsersHeader({ totalCount, onAddUser }: UsersHeaderProps) {
    return (
        <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                >
                    <Users size={18} className="text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">
                        مدیریت کاربران
                    </h1>
                    <p className="text-[12.5px] text-gray-400 dark:text-gray-500 mt-0.5">
                        در حال مدیریت{" "}
                        <span className="font-bold text-indigo-500 dark:text-indigo-400">
                            {totalCount}
                        </span>{" "}
                        کاربر سیستم
                    </p>
                </div>
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onAddUser}
                className="flex items-center gap-2 text-[13px] font-bold text-white px-5 py-2.5 rounded-xl"
                style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                }}
            >
                <UserPlus size={16} />
                افزودن کاربر
            </motion.button>
        </div>
    );
}
