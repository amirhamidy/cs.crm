"use client";

import { Camera } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import AvatarUploader from "@/components/ui/AvatarUploader";

interface AvatarUploadModalProps {
    open: boolean;
    onClose: () => void;
    userId: number;
    userName: string;
    current?: string | null;
    onUpload: (file: File) => Promise<void>;
    onRemove: () => Promise<void>;
}

export default function AvatarUploadModal({
    open,
    onClose,
    userId,
    userName,
    current,
    onUpload,
    onRemove,
}: AvatarUploadModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`عکس پروفایل ${userName}`}
            subtitle="تغییر یا حذف تصویر کاربر"
            icon={<Camera size={18} />}
            maxWidth="max-w-sm"
        >
            <AvatarUploader
                current={current}
                name={userName}
                id={userId}
                onUpload={onUpload}
                onRemove={onRemove}
            />
        </Modal>
    );
}
