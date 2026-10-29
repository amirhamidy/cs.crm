"use client";

import { useState } from "react";
import { Loader2, PenLine } from "lucide-react";
import Modal from "./Modal";
import SignaturePad from "./SignaturePad";
import { validateSignature } from "@/lib/minutesUtils";
import { BTN_GHOST, BTN_PRIMARY } from "./ui";

interface SignModalProps {
  title?: string;
  
  onSubmit: (signatureImage: string) => Promise<string | void>;
  onClose: () => void;
}

export default function SignModal({ title = "ثبت امضا", onSubmit, onClose }: SignModalProps) {
  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const problem = validateSignature(signature);
    if (problem) {
      setError(problem);
      return;
    }
    setSubmitting(true);
    setError("");
    const result = await onSubmit(signature as string);
    setSubmitting(false);
    if (typeof result === "string" && result) setError(result);
  };

  return (
    <Modal title={title} onClose={onClose} busy={submitting} maxWidthClass="max-w-xl">
      <p className="mb-3 text-[12px] leading-6 text-gray-500 dark:text-gray-400">
        با ماوس یا انگشت در کادر زیر امضا کنید. امضای ثبت‌شده قابل تغییر نیست.
      </p>

      <SignaturePad
        disabled={submitting}
        onChange={(value) => {
          setSignature(value);
          setError("");
        }}
      />

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-[12px] font-semibold text-red-500">
          {error}
        </p>
      )}

      <div className="mt-5 flex items-center justify-end gap-2">
        <button type="button" onClick={onClose} disabled={submitting} className={BTN_GHOST}>
          انصراف
        </button>
        <button type="button" onClick={handleSubmit} disabled={submitting || !signature} className={BTN_PRIMARY}>
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <PenLine size={14} />}
          ثبت امضا
        </button>
      </div>
    </Modal>
  );
}
