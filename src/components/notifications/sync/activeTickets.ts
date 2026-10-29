"use client";

import { useEffect } from "react";

const counts = new Map<number, number>();


export function isTicketActive(ticketId: number): boolean {
  if (
    typeof document !== "undefined" &&
    document.visibilityState !== "visible"
  ) {
    return false;
  }
  return (counts.get(ticketId) ?? 0) > 0;
}


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
