"use client";

import { useQuery } from "@tanstack/react-query";
import { getCalendarEvents } from "../api/calendar.api";
import { calendarKeys } from "./calendar.keys";

export function useCalendarEvents(start: string, end: string) {
    return useQuery({
        queryKey: calendarKeys.events(start, end),
        queryFn: () => getCalendarEvents({ start, end }),
        enabled: Boolean(start && end),
        staleTime: 60_000,
    });
}
