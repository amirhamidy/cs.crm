"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { avatarSrc } from "@/lib/avatar";
import { useAvatarStore } from "@/store/avatarStore";

interface Props {
  src?: string | null;
  name: string;
  id: number;
  size?: string;
  rounded?: string;
  className?: string;
}

export default function UserAvatar({ src, name, id, size = "h-11 w-11", rounded = "rounded-2xl", className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  const version = useAvatarStore((state) => state.version);
  useEffect(() => { setFailed(false); }, [src, version]);
  const hue = (Math.abs(id) * 53) % 360;
  const image = src && !failed ? avatarSrc(src, version) : "";
  return image ? (
    <Image src={image} alt={name} width={96} height={96} unoptimized onError={() => setFailed(true)} className={`${size} ${rounded} shrink-0 object-cover ${className}`} />
  ) : (
    <div className={`${size} ${rounded} flex shrink-0 select-none items-center justify-center text-[15px] font-extrabold text-white ${className}`} style={{ background: `linear-gradient(135deg, oklch(55% 0.18 ${hue}), oklch(45% 0.22 ${(hue + 30) % 360}))` }}>
      {name?.trim()?.charAt(0) || "؟"}
    </div>
  );
}
