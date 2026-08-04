"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search, Building2, Users } from "lucide-react";
import { mockDepartments } from "@/components/admin/departments/mock";
import { Department, Stage, Employee } from "@/components/admin/departments/types";
import DepartmentCard from "@/components/admin/departments/DepartmentCard";
import StagesPanel from "@/components/admin/departments/StagesPanel";
import EmployeesPanel from "@/components/admin/departments/EmployeesPanel";
import DeleteModal from "@/components/admin/departments/DeleteModal";
import AddStageModal from "@/components/admin/departments/AddStageDrawer";
import AddDepartmentModal from "@/components/admin/departments/AddDepartmentDrawer";
import AddEmployeeModal from "@/components/admin/departments/AddEmployeeDrawer";

type DeleteTarget =
    | { type: "department"; id: string; name: string }
    | { type: "stage"; departmentId: string; stage: Stage }
    | { type: "employee"; departmentId: string; employee: Employee }
    | null;

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>(mockDepartments);
    const [selectedId, setSelectedId] = useState<string | null>(mockDepartments[0]?.id ?? null);
    const [search, setSearch] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
    const [addDeptOpen, setAddDeptOpen] = useState(false);
    const [addStageOpen, setAddStageOpen] = useState(false);
    const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);

    const filteredDepts = useMemo(
        () => departments.filter((d) => 
            d.name.includes(search) || 
            d.description.includes(search)
        ),
        [departments, search]
    );

    const selectedDept = departments.find((d) => d.id === selectedId) ?? null;

    const handleAddDepartment = (data: { name: string; description: string; accent: string }) => {
        const newDept: Department = {
            id: crypto.randomUUID(),
            name: data.name,
            description: data.description,
            accent: data.accent,
            stages: [],
            employees: [],
            createdAt: new Date().toLocaleDateString("fa-IR"),
        };
        setDepartments((prev) => [newDept, ...prev]);
        setSelectedId(newDept.id);
    };

    const handleAddStage = (data: { name: string; color: string }) => {
        if (!selectedId) return;
        setDepartments((prev) =>
            prev.map((d) => {
                if (d.id !== selectedId) return d;
                const newStage: Stage = {
                    id: crypto.randomUUID(),
                    name: data.name,
                    color: data.color,
                    order: d.stages.length + 1,
                };
                return { ...d, stages: [...d.stages, newStage] };
            })
        );
    };

    const handleAddEmployee = (data: { name: string; role: string }) => {
        if (!selectedId) return;
        setDepartments((prev) =>
            prev.map((d) => {
                if (d.id !== selectedId) return d;
                const newEmp: Employee = {
                    id: crypto.randomUUID(),
                    name: data.name,
                    role: data.role,
                };
                return { ...d, employees: [...d.employees, newEmp] };
            })
        );
    };

    const handleReorderStages = (stages: Stage[]) => {
        if (!selectedId) return;
        setDepartments((prev) =>
            prev.map((d) => {
                if (d.id !== selectedId) return d;
                return { ...d, stages };
            })
        );
    };

    const handleConfirmDelete = () => {
        if (!deleteTarget) return;

        if (deleteTarget.type === "department") {
            const remaining = departments.filter((d) => d.id !== deleteTarget.id);
            setDepartments(remaining);
            setSelectedId(remaining[0]?.id ?? null);
        }

        if (deleteTarget.type === "stage") {
            setDepartments((prev) =>
                prev.map((d) => {
                    if (d.id !== deleteTarget.departmentId) return d;
                    return { ...d, stages: d.stages.filter((s) => s.id !== deleteTarget.stage.id) };
                })
            );
        }

        if (deleteTarget.type === "employee") {
            setDepartments((prev) =>
                prev.map((d) => {
                    if (d.id !== deleteTarget.departmentId) return d;
                    return { ...d, employees: d.employees.filter((e) => e.id !== deleteTarget.employee.id) };
                })
            );
        }

        setDeleteTarget(null);
    };

    const deleteModalMeta = useMemo(() => {
        if (!deleteTarget) return { title: "", description: "" };
        if (deleteTarget.type === "department") {
            return {
                title: `حذف دپارتمان "${deleteTarget.name}"`,
                description: "تمام مراحل و کارمندان این دپارتمان نیز حذف خواهند شد. این عمل قابل بازگشت نیست.",
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

    return (
        <div className="min-h-screen p-6 md:p-8 bg-gray-50 dark:bg-[#0a0a0f]" dir="rtl">
            <DeleteModal
                open={!!deleteTarget}
                title={deleteModalMeta.title}
                description={deleteModalMeta.description}
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
                onClose={() => setAddEmployeeOpen(false)}
                onSubmit={handleAddEmployee}
                department={selectedDept}
            />

            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="max-w-7xl mx-auto"
            >
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
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="جستجوی دپارتمان..."
                                className="w-full sm:w-56 pr-9 pl-4 py-2 rounded-xl text-sm
                                    bg-white dark:bg-white/[0.04]
                                    border border-gray-200 dark:border-white/10
                                    text-gray-800 dark:text-white
                                    placeholder:text-gray-400 dark:placeholder:text-gray-600
                                    focus:border-gray-400 dark:focus:border-white/30
                                    focus:ring-2 focus:ring-gray-100 dark:focus:ring-white/5
                                    outline-none transition-all duration-200"
                            />
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setAddDeptOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                                bg-blue-500 hover:bg-blue-600 text-white
                                transition-colors shadow-lg shadow-blue-500/25"
                        >
                            <Plus size={15} />
                            دپارتمان جدید
                        </motion.button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <AnimatePresence mode="popLayout">
                            {filteredDepts.length === 0 ? (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center py-16 text-gray-400"
                                >
                                    <Building2 size={40} className="mb-3 opacity-30" />
                                    <p className="text-sm">
                                        {search ? "نتیجه‌ای برای جستجو یافت نشد" : "دپارتمانی ثبت نشده"}
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="list"
                                    className="space-y-3"
                                >
                                    {filteredDepts.map((dept, index) => (
                                        <DepartmentCard
                                            key={dept.id}
                                            department={dept}
                                            index={index}
                                            isSelected={selectedId === dept.id}
                                            onSelect={() => setSelectedId(dept.id)}
                                            onDelete={() =>
                                                setDeleteTarget({ type: "department", id: dept.id, name: dept.name })
                                            }
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="lg:col-span-2">
                        {!selectedDept ? (
                            <div className="flex flex-col items-center justify-center h-[400px] rounded-2xl
                                border border-gray-200 dark:border-white/10
                                bg-white/50 dark:bg-white/[0.02]
                                backdrop-blur-xl text-gray-400"
                            >
                                <Building2 size={48} className="mb-4 opacity-20" />
                                <p className="text-sm">یک دپارتمان انتخاب کنید</p>
                            </div>
                        ) : (
                            <motion.div
                                key={selectedDept.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4"
                            >
                                <div className="p-5 rounded-2xl
                                    border border-gray-200 dark:border-white/10
                                    bg-white/50 dark:bg-white/[0.02]
                                    backdrop-blur-xl"
                                    style={{
                                        borderColor: `${selectedDept.accent}22`,
                                        boxShadow: `0 0 0 1px ${selectedDept.accent}11`,
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                                            style={{
                                                background: `linear-gradient(135deg, ${selectedDept.accent}cc, ${selectedDept.accent}66)`,
                                                boxShadow: `0 4px 16px ${selectedDept.accent}35`,
                                            }}
                                        >
                                            <Building2 size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-gray-900 dark:text-white text-lg">
                                                {selectedDept.name}
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                                {selectedDept.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <Users size={14} />
                                            <span>{selectedDept.employees.length} عضو</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                                            <span>{selectedDept.stages.length} مرحله</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mr-auto">
                                            <span>ایجاد: {selectedDept.createdAt}</span>
                                        </div>
                                    </div>
                                </div>

                                <StagesPanel
                                    department={selectedDept}
                                    onAddStage={() => setAddStageOpen(true)}
                                    onDeleteStage={(stage) =>
                                        setDeleteTarget({ type: "stage", departmentId: selectedDept.id, stage })
                                    }
                                    onReorder={handleReorderStages}
                                />

                                <EmployeesPanel
                                    department={selectedDept}
                                    onAddEmployee={() => setAddEmployeeOpen(true)}
                                    onDeleteEmployee={(employee) =>
                                        setDeleteTarget({ type: "employee", departmentId: selectedDept.id, employee })
                                    }
                                />
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}