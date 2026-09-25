"use client";

import {
    FileText,
    GitBranch,
    Pencil,
    Trash2,
} from "lucide-react";
import {
    Department,
    HumanResource,
    deleteDocumentFile,
} from "./humanResourceApi";

interface Props {
    document: HumanResource;
    departments: Department[];
    canManage: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onSteps: () => void;
    onChange: () => void;
}

export default function HumanResourceCard({
    document,
    departments,
    canManage,
    onEdit,
    onDelete,
    onSteps,
    onChange,
}: Props) {
    const matchedDepartment = departments.find(
        (department) => department.name === document.title
    );

    const removeFile = async (id: number) => {
        if (!confirm("آیا از حذف فایل مطمئن هستید؟")) return;

        await deleteDocumentFile(id);
        onChange();
    };

    return (
        <div className="group rounded-3xl border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <FileText className="h-6 w-6" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="truncate font-bold">
                                {document.title}
                            </h3>

                            <div className="mt-2 inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                                {matchedDepartment
                                    ? `دپارتمان ${matchedDepartment.name}`
                                    : "قابل مشاهده برای همه"}
                            </div>
                        </div>

                        {canManage && (
                            <div className="flex shrink-0 gap-1">
                                <button
                                    onClick={onEdit}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-muted"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>

                                <button
                                    onClick={onDelete}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-destructive transition hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {document.files.length > 0 && (
                <div className="mt-5 space-y-2">
                    {document.files.map((file) => (
                        <div
                            key={file.id}
                            className="flex items-center gap-3 rounded-xl border p-3"
                        >
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />

                            <a
                                href={file.file}
                                target="_blank"
                                rel="noreferrer"
                                className="min-w-0 flex-1 truncate text-sm text-primary hover:underline"
                            >
                                مشاهده فایل
                            </a>

                            {canManage && (
                                <button
                                    onClick={() => removeFile(file.id)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-destructive transition hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-5 flex items-center gap-2">
                <button
                    onClick={onSteps}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                    <GitBranch className="h-4 w-4" />
                    مشاهده مراحل
                </button>
            </div>
        </div>
    );
}