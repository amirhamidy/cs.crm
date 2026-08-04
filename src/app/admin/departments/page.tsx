"use client";
import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search, Building2 } from "lucide-react";
import { mockDepartments } from "@/components/admin/departments/mock";
import { Department, Stage, Employee } from "@/components/admin/departments/types";
import DepartmentCard from "@/components/admin/departments/DepartmentCard";
import StagesPanel from "@/components/admin/departments/StagesPanel";
import EmployeesPanel from "@/components/admin/departments/EmployeesPanel";
import AddDepartmentDrawer from "@/components/admin/departments/AddDepartmentDrawer";
import AddStageDrawer from "@/components/admin/departments/AddStageDrawer";
import AddEmployeeDrawer from "@/components/admin/departments/AddEmployeeDrawer";
import DeleteModal from "@/components/admin/departments/DeleteModal";

type DeleteTarget =
    | { type: "department"; id: string; name: string }
    | { type: "stage"; departmentId: string; stage: Stage }
    | { type: "employee"; departmentId: string; employee: Employee }
    | null;

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>(mockDepartments);
    const [selectedId, setSelectedId] = useState<string | null>(mockDepartments[0]?.id ?? null);
    const [search, setSearch] = useState("");

    const [addDeptOpen, setAddDeptOpen] = useState(false);
    const [addStageOpen, setAddStageOpen] = useState(false);
    const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

    const filteredDepts = useMemo(
        () => departments.filter((d) => d.name.includes(search) || d.description.includes(search)),
        [departments, search]
    );

    const selectedDept = departments.find((d) => d.id === selectedId) ?? null;

    function handleAddDepartment(data: { name: string; description: string }) {
        const newDept: Department = {
            id: crypto.randomUUID(),
            name: data.name,
            description: data.description,
            stages: [],
            employees: [],
            createdAt: new Date().toLocaleDateString("fa-IR"),
        };
        setDepartments((prev) => [newDept, ...prev]);
        setSelectedId(newDept.id);
    }

    function handleAddStage(data: { name: string; color: string }) {
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
    }

    function handleAddEmployee(data: { name: string; role: string }) {
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
    }

    function handleConfirmDelete() {
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
    }

    const deleteModalMeta = useMemo(() => {
        if (!deleteTarget) return { title: "", description: "" };
        if (deleteTarget.type === "department")
            return {
                title: `حذف دپارتمان "${deleteTarget.name}"`,
                description: "تمام مراحل و کارمندان این دپارتمان نیز حذف خواهند شد. این عمل قابل بازگشت نیست.",
            };
        if (deleteTarget.type === "stage")
            return {
                title: `حذف مرحله "${deleteTarget.stage.name}"`,
                description: "این مرحله از دپارتمان حذف می‌شود.",
            };
        return {
            title: `حذف کارمند "${deleteTarget.employee.name}"`,
            description: "این کارمند از دپارتمان حذف می‌شود.",
        };
    }, [deleteTarget]);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6" dir="rtl">
            <div className="max-w-6xl mx-auto">

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">دپارتمان‌ها</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {departments.length} دپارتمان فعال
                        </p>
                    </div>
                    <button
                        onClick={() => setAddDeptOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        دپارتمان جدید
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    <div className="lg:col-span-1 flex flex-col gap-3">
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="جستجو..."
                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 pr-9 pl-3.5 py-2.5 text-sm text-zinc-800 dark:text-zinc-100 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors placeholder:text-zinc-400"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <AnimatePresence>
                                {filteredDepts.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center py-12 text-zinc-400"
                                    >
                                        <Building2 className="w-8 h-8 mb-2 opacity-40" />
                                        <p className="text-sm">دپارتمانی یافت نشد</p>
                                    </motion.div>
                                ) : (
                                    filteredDepts.map((dept) => (
                                        <DepartmentCard
                                            key={dept.id}
                                            department={dept}
                                            isSelected={selectedId === dept.id}
                                            onSelect={() => setSelectedId(dept.id)}
                                            onDelete={() =>
                                                setDeleteTarget({ type: "department", id: dept.id, name: dept.name })
                                            }
                                        />
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        {!selectedDept ? (
                            <div className="flex flex-col items-center justify-center h-64 text-zinc-400 bg-white dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                                <Building2 className="w-10 h-10 mb-3 opacity-30" />
                                <p className="text-sm">یک دپارتمان انتخاب کنید</p>
                            </div>
                        ) : (
                            <motion.div
                                key={selectedDept.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col gap-4"
                            >
                                <div className="bg-white dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
                                    <h2 className="font-bold text-zinc-800 dark:text-zinc-100 text-base">
                                        {selectedDept.name}
                                    </h2>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                        {selectedDept.description}
                                    </p>
                                    <p className="text-xs text-zinc-400 mt-2">ایجاد شده در {selectedDept.createdAt}</p>
                                </div>

                                <StagesPanel
                                    department={selectedDept}
                                    onAddStage={() => setAddStageOpen(true)}
                                    onDeleteStage={(stage) =>
                                        setDeleteTarget({ type: "stage", departmentId: selectedDept.id, stage })
                                    }
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
            </div>

            <AddDepartmentDrawer
                open={addDeptOpen}
                onClose={() => setAddDeptOpen(false)}
                onSubmit={handleAddDepartment}
            />

            <AddStageDrawer
                open={addStageOpen}
                onClose={() => setAddStageOpen(false)}
                onSubmit={handleAddStage}
            />

            <AddEmployeeDrawer
                open={addEmployeeOpen}
                onClose={() => setAddEmployeeOpen(false)}
                onSubmit={handleAddEmployee}
            />

            <DeleteModal
                open={!!deleteTarget}
                title={deleteModalMeta.title}
                description={deleteModalMeta.description}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}
