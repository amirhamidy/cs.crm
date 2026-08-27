"use client";

import { useEffect, useState, forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FolderOpen, CheckCircle2, Loader, AlertCircle } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { CaseItem, EditCaseModalProps } from "@/types/case";
// اینم برای ادمین هست 

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

interface FloatingTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  id: string;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, id, className = "", ...props }, ref) => (
    <div className="relative">
      <input
        ref={ref}
        id={id}
        placeholder=" "
        className={`peer w-full rounded-4xl border border-gray-200 bg-white px-5 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-blue-500 ${className}`}
        {...props}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 rounded bg-white px-1.5 text-sm text-gray-400 transition-all duration-200 peer-focus:top-0 peer-focus:text-xs peer-focus:text-gray-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-500 dark:bg-[#0f172a]"
      >
        {label}
      </label>
    </div>
  )
);
FloatingInput.displayName = "FloatingInput";

const FloatingTextarea = forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
  ({ label, id, className = "", ...props }, ref) => (
    <div className="relative">
      <textarea
        ref={ref}
        id={id}
        placeholder=" "
        rows={4}
        className={`peer w-full resize-none rounded-3xl border border-gray-200 bg-white px-5 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-blue-500 ${className}`}
        {...props}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute right-5 top-4 rounded bg-white px-1.5 text-sm text-gray-400 transition-all duration-200 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-500 peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-500 dark:bg-[#0f172a]"
      >
        {label}
      </label>
    </div>
  )
);
FloatingTextarea.displayName = "FloatingTextarea";

export default function EditCaseModal({
  isOpen,
  onClose,
  caseItem,
  onSuccess,
}: EditCaseModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && caseItem) {
      setTitle(caseItem.title ?? "");
      const desc =
        caseItem.description ??
        (caseItem as any)?.desc ??
        (caseItem as any)?.body ??
        "";
      setDescription(desc);
      setSubmitting(false);
      setSuccess(false);
      setError(null);

      if (caseItem.id) {
        axiosInstance
          .get(`/tasks/api/v1/cases/${caseItem.id}/`)
          .then((res) => {
            const fetched = res.data;
            if (fetched) {
              setTitle(fetched.title ?? caseItem.title ?? "");
              setDescription(
                fetched.description ??
                (fetched as any)?.desc ??
                (fetched as any)?.body ??
                ""
              );
            }
          })
          .catch(() => { });
      }
    }
  }, [isOpen, caseItem]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting && !success) handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, submitting, success]);

  const handleClose = () => {
    if (submitting || success) return;
    setError(null);
    onClose();
  };

  const canSubmit = Boolean(title.trim() && caseItem?.id && !submitting);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!caseItem?.id || !canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
      };

      const response = await axiosInstance.patch(
        `/tasks/api/v1/cases/${caseItem.id}/update/`,
        payload
      );

      const updatedCase: CaseItem = {
        ...caseItem,
        ...response.data,
        description: description.trim(),
      };

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess(updatedCase);
        onClose();
      }, 1200);
    } catch {
      setError("خطا در ویرایش پرونده. دوباره امتحان کن.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && caseItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full max-w-sm overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between px-8 pb-6 pt-8">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
                  <FolderOpen size={15} className="text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                    ویرایش پرونده
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    {caseItem.title || "اطلاعات پرونده"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting || success}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-8 pb-8">
              <FloatingInput
                label="عنوان پرونده"
                id="edit_case_title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError(null);
                }}
                disabled={submitting || success}
                dir="rtl"
              />

              <FloatingTextarea
                label="توضیحات"
                id="edit_case_description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setError(null);
                }}
                disabled={submitting || success}
                dir="rtl"
              />

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="flex items-center gap-2 rounded-2xl bg-red-50 px-3.5 py-2.5 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400"
                  >
                    <AlertCircle size={14} className="shrink-0" />
                    <span className="flex-1 font-medium">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-green-50 py-3 text-sm font-medium text-green-600 dark:bg-green-500/10 dark:text-green-400"
                  >
                    <CheckCircle2 size={16} />
                    تغییرات با موفقیت ذخیره شد
                  </motion.div>
                ) : (
                  <motion.button
                    key="submit"
                    type="submit"
                    disabled={!canSubmit}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center justify-center rounded-full bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader size={18} className="animate-spin" />
                    ) : (
                      "ذخیره تغییرات"
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
