"use client";

import { useState } from "react";
import Modal from "./Modal";
import SignerDraftForm from "./SignerDraftForm";
import { minutesApi } from "@/lib/minutesApi";
import { parseApiError } from "@/lib/minutesUtils";
import { useUserOptions } from "@/hooks/useUserOptions";
import type { SignerInput, SignerItem } from "@/types/minutes";

interface SignerModalProps {
  meetingId: number;
  existingSigners: SignerItem[];
  /** اگر پاس داده شود، حالت ویرایش است */
  editing?: SignerItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function SignerModal({ meetingId, existingSigners, editing, onClose, onSaved }: SignerModalProps) {
  const { options, loading } = useUserOptions();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const takenUserIds = existingSigners.map((s) => s.user).filter((id): id is number => id !== null);
  const maxOrder = existingSigners.reduce((max, s) => Math.max(max, s.order), 0);

  const handleSubmit = async (input: SignerInput) => {
    setSubmitting(true);
    setError("");
    setFieldErrors({});
    try {
      if (editing) {
        await minutesApi.updateSigner(editing.id, {
          full_name: editing.is_external ? input.full_name : undefined,
          phone_number: editing.is_external ? input.phone_number : undefined,
          role_title: input.role_title,
          order: input.order,
        });
      } else {
        await minutesApi.createSigner({ ...input, meeting: meetingId });
      }
      onSaved();
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message);
      setFieldErrors(parsed.fields);
      setSubmitting(false);
    }
  };

  return (
    <Modal title={editing ? "ویرایش امضاکننده" : "افزودن امضاکننده"} onClose={onClose} busy={submitting}>
      <SignerDraftForm
        mode={editing ? "edit" : "add"}
        users={options}
        usersLoading={loading}
        takenUserIds={takenUserIds}
        defaultOrder={maxOrder + 1}
        initial={
          editing
            ? {
                user: editing.user,
                full_name: editing.full_name,
                phone_number: editing.phone_number,
                role_title: editing.role_title,
                order: editing.order,
                displayName: editing.display_name,
                isExternal: editing.is_external,
              }
            : undefined
        }
        submitLabel={editing ? "ذخیره تغییرات" : "افزودن"}
        submitting={submitting}
        serverError={error}
        serverFieldErrors={fieldErrors}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
