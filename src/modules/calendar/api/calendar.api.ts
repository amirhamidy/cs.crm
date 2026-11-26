import api from "@/lib/axiosInstance";
import type { CalendarEvent, CalendarResponse } from "./types";

export async function getCalendarEvents(params: {
    start: string;
    end: string;
}): Promise<CalendarResponse> {
    const { data } = await api.get<CalendarResponse>("/appraisal/api/v1/calendar/", { params });
    return data;
}

export function notesFromEvents(events: CalendarEvent[]) {
    return events
        .filter((e) => e.type === "note")
        .map((e) => ({
            id: e.id,
            description: e.title,
            created_at: e.start,
        }));
}
