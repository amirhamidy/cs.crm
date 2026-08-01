"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus } from "lucide-react";
import UserCard from "./UserCard";
import type { User } from "@/types/users";
import Link from "next/link";

const MOCK_USERS: User[] = [
    { id: 1, name: "علی رضایی", email: "ali@example.com", role: "admin", joined: "۱۴۰۴/۰۳/۱۲" },
    { id: 2, name: "سارا محمدی", email: "sara@example.com", role: "user", joined: "۱۴۰۴/۰۴/۰۵" },
    { id: 3, name: "محمد کریمی", email: "mohammad@example.com", role: "user", joined: "۱۴۰۴/۰۱/۲۰" },
    { id: 4, name: "نیلوفر احمدی", email: "niloofar@example.com", role: "user", joined: "۱۴۰۴/۰۵/۰۱" },
    { id: 5, name: "رضا حسینی", email: "reza@example.com", role: "admin", joined: "۱۴۰۳/۱۲/۱۵" },
    { id: 6, name: "مریم صادقی", email: "maryam@example.com", role: "user", joined: "۱۴۰۴/۰۲/۱۰" },
    { id: 7, name: "حسین قاسمی", email: "hossein@example.com", role: "user", joined: "۱۴۰۴/۰۳/۲۸" },
];

interface UsersPageProps {
    onAddUser?: () => void;
    onViewUser?: (user: User) => void;
    onDeleteUser?: (user: User) => void;
}

export default function UsersPage({ onAddUser, onViewUser, onDeleteUser }: UsersPageProps) {
    const [users] = useState<User[]>(MOCK_USERS);

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6" dir="rtl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[22px] font-extrabold text-gray-900 dark:text-white leading-tight">
                        کاربران
                    </h1>
                    <p className="text-[12.5px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {users.length} کاربر در سیستم
                    </p>
                </div>

                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={onAddUser}
                    className=" text-[13px] font-bold text-white px-4 py-2 rounded-xl"
                    style={{
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                    }}
                >
                    <Link href="/add" className="flex items-center gap-2">
                        <UserPlus size={15} />
                        افزودن
                    </Link>
                </motion.button>
            </div>

            <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
            >
                <AnimatePresence mode="popLayout">
                    {users.map((user, i) => (
                        <UserCard
                            key={user.id}
                            user={user}
                            index={i}
                            onView={onViewUser}
                            onDelete={onDeleteUser}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
