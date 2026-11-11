"use client";

import SearchField from "@/components/ui/SearchField";
import type { ReactNode } from "react";
import { Search, X, Inbox, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface SearchInputProps {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
    "aria-label"?: string;
    hideIcon?: boolean;
}

export function SearchInput({ value, onChange, placeholder = "جستجو...", className }: SearchInputProps) {
    return <SearchField value={value} onChange={onChange} placeholder={placeholder} className={className} />;
}

export function EmptyState({
    title,
    description,
    icon,
    action,
}: {
    title: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gray-100 text-gray-400 dark:bg-white/10">
                {icon ?? <Inbox size={26} />}
            </span>
            <p className="text-[14px] font-bold text-gray-700 dark:text-gray-200">{title}</p>
            {description && (
                <p className="max-w-xs text-[12.5px] text-gray-500 dark:text-gray-400">
                    {description}
                </p>
            )}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}

export function ErrorState({
    message = "خطا در دریافت اطلاعات",
    onRetry,
}: {
    message?: string;
    onRetry?: () => void;
}) {
    return (
        <div
            role="alert"
            className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center"
        >
            <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-red-50 text-red-500 dark:bg-red-500/15">
                <AlertCircle size={26} />
            </span>
            <p className="text-[14px] font-bold text-gray-700 dark:text-gray-200">{message}</p>
            {onRetry && (
                <Button variant="soft" size="sm" onClick={onRetry} className="mt-2">
                    تلاش مجدد
                </Button>
            )}
        </div>
    );
}

export function PageHeader({
    title,
    subtitle,
    actions,
    icon,
}: {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
    icon?: ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
                {icon && (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                        {icon}
                    </span>
                )}
                <div className="min-w-0">
                    <h1 className="truncate text-lg font-bold text-gray-900 dark:text-white">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="truncate text-[12.5px] text-gray-500 dark:text-gray-400">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}
