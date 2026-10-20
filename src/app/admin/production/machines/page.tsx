"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Factory,
    Plus,
    SquarePen,
    Power,
    Check,
    X,
    AlertCircle,
    Loader2,
    TrendingUp,
    BarChart3,
    AlertTriangle,
    ClipboardList,
    Trash2,
    ChevronDown,
    Search,
    CalendarDays,
    Gauge,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { toPersianDigits } from "@/lib/jalali";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface Machine {
    id: number;
    name: string;
    code: string;
    std_production_per_hour: string;
    std_waste_per_hour: string;
    is_active: boolean;
    created_at: string;
}

interface ProductionLog {
    id: number;
    date: string;
    employee: number;
    employee_name: string;
    machine: number;
    machine_name: string;
    machine_code: string;
    hours_worked: string;
    produced_qty: number;
    waste_qty: number;
    note: string;
    expected_production: string;
    expected_waste: string;
    efficiency: number | null;
}

interface EmployeeItem {
    id: number;
    full_name: string;
    username: string;
}

interface Option {
    id: number;
    label: string;
    sub?: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const GRADIENTS = [
    "from-blue-500 to-indigo-500",
    "from-violet-500 to-fuchsia-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
    "from-cyan-500 to-sky-500",
];

const gradientOf = (seed: number) => GRADIENTS[Math.abs(seed) % GRADIENTS.length];
const initialOf = (text: string) => (text || "").trim().charAt(0) || "؟";

function extractList<T>(data: unknown): T[] {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === "object") {
        const obj = data as { results?: T[]; data?: T[] };
        if (Array.isArray(obj.results)) return obj.results;
        if (Array.isArray(obj.data)) return obj.data;
    }
    return [];
}

function parseBackendError(error: unknown, fallback: string): string {
    const data = (error as { response?: { data?: unknown } })?.response?.data;
    if (!data) return fallback;
    if (typeof data === "string") return data.length < 200 ? data : fallback;
    if (Array.isArray(data)) return String(data[0] ?? fallback);
    if (typeof data === "object") {
        const first = Object.values(data as Record<string, unknown>)[0];
        if (Array.isArray(first)) return String(first[0]);
        if (typeof first === "string") return first;
    }
    return fallback;
}

const INPUT_CLS =
    "h-[52px] w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 text-[12.5px] font-bold text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:focus:border-blue-500/50";

const SOFT_BUTTON =
    "rounded-full bg-gray-100 text-[13px] font-bold text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.08]";

/* -------------------------------------------------------------------------- */
/*                              Shared form pieces                            */
/* -------------------------------------------------------------------------- */

function FloatingInput({
    label,
    id,
    value,
    onChange,
    maxLength,
    ltr = false,
}: {
    label: string;
    id: string;
    value: string;
    onChange: (value: string) => void;
    maxLength?: number;
    ltr?: boolean;
}) {
    return (
        <div className="relative">
            <input
                id={id}
                type="text"
                placeholder=" "
                value={value}
                maxLength={maxLength}
                dir={ltr ? "ltr" : undefined}
                onChange={(e) => onChange(e.target.value)}
                className={`peer pt-4 ${INPUT_CLS} ${ltr ? "text-left font-mono" : ""}`}
            />
            <label
                htmlFor={id}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-gray-400 transition-all duration-200 peer-focus:top-[15px] peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-[15px] peer-[:not(:placeholder-shown)]:text-[10px]"
            >
                {label}
            </label>
        </div>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <label className="mb-2 block text-[11.5px] font-bold text-gray-400">{label}</label>
            {children}
        </div>
    );
}

function NumberField({
    label,
    value,
    onChange,
    step,
    min,
    max,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    step?: string;
    min?: string;
    max?: string;
}) {
    return (
        <Field label={label}>
            <input
                type="number"
                inputMode="decimal"
                dir="ltr"
                step={step}
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`${INPUT_CLS} text-left`}
            />
        </Field>
    );
}

function NiceSelect({
    label,
    options,
    value,
    onChange,
    placeholder,
    emptyText,
    loading = false,
    disabled = false,
}: {
    label: string;
    options: Option[];
    value: number | null;
    onChange: (id: number) => void;
    placeholder: string;
    emptyText: string;
    loading?: boolean;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    const selected = options.find((o) => o.id === value) ?? null;

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (!open) setQuery("");
    }, [open]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter(
            (o) => o.label.toLowerCase().includes(q) || o.sub?.toLowerCase().includes(q)
        );
    }, [options, query]);

    return (
        <div ref={ref} className="relative">
            <label className="mb-2 block text-[11.5px] font-bold text-gray-400">{label}</label>

            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((v) => !v)}
                className={`flex h-[52px] w-full items-center gap-2.5 rounded-2xl border px-3 text-right transition-all duration-200 ${open
                    ? "border-blue-500 bg-blue-50/50 dark:border-blue-500/50 dark:bg-blue-500/[0.06]"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12]"
                    } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
            >
                {selected ? (
                    <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(
                            selected.id
                        )}`}
                    >
                        {initialOf(selected.label)}
                    </span>
                ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.06]">
                        {loading ? (
                            <Loader2 size={13} className="animate-spin text-gray-400" />
                        ) : (
                            <ChevronDown size={13} className="text-gray-400" />
                        )}
                    </span>
                )}

                <span className="min-w-0 flex-1">
                    <span
                        className={`block truncate text-[12.5px] font-bold ${selected ? "text-gray-900 dark:text-white" : "text-gray-400"
                            }`}
                    >
                        {loading ? "در حال بارگذاری..." : selected?.label || placeholder}
                    </span>
                    {selected?.sub && (
                        <span className="mt-0.5 block truncate text-[10.5px] text-gray-400">
                            {selected.sub}
                        </span>
                    )}
                </span>

                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={14} className="shrink-0 text-gray-400" />
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
                        {options.length > 5 && (
                            <div className="border-b border-gray-100 px-3 py-2.5 dark:border-white/[0.06]">
                                <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.04]">
                                    <Search size={13} className="shrink-0 text-gray-400" />
                                    <input
                                        autoFocus
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="جستجو..."
                                        className="w-full bg-transparent text-[12px] font-semibold text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="max-h-56 overflow-y-auto p-1.5">
                            {visible.length === 0 ? (
                                <p className="py-6 text-center text-[12px] text-gray-400">{emptyText}</p>
                            ) : (
                                visible.map((option, index) => {
                                    const active = option.id === value;
                                    return (
                                        <motion.button
                                            key={option.id}
                                            type="button"
                                            initial={{ opacity: 0, x: 6 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: Math.min(index, 10) * 0.02 }}
                                            onClick={() => {
                                                onChange(option.id);
                                                setOpen(false);
                                            }}
                                            className={`flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-right transition-colors ${active
                                                ? "bg-blue-50 dark:bg-blue-500/10"
                                                : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                                                }`}
                                        >
                                            <span
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(
                                                    option.id
                                                )}`}
                                            >
                                                {initialOf(option.label)}
                                            </span>

                                            <span className="min-w-0 flex-1">
                                                <span
                                                    className={`block truncate text-[12.5px] font-bold ${active
                                                        ? "text-blue-600 dark:text-blue-400"
                                                        : "text-gray-900 dark:text-white"
                                                        }`}
                                                >
                                                    {option.label}
                                                </span>
                                                {option.sub && (
                                                    <span className="mt-0.5 block truncate text-[10.5px] text-gray-400">
                                                        {option.sub}
                                                    </span>
                                                )}
                                            </span>

                                            {active && (
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600">
                                                    <Check size={11} className="text-white" strokeWidth={3} />
                                                </span>
                                            )}
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

function StatusSwitch({
    isActive,
    loading = false,
    disabled = false,
    title,
    onToggle,
}: {
    isActive: boolean;
    loading?: boolean;
    disabled?: boolean;
    title?: string;
    onToggle: () => void;
}) {
    const trackClass = isActive
        ? "border-emerald-500/30 bg-emerald-500/[0.14] dark:border-emerald-500/40 dark:bg-emerald-500/20"
        : "border-slate-400/35 bg-[#e9ecf1] dark:border-slate-400/30 dark:bg-slate-400/[0.16]";

    const knobClass = isActive
        ? "translate-x-0 bg-emerald-500"
        : "translate-x-6 bg-slate-400 dark:bg-slate-500";

    return (
        <button
            type="button"
            role="switch"
            aria-checked={isActive}
            dir="ltr"
            title={title}
            disabled={disabled || loading}
            onClick={(e) => {
                e.stopPropagation();
                onToggle();
            }}
            className={`relative inline-flex h-7 w-[52px] shrink-0 items-center rounded-full border-[1.5px] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 ${trackClass} ${disabled ? "cursor-not-allowed opacity-55" : loading ? "cursor-wait" : "cursor-pointer"
                }`}
        >
            <span
                className={`absolute left-[1.5px] top-[1.5px] flex h-6 w-6 items-center justify-center rounded-full text-white shadow-[0_2px_6px_rgba(15,23,42,0.22)] transition-[transform,background-color] duration-200 ${knobClass}`}
            >
                {loading ? (
                    <Loader2 size={12} className="animate-spin" />
                ) : isActive ? (
                    <Check size={13} strokeWidth={3.2} />
                ) : (
                    <Power size={12} strokeWidth={2.6} />
                )}
            </span>
        </button>
    );
}

function ErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
    return (
        <AnimatePresence>
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10"
                >
                    <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                    <p className="flex-1 text-[11.5px] font-semibold leading-5 text-red-500 dark:text-red-400">
                        {message}
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 text-red-400 transition-colors hover:text-red-600"
                    >
                        <X size={13} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/* -------------------------------------------------------------------------- */
/*                                 Modal shell                                */
/* -------------------------------------------------------------------------- */

function ModalShell({
    icon,
    iconTone = "blue",
    title,
    subtitle,
    locked = false,
    maxWidth = "max-w-md",
    onClose,
    children,
    footer,
}: {
    icon: ReactNode;
    iconTone?: "blue" | "emerald" | "red";
    title: string;
    subtitle?: string;
    locked?: boolean;
    maxWidth?: string;
    onClose: () => void;
    children: ReactNode;
    footer: ReactNode;
}) {
    const onCloseRef = useRef(onClose);
    const lockedRef = useRef(locked);

    useEffect(() => {
        onCloseRef.current = onClose;
        lockedRef.current = locked;
    });

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !lockedRef.current) onCloseRef.current();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);

    const toneClass = {
        blue: "bg-blue-50 dark:bg-blue-500/10",
        emerald: "bg-emerald-50 dark:bg-emerald-500/10",
        red: "bg-red-50 dark:bg-red-500/10",
    }[iconTone];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
            onClick={() => {
                if (!locked) onClose();
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]`}
            >
                <div className="flex shrink-0 items-center justify-between px-8 pb-6 pt-8">
                    <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${toneClass}`}>
                            {icon}
                        </div>
                        <div>
                            <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                {title}
                            </h3>
                            {subtitle && <p className="mt-0.5 text-[11px] text-gray-400">{subtitle}</p>}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={locked}
                        aria-label="بستن"
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                    >
                        <X size={15} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-8 pb-2">
                    <div className="flex flex-col gap-4 pb-2">{children}</div>
                </div>

                <div className="flex shrink-0 items-center gap-2 px-8 pb-8 pt-5">{footer}</div>
            </motion.div>
        </motion.div>
    );
}

/* -------------------------------------------------------------------------- */
/*                               Machine modal                                */
/* -------------------------------------------------------------------------- */

function MachineModal({
    machine,
    onClose,
    onSaved,
}: {
    machine: Machine | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [name, setName] = useState(machine?.name ?? "");
    const [code, setCode] = useState(machine?.code ?? "");
    const [stdProd, setStdProd] = useState(machine?.std_production_per_hour ?? "");
    const [stdWaste, setStdWaste] = useState(machine?.std_waste_per_hour ?? "0");
    const [isActive, setIsActive] = useState(machine?.is_active ?? true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const canSubmit = name.trim() !== "" && code.trim() !== "" && stdProd !== "" && !saving;

    async function handleSave() {
        if (!canSubmit) return;
        setSaving(true);
        setError("");

        const payload = {
            name: name.trim(),
            code: code.trim(),
            std_production_per_hour: stdProd,
            std_waste_per_hour: stdWaste || "0",
            is_active: isActive,
        };

        try {
            if (machine) {
                await axiosInstance.put(`/production/api/v1/machine/${machine.id}/update/`, payload);
            } else {
                await axiosInstance.post("/production/api/v1/machine/create/", payload);
            }
            onSaved();
        } catch (err) {
            setError(parseBackendError(err, "خطا در ذخیره ماشین. احتمالاً کد تکراری است."));
        } finally {
            setSaving(false);
        }
    }

    return (
        <ModalShell
            icon={<Factory size={15} className="text-blue-500" />}
            title={machine ? "ویرایش ماشین" : "تعریف ماشین جدید"}
            subtitle="مشخصات و استانداردهای تولید"
            locked={saving}
            onClose={onClose}
            footer={
                <>
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSave}
                        disabled={!canSubmit}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 text-[13px] font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
                    >
                        {saving ? (
                            <Loader2 size={15} className="animate-spin" />
                        ) : (
                            <>
                                <Check size={14} strokeWidth={3} />
                                ذخیره اطلاعات
                            </>
                        )}
                    </motion.button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className={`h-11 px-6 ${SOFT_BUTTON}`}
                    >
                        انصراف
                    </button>
                </>
            }
        >
            <ErrorBanner message={error} onClose={() => setError("")} />

            <FloatingInput id="machine_name" label="نام ماشین" value={name} onChange={setName} />
            <FloatingInput id="machine_code" label="کد یکتا (مثلاً M-01)" value={code} onChange={setCode} ltr />

            <div className="grid grid-cols-2 gap-3">
                <NumberField
                    label="تولید استاندارد در ساعت"
                    value={stdProd}
                    onChange={setStdProd}
                    step="0.01"
                    min="0"
                />
                <NumberField
                    label="ضایعات استاندارد در ساعت"
                    value={stdWaste}
                    onChange={setStdWaste}
                    step="0.01"
                    min="0"
                />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div>
                    <p className="text-[12.5px] font-bold text-gray-800 dark:text-gray-100">وضعیت ماشین</p>
                    <p className="mt-0.5 text-[10.5px] text-gray-400">
                        {isActive ? "ماشین فعال است و در لیست ثبت لاگ نمایش داده می‌شود" : "ماشین غیرفعال است"}
                    </p>
                </div>
                <StatusSwitch isActive={isActive} onToggle={() => setIsActive((v) => !v)} />
            </div>
        </ModalShell>
    );
}

/* -------------------------------------------------------------------------- */
/*                                  Log modal                                 */
/* -------------------------------------------------------------------------- */

function LogModal({
    machines,
    onClose,
    onSaved,
}: {
    machines: Machine[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const [employees, setEmployees] = useState<EmployeeItem[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);

    const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [employeeId, setEmployeeId] = useState<number | null>(null);
    const [machineId, setMachineId] = useState<number | null>(null);
    const [hours, setHours] = useState("8");
    const [produced, setProduced] = useState("");
    const [waste, setWaste] = useState("0");
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let alive = true;
        axiosInstance
            .get("/accounts/api/v1/employee/list/")
            .then((res) => {
                if (alive) setEmployees(extractList<EmployeeItem>(res.data));
            })
            .catch(() => {
                if (alive) setError("دریافت لیست کارمندان انجام نشد");
            })
            .finally(() => {
                if (alive) setLoadingEmployees(false);
            });
        return () => {
            alive = false;
        };
    }, []);

    const employeeOptions = useMemo<Option[]>(
        () =>
            employees.map((e) => ({
                id: e.id,
                label: e.full_name || e.username,
                sub: `@${e.username}`,
            })),
        [employees]
    );

    const machineOptions = useMemo<Option[]>(
        () =>
            machines
                .filter((m) => m.is_active)
                .map((m) => ({ id: m.id, label: m.name, sub: `کد: ${m.code}` })),
        [machines]
    );

    const canSubmit =
        employeeId !== null && machineId !== null && produced !== "" && hours !== "" && !saving;

    async function handleSave() {
        if (!canSubmit) return;
        setSaving(true);
        setError("");

        try {
            await axiosInstance.post("/production/api/v1/log/create/", {
                date,
                employee: employeeId,
                machine: machineId,
                hours_worked: hours,
                produced_qty: Number(produced),
                waste_qty: Number(waste || 0),
                note: note.trim(),
            });
            onSaved();
        } catch (err) {
            setError(
                parseBackendError(
                    err,
                    "خطا در ثبت لاگ. شاید برای این تاریخ و ماشین قبلاً رکوردی ثبت شده باشد."
                )
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <ModalShell
            icon={<ClipboardList size={15} className="text-emerald-500" />}
            iconTone="emerald"
            title="ثبت لاگ تولید"
            subtitle="ثبت رکورد به جای کارمند"
            maxWidth="max-w-lg"
            locked={saving}
            onClose={onClose}
            footer={
                <>
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSave}
                        disabled={!canSubmit}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 text-[13px] font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
                    >
                        {saving ? (
                            <Loader2 size={15} className="animate-spin" />
                        ) : (
                            <>
                                <Check size={14} strokeWidth={3} />
                                ثبت نهایی
                            </>
                        )}
                    </motion.button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className={`h-11 px-6 ${SOFT_BUTTON}`}
                    >
                        انصراف
                    </button>
                </>
            }
        >
            <ErrorBanner message={error} onClose={() => setError("")} />

            <NiceSelect
                label="پرسنل"
                placeholder="انتخاب کارمند"
                emptyText="کارمندی یافت نشد"
                loading={loadingEmployees}
                options={employeeOptions}
                value={employeeId}
                onChange={(id) => {
                    setEmployeeId(id);
                    setError("");
                }}
            />

            <NiceSelect
                label="ماشین"
                placeholder="انتخاب دستگاه"
                emptyText="ماشین فعالی وجود ندارد"
                options={machineOptions}
                value={machineId}
                onChange={(id) => {
                    setMachineId(id);
                    setError("");
                }}
            />

            <div className="grid grid-cols-2 gap-3">
                <Field label="تاریخ (میلادی)">
                    <input
                        type="date"
                        dir="ltr"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={`${INPUT_CLS} font-mono`}
                    />
                </Field>
                <NumberField
                    label="ساعت کار (تا ۲۴)"
                    value={hours}
                    onChange={setHours}
                    step="0.01"
                    min="0.01"
                    max="24"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <NumberField label="تعداد تولید شده" value={produced} onChange={setProduced} min="0" />
                <NumberField label="مقدار ضایعات" value={waste} onChange={setWaste} min="0" />
            </div>

            <FloatingInput
                id="log_note"
                label="توضیحات (اختیاری)"
                value={note}
                onChange={setNote}
                maxLength={255}
            />
        </ModalShell>
    );
}

/* -------------------------------------------------------------------------- */
/*                               Confirm delete                               */
/* -------------------------------------------------------------------------- */

function ConfirmDeleteLog({
    log,
    onClose,
    onDeleted,
}: {
    log: ProductionLog;
    onClose: () => void;
    onDeleted: () => void;
}) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");

    async function handleDelete() {
        setDeleting(true);
        setError("");
        try {
            await axiosInstance.delete(`/production/api/v1/log/${log.id}/delete/`);
            onDeleted();
        } catch (err) {
            setError(parseBackendError(err, "حذف رکورد با خطا مواجه شد"));
        } finally {
            setDeleting(false);
        }
    }

    return (
        <ModalShell
            icon={<Trash2 size={15} className="text-red-500" />}
            iconTone="red"
            title="حذف رکورد تولید"
            maxWidth="max-w-sm"
            locked={deleting}
            onClose={onClose}
            footer={
                <>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-red-600 text-[13px] font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                    >
                        {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={14} />}
                        {deleting ? "در حال حذف..." : "حذف کن"}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className={`h-11 px-6 ${SOFT_BUTTON}`}
                    >
                        انصراف
                    </button>
                </>
            }
        >
            <p className="text-[12.5px] leading-6 text-gray-600 dark:text-gray-400">
                رکورد{" "}
                <span className="font-extrabold text-gray-900 dark:text-white">«{log.employee_name}»</span> روی
                ماشین{" "}
                <span className="font-extrabold text-gray-900 dark:text-white">«{log.machine_name}»</span> در
                تاریخ {toPersianDigits(log.date)} حذف می‌شود. این عملیات قابل بازگشت نیست.
            </p>
            <ErrorBanner message={error} onClose={() => setError("")} />
        </ModalShell>
    );
}

/* -------------------------------------------------------------------------- */
/*                                 Stat card                                  */
/* -------------------------------------------------------------------------- */

function StatCard({
    label,
    value,
    unit,
    icon,
    tone,
}: {
    label: string;
    value: string;
    unit?: string;
    icon: ReactNode;
    tone: "emerald" | "indigo" | "red";
}) {
    const toneMap = {
        emerald: { box: "bg-emerald-500/10 text-emerald-500", text: "text-gray-900 dark:text-white" },
        indigo: { box: "bg-indigo-500/10 text-indigo-500", text: "text-indigo-600 dark:text-indigo-400" },
        red: { box: "bg-red-500/10 text-red-500", text: "text-red-600 dark:text-red-400" },
    }[tone];

    return (
        <div className="flex flex-col justify-between gap-5 rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-bold text-gray-400 dark:text-gray-500">{label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${toneMap.box}`}>
                    {icon}
                </div>
            </div>
            <p className={`text-2xl font-black ${toneMap.text}`}>
                {value}
                {unit && <span className="mr-1 text-[11px] font-bold text-gray-400">{unit}</span>}
            </p>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default function AdminProductionManagementPage() {
    const [machines, setMachines] = useState<Machine[]>([]);
    const [logs, setLogs] = useState<ProductionLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");
    const [togglingId, setTogglingId] = useState<number | null>(null);

    const [machineModal, setMachineModal] = useState<{ open: boolean; machine: Machine | null }>({
        open: false,
        machine: null,
    });
    const [showLogModal, setShowLogModal] = useState(false);
    const [logToDelete, setLogToDelete] = useState<ProductionLog | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [machRes, logsRes] = await Promise.all([
                axiosInstance.get("/production/api/v1/machine/"),
                axiosInstance.get("/production/api/v1/log/"),
            ]);
            setMachines(extractList<Machine>(machRes.data));
            setLogs(extractList<ProductionLog>(logsRes.data));
        } catch (err) {
            setPageError(parseBackendError(err, "دریافت اطلاعات تولید با خطا مواجه شد"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const stats = useMemo(() => {
        let produced = 0;
        let waste = 0;
        let effSum = 0;
        let effCount = 0;

        logs.forEach((l) => {
            produced += Number(l.produced_qty || 0);
            waste += Number(l.waste_qty || 0);
            if (l.efficiency !== null && l.efficiency !== undefined) {
                effSum += Number(l.efficiency);
                effCount++;
            }
        });

        return {
            produced,
            waste,
            avgEfficiency: effCount > 0 ? effSum / effCount : 0,
        };
    }, [logs]);

    async function handleToggleActive(m: Machine) {
        if (togglingId !== null) return;
        setTogglingId(m.id);
        setPageError("");
        try {
            await axiosInstance.patch(`/production/api/v1/machine/${m.id}/update/`, {
                is_active: !m.is_active,
            });
            setMachines((prev) =>
                prev.map((item) => (item.id === m.id ? { ...item, is_active: !m.is_active } : item))
            );
        } catch (err) {
            setPageError(parseBackendError(err, "خطا در تغییر وضعیت ماشین"));
        } finally {
            setTogglingId(null);
        }
    }

    return (
        <div className="mx-auto max-w-7xl space-y-8 p-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                        <Factory size={20} />
                    </div>
                    <div>
                        <h1 className="text-[16px] font-extrabold text-gray-900 dark:text-white">
                            مدیریت تولید و ماشین‌آلات
                        </h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-400">
                            آمار کلیدی، کنترل دستگاه‌ها و سوابق تولید
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowLogModal(true)}
                        className="flex h-11 items-center gap-2 rounded-full bg-emerald-600 px-5 text-[12.5px] font-bold text-white transition-colors hover:bg-emerald-500"
                    >
                        <ClipboardList size={15} />
                        ثبت لاگ جدید
                    </motion.button>
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setMachineModal({ open: true, machine: null })}
                        className="flex h-11 items-center gap-2 rounded-full bg-blue-600 px-5 text-[12.5px] font-bold text-white transition-colors hover:bg-blue-500"
                    >
                        <Plus size={15} />
                        تعریف ماشین
                    </motion.button>
                </div>
            </div>

            <ErrorBanner message={pageError} onClose={() => setPageError("")} />

            {/* Stats */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard
                    label="کل تولید واقعی"
                    value={toPersianDigits(stats.produced.toLocaleString())}
                    unit="عدد"
                    tone="emerald"
                    icon={<TrendingUp size={16} />}
                />
                <StatCard
                    label="میانگین راندمان"
                    value={`${toPersianDigits(stats.avgEfficiency.toFixed(1))}٪`}
                    tone="indigo"
                    icon={<BarChart3 size={16} />}
                />
                <StatCard
                    label="کل ضایعات ثبت‌شده"
                    value={toPersianDigits(stats.waste.toLocaleString())}
                    unit="عدد"
                    tone="red"
                    icon={<AlertTriangle size={16} />}
                />
            </div>

            {/* Machines */}
            <section className="space-y-4">
                <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                    <Factory size={15} className="text-indigo-500" />
                    ماشین‌آلات خط تولید ({toPersianDigits(machines.length)})
                </h2>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 size={22} className="animate-spin text-indigo-500" />
                    </div>
                ) : machines.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-[12px] text-gray-400 dark:border-white/[0.1]">
                        هنوز ماشینی تعریف نشده. با «تعریف ماشین» شروع کنید.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {machines.map((m, index) => (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(index, 8) * 0.03 }}
                                className="flex flex-col gap-3 rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 transition-shadow duration-200 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.35),0_14px_40px_rgba(99,102,241,0.25)] dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:shadow-[0_0_0_1px_rgba(129,140,248,0.45),0_14px_44px_rgba(99,102,241,0.35)]"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div
                                            className={`flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-2xl bg-gradient-to-br text-[15px] font-extrabold text-white ${gradientOf(
                                                m.id
                                            )}`}
                                        >
                                            {initialOf(m.name)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-[13.5px] font-extrabold leading-tight text-gray-800 dark:text-gray-100">
                                                {m.name}
                                            </p>
                                            <p dir="ltr" className="mt-0.5 text-right font-mono text-[11px] text-gray-400 dark:text-gray-500">
                                                {m.code}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setMachineModal({ open: true, machine: m })}
                                        aria-label="ویرایش ماشین"
                                        title="ویرایش"
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-black/[0.14] bg-[#e2e2e2] text-gray-700 transition-all hover:bg-blue-600 hover:text-white active:scale-95 dark:border-white/[0.13] dark:bg-[#1e1e1e] dark:text-gray-200 dark:hover:bg-blue-600"
                                    >
                                        <SquarePen size={15} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 border-t border-black/5 pt-3 dark:border-white/5">
                                    <div className="rounded-xl bg-black/[0.03] px-3 py-2 dark:bg-white/[0.03]">
                                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                            <Gauge size={11} />
                                            تولید در ساعت
                                        </span>
                                        <span className="mt-0.5 block text-[13px] font-extrabold text-gray-800 dark:text-gray-100">
                                            {toPersianDigits(m.std_production_per_hour)}
                                        </span>
                                    </div>
                                    <div className="rounded-xl bg-black/[0.03] px-3 py-2 dark:bg-white/[0.03]">
                                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                            <AlertTriangle size={11} />
                                            ضایعات در ساعت
                                        </span>
                                        <span className="mt-0.5 block text-[13px] font-extrabold text-red-500">
                                            {toPersianDigits(m.std_waste_per_hour)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span
                                        className={`rounded-lg border px-2 py-0.5 text-[10.5px] font-bold ${m.is_active
                                            ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                            : "border-slate-400/30 bg-slate-400/10 text-slate-500 dark:text-slate-400"
                                            }`}
                                    >
                                        {m.is_active ? "فعال" : "غیرفعال"}
                                    </span>
                                    <StatusSwitch
                                        isActive={m.is_active}
                                        loading={togglingId === m.id}
                                        disabled={togglingId !== null && togglingId !== m.id}
                                        title={m.is_active ? "غیرفعال‌سازی ماشین" : "فعال‌سازی ماشین"}
                                        onToggle={() => handleToggleActive(m)}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            {/* Logs */}
            <section className="space-y-4">
                <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                    <ClipboardList size={15} className="text-emerald-500" />
                    سوابق تولید ({toPersianDigits(logs.length)})
                </h2>

                <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-[#fafafa] dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-right text-[12px]">
                            <thead>
                                <tr className="border-b border-black/5 text-[11px] text-gray-400 dark:border-white/5">
                                    {["تاریخ", "پرسنل", "ماشین", "ساعت کار", "تولید", "انتظاری", "ضایعات", "راندمان", ""].map(
                                        (h, i) => (
                                            <th key={i} className="whitespace-nowrap px-4 py-3 font-bold">
                                                {h}
                                            </th>
                                        )
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                {logs.map((log) => {
                                    const eff = log.efficiency;
                                    const effClass =
                                        eff === null
                                            ? ""
                                            : eff >= 90
                                                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                : eff >= 70
                                                    ? "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                    : "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400";

                                    return (
                                        <tr
                                            key={log.id}
                                            className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                                        >
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                                    <CalendarDays size={12} className="shrink-0" />
                                                    {toPersianDigits(log.date)}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 font-extrabold text-gray-800 dark:text-gray-100">
                                                {log.employee_name}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">
                                                {log.machine_name}{" "}
                                                <span className="font-mono text-[10px] text-gray-400">
                                                    ({log.machine_code})
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">
                                                {toPersianDigits(log.hours_worked)} ساعت
                                            </td>
                                            <td className="px-4 py-3 font-black text-emerald-600 dark:text-emerald-400">
                                                {toPersianDigits(log.produced_qty.toLocaleString())}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400">
                                                {toPersianDigits(Number(log.expected_production).toFixed(1))}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-red-500">
                                                {toPersianDigits(log.waste_qty)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {eff !== null ? (
                                                    <span
                                                        className={`rounded-lg border px-2 py-0.5 text-[10.5px] font-bold ${effClass}`}
                                                    >
                                                        {toPersianDigits(eff.toFixed(1))}٪
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setLogToDelete(log)}
                                                    aria-label="حذف رکورد"
                                                    title="حذف"
                                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-500 transition-colors hover:bg-red-500 hover:text-white"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {!loading && logs.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-[12px] text-gray-400">
                                            هنوز رکوردی ثبت نشده. با «ثبت لاگ جدید» اولین رکورد را اضافه کنید.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Modals */}
            <AnimatePresence>
                {machineModal.open && (
                    <MachineModal
                        key={machineModal.machine?.id ?? "new"}
                        machine={machineModal.machine}
                        onClose={() => setMachineModal({ open: false, machine: null })}
                        onSaved={() => {
                            setMachineModal({ open: false, machine: null });
                            fetchData();
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showLogModal && (
                    <LogModal
                        key="log-modal"
                        machines={machines}
                        onClose={() => setShowLogModal(false)}
                        onSaved={() => {
                            setShowLogModal(false);
                            fetchData();
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {logToDelete && (
                    <ConfirmDeleteLog
                        key="delete-log"
                        log={logToDelete}
                        onClose={() => setLogToDelete(null)}
                        onDeleted={() => {
                            setLogToDelete(null);
                            fetchData();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}