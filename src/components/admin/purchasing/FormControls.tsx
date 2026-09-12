"use client";

import {
    forwardRef,
    type InputHTMLAttributes,
    type SelectHTMLAttributes,
    type TextareaHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";

/**
 * Design tokens (blue theme)
 * ----------------------------------------------------
 * Brand:        #2563EB (border/focus, primary actions)
 * Brand hover:  #1D4ED8
 * Accent:       #0EA5E9 (secondary highlights)
 * Surface:      #FFFFFF  /  dark: #0E1F38
 * Border:       #DCEAFB  /  dark: rgba(96,165,250,0.18)
 * Muted text:   #5D7595  /  dark: #8FAAD1
 * Body text:    #0F2647  /  dark: #EAF2FF
 * ----------------------------------------------------
 */

const FIELD_BASE =
    "w-full rounded-2xl border bg-white text-[11.5px] font-semibold text-[#0F2647] outline-none transition-all border-[#DCEAFB] placeholder:text-transparent focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 dark:border-[rgba(96,165,250,0.18)] dark:bg-[#0E1F38] dark:text-[#EAF2FF] dark:focus:border-[#38BDF8] dark:focus:ring-[#38BDF8]/10";

interface FloatingInputProps
    extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

export const FloatingInput = forwardRef<
    HTMLInputElement,
    FloatingInputProps
>(function FloatingInput({ label, className = "", ...props }, ref) {
    return (
        <div className="relative">
            <input
                ref={ref}
                {...props}
                placeholder={props.placeholder ?? " "}
                className={`peer ${FIELD_BASE} px-4 pb-2.5 pt-5 ${className}`}
            />
            <label className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 bg-white px-1 text-[10.5px] font-semibold text-[#5D7595] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[10.5px] peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[9px] peer-focus:text-[#2563EB] dark:bg-[#0E1F38] dark:text-[#8FAAD1] dark:peer-focus:text-[#38BDF8]">
                {label}
            </label>
        </div>
    );
});

FloatingInput.displayName = "FloatingInput";

interface FloatingSelectProps
    extends SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
}

export const FloatingSelect = forwardRef<
    HTMLSelectElement,
    FloatingSelectProps
>(function FloatingSelect({ label, className = "", children, ...props }, ref) {
    return (
        <div className="relative">
            <select
                ref={ref}
                {...props}
              
                style={{ colorScheme: "light", ...props.style }}
                className={`peer ${FIELD_BASE} appearance-none px-4 py-3.5 pl-10 dark:[color-scheme:dark] ${className}`}
            >
                {children}
            </select>

            <label className="pointer-events-none absolute right-4 top-0 -translate-y-1/2 bg-white px-1 text-[9px] font-semibold text-[#5D7595] peer-focus:text-[#2563EB] dark:bg-[#0E1F38] dark:text-[#8FAAD1] dark:peer-focus:text-[#38BDF8]">
                {label}
            </label>

            <ChevronDown
                size={14}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#2563EB] dark:text-[#38BDF8]"
            />
        </div>
    );
});

FloatingSelect.displayName = "FloatingSelect";

/**
 * Use this for every <option> rendered inside a FloatingSelect so the
 * fallback (non color-scheme-aware) browsers still render correctly:
 *
 *   <option className={OPTION_CLASS}>...</option>
 */
export const OPTION_CLASS =
    "bg-white text-[#0F2647] dark:bg-[#0E1F38] dark:text-[#EAF2FF]";

interface FloatingTextareaProps
    extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
}

export const FloatingTextarea = forwardRef<
    HTMLTextAreaElement,
    FloatingTextareaProps
>(function FloatingTextarea(
    { label, className = "", ...props },
    ref
) {
    return (
        <div className="relative">
            <textarea
                ref={ref}
                {...props}
                placeholder={props.placeholder ?? " "}
                className={`peer min-h-[110px] resize-none leading-6 ${FIELD_BASE} px-4 pb-3 pt-6 ${className}`}
            />

            <label className="pointer-events-none absolute right-4 top-0 -translate-y-1/2 bg-white px-1 text-[9px] font-semibold text-[#5D7595] peer-focus:text-[#2563EB] dark:bg-[#0E1F38] dark:text-[#8FAAD1] dark:peer-focus:text-[#38BDF8]">
                {label}
            </label>
        </div>
    );
});

FloatingTextarea.displayName = "FloatingTextarea";