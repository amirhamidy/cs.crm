"use client";

import { useEffect } from "react";

const counts = new Map<number, number>();

/** آیا چت این تیکت همین الان جلوی چشم کاربر باز است؟ */
export function isTicketActive(ticketId: number): boolean {
  if (
    typeof document !== "undefined" &&
    document.visibilityState !== "visible"
  ) {
    return false;
  }
  return (counts.get(ticketId) ?? 0) > 0;
}

/**
 * اختیاری: داخل مودال چت تیکت صدا بزن تا برای پیام‌هایی که همان لحظه دارد
 * می‌خواندشان نوتیف نیاید.
 *
 *   useSuppressTicketAlerts(task.id, open);
 */
export function useSuppressTicketAlerts(
  ticketId: number | null | undefined,
  active = true,
) {
  useEffect(() => {
    if (!active || ticketId == null) return;

    counts.set(ticketId, (counts.get(ticketId) ?? 0) + 1);
    return () => {
      const left = (counts.get(ticketId) ?? 1) - 1;
      if (left <= 0) counts.delete(ticketId);
      else counts.set(ticketId, left);
    };
  }, [ticketId, active]);
}
