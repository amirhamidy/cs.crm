"use client";

import {
    useEffect,
    useState,
    useCallback,
    useMemo,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
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
import {
    Stage,
    Employee,
    Task,
} from "@/components/admin/departments/types";
import StagesPanel from "@/components/admin/departments/StagesPanel";
import EmployeesPanel from "@/components/admin/departments/EmployeesPanel";
import DeleteModal from "@/components/admin/departments/DeleteModal";
import AddStageModal from "@/components/admin/departments/AddStageDrawer";
import AddEmployeeModal from "@/components/admin/departments/AddEmployeeModal";

type DeleteTarget =
    | {
        type: "stage";
        stage: Stage;
    }
    | {
        type: "employee";
        employee: Employee;
    }
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
        | undefined
) => {
    if (
        value === null ||
        value === undefined
    ) {
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
    const { id } =
        useParams<{ id: string }>();

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

    const [stageRefreshing, setStageRefreshing] =
        useState(false);

    const [addStageOpen, setAddStageOpen] =
        useState(false);

    const [addEmployeeOpen, setAddEmployeeOpen] =
        useState(false);

    const [tasks, setTasks] =
        useState<Task[]>([]);

    const [tasksLoading, setTasksLoading] =
        useState(false);

    const [pageLoading, setPageLoading] =
        useState(true);

    const department = useMemo(
        () =>
            departments.find(
                (department) =>
                    String(
                        department.id
                    ) === String(id)
            ) ?? null,
        [departments, id]
    );

    const accent =
        department?.accent ||
        "#6366f1";

    const fetchTasks =
        useCallback(async () => {
            setTasksLoading(true);

            try {
                const res =
                    await axiosInstance.get(
                        "/tasks/api/v1/tasks/"
                    );

                const data = res.data;

                setTasks(
                    Array.isArray(data)
                        ? data
                        : (data?.results ??
                            [])
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
            if (
                departments.length ===
                0
            ) {
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
    }, [
        fetchAll,
        fetchTasks,
        departments.length,
    ]);

    const departmentTasks = useMemo(() => {
        if (
            !department?.stages?.length
        ) {
            return [];
        }

        const stageIds = new Set(
            department.stages.map(
                (stage) =>
                    String(stage.id)
            )
        );

        return tasks.filter((task) => {
            const stageId =
                getRelationId(
                    task.current_step
                );

            const status = String(
                task.status ?? ""
            ).toLowerCase();

            if (
                !stageId ||
                !stageIds.has(stageId)
            ) {
                return false;
            }

            return ![
                "completed",
                "cancelled",
                "sold",
            ].includes(status);
        });
    }, [tasks, department]);

    const handleConfirmDelete =
        async () => {
            if (
                !deleteTarget ||
                !id
            ) {
                return;
            }

            setDeleteLoading(true);

            try {
                if (
                    deleteTarget.type ===
                    "stage"
                ) {
                    const targetId =
                        deleteTarget.stage
                            .id;

                    if (
                        targetId !==
                        undefined &&
                        targetId !== null &&
                        !String(
                            targetId
                        ).startsWith(
                            "temp-"
                        )
                    ) {
                        await deleteStage(
                            id,
                            String(
                                targetId
                            )
                        );
                    }
                } else {
                    const targetEmpId =
                        deleteTarget
                            .employee.id;

                    if (
                        targetEmpId !==
                        undefined &&
                        targetEmpId !== null
                    ) {
                        await removeEmployee(
                            id,
                            String(
                                targetEmpId
                            )
                        );
                    }
                }
            } finally {
                setDeleteLoading(false);
                setDeleteTarget(null);
            }
        };

    const deleteModalMeta =
        useMemo(() => {
            if (!deleteTarget) {
                return {
                    title: "",
                    description: "",
                };
            }

            if (
                deleteTarget.type ===
                "stage"
            ) {
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
                            "/admin/departments"
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
            className="flex flex-col gap-4"
            dir="rtl"
        >
            <DeleteModal
                open={!!deleteTarget}
                title={
                    deleteModalMeta.title
                }
                description={
                    deleteModalMeta.description
                }
                loading={deleteLoading}
                onConfirm={
                    handleConfirmDelete
                }
                onCancel={() =>
                    setDeleteTarget(null)
                }
            />

            <AddStageModal
                open={addStageOpen}
                department={department}
                onClose={() =>
                    setAddStageOpen(false)
                }
                onSubmit={async (data) => {
                    await addStage(id, {
                        name: data.name,
                    });

                    setStageRefreshing(
                        true
                    );

                    await fetchAll();

                    setStageRefreshing(
                        false
                    );
                }}
            />

            <AddEmployeeModal
                open={addEmployeeOpen}
                department={department}
                employees={allEmployees}
                onClose={() =>
                    setAddEmployeeOpen(false)
                }
                onSubmit={async (
                    employeeId
                ) => {
                    await assignEmployee(
                        id,
                        employeeId
                    );

                    setAddEmployeeOpen(
                        false
                    );
                }}
            />

            <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() =>
                            router.push("/admin/departments")
                        }
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <ArrowRight size={15} />
                    </button>

                    <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                        style={{
                            backgroundColor: `${accent}16`,
                            border: `1px solid ${accent}28`,
                        }}
                    >
                        <Building2
                            size={15}
                            style={{
                                color: accent,
                            }}
                        />
                    </div>

                    <div className="min-w-0">
                        <h3 className="truncate text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                            {department.name}
                        </h3>

                        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-600">
                            <span className="flex items-center gap-1">
                                <Users size={9} />
                                {department.employees?.length ?? 0} عضو
                            </span>

                            <span className="flex items-center gap-1">
                                <ListChecks size={9} />
                                {departmentTasks.length} تسک فعال
                            </span>
                        </div>
                    </div>
                </div>

                {departments.length > 1 && (
                    <div className="min-w-0 flex-1 max-w-[420px]">
                        <Swiper
                            dir="rtl"
                            slidesPerView="auto"
                            spaceBetween={6}
                            className="!w-full"
                        >
                            {departments
                                .filter(
                                    (departmentItem) =>
                                        String(departmentItem.id) !==
                                        String(id)
                                )
                                .map((departmentItem) => (
                                    <SwiperSlide
                                        key={departmentItem.id}
                                        className="!w-auto"
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.push(
                                                    `/admin/departments/${departmentItem.id}`
                                                )
                                            }
                                            className="whitespace-nowrap rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11.5px] font-bold text-gray-500 transition-all hover:border-gray-300 hover:bg-gray-100 hover:text-gray-800 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
                                        >
                                            {departmentItem.name}
                                        </button>
                                    </SwiperSlide>
                                ))}
                        </Swiper>
                    </div>
                )}
            </div>

            <motion.div
                initial={{
                    opacity: 0,
                    y: 8,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                transition={{
                    duration: 0.22,
                }}
                className="flex flex-col gap-3"
            >
                <EmployeesPanel
                    department={department}
                    onAddEmployee={() =>
                        setAddEmployeeOpen(
                            true
                        )
                    }
                    onDeleteEmployee={(
                        employee
                    ) =>
                        setDeleteTarget({
                            type: "employee",
                            employee,
                        })
                    }
                />

                <div className="relative">
                    <AnimatePresence>
                        {stageRefreshing && (
                            <motion.div
                                initial={{
                                    opacity: 0,
                                }}
                                animate={{
                                    opacity: 1,
                                }}
                                exit={{
                                    opacity: 0,
                                }}
                                className="absolute inset-0 z-10 flex items-center justify-center rounded-[1.5rem] bg-white/70 backdrop-blur-sm dark:bg-black/50"
                            >
                                <Loader
                                    size={19}
                                    className="animate-spin text-indigo-500"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <StagesPanel
                        department={department}
                        tasks={
                            departmentTasks
                        }
                        tasksLoading={
                            tasksLoading
                        }
                        stageColors={
                            stageColors
                        }
                        onAddStage={() =>
                            setAddStageOpen(
                                true
                            )
                        }
                        onEditStage={async (
                            stage,
                            values
                        ) => {
                            await updateStage(
                                id,
                                stage.id,
                                values
                            );

                            setStageRefreshing(
                                true
                            );

                            await fetchAll();

                            setStageRefreshing(
                                false
                            );
                        }}
                        onDeleteStage={(
                            stage
                        ) =>
                            setDeleteTarget({
                                type: "stage",
                                stage,
                            })
                        }
                        onReorder={(
                            stages
                        ) =>
                            useDepartmentStore.setState(
                                (state) => ({
                                    departments:
                                        state.departments.map(
                                            (
                                                departmentItem
                                            ) =>
                                                String(
                                                    departmentItem.id
                                                ) ===
                                                    String(
                                                        id
                                                    )
                                                    ? {
                                                        ...departmentItem,
                                                        stages,
                                                    }
                                                    : departmentItem
                                        ),
                                })
                            )
                        }
                    />
                </div>
            </motion.div>
        </div>
    );
}