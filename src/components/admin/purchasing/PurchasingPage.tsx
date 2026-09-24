"use client";


import { useCallback, useEffect, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";

import {

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

import type {

    ApiPurchasingEmployee,

    ApiPurchasingStep,

    ApiPurchasingTask,

    ApiTaskAttachment,

} from "@/types/purchasing";

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

                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#2563EB]/10">

                    <Icon size={17} className="text-[#2563EB]" />

                </div>

                <div>

                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">

                        {title}

                    </h3>

                    <p className="text-[11px] text-gray-400">{count}</p>

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

                <p className="text-[12px] font-bold text-gray-500 dark:text-gray-400">

                    {title}

                </p>

                <p className="mt-1 text-[11px] text-gray-400">{hint}</p>

            </div>

        </div>

    );

}


function AddButton({ label, onClick }: { label: string; onClick: () => void }) {

    return (

        <button

            type="button"

            onClick={onClick}

            className="flex h-9 shrink-0 items-center gap-1.5 rounded-2xl bg-[#2563EB] px-3.5 text-[11px] font-extrabold text-white shadow-lg shadow-[#2563EB]/20 transition hover:bg-[#2563EB]"

        >

            <Plus size={14} />

            {label}

        </button>

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


            const [

                employeesResponse,

                stepsResponse,

                tasksResponse,

                attachmentsResponse,

            ] = await Promise.all([

                axiosInstance.get("/purchasing/api/v1/employees/"),

                axiosInstance.get("/purchasing/api/v1/steps/"),

                axiosInstance.get("/purchasing/api/v1/tasks/"),

                axiosInstance.get("/purchasing/api/v1/task-attachments/"),

            ]);


            setEmployees(normalizeList<ApiPurchasingEmployee>(employeesResponse.data));


            setSteps(

                normalizeList<ApiPurchasingStep>(stepsResponse.data).sort(

                    (a, b) => a.order - b.order

                )

            );


            setTasks(normalizeList<ApiPurchasingTask>(tasksResponse.data));


            setAttachments(

                normalizeList<ApiTaskAttachment>(attachmentsResponse.data)

            );

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

                className="relative flex flex-col gap-3.5 overflow-hidden rounded-[2rem] border border-[#DCEAFB] bg-white p-4 shadow-[0_10px_34px_rgba(37,99,235,0.07)] dark:border-[rgba(96,165,250,0.14)] dark:bg-[#0A1930]"

            >

                <div

                    className="absolute inset-y-0 right-0 w-1"

                    style={{ background: "linear-gradient(180deg,#2563EB,#06B6D4 60%,#2563EB45)" }}

                />


                <div className="flex items-center justify-between gap-3">

                    <div className="flex min-w-0 items-center gap-3">

                        <div

                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-[#2563EB]/25"

                            

                        >

                            <ShoppingCart size={19} />

                        </div>


                        <div className="min-w-0">

                            <h1 className="truncate text-[15px] font-extrabold text-gray-900 dark:text-white">

                                مدیریت خرید

                            </h1>

                            <p className="mt-0.5 truncate text-[11px] text-gray-400">

                                مدیریت مراحل، کارمندان و فرآیندهای خرید

                            </p>

                        </div>

                    </div>


                    <div className="flex shrink-0 items-center gap-2">

                        <div

                            className={`hidden items-center gap-1.5 rounded-2xl px-3 py-2 text-[10.5px] font-extrabold sm:flex ${isAdmin

                                    ? "bg-amber-500/10 text-amber-500"

                                    : "bg-[#2563EB]/10 text-[#2563EB]"

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

                            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-[rgba(96,165,250,0.08)] dark:hover:text-gray-300"

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
                                <button type="button" onClick={() => setActiveTab(tab.id)} className={`relative flex shrink-0 items-center gap-2 rounded-2xl border px-3.5 py-2 text-[11.5px] font-bold transition-colors ${active ? "border-transparent text-white" : "border-[#2563EB]/15 bg-[#2563EB]/[.05] text-[#2563EB] hover:bg-[#2563EB]/10"}`}>
                                    {active && <motion.span layoutId="purchasing-tab" className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#06B6D4] shadow-md shadow-blue-500/25" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
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

                    <motion.div

                        key="loading"

                        initial={{ opacity: 0 }}

                        animate={{ opacity: 1 }}

                        exit={{ opacity: 0 }}

                        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"

                    >

                        {Array.from({ length: 6 }).map((_, index) => (

                            <div

                                key={index}

                                className="h-40 animate-pulse rounded-[1.8rem] border border-[#DCEAFB] bg-[#F3F8FF] dark:border-[rgba(96,165,250,0.10)] dark:bg-white/[.03]"

                            />

                        ))}

                    </motion.div>

                ) : (

                    <motion.div

                        key={activeTab}

                        initial={{ opacity: 0, y: 8 }}

                        animate={{ opacity: 1, y: 0 }}

                        transition={{ duration: 0.2 }}

                    >

                        {activeTab === "overview" && (

                            <PurchasingOverview

                                employees={safeEmployees}

                                steps={safeSteps}

                                tasks={safeTasks}

                                attachments={safeAttachments}

                            />

                        )}


                        {activeTab === "tasks" && (

                            <div className="flex flex-col gap-4">

                                <SectionHeader

                                    icon={ClipboardList}

                                    title="تسک‌های خرید"

                                    count={`${toPersianDigits(safeTasks.length)} تسک`}

                                />


                                {safeTasks.length === 0 ? (

                                    <EmptyState

                                        icon={ClipboardList}

                                        title="تسکی وجود ندارد"

                                        hint="در حال حاضر هیچ تسک خریدی ثبت نشده است"

                                    />

                                ) : (

                                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">

                                        {safeTasks.map((task, index) => (

                                            <TaskCard

                                                key={task.id}

                                                task={task}

                                                index={index}

                                                steps={safeSteps}

                                                attachments={safeAttachments.filter(

                                                    (attachment) => attachment.task === task.id

                                                )}

                                                onUpdated={() => loadAll(true)}

                                            />

                                        ))}

                                    </div>

                                )}

                            </div>

                        )}


                        {activeTab === "attachments" && (

                            <TaskAttachmentsPanel attachments={safeAttachments} />

                        )}


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

                                    <EmptyState

                                        icon={ListOrdered}

                                        title="مرحله‌ای وجود ندارد"

                                        hint="اولین مرحله فرآیند خرید را ایجاد کنید"

                                    />

                                ) : (

                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">

                                        {safeSteps.map((step, index) => (

                                            <StepCard

                                                key={step.id}

                                                step={step}

                                                index={index}

                                                onDeleted={() => loadAll(true)}

                                                onEdit={() => handleStepEdit(step)}

                                            />

                                        ))}

                                    </div>

                                )}

                            </div>

                        )}


                        {activeTab === "employees" && (

                            <div className="flex flex-col gap-4">

                                <SectionHeader

                                    icon={Users}

                                    title="کارمندان خرید"

                                    count={`${toPersianDigits(safeEmployees.length)} کارمند`}

                                    action={

                                        isAdmin ? (

                                            <AddButton

                                                label="افزودن کارمند"

                                                onClick={() => setEmployeeModalOpen(true)}

                                            />

                                        ) : undefined

                                    }

                                />


                                {safeEmployees.length === 0 ? (

                                    <EmptyState

                                        icon={Users}

                                        title="کارمندی اضافه نشده است"

                                        hint="برای فرآیند خرید کارمند اضافه کنید"

                                    />

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

