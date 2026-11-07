import type { ComponentType, ReactNode } from "react";

export interface ColorStat {
    label: string;
    value: ReactNode;
    icon: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
    tone: string;
}

export const COLOR_TONES = [
    "bg-emerald-400 dark:bg-emerald-600",
    "bg-rose-400 dark:bg-rose-600",
    "bg-amber-300 !text-gray-900 dark:bg-amber-500",
    "bg-indigo-500 dark:bg-indigo-600",
];

export function ColorStatsPanel({
    stats,
    children,
}: {
    stats: Omit<ColorStat, "tone">[];
    children?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 rounded-3xl bg-gray-50 p-2 dark:bg-gray-800/40">
                {stats.map(({ label, value, icon: Icon }, i) => (
                    <div
                        key={label}
                        className={`relative flex min-w-0 items-center justify-between gap-2 overflow-hidden rounded-2xl p-3 text-white sm:p-4 ${COLOR_TONES[i % COLOR_TONES.length]}`}
                    >
                        <div className="min-w-0">
                            <div className="truncate text-[14px] font-bold opacity-90">{label}</div>
                            <div className="mt-1 truncate text-[14px] font-bold">{value}</div>
                        </div>
                        <Icon size={40} className="hidden shrink-0 opacity-25 sm:block" strokeWidth={1.5} />
                    </div>
                ))}
            </div>
            <div className="min-w-0 flex-1 rounded-3xl bg-gray-50 p-2 dark:bg-gray-800/40">
                {children}
            </div>
        </div>
    );
}
