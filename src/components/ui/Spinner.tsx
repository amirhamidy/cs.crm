import type { CSSProperties } from "react";

/**
 * Thin 12-spoke spinner (iOS style). Uses currentColor, so it is white inside
 * coloured buttons. Drop-in for lucide's Loader2 (`size`, `className`, `style`).
 */
export function Spinner({
    size = 16,
    className = "",
    style,
}: {
    size?: number;
    className?: string;
    style?: CSSProperties;
    strokeWidth?: number;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            aria-hidden="true"
            className={`animate-spin motion-reduce:[animation-duration:2.5s] ${className}`}
            style={{ animationTimingFunction: "linear", ...style }}
        >
            {Array.from({ length: 12 }, (_, i) => (
                <line
                    key={i}
                    x1="12"
                    y1="3"
                    x2="12"
                    y2="7"
                    opacity={0.15 + (i / 11) * 0.85}
                    transform={`rotate(${i * 30} 12 12)`}
                />
            ))}
        </svg>
    );
}
