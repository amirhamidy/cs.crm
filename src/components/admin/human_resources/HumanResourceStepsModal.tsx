"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Check,
    Edit3,
    Loader2,
    Plus,
    Trash2,
    X,
} from "lucide-react";
import HumanResourceStepRoadmap from "./HumanResourceStepRoadmap";
import {
    HumanResource,
    HumanResourceStep,
    createStep,
    deleteStep,
    getDocumentSteps,
    updateStep,
} from "./humanResourceApi";

interface Props {
    open: boolean;
    document: HumanResource | null;
    canManage: boolean;
    onClose: () => void;
    onChange: () => void;
}

export default function HumanResourceStepsModal({
    open,
    document,
    canManage,
    onClose,
    onChange,
}: Props) {
    const [steps, setSteps] = useState<HumanResourceStep[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<number | null>(null);
    const [title, setTitle] = useState("");

    const loadSteps = async () => {
        if (!document) return;

        try {
            setLoading(true);
            const response = await getDocumentSteps(document.id);
            setSteps(response.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && document) loadSteps();
    }, [open, document]);

    const resetForm = () => {
        setEditing(null);
        setTitle("");
    };

    const saveStep = async () => {
        if (!document || !title.trim()) return;

        try {
            setSaving(true);

            if (editing) {
                await updateStep(editing, {
                    order:
                        steps.find((item) => item.id === editing)?.order ??
                        steps.length + 1,
                    title: title.trim(),
                });
            } else {
                await createStep(document.id, {
                    order: steps.length + 1,
                    title: title.trim(),
                });
            }

            resetForm();
            await loadSteps();
            onChange();
        } finally {
            setSaving(false);
        }
    };

    const editStep = (step: HumanResourceStep) => {
        setEditing(step.id);
        setTitle(step.title);
    };

    const removeStep = async (id: number) => {
        if (!confirm("آیا از حذف این مرحله مطمئن هستید؟")) return;

        await deleteStep(id);
        await loadSteps();
        onChange();
    };

    return (
        <AnimatePresence>
            {open && document && (
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
                        transition={{ duration: 0.2 }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border bg-background shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b px-5 py-4">
                            <div>
                                <h2 className="font-bold">
                                    مراحل {document.title}
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    مسیر انجام فرآیند
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="flex h-9 w-9 items-center justify-center rounded-xl transition hover:bg-muted"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-5">
                            {canManage && (
                                <div className="mb-6 rounded-2xl border bg-muted/30 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        <input
                                            value={title}
                                            onChange={(e) =>
                                                setTitle(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter")
                                                    saveStep();
                                            }}
                                            placeholder="عنوان مرحله..."
                                            className="h-11 flex-1 rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-primary"
                                        />

                                        <button
                                            onClick={saveStep}
                                            disabled={
                                                saving || !title.trim()
                                            }
                                            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : editing ? (
                                                <Check className="h-4 w-4" />
                                            ) : (
                                                <Plus className="h-4 w-4" />
                                            )}

                                            {editing
                                                ? "ذخیره تغییرات"
                                                : "افزودن مرحله"}
                                        </button>

                                        {editing && (
                                            <button
                                                onClick={resetForm}
                                                className="h-11 rounded-xl border px-4 text-sm"
                                            >
                                                لغو
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {loading ? (
                                <div className="flex justify-center py-16">
                                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                                </div>
                            ) : (
                                <>
                                    <HumanResourceStepRoadmap
                                        steps={steps}
                                    />

                                    {canManage && steps.length > 0 && (
                                        <div className="mt-8 space-y-2 border-t pt-5">
                                            {steps
                                                .slice()
                                                .sort(
                                                    (a, b) =>
                                                        a.order - b.order
                                                )
                                                .map((step) => (
                                                    <div
                                                        key={step.id}
                                                        className="flex items-center gap-3 rounded-xl border p-3"
                                                    >
                                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                                                            {step.order}
                                                        </span>

                                                        <span className="min-w-0 flex-1 truncate text-sm">
                                                            {step.title}
                                                        </span>

                                                        <button
                                                            onClick={() =>
                                                                editStep(step)
                                                            }
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-muted"
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                removeStep(
                                                                    step.id
                                                                )
                                                            }
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-destructive transition hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}