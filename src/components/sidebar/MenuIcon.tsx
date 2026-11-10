"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { menuIconSrc } from "@/config/menu";

interface MenuIconProps {
  /** نام فایل آیکون در public/icons/menu (بدون پسوند) */
  slug: string;
  /** آیکون خطی — اگر تصویر پیدا نشد یا لود نشد نمایش داده می‌شود */
  fallback: LucideIcon;
  /** اندازه‌ی مربع آیکون به پیکسل */
  size?: number;
  alt: string;
  className?: string;
}

/**
 * آیکون سه‌بعدی منو.
 *
 * تصویر از `public/icons/menu/{slug}.png` خوانده می‌شود.
 * اگر فایل وجود نداشته باشد یا لود نشود، به‌صورت خودکار آیکون خطی (lucide)
 * نمایش داده می‌شود؛ پس رابط کاربری هرگز خالی نمی‌ماند.
 *
 * از تگ ساده‌ی <img> استفاده شده تا اگر فایل‌ها را با SVG جایگزین کردی
 * هم بدون تنظیمات next.config کار کند.
 */
export default function MenuIcon({
  slug,
  fallback: Fallback,
  size = 28,
  alt,
  className,
}: MenuIconProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-xl bg-white/10 text-white/80",
          className,
        )}
        style={{ width: size, height: size }}
      >
        <Fallback size={Math.round(size * 0.62)} strokeWidth={1.6} />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={menuIconSrc(slug)}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className={cn(
        "select-none object-contain drop-shadow-[0_6px_14px_rgba(2,8,23,0.45)]",
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}
