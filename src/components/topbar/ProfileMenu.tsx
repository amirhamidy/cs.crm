"use client";
import { useEffect, useState } from "react";
import { ChevronDown, UserRound } from "lucide-react";
import { accountsApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useAvatarStore } from "@/store/avatarStore";
import AvatarUploader from "@/components/ui/AvatarUploader";
import UserAvatar from "@/components/ui/UserAvatar";
import { apiMessage } from "@/lib/apiMessage";
import { toast } from "@/components/notifications/toast";

export default function ProfileMenu({ name }: { name: string }) {
  const username = useAuthStore((s) => s.username);
  const { myAvatar, version, setMyAvatar } = useAvatarStore();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState(0);

  useEffect(() => {
    let alive = true;
    accountsApi.me().then((me) => { if (alive) { setUserId(me.id); setMyAvatar(me.avatar ?? null); } }).catch(() => {});
    return () => { alive = false; };
  }, [setMyAvatar]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const upload = async (file: File) => {
    try { const avatar = await accountsApi.me.uploadAvatar(file); setMyAvatar(avatar); toast.success("عکس پروفایل به‌روزرسانی شد"); }
    catch (e) { throw new Error(apiMessage(e, "آپلود عکس انجام نشد")); }
  };
  const remove = async () => {
    try { await accountsApi.me.removeAvatar(); setMyAvatar(null); toast.success("عکس پروفایل حذف شد"); }
    catch (e) { throw new Error(apiMessage(e, "حذف عکس انجام نشد")); }
  };

  return <div className="relative">
    <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-white/10">
      <UserAvatar key={version} src={myAvatar} name={name} id={userId || 1} size="h-8 w-8" rounded="rounded-full" />
      <span className="hidden text-[11.5px] font-bold md:block">{name}</span><ChevronDown size={14}/>
    </button>
    {open && <><button aria-label="بستن منو" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} /><div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-2xl dark:border-white/[0.08] dark:bg-[#0f172a]">
      <div className="mb-4 flex items-center gap-2 text-[11.5px] text-gray-500"><UserRound size={15}/>{username}</div>
      {userId > 0 && <AvatarUploader key={version} current={myAvatar} name={name} id={userId} onUpload={upload} onRemove={remove}/>}
    </div></>}
  </div>;
}
