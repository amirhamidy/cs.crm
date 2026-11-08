export const C = {
    sold: "#2dd4bf",
    completed: "#60a5fa",
    in_progress: "#fbbf24",
    cancelled: "#fb7185",
    violet: "#a78bfa",
    indigo: "#818cf8",
    cyan: "#22d3ee",
    pink: "#f472b6",
};
export const STATUS = [
    { key: "sold", label: "فروش", color: C.sold },
    { key: "completed", label: "تکمیل‌شده", color: C.completed },
    { key: "in_progress", label: "در جریان", color: C.in_progress },
    { key: "cancelled", label: "لغو‌شده", color: C.cancelled },
] as const;
export const PALETTE = [C.indigo, C.cyan, C.sold, C.violet, C.pink, C.in_progress, C.completed, C.cancelled];

export const fa = (n: number) => Math.round(n).toLocaleString("fa-IR");
export const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
export const short = (s: string, n = 12) => (s && s.length > n ? s.slice(0, n) + "…" : s);

export const AXIS = { fontSize: 11, fill: "#9ca3af" };
export const GRID = "rgba(156,163,175,0.15)";

