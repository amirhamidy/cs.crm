"use client";

import { InternalTask } from "./InternalTasksKanban";
import { todayJalali } from "@/lib/jalali";
import { Paperclip } from "lucide-react";

const PRIORITY_STYLES: Record<InternalTask["priority"], string> = {
  low: "bg-emerald-500/20 text-emerald-300",
  medium: "bg-amber-500/20 text-amber-300",
  high: "bg-rose-500/20 text-rose-300",
};

const PRIORITY_LABEL: Record<InternalTask["priority"], string> = {
  low: "کم",
  medium: "متوسط",
  high: "زیاد",
};

export default function InternalTaskCard({
  task,
  interactive,
  onClick,
}: {
  task: InternalTask;
  interactive: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={[
        "rounded-2xl border border-white/10 bg-white/5 p-4 transition-all",
        interactive
          ? "cursor-pointer hover:border-violet-500/40 hover:bg-white/10"
          : "opacity-70",
      ].join(" ")}
    >
      <p className="mb-2 text-sm font-medium text-white">{task.title}</p>

      {task.description && (
        <p className="mb-3 line-clamp-2 text-xs text-white/50">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <span
          className={[
            "rounded-full px-2 py-0.5 text-xs font-medium",
            PRIORITY_STYLES[task.priority],
          ].join(" ")}
        >
          {PRIORITY_LABEL[task.priority]}
        </span>

        <div className="flex items-center gap-2 text-xs text-white/40">
          {task.attachments.length > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {task.attachments.length}
            </span>
          )}
          {task.due_date && (
            <span>{todayJalali()}</span>
          )}
        </div>
      </div>
    </div>
  );
}
