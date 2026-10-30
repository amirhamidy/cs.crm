"use client";
import { useEffect, useState } from "react";
import { ImagePlus, Trash2, Loader2 } from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";
import { validateAvatarFile } from "@/lib/avatar";

interface Props {
  current?: string | null;
  name: string;
  id: number;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}

export default function AvatarUploader({ current, name, id, onUpload, onRemove }: Props) {
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasCurrent, setHasCurrent] = useState(Boolean(current));

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => { setHasCurrent(Boolean(current)); }, [current]);

  const selectFile = async (file?: File) => {
    if (!file) return;
    const invalid = validateAvatarFile(file);
    if (invalid) { setError(invalid); return; }
    setError("");
    const url = URL.createObjectURL(file);
    setPreview(url);
    setBusy(true);
    try {
      await onUpload(file);
      setHasCurrent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "بارگذاری عکس انجام نشد");
      setPreview("");
    } finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={name} className="h-24 w-24 rounded-3xl object-cover" />
      ) : <UserAvatar src={current} name={name} id={id} size="h-24 w-24" />}
      <div className="flex flex-wrap justify-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
          تغییر عکس
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(e) => { void selectFile(e.target.files?.[0]); e.currentTarget.value = ""; }} />
        </label>
        {hasCurrent && <button type="button" disabled={busy} onClick={async () => { setBusy(true); setError(""); try { await onRemove(); setPreview(""); setHasCurrent(false); } catch (e) { setError(e instanceof Error ? e.message : "حذف عکس انجام نشد"); } finally { setBusy(false); } }} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 disabled:opacity-50"><Trash2 size={15} /> حذف عکس</button>}
      </div>
      {error && <p className="text-xs text-rose-500">{error}</p>}
      <p className="text-[11px] text-gray-400">JPEG، PNG یا WEBP · حداکثر ۵ مگابایت</p>
    </div>
  );
}
