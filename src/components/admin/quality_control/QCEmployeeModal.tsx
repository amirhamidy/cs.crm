"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Check,
    Loader2,
    Search,
    ShieldCheck,
    UserPlus,
    X,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import type {
    ApiQualityControlEmployee,
    ApiUser,
} from "@/types/quality_control";

interface Props {
    isOpen: boolean;
    existingEmployees: ApiQualityControlEmployee[];
    onClose: () => void;
    onCreated: (employee: ApiQualityControlEmployee) => void;
}

function getErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;

    if (!data) return fallback;

    for (const key of [
        "detail",
        "user",
        "message",
        "error",
        "non_field_errors",
    ]) {
        const value = data[key];

        if (typeof value === "string") return value;

        if (Array.isArray(value) && typeof value[0] === "string") {
            return value[0];
        }
    }

    return fallback;
}

function extractUsers(data: unknown): ApiUser[] {
    if (Array.isArray(data)) return data as ApiUser[];

    if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;

        if (Array.isArray(record.results)) {
            return record.results as ApiUser[];
        }

        if (Array.isArray(record.data)) {
            return record.data as ApiUser[];
        }
    }

    return [];
}

export default function QCEmployeeModal({
    isOpen,
    existingEmployees,
    onClose,
    onCreated,
}: Props) {
    const [users, setUsers] = useState<ApiUser[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;

        setSelectedId(null);
        setSearch("");
        setError("");
        setLoadingUsers(true);

        axiosInstance
            .get("/accounts/api/v1/user/list/")
            .then(({ data }) => setUsers(extractUsers(data)))
            .catch(() =>
                setError("دریافت لیست کاربران سیستم انجام نشد")
            )
            .finally(() => setLoadingUsers(false));
    }, [isOpen]);

    const usedUsers = useMemo(
        () => new Set(existingEmployees.map((employee) => employee.user)),
        [existingEmployees]
    );

    const availableUsers = useMemo(() => {
        const query = search.trim().toLowerCase();

        return users
            .filter((user) => !usedUsers.has(user.id))
            .filter((user) => {
                if (!query) return true;

                return (
                    user.username?.toLowerCase().includes(query) ||
                    user.first_name
                        ?.toLowerCase()
                        .includes(query) ||
                    user.last_name
                        ?.toLowerCase()
                        .includes(query)
                );
            });
    }, [users, usedUsers, search]);

    async function handleCreate() {
        if (!selectedId) {
            setError("یک کاربر را انتخاب کنید");
            return;
        }

        setCreating(true);
        setError("");

        try {
            const { data } =
                await axiosInstance.post<ApiQualityControlEmployee>(
                    "/quality_control/api/v1/employee/create/",
                    {
                        user: selectedId,
                        is_active: true,
                    }
                );

            onCreated(data);
            onClose();
        } catch (err) {
            setError(
                getErrorMessage(
                    err,
                    "افزودن کارمند کنترل کیفی انجام نشد"
                )
            );
        } finally {
            setCreating(false);
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => !creating && onClose()}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        onClick={(event) => event.stopPropagation()}
                        dir="rtl"
                        className="w-full max-w-[500px] overflow-hidden rounded-[30px] bg-white shadow-2xl dark:bg-[#0b1220]"
                    >
                        <div className="border-b border-black/[0.05] p-6 dark:border-white/[0.06]">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                                        <UserPlus size={21} />
                                    </div>

                                    <div>
                                        <h2 className="text-[16px] font-black text-gray-900 dark:text-white">
                                            افزودن کارمند کنترل کیفی
                                        </h2>

                                        <p className="mt-1 text-[10.5px] font-medium text-gray-400">
                                            یک کاربر را برای تیم کنترل کیفی انتخاب کنید
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={creating}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-white/[0.05]"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="relative">
                                <Search
                                    size={15}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="جستجوی کاربر..."
                                    className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 pr-11 pl-4 text-[11.5px] font-bold text-gray-800 outline-none focus:border-blue-500 dark:border-white/[0.07] dark:bg-white/[0.035] dark:text-white"
                                />
                            </div>

                            <div className="mt-4 max-h-[300px] overflow-y-auto">
                                {loadingUsers ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2
                                            size={20}
                                            className="animate-spin text-blue-500"
                                        />
                                    </div>
                                ) : availableUsers.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <ShieldCheck
                                            size={25}
                                            className="mx-auto text-gray-300 dark:text-white/20"
                                        />

                                        <p className="mt-3 text-[11px] font-bold text-gray-400">
                                            کاربر قابل انتخابی وجود ندارد
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {availableUsers.map((user) => {
                                            const selected =
                                                selectedId === user.id;

                                            return (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedId(user.id)
                                                    }
                                                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-right transition ${selected
                                                            ? "border-blue-500/30 bg-blue-500/[0.07]"
                                                            : "border-transparent bg-gray-50 hover:bg-gray-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                                                        }`}
                                                >
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                                                        <ShieldCheck
                                                            size={16}
                                                        />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-[11.5px] font-black text-gray-800 dark:text-white">
                                                            {user.username}
                                                        </p>

                                                        {(user.first_name ||
                                                            user.last_name) && (
                                                                <p className="mt-0.5 truncate text-[9.5px] font-medium text-gray-400">
                                                                    {
                                                                        user.first_name
                                                                    }{" "}
                                                                    {
                                                                        user.last_name
                                                                    }
                                                                </p>
                                                            )}
                                                    </div>

                                                    <div
                                                        className={`flex h-6 w-6 items-center justify-center rounded-lg ${selected
                                                                ? "bg-blue-600 text-white"
                                                                : "bg-gray-200 text-transparent dark:bg-white/[0.06]"
                                                            }`}
                                                    >
                                                        <Check size={13} />
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {error && (
                                <p className="mt-4 rounded-2xl bg-red-500/[0.07] p-3 text-center text-[10.5px] font-bold text-red-500">
                                    {error}
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={handleCreate}
                                disabled={creating || !selectedId}
                                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-[11.5px] font-black text-white transition hover:bg-blue-500 disabled:opacity-40"
                            >
                                {creating ? (
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <>
                                        <UserPlus size={15} />
                                        افزودن به تیم کنترل کیفی
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}