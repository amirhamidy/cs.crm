"use client";

import Pagination from "@/components/ui/Pagination";

interface TicketPagerProps {
    page: number;
    count: number;
    pageSize?: number;
    disabled?: boolean;
    onChange: (page: number) => void;
}

export default function TicketPager({ page, count, pageSize = 20, disabled, onChange }: TicketPagerProps) {
    const totalPages = Math.max(1, Math.ceil(count / pageSize));
    if (totalPages <= 1) return null;

    return (
        <div className={disabled ? "pointer-events-none opacity-60" : undefined}>
            <Pagination
                page={page}
                totalPages={totalPages}
                onChange={(next) => {
                    if (next < 1 || next > totalPages || next === page) return;
                    onChange(next);
                }}
            />
        </div>
    );
}
