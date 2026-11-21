import api from "@/lib/axiosInstance";
import type { CalendarResponse } from "./types";

export async function getCalendarEvents(params: {
    start: string;
    end: string;
}): Promise<CalendarResponse> {
    const { data } = await api.get<CalendarResponse>("/appraisal/api/v1/calendar/", { params });
    return data;
}
