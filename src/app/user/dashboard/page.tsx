"use client";

import { useEffect, useState } from "react";
import TasksWidget from "@/components/user/dashboard/TasksWidget";
import CompanyNews from "@/components/user/dashboard/CompanyNews";
import ScoreCard from "@/components/user/dashboard/ScoreCard";
import TodayEventCards from "@/components/user/dashboard/TodayEventCards";
import axiosInstance from "@/lib/axiosInstance";

interface CalendarEvent {
    id: number;
    title: string;
    start: string;
    end: string;
    type: "task" | "internal_task" | "note";
}

interface CalendarResponse {
    start: string;
    end: string;
    events: CalendarEvent[];
}

function getLocalISODate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export default function EmployeeDashboardPage() {
    const [employeeId, setEmployeeId] = useState<number | null>(null);
    const [events, setEvents] = useState<CalendarEvent[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem("crm-user-id");

        if (!stored) {
            return;
        }

        const parsed = Number.parseInt(stored, 10);

        if (!Number.isNaN(parsed)) {
            setEmployeeId(parsed);
        }
    }, []);

    useEffect(() => {
        const fetchCalendarEvents = async () => {
            try {
                const today = new Date();

                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);

                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);

                const start = getLocalISODate(yesterday);
                const end = getLocalISODate(tomorrow);

                const response = await axiosInstance.get<CalendarResponse>(
                    "https://api.radcosys.ir/appraisal/api/v1/calendar/",
                    {
                        params: {
                            start,
                            end,
                        },
                    }
                );

                const calendarEvents = Array.isArray(response.data?.events)
                    ? response.data.events
                    : [];

                setEvents(calendarEvents);
            } catch (error) {
                console.error("Calendar API Error:", error);
                setEvents([]);
            }
        };

        fetchCalendarEvents();
    }, []);

    return (
        <div className="min-h-screen w-full" dir="rtl">
            <div className="w-full space-y-6">
                <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <TasksWidget />
                        <TodayEventCards events={events} />
                    </div>

                    <div className="space-y-6">
                        <CompanyNews />

                        {employeeId !== null && (
                            <ScoreCard employeeId={employeeId} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}