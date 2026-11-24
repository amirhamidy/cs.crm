import type { ReactNode } from "react";
import { AlertCircle, Search } from "lucide-react";

const BOX = "flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-[2rem] bg-white dark:bg-[#111827]";

export function EmptyState({ title = "موردی پیدا نشد", hint, text, icon }: {
  title?: string; hint?: string; text?: string; icon?: ReactNode;
}) {
  return (
    <div className={`${BOX} border border-dashed border-gray-200 dark:border-white/[0.07]`}>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-400 dark:bg-indigo-500/10">{icon ?? <Search size={19} />}</span>
      <p className="text-[12.5px] font-extrabold text-gray-800 dark:text-white">{title}</p>
      {(hint ?? text) && <p className="max-w-xs text-[10.5px] font-semibold text-gray-400">{hint ?? text}</p>}
    </div>
  );
}

export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-full bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
      <AlertCircle size={14} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function ErrorState({ message = "خطا در دریافت اطلاعات", onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className={`${BOX} border border-rose-100 dark:border-rose-500/20`}>
      <AlertCircle size={19} className="text-rose-500" />
      <p className="text-[12px] font-extrabold text-gray-800 dark:text-white">{message}</p>
      {onRetry && <button type="button" onClick={onRetry} className="h-8 rounded-full bg-indigo-600 px-4 text-[11px] font-extrabold text-white">تلاش مجدد</button>}
    </div>
  );
}
