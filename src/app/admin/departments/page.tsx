"use client";

import { useEffect, useMemo, useRef, useState, forwardRef, InputHTMLAttributes } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Building2,
    Users,
    Loader,
    AlertCircle,
    Check,
    X,
    Pencil,
    CheckCircle2,
    RefreshCw,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/pagination";
import { useDepartmentStore } from "@/components/admin/departments/departmentStore";
import { Department, Stage, Employee } from "@/components/admin/departments/types";
import DepartmentCard from "@/components/admin/departments/DepartmentCard";
import StagesPanel from "@/components/admin/departments/StagesPanel";
import EmployeesPanel from "@/components/admin/departments/EmployeesPanel";
import DeleteModal from "@/components/admin/departments/DeleteModal";
import AddStageModal from "@/components/admin/departments/AddStageDrawer";
import AddDepartmentModal from "@/components/admin/departments/AddDepartmentDrawer";
import AddEmployeeModal from "@/components/admin/departments/AddEmployeeModal";

type DeleteTarget =
    | { type: "department"; id: string; name: string }
    | { type: "stage"; departmentId: string; stage: Stage }
    | { type: "employee"; departmentId: string; employee: Employee }
    | null;

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
    ({ label, id, className = "", ...props }, ref) => (
        <div className="relative">
            <input
                ref={ref}
                id={id}
                placeholder=" "
                className={`peer w-full border border-gray-200 rounded-[1.5rem] px-5 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-gray-400 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:focus:border-blue-500 ${className}`}
                {...props}
            />
            <label
                htmlFor={id}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none transition-all duration-200 bg-white dark:bg-[#0f172a] px-1.5 rounded peer-focus:top-0 peer-focus:text-xs peer-focus:text-gray-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-500"
            >
                {label}
            </label>
        </div>
    )
);
FloatingInput.displayName = "FloatingInput";

export default function DepartmentsPage() {
    const {
        departments,
        allEmployees,
        loading,
        error,
        fetchAll,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        assignEmployee,
        removeEmployee,
        addStage,
        updateStage,
        deleteStage,
    } = useDepartmentStore();

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [addDeptOpen, setAddDeptOpen] = useState(false);
    const [addStageOpen, setAddStageOpen] = useState(false);
    const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);

    const [editDept, setEditDept] = useState<Department | null>(null);
    const [editName, setEditName] = useState("");
    const [editLoading, setEditLoading] = useState(false);
    const [editSuccess, setEditSuccess] = useState(false);
    const editInputRef = useRef<HTMLInputElement>(null);

    const [isDark, setIsDark] = useState(false);
    const [mobileSwiper, setMobileSwiper] = useState<SwiperType | null>(null);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        setIsDark(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    useEffect(() => {
        if (!selectedId && departments.length > 0) setSelectedId(departments[0].id);
    }, [departments, selectedId]);

    useEffect(() => {
        if (editDept) {
            setEditSuccess(false);
            const t = setTimeout(() => editInputRef.current?.focus(), 60);
            return () => clearTimeout(t);
        }
    }, [editDept]);

    useEffect(() => {
        if (!mobileSwiper || !selectedId || departments.length === 0) return;
        const currentIndex = departments.findIndex((d) => d.id === selectedId);
        if (currentIndex >= 0 && mobileSwiper.activeIndex !== currentIndex) {
            mobileSwiper.slideTo(currentIndex);
        }
    }, [selectedId, departments, mobileSwiper]);

    const selectedDept = useMemo(
        () => departments.find((d) => d.id === selectedId) ?? null,
        [departments, selectedId]
    );

    const handleAddDepartment = async (data: { name: string }) => {
        const newDept = await addDepartment(data.name);
        setSelectedId(newDept.id);
        setAddDeptOpen(false);
    };

    const handleOpenEdit = (dept: Department) => {
        setEditDept(dept);
        setEditName(dept.name);
    };

    const handleEditDepartment = async () => {
        if (!editDept) return;
        const nextName = editName.trim();
        if (!nextName || nextName === editDept.name) {
            setEditDept(null);
            return;
        }
        setEditLoading(true);
        try {
            await updateDepartment(editDept.id, nextName);
            setEditSuccess(true);
            setTimeout(() => {
                setEditSuccess(false);
                setEditDept(null);
            }, 1400);
        } finally {
            setEditLoading(false);
        }
    };

    const handleAddStage = async (data: { name: string }) => {
        if (!selectedId) return;
        await addStage(selectedId, { name: data.name });
        setAddStageOpen(false);
    };

    const handleAddEmployee = async (employeeId: string) => {
        if (!selectedId) return;
        await assignEmployee(selectedId, employeeId);
    };

    const handleEditStage = async (
        stage: Stage,
        values: { name: string; description?: string; order: number }
    ) => {
        if (!selectedId) return;
        await updateStage(selectedId, stage.id, values);
    };

    const handleReorderStages = (stages: Stage[]) => {
        if (!selectedId) return;
        useDepartmentStore.setState((state) => ({
            departments: state.departments.map((dept) =>
                dept.id === selectedId ? { ...dept, stages } : dept
            ),
        }));
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            if (deleteTarget.type === "department") {
                await deleteDepartment(deleteTarget.id);
                const remaining = departments.filter((d) => d.id !== deleteTarget.id);
                setSelectedId(remaining[0]?.id ?? null);
            }
            if (deleteTarget.type === "stage") {
                await deleteStage(deleteTarget.departmentId, deleteTarget.stage.id);
            }
            if (deleteTarget.type === "employee") {
                await removeEmployee(deleteTarget.departmentId, deleteTarget.employee.id);
            }
        } finally {
            setDeleteLoading(false);
            setDeleteTarget(null);
        }
    };

    const deleteModalMeta = useMemo(() => {
        if (!deleteTarget) return { title: "", description: "" };
        if (deleteTarget.type === "department")
            return {
                title: `حذف دپارتمان "${deleteTarget.name}"`,
                description:
                    "تمام مراحل و اعضای این دپارتمان نیز حذف خواهند شد. این عملیات قابل بازگشت نیست.",
            };
        if (deleteTarget.type === "stage")
            return {
                title: `حذف مرحله "${deleteTarget.stage.name}"`,
                description: "این مرحله از دپارتمان حذف می‌شود.",
            };
        return {
            title: `حذف عضو "${deleteTarget.employee.name}"`,
            description: "این عضو از دپارتمان حذف می‌شود.",
        };
    }, [deleteTarget]);

    if (loading && departments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-4" dir="rtl">
                <Loader size={22} className="text-indigo-500 animate-spin" />
                <p className="text-[12.5px] text-gray-400 dark:text-gray-500 text-center">
                    در حال دریافت لیست دپارتمان‌ها...
                </p>
            </div>
        );
    }

    if (error && departments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3 px-4" dir="rtl">
                <AlertCircle size={28} className="text-red-500" />
                <p className="text-[13px] font-semibold text-red-500 text-center">{error}</p>
                <button
                    onClick={fetchAll}
                    className="px-4 py-2 rounded-xl text-[12.5px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                    type="button"
                >
                    تلاش مجدد
                </button>
            </div>
        );
    }

    return (
        <>
            <style jsx global>{`
                .departments-mobile-swiper {
                    padding-bottom: 34px;
                }

                .departments-mobile-swiper .swiper-pagination {
                    bottom: 0 !important;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                }

                .departments-mobile-swiper .dept-swiper-bullet {
                    width: 8px;
                    height: 8px;
                    border-radius: 999px;
                    background: rgba(59, 130, 246, 0.22);
                    opacity: 1;
                    transition: all 0.25s ease;
                    margin: 0 !important;
                }

                .departments-mobile-swiper .dept-swiper-bullet-active {
                    width: 16px;
                    background: #3b82f6;
                }
            `}</style>

            <div className="flex flex-col gap-5 sm:gap-6 p-3 sm:p-4 md:p-6" dir="rtl">
                <DeleteModal
                    open={!!deleteTarget}
                    title={deleteModalMeta.title}
                    description={deleteModalMeta.description}
                    loading={deleteLoading}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setDeleteTarget(null)}
                />

                <AddDepartmentModal
                    open={addDeptOpen}
                    onClose={() => setAddDeptOpen(false)}
                    onSubmit={handleAddDepartment}
                />

                <AddStageModal
                    open={addStageOpen}
                    department={selectedDept}
                    onClose={() => setAddStageOpen(false)}
                    onSubmit={handleAddStage}
                />

                <AddEmployeeModal
                    open={addEmployeeOpen}
                    department={selectedDept}
                    employees={allEmployees}
                    onClose={() => setAddEmployeeOpen(false)}
                    onSubmit={handleAddEmployee}
                />

                <AnimatePresence>
                    {editDept && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4"
                            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
                            onClick={() => !editLoading && !editSuccess && setEditDept(null)}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 16 }}
                                transition={{ duration: 0.35, ease: "easeOut" }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-[92vw] sm:max-w-sm overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
                            >
                                <div className="flex items-center justify-between gap-3 px-5 sm:px-8 pb-5 sm:pb-6 pt-6 sm:pt-8">
                                    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                                            <Pencil size={15} className="text-blue-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="truncate text-[14px] font-extrabold text-gray-900 dark:text-white">
                                                ویرایش نام دپارتمان
                                            </h3>
                                            <p className="mt-0.5 text-[11px] text-gray-400">
                                                نام جدید را وارد کنید
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => !editLoading && !editSuccess && setEditDept(null)}
                                        disabled={editLoading || editSuccess}
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-4 px-5 sm:px-8 pb-5 sm:pb-8">
                                    <FloatingInput
                                        ref={editInputRef}
                                        label="نام دپارتمان"
                                        id="edit_dept_name"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleEditDepartment();
                                            if (e.key === "Escape" && !editLoading) setEditDept(null);
                                        }}
                                        disabled={editLoading || editSuccess}
                                        dir="rtl"
                                    />

                                    <AnimatePresence mode="wait">
                                        {editSuccess ? (
                                            <motion.div
                                                key="success"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="flex items-center justify-center gap-2 rounded-2xl bg-green-50 py-3 text-sm font-medium text-green-600 dark:bg-green-500/10 dark:text-green-400"
                                            >
                                                <CheckCircle2 size={16} />
                                                تغییرات با موفقیت ذخیره شد
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="actions"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex flex-col-reverse sm:flex-row gap-2"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => setEditDept(null)}
                                                    disabled={editLoading}
                                                    className="flex-1 rounded-full bg-gray-100 py-3 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-200 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:bg-white/[0.08]"
                                                >
                                                    انصراف
                                                </button>
                                                <motion.button
                                                    type="button"
                                                    onClick={handleEditDepartment}
                                                    disabled={editLoading || !editName.trim()}
                                                    whileTap={{ scale: 0.97 }}
                                                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                                                >
                                                    {editLoading ? (
                                                        <Loader size={18} className="animate-spin" />
                                                    ) : (
                                                        <Check size={16} />
                                                    )}
                                                    ذخیره تغییرات
                                                </motion.button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
                            style={{
                                background: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                            }}
                        >
                            <Building2 size={16} className="text-indigo-500" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                دپارتمان‌ها
                            </h1>
                            <p className="mt-0.5 text-[11.5px] text-gray-400 dark:text-gray-500">
                                {loading ? "در حال بارگذاری..." : `${departments.length} دپارتمان فعال در سیستم`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:justify-end">
                        <button
                            onClick={fetchAll}
                            disabled={loading}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:hover:text-gray-300"
                            style={{
                                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                            }}
                            title="بارگذاری مجدد"
                            type="button"
                        >
                            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                        </button>

                        <button
                            onClick={() => setAddDeptOpen(true)}
                            className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-[12.5px] bg-blue-600 hover:bg-blue-100 hover:text-blue-500 transition-all duration-200  font-bold text-white hover:opacity-90 sm:flex-none"
                            type="button"
                        >
                            <Plus size={13} strokeWidth={2.5} />
                            <span className="whitespace-nowrap">افزودن دپارتمان</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        {departments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-3 rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.02]">
                                <Building2 size={28} className="text-gray-300 dark:text-gray-600" />
                                <p className="text-[13px] text-gray-400 dark:text-gray-500 text-center">
                                    دپارتمانی یافت نشد
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="hidden md:block space-y-3">
                                    {departments.map((dept, index) => (
                                        <DepartmentCard
                                            key={dept.id}
                                            department={dept}
                                            index={index}
                                            isSelected={dept.id === selectedId}
                                            onClick={() => setSelectedId(dept.id)}
                                            onDelete={() =>
                                                setDeleteTarget({
                                                    type: "department",
                                                    id: dept.id,
                                                    name: dept.name,
                                                })
                                            }
                                            onEdit={() => handleOpenEdit(dept)}
                                        />
                                    ))}
                                </div>

                                <div className="md:hidden">
                                    <Swiper
                                        modules={[Pagination]}
                                        slidesPerView={1}
                                        spaceBetween={12}
                                        className="departments-mobile-swiper"
                                        onSwiper={(swiper) => {
                                            setMobileSwiper(swiper);
                                            const initialIndex = departments.findIndex((d) => d.id === selectedId);
                                            if (initialIndex >= 0 && swiper.activeIndex !== initialIndex) {
                                                swiper.slideTo(initialIndex, 0);
                                            }
                                        }}
                                        onSlideChange={(swiper) => {
                                            const dept = departments[swiper.activeIndex];
                                            if (dept) setSelectedId(dept.id);
                                        }}
                                        pagination={{
                                            clickable: true,
                                            bulletClass: "dept-swiper-bullet",
                                            bulletActiveClass: "dept-swiper-bullet-active",
                                        }}
                                    >
                                        {departments.map((dept, index) => (
                                            <SwiperSlide key={dept.id}>
                                                <DepartmentCard
                                                    department={dept}
                                                    index={index}
                                                    isSelected={dept.id === selectedId}
                                                    onClick={() => setSelectedId(dept.id)}
                                                    onDelete={() =>
                                                        setDeleteTarget({
                                                            type: "department",
                                                            id: dept.id,
                                                            name: dept.name,
                                                        })
                                                    }
                                                    onEdit={() => handleOpenEdit(dept)}
                                                />
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="space-y-5 lg:col-span-2">
                        {!selectedDept ? (
                            <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-3 rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.02]">
                                <Building2 size={32} className="text-gray-300 dark:text-gray-600" />
                                <p className="text-[13px] text-gray-400 dark:text-gray-500 text-center">
                                    یک دپارتمان انتخاب کنید
                                </p>
                            </div>
                        ) : (
                            <>
                                <motion.div
                                    key={selectedDept.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="rounded-2xl border p-4 sm:p-5"
                                    style={{
                                        borderColor: "rgba(99,102,241,0.1)",
                                        background:
                                            "linear-gradient(135deg, rgba(99,102,241,0.04), rgba(139,92,246,0.03))",
                                    }}
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                                                style={{
                                                    backgroundColor: `${selectedDept.accent || "#6366f1"}18`,
                                                    border: `1px solid ${selectedDept.accent || "#6366f1"}30`,
                                                }}
                                            >
                                                <Building2
                                                    size={18}
                                                    style={{ color: selectedDept.accent || "#6366f1" }}
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <h2 className="text-[15px] font-extrabold text-gray-900 dark:text-white break-words">
                                                    {selectedDept.name}
                                                </h2>
                                                <p className="mt-0.5 text-[11.5px] text-gray-400 break-words">
                                                    ایجاد شده در {selectedDept.createdAt}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex w-fit items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-[11.5px] text-gray-400 dark:bg-white/[0.05]">
                                            <Users size={12} />
                                            <span>{selectedDept.employees.length} عضو</span>
                                        </div>
                                    </div>
                                </motion.div>

                                <StagesPanel
                                    department={selectedDept}
                                    onAddStage={() => setAddStageOpen(true)}
                                    onEditStage={handleEditStage}
                                    onDeleteStage={(stage) =>
                                        setDeleteTarget({
                                            type: "stage",
                                            departmentId: selectedDept.id,
                                            stage,
                                        })
                                    }
                                    onReorder={handleReorderStages}
                                />

                                <EmployeesPanel
                                    department={selectedDept}
                                    onAddEmployee={() => setAddEmployeeOpen(true)}
                                    onDeleteEmployee={(employee) =>
                                        setDeleteTarget({
                                            type: "employee",
                                            departmentId: selectedDept.id,
                                            employee,
                                        })
                                    }
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
