"use client";

import { useEffect, useState, forwardRef, InputHTMLAttributes } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, CheckCircle2, Loader } from "lucide-react";

interface Props {
open: boolean;
onClose: () => void;
onSubmit: (data: { name: string }) => Promise<void>;
}

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
className={`peer w-full border border-gray-200 rounded-4xl px-5 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-gray-400 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:focus:border-blue-500 ${className}`}
{...props}
/> <label
             htmlFor={id}
             className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none transition-all duration-200 bg-white dark:bg-[#0f172a] px-1.5 rounded peer-focus:top-0 peer-focus:text-xs peer-focus:text-gray-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-500"
         >
{label} </label> </div>
)
);

FloatingInput.displayName = "FloatingInput";

export default function AddDepartmentModal({
open,
onClose,
onSubmit,
}: Props) {
const [name, setName] = useState("");
const [loading, setLoading] = useState(false);
const [success, setSuccess] = useState(false);


useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            handleClose();
        }
    };

    window.addEventListener("keydown", onKey);

    return () => {
        window.removeEventListener("keydown", onKey);
    };
}, [open, success, loading]);

const handleClose = () => {
    if (success || loading) return;

    setName("");
    onClose();
};

const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!name.trim() || loading) return;

    setLoading(true);

    try {
        await onSubmit({
            name: name.trim(),
        });

        setSuccess(true);

        setTimeout(() => {
            setSuccess(false);
            setName("");
            onClose();
        }, 1400);
    } finally {
        setLoading(false);
    }
};

return (
    <AnimatePresence>
        {open && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
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
                    transition={{
                        duration: 0.35,
                        ease: "easeOut",
                    }}
                    className="bg-white dark:bg-[#0f172a] rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/[0.06] w-full max-w-sm overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                    dir="rtl"
                >
                    <div className="px-8 pt-8 pb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                <Building2
                                    size={15}
                                    className="text-indigo-500"
                                />
                            </div>

                            <div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    دپارتمان جدید
                                </h3>

                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    ایجاد دپارتمان جدید در سیستم
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading || success}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-40 bg-gray-100 dark:bg-white/[0.05]"
                        >
                            <X size={15} />
                        </button>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="px-8 pb-8 flex flex-col gap-4"
                    >
                        <FloatingInput
                            label="نام دپارتمان"
                            id="dept_name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading || success}
                            dir="rtl"
                        />

                        <AnimatePresence mode="wait">
                            {success ? (
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
                                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium"
                                >
                                    <CheckCircle2 size={16} />
                                    دپارتمان با موفقیت ایجاد شد
                                </motion.div>
                            ) : (
                                <motion.button
                                    key="submit"
                                    type="submit"
                                    disabled={!name.trim() || loading}
                                    whileTap={{ scale: 0.97 }}
                                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-full py-3 text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <Loader
                                            size={18}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        "ایجاد دپارتمان"
                                    )}
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </form>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);
}
