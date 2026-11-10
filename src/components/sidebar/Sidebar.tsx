"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import {
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  LogOut,
  X,
} from "lucide-react";
import { Backdrop } from "@/components/ui/Backdrop";
import { Portal } from "@/components/ui/Portal";
import { cn, isRouteActive } from "@/lib/utils";
import {
  useSidebarIsOpen,
  useSidebarExpanded,
  useSidebarActions,
} from "@/store/mobileSidebarStore";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useLogout } from "@/hooks/useLogout";
import { EASE_OUT } from "@/lib/motion";
import MenuIcon from "./MenuIcon";

const RAIL_WIDTH = 76;
const EXPANDED_WIDTH = 256;

export default function Sidebar() {
  const pathname = usePathname();
  const isOpen = useSidebarIsOpen();
  const expanded = useSidebarExpanded();
  const { close, toggleExpanded, openLauncher } = useSidebarActions();
  const { logout } = useLogout();
  const menuItems = useMenuItems();
  const reduced = useReducedMotion() ?? false;
  const isMobile = useIsMobile();
  // در دسکتاپ همیشه ریل دیده می‌شود؛ جمع/باز شدن فقط روی دسکتاپ اثر دارد
  const isExpanded = expanded && !isMobile;
  // در موبایل (کشو) همیشه برچسب‌ها نمایش داده می‌شوند
  const showLabels = isExpanded || isMobile;

  // تولتیپ شناور: چون ناحیه‌ی منو اسکرول دارد، تولتیپ با position: fixed
  // و خارج از ناحیه‌ی اسکرول رندر می‌شود تا بریده نشود.
  const [tip, setTip] = useState<{
    label: string;
    group: string;
    top: number;
    right: number;
  } | null>(null);

  const showTip = useCallback(
    (el: HTMLElement, label: string, group: string) => {
      if (isExpanded || isMobile) return;
      const r = el.getBoundingClientRect();
      setTip({ label, group, top: r.top + r.height / 2, right: window.innerWidth - r.left + 10 });
    },
    [isExpanded, isMobile],
  );

  const hideTip = useCallback(() => setTip(null), []);

  // لوگوی رادکو ممکن است در public نباشد؛ در آن صورت حرف R نمایش داده می‌شود.
  const [logoFailed, setLogoFailed] = useState(false);

  const closeOnMobile = () => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      close();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div key="sidebar-backdrop" className="fixed inset-0 z-40 md:hidden">
            <Backdrop onClick={close} />
          </div>
        )}
      </AnimatePresence>

      <aside
        dir="rtl"
        className={cn(
          "fixed right-0 top-0 z-50 flex h-dvh w-[280px] flex-col overflow-hidden",
          "border-l border-white/10 text-white",
          "shadow-[0_0_60px_-15px_rgba(2,8,23,0.9)]",
          "transition-transform duration-300 ease-out will-change-transform",
          "md:top-16 md:z-40 md:h-[calc(100dvh-4rem)] md:translate-x-0 md:transition-[width,transform]",
          isOpen ? "translate-x-0" : "translate-x-full",
          isExpanded ? "md:w-64" : "md:w-[76px]",
        )}
        style={{
          background:
            "linear-gradient(180deg, #0A1020 0%, #0E1A31 42%, #0B1526 72%, #080E1B 100%)",
        }}
      >
        {/* هاله‌های نوری پس‌زمینه */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-1/2 h-64 w-64 translate-x-1/2 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(56,132,255,0.35), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-0 h-56 w-56 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(255,170,60,0.22), transparent 70%)" }}
        />

        {/* هدر: همبرگری + لوگو */}
        <div
          className={cn(
            "relative flex h-16 flex-shrink-0 items-center border-b border-white/10",
            showLabels ? "justify-between px-3" : "justify-center px-2 md:px-0",
          )}
        >
          <button
            type="button"
            onClick={openLauncher}
            aria-label="نمایش همه بخش‌ها"
            className="group relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/85 transition-colors hover:border-sky-300/40 hover:bg-white/[0.12] hover:text-white active:scale-95"
          >
            <LayoutGrid size={19} strokeWidth={1.7} />
            <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5" />
          </button>

          {showLabels && (
            <div className="min-w-0 flex-1 ps-3">
              <p className="truncate text-[13px] font-semibold text-white">منوی اصلی</p>
              <p className="truncate text-[10px] text-white/45">همه بخش‌های سیستم</p>
            </div>
          )}

          <button
            type="button"
            onClick={close}
            aria-label="بستن منو"
            className="ms-auto rounded-xl p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white md:hidden"
          >
            <X size={18} strokeWidth={1.6} />
          </button>
        </div>

        {/* آیتم‌های منو */}
        <nav
          onScroll={hideTip}
          className="relative flex-1 overflow-y-auto overflow-x-visible px-2 py-3 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]"
        >
          <ul className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const isActive = isRouteActive(pathname, item.href);

              return (
                <li key={item.href} className="group relative">
                  <Link
                    href={item.href}
                    onClick={closeOnMobile}
                    onMouseEnter={(e) => showTip(e.currentTarget, item.label, item.group)}
                    onMouseLeave={hideTip}
                    onFocus={(e) => showTip(e.currentTarget, item.label, item.group)}
                    onBlur={hideTip}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={item.label}
                    className={cn(
                      "relative flex h-12 items-center rounded-2xl transition-colors duration-200",
                      showLabels
                        ? "gap-3 px-3"
                        : "gap-3 px-3 md:justify-center md:gap-0 md:px-0",
                      isActive
                        ? "text-white"
                        : "text-white/65 hover:bg-white/[0.07] hover:text-white",
                    )}
                  >
                    {/* پیل فعال */}
                    {isActive && (
                      <m.span
                        layoutId={reduced ? undefined : "sidebar-active-pill"}
                        transition={{ duration: 0.25, ease: EASE_OUT }}
                        className="absolute inset-0 rounded-2xl border border-white/15 bg-white/[0.11] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                      />
                    )}

                    {/* نشانگر لبه‌ی راست */}
                    {isActive && (
                      <span className="absolute -right-2 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-sky-300 to-indigo-400 shadow-[0_0_10px_rgba(96,165,250,0.9)]" />
                    )}

                    <span
                      className={cn(
                        "relative z-10 flex flex-shrink-0 items-center justify-center transition-transform duration-200",
                        "group-hover:-translate-y-0.5 group-hover:scale-[1.08]",
                        isActive && "scale-[1.06]",
                      )}
                    >
                      <MenuIcon
                        slug={item.iconSlug}
                        fallback={item.icon}
                        size={showLabels ? 26 : 28}
                        alt={item.label}
                      />
                    </span>

                    <span
                      className={cn(
                        "relative z-10 truncate text-[13px] font-medium",
                        showLabels ? "block" : "block md:hidden",
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>

                </li>
              );
            })}
          </ul>
        </nav>

        {/* پایین سایدبار */}
        <div className="relative flex flex-col gap-1.5 border-t border-white/10 p-2">
          {/* جمع/باز کردن — فقط دسکتاپ */}
          <button
            type="button"
            onClick={toggleExpanded}
            aria-label={isExpanded ? "جمع کردن سایدبار" : "باز کردن سایدبار"}
            onMouseEnter={(e) =>
              !isExpanded && showTip(e.currentTarget, "باز کردن سایدبار", "نمایش")
            }
            onMouseLeave={hideTip}
            className={cn(
              "group relative hidden h-10 items-center rounded-2xl text-white/55 transition-colors hover:bg-white/[0.07] hover:text-white md:flex",
              isExpanded ? "gap-3 px-3" : "justify-center",
            )}
          >
            {isExpanded ? (
              <>
                <ChevronsRight size={18} strokeWidth={1.6} />
                <span className="text-[12px]">جمع کردن</span>
              </>
            ) : (
              <ChevronsLeft size={18} strokeWidth={1.6} />
            )}
          </button>

          <button
            type="button"
            onClick={logout}
            aria-label="خروج"
            onMouseEnter={(e) => showTip(e.currentTarget, "خروج از حساب", "حساب")}
            onMouseLeave={hideTip}
            className={cn(
              "group relative flex h-11 items-center rounded-2xl text-rose-300/85 transition-colors hover:bg-rose-500/15 hover:text-rose-200 active:scale-[0.98]",
              showLabels ? "gap-3 px-3" : "gap-3 px-3 md:justify-center md:gap-0 md:px-0",
            )}
          >
            <LogOut size={18} strokeWidth={1.6} className="flex-shrink-0" />
            <span className={cn("truncate text-[13px]", showLabels ? "block" : "block md:hidden")}>
              خروج
            </span>
          </button>

          <a
            href="https://radcosys.ir/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="توسعه داده شده توسط تیم فنی رادکو"
            onMouseEnter={(e) =>
              showTip(e.currentTarget, "توسعه داده شده توسط تیم فنی رادکو", "رادکو")
            }
            onMouseLeave={hideTip}
            className={cn(
              "group relative flex items-center rounded-2xl text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70",
              showLabels ? "h-10 gap-2 px-2" : "h-10 justify-center",
            )}
          >
            {logoFailed ? (
              <span className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 text-[12px] font-bold text-white ring-1 ring-white/10">
                R
              </span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/radco.png"
                alt="رادکو"
                width={26}
                height={26}
                onError={() => setLogoFailed(true)}
                className="h-[26px] w-[26px] flex-shrink-0 rounded-lg object-cover ring-1 ring-white/10"
              />
            )}
            {showLabels && (
              <span className="truncate text-[10px] leading-tight">
                توسعه داده شده توسط تیم فنی رادکو
              </span>
            )}
          </a>
        </div>
      </aside>

      {/* تولتیپ نام منو — حالت ریل جمع‌شده */}
      <Portal>
        <div
          role="tooltip"
          aria-hidden={!tip}
          style={{
            position: "fixed",
            top: tip?.top ?? 0,
            right: tip?.right ?? 0,
            transform: "translateY(-50%)",
            opacity: tip ? 1 : 0,
            transition: "opacity 150ms ease, transform 150ms ease",
            pointerEvents: "none",
          }}
          className={cn(
            "z-[120] hidden items-center gap-2 whitespace-nowrap rounded-xl border border-white/10",
            "bg-[#0B1526]/95 px-3 py-2 shadow-[0_16px_40px_-12px_rgba(2,8,23,0.9)] backdrop-blur-md md:flex",
          )}
        >
          <span className="text-[12px] font-medium text-white">{tip?.label}</span>
          <span className="h-1 w-1 rounded-full bg-sky-300/70" />
          <span className="text-[10px] text-white/50">{tip?.group}</span>
          <span className="absolute -right-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-r border-t border-white/10 bg-[#0B1526]" />
        </div>
      </Portal>
    </>
  );
}

export { RAIL_WIDTH, EXPANDED_WIDTH };
