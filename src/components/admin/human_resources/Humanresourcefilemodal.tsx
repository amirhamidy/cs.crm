"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Check, FilePlus, FileText, Loader2, Upload, X } from "lucide-react";
import { HumanResource, uploadDocumentFile } from "./humanResourceApi";
import { extractError } from "./hrUtils";

interface Props {
    open: boolean;
    document: HumanResource | null;
    onClose: () => void;
    onSaved: () => void;
}


export default function HumanResourceFileModal({ open, document, onClose, onSaved }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [fileTitle, setFileTitle] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!open) return;
        setFile(null);
        setFileTitle("");
        setError(null);
        setSaving(false);
    }, [open, document?.id]);

    const canSave = !!document && !!file && !!fileTitle.trim() && !saving;

    const save = async () => {
        if (!document || !file || !canSave) return;
        try {
            setSaving(true);
            setError(null);
            await uploadDocumentFile(document.id, file, fileTitle.trim());
            onSaved();
            onClose();
        } catch (e) {
            setError(extractError(e, "آپلود فایل انجام نشد، دوباره تلاش کنید."));
        } finally {
            setSaving(false);
        }
    };

    if (!open || !document) return null;

    return (
        <AnimatePresence>
            <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
                onMouseDown={() => !saving && onClose()}
            >
                <m.div
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.98 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-2xl shadow-black/10 dark:border-white/[0.06] dark:bg-[#111827]"
                    dir="rtl"
                >
                    <div className="flex shrink-0 items-center justify-between px-8 pb-6 pt-8">
                        <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
                                <FilePlus size={15} className="text-indigo-500" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">افزودن فایل</h2>
                                <p className="mt-0.5 truncate text-[11px] text-gray-400">برای «{document.title}»</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                        >
                            <X size={15} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 pb-2">
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="mb-2 block text-[11.5px] font-bold text-gray-400">فایل</label>
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    className="flex w-full items-center gap-2.5 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-3.5 py-3 text-right transition-colors hover:border-indigo-400 hover:bg-indigo-50/40 dark:border-white/[0.1] dark:bg-white/[0.02] dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/[0.05]"
                                >
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm dark:bg-white/[0.06]">
                                        {file ? <FileText size={14} className="text-indigo-500" /> : <Upload size={14} />}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[12px] font-bold text-gray-600 dark:text-gray-300">
                                            {file ? file.name : "انتخاب فایل"}
                                        </span>
                                        <span className="mt-0.5 block text-[10px] text-gray-400">
                                            {file ? "برای تغییر فایل دوباره کلیک کنید" : "فایل موردنظر را انتخاب کنید"}
                                        </span>
                                    </span>
                                </button>
                                <input
                                    ref={inputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                        const picked = e.target.files?.[0] ?? null;
                                        setFile(picked);
                                        if (picked && !fileTitle.trim()) setFileTitle(picked.name);
                                        e.target.value = "";
                                    }}
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-[11.5px] font-bold text-gray-400">نام فایل</label>
                                <input
                                    value={fileTitle}
                                    onChange={(e) => setFileTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && save()}
                                    placeholder="مثلاً: فرم استخدام"
                                    className="h-[52px] w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 text-[12.5px] font-bold text-gray-900 outline-none transition-colors focus:border-indigo-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mx-8 mb-1 mt-3 rounded-2xl bg-rose-50 px-3.5 py-2.5 text-[11px] font-bold leading-5 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                            {error}
                        </div>
                    )}

                    <div className="flex shrink-0 px-8 pb-8 pt-5">
                        <m.button
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={save}
                            disabled={!canSave}
                            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-indigo-600 text-[13px] font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
                            {saving ? "در حال آپلود..." : "افزودن فایل"}
                        </m.button>
                    </div>
                </m.div>
            </m.div>
        </AnimatePresence>
    );
}