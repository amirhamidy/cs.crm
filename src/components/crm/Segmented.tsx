"use client";

import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  disabled,
  size = "md",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="radiogroup"
      className="inline-flex w-full gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-white/[0.05]"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 rounded-xl font-bold transition-all disabled:opacity-60",
              size === "sm" ? "min-h-8 px-2 text-[11px]" : "min-h-10 px-3 text-[12.5px]",
              active
                ? "bg-white text-brand shadow-sm dark:bg-white/10"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
