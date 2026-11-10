"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Search, X, CornerDownLeft } from "lucide-react";
import { cn, isRouteActive } from "@/lib/utils";
import { panelMotion, EASE_OUT } from "@/lib/motion";
import { Backdrop } from "@/components/ui/Backdrop";
import { ModalLayer } from "@/components/ui/ModalLayer";
import { Portal, useIsMobile, useModalBehavior } from "@/components/ui/Portal";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useSidebarActions, useSidebarLauncher } from "@/store/mobileSidebarStore";
import MenuIcon from "./MenuIcon";

export default function MenuLauncher() {
  const open = useSidebarLauncher();
  const { closeLauncher } = useSidebarActions();
  const pathname = usePathname();
  const menuItems = useMenuItems();
  const isMobile = useIsMobile();
  const reduced = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const [query, setQuery] = useState("");

  useModalBehavior({ open, onClose: closeLauncher, containerRef: ref });

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(t);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return menuItems;
    return menuItems.filter((item) =>
      [item.label, item.description, item.href]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [menuItems, query]);

  return (
    <AnimatePresence>
      {open && (
        <Portal>
          <ModalLayer
            dir="rtl"
            className={cn(
              "fixed inset-0 z-[110] flex justify-center",
              isMobile ? "items-end" : "items-center p-4 md:p-8",
            )}
          >
            <Backdrop onClick={closeLauncher} />

            <m.div
              ref={ref}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              {...panelMotion(isMobile, reduced)}
              className={cn(
                "relative flex w-full flex-col overflow-hidden outline-none",
                "border border-white/10 text-white shadow-[0_40px_120px_-30px_rgba(2,8,23,0.95)]",
                isMobile
                  ? "max-h-[92dvh] rounded-t-[28px]"
                  : "max-h-[86dvh] max-w-6xl rounded-[28px]",
              )}
              style={{
                background:
                  "linear-gradient(160deg, #0B1526 0%, #0E1A31 45%, #0A1020 100%)",
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(56,132,255,0.28), transparent 70%)",
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-32 right-0 h-72 w-72 rounded-full opacity-60 blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,170,60,0.18), transparent 70%)",
                }}
              />

              <div className="relative flex shrink-0 items-start gap-3 border-b border-white/10 px-5 py-4 md:px-7 md:py-5">
                <div className="min-w-0 flex-1">
                  <h2
                    id={titleId}
                    className="text-[17px] font-bold tracking-tight text-white md:text-[19px]"
                  >
                    همه‌ی بخش‌ها
                  </h2>
                  <p className="mt-0.5 text-[11px] text-white/45 md:text-[12px]">
                    برای رفتن به هر بخش، روی آیکون آن کلیک کنید
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeLauncher}
                  aria-label="بستن"
                  className="rounded-xl border border-white/10 bg-white/[0.06] p-2 text-white/70 transition-colors hover:bg-white/[0.12] hover:text-white active:scale-95"
                >
                  <X size={18} strokeWidth={1.7} />
                </button>
              </div>

              <div className="relative shrink-0 px-5 pb-3 pt-4 md:px-7">
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2.5 transition-colors focus-within:border-sky-300/40 focus-within:bg-white/[0.08]">
                  <Search size={16} className="shrink-0 text-white/40" strokeWidth={1.8} />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="جست‌وجوی بخش…"
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-white placeholder:text-white/35 focus:outline-none"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label="پاک کردن جست‌وجو"
                      className="rounded-lg p-1 text-white/40 transition-colors hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <span className="hidden items-center gap-1 rounded-lg border border-white/10 px-1.5 py-0.5 text-[10px] text-white/35 md:flex">
                    Esc
                  </span>
                </div>
              </div>

              <div className="custom-scrollbar relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 md:px-7">
                {filtered.length === 0 ? (
                  <p className="py-16 text-center text-[13px] text-white/40">
                    بخشی با این نام پیدا نشد.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 md:gap-2.5">
                    {filtered.map((item, i) => {
                      const isActive = isRouteActive(pathname, item.href);
                      return (
                        <m.div
                          key={item.href}
                          initial={reduced ? false : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.22,
                            ease: EASE_OUT,
                            delay: reduced ? 0 : Math.min(i * 0.025, 0.25),
                          }}
                        >
                          <Link
                            href={item.href}
                            onClick={closeLauncher}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                              "group relative flex h-full flex-col items-center gap-2 rounded-2xl border p-2 text-center transition-all duration-200 md:gap-2.5 md:p-3.5",
                              "hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(2,8,23,0.9)]",
                              isActive
                                ? "border-sky-300/40 bg-sky-400/[0.12]"
                                : "border-white/[0.08] bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.07]",
                            )}
                          >
                            {isActive && (
                              <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_8px_rgba(96,165,250,0.9)]" />
                            )}

                            <span className="mt-1 flex h-12 w-12 items-center justify-center transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-2 md:h-[68px] md:w-[68px]">
                              <MenuIcon
                                image={item.image}
                                fallback={item.icon}
                                size={48}
                                alt={item.label}
                                className="md:h-16 md:w-16"
                              />
                            </span>

                            <span className="flex flex-col gap-1">
                              <span className="text-[13px] font-semibold leading-tight text-white">
                                {item.label}
                              </span>
                              <span className="line-clamp-2 text-[10.5px] leading-relaxed text-white/45">
                                {item.description}
                              </span>
                            </span>
                          </Link>
                        </m.div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="relative flex shrink-0 items-center justify-between gap-3 border-t border-white/10 px-5 py-3 md:px-7">
                <p className="text-[10.5px] text-white/35">
                  {menuItems.length} بخش در دسترس شما
                </p>
                <span className="hidden items-center gap-1.5 text-[10.5px] text-white/35 md:flex">
                  <CornerDownLeft size={12} />
                  برای بستن Esc را بزنید
                </span>
              </div>
            </m.div>
          </ModalLayer>
        </Portal>
      )}
    </AnimatePresence>
  );
}
