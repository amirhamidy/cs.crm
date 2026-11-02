"use client";

import { useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { ModalViews } from "@/components/ui/ModalViews";
import { useModalFlow } from "@/components/ui/useModalFlow";
import CaseTasksModal from "./CaseTasksModal";
import CaseReportView from "@/components/user/cases/CaseReportView";
import EditCaseView from "@/components/user/cases/EditCaseView";
import type { CaseView } from "@/components/user/cases/CaseCard";
import type { CaseItem } from "@/types/case";

type TasksProps = Omit<
    React.ComponentProps<typeof CaseTasksModal>,
    "isOpen" | "onClose" | "caseItem" | "embedded"
>;

interface CaseActionsModalProps extends TasksProps {
    open: boolean;
    caseItem: CaseItem | null;
    initialView: CaseView;
    onClose: () => void;
    onCaseUpdated: () => void;
}

const TITLES: Record<CaseView, string> = {
    tasks: "وظایف پرونده",
    report: "گزارش مسیر پرونده",
    edit: "ویرایش پرونده",
};

export default function CaseActionsModal({
    open,
    caseItem,
    initialView,
    onClose,
    onCaseUpdated,
    ...tasksProps
}: CaseActionsModalProps) {
    const { view, canGoBack, push, back, reset } = useModalFlow<CaseView>("tasks");

    useEffect(() => {
        if (!open) return;
        reset();
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
                            onClose={onClose}
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
