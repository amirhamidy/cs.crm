"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Loader2,
    Upload,
    X,
} from "lucide-react";
import {
    Department,
    HumanResource,
    createDocument,
    updateDocument,
    uploadDocumentFile,
} from "./humanResourceApi";

interface Props {
    open: boolean;
    document: HumanResource | null;
    departments: Department[];
    onClose: () => void;
    onSaved: () => void;
}

export default function HumanResourceForm({
    open,
    document,
    departments,
    onClose,
    onSaved,
}: Props) {
    const [title, setTitle] = useState("");
    const [departmentId, setDepartmentId] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;

        if (document) {
            setTitle(document.title);

            const department = departments.find(
                (item) => item.name === document.title
            );

            setDepartmentId(department ? String(department.id) : "");
        } else {
            setTitle("");
            setDepartmentId("");
            setFile(null);
        }
    }, [open, document, departments]);

    const handleDepartmentChange = (value: string) => {
        setDepartmentId(value);

        if (!value) {
            setTitle("");
            return;
        }

        const department = departments.find(
            (item) => String(item.id) === value
        );

        setTitle(department?.name ?? "");
    };

    const save = async () => {
        if (!title.trim()) return;

        try {
            setSaving(true);

            let savedDocument: HumanResource;

            if (document) {
                const response = await updateDocument(
                    document.id,
                    { title: title.trim() }
                );
                savedDocument = response.data;
            } else {
                const response = await createDocument({
                    title: title.trim(),
                });
                savedDocument = response.data;
            }

            if (file) {
                await uploadDocumentFile(savedDocument.id, file);
            }

            onSaved();
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    onMouseDown={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 15 }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="w-full max-w-lg overflow-hidden rounded-3xl border bg-background shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b px-5 py-4">
                            <div>
                                <h2 className="font-bold">
                                    {document
                                        ? "ویرایش منبع انسانی"
                                        : "ایجاد منبع انسانی"}
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    تعیین عنوان و سطح دسترسی
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="flex h-9 w-9 items-center justify-center rounded-xl transition hover:bg-muted"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-5 p-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    دسترسی
                                </label>

                                <select
                                    value={departmentId}
                                    onChange={(e) =>
                                        handleDepartmentChange(e.target.value)
                                    }
                                    className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary"
                                >
                                    <option value="">برای همه</option>

                                    {departments
                                        .slice()
                                        .sort((a, b) => a.order - b.order)
                                        .map((department) => (
                                            <option
                                                key={department.id}
                                                value={department.id}
                                            >
                                                {department.name}
                                            </option>
                                        ))}
                                </select>

                                <p className="mt-2 text-xs text-muted-foreground">
                                    در حالت «برای همه»، عنوان با هیچ دپارتمانی
                                    تطبیق داده نمی‌شود و منبع برای همه قابل
                                    مشاهده است.
                                </p>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    عنوان منبع انسانی
                                </label>

                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    readOnly={!!departmentId}
                                    placeholder="مثلاً قوانین شرکت"
                                    className={`h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-primary ${departmentId
                                            ? "cursor-not-allowed bg-muted/50"
                                            : ""
                                        }`}
                                />

                                {departmentId && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        عنوان این منبع دقیقاً برابر نام
                                        دپارتمان انتخاب‌شده قرار می‌گیرد.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    فایل
                                </label>

                                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed p-4 transition hover:bg-muted/50">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Upload className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium">
                                            {file ? file.name : "انتخاب فایل"}
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            فایل موردنظر را انتخاب کنید.
                                        </p>
                                    </div>

                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) =>
                                            setFile(e.target.files?.[0] ?? null)
                                        }
                                    />
                                </label>
                            </div>

                            <button
                                onClick={save}
                                disabled={saving || !title.trim()}
                                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}

                                {document
                                    ? "ذخیره تغییرات"
                                    : "ایجاد منبع انسانی"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}