"use client";

import { Paperclip, ExternalLink } from "lucide-react";
import { resolveMediaUrl } from "@/lib/media";

interface RawAttachment {
    id?: number | string;
    file?: string | null;
    original_file_name?: string | null;
    file_name?: string | null;
    uploaded_by_username?: string | null;
}

export default function TaskFileButtons({ attachments }: { attachments?: unknown[] | null }) {
    const items = (Array.isArray(attachments) ? attachments : []).filter(
        (a): a is RawAttachment => !!a && typeof a === "object" && !!(a as RawAttachment).file
    );

    if (items.length === 0) return null;

    return (
        <div className="mb-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-indigo-500">
                <Paperclip size={12} />
                فایل‌های وظیفه
            </div>
            <div className="flex flex-wrap gap-1.5">
                {items.map((a, i) => (
                    <button
                        key={a.id ?? i}
                        type="button"
                        title={a.uploaded_by_username ? `آپلود: ${a.uploaded_by_username}` : undefined}
                        onClick={() => window.open(resolveMediaUrl(a.file), "_blank", "noopener,noreferrer")}
                        className="inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-xl bg-indigo-500/10 px-2.5 py-2 text-[11px] font-bold text-indigo-500 transition-colors hover:bg-indigo-500/20"
                    >
                        <ExternalLink size={12} className="shrink-0" />
                        <span className="truncate">{a.original_file_name || a.file_name || "مشاهده فایل"}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
