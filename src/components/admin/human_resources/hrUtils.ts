const G = [
  "from-indigo-500 to-violet-500",
  "from-pink-500 to-fuchsia-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
];

export const gradientOf = (n: number) => G[Math.abs(n) % G.length];
export const initialOf = (t: string, f = "د") => t.trim().charAt(0) || f;

