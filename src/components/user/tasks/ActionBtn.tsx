"use client";

import React from "react";
import { motion } from "framer-motion";

interface ActionBtnProps {
    rippleKey: string;
    active: boolean;
    onClick: () => void;
    color: "red" | "emerald" | "pink" | "amber" | "indigo" | "accent";
    icon: React.ReactNode;
    label: string;
    full?: boolean;
    accentColor?: string;
    disabled?: boolean;
    title?: string;
}

const COLOR_MAP: Record<string, { base: string; ripple: string }> = {
    red: { base: "text-red-400 bg-red-500/10 hover:bg-red-500/20", ripple: "rgba(239,68,68,0.3)" },
    emerald: { base: "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20", ripple: "rgba(16,185,129,0.3)" },
    pink: { base: "text-pink-400 bg-pink-500/10 hover:bg-pink-500/20", ripple: "rgba(236,72,153,0.3)" },
    amber: { base: "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20", ripple: "rgba(245,158,11,0.3)" },
    indigo: { base: "text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20", ripple: "rgba(99,102,241,0.3)" },
    accent: { base: "text-white", ripple: "rgba(255,255,255,0.2)" },
};

export default function ActionBtn({
    rippleKey,
    active,
    onClick,
    color,
    icon,
    label,
    full,
    accentColor,
    disabled,
    title,
}: ActionBtnProps) {
    const c = COLOR_MAP[color];

    return (
        <motion.button
            key={rippleKey}
            type="button"
            onClick={onClick}
            disabled={disabled}
            animate={active ? { backgroundColor: ["transparent", c.ripple, "transparent"] } : {}}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            title={title}
            className={`h-8 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-bold overflow-hidden transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${c.base} ${full ? "w-full" : ""}`}
            style={
                color === "accent" && accentColor
                    ? {
                        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                        boxShadow: `0 4px 12px ${accentColor}35`,
                    }
                    : undefined
            }
        >
            {icon}
            {label}
        </motion.button>
    );
}
