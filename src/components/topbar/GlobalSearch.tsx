"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useMenuItems } from "@/hooks/useMenuItems";

export default function GlobalSearch() {
  const items = useMenuItems();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => {
    const t = q.trim();
    return t ? items.filter((i) => i.label.includes(t) || i.description.includes(t)).slice(0, 8) : [];
  }, [q, items]);

  return (
    <div className="relative w-full max-w-md">
      <input
        type="search"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) { router.push(results[0].href); setQ(""); }
        }}
        placeholder="جستجوی بخش‌ها..."
        autoComplete="off"
        className="h-9 w-full rounded-full border border-gray-100 bg-gray-50 px-4 text-[11px] font-semibold text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white [&::-webkit-search-cancel-button]:hidden"
      />
      {open && results.length > 0 && (
        <ul className="absolute inset-x-0 top-12 z-50 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 dark:border-white/10 dark:bg-gray-900">
          {results.map((r) => (
            <li key={r.href}>
              <button
                type="button"
                onMouseDown={() => { router.push(r.href); setQ(""); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
              >
                <r.icon size={15} strokeWidth={1.6} />
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
