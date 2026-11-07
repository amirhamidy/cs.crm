import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizePath(path: string | null | undefined) {
  if (!path) return "/";
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/** آیا pathname همان مسیر منو است یا یکی از زیرمسیرهای آن (مثل /sales/top برای /sales)؟ */
export function isRouteActive(pathname: string | null | undefined, href: string) {
  const current = normalizePath(pathname);
  const base = normalizePath(href);
  return current === base || current.startsWith(`${base}/`);
}
