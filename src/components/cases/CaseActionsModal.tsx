"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ModalViews } from "@/components/ui/ModalViews";
import { useModalFlow } from "@/components/ui/useModalFlow";
import CaseTasksModal from "./CaseTasksModal";
import EditTaskView from "@/components/tasks/EditTaskView";
import CaseReportView from "@/components/user/cases/CaseReportView";
import EditCaseView from "@/components/user/cases/EditCaseView";
import type { CaseView } from "@/components/user/cases/CaseCard";
import type { CaseItem } from "@/types/case";
import type { Customer } from "@/types/customer";
import type { Department } from "@/types/department";
import type { TaskItem } from "@/types/task";

type FlowView = CaseView | "editTask";

type TasksProps = Omit<
    React.ComponentProps<typeof CaseTasksModal>,
    "isOpen" | "onClose" | "caseItem" | "embedded" | "onEditTask"
>;

interface CaseActionsModalProps extends TasksProps {
    open: boolean;
    caseItem: CaseItem | null;
    initialView: CaseView;
    customers?: Customer[];
    departments: Department[];
    onClose: () => void;
    onCaseUpdated: () => void;
    onTaskUpdated: () => void;
}

const TITLES: Record<FlowView, string> = {
    tasks: "وظایف پرونده",
    report: "گزارش مسیر پرونده",
    edit: "ویرایش پرونده",
    editTask: "ویرایش وظیفه",
};

export default function CaseActionsModal({
    open,
    caseItem,
    initialView,
    onClose,
    onCaseUpdated,
    customers,
    departments,
    onTaskUpdated,
    ...tasksProps
}: CaseActionsModalProps) {
    const { view, canGoBack, push, back, reset } = useModalFlow<FlowView>("tasks");
    const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

    const handleEditTask = useCallback(
        (task: TaskItem) => {
            setEditingTask(task);
            push("editTask");
        },
        [push]
    );

    const handleTaskSaved = useCallback(() => {
        onTaskUpdated();
        setEditingTask(null);
        back();
    }, [onTaskUpdated, back]);

    useEffect(() => {
        if (!open) return;
        reset();
        setEditingTask(null);
        if (initialView !== "tasks") push(initialView);
    }, [open, initialView, reset, push]);

    return (
        <Modal
            open={open && !!caseItem}
            onClose={onClose}
            onBack={canGoBack ? back : undefined}
            title={TITLES[view]}
            subtitle={caseItem?.title || undefined}
            presentation="center"
            maxWidth="max-w-2xl"
        >
            {caseItem && (
                <ModalViews view={view}>
                    {view === "tasks" && (
                        <CaseTasksModal
                            {...tasksProps}
                            embedded
                            isOpen
                            caseItem={caseItem}
                            onEditTask={handleEditTask}
                            onClose={onClose}
                        />
                    )}
                    {view === "editTask" && editingTask && (
                        <EditTaskView
                            task={editingTask}
                            customers={customers}
                            departments={departments}
                            onClose={back}
                            onSuccess={handleTaskSaved}
                        />
                    )}
                    {view === "report" && <CaseReportView caseId={caseItem.id} />}
                    {view === "edit" && (
                        <EditCaseView
                            caseItem={caseItem}
                            onSuccess={onCaseUpdated}
                            onClose={canGoBack ? back : onClose}
                        />
                    )}
                </ModalViews>
            )}
        </Modal>
    );
}
