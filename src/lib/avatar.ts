import { resolveMediaUrl } from "@/lib/media";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) return "فقط فرمت‌های JPEG، PNG و WEBP مجاز است";
  if (file.size > MAX_AVATAR_SIZE) return "حجم عکس نباید بیشتر از ۵ مگابایت باشد";
  return null;
}

export function avatarSrc(url?: string | null, version?: number): string {
  const resolved = resolveMediaUrl(url);
  if (!resolved || version === undefined) return resolved;
  const separator = resolved.includes("?") ? "&" : "?";
  return `${resolved}${separator}v=${version}`;
}
