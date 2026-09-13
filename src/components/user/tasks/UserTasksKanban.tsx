"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Kanban, Loader, Building2, Plus, ChevronLeft, UserRound } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import axiosInstance from "@/lib/axiosInstance";
import TaskCardSwiper from "./TaskCardSwiper";
import type {
    UserTask,
    UserStage,
    EmployeeAPIItem,
    DepartmentAPIItem,
    DepartmentEmployeeAPIItem,
} from "./types";
import { useCurrentEmployee } from "@/hooks/usecurrentemployee";

interface DepartmentGroup {
    id: number;
    name: string;
    accent: string;
    stages: KanbanStage[];
    tasks: UserTask[];
}

type KanbanStage = UserStage & {
    title?: string;
    department?: number | string | { id: number; name?: string } | null;
    department_name?: string | null;
};

const ACCENT_PALETTE = [
    "#6366f1",
    "#ec4899",
    "#10b981",
    "#f59e0b",
    "#3b82f6",
    "#8b5cf6",
    "#ef4444",
    "#14b8a6",
    "#f472b6",
    "#0ea5e9",
];

function accentForId(id: number): string {
    const safeId = Number.isFinite(id) ? Math.abs(Math.trunc(id)) : 0;
    return ACCENT_PALETTE[safeId % ACCENT_PALETTE.length];
}

function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);

        const updateMatches = () => {
            setMatches(media.matches);
        };

        updateMatches();
        media.addEventListener("change", updateMatches);

        return () => {
            media.removeEventListener("change", updateMatches);
        };
    }, [query]);

    return matches;
}

function extractDeptId(task: UserTask): number {
    const raw = (task as any).department;

    if (raw && typeof raw === "object" && "id" in raw) {
        return Number(raw.id);
    }

    if (raw !== undefined && raw !== null && raw !== "") {
        return Number(raw);
    }

    return -1;
}

function extractStageDeptId(stage: KanbanStage): number {
    const raw = stage.department;

    if (raw && typeof raw === "object" && "id" in raw) {
        return Number(raw.id);
    }

    if (raw !== undefined && raw !== null && raw !== "") {
        return Number(raw);
    }

    return -1;
}

function extractAssignedEmployeeIds(task: UserTask): number[] {
    const raw = (task as any).assigned_employee;

    if (Array.isArray(raw)) {
        return raw.map((value) => Number(value?.id ?? value));
    }

    if (raw !== undefined && raw !== null) {
        return [Number((raw as any)?.id ?? raw)];
    }

    return [];
}

function groupTasksByStep(tasks: UserTask[]): Record<number, UserTask[]> {
    return tasks.reduce<Record<number, UserTask[]>>((acc, task) => {
        const key = task.current_step;

        if (!acc[key]) {
            acc[key] = [];
        }

        acc[key].push(task);

        return acc;
    }, {});
}

function unwrapList<T>(data: T[] | { results: T[] }): T[] {
    return Array.isArray(data) ? data : data.results ?? [];
}

export default function UserTasksKanban() {
    const { employee, loading: employeeLoading } = useCurrentEmployee();

    const [tasks, setTasks] = useState<UserTask[]>([]);
    const [stages, setStages] = useState<KanbanStage[]>([]);
    const [departments, setDepartments] = useState<DepartmentAPIItem[]>([]);
    const [deptEmployees, setDeptEmployees] = useState<DepartmentEmployeeAPIItem[]>([]);
    const [employeesMap, setEmployeesMap] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [stagesLoading, setStagesLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeDeptId, setActiveDeptId] = useState<number | null>(null);
    const [activeMobileStageId, setActiveMobileStageId] = useState<number | null>(null);

    const isMobile = useMediaQuery("(max-width: 767px)");

    useEffect(() => {
        axiosInstance
            .get<DepartmentAPIItem[] | { results: DepartmentAPIItem[] }>(
                "/department/api/v1/department/list/"
            )
            .then((res) => setDepartments(unwrapList(res.data)))
            .catch(() => setDepartments([]));
    }, []);

    useEffect(() => {
        axiosInstance
            .get<EmployeeAPIItem[] | { results: EmployeeAPIItem[] }>(
                "/accounts/api/v1/employee/list/"
            )
            .then((res) => {
                const raw = unwrapList(res.data);
                const map: Record<number, string> = {};
                raw.forEach((emp) => {
                    map[emp.id] = emp.full_name || emp.username;
                });
                setEmployeesMap(map);
            })
            .catch(() => setEmployeesMap({}));
    }, []);

    useEffect(() => {
        axiosInstance
            .get<DepartmentEmployeeAPIItem[] | { results: DepartmentEmployeeAPIItem[] }>(
                "/department/api/v1/department_employee/list/"
            )
            .then((res) => setDeptEmployees(unwrapList(res.data)))
            .catch(() => setDeptEmployees([]));
    }, []);

    useEffect(() => {
        axiosInstance
            .get<{ results: KanbanStage[] } | KanbanStage[]>(
                "/department/api/v1/department_step/"
            )
            .then((res) => {
                const raw = unwrapList(res.data);

                const mapped: KanbanStage[] = raw
                    .map((stage) => ({
                        ...stage,
                        id: stage.id,
                        name: stage.name ?? stage.title ?? `مرحله ${stage.id}`,
                        order: stage.order ?? stage.id,
                        department: stage.department ?? null,
                        department_name:
                            stage.department_name ??
                            (typeof stage.department === "object" && stage.department
                                ? (stage.department as { name?: string }).name ?? null
                                : null),
                    }))
                    .sort((a, b) => a.order - b.order);

                setStages(mapped);
            })
            .catch(() => setError("دریافت فرآیند ها با خطا مواجه شد"))
            .finally(() => setStagesLoading(false));
    }, []);

    useEffect(() => {
        if (employeeLoading) {
            return;
        }

        if (!employee) {
            setTasks([]);
            setLoading(false);
            return;
        }

        let cancelled = false;

        setLoading(true);

        axiosInstance
            .get<UserTask[] | { results: UserTask[] }>("/tasks/api/v1/tasks/")
            .then((res) => {
                if (cancelled) {
                    return;
                }

                const data = unwrapList(res.data);

                const myActiveTasks = data.filter(
                    (task) =>
                        extractAssignedEmployeeIds(task).includes(employee.id) &&
                        task.status === "in_progress"
                );

                setTasks(myActiveTasks);
            })
            .catch(() => {
                if (!cancelled) {
                    setError("دریافت تسک‌ها با خطا مواجه شد");
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [employeeLoading, employee]);

    const departmentNameMap = useMemo(() => {
        const map = new Map<number, string>();
        departments.forEach((dept) => map.set(dept.id, dept.name));
        return map;
    }, [departments]);

    const departmentGroups = useMemo<DepartmentGroup[]>(() => {
        const map = new Map<number, DepartmentGroup>();

        const ensureGroup = (deptId: number, fallbackName?: string | null) => {
            if (!map.has(deptId)) {
                map.set(deptId, {
                    id: deptId,
                    name:
                        departmentNameMap.get(deptId) ||
                        (fallbackName && fallbackName.trim()) ||
                        "بدون دپارتمان",
                    accent: accentForId(deptId),
                    stages: [],
                    tasks: [],
                });
            }

            return map.get(deptId)!;
        };

        stages.forEach((stage) => {
            const deptId = extractStageDeptId(stage);
            ensureGroup(deptId, stage.department_name).stages.push(stage);
        });

        tasks.forEach((task) => {
            const deptId = extractDeptId(task);
            ensureGroup(deptId, (task as any).department_name).tasks.push(task);
        });

        map.forEach((group) => {
            group.stages.sort((a, b) => a.order - b.order);
        });

        return Array.from(map.values());
    }, [stages, tasks, departmentNameMap]);

    useEffect(() => {
        if (departmentGroups.length === 0) {
            setActiveDeptId(null);
            return;
        }

        if (
            activeDeptId === null ||
            !departmentGroups.some((group) => group.id === activeDeptId)
        ) {
            setActiveDeptId(departmentGroups[0].id);
        }
    }, [departmentGroups, activeDeptId]);

    const activeGroup =
        departmentGroups.find((group) => group.id === activeDeptId) ?? null;

    const grouped = useMemo(
        () => groupTasksByStep(activeGroup?.tasks ?? []),
        [activeGroup]
    );

    const activeDeptMembers = useMemo(() => {
        if (activeDeptId === null) {
            return [];
        }

        return deptEmployees.filter((item) => item.department === activeDeptId);
    }, [deptEmployees, activeDeptId]);

    useEffect(() => {
        const availableStages = activeGroup?.stages ?? [];

        if (availableStages.length === 0) {
            setActiveMobileStageId(null);
            return;
        }

        if (
            activeMobileStageId === null ||
            !availableStages.some((stage) => stage.id === activeMobileStageId)
        ) {
            setActiveMobileStageId(availableStages[0].id);
        }
    }, [activeGroup, activeMobileStageId]);

    function handleUpdated(updated: UserTask) {
        if (updated.status !== "in_progress") {
            setTasks((prev) => prev.filter((task) => task.id !== updated.id));
            return;
        }

        setTasks((prev) =>
            prev.map((task) => (task.id === updated.id ? updated : task))
        );
    }

    if (loading || stagesLoading || employeeLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader size={22} className="animate-spin text-indigo-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-red-500/20 bg-red-500/5">
                <p className="text-sm font-semibold text-red-500">{error}</p>
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.07]">
                <Kanban size={28} className="text-gray-300 dark:text-gray-700" />
                <p className="text-[12px] text-gray-400">تسک در حال انجامی وجود ندارد</p>
            </div>
        );
    }

    const activeStages = activeGroup?.stages ?? [];

    const mobileStage =
        activeStages.find((stage) => stage.id === activeMobileStageId) ??
        activeStages[0];

    const mobileStageIndex = mobileStage
        ? activeStages.findIndex((stage) => stage.id === mobileStage.id)
        : 0;

    const mobileStageTasks = mobileStage ? grouped[mobileStage.id] ?? [] : [];

    return (
        <div className="flex flex-col gap-5" dir="rtl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div
                        className="flex h-9 w-9 items-center justify-center rounded-2xl"
                        style={{ background: "rgba(99,102,241,0.12)" }}
                    >
                        <Kanban size={17} className="text-indigo-500" />
                    </div>

                    <div>
                        <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                            تسک‌های من
                        </h3>

                        <p className="text-[11px] text-gray-400 dark:text-gray-600">
                            {departmentGroups.length} دپارتمان
                        </p>
                    </div>
                </div>

                <span className="rounded-2xl bg-gray-100 px-3 py-1.5 text-[11px] font-bold text-gray-600 dark:bg-white/[0.06] dark:text-gray-400">
                    {(activeGroup?.tasks ?? []).length} تسک
                </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                {departmentGroups.map((group) => {
                    const isActive = group.id === activeDeptId;

                    return (
                        <button
                            key={group.id}
                            type="button"
                            onClick={() => setActiveDeptId(group.id)}
                            className="flex shrink-0 items-center gap-2 rounded-2xl border px-3.5 py-2 text-[11.5px] font-bold transition-all"
                            style={{
                                background: isActive ? group.accent : `${group.accent}0f`,
                                borderColor: isActive ? group.accent : `${group.accent}30`,
                                color: isActive ? "#ffffff" : group.accent,
                            }}
                        >
                            <Building2 size={12} />

                            {group.name}

                            <span
                                className="rounded-full px-1.5 py-0.5 text-[10px] font-extrabold"
                                style={{
                                    background: isActive
                                        ? "rgba(255,255,255,0.25)"
                                        : `${group.accent}18`,
                                }}
                            >
                                {group.tasks.length}
                            </span>
                        </button>
                    );
                })}
            </div>

            {activeDeptMembers.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                    {activeDeptMembers.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center gap-1.5 rounded-full border border-black/[0.05] bg-black/[0.02] py-0.5 pl-2.5 pr-0.5 dark:border-white/[0.06] dark:bg-white/[0.04]"
                        >
                            <span
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                                style={{
                                    background: `linear-gradient(135deg, ${accentForId(
                                        member.employee
                                    )}, ${accentForId(member.employee + 1)})`,
                                }}
                            >
                                <UserRound size={11} />
                            </span>
                            <span className="text-[10.5px] font-bold text-gray-600 dark:text-gray-300">
                                {employeesMap[member.employee] ?? member.employee_name}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {activeGroup && activeStages.length === 0 && (
                <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-[1.6rem] border border-dashed border-gray-200 dark:border-white/[0.07]">
                    <Plus size={16} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-[11px] font-medium text-gray-400">
                        فرآیندی برای این دپارتمان تعریف نشده است
                    </p>
                </div>
            )}

            {activeGroup &&
                activeStages.length > 0 &&
                (isMobile ? (
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {activeStages.map((stage, index) => {
                                const isActive = stage.id === mobileStage?.id;
                                const color = accentForId(stage.id);
                                const count = grouped[stage.id]?.length ?? 0;

                                return (
                                    <button
                                        key={stage.id}
                                        type="button"
                                        onClick={() => setActiveMobileStageId(stage.id)}
                                        className="flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-[11px] font-bold transition-all"
                                        style={{
                                            color: isActive ? color : "#94a3b8",
                                            backgroundColor: isActive ? `${color}14` : undefined,
                                            borderColor: isActive ? `${color}45` : "rgba(148,163,184,0.25)",
                                        }}
                                    >
                                        <span
                                            className="flex h-5 w-5 items-center justify-center rounded-lg text-[9px] font-extrabold text-white"
                                            style={{ backgroundColor: color }}
                                        >
                                            {index + 1}
                                        </span>

                                        <span>{stage.name}</span>

                                        <span
                                            className="rounded-full px-1.5 py-0.5 text-[9px] font-extrabold"
                                            style={{
                                                backgroundColor: `${color}18`,
                                                color,
                                            }}
                                        >
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {mobileStage && (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={mobileStage.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <StageColumn
                                        stage={mobileStage}
                                        tasks={mobileStageTasks}
                                        accent={accentForId(mobileStage.id)}
                                        index={mobileStageIndex}
                                        isLast
                                        onUpdated={handleUpdated}
                                        employeesMap={employeesMap}
                                    />
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                ) : (
                    <Swiper
                        modules={[FreeMode]}
                        freeMode
                        slidesPerView="auto"
                        spaceBetween={14}
                        className="!w-full !overflow-hidden !px-0.5"
                    >
                        {activeStages.map((stage, index) => (
                            <SwiperSlide key={stage.id} className="!w-[320px] shrink-0 !overflow-visible">
                                <StageColumn
                                    stage={stage}
                                    tasks={grouped[stage.id] ?? []}
                                    accent={accentForId(stage.id)}
                                    index={index}
                                    isLast={index === activeStages.length - 1}
                                    onUpdated={handleUpdated}
                                    employeesMap={employeesMap}
                                />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                ))}
        </div>
    );
}

function StageColumn({
    stage,
    tasks,
    accent,
    index,
    isLast,
    onUpdated,
    employeesMap,
}: {
    stage: KanbanStage;
    tasks: UserTask[];
    accent: string;
    index: number;
    isLast: boolean;
    onUpdated: (task: UserTask) => void;
    employeesMap: Record<number, string>;
}) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: index * 0.04 }}
            className="relative flex min-w-0 flex-col rounded-[1.45rem] border bg-white shadow-[0_6px_22px_rgba(15,23,42,0.03)] dark:bg-white/[0.025] dark:shadow-none"
            style={{ borderColor: `${accent}28` }}
        >
            {!isLast && (
                <div
                    className="pointer-events-none absolute top-[28px] z-20 flex h-5 w-5 items-center justify-center rounded-full border bg-white shadow-sm dark:bg-[#0f172a]"
                    style={{
                        insetInlineEnd: "-10px",
                        borderColor: `${accent}35`,
                        color: accent,
                    }}
                >
                    <ChevronLeft size={10} strokeWidth={2.5} />
                </div>
            )}

            <div className="relative px-3 py-2.5">
                <div className="flex items-center justify-between gap-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                        <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold text-white shadow-sm"
                            style={{ backgroundColor: accent }}
                        >
                            {index + 1}
                        </span>

                        <div className="min-w-0">
                            <h4 className="truncate text-[12.5px] font-extrabold text-gray-800 dark:text-gray-100">
                                {stage.name}
                            </h4>
                        </div>
                    </div>

                    <span
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold tabular-nums"
                        style={{
                            backgroundColor: `${accent}18`,
                            color: accent,
                        }}
                    >
                        {tasks.length}
                    </span>
                </div>
            </div>

            <div className="h-px" style={{ background: `${accent}18` }} />

            {tasks.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center gap-1.5 px-4 text-center">
                    <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{ background: `${accent}0f` }}
                    >
                        <Plus size={11} style={{ color: `${accent}90` }} />
                    </div>

                    <p className="text-[11px] font-medium text-gray-400">
                        وظیفه‌ای در این مرحله نیست
                    </p>
                </div>
            ) : (
                <TaskCardSwiper
                    tasks={tasks}
                    accent={accent}
                    onUpdated={onUpdated}
                    employeesMap={employeesMap}
                />
            )}
        </motion.div>
    );
}