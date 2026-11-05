import type { CSSProperties } from "react";

/**
 * iOS-style 12-spoke spinner. The icon does NOT rotate: each spoke fades from
 * bright to dim with a staggered delay (CSS keyframes `spinner-spoke` in globals.css),
 * so the bright "head" travels around the circle. Uses currentColor.
 * Drop-in for lucide's Loader2 (`size`, `className`, `style`).
 *
 * `size` is the LAYOUT box (what parents see), so changing the visual size never
 * moves buttons or other parents. The spinner is drawn `scale` times bigger than
 * that box and is centered on it.
 */
const SPOKES = 12;

export function Spinner({
    size = 16,
    scale = 1.3,
    className = "",
    style,
}: {
    size?: number;
    scale?: number;
    className?: string;
    style?: CSSProperties;
    strokeWidth?: number;
}) {
    const visual = Math.round(size * scale);
    // Callers still pass `animate-spin` (old Loader2 habit); it must not rotate us.
    const cleanClass = className
        .replace(/\banimate-spin\b/g, "")
        .replace(/\bmotion-reduce:\[animation-duration:[^\]]*\]/g, "")
        .trim();

    return (
        <span
            aria-hidden="true"
            className="pointer-events-none relative inline-block shrink-0 align-middle"
            style={{ width: size, height: size }}
        >
            <svg
                width={visual}
                height={visual}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                className={`absolute ${cleanClass}`}
                style={{
                    left: "50%",
                    top: "50%",
                    marginLeft: -visual / 2,
                    marginTop: -visual / 2,
                    ...style,
                }}
            >
                {Array.from({ length: SPOKES }, (_, i) => (
                    <line
                        key={i}
                        className="spinner-spoke"
                        x1="12"
                        y1="2.5"
                        x2="12"
                        y2="7.5"
                        transform={`rotate(${i * 30} 12 12)`}
                        style={{ animationDelay: `calc(var(--spinner-dur, 1s) * ${(i / SPOKES - 1).toFixed(4)})` }}
                    />
                ))}
            </svg>
        </span>
    );
}