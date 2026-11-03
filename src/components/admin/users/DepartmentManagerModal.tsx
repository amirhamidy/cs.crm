"use client";

import { useEffect, useMemo, useState } from "react";
import { m } from "framer-motion";
import { AlertCircle, Building2, Crown, X } from "lucide-react";
import { departmentsApi } from "@/lib/api";
import { ModalFrame } from "./ModalFrame";
import { StatusSwitch } from "./StatusSwitch";
import {
    PANEL_BASE,
    SOFT_BUTTON,
    getErrorMessage,
    type DepartmentMembership,
} from "./userCardUtils";

import { ListSkeleton } from "@/components/ui/skeletons";
export function DepartmentManagerModal({
    employeeId,
    employeeName,
    onClose,
}: {
    employeeId: number;
    employeeName: string;
    onClose: () => void;
}) {
    const [memberships, setMemberships] = useState<DepartmentMembership[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [savingId, setSavingId] = useState<number | null>(null);
    const [actionError, setActionError] = useState("");

    useEffect(() => {
        let alive = true;

        departmentsApi
            .employees()
            .then((list) => {
                if (!alive) return;
                setMemberships(list);
            })
            .catch((err) => {
                if (!alive) return;
                setLoadError(
                    getErrorMessage(err, "دریافت لیست دپارتمان‌ها با خطا مواجه شد")
                );
            })
            .finally(() => {
                if (!alive) return;
                setLoading(false);
            });

        return () => {
            alive = false;
        };
    }, []);

    const myMemberships = useMemo(
        () => memberships.filter((item) => Number(item.employee) === Number(employeeId)),
        [memberships, employeeId]
    );

    const managersByDepartment = useMemo(() => {
        const map: Record<number, string[]> = {};
        memberships.forEach((item) => {
            if (!item.is_manager) return;
            const key = Number(item.department);
            if (!map[key]) map[key] = [];
            map[key].push(item.employee_name);
        });
        return map;
    }, [memberships]);

    const handleToggleManager = async (membership: DepartmentMembership) => {
        if (savingId !== null) return;

        const nextValue = !membership.is_manager;
        setSavingId(membership.id);
        setActionError("");

        try {
            await departmentsApi.updateAssignment(membership.id, {
                department: membership.department,
                is_manager: nextValue,
            });

            setMemberships((prev) =>
                prev.map((item) =>
                    item.id === membership.id ? { ...item, is_manager: nextValue } : item
                )
            );
        } catch (err) {
            setActionError(
                getErrorMessage(err, "تغییر وضعیت مدیر دپارتمان با خطا مواجه شد")
            );
        } finally {
            setSavingId(null);
        }
    };

    const busy = savingId !== null;

    return (
        <ModalFrame onClose={onClose} locked={busy} label="مدیر دپارتمان">
            <m.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.16 }}
                onClick={(e) => e.stopPropagation()}
                className={`${PANEL_BASE} max-w-[420px]`}
            >
                <div className="mb-4 flex items-center justify-between gap-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 dark:bg-amber-500/[0.14]">
                            <Crown size={16} className="text-amber-500" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">
                                مدیر دپارتمان
                            </h3>
                            <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                                {employeeName}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 text-gray-500 transition-colors disabled:opacity-50 dark:bg-white/10 dark:text-gray-300"
                        aria-label="بستن"
                    >
                        <X size={15} />
                    </button>
                </div>

                <p className="mb-3 text-[11.5px] leading-6 text-gray-500 dark:text-gray-400">
                    با روشن کردن سوییچ هر دپارتمان، این کارمند مدیر همان دپارتمان می‌شود.
                </p>

                <div className="max-h-[340px] overflow-y-auto">
                    {loading ? (
                        <ListSkeleton rows={4} />
                    ) : loadError ? (
                        <div className="flex items-center gap-1.5 rounded-2xl p-3 text-[12px] font-bold text-red-500">
                            <AlertCircle size={15} className="shrink-0" />
                            <span>{loadError}</span>
                        </div>
                    ) : myMemberships.length === 0 ? (
                        <div className="rounded-2xl bg-black/[0.03] p-4 text-center text-[12px] text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
                            این کاربر عضو هیچ دپارتمانی نیست
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {myMemberships.map((membership) => {
                                const isManager = Boolean(membership.is_manager);
                                const managers =
                                    managersByDepartment[Number(membership.department)] ?? [];

                                return (
                                    <div
                                        key={membership.id}
                                        className={`flex items-center justify-between gap-3 rounded-2xl border p-3 ${isManager
                                            ? "border-amber-500/30 bg-amber-500/[0.08] dark:bg-amber-500/10"
                                            : "border-black/[0.06] bg-black/[0.03] dark:border-white/[0.06] dark:bg-white/[0.03]"
                                            }`}
                                    >
                                        <div className="flex min-w-0 flex-col gap-1">
                                            <div className="flex items-center gap-1.5">
                                                <Building2
                                                    size={14}
                                                    className="shrink-0 text-gray-400 dark:text-gray-500"
                                                />
                                                <span className="truncate text-[13px] font-bold text-gray-800 dark:text-gray-100">
                                                    {membership.department_name}
                                                </span>
                                                {isManager && (
                                                    <span className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-500/[0.16] px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                                        <Crown size={10} />
                                                        مدیر
                                                    </span>
                                                )}
                                            </div>
                                            <span className="truncate text-[10.5px] text-gray-500 dark:text-gray-400">
                                                {managers.length > 0
                                                    ? `مدیر فعلی: ${managers.join("، ")}`
                                                    : "مدیری برای این دپارتمان تعیین نشده"}
                                            </span>
                                        </div>

                                        <StatusSwitch
                                            isActive={isManager}
                                            loading={savingId === membership.id}
                                            disabled={busy && savingId !== membership.id}
                                            title={
                                                isManager
                                                    ? "حذف از مدیریت این دپارتمان"
                                                    : "تعیین به عنوان مدیر این دپارتمان"
                                            }
                                            onToggle={() => handleToggleManager(membership)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {actionError && (
                    <p className="mt-3 text-[11.5px] font-bold text-red-500">
                        {actionError}
                    </p>
                )}

                <div className="mt-5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className={`w-full ${SOFT_BUTTON}`}
                    >
                        بستن
                    </button>
                </div>
            </m.div>
        </ModalFrame>
    );
}
