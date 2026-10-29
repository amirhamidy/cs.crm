"use client";



import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { m } from "framer-motion";
import { Check, ClipboardList, Eye, Factory, Loader2, Trash2, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { calcHoursWorked } from "@/lib/productionTime";
import { toPersianDigits } from "@/lib/jalali";
import {
  ErrorBanner,
  FloatingInput,
  InfoBanner,
  JalaliDatePicker,
  NiceSelect,
  NumberField,
  SOFT_BUTTON,
  StatusSwitch,
  TimeField,
  fetchAllEmployeesCached,
  isoToJalaliString,
  parseBackendError,
  todayGregorian,
} from "./_shared";
import type {
  EmployeeItem,
  Machine,
  Option,
  ProductionLog,
} from "./_shared";

export function ModalShell({
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
    iconTone?: "blue" | "emerald" | "red" | "indigo";
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
        indigo: "bg-indigo-50 dark:bg-indigo-500/10",
    }[iconTone];

    return createPortal(
        <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-[99999] flex items-center justify-center px-4"
            style={{ isolation: "isolate" }}
            onClick={() => {
                if (!locked) onClose();
            }}
            dir="rtl"
        >
            <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="absolute inset-0 bg-black/45"
                style={{ backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)", pointerEvents: "none" }}
            />
            <m.div
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.97 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`relative flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.22)] dark:border-white/[0.06] dark:bg-[#0f172a]`}
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
            </m.div>
        </m.div>,
        document.body
    );
}

export function MachineModal({
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
                    <m.button
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
                    </m.button>
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

export function LogModal({
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

    const [date, setDate] = useState(() => todayGregorian());
    const [employeeId, setEmployeeId] = useState<number | null>(null);
    const [machineId, setMachineId] = useState<number | null>(null);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [produced, setProduced] = useState("");
    const [waste, setWaste] = useState("0");
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let alive = true;
        fetchAllEmployeesCached()
            .then((all) => {
                if (alive) setEmployees(all);
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

    const selectedMachine = machines.find((m) => m.id === machineId);
    const hours = calcHoursWorked(startTime, endTime);
    const expectedProd = selectedMachine && hours !== null ? hours * Number(selectedMachine.std_production_per_hour || 0) : null;
    const expectedWasteVal = selectedMachine && hours !== null ? hours * Number(selectedMachine.std_waste_per_hour || 0) : null;
    const liveEff = expectedProd && produced !== "" ? Math.round((Number(produced) / expectedProd) * 1000) / 10 : null;

    const canSubmit =
        employeeId !== null &&
        machineId !== null &&
        produced !== "" &&
        hours !== null &&
        startTime !== "" &&
        endTime !== "" &&
        date !== "" &&
        !saving;

    async function handleSave() {
        if (!canSubmit) return;

        setSaving(true);
        setError("");

        try {
            await axiosInstance.post("/production/api/v1/log/create/", {
                date,
                employee: employeeId,
                machine: machineId,
                start_time: startTime,
                end_time: endTime,
                hours_worked: String(hours),
                produced_qty: Number(produced),
                waste_qty: Number(waste || 0),
                note: note.trim(),
            });
            onSaved();
        } catch (err) {
            setError(
                parseBackendError(
                    err,
                    "خطا در ثبت لاگ. احتمالاً برای این تاریخ و ماشین، رکوردی از این کارمند ثبت شده است."
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
            subtitle="ثبت رکورد تولید روزانه"
            maxWidth="max-w-lg"
            locked={saving}
            onClose={onClose}
            footer={
                <>
                    <m.button
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
                    </m.button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="flex h-11 flex-1 items-center justify-center rounded-full border border-gray-100 bg-gray-50 text-[13px] font-bold text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-40 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white/50 dark:hover:text-white/80"
                    >
                        انصراف
                    </button>
                </>
            }
        >
            <ErrorBanner message={error} onClose={() => setError("")} />
            <InfoBanner message="روی تاریخ کلیک کنید و از تقویم شمسی، روز مورد نظر را انتخاب کنید." />

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
                <JalaliDatePicker
                    label="تاریخ"
                    value={date}
                    onChange={setDate}
                    placeholder="انتخاب تاریخ"
                    required
                />
                <TimeField label="ساعت شروع" value={startTime} onChange={setStartTime} required />
                <TimeField label="ساعت پایان" value={endTime} onChange={setEndTime} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <NumberField label="تعداد تولید شده" value={produced} onChange={setProduced} min="0" />
                <NumberField label="مقدار ضایعات" value={waste} onChange={setWaste} min="0" />
            </div>

            {expectedProd !== null && (
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] px-4 py-3 text-[12px] font-bold text-blue-600 dark:text-blue-300">
                    تولید مورد انتظار: {toPersianDigits(expectedProd.toFixed(2))} | ضایعات مورد انتظار: {toPersianDigits((expectedWasteVal ?? 0).toFixed(2))} | راندمان: {liveEff === null ? "—" : toPersianDigits(String(liveEff)) + "٪"}
                </div>
            )}

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

export function ConfirmDeleteLog({
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
                تاریخ {toPersianDigits(isoToJalaliString(log.date))} حذف می‌شود. این عملیات قابل بازگشت نیست.
            </p>
            <ErrorBanner message={error} onClose={() => setError("")} />
        </ModalShell>
    );
}

export function ViewNoteModal({
    log,
    onClose,
}: {
    log: ProductionLog;
    onClose: () => void;
}) {
    return (
        <ModalShell
            icon={<Eye size={15} className="text-blue-500" />}
            title="مشاهده جزئیات و توضیحات"
            maxWidth="max-w-md"
            onClose={onClose}
            footer={
                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-11 w-full items-center justify-center rounded-full bg-gray-100 text-[13px] font-bold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.08]"
                >
                    بستن
                </button>
            }
        >
            <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-500">پرسنل:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{log.employee_name}</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-500">ماشین:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                        {log.machine_name} ({log.machine_code})
                    </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-500">تاریخ:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                        {toPersianDigits(isoToJalaliString(log.date))}
                    </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-500">ساعت کار:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                        {toPersianDigits(log.hours_worked)} ساعت
                    </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-500">تولید / ضایعات:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                        {toPersianDigits(log.produced_qty)} / {toPersianDigits(log.waste_qty)}
                    </span>
                </div>
            </div>

            <div className="mt-2">
                <label className="mb-2 block text-[11.5px] font-bold text-gray-400">توضیحات ثبت شده:</label>
                <div className="min-h-[80px] rounded-2xl border border-gray-100 bg-white p-4 text-[12.5px] leading-6 text-gray-700 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-gray-300">
                    {log.note && log.note.trim() !== "" ? (
                        log.note
                    ) : (
                        <span className="text-gray-400 italic">بدون توضیحات</span>
                    )}
                </div>
            </div>
        </ModalShell>
    );
}
