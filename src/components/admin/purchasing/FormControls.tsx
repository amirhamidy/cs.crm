"use client";



import {

    forwardRef,

    type InputHTMLAttributes,

    type SelectHTMLAttributes,

    type TextareaHTMLAttributes,

} from "react";

import { ChevronDown } from "lucide-react";



const FIELD_BASE =

    "w-full rounded-2xl border border-gray-200 bg-white text-[11.5px] font-semibold text-gray-800 outline-none transition-all placeholder:text-transparent focus:border-[#38BDF8] focus:ring-4 focus:ring-[#2563EB]/10 dark:border-white/[.08] dark:bg-[#101827] dark:text-white dark:focus:border-[#38BDF8] dark:focus:ring-[#38BDF8]/10";



const LABEL_BASE =

    "pointer-events-none absolute right-4 bg-white px-1 font-semibold text-gray-400 dark:bg-[#101827] dark:text-gray-500";



export const OPTION_CLASS =

    "bg-white text-gray-800 dark:bg-[#101827] dark:text-gray-100";



interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {

    label: string;

}



export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(

    function FloatingInput({ label, className = "", ...props }, ref) {

        return (

            <div className="relative">

                <input

                    ref={ref}

                    {...props}

                    placeholder={props.placeholder ?? " "}

                    className={`peer ${FIELD_BASE} px-4 py-3.5 ${className}`}

                />

                <label

                    className={`${LABEL_BASE} top-0 -translate-y-1/2 text-[9px] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-[10.5px] peer-focus:top-0 peer-focus:text-[9px] peer-focus:text-[#2563EB] dark:peer-focus:text-[#38BDF8]`}

                >

                    {label}

                </label>

            </div>

        );

    }

);



FloatingInput.displayName = "FloatingInput";



interface FloatingSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {

    label: string;

}



export const FloatingSelect = forwardRef<HTMLSelectElement, FloatingSelectProps>(

    function FloatingSelect({ label, className = "", children, ...props }, ref) {

        return (

            <div className="relative">

                <select

                    ref={ref}

                    {...props}

                    style={{ colorScheme: "light", ...props.style }}

                    className={`peer ${FIELD_BASE} appearance-none px-4 py-3.5 pl-10 disabled:opacity-60 dark:[color-scheme:dark] ${className}`}

                >

                    {children}

                </select>



                <label

                    className={`${LABEL_BASE} top-0 -translate-y-1/2 text-[9px] peer-focus:text-[#2563EB] dark:peer-focus:text-[#38BDF8]`}

                >

                    {label}

                </label>



                <ChevronDown

                    size={14}

                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#2563EB] dark:text-[#38BDF8]"

                />

            </div>

        );

    }

);



FloatingSelect.displayName = "FloatingSelect";



interface FloatingTextareaProps

    extends TextareaHTMLAttributes<HTMLTextAreaElement> {

    label: string;

}



export const FloatingTextarea = forwardRef<

    HTMLTextAreaElement,

    FloatingTextareaProps

>(function FloatingTextarea({ label, className = "", ...props }, ref) {

    return (

        <div className="relative">

            <textarea

                ref={ref}

                {...props}

                placeholder={props.placeholder ?? " "}

                className={`peer min-h-[110px] resize-none leading-6 ${FIELD_BASE} px-4 pb-3 pt-4 ${className}`}

            />



            <label

                className={`${LABEL_BASE} top-0 -translate-y-1/2 text-[9px] peer-focus:text-[#2563EB] dark:peer-focus:text-[#38BDF8]`}

            >

                {label}

            </label>

        </div>

    );

});



FloatingTextarea.displayName = "FloatingTextarea";

