"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, FileText, Loader2, Search, Upload, X } from "lucide-react";
import { Department, HumanResource, createDocument, updateDocument, uploadDocumentFile } from "./humanResourceApi";
import { gradientOf, initialOf } from "./hrUtils";

interface Props {
    open: boolean;
    document: HumanResource | null;
    departments: Department[];
    onClose: () => void;
    onSaved: () => void;
}

function UsersIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

const Tick = () => (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600">
        <Check size={11} className="text-white" strokeWidth={3} />
    </span>
);

function NiceSelect({ value, departments, onChange }: { value: string; departments: Department[]; onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            setQuery("");
            return;
        }
        const h = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        window.document.addEventListener("mousedown", h);
        return () => window.document.removeEventListener("mousedown", h);
    }, [open]);

    const sorted = useMemo(() => departments.slice().sort((a, b) => a.order - b.order), [departments]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? sorted.filter((d) => d.name.toLowerCase().includes(q)) : sorted;
    }, [query, sorted]);

    const selected = sorted.find((d) => String(d.id) === value);
    const pick = (v: string) => {
        onChange(v);
        setOpen(false);
    };

    return (
        <div ref={ref} className="relative">
            <label className="mb-2 block text-[11.5px] font-bold text-gray-400">دسترسی</label>

            <button
                type="button"
                onClick={() => setOpen((s) => !s)}
                className={`flex h-[52px] w-full items-center gap-2.5 rounded-2xl border px-3 text-right transition-all ${open
                    ? "border-indigo-500 bg-indigo-50/50 dark:border-indigo-500/50 dark:bg-indigo-500/[0.06]"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12]"
                    }`}
            >
                {selected ? (
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradientOf(selected.id)} text-[12px] font-extrabold text-white`}>
                        {initialOf(selected.name)}
                    </span>
                ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.06]">
                        <UsersIcon />
                    </span>
                )}

                <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[12.5px] font-bold ${selected ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
                        {selected ? selected.name : "برای همه"}
                    </span>
                    <span className="mt-0.5 block truncate text-[10.5px] text-gray-400">
                        {selected ? "دسترسی مخصوص این دپارتمان" : "قابل مشاهده برای همه"}
                    </span>
                </span>

                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={14} className="text-gray-400" />
                </motion.span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ type: "spring", damping: 24, stiffness: 340 }}
                        className="absolute z-50 mt-2 w-full origin-top overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-xl shadow-black/5 dark:border-white/[0.08] dark:bg-[#0f172a] dark:shadow-black/40"
                    >
                        <div className="border-b border-gray-100 p-2.5 dark:border-white/[0.06]">
                            <button
                                type="button"
                                onClick={() => pick("")}
                                className={`flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-right transition ${!value ? "bg-indigo-50 dark:bg-indigo-500/10" : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"}`}
                            >
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.06]">
                                    <UsersIcon />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[12px] font-bold text-gray-900 dark:text-white">برای همه</span>
                                    <span className="mt-0.5 block text-[10px] text-gray-400">بدون محدودیت دپارتمان</span>
                                </span>
                                {!value && <Tick />}
                            </button>
                        </div>

                        {sorted.length > 5 && (
                            <div className="border-b border-gray-100 px-3 py-2.5 dark:border-white/[0.06]">
                                <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.04]">
                                    <Search size={13} className="shrink-0 text-gray-400" />
                                    <input
                                        autoFocus
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="جستجوی دپارتمان..."
                                        className="w-full bg-transparent text-[12px] font-semibold text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="max-h-56 overflow-y-auto p-1.5">
                            {visible.length === 0 ? (
                                <p className="py-6 text-center text-[11px] text-gray-400">دپارتمانی یافت نشد</p>
                            ) : (
                                visible.map((d, i) => {
                                    const active = String(d.id) === value;
                                    return (
                                        <motion.button
                                            key={d.id}
                                            type="button"
                                            initial={{ opacity: 0, x: 6 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                            onClick={() => pick(String(d.id))}
                                            className={`flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-right transition-colors ${active ? "bg-indigo-50 dark:bg-indigo-500/10" : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"}`}
                                        >
                                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradientOf(d.id)} text-[12px] font-extrabold text-white`}>
                                                {initialOf(d.name)}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className={`block truncate text-[12.5px] font-bold ${active ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>
                                                    {d.name}
                                                </span>
                                                <span className="mt-0.5 block text-[10px] text-gray-400">دسترسی اختصاصی</span>
                                            </span>
                                            {active && <Tick />}
                                        </motion.button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function HumanResourceForm({ open, document, departments, onClose, onSaved }: Props) {
    const [title, setTitle] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        const dep = document && departments.find((d) => d.name === document.title);
        setTitle(document?.title ?? "");
        setDepartmentId(dep ? String(dep.id) : "");
        setFile(null);
    }, [open, document, departments]);

    const handleDepartmentChange = (value: string) => {
        setDepartmentId(value);
        setTitle(departments.find((d) => String(d.id) === value)?.name ?? "");
    };

    const save = async () => {
        const t = title.trim();
        if (!t) return;

        try {
            setSaving(true);
            let id = document?.id;

            if (document) {
                if (t !== document.title) await updateDocument(document.id, { title: t });
            } else {
                id = (await createDocument({ title: t })).data.id;
            }

            if (file && id) await uploadDocumentFile(id, file);

            onSaved();
            onClose();
        } catch (e) {
            const d = (e as any)?.response?.data;
            const msg = typeof d === "object" && d ? d.detail || d.title?.[0] : "";
            alert(msg || "ذخیره‌سازی انجام نشد، دوباره تلاش کنید.");
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
                onMouseDown={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.98 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-2xl shadow-black/10 dark:border-white/[0.06] dark:bg-[#0f172a]"
                    dir="rtl"
                >
                    <div className="flex shrink-0 items-center justify-between px-8 pb-6 pt-8">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
                                <FileText size={15} className="text-indigo-500" />
                            </div>
                            <div>
                                <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    {document ? "ویرایش منبع انسانی" : "ایجاد منبع انسانی"}
                                </h2>
                                <p className="mt-0.5 text-[11px] text-gray-400">تعیین دسترسی و اطلاعات منبع</p>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition hover:text-gray-600 dark:bg-white/[0.05] dark:hover:text-gray-300">
                            <X size={15} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 pb-2">
                        <div className="flex flex-col gap-4">
                            <NiceSelect value={departmentId} departments={departments} onChange={handleDepartmentChange} />

                            <div>
                                <label className="mb-2 block text-[11.5px] font-bold text-gray-400">عنوان منبع انسانی</label>
                                <div className="relative">
                                    <input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        readOnly={!!departmentId}
                                        placeholder=" "
                                        className={`peer h-[52px] w-full rounded-2xl border bg-gray-50 px-4 pt-4 text-[12.5px] font-bold text-gray-900 outline-none transition-colors dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white ${departmentId ? "cursor-not-allowed opacity-70" : "border-gray-100 focus:border-indigo-500"}`}
                                    />
                                    <label className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-gray-400 transition-all duration-200 peer-focus:top-[15px] peer-focus:text-[10px] peer-focus:text-indigo-500 peer-[:not(:placeholder-shown)]:top-[15px] peer-[:not(:placeholder-shown)]:text-[10px]">
                                        عنوان منبع
                                    </label>
                                </div>
                                {departmentId && (
                                    <p className="mt-1.5 text-[10.5px] font-semibold leading-5 text-gray-400">
                                        عنوان این منبع دقیقاً برابر نام دپارتمان انتخاب‌شده است.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-[11.5px] font-bold text-gray-400">فایل</label>
                                <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-3.5 py-3 transition-colors hover:border-indigo-400 hover:bg-indigo-50/40 dark:border-white/[0.1] dark:bg-white/[0.02] dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/[0.05]">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm dark:bg-white/[0.06]">
                                        <Upload size={14} />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[12px] font-bold text-gray-600 dark:text-gray-300">
                                            {file ? file.name : "افزودن فایل"}
                                        </span>
                                        <span className="mt-0.5 block text-[10px] text-gray-400">فایل موردنظر را انتخاب کنید</span>
                                    </span>
                                    <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0 px-8 pb-8 pt-5">
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={save}
                            disabled={saving || !title.trim()}
                            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-indigo-600 text-[13px] font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
                            {document ? "ذخیره تغییرات" : "ایجاد منبع انسانی"}
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}