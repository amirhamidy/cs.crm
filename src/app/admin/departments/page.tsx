"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Building2,
    Users,
    Loader2,
    AlertCircle,
    Check,
    X,
    Pencil,
    CheckCircle2,
    RefreshCw,
} from "lucide-react";
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
        deleteStage, } = useDepartmentStore();

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
                await deleteDepartment(deleteTarget.id); const remaining = departments.filter((d) => d.id !== deleteTarget.id);
                setSelectedId(remaining[0]?.id ?? null);
            }
            if (deleteTarget.type === "stage")
                await deleteStage(deleteTarget.departmentId, deleteTarget.stage.id);
            if (deleteTarget.type === "employee")
                await removeEmployee(deleteTarget.departmentId, deleteTarget.employee.id);
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
            <div className="flex flex-col items-center justify-center gap-3 py-16" dir="rtl">
                <Loader2 size={22} className="text-indigo-500 animate-spin" />
                <p className="text-[12.5px] text-gray-400 dark:text-gray-500">
                    در حال دریافت لیست دپارتمان‌ها...
                </p>
            </div>
        );
    }

    if (error && departments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3" dir="rtl">
                <AlertCircle size={28} className="text-red-500" />
                <p className="text-[13px] font-semibold text-red-500">{error}</p>
                <button
                    onClick={fetchAll}
                    className="px-4 py-2 rounded-xl text-[12.5px] font-bold text-white" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                    type="button"
                >
                    تلاش مجدد
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6" dir="rtl">
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
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
                        onClick={() => !editLoading && !editSuccess && setEditDept(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.93, y: 18, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.93, y: 18, opacity: 0 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[400px] rounded-[2rem] overflow-hidden border bg-white dark:bg-[#0f172a]"
                            style={{
                                borderColor: "rgba(99,102,241,0.15)",
                                boxShadow: "0 0 0 1px rgba(99,102,241,0.08), 0 24px 64px rgba(0,0,0,0.4)",
                            }}
                        >
                            <div className="px-8 pt-8 pb-5 flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06]">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                        <Pencil size={15} className="text-indigo-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                            ویرایش نام دپارتمان
                                        </h3>
                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                            نام جدید را وارد کنید
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => !editLoading && !editSuccess && setEditDept(null)}
                                    disabled={editLoading || editSuccess}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-100 dark:bg-white/[0.05] transition-colors disabled:opacity-40"
                                    type="button"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="px-8 pb-8 pt-6 space-y-4">
                                <div className="relative">
                                    <input
                                        ref={editInputRef}
                                        id="edit_dept_name"
                                        placeholder=" "
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleEditDepartment();
                                            if (e.key === "Escape" && !editLoading) setEditDept(null);
                                        }}
                                        disabled={editLoading || editSuccess}
                                        className="peer w-full rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-4 py-3 text-sm text-black dark:text-white outline-none transition-all focus:border-indigo-500 dark:focus:border-violet-500 disabled:opacity-50"
                                    />
                                    <label
                                        htmlFor="edit_dept_name"
                                        className={`absolute right-4 pointer-events-none transition-all duration-200 bg-white dark:bg-[#0f172a] px-1 rounded ${editName.trim()
                                                ? "top-0 -translate-y-1/2 text-[11px] text-indigo-500 dark:text-violet-400"
                                                : "top-1/2 -translate-y-1/2 text-sm text-gray-400 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:text-indigo-500 dark:peer-focus:text-violet-400"
                                            }`}
                                    >
                                        نام دپارتمان
                                    </label>
                                </div>

                                <AnimatePresence mode="wait">
                                    {editSuccess ? (
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.92 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.92 }}
                                            transition={{ duration: 0.18 }}
                                            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-semibold"
                                        >
                                            <CheckCircle2 size={15} />
                                            تغییرات با موفقیت ذخیره شد
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="actions"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex gap-2"
                                        >
                                            <button
                                                onClick={() => setEditDept(null)}
                                                disabled={editLoading}
                                                className="flex-1 py-2.5 rounded-full text-[12.5px] font-bold text-gray-400 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors disabled:opacity-40"
                                                type="button"
                                            >
                                                انصراف
                                            </button>
                                            <motion.button
                                                onClick={handleEditDepartment}
                                                disabled={editLoading || !editName.trim()}
                                                whileTap={{ scale: 0.97 }}
                                                className="flex-1 py-2.5 rounded-full text-[13px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
                                                style={{
                                                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                                    boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                                                }}
                                                type="button"
                                            >
                                                {editLoading ? (
                                                    <Loader2 size={13} className="animate-spin" />
                                                ) : (
                                                    <Check size={13} />
                                                )}
                                                ذخیره
                                            </motion.button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-2xl flex items-center justify-center"
                        style={{
                            background: isDark
                                ? "rgba(99,102,241,0.12)"
                                : "rgba(99,102,241,0.08)",
                        }}
                    >
                        <Building2 size={16} className="text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                            دپارتمان‌ها
                        </h1>
                        <p className="text-[11.5px] text-gray-400 dark:text-gray-500 mt-0.5">
                            {loading
                                ? "در حال بارگذاری..."
                                : `${departments.length} دپارتمان فعال در سیستم`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchAll}
                        disabled={loading}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-40"
                        style={{
                            background: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(0,0,0,0.04)",
                        }}
                        title="بارگذاری مجدد"
                        type="button"
                    >
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                    </button>

                    <button
                        onClick={() => setAddDeptOpen(true)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12.5px] font-bold text-white transition-opacity hover:opacity-90"
                        style={{
                            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                            boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
                        }}
                        type="button"
                    >
                        <Plus size={13} strokeWidth={2.5} />
                        افزودن دپارتمان
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-3">
                    {departments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Building2 size={28} className="text-gray-300 dark:text-gray-600" />
                            <p className="text-[13px] text-gray-400 dark:text-gray-500">
                                دپارتمانی یافت نشد
                            </p>
                        </div>
                    ) : (
                        departments.map((dept, index) => (
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
                                } onEdit={() => handleOpenEdit(dept)} />
                        ))
                    )}
                </div>

                <div className="lg:col-span-2 space-y-5">
                    {!selectedDept ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Building2 size={32} className="text-gray-300 dark:text-gray-600" />
                            <p className="text-[13px] text-gray-400 dark:text-gray-500">
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
                                className="rounded-2xl p-5 border" style={{
                                    borderColor: "rgba(99,102,241,0.1)",
                                    background:
                                        "linear-gradient(135deg, rgba(99,102,241,0.04), rgba(139,92,246,0.03))",
                                }}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
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
                                        <div>
                                            <h2 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                                                {selectedDept.name}
                                            </h2>
                                            <p className="text-[11.5px] text-gray-400 mt-0.5">
                                                ایجاد شده در {selectedDept.createdAt}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11.5px] text-gray-400 bg-gray-100 dark:bg-white/[0.05] px-3 py-1.5 rounded-full">
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
    );
}
