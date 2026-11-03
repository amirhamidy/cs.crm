"use client";

import { ClipboardList } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { Customer } from "@/types/customer";
import type { Department } from "@/types/department";
import type { TaskItem } from "@/types/task";
import EditTaskView from "./EditTaskView";

interface EditTaskModalProps {
    task: TaskItem;
    customers?: Customer[];
    departments: Department[];
    onClose: () => void;
    onSuccess: () => void;
}

/** Standalone shell for admin/user task pages; the form lives in EditTaskView. */
export default function EditTaskModal({ task, ...viewProps }: EditTaskModalProps) {
    return (
        <Modal
            open
            onClose={viewProps.onClose}
            title="ویرایش وظیفه"
            subtitle={task.title}
            icon={<ClipboardList size={16} />}
            presentation="center"
            maxWidth="max-w-md"
        >
            <EditTaskView task={task} {...viewProps} />
        </Modal>
    );
}
