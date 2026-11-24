import type { ReactNode } from "react";
import { CARD, TONE, type Tone } from "./ds";

export default function StatTile({ label, value, unit, icon, tone = "indigo" }: {
  label: string; value: string; unit?: string; icon?: ReactNode; tone?: Tone;
}) {
  const t = TONE[tone];
  return (
    <div className={`${CARD} flex flex-col justify-between gap-5 p-4`}>
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-bold text-gray-400 dark:text-gray-500">{label}</span>
        {icon && <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${t.box}`}>{icon}</div>}
      </div>
      <p className={`text-2xl font-black ${t.text}`}>
        {value}{unit && <span className="mr-1 text-[11px] font-bold text-gray-400">{unit}</span>}
      </p>
    </div>
  );
}
