import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizePath(path: string | null | undefined) {
  if (!path) return "/";
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}
