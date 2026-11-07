"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Modal } from "@/components/ui/Modal";
import { DetailSkeleton } from "@/components/ui/skeletons";
import type { RankingView } from "./RankingCard";

const loading = () => <DetailSkeleton />;
const OverviewTab = dynamic(() => import("../profile/OverviewTab"), { loading });
const CommentsTab = dynamic(() => import("../profile/CommentsTab"), { loading });
const SalesTab = dynamic(() => import("../profile/SalesTab"), { loading });
const CasePathTab = dynamic(() => import("../profile/CasePathTab"), { loading });

const TITLES: Record<RankingView, string> = {
    overview: "خلاصه مشتری",
    comments: "نظرات",
    sales: "فروش‌ها",
    path: "مسیر پرونده",
};

interface Props {
    customerId: number;
    customerName: string;
    view: RankingView;
    onClose: () => void;
}

export default function RankingDetailModal({ customerId, customerName, view, onClose }: Props) {
    const [open, setOpen] = useState(true);

    return (
        <Modal
            open={open}
            onClose={() => {
                setOpen(false);
                setTimeout(onClose, 220);
            }}
            title={TITLES[view]}
            subtitle={customerName}
            maxWidth="max-w-3xl"
        >
            {view === "overview" && <OverviewTab customerId={customerId} />}
            {view === "comments" && <CommentsTab customerId={customerId} />}
            {view === "sales" && <SalesTab customerId={customerId} customerName={customerName} />}
            {view === "path" && <CasePathTab customerId={customerId} />}
        </Modal>
    );
}
