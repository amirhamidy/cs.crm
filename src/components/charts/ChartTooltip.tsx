"use client";

import { AnimatePresence, motion } from "framer-motion";

type TooltipRow = {
    dotStyle: "circle" | "square" | "dashed-circle";
    label: string;
    value: string;
    color: string;
};

type FooterRow = {
    label: string;
    value: string;
    valueColor?: string;
};

type ChartTooltipProps = {
    title: string;
    rows: TooltipRow[];
    footer?: FooterRow;
    dark: boolean;
    colorKey: string;
    glowColor?: string;
};

export function ChartTooltip({ title, rows, footer, dark, colorKey, glowColor }: ChartTooltipProps) {
    return (
        <div
            className={`
                pointer-events-none rounded-xl backdrop-blur-sm
                border min-w-[132px] px-3 py-2
                ${dark ? "bg-slate-900/95 border-white/10" : "bg-white/95 border-gray-200/60"}
            `}
            style={{
                boxShadow: glowColor
                    ? `0 2px 1px ${glowColor}`
                    : dark
                        ? "0 1px 1px rgba(0,0,0,0.4)"
                        : "0 1px 1px rgba(0,0,0,0.08)",
            }}
        >
            <div className="mb-1 flex items-center gap-1.5">
                <span className={`text-[12px] font-semibold ${dark ? "text-gray-100" : "text-gray-800"}`}>
                    {title}
                </span>
            </div>

            <div className="flex flex-col gap-1">
                {rows.map((row, i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5">
                            {row.dotStyle === "square" && (
                                <span
                                    className="h-2 w-2 rounded-sm"
                                    style={{
                                        backgroundColor: row.color,
                                        boxShadow: `0 0 2px ${row.color}18`,
                                    }}
                                />
                            )}
                            {row.dotStyle === "circle" && (
                                <span
                                    className="h-2 w-2 rounded-full"
                                    style={{
                                        backgroundColor: row.color,
                                        boxShadow: `0 0 6px ${row.color}88`,
                                    }}
                                />
                            )}
                            {row.dotStyle === "dashed-circle" && (
                                <span
                                    className="h-2 w-2 rounded-full border"
                                    style={{ borderColor: row.color }}
                                />
                            )}
                            <span className={`text-[11px] ${dark ? "text-gray-400" : "text-gray-500"}`}>
                                {row.label}
                            </span>
                        </div>
                        <span className={`text-[11px] font-bold tabular-nums ${dark ? "text-gray-100" : "text-gray-800"}`}>
                            {row.value}
                        </span>
                    </div>
                ))}

                {footer && (
                    <div
                        className={`mt-0.5 pt-1 border-t flex items-center justify-between ${dark ? "border-white/10" : "border-gray-100"}`}
                    >
                        <span className={`text-[10px] ${dark ? "text-gray-500" : "text-gray-400"}`}>
                            {footer.label}
                        </span>
                        <span
                            className="text-[11px] font-bold tabular-nums"
                            style={{ color: footer.valueColor }}
                        >
                            {footer.value}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

type AnimatedChartTooltipProps = ChartTooltipProps & {
    visible: boolean;
    animKey: string | number;
    position?: "top-left" | "top-right";
};

export function AnimatedChartTooltip({
    visible,
    animKey,
    position = "top-right",
    ...tooltipProps
}: AnimatedChartTooltipProps) {
    return (
        <div className={`absolute top-14 z-10 min-w-[130px] ${position === "top-right" ? "right-2" : "left-2"}`}>
            <AnimatePresence mode="wait">
                {visible && (
                    <motion.div
                        key={animKey}
                        initial={{ opacity: 0, y: 4, filter: "blur(2px)", scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                        exit={{ opacity: 0, y: 4, filter: "blur(1px)", scale: 0.96 }}
                        transition={{ duration: 0.18 }}
                    >
                        <ChartTooltip {...tooltipProps} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
