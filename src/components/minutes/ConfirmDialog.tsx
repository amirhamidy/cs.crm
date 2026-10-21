"use client";

import { Loader2 } from "lucide-react";
import Modal from "./Modal";
import { BTN_DANGER, BTN_GHOST, BTN_PRIMARY } from "./ui";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "primary" | "danger";
  loading?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  description,
  confirmLabel,
  tone = "primary",
  loading = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel} busy={loading} maxWidthClass="max-w-md">
      <p className="text-[12.5px] leading-6 text-gray-600 dark:text-gray-300">{description}</p>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-[12px] font-semibold text-red-500">
          {error}
        </p>
      )}

      <div className="mt-5 flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={loading} className={BTN_GHOST}>
          انصراف
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={tone === "danger" ? BTN_DANGER : BTN_PRIMARY}
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
