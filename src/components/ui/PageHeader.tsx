"use client";

import type { ComponentType, ReactNode } from "react";
import SearchInput from "./SearchInput";

interface PageHeaderProps {
    icon?: ComponentType<{ size?: number; className?: string }>;
    title: string;
    subtitle?: string;
    search?: { value: string; onChange: (value: string) => void; placeholder?: string };
    actions?: ReactNode;
}

export default function PageHeader({ icon: Icon, title, subtitle, search, actions }: PageHeaderProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                {Icon && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/[0.05] text-gray-700 dark:bg-white/5 dark:text-slate-200">
                        <Icon size={18} />
                    </div>
                )}
                <div>
                    <h1 className="text-[15px] font-black text-gray-900 dark:text-slate-100">{title}</h1>
                    {subtitle && <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-slate-400">{subtitle}</p>}
                </div>
            </div>
            <div className="flex items-center gap-2">
                {search && (
                    <SearchInput
                        value={search.value}
                        onChange={search.onChange}
                        placeholder={search.placeholder}
                        className="w-56"
                    />
                )}
                {actions}
            </div>
        </div>
    );
}
