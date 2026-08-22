
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState, useRef, MutableRefObject } from "react";
import { createPortal } from "react-dom";
import { LucideIcon } from "lucide-react";

interface SubItem {
  label: string;
  href: string;
}

interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: string;
  subItems?: SubItem[];
}

interface SidebarItemProps {
  item: MenuItem;
  isCollapsed: boolean;
}

function TooltipPortal({
  label,
  subItems,
  anchorRef,
}: {
  label: string;
  subItems?: SubItem[];
  anchorRef: MutableRefObject<HTMLDivElement | null>;
}) {
  const rect = anchorRef.current?.getBoundingClientRect();
  if (!rect) return null;

  const top = rect.top + rect.height / 2;
  const left = rect.left - 8;

  return createPortal(
    <div
      className="fixed z-[999] -translate-y-1/2 -translate-x-full"
      style={{ top, left }}
    >
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg shadow-xl px-3 py-2 min-w-[140px]">
        <p className="text-[14px] font-medium mb-1 text-[var(--text-primary)]">
          {label}
        </p>

        {subItems && subItems.length > 0 && (
          <div className="mt-1 flex flex-col gap-1">
            {subItems.map((sub, i) => (
              <Link
                key={i}
                href={sub.href}
                className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--purple-primary)] transition-colors py-0.5"
              >
                {sub.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default function SidebarItem({ item, isCollapsed }: SidebarItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const Icon = item.icon;

  const hasSubItems = item.subItems && item.subItems.length > 0;

  return (
    <div className="mb-1">
      <div
        ref={anchorRef}
        onMouseEnter={() => isCollapsed && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <button
          onClick={() => hasSubItems && !isCollapsed && setIsOpen(!isOpen)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group
            hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]
            ${isCollapsed ? "justify-center" : "justify-between"}`}
        >
          <div className="flex items-center gap-3">
            <Icon className="w-[18px] h-[18px] shrink-0" />
            {!isCollapsed && <span className="text-[13px]">{item.label}</span>}
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-2">
              {item.badge && (
                <span className="bg-[var(--purple-primary)] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
              {hasSubItems && (
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              )}
            </div>
          )}
        </button>
      </div>

      {showTooltip && isCollapsed && (
        <TooltipPortal
          label={item.label}
          subItems={item.subItems}
          anchorRef={anchorRef}
        />
      )}

      <AnimatePresence>
        {isOpen && !isCollapsed && hasSubItems && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0.5 pr-9 py-1">
              {item.subItems!.map((sub, i) => (
                <Link
                  key={i}
                  href={sub.href}
                  className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--purple-primary)] py-1.5 px-2 rounded-md hover:bg-[var(--bg-hover)] transition-colors"
                >
                  {sub.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
