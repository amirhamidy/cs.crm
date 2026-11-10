"use client";

import { useState } from "react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { menuImageSrc } from "@/config/menu";

interface MenuIconProps {
  image: number;
  fallback: LucideIcon;
  size?: number;
  alt: string;
  className?: string;
}

export default function MenuIcon({
  image,
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
    <Image
      src={menuImageSrc(image)}
      alt={alt}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      draggable={false}
      className={cn("select-none object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
