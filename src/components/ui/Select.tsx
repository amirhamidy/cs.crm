"use client";

import { useId, useMemo, useRef, useState } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fade, panelMotion } from "@/lib/motion";
import { Portal, useIsMobile, useModalBehavior } from "./Portal";
import { SearchInput } from "./Feedback";
import { Button } from "./Button";

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface BaseProps {
    options: SelectOption[];
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    searchable?: boolean;
    className?: string;
    "aria-label"?: string;
}
interface SingleProps extends BaseProps {
    multiple?: false;
    value: string;
    onChange: (v: string) => void;
}
interface MultiProps extends BaseProps {
    multiple: true;
    value: string[];
    onChange: (v: string[]) => void;
}
export type SelectProps = SingleProps | MultiProps;

/**
 * Accessible picker. Opens a listbox in a sheet (mobile) or centered
 * dialog (desktop) — never clipped by overflow parents. Arrow keys,
 * Home/End, Enter/Space supported.
 */
export function Select(props: SelectProps) {
    const {
        options,
        placeholder = "انتخاب کنید",
        label,
        disabled,
        searchable,
        className,
    } = props;
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const mobile = useIsMobile();
    const reduced = !!useReducedMotion();
    const panelRef = useRef<HTMLDivElement>(null);
    const triggerId = useId();
    const listId = useId();

    const selected = useMemo(
        () => (props.multiple ? props.value : props.value ? [props.value] : []),
        [props],
    );
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
    }, [options, query]);

    const close = () => {
        setOpen(false);
        setQuery("");
    };
    useModalBehavior({ open, onClose: close, containerRef: panelRef });

    const openIt = () => {
        const first = options.findIndex((o) => selected.includes(o.value));
        setActive(Math.max(0, first));
        setOpen(true);
    };

    const toggle = (o: SelectOption) => {
        if (o.disabled) return;
        if (props.multiple) {
            props.onChange(
                selected.includes(o.value)
                    ? selected.filter((v) => v !== o.value)
                    : [...selected, o.value],
            );
        } else {
            props.onChange(o.value);
            close();
        }
    };

    const onListKey = (e: React.KeyboardEvent) => {
        if (!filtered.length) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(filtered.length - 1, i + 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(0, i - 1));
        } else if (e.key === "Home") {
            e.preventDefault();
            setActive(0);
        } else if (e.key === "End") {
            e.preventDefault();
            setActive(filtered.length - 1);
        } else if (e.key === "Enter" || (e.key === " " && !searchable)) {
            e.preventDefault();
            const o = filtered[Math.min(active, filtered.length - 1)];
            if (o) toggle(o);
        }
    };

    const byValue = (v: string) => options.find((o) => o.value === v);
    const single = !props.multiple ? byValue(props.value) : undefined;
    const activeId = filtered[active] ? `${listId}-${active}` : undefined;

    return (
        <div className={cn("w-full", className)}>
            {label && (
                <label
                    htmlFor={triggerId}
                    className="mb-1.5 block text-[12px] font-bold text-gray-600 dark:text-gray-300"
                >
                    {label}
                </label>
            )}
            <button
                id={triggerId}
                type="button"
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={props["aria-label"]}
                onClick={openIt}
                className="flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl border border-gray-200 bg-white px-3.5 py-1.5 text-start text-[13px] text-gray-900 transition-colors hover:border-gray-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                    {props.multiple ? (
                        selected.length ? (
                            selected.map((v) => (
                                <span
                                    key={v}
                                    className="inline-flex items-center gap-1 rounded-lg bg-brand-soft px-2 py-0.5 text-[11.5px] font-medium text-brand"
                                >
                                    {byValue(v)?.label ?? v}
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-400">{placeholder}</span>
                        )
                    ) : single ? (
                        <span className="truncate">{single.label}</span>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </span>
                <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-gray-400" />
            </button>

            <AnimatePresence>
                {open && (
                    <Portal>
                        <div className="fixed inset-0 z-[120] flex items-end justify-center md:items-center md:p-4">
                            <m.div
                                {...fade}
                                aria-hidden="true"
                                onClick={close}
                                className="absolute inset-0 bg-black/40"
                            />
                            <m.div
                                ref={panelRef}
                                role="dialog"
                                aria-modal="true"
                                aria-label={label ?? placeholder}
                                tabIndex={-1}
                                onKeyDown={onListKey}
                                {...panelMotion(mobile, reduced)}
                                className="relative flex max-h-[80dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white outline-none md:max-w-sm md:rounded-3xl md:shadow-xl dark:bg-surface-dark"
                            >
                                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-4 py-2.5 dark:border-white/10">
                                    <span className="text-[14px] font-bold text-gray-900 dark:text-white">
                                        {label ?? placeholder}
                                    </span>
                                    <button
                                        type="button"
                                        aria-label="بستن"
                                        onClick={close}
                                        className="flex h-11 w-11 items-center justify-center rounded-2xl text-gray-500 hover:bg-gray-100 md:h-9 md:w-9 dark:hover:bg-white/10"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                {searchable && (
                                    <div className="shrink-0 px-4 pt-3">
                                        <SearchInput
                                            value={query}
                                            onChange={(v) => {
                                                setQuery(v);
                                                setActive(0);
                                            }}
                                        />
                                    </div>
                                )}
                                <ul
                                    id={listId}
                                    role="listbox"
                                    aria-multiselectable={props.multiple || undefined}
                                    aria-activedescendant={activeId}
                                    className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-2"
                                >
                                    {filtered.length === 0 && (
                                        <li className="px-3 py-6 text-center text-[13px] text-gray-400">
                                            موردی یافت نشد
                                        </li>
                                    )}
                                    {filtered.map((o, i) => {
                                        const isSel = selected.includes(o.value);
                                        return (
                                            <li
                                                key={o.value}
                                                id={`${listId}-${i}`}
                                                role="option"
                                                aria-selected={isSel}
                                                aria-disabled={o.disabled || undefined}
                                                onClick={() => toggle(o)}
                                                onMouseEnter={() => setActive(i)}
                                                className={cn(
                                                    "flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-xl px-3 text-[13px] text-gray-800 dark:text-gray-100",
                                                    i === active && "bg-gray-100 dark:bg-white/10",
                                                    isSel && "font-bold text-brand",
                                                    o.disabled && "cursor-not-allowed opacity-50",
                                                )}
                                            >
                                                <span className="truncate">{o.label}</span>
                                                {isSel && <Check size={16} aria-hidden="true" />}
                                            </li>
                                        );
                                    })}
                                </ul>
                                {props.multiple && (
                                    <div className="shrink-0 border-t border-gray-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-white/10">
                                        <Button fullWidth onClick={close}>
                                            تایید ({selected.length})
                                        </Button>
                                    </div>
                                )}
                            </m.div>
                        </div>
                    </Portal>
                )}
            </AnimatePresence>
        </div>
    );
}
