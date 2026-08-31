"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
    Building2,
    Users,
    ArrowRight,
    Loader,
    AlertCircle,
    Plus,
    ListChecks,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { useDepartmentStore } from "@/components/admin/departments/departmentStore";
import { Stage, Employee, Task } from "@/components/admin/departments/types";
import StagesPanel from "@/components/admin/departments/StagesPanel";
import DeleteModal from "@/components/admin/departments/DeleteModal";
import AddStageModal from "@/components/admin/departments/AddStageDrawer";
import AddEmployeeModal from "@/components/admin/departments/AddEmployeeModal";

type DeleteTarget =
    | { type: "stage"; stage: Stage }
    | { type: "employee"; employee: Employee }
    | null;

const stageColors = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#ef4444",
    "#14b8a6",
];

const getRelationId = (
    value:
        | string
        | number
        | { id: string | number }
        | null
        | undefined,
) => {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === "object") {
        return value.id == null
            ? null
            : String(value.id);
    }

    return String(value);
};

export default function DepartmentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const {
        departments,
        allEmployees,
        fetchAll,
        addStage,
        updateStage,
        deleteStage,
        assignEmployee,
        removeEmployee,
    } = useDepartmentStore();

    const [deleteTarget, setDeleteTarget] =
        useState<DeleteTarget>(null);

    const [deleteLoading, setDeleteLoading] =
        useState(false);

    const [stageRefreshing, setStageRefreshing] = useState(false);


    const [addStageOpen, setAddStageOpen] =
        useState(false);

    const [addEmployeeOpen, setAddEmployeeOpen] =
        useState(false);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [tasksLoading, setTasksLoading] =
        useState(false);

    const [pageLoading, setPageLoading] =
        useState(true);

    const department = useMemo(
        () =>
            departments.find(
                (d) =>
                    String(d.id) === String(id),
            ) ?? null,
        [departments, id],
    );

    const accent =
        department?.accent || "#6366f1";

    const fetchTasks = useCallback(async () => {
        setTasksLoading(true);

        try {
            const res = await axiosInstance.get(
                "/tasks/api/v1/tasks/",
            );

            const data = res.data;

            setTasks(
                Array.isArray(data)
                    ? data
                    : (data?.results ?? []),
            );
        } catch {
            setTasks([]);
        } finally {
            setTasksLoading(false);
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            if (departments.length === 0) {
                await fetchAll();
            }

            if (mounted) {
                setPageLoading(false);
            }
        };

        init();
        fetchTasks();

        return () => {
            mounted = false;
        };
    }, [fetchAll, fetchTasks]);

    const departmentTasks = useMemo(() => {
        if (
            !department ||
            !Array.isArray(department.stages)
        ) {
            return [];
        }

        const stageIds = new Set(
            department.stages.map((s) =>
                String(s.id),
            ),
        );

        return tasks.filter((t) => {
            const sid = getRelationId(
                t.current_step,
            );

            return (
                sid !== null &&
                stageIds.has(sid)
            );
        });
    }, [tasks, department]);

    const handleConfirmDelete = async () => {
        if (!deleteTarget || !id) {
            return;
        }

        setDeleteLoading(true);

        try {
            if (deleteTarget.type === "stage") {
                const targetId =
                    deleteTarget.stage.id;

                if (
                    targetId !== undefined &&
                    targetId !== null &&
                    !String(targetId).startsWith(
                        "temp-",
                    )
                ) {
                    await deleteStage(
                        id,
                        String(targetId),
                    );
                }
            } else if (
                deleteTarget.type === "employee"
            ) {
                const targetEmpId =
                    deleteTarget.employee.id;

                if (
                    targetEmpId !== undefined &&
                    targetEmpId !== null
                ) {
                    await removeEmployee(
                        id,
                        String(targetEmpId),
                    );
                }
            }
        } finally {
            setDeleteLoading(false);
            setDeleteTarget(null);
        }
    };

    const deleteModalMeta = useMemo(() => {
        if (!deleteTarget) {
            return {
                title: "",
                description: "",
            };
        }

        if (deleteTarget.type === "stage") {
            return {
                title: `حذف فرآیند "${deleteTarget.stage.name}"`,
                description:
                    "این فرآیند از دپارتمان حذف می‌شود.",
            };
        }

        return {
            title: `حذف عضو "${deleteTarget.employee.name}"`,
            description:
                "این عضو از دپارتمان حذف می‌شود.",
        };
    }, [deleteTarget]);

    if (pageLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader
                    size={22}
                    className="animate-spin text-indigo-500"
                />
            </div>
        );
    }

    if (!department) {
        return (
            <div
                className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-red-500/20 bg-red-500/5"
                dir="rtl"
            >
                <AlertCircle
                    size={28}
                    className="text-red-500"
                />

                <p className="text-[13px] font-bold text-red-500">
                    دپارتمان یافت نشد
                </p>

                <button
                    type="button"
                    onClick={() =>
                        router.push(
                            "/admin/departments",
                        )
                    }
                    className="rounded-2xl px-4 py-2 text-[12px] font-extrabold text-white transition-transform active:scale-95"
                    style={{
                        background: accent,
                    }}
                >
                    بازگشت به لیست
                </button>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col gap-5"
            dir="rtl"
        >
            <DeleteModal
                open={!!deleteTarget}
                title={deleteModalMeta.title}
                description={
                    deleteModalMeta.description
                }
                loading={deleteLoading}
                onConfirm={handleConfirmDelete}
                onCancel={() =>
                    setDeleteTarget(null)
                }
            />

            <AddStageModal
                open={addStageOpen}
                department={department}
                onClose={() => setAddStageOpen(false)}
                onSubmit={async (data) => {
                    await addStage(id, { name: data.name });
                    setStageRefreshing(true);
                    await fetchAll();
                    setStageRefreshing(false);
                }}
            />

            <AddEmployeeModal
                open={addEmployeeOpen}
                department={department}
                employees={allEmployees}
                onClose={() =>
                    setAddEmployeeOpen(false)
                }
                onSubmit={async (employeeId) => {
                    await assignEmployee(
                        id,
                        employeeId,
                    );

                    setAddEmployeeOpen(false);
                }}
            />

            <div className="flex items-center gap-2.5">
                <button
                    type="button"
                    onClick={() =>
                        router.push(
                            "/admin/departments",
                        )
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                >
                    <ArrowRight size={16} />
                </button>

                <div
                    className="flex h-9 w-9 items-center justify-center rounded-2xl"
                    style={{
                        backgroundColor: `${accent}18`,
                        border: `1px solid ${accent}30`,
                    }}
                >
                    <Building2
                        size={17}
                        style={{
                            color: accent,
                        }}
                    />
                </div>

                <div>
                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                        {department.name}
                    </h3>

                    <div className="mt-0.5 flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-600">
                        <span className="flex items-center gap-1">
                            <Users size={10} />
                            {department.employees?.length ??
                                0}{" "}
                            عضو
                        </span>

                        <span className="flex items-center gap-1">
                            <ListChecks size={10} />
                            {departmentTasks.length}{" "}
                            تسک فعال
                        </span>
                    </div>
                </div>
            </div>

            <motion.div
                initial={{
                    opacity: 0,
                    y: 12,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                transition={{
                    duration: 0.25,
                }}
                className="flex flex-col gap-3 rounded-[1.6rem] border border-gray-200/60 bg-white/40 p-4 dark:border-white/[0.06] dark:bg-white/[0.015]"
            >
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[11.5px] font-extrabold text-gray-500 dark:text-gray-400">
                        اعضای تیم
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            setAddEmployeeOpen(
                                true,
                            )
                        }
                        className="flex h-8 items-center justify-center gap-1.5 rounded-xl px-3 text-[11.5px] font-bold transition-all active:scale-95"
                        style={{
                            background: `${accent}18`,
                            border: `1px solid ${accent}35`,
                            color: accent,
                        }}
                    >
                        <Plus
                            size={12}
                            strokeWidth={2.5}
                        />
                        افزودن عضو
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {!department.employees ||
                        department.employees.length ===
                        0 ? (
                        <span className="text-[11px] italic text-gray-400 dark:text-gray-600">
                            هنوز عضوی اضافه نشده
                        </span>
                    ) : (
                        department.employees.map(
                            (emp) => (
                                <button
                                    key={emp.id}
                                    type="button"
                                    onClick={() =>
                                        setDeleteTarget(
                                            {
                                                type: "employee",
                                                employee:
                                                    emp,
                                            },
                                        )
                                    }
                                    className="flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all hover:opacity-75 active:scale-95"
                                    style={{
                                        background: `${accent}15`,
                                        border: `1px solid ${accent}30`,
                                        color: accent,
                                    }}
                                    title={`حذف ${emp.name}`}
                                >
                                    <span
                                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md text-[9px] font-bold"
                                        style={{
                                            background: `${accent}30`,
                                        }}
                                    >
                                        {emp.name?.charAt(
                                            0,
                                        ) || "U"}
                                    </span>

                                    {emp.name}
                                </button>
                            ),
                        )
                    )}
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.05 }}
                className="relative flex flex-col rounded-[1.6rem] border border-gray-200/60 bg-white/40 p-4 dark:border-white/[0.06] dark:bg-white/[0.015]"
            >
                <AnimatePresence>
                    {stageRefreshing && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-10 flex items-center justify-center rounded-[1.6rem] bg-white/70 backdrop-blur-sm dark:bg-black/50"
                        >
                            <Loader size={20} className="animate-spin text-indigo-500" />
                        </motion.div>
                    )}
                </AnimatePresence>

                <StagesPanel
                    department={department}
                    tasks={departmentTasks}
                    tasksLoading={tasksLoading}
                    stageColors={stageColors}
                    onAddStage={() => setAddStageOpen(true)}
                    onEditStage={async (stage, values) => {
                        await updateStage(id, stage.id, values);
                    }}
                    onDeleteStage={(stage) => setDeleteTarget({ type: "stage", stage })}
                    onReorder={(stages) =>
                        useDepartmentStore.setState((state) => ({
                            departments: state.departments.map((d) =>
                                String(d.id) === String(id) ? { ...d, stages } : d
                            ),
                        }))
                    }
                />
            </motion.div>
        </div>
    );
}