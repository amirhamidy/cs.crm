"use client";

import {
    useState,
    useEffect,
    useCallback,
    useRef,
    forwardRef,
    InputHTMLAttributes,
    TextareaHTMLAttributes,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Loader,
    SquarePen,
    CheckCircle2,
    ChevronDown,
    Check,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { Customer, CustomerFormData } from "@/types/customer";

const STATUS_OPTIONS = [
    { id: 1, label: "مشتری بالقوه", sub: "در مرحله مذاکره و پیگیری" },
    { id: 2, label: "مشتری فعال", sub: "همکاری در جریان است" },
];

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
    ({ label, id, className = "", value, ...props }, ref) => {
        const hasValue = value !== undefined && value !== null && value !== "";

        return (
            <div className="relative">
                <input
                    ref={ref}
                    id={id}
                    value={value}
                    placeholder=" "
                    className={`peer w-full rounded-4xl border border-gray-200 bg-white px-5 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-blue-500 ${className}`}
                    {...props}
                />
                <label
                    htmlFor={id}
                    className={`absolute right-5 pointer-events-none transition-all duration-200 bg-white dark:bg-[#0f172a] px-1.5 rounded text-sm text-gray-400 peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-gray-500 ${
                        hasValue
                            ? "-top-2.5 translate-y-0 text-xs text-gray-500"
                            : "top-1/2 -translate-y-1/2"
                    }`}
                >
                    {label}
                </label>
            </div>
        );
    }
);
FloatingInput.displayName = "FloatingInput";



interface FloatingTextareaProps
    extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    id: string;
}

const FloatingTextarea = forwardRef<
    HTMLTextAreaElement,
    FloatingTextareaProps
>(({ label, id, className = "", value, ...props }, ref) => {
    const hasValue = value !== undefined && value !== null && value !== "";

    return (
        <div className="relative">
            <textarea
                ref={ref}
                id={id}
                value={value}
                placeholder=" "
                rows={3}
                className={`peer w-full rounded-3xl border border-gray-200 bg-white px-5 py-3 text-sm text-black outline-none transition-all duration-200 resize-none focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-blue-500 ${className}`}
                {...props}
            />
            <label
                htmlFor={id}
                className={`absolute right-5 pointer-events-none transition-all duration-200 bg-white dark:bg-[#0f172a] px-1.5 rounded text-sm text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-gray-500 ${hasValue ? "top-0 text-xs text-gray-500" : "top-4"
                    }`}
            >
                {label}
            </label>
        </div>
    );
});
FloatingTextarea.displayName = "FloatingTextarea";

interface SelectOption {
    id: number;
    label: string;
    sub?: string;
}

interface NiceSelectProps {
    label: string;
    placeholder?: string;
    emptyText?: string;
    options: SelectOption[];
    value: number | null;
    onChange: (id: number) => void;
    disabled?: boolean;
}

function NiceSelect({
    label,
    placeholder = "انتخاب کنید",
    emptyText = "موردی یافت نشد",
    options,
    value,
    onChange,
    disabled = false,
}: NiceSelectProps) {
    const [open, setOpen] = useState(false);
    const [dropUp, setDropUp] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const selected = options.find((o) => o.id === value) ?? null;

    useEffect(() => {
        if (!open) return;
        const handleClick = (e: MouseEvent) => {
            if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleKey, true);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("keydown", handleKey, true);
        };
    }, [open]);

    useEffect(() => {
        if (disabled) setOpen(false);
    }, [disabled]);

    const toggle = () => {
        if (disabled) return;
        if (!open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const needed = Math.min(options.length, 4) * 56 + 24;
            setDropUp(window.innerHeight - rect.bottom < needed);
        }
        setOpen((p) => !p);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="mb-2 block text-[11.5px] font-bold text-gray-400">
                {label}
            </label>

            <button
                ref={buttonRef}
                type="button"
                onClick={toggle}
                disabled={disabled}
                className={`flex w-full items-center gap-2.5 rounded-4xl border px-5 py-3 text-right transition-all duration-200 ${disabled
                        ? "cursor-not-allowed border-gray-200 bg-gray-50/60 opacity-60 dark:border-white/[0.06] dark:bg-white/[0.02]"
                        : open
                            ? "border-blue-500 bg-white dark:border-blue-500 dark:bg-white/[0.05]"
                            : "border-gray-200 bg-white hover:border-gray-300 dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:border-white/[0.15]"
                    }`}
            >
                <span
                    className={`min-w-0 flex-1 truncate text-sm ${selected
                            ? "font-semibold text-black dark:text-white"
                            : "text-gray-400"
                        }`}
                >
                    {selected ? selected.label : placeholder}
                </span>
                <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 text-gray-400"
                >
                    <ChevronDown size={15} />
                </motion.span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{
                            opacity: 0,
                            scale: 0.95,
                            y: dropUp ? 8 : -8,
                        }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{
                            opacity: 0,
                            scale: 0.95,
                            y: dropUp ? 8 : -8,
                        }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={`absolute left-0 z-[100] w-full origin-center overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-2 shadow-2xl dark:border-white/[0.08] dark:bg-[#1a2235] ${dropUp
                                ? "bottom-[calc(100%+8px)]"
                                : "top-[calc(100%+8px)]"
                            }`}
                    >
                        <div className="max-h-60 overflow-y-auto overflow-x-hidden custom-scrollbar">
                            {options.length === 0 ? (
                                <div className="px-4 py-8 text-center">
                                    <p className="text-[12px] font-medium text-gray-400">
                                        {emptyText}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    {options.map((opt) => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => {
                                                onChange(opt.id);
                                                setOpen(false);
                                            }}
                                            className={`group relative flex flex-col items-start gap-0.5 rounded-2xl px-4 py-2.5 text-right transition-all duration-200 ${value === opt.id
                                                    ? "bg-blue-600 dark:bg-blue-600"
                                                    : "hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                                                }`}
                                        >
                                            <div className="flex w-full items-center justify-between gap-2">
                                                <span
                                                    className={`truncate text-sm font-bold ${value === opt.id
                                                            ? "text-white"
                                                            : "text-gray-900 dark:text-white"
                                                        }`}
                                                >
                                                    {opt.label}
                                                </span>
                                                {value === opt.id && (
                                                    <motion.span
                                                        layoutId="edit-check-icon"
                                                        className="text-white"
                                                    >
                                                        <Check size={14} />
                                                    </motion.span>
                                                )}
                                            </div>
                                            {opt.sub && (
                                                <span
                                                    className={`truncate text-[10px] ${value === opt.id
                                                            ? "text-blue-100"
                                                            : "text-gray-400"
                                                        }`}
                                                >
                                                    {opt.sub}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface Props {
    customer: Customer;
    isOpen: boolean;
    onClose: () => void;
    onEdited: (updated: Customer) => void;
}

const EMPTY_FORM: CustomerFormData = {
    full_name: "",
    phone_number: "",
    job_title: "",
    company_name: "",
    address: "",
    source: "",
    description: "",
    status: 1,
};

export default function CustomerEditModal({
    customer,
    isOpen,
    onClose,
    onEdited,
}: Props) {
    const [form, setForm] = useState<CustomerFormData>(EMPTY_FORM);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !customer?.id) return;

        const fetchDetails = async () => {
            setIsLoadingDetails(true);
            setError(null);
            setSuccess(false);

            try {
                const { data } = await axiosInstance.get<Customer>(
                    `/customers/api/v1/customers/${customer.id}/`
                );
                setForm({
                    full_name: data.full_name || "",
                    phone_number: data.phone_number || "",
                    job_title: data.job_title || "",
                    company_name: data.company_name || "",
                    address: data.address || "",
                    source: data.source || "",
                    description: data.description || "",
                    status: data.status || 1,
                });
            } catch {
                setError("خطا در دریافت اطلاعات مشتری");
            } finally {
                setIsLoadingDetails(false);
            }
        };

        fetchDetails();
    }, [isOpen, customer?.id]);

    useEffect(() => {
        if (!isOpen) return;

        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isSubmitting && !isLoadingDetails)
                onClose();
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, isSubmitting, isLoadingDetails, onClose]);

    const handleClose = () => {
        if (isSubmitting || success) return;
        onClose();
    };

    const setField = useCallback(
        (key: keyof CustomerFormData) =>
            (
                e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
            ) => {
                setForm((f) => ({ ...f, [key]: e.target.value }));
                setError(null);
            },
        []
    );

    const handleStatusChange = (statusId: number) => {
        setForm((f) => ({ ...f, status: statusId }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.full_name.trim() || !form.phone_number.trim() || isSubmitting) {
            setError("نام و شماره تماس اجباری‌ست");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const { data } = await axiosInstance.patch<Customer>(
                `/customers/api/v1/customers/${customer.id}/update/`,
                form
            );
            setSuccess(true);
            onEdited(data);
            setTimeout(onClose, 1400);
        } catch {
            setError("خطا در ذخیره تغییرات. دوباره امتحان کن.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto"
                    style={{
                        background: "rgba(0,0,0,0.45)",
                        backdropFilter: "blur(3px)",
                    }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="bg-white dark:bg-[#0f172a] rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/[0.06] w-full max-w-lg overflow-visible my-8"
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                    >
                        <div className="px-8 pt-8 pb-6 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600">
                                    <SquarePen size={15} />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        ویرایش مشتری
                                    </h3>
                                    <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[200px]">
                                        {customer.full_name}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isSubmitting || success || isLoadingDetails}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-40 bg-gray-100 dark:bg-white/[0.05]"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <div className="px-8 pb-8">
                            {isLoadingDetails ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Loader className="w-8 h-8 animate-spin text-blue-600" />
                                    <span className="text-[11px] text-gray-400 font-bold">
                                        در حال دریافت…
                                    </span>
                                </div>
                            ) : (
                                <form
                                    onSubmit={handleSubmit}
                                    className="flex flex-col gap-4"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FloatingInput
                                            label="نام کامل *"
                                            id="edit_full_name"
                                            value={form.full_name}
                                            onChange={setField("full_name")}
                                        />
                                        <FloatingInput
                                            label="شماره تماس *"
                                            id="edit_phone_number"
                                            dir="ltr"
                                            value={form.phone_number}
                                            onChange={setField("phone_number")}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FloatingInput
                                            label="عنوان شغلی"
                                            id="edit_job_title"
                                            value={form.job_title}
                                            onChange={setField("job_title")}
                                        />
                                        <FloatingInput
                                            label="نام شرکت"
                                            id="edit_company_name"
                                            value={form.company_name}
                                            onChange={setField("company_name")}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FloatingInput
                                            label="آدرس"
                                            id="edit_address"
                                            value={form.address}
                                            onChange={setField("address")}
                                        />
                                        <FloatingInput
                                            label="منبع آشنایی"
                                            id="edit_source"
                                            value={form.source}
                                            onChange={setField("source")}
                                        />
                                    </div>

                                    <FloatingTextarea
                                        label="توضیحات تکمیلی"
                                        id="edit_description"
                                        value={form.description}
                                        onChange={setField("description")}
                                    />

                                    <NiceSelect
                                        label="وضعیت مشتری"
                                        options={STATUS_OPTIONS}
                                        value={form.status}
                                        onChange={handleStatusChange}
                                    />

                                    <div className="mt-2 min-h-[48px]">
                                        <AnimatePresence mode="wait">
                                            {error && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 4 }}
                                                    className="flex items-center justify-center py-3 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 text-[12px] font-bold"
                                                >
                                                    {error}
                                                </motion.div>
                                            )}
                                            {success ? (
                                                <motion.div
                                                    key="success"
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium"
                                                >
                                                    <CheckCircle2 size={16} />
                                                    تغییرات ذخیره شد
                                                </motion.div>
                                            ) : (
                                                !error && (
                                                    <motion.button
                                                        key="submit"
                                                        type="submit"
                                                        disabled={isSubmitting}
                                                        whileTap={{ scale: 0.97 }}
                                                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-full py-3 text-sm transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        {isSubmitting ? (
                                                            <Loader
                                                                size={18}
                                                                className="animate-spin"
                                                            />
                                                        ) : (
                                                            "ذخیره تغییرات"
                                                        )}
                                                    </motion.button>
                                                )
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}