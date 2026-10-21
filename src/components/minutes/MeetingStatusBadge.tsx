import type { MeetingStatus } from "@/types/minutes";
import { STATUS_META } from "@/lib/minutesUtils";

export default function MeetingStatusBadge({ status }: { status: MeetingStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.draft;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10.5px] font-bold ${meta.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden />
      {meta.label}
    </span>
  );
}
