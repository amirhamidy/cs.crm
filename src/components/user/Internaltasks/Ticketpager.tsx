"use client";

interface TicketPagerProps {
    page: number;
    count: number;
    pageSize?: number;
    disabled?: boolean;
    onChange: (page: number) => void;
}

export default function TicketPager({ page, count, pageSize = 20, disabled, onChange }: TicketPagerProps) {
    const pages = Math.max(1, Math.ceil(count / pageSize));
    if (pages <= 1) return null;
    const btn = "rounded-xl bg-gray-100 px-3 py-1.5 text-[11.5px] font-bold text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-40 dark:bg-white/[0.05] dark:text-gray-300";
    return (
        <div dir="rtl" className="flex items-center justify-center gap-3">
            <button type="button" className={btn} disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>قبلی</button>
            <span className="text-[11.5px] text-gray-500">{page} / {pages}</span>
            <button type="button" className={btn} disabled={disabled || page >= pages} onClick={() => onChange(page + 1)}>بعدی</button>
        </div>
    );
}
