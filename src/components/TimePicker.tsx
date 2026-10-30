"use client";

import { NiceSelect, type SelectOption } from "@/components/ui/NiceSelect";

const toFa = (s: string) => s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

const buildOptions = (count: number): SelectOption[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    label: toFa(String(i).padStart(2, "0")),
  }));

const HOURS = buildOptions(24);
const MINUTES = buildOptions(60);

interface TimePickerProps {
  value: string; // "HH:MM" or ""
  onChange: (value: string) => void;
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
  const [rawHour, rawMinute] = value ? value.split(":") : ["", ""];
  const hour = rawHour === "" ? -1 : Number(rawHour);
  const minute = rawMinute === "" || rawMinute === undefined ? -1 : Number(rawMinute);

  const emit = (h: number, m: number) => {
    const hh = String(h < 0 ? 0 : h).padStart(2, "0");
    const mm = String(m < 0 ? 0 : m).padStart(2, "0");
    onChange(`${hh}:${mm}`);
  };

  return (
    <div className="grid grid-cols-2 gap-3" dir="ltr">
      <NiceSelect
        label="ساعت"
        placeholder="ساعت"
        options={HOURS}
        value={hour < 0 ? null : hour}
        onChange={(h) => emit(h, minute)}
      />
      <NiceSelect
        label="دقیقه"
        placeholder="دقیقه"
        options={MINUTES}
        value={minute < 0 ? null : minute}
        onChange={(m) => emit(hour, m)}
      />
    </div>
  );
}
