"use client";

import { useState, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

// Copied from AddCustomerModal to keep the same visual language.

export interface SelectOption {
    id: number;
    label: string;
    sub?: string;
}

interface NiceSelectProps {
    label: string;
    placeholder?: string;
    emptyText?: string;
    options: SelectOption[];
    value: number | null;
    onChange: (id: number) => void;
    disabled?: boolean;
}

export function NiceSelect({
    label,
    placeholder = "انتخاب کنید",
    emptyText = "موردی یافت نشد",
    options,
    value,
    onChange,
    disabled = false,
}: NiceSelectProps) {
    const [open, setOpen] = useState(false);
    const [dropUp, setDropUp] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const selected = options.find((o) => o.id === value) ?? null;

    useEffect(() => {
        if (!open) return;
        const handleClick = (e: MouseEvent) => {
            if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("keydown", handleKey);
        };
    }, [open]);

    useEffect(() => {
        if (disabled) setOpen(false);
    }, [disabled]);

    const toggle = () => {
        if (disabled) return;
        if (!open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const needed = Math.min(options.length, 4) * 56 + 24;
            setDropUp(window.innerHeight - rect.bottom < needed);
        }
        setOpen((p) => !p);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="mb-2 block text-[11.5px] font-bold text-gray-400">
                {label}
            </label>
            <button
                ref={buttonRef}
                type="button"
                onClick={toggle}
                disabled={disabled}
                className={`flex w-full items-center gap-2.5 rounded-4xl border px-5 py-3 text-right transition-all duration-200 ${
                    disabled
                        ? "cursor-not-allowed border-gray-200 bg-gray-50/60 opacity-60 dark:border-white/[0.06] dark:bg-white/[0.02]"
                        : open
                          ? "border-blue-500 bg-white dark:border-blue-500 dark:bg-white/[0.05]"
                          : "border-gray-200 bg-white hover:border-gray-300 dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:border-white/[0.15]"
                }`}
            >
                <span
                    className={`min-w-0 flex-1 truncate text-sm ${
                        selected
                            ? "font-semibold text-black dark:text-white"
                            : "text-gray-400"
                    }`}
                >
                    {selected ? selected.label : placeholder}
                </span>
                <m.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 text-gray-400"
                >
                    <ChevronDown size={15} />
                </m.span>
            </button>

            <AnimatePresence>
                {open && (
                    <m.div
                        initial={{ opacity: 0, scale: 0.95, y: dropUp ? 8 : -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: dropUp ? 8 : -8 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={`absolute left-0 z-[100] w-full origin-center overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-2 shadow-2xl dark:border-white/[0.08] dark:bg-[#1a2235] ${
                            dropUp
                                ? "bottom-[calc(100%+8px)]"
                                : "top-[calc(100%+8px)]"
                        }`}
                    >
                        <div className="custom-scrollbar max-h-60 overflow-y-auto overflow-x-hidden">
                            {options.length === 0 ? (
                                <div className="px-4 py-8 text-center">
                                    <p className="text-[12px] font-medium text-gray-400">
                                        {emptyText}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    {options.map((opt) => {
                                        const active = value === opt.id;
                                        return (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => {
                                                    onChange(opt.id);
                                                    setOpen(false);
                                                }}
                                                className={`flex flex-col items-start gap-0.5 rounded-2xl px-4 py-2.5 text-right transition-all duration-200 ${
                                                    active
                                                        ? "bg-blue-600"
                                                        : "hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                                                }`}
                                            >
                                                <div className="flex w-full items-center justify-between gap-2">
                                                    <span
                                                        className={`truncate text-sm font-bold ${
                                                            active
                                                                ? "text-white"
                                                                : "text-gray-900 dark:text-white"
                                                        }`}
                                                    >
                                                        {opt.label}
                                                    </span>
                                                    {active && (
                                                        <span className="text-white">
                                                            <Check size={14} />
                                                        </span>
                                                    )}
                                                </div>
                                                {opt.sub && (
                                                    <span
                                                        className={`truncate text-[10px] ${
                                                            active
                                                                ? "text-blue-100"
                                                                : "text-gray-400"
                                                        }`}
                                                    >
                                                        {opt.sub}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}
