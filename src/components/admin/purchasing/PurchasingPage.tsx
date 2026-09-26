"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";
import {
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    LayoutDashboard,
    ListOrdered,
    Paperclip,
    Plus,
    RefreshCw,
    ShieldCheck,
    ShoppingCart,
    UserCheck,
    Users,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { toPersianDigits } from "@/lib/jalali";
import type { ApiPurchasingEmployee, ApiPurchasingStep, ApiPurchasingTask, ApiTaskAttachment } from "@/types/purchasing";
import PurchasingEmployeeCard from "./PurchasingEmployeeCard";
import PurchasingEmployeeModal from "./PurchasingEmployeeModal";
import StepCard from "./StepCard";
import StepModal from "./StepModal";
import TaskCard from "./TaskCard";
import PurchasingOverview from "./PurchasingOverview";
import TaskAttachmentsPanel from "./TaskAttachmentsPanel";
import { usePurchasingAccess } from "@/hooks/usePurchasingAccess";

type Tab = "overview" | "tasks" | "attachments" | "steps" | "employees";

const normalizeList = <T,>(value: unknown): T[] => {
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === "object" && "results" in value && Array.isArray((value as { results?: unknown }).results)) {
        return (value as { results: T[] }).results;
    }
    return [];
};

function SectionHeader({
    icon: Icon,
    title,
    count,
    action,
}: {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    title: string;
    count: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-300">
                    <Icon size={17} />
                </div>
                <div>
                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">{title}</h3>
                    <p className="text-[11px] font-medium text-gray-400">{count}</p>
                </div>
            </div>
            {action}
        </div>
    );
}

function EmptyState({
    icon: Icon,
    title,
    hint,
}: {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    title: string;
    hint: string;
}) {
    return (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.07]">
            <Icon size={28} className="text-gray-300 dark:text-gray-700" />
            <div className="text-center">
                <p className="text-[12px] font-bold text-gray-500 dark:text-gray-400">{title}</p>
                <p className="mt-1 text-[11px] font-medium text-gray-400">{hint}</p>
            </div>
        </div>
    );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-2xl px-3 text-[10.5px] font-extrabold transition active:scale-95"
            style={{ background: "rgba(99,102,241,0.10)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.18)" }}
        >
            <Plus size={13} strokeWidth={2.7} />
            {label}
        </button>
    );
}

/** Horizontal stage-style presentation of purchasing steps: mobile tabs + single card, desktop free swiper */
function StepsShowcase({
    steps,
    onEdit,
    onDeleted,
}: {
    steps: ApiPurchasingStep[];
    onEdit: (step: ApiPurchasingStep) => void;
    onDeleted: () => void;
}) {
    const [activeId, setActiveId] = useState<number | null>(steps[0]?.id ?? null);

    useEffect(() => {
        if (!steps.length) {
            setActiveId(null);
            return;
        }
        if (!steps.some((step) => step.id === activeId)) {
            setActiveId(steps[0].id);
        }
    }, [steps, activeId]);

    const activeIndex = steps.findIndex((step) => step.id === activeId);
    const activeStep = activeIndex >= 0 ? steps[activeIndex] : steps[0];

    return (
        <div className="flex flex-col gap-3.5">
            <div className="md:hidden">
                <div className="scrollbar-none flex w-full gap-1.5 overflow-x-auto pb-1">
                    {steps.map((step, index) => {
                        const isActive = step.id === activeId;
                        const color = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#14b8a6"][index % 8];
                        return (
                            <button
                                key={step.id}
                                type="button"
                                onClick={() => setActiveId(step.id)}
                                className={`flex min-w-[128px] shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-right transition-all ${isActive ? "shadow-sm" : "border-gray-200/70 bg-white/60 dark:border-white/[0.07] dark:bg-white/[0.03]"
                                    }`}
                                style={isActive ? { borderColor: `${color}35`, backgroundColor: `${color}10` } : undefined}
                            >
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[9px] font-extrabold text-white" style={{ backgroundColor: color }}>
                                    {step.order}
                                </span>
                                <span className={`min-w-0 truncate text-[10px] font-extrabold ${isActive ? "text-gray-800 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}`}>
                                    {step.title}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-2">
                    <AnimatePresence mode="wait" initial={false}>
                        {activeStep && (
                            <motion.div key={activeStep.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.18 }}>
                                <StepCard step={activeStep} index={Math.max(activeIndex, 0)} onEdit={() => onEdit(activeStep)} onDeleted={onDeleted} isLast />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="hidden md:block">
                <Swiper modules={[FreeMode]} freeMode slidesPerView="auto" spaceBetween={14} className="!w-full !overflow-hidden !px-0.5">
                    {steps.map((step, index) => (
                        <SwiperSlide key={step.id} className="!w-[290px] shrink-0 !overflow-visible">
                            <StepCard step={step} index={index} onEdit={() => onEdit(step)} onDeleted={onDeleted} isLast={index === steps.length - 1} />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
}

/** Task carousel matching the department TaskSwiper pattern */
function TasksShowcase({
    tasks,
    steps,
    attachments,
    onUpdated,
}: {
    tasks: ApiPurchasingTask[];
    steps: ApiPurchasingStep[];
    attachments: ApiTaskAttachment[];
    onUpdated: () => void;
}) {
    const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

    const slidesPerView = useMemo(() => {
        if (typeof window === "undefined") return 1;
        if (window.innerWidth >= 1536) return 3;
        if (window.innerWidth >= 1024) return 2;
        return 1;
    }, []);

    return (
        <div className="relative">
            <Swiper
                modules={[Pagination]}
                slidesPerView={slidesPerView}
                spaceBetween={12}
                onSwiper={setSwiperInstance}
                className="!pb-9 [&_.swiper-pagination]:!static [&_.swiper-pagination-bullet]:!h-1.5 [&_.swiper-pagination-bullet]:!w-1.5 [&_.swiper-pagination-bullet]:!rounded-full [&_.swiper-pagination-bullet]:!bg-indigo-400/40 [&_.swiper-pagination-bullet-active]:!bg-indigo-500"
                pagination={{ clickable: true }}
            >
                {tasks.map((task, index) => (
                    <SwiperSlide key={task.id}>
                        <TaskCard
                            task={task}
                            index={index}
                            steps={steps}
                            attachments={attachments.filter((attachment) => attachment.task === task.id)}
                            onUpdated={onUpdated}
                        />
                    </SwiperSlide>
                ))}
            </Swiper>

            {tasks.length > slidesPerView && swiperInstance && (
                <>
                    <button
                        type="button"
                        onClick={() => swiperInstance.slidePrev()}
                        className="absolute right-0 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-100 text-gray-500 transition hover:text-indigo-500 dark:bg-[#1e293b] dark:ring-white/[0.08]"
                    >
                        <ChevronRight size={15} />
                    </button>
                    <button
                        type="button"
                        onClick={() => swiperInstance.slideNext()}
                        className="absolute left-0 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-100 text-gray-500 transition hover:text-indigo-500 dark:bg-[#1e293b] dark:ring-white/[0.08]"
                    >
                        <ChevronLeft size={15} />
                    </button>
                </>
            )}
        </div>
    );
}

export default function PurchasingPage() {
    const { isAdmin, currentEmployeeName } = usePurchasingAccess();

    const [employees, setEmployees] = useState<ApiPurchasingEmployee[]>([]);
    const [steps, setSteps] = useState<ApiPurchasingStep[]>([]);
    const [tasks, setTasks] = useState<ApiPurchasingTask[]>([]);
    const [attachments, setAttachments] = useState<ApiTaskAttachment[]>([]);

    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
    const [stepModalOpen, setStepModalOpen] = useState(false);
    const [editingStep, setEditingStep] = useState<ApiPurchasingStep | null>(null);

    const loadAll = useCallback(async (silent = false) => {
        try {
            if (silent) setRefreshing(true);
            else setLoading(true);

            const [employeesResponse, stepsResponse, tasksResponse, attachmentsResponse] = await Promise.all([
                axiosInstance.get("/purchasing/api/v1/employees/"),
                axiosInstance.get("/purchasing/api/v1/steps/"),
                axiosInstance.get("/purchasing/api/v1/tasks/"),
                axiosInstance.get("/purchasing/api/v1/task-attachments/"),
            ]);

            setEmployees(normalizeList<ApiPurchasingEmployee>(employeesResponse.data));
            setSteps(normalizeList<ApiPurchasingStep>(stepsResponse.data).sort((a, b) => a.order - b.order));
            setTasks(normalizeList<ApiPurchasingTask>(tasksResponse.data));
            setAttachments(normalizeList<ApiTaskAttachment>(attachmentsResponse.data));
        } catch (error) {
            console.error("Purchasing data loading failed:", error);
            setEmployees([]);
            setSteps([]);
            setTasks([]);
            setAttachments([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const handleStepEdit = (step: ApiPurchasingStep) => {
        setEditingStep(step);
        setStepModalOpen(true);
    };

    const handleStepModalClose = () => {
        setStepModalOpen(false);
        setEditingStep(null);
    };

    const safeEmployees = employees ?? [];
    const safeSteps = steps ?? [];
    const safeTasks = tasks ?? [];
    const safeAttachments = attachments ?? [];

    const tabs = [
        { id: "overview" as const, label: "نمای کلی", icon: LayoutDashboard, count: null },
        { id: "tasks" as const, label: "تسک‌ها", icon: ClipboardList, count: safeTasks.length },
        { id: "attachments" as const, label: "پیوست‌ها", icon: Paperclip, count: safeAttachments.length },
        { id: "steps" as const, label: "مراحل", icon: ListOrdered, count: safeSteps.length },
        { id: "employees" as const, label: "کارمندان", icon: Users, count: safeEmployees.length },
    ];

    return (
        <div dir="rtl" className="flex flex-col gap-4">
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative flex flex-col gap-3.5 overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-4 shadow-[0_10px_34px_rgba(15,23,42,0.05)] dark:border-white/[0.07] dark:bg-[#0A1930]"
            >
                <div className="absolute inset-y-0 right-0 w-1" style={{ background: "linear-gradient(180deg,#6366f1,#8b5cf6 60%,#6366f145)" }} />

                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
                            <ShoppingCart size={19} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="truncate text-[15px] font-extrabold text-gray-900 dark:text-white">مدیریت خرید</h1>
                            <p className="mt-0.5 truncate text-[11px] font-medium text-gray-400">مدیریت مراحل، کارمندان و فرآیندهای خرید</p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <div
                            className={`hidden items-center gap-1.5 rounded-2xl px-3 py-2 text-[10.5px] font-extrabold sm:flex ${isAdmin ? "bg-amber-500/10 text-amber-500" : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                                }`}
                        >
                            {isAdmin ? <ShieldCheck size={12} /> : <UserCheck size={12} />}
                            <span>
                                {isAdmin ? "ادمین" : "کارمند"}
                                {currentEmployeeName ? ` · ${currentEmployeeName}` : ""}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => loadAll(true)}
                            disabled={loading || refreshing}
                            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                        >
                            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                <Swiper modules={[FreeMode]} freeMode slidesPerView="auto" spaceBetween={8} className="!w-full !overflow-hidden">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <SwiperSlide key={tab.id} className="!w-auto">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex shrink-0 items-center gap-2 rounded-2xl border px-3.5 py-2 text-[11.5px] font-bold transition-colors ${active ? "border-transparent text-white" : "border-indigo-500/15 bg-indigo-500/[0.05] text-indigo-600 hover:bg-indigo-500/10 dark:text-indigo-300"
                                        }`}
                                >
                                    {active && (
                                        <motion.span
                                            layoutId="purchasing-tab"
                                            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 shadow-md shadow-indigo-500/25"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <Icon size={12} className="relative z-10" />
                                    <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
                                    {tab.count !== null && <span className="relative z-10 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">{toPersianDigits(tab.count)}</span>}
                                </button>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            </motion.div>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="h-40 animate-pulse rounded-[1.8rem] border border-gray-100 bg-gray-50 dark:border-white/[0.07] dark:bg-white/[0.03]" />
                        ))}
                    </motion.div>
                ) : (
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                        {activeTab === "overview" && <PurchasingOverview employees={safeEmployees} steps={safeSteps} tasks={safeTasks} attachments={safeAttachments} />}

                        {activeTab === "tasks" && (
                            <div className="flex flex-col gap-4">
                                <SectionHeader icon={ClipboardList} title="تسک‌های خرید" count={`${toPersianDigits(safeTasks.length)} تسک`} />

                                {safeTasks.length === 0 ? (
                                    <EmptyState icon={ClipboardList} title="تسکی وجود ندارد" hint="در حال حاضر هیچ تسک خریدی ثبت نشده است" />
                                ) : (
                                    <TasksShowcase tasks={safeTasks} steps={safeSteps} attachments={safeAttachments} onUpdated={() => loadAll(true)} />
                                )}
                            </div>
                        )}

                        {activeTab === "attachments" && <TaskAttachmentsPanel attachments={safeAttachments} />}

                        {activeTab === "steps" && (
                            <div className="flex flex-col gap-4">
                                <SectionHeader
                                    icon={ListOrdered}
                                    title="مراحل خرید"
                                    count={`${toPersianDigits(safeSteps.length)} مرحله`}
                                    action={
                                        <AddButton
                                            label="مرحله جدید"
                                            onClick={() => {
                                                setEditingStep(null);
                                                setStepModalOpen(true);
                                            }}
                                        />
                                    }
                                />

                                {safeSteps.length === 0 ? (
                                    <EmptyState icon={ListOrdered} title="مرحله‌ای وجود ندارد" hint="اولین مرحله فرآیند خرید را ایجاد کنید" />
                                ) : (
                                    <StepsShowcase steps={safeSteps} onEdit={handleStepEdit} onDeleted={() => loadAll(true)} />
                                )}
                            </div>
                        )}

                        {activeTab === "employees" && (
                            <div className="flex flex-col gap-4">
                                <SectionHeader
                                    icon={Users}
                                    title="کارمندان خرید"
                                    count={`${toPersianDigits(safeEmployees.length)} کارمند`}
                                    action={isAdmin ? <AddButton label="افزودن کارمند" onClick={() => setEmployeeModalOpen(true)} /> : undefined}
                                />

                                {safeEmployees.length === 0 ? (
                                    <EmptyState icon={Users} title="کارمندی اضافه نشده است" hint="برای فرآیند خرید کارمند اضافه کنید" />
                                ) : (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                        {safeEmployees.map((employee, index) => (
                                            <PurchasingEmployeeCard
                                                key={employee.id}
                                                employee={employee}
                                                index={index}
                                                canManage={isAdmin}
                                                onUpdated={() => loadAll(true)}
                                                onDeleted={() => loadAll(true)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {isAdmin && (
                <PurchasingEmployeeModal
                    open={employeeModalOpen}
                    onClose={() => setEmployeeModalOpen(false)}
                    existingEmployees={safeEmployees}
                    onSaved={() => {
                        setEmployeeModalOpen(false);
                        loadAll(true);
                    }}
                />
            )}

            <StepModal
                open={stepModalOpen}
                onClose={handleStepModalClose}
                step={editingStep}
                steps={safeSteps}
                employees={safeEmployees}
                onSaved={() => {
                    handleStepModalClose();
                    loadAll(true);
                }}
            />
        </div>
    );
}