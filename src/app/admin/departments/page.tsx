"use client";

import { useEffect, useRef, useState, forwardRef, InputHTMLAttributes } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Building2, Loader, AlertCircle, Check, X, Pencil, CheckCircle2, RefreshCw } from "lucide-react";
import { useDepartmentStore } from "@/components/admin/departments/departmentStore";
import { Department } from "@/components/admin/departments/types";
import DepartmentCard from "@/components/admin/departments/DepartmentCard";
import DeleteModal from "@/components/admin/departments/DeleteModal";
import AddDepartmentModal from "@/components/admin/departments/AddDepartmentDrawer";

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
label: string;
id: string;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
({ label, id, className = "", ...props }, ref) => ( <div className="relative">
<input
ref={ref}
id={id}
placeholder=" "
className={`peer w-full border border-gray-200 rounded-[1.5rem] px-5 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-gray-400 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:focus:border-blue-500 ${className}`}
{...props}
/> <label
             htmlFor={id}
             className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none transition-all duration-200 bg-white dark:bg-[#0f172a] px-1.5 rounded peer-focus:top-0 peer-focus:text-xs peer-focus:text-gray-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-500"
         >
{label} </label> </div>
)
);
FloatingInput.displayName = "FloatingInput";

export default function DepartmentsPage() {
const {
departments,
loading,
error,
fetchAll,
addDepartment,
updateDepartment,
deleteDepartment,
} = useDepartmentStore();

 
const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
const [deleteLoading, setDeleteLoading] = useState(false);
const [addDeptOpen, setAddDeptOpen] = useState(false);
const [editDept, setEditDept] = useState<Department | null>(null);
const [editName, setEditName] = useState("");
const [editLoading, setEditLoading] = useState(false);
const [editSuccess, setEditSuccess] = useState(false);
const editInputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
    fetchAll();
}, [fetchAll]);

useEffect(() => {
    if (editDept) {
        setEditSuccess(false);
        const t = setTimeout(() => editInputRef.current?.focus(), 60);
        return () => clearTimeout(t);
    }
}, [editDept]);

const handleAddDepartment = async (data: { name: string }) => {
    await addDepartment(data.name);
    await fetchAll();
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

const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleteLoading(true);

    try {
        await deleteDepartment(deleteTarget.id);
    } finally {
        setDeleteLoading(false);
        setDeleteTarget(null);
    }
};

if (loading && departments.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader size={22} className="text-indigo-500 animate-spin" />
            <p className="text-[12.5px] text-gray-400 dark:text-gray-500">
                در حال دریافت لیست دپارتمان‌ها...
            </p>
        </div>
    );
}

if (error && departments.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center py-24 gap-3 px-4" dir="rtl">
            <AlertCircle size={28} className="text-red-500" />
            <p className="text-[13px] font-semibold text-red-500 text-center">
                {error}
            </p>
            <button
                onClick={fetchAll}
                className="px-4 py-2 rounded-xl text-[12.5px] font-bold text-white bg-indigo-500"
                type="button"
            >
                تلاش مجدد
            </button>
        </div>
    );
}

return (
    <>
        <div className="flex flex-col gap-5 sm:gap-6 p-3 sm:p-4 md:p-6" dir="rtl">
            <DeleteModal
                open={!!deleteTarget}
                title={`حذف دپارتمان "${deleteTarget?.name}"`}
                description="تمام فرآیندها و اعضای این دپارتمان نیز حذف خواهند شد."
                loading={deleteLoading}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />

            <AddDepartmentModal
                open={addDeptOpen}
                onClose={() => setAddDeptOpen(false)}
                onSubmit={handleAddDepartment}
            />

            <AnimatePresence>
                {editDept && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4"
                        style={{
                            background: "rgba(0,0,0,0.45)",
                            backdropFilter: "blur(3px)",
                        }}
                        onClick={() =>
                            !editLoading &&
                            !editSuccess &&
                            setEditDept(null)
                        }
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
                                    onClick={() =>
                                        !editLoading &&
                                        !editSuccess &&
                                        setEditDept(null)
                                    }
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
                                        if (e.key === "Enter") {
                                            handleEditDepartment();
                                        }

                                        if (
                                            e.key === "Escape" &&
                                            !editLoading
                                        ) {
                                            setEditDept(null);
                                        }
                                    }}
                                    disabled={editLoading || editSuccess}
                                    dir="rtl"
                                />

                                <AnimatePresence mode="wait">
                                    {editSuccess ? (
                                        <motion.div
                                            key="success"
                                            initial={{
                                                opacity: 0,
                                                scale: 0.9,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1,
                                            }}
                                            exit={{
                                                opacity: 0,
                                                scale: 0.9,
                                            }}
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
                                                disabled={
                                                    editLoading ||
                                                    !editName.trim()
                                                }
                                                whileTap={{ scale: 0.97 }}
                                                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                                            >
                                                {editLoading ? (
                                                    <Loader
                                                        size={18}
                                                        className="animate-spin"
                                                    />
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
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10">
                        <Building2 size={16} className="text-indigo-500" />
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                            دپارتمان‌ها
                        </h1>

                        <p className="mt-0.5 text-[11.5px] text-gray-400 dark:text-gray-500">
                            {loading
                                ? "در حال بارگذاری..."
                                : `${departments.length} دپارتمان فعال در سیستم`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                    <button
                        onClick={fetchAll}
                        disabled={loading}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:hover:text-gray-300 bg-black/[0.04] dark:bg-white/[0.05]"
                        title="بارگذاری مجدد"
                        type="button"
                    >
                        <RefreshCw
                            size={13}
                            className={loading ? "animate-spin" : ""}
                        />
                    </button>

                    <button
                        onClick={() => setAddDeptOpen(true)}
                        className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-[12.5px] bg-blue-600 font-bold text-white hover:bg-blue-500 transition-colors sm:flex-none"
                        type="button"
                    >
                        <Plus size={13} strokeWidth={2.5} />
                        <span className="whitespace-nowrap">
                            افزودن دپارتمان
                        </span>
                    </button>
                </div>
            </div>

            {departments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.06]">
                    <Building2
                        size={28}
                        className="text-gray-300 dark:text-gray-600"
                    />
                    <p className="text-[13px] text-gray-400 dark:text-gray-500">
                        دپارتمانی یافت نشد
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {departments.map((dept, index) => (
                        <DepartmentCard
                            key={dept.id}
                            department={dept}
                            index={index}
                            isSelected={false}
                            onDelete={() =>
                                setDeleteTarget({
                                    id: dept.id,
                                    name: dept.name,
                                })
                            }
                            onEdit={() => {
                                setEditDept(dept);
                                setEditName(dept.name);
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    </>
);
 

}
