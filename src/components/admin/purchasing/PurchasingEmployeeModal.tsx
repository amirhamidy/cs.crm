"use client";


import { useEffect, useState } from "react";

import { createPortal } from "react-dom";

import { AnimatePresence, motion } from "framer-motion";

import { Check, Loader2, UserPlus, X } from "lucide-react";

import axiosInstance from "@/lib/axiosInstance";

import type { ApiPurchasingEmployee } from "@/types/purchasing";

import { FloatingSelect, OPTION_CLASS } from "./FormControls";


interface EmployeeItem {

    id: number;

    full_name?: string;

    username?: string;

}


interface Props {

    open: boolean;

    existingEmployees: ApiPurchasingEmployee[];

    onClose: () => void;

    onSaved: () => void;

}


const normalizeList = <T,>(value: unknown): T[] => {

    if (Array.isArray(value)) return value as T[];

    if (

        value &&

        typeof value === "object" &&

        "results" in value &&

        Array.isArray((value as { results?: unknown }).results)

    ) {

        return (value as { results: T[] }).results;

    }

    return [];

};


export default function PurchasingEmployeeModal({

    open,

    existingEmployees,

    onClose,

    onSaved,

}: Props) {

    const [employees, setEmployees] = useState<EmployeeItem[]>([]);

    const [employeeId, setEmployeeId] = useState("");

    const [loading, setLoading] = useState(false);

    const [fetching, setFetching] = useState(false);

    const [error, setError] = useState("");


    useEffect(() => {

        if (!open) return;


        setEmployeeId("");

        setError("");

        setFetching(true);


        axiosInstance

            .get("/accounts/api/v1/employee/list/")

            .then((res) => {

                const data = normalizeList<EmployeeItem>(res.data);

                const existing = new Set(existingEmployees.map((item) => item.employee));

                setEmployees(data.filter((item) => !existing.has(item.id)));

            })

            .catch(() => {

                setError("دریافت لیست کارکنان انجام نشد.");

            })

            .finally(() => setFetching(false));

    }, [open, existingEmployees]);


    const submit = async () => {

        if (!employeeId) {

            setError("یک کارمند انتخاب کنید.");

            return;

        }


        try {

            setLoading(true);

            setError("");


            await axiosInstance.post("/purchasing/api/v1/employees/create/", {

                employee: Number(employeeId),

                is_active: true,

            });


            onSaved();

            onClose();

        } catch (err: unknown) {

            const e = err as {

                response?: {

                    data?: {

                        detail?: string;

                        message?: string;

                        employee?: string[] | string;

                    };

                };

            };

            const data = e?.response?.data;

            const pick = (v: string[] | string | undefined) =>

                Array.isArray(v) ? v[0] : v;

            setError(

                pick(data?.employee) ||

                data?.detail ||

                data?.message ||

                "افزودن کارمند انجام نشد."

            );

        } finally {

            setLoading(false);

        }

    };


    const selectedEmployee = employees.find((item) => String(item.id) === employeeId);


    if (typeof document === "undefined") return null;


    return createPortal(

        <AnimatePresence>

            {open && (

                <motion.div

                    initial={{ opacity: 0 }}

                    animate={{ opacity: 1 }}

                    exit={{ opacity: 0 }}

                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md"

                    dir="rtl"

                    onMouseDown={(e) => {

                        if (e.target === e.currentTarget && !loading) onClose();

                    }}

                >

                    <motion.div

                        initial={{ opacity: 0, y: 18, scale: 0.97 }}

                        animate={{ opacity: 1, y: 0, scale: 1 }}

                        exit={{ opacity: 0, y: 12, scale: 0.98 }}

                        transition={{ duration: 0.2 }}

                        className="w-full max-w-[440px] overflow-hidden rounded-[1.9rem] border border-white/10 bg-white shadow-2xl dark:bg-[#101827]"

                    >

                        <div className="flex items-center justify-between border-b border-[#DCEAFB] px-5 py-4 dark:border-[rgba(96,165,250,0.10)]">

                            <div className="flex items-center gap-3">

                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB]/10">

                                    <UserPlus size={15} className="text-[#2563EB]" />

                                </div>


                                <div>

                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">

                                        افزودن کارمند

                                    </h3>

                                    <p className="mt-0.5 text-[10.5px] text-gray-400">

                                        افزودن عضو جدید به فرآیند خرید

                                    </p>

                                </div>

                            </div>


                            <button

                                type="button"

                                onClick={onClose}

                                disabled={loading}

                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-400 disabled:opacity-50 dark:bg-[rgba(96,165,250,0.08)]"

                            >

                                <X size={16} />

                            </button>

                        </div>


                        <div className="flex flex-col gap-3.5 px-5 py-5">

                            <FloatingSelect

                                label="کارمند"

                                value={employeeId}

                                onChange={(e) => setEmployeeId(e.target.value)}

                                disabled={fetching}

                            >

                                <option value="" className={OPTION_CLASS}>

                                    {fetching ? "در حال دریافت..." : "انتخاب کارمند"}

                                </option>

                                {employees.map((employee) => (

                                    <option

                                        key={employee.id}

                                        value={employee.id}

                                        className={OPTION_CLASS}

                                    >

                                        {employee.full_name ||

                                            employee.username ||

                                            `کارمند ${employee.id}`}

                                    </option>

                                ))}

                            </FloatingSelect>


                            {selectedEmployee && (

                                <div className="flex items-center gap-2.5 rounded-2xl border border-[#2563EB]/20 bg-[#2563EB]/[.05] px-3 py-2.5">

                                    <div

                                        className="flex h-9 w-9 items-center justify-center rounded-xl text-[13px] font-extrabold text-white"

                                        style={{

                                            background: "linear-gradient(135deg,#2563EB,#06B6D4)",

                                        }}

                                    >

                                        {(

                                            selectedEmployee.full_name ||

                                            selectedEmployee.username ||

                                            "؟"

                                        )

                                            .trim()

                                            .charAt(0)}

                                    </div>

                                    <div className="min-w-0 flex-1">

                                        <p className="truncate text-[11.5px] font-extrabold text-gray-900 dark:text-white">

                                            {selectedEmployee.full_name || selectedEmployee.username}

                                        </p>

                                        <p className="mt-0.5 truncate text-[10px] text-gray-400">

                                            {selectedEmployee.username

                                                ? `@${selectedEmployee.username}`

                                                : `شناسه ${selectedEmployee.id}`}

                                        </p>

                                    </div>

                                </div>

                            )}


                            {!fetching && employees.length === 0 && (

                                <div className="rounded-xl bg-amber-500/10 px-3 py-2 text-center text-[10.5px] font-bold text-amber-500">

                                    همه کارمندان در حال حاضر به خرید اضافه شده‌اند.

                                </div>

                            )}


                            {error && (

                                <div className="rounded-xl bg-red-500/10 px-3 py-2 text-center text-[10.5px] font-bold text-red-500">

                                    {error}

                                </div>

                            )}

                        </div>


                        <div className="flex gap-2 border-t border-[#DCEAFB] px-5 py-4 dark:border-[rgba(96,165,250,0.10)]">

                            <button

                                type="button"

                                onClick={onClose}

                                disabled={loading}

                                className="h-11 flex-1 rounded-xl bg-gray-100 text-[11px] font-extrabold text-gray-500 dark:bg-[rgba(96,165,250,0.08)] dark:text-gray-400"

                            >

                                انصراف

                            </button>


                            <button

                                type="button"

                                onClick={submit}

                                disabled={loading || fetching || !employeeId}

                                className="flex h-11 flex-[1.5] items-center justify-center gap-2 rounded-xl bg-[#2563EB] text-[11px] font-extrabold text-white shadow-lg shadow-[#2563EB]/20 disabled:opacity-60 disabled:shadow-none"

                            >

                                {loading ? (

                                    <Loader2 size={15} className="animate-spin" />

                                ) : (

                                    <Check size={15} />

                                )}

                                افزودن کارمند

                            </button>

                        </div>

                    </motion.div>

                </motion.div>

            )}

        </AnimatePresence>,

        document.body

    );

}
