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
    const editInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    useEffect(() => {
        if (!selectedId && departments.length > 0) {
            setSelectedId(departments[0].id);
        }
    }, [departments, selectedId]);

    useEffect(() => {
        if (editDept) {
            const timer = setTimeout(() => editInputRef.current?.focus(), 60);
            return () => clearTimeout(timer);
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
        } finally {
            setEditLoading(false);
            setEditDept(null);
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
        if (!deleteTarget) {
            return { title: "", description: "" };
        }

        if (deleteTarget.type === "department") {
            return {
                title: `حذف دپارتمان "${deleteTarget.name}"`,
                description:
                    "تمام مراحل و اعضای این دپارتمان نیز حذف خواهند شد. این عملیات قابل بازگشت نیست.",
            };
        }

        if (deleteTarget.type === "stage") {
            return {
                title: `حذف مرحله "${deleteTarget.stage.name}"`,
                description: "این مرحله از دپارتمان حذف می‌شود.",
            };
        }

        return {
            title: `حذف عضو "${deleteTarget.employee.name}"`,
            description: "این عضو از دپارتمان حذف می‌شود.",
        };
    }, [deleteTarget]);

    if (loading && departments.length === 0) {
        return (
            <div className="flex items-center justify-center py-24" dir="rtl">
                <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
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
                    className="px-4 py-2 rounded-xl text-[12.5px] font-bold text-white"
                    style={{
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    }}
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
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        style={{
                            background: "rgba(0,0,0,0.5)",
                            backdropFilter: "blur(2px)",
                        }}
                        onClick={() => !editLoading && setEditDept(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.93, y: 16 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.93, y: 16 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[400px] rounded-3xl overflow-hidden border bg-white dark:bg-[#0f172a]"
                            style={{
                                borderColor: "rgba(255,255,255,0.07)",
                                boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
                            }}
                        >
                            <div className="px-5 py-4 border-b flex items-center justify-between border-gray-100 dark:border-white/[0.06]">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                        <Pencil size={15} className="text-indigo-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                            ویرایش نام دپارتمان
                                        </h3>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setEditDept(null)}
                                    disabled={editLoading}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    style={{ background: "rgba(255,255,255,0.05)" }}
                                    type="button"
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            <div className="p-5 space-y-4">
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
                                        disabled={editLoading}
                                        className="peer w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-violet-500"
                                    />
                                    <label
                                        htmlFor="edit_dept_name"
                                        className={`absolute right-4 pointer-events-none transition-all duration-200 bg-white dark:bg-[#0f172a] px-1 rounded ${editName.trim()
                                            ? "top-0 -translate-y-1/2 text-[11px] text-indigo-500 dark:text-violet-400"
                                            : "top-1/2 -translate-y-1/2 text-sm text-gray-400 peer-focus:top-0 peer-focus:text-[11px] peer-focus:text-indigo-500 dark:peer-focus:text-violet-400"
                                            }`}
                                    >
                                        نام دپارتمان
                                    </label>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEditDept(null)}
                                        disabled={editLoading}
                                        className="flex-1 py-2.5 rounded-xl text-[12.5px] font-bold transition-colors"
                                        style={{
                                            background: "rgba(255,255,255,0.05)",
                                            color: "#94a3b8",
                                        }}
                                        type="button"
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        onClick={handleEditDepartment}
                                        disabled={editLoading || !editName.trim()}
                                        className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
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
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      
                    >
                        <Building2 size={24} className="text-[#6366f1]" />
                    </div>

                    <div>
                        <h1 className="text-[14px] font-extrabold text-gray-900 dark:text-white leading-tight transition-colors">
                            دپارتمان‌ها
                        </h1>
                        <p className="text-[12.5px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
                            {departments.length} دپارتمان فعال در سیستم مدیریت
                        </p>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02, translateY: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setAddDeptOpen(true)}
                    className="flex items-center gap-2.5 text-[13.5px] font-bold text-white px-3 py-2 rounded-2xl transition-all"
                    style={{
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        boxShadow: "0 8px 20px -6px rgba(99,102,241,0.5)",
                    }}
                    type="button"
                >
                    <Plus size={15} strokeWidth={2.5} />
                    <span>افزودن دپارتمان</span>
                </motion.button>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-3">
                    {departments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <p className="text-[13px] text-gray-400 dark:text-gray-500">
                                دپارتمانی یافت نشد
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
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
                    )}
                </div>

                <div className="lg:col-span-2 space-y-5">
                    {!selectedDept ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Building2 size={32} className="text-gray-400 opacity-40" />
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
                                className="rounded-2xl p-5 border relative overflow-hidden"
                                style={{
                                    borderColor: "rgba(255,255,255,0.06)",
                                    background: "rgba(255,255,255,0.02)",
                                }}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                            style={{
                                                backgroundColor: `${selectedDept.accent || "#6366f1"}20`,
                                                border: `1px solid ${(selectedDept.accent || "#6366f1")}40`,
                                            }}
                                        >
                                            <Building2
                                                size={18}
                                                style={{
                                                    color: selectedDept.accent || "#6366f1",
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <h2 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                                                {selectedDept.name}
                                            </h2>
                                            <p className="text-[11.5px] text-gray-400 dark:text-gray-500 mt-0.5">
                                                ایجاد شده در {selectedDept.createdAt}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-[11.5px] text-gray-400 dark:text-gray-500">
                                        <Users size={13} />
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
