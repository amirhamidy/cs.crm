"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Search,
    Building2,
    Users,
    Loader2,
    AlertCircle,
    Check,
    X,
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
    const [search, setSearch] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [addDeptOpen, setAddDeptOpen] = useState(false);
    const [addStageOpen, setAddStageOpen] = useState(false);
    const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);

    // ─── Edit dept state ───────────────────────────────────────
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

    // focus input وقتی modal باز میشه
    useEffect(() => {
        if (editDept) {
            setTimeout(() => editInputRef.current?.focus(), 50);
        }
    }, [editDept]);

    const filteredDepts = useMemo(
        () =>
            departments.filter(
                (d) => d.name.includes(search) || d.description.includes(search),
            ),
        [departments, search],
    );

    const selectedDept = useMemo(
        () => departments.find((d) => d.id === selectedId) ?? null,
        [departments, selectedId],
    );

    // ─── Handlers ──────────────────────────────────────────────
    const handleAddDepartment = useCallback(
        async (data: { name: string; description: string; accent: string }) => {
            const newDept = await addDepartment(data.name);
            setSelectedId(newDept.id);
            setAddDeptOpen(false);
        },
        [addDepartment],
    );

    const handleOpenEdit = useCallback((dept: Department) => {
        setEditDept(dept);
        setEditName(dept.name);
    }, []);

    const handleEditDepartment = useCallback(async () => {
        if (!editDept || !editName.trim() || editName.trim() === editDept.name) {
            setEditDept(null);
            return;
        }
        setEditLoading(true);
        try {
            await updateDepartment(editDept.id, editName.trim());
        } finally {
            setEditLoading(false);
            setEditDept(null);
        }
    }, [editDept, editName, updateDepartment]);

    const handleAddStage = useCallback(
        async (data: { name: string; color: string }) => {
            if (!selectedId) return;
            await addStage(selectedId, { name: data.name });
            setAddStageOpen(false);
        },
        [selectedId, addStage],
    );

    const handleAddEmployee = useCallback(
        async (employeeId: string) => {
            if (!selectedId) return;
            await assignEmployee(selectedId, employeeId);
        },
        [selectedId, assignEmployee],
    );

    const handleEditStage = useCallback(
        async (
            stage: Stage,
            values: { name: string; description?: string; order: number },
        ) => {
            if (!selectedId) return;
            await updateStage(selectedId, stage.id, values);
        },
        [selectedId, updateStage],
    );

    const handleReorderStages = useCallback(
        (stages: Stage[]) => {
            if (!selectedId) return;
            useDepartmentStore.setState((s) => ({
                departments: s.departments.map((d) =>
                    d.id !== selectedId ? d : { ...d, stages },
                ),
            }));
        },
        [selectedId],
    );

    const handleConfirmDelete = useCallback(async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            if (deleteTarget.type === "department") {
                await deleteDepartment(deleteTarget.id);
                const remaining = departments.filter((d) => d.id !== deleteTarget.id);
                setSelectedId(remaining[0]?.id ?? null);
            } else if (deleteTarget.type === "stage") {
                await deleteStage(deleteTarget.departmentId, deleteTarget.stage.id);
            } else if (deleteTarget.type === "employee") {
                await removeEmployee(
                    deleteTarget.departmentId,
                    deleteTarget.employee.id,
                );
            }
        } finally {
            setDeleteLoading(false);
            setDeleteTarget(null);
        }
    }, [deleteTarget, departments, deleteDepartment, deleteStage, removeEmployee]);

    const deleteModalMeta = useMemo(() => {
        if (!deleteTarget) return { title: "", description: "" };
        if (deleteTarget.type === "department") {
            return {
                title: `حذف دپارتمان "${deleteTarget.name}"`,
                description:
                    "تمام مراحل و کارمندان این دپارتمان نیز حذف خواهند شد. این عمل قابل بازگشت نیست.",
            };
        }
        if (deleteTarget.type === "stage") {
            return {
                title: `حذف مرحله "${deleteTarget.stage.name}"`,
                description: "این مرحله از دپارتمان حذف می‌شود.",
            };
        }
        return {
            title: `حذف کارمند "${deleteTarget.employee.name}"`,
            description: "این کارمند از دپارتمان حذف می‌شود.",
        };
    }, [deleteTarget]);

    if (loading && departments.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center" dir="rtl">
                <div className="flex flex-col items-center gap-3 text-gray-400">
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                    <p className="text-sm">در حال دریافت اطلاعات...</p>
                </div>
            </div>
        );
    }

    if (error && departments.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center" dir="rtl">
                <div className="flex flex-col items-center gap-3 text-gray-400">
                    <AlertCircle size={32} className="text-red-500" />
                    <p className="text-sm text-red-500">{error}</p>
                    <button
                        onClick={fetchAll}
                        className="px-4 py-2 rounded-xl text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    >
                        تلاش مجدد
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-3 md:p-6" dir="rtl">
            {/* ─── Modals ─────────────────────────────────────────── */}
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
                onClose={() => setAddStageOpen(false)}
                onSubmit={handleAddStage}
                department={selectedDept}
            />

            <AddEmployeeModal
                open={addEmployeeOpen}
                department={selectedDept}
                employees={allEmployees}
                onClose={() => setAddEmployeeOpen(false)}
                onSubmit={handleAddEmployee}
            />

            {/* ─── Edit Department Modal ───────────────────────────── */}
            <AnimatePresence>
                {editDept && (
                    <motion.div
                        key="edit-dept-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
                        onClick={() => !editLoading && setEditDept(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm rounded-2xl p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 shadow-2xl"
                        >
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                                ویرایش نام دپارتمان
                            </h3>
                            <input
                                ref={editInputRef}
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleEditDepartment();
                                    if (e.key === "Escape" && !editLoading) setEditDept(null);
                                }}
                                disabled={editLoading}
                                placeholder="نام دپارتمان"
                                className="w-full px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white placeholder:text-gray-400 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/10 outline-none transition-all disabled:opacity-50"
                            />
                            <div className="flex items-center justify-end gap-2 mt-4">
                                <button
                                    onClick={() => setEditDept(null)}
                                    disabled={editLoading}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors disabled:opacity-50"
                                >
                                    <X size={13} />
                                    انصراف
                                </button>
                                <button
                                    onClick={handleEditDepartment}
                                    disabled={editLoading || !editName.trim()}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editLoading ? (
                                        <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                        <Check size={13} />
                                    )}
                                    ذخیره
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <Building2 size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                دپارتمان‌ها
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {departments.length} دپارتمان فعال
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setAddDeptOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500 hover:bg-blue-600 active:scale-95 text-white transition-all duration-150 shadow-lg shadow-blue-500/25"
                        >
                            <Plus size={15} />
                            دپارتمان جدید
                        </button>
                    </div>
                </div>

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Department list */}
                    <div className="lg:col-span-1 space-y-3">
                        {filteredDepts.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600"
                            >
                                <Building2 size={32} className="mb-3 opacity-50" />
                                <p className="text-sm">دپارتمانی یافت نشد</p>
                            </motion.div>
                        ) : (
                            filteredDepts.map((dept, i) => (
                                <DepartmentCard
                                    key={dept.id}
                                    department={dept}
                                    isSelected={dept.id === selectedId}
                                    index={i}
                                    onClick={() => setSelectedId(dept.id)}
                                    onEdit={() => handleOpenEdit(dept)}
                                    onDelete={() =>
                                        setDeleteTarget({
                                            type: "department",
                                            id: dept.id,
                                            name: dept.name,
                                        })
                                    }
                                />
                            ))
                        )}
                    </div>

                    {/* Detail panel */}
                    <div className="lg:col-span-2 space-y-5">
                        {!selectedDept ? (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600">
                                <Building2 size={40} className="mb-3 opacity-40" />
                                <p className="text-sm">یک دپارتمان انتخاب کنید</p>
                            </div>
                        ) : (
                            <>
                                <motion.div
                                    key={selectedDept.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                                style={{
                                                    backgroundColor: selectedDept.accent + "20",
                                                    border: `1px solid ${selectedDept.accent}40`,
                                                }}
                                            >
                                                <Building2
                                                    size={18}
                                                    style={{ color: selectedDept.accent }}
                                                />
                                            </div>
                                            <div>
                                                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                                    {selectedDept.name}
                                                </h2>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    ایجاد شده در {selectedDept.createdAt}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
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
        </div>
    );
}
