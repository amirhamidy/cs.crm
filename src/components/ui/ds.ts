/** توکن‌های مشترک طراحی (HR + Production) */
const G = [
  "from-indigo-500 to-violet-500",
  "from-pink-500 to-fuchsia-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
];
export const gradientOf = (n: number) => G[Math.abs(n) % G.length];
export const initialOf = (t: string, f = "د") => (t || "").trim().charAt(0) || f;

export const CARD =
  "rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111827]";
export const CARD_HOVER =
  "transition-shadow hover:shadow-xl hover:shadow-black/[0.04]";
export const GRID = "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3";

export type Tone = "emerald" | "indigo" | "red" | "amber";
export const TONE: Record<Tone, { box: string; text: string }> = {
  emerald: { box: "bg-emerald-500/10 text-emerald-500", text: "text-gray-900 dark:text-white" },
  indigo: { box: "bg-indigo-500/10 text-indigo-500", text: "text-indigo-600 dark:text-indigo-400" },
  red: { box: "bg-red-500/10 text-red-500", text: "text-red-600 dark:text-red-400" },
  amber: { box: "bg-amber-500/10 text-amber-500", text: "text-amber-600 dark:text-amber-400" },
};
