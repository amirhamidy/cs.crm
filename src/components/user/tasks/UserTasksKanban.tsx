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
import type { UserTask, UserStage, EmployeeAPIItem, DepartmentAPIItem, DepartmentEmployeeAPIItem } from "./types";
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

const ACCENT_PALETTE = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6", "#f472b6", "#0ea5e9"];

function accentForId(id: number) {
    const safe = Number.isFinite(id) ? Math.abs(Math.trunc(id)) : 0;
    return ACCENT_PALETTE[safe % ACCENT_PALETTE.length];
}

function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        const update = () => setMatches(media.matches);
        update();
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, [query]);
    return matches;
}

function extractDeptId(task: UserTask) {
    const raw = (task as any).department;
    if (raw && typeof raw === "object" && "id" in raw) return Number(raw.id);
    return raw !== undefined && raw !== null && raw !== "" ? Number(raw) : -1;
}

function extractStageDeptId(stage: KanbanStage) {
    const raw = stage.department;
    if (raw && typeof raw === "object" && "id" in raw) return Number(raw.id);
    return raw !== undefined && raw !== null && raw !== "" ? Number(raw) : -1;
}

function extractAssignedEmployeeIds(task: UserTask): number[] {
    const raw = (task as any).assigned_employee;
    if (Array.isArray(raw)) return raw.map((v) => Number(v?.id ?? v));
    if (raw !== undefined && raw !== null) return [Number(raw?.id ?? raw)];
    return [];
}

function groupTasksByStep(tasks: UserTask[]) {
    return tasks.reduce<Record<number, UserTask[]>>((acc, task) => {
        (acc[task.current_step] ??= []).push(task);
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
        axiosInstance.get("/department/api/v1/department/list/")
            .then((res) => setDepartments(unwrapList(res.data)))
            .catch(() => setDepartments([]));

        axiosInstance.get("/accounts/api/v1/employee/list/")
            .then((res) => {
                const map: Record<number, string> = {};
                unwrapList<EmployeeAPIItem>(res.data).forEach((emp) => {
                    map[emp.id] = emp.full_name || emp.username;
                });
                setEmployeesMap(map);
            })
            .catch(() => setEmployeesMap({}));

        axiosInstance.get("/department/api/v1/department_employee/list/")
            .then((res) => setDeptEmployees(unwrapList(res.data)))
            .catch(() => setDeptEmployees([]));
    }, []);

    useEffect(() => {
        axiosInstance.get("/department/api/v1/department_step/")
            .then((res) => {
                const mapped = unwrapList<KanbanStage>(res.data)
                    .map((stage) => ({
                        ...stage,
                        name: stage.name ?? stage.title ?? `مرحله ${stage.id}`,
                        order: stage.order ?? stage.id,
                        department: stage.department ?? null,
                        department_name:
                            stage.department_name ??
                            (typeof stage.department === "object" && stage.department
                                ? stage.department.name ?? null
                                : null),
                    }))
                    .sort((a, b) => a.order - b.order);
                setStages(mapped);
            })
            .catch(() => setError("دریافت فرآیند ها با خطا مواجه شد"))
            .finally(() => setStagesLoading(false));
    }, []);

    useEffect(() => {
        if (employeeLoading) return;
        if (!employee) {
            setTasks([]);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);

        axiosInstance.get("/tasks/api/v1/tasks/")
            .then((res) => {
                if (cancelled) return;
                const data = unwrapList<UserTask>(res.data);
                setTasks(data.filter(
                    (task) =>
                        extractAssignedEmployeeIds(task).includes(employee.id) &&
                        task.status === "in_progress"
                ));
            })
            .catch(() => !cancelled && setError("دریافت تسک‌ها با خطا مواجه شد"))
            .finally(() => !cancelled && setLoading(false));

        return () => {
            cancelled = true;
        };
    }, [employeeLoading, employee]);

    const departmentNameMap = useMemo(() => {
        const map = new Map<number, string>();
        departments.forEach((d) => map.set(d.id, d.name));
        return map;
    }, [departments]);

    const departmentGroups = useMemo<DepartmentGroup[]>(() => {
        const map = new Map<number, DepartmentGroup>();

        const ensure = (id: number, name?: string | null) => {
            if (!map.has(id)) {
                map.set(id, {
                    id,
                    name: departmentNameMap.get(id) || name?.trim() || "بدون دپارتمان",
                    accent: accentForId(id),
                    stages: [],
                    tasks: [],
                });
            }
            return map.get(id)!;
        };

        stages.forEach((stage) => ensure(extractStageDeptId(stage), stage.department_name).stages.push(stage));
        tasks.forEach((task) => ensure(extractDeptId(task), (task as any).department_name).tasks.push(task));

        map.forEach((group) => group.stages.sort((a, b) => a.order - b.order));
        return [...map.values()];
    }, [stages, tasks, departmentNameMap]);

    useEffect(() => {
        if (!departmentGroups.length) return setActiveDeptId(null);
        if (activeDeptId === null || !departmentGroups.some((g) => g.id === activeDeptId)) {
            setActiveDeptId(departmentGroups[0].id);
        }
    }, [departmentGroups, activeDeptId]);

    const activeGroup = departmentGroups.find((g) => g.id === activeDeptId) ?? null;
    const grouped = useMemo(() => groupTasksByStep(activeGroup?.tasks ?? []), [activeGroup]);

    const activeDeptMembers = useMemo(
        () => activeDeptId === null ? [] : deptEmployees.filter((item) => item.department === activeDeptId),
        [deptEmployees, activeDeptId]
    );

    useEffect(() => {
        const available = activeGroup?.stages ?? [];
        if (!available.length) return setActiveMobileStageId(null);
        if (activeMobileStageId === null || !available.some((s) => s.id === activeMobileStageId)) {
            setActiveMobileStageId(available[0].id);
        }
    }, [activeGroup, activeMobileStageId]);

    function handleUpdated(updated: UserTask) {
        if (updated.status !== "in_progress") {
            setTasks((prev) => prev.filter((t) => t.id !== updated.id));
            return;
        }
        setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    }

    if (loading || stagesLoading || employeeLoading) {
        return <div className="flex h-64 items-center justify-center"><Loader size={22} className="animate-spin text-indigo-500" /></div>;
    }

    if (error) {
        return <div className="flex h-64 items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/5 text-sm font-semibold text-red-500">{error}</div>;
    }

    if (!tasks.length) {
        return <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.07]"><Kanban size={28} className="text-gray-300 dark:text-gray-700" /><p className="text-[12px] text-gray-400">تسک در حال انجامی وجود ندارد</p></div>;
    }

    const activeStages = activeGroup?.stages ?? [];
    const mobileStage = activeStages.find((s) => s.id === activeMobileStageId) ?? activeStages[0];
    const mobileStageIndex = mobileStage ? activeStages.findIndex((s) => s.id === mobileStage.id) : 0;

    return (
        <div className="flex flex-col gap-4" dir="rtl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/10"><Kanban size={17} className="text-indigo-500" /></div>
                    <div>
                        <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">تسک‌های من</h3>
                        <p className="text-[11px] text-gray-400">{departmentGroups.length} دپارتمان</p>
                    </div>
                </div>
                <span className="rounded-2xl bg-gray-100 px-3 py-1.5 text-[11px] font-bold text-gray-600 dark:bg-white/[0.06] dark:text-gray-400">{activeGroup?.tasks.length ?? 0} تسک</span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                {departmentGroups.map((group) => {
                    const active = group.id === activeDeptId;
                    return (
                        <button key={group.id} type="button" onClick={() => setActiveDeptId(group.id)} className="flex shrink-0 items-center gap-2 rounded-2xl border px-3.5 py-2 text-[11.5px] font-bold" style={{ background: active ? group.accent : `${group.accent}0f`, borderColor: active ? group.accent : `${group.accent}30`, color: active ? "#fff" : group.accent }}>
                            <Building2 size={12} />{group.name}<span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: active ? "rgba(255,255,255,.25)" : `${group.accent}18` }}>{group.tasks.length}</span>
                        </button>
                    );
                })}
            </div>

            {activeDeptMembers.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-black/[0.04] bg-gray-50/70 px-3 py-2 dark:border-white/[0.05] dark:bg-white/[0.025]">
                    <span className="text-[10px] font-extrabold text-gray-400">همکاران این دپارتمان:</span>
                    {activeDeptMembers.map((member) => (
                        <div key={member.id} className="flex items-center gap-1.5 rounded-full bg-white px-2 py-1 shadow-sm dark:bg-white/[0.05]">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ background: accentForId(member.employee) }}><UserRound size={10} /></span>
                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{employeesMap[member.employee] ?? member.employee_name}</span>
                        </div>
                    ))}
                </div>
            )}

            {activeGroup && activeStages.length > 0 && (
                isMobile ? (
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {activeStages.map((stage, index) => {
                                const active = stage.id === mobileStage?.id;
                                const color = accentForId(stage.id);
                                return (
                                    <button key={stage.id} type="button" onClick={() => setActiveMobileStageId(stage.id)} className="flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-[11px] font-bold" style={{ color: active ? color : "#94a3b8", background: active ? `${color}14` : undefined, borderColor: active ? `${color}45` : "rgba(148,163,184,.25)" }}>
                                        <span className="flex h-5 w-5 items-center justify-center rounded-lg text-[9px] text-white" style={{ background: color }}>{index + 1}</span>
                                        {stage.name}<span>{grouped[stage.id]?.length ?? 0}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {mobileStage && (
                            <AnimatePresence mode="wait">
                                <motion.div key={mobileStage.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    <StageColumn stage={mobileStage} tasks={grouped[mobileStage.id] ?? []} accent={accentForId(mobileStage.id)} index={mobileStageIndex} isLast={mobileStageIndex === activeStages.length - 1} onUpdated={handleUpdated} employeesMap={employeesMap} />
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                ) : (
                    <Swiper modules={[FreeMode]} freeMode slidesPerView="auto" spaceBetween={14} className="!w-full !overflow-hidden">
                        {activeStages.map((stage, index) => (
                            <SwiperSlide key={stage.id} className="!w-[320px] !overflow-visible">
                                <StageColumn stage={stage} tasks={grouped[stage.id] ?? []} accent={accentForId(stage.id)} index={index} isLast={index === activeStages.length - 1} onUpdated={handleUpdated} employeesMap={employeesMap} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                )
            )}
        </div>
    );
}

function StageColumn({ stage, tasks, accent, index, isLast, onUpdated, employeesMap }: { stage: KanbanStage; tasks: UserTask[]; accent: string; index: number; isLast: boolean; onUpdated: (task: UserTask) => void; employeesMap: Record<number, string> }) {
    return (
        <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="relative flex min-w-0 flex-col rounded-[1.45rem] border bg-white shadow-[0_5px_20px_rgba(15,23,42,.03)] dark:bg-white/[.025]" style={{ borderColor: `${accent}28` }}>
            {!isLast && <div className="pointer-events-none absolute top-7 z-20 flex h-5 w-5 items-center justify-center rounded-full border bg-white shadow-sm dark:bg-[#0f172a]" style={{ insetInlineEnd: -10, borderColor: `${accent}35`, color: accent }}><ChevronLeft size={10} /></div>}
            <div className="px-3 py-2.5">
                <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-extrabold text-white" style={{ background: accent }}>{index + 1}</span>
                        <h4 className="text-[12.5px] font-extrabold text-gray-800 dark:text-gray-100">{stage.name}</h4>
                    </div>
                    <span className="rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold" style={{ background: `${accent}18`, color: accent }}>{tasks.length}</span>
                </div>
            </div>
            <div className="h-px" style={{ background: `${accent}18` }} />
            {tasks.length ? (
                <TaskCardSwiper tasks={tasks} accent={accent} isLastStage={isLast} onUpdated={onUpdated} employeesMap={employeesMap} />
            ) : (
                <div className="flex h-28 flex-col items-center justify-center gap-1.5 text-center"><Plus size={16} className="text-gray-300" /><p className="text-[11px] text-gray-400">وظیفه‌ای در این مرحله نیست</p></div>
            )}
        </motion.div>
    );
}