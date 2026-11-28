"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Paperclip } from "lucide-react";
import { tasksApi } from "@/lib/api/tasks";
import { resolveMediaUrl } from "@/lib/media";

export interface TaskAttachment {
    id: number;
    file: string;
    original_file_name: string;
    uploaded_by_username?: string;
}

function isTaskAttachment(value: unknown): value is TaskAttachment {
    if (!value || typeof value !== "object") return false;
    const v = value as Record<string, unknown>;
    return typeof v.file === "string" && v.file.length > 0;
}

interface Props {
    taskId: number | string;
    attachments?: unknown[];
    isDark: boolean;
}

/**
 * فایل‌های اصلی تسک (task.attachments) را بالای مودال نشان می‌دهد،
 * مستقل از لاگ‌ها، تا فایلی که همراه تسک ساخته شده گم نشود.
 */
export default function TaskAttachmentsPanel({ taskId, attachments, isDark }: Props) {
    const [fetched, setFetched] = useState<unknown[] | null>(null);

    // کارت‌های لیست معمولاً attachments ندارند؛ تسک را مستقیم می‌گیریم.
    useEffect(() => {
        let alive = true;
        tasksApi
            .get<{ attachments?: unknown[] }>(taskId)
            .then((t) => { if (alive) setFetched(Array.isArray(t.attachments) ? t.attachments : []); })
            .catch(() => { if (alive) setFetched(null); });
        return () => { alive = false; };
    }, [taskId]);

    const items = (fetched ?? attachments ?? []).filter(isTaskAttachment);
    if (items.length === 0) return null;

    const bg = isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.02)";
    const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";

    return (
        <div className="mb-4 flex flex-col gap-2 rounded-2xl p-3" style={{ background: bg, border: `1px solid ${border}` }}>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                <Paperclip size={12} />
                فایل‌های پیوست تسک ({items.length})
            </div>

            {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <p className="truncate text-[11.5px] font-bold text-gray-700 dark:text-gray-200">
                            {item.original_file_name || "فایل"}
                        </p>
                        {item.uploaded_by_username && (
                            <p className="text-[10px] text-gray-400">آپلودکننده: {item.uploaded_by_username}</p>
                        )}
                    </div>

                    <a
                        href={resolveMediaUrl(item.file)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex shrink-0 items-center gap-1 rounded-xl bg-indigo-500/10 px-2.5 py-1.5 text-[10.5px] font-bold text-indigo-500 transition-colors hover:bg-indigo-500/20"
                    >
                        <ExternalLink size={11} />
                        باز کردن در تب جدید
                    </a>
                </div>
            ))}
        </div>
    );
}
