import type { ReactNode } from "react";
import { CARD } from "./ds";

export default function PageHeader({ icon, title, hint, actions }: {
  icon?: ReactNode; title: string; hint?: string; actions?: ReactNode;
}) {
  return (
    <div className={`${CARD} p-4`} dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon && <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">{icon}</div>}
          <div>
            <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">{title}</h1>
            {hint && <p className="mt-0.5 text-[11px] text-gray-400">{hint}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
