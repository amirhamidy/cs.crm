"use client";

import { useMemo } from "react";
import {
    CheckSquare,
    StickyNote,
    Users,
} from "lucide-react";

interface CalendarEvent {
    id: number;
    title: string;
    start: string;
    end: string;
    type: "task" | "internal_task" | "note";
}

interface Props {
    events?: CalendarEvent[];
    today?: string;
}

const TYPE_CONFIG = {
    task: {
        label: "وظایف",
        icon: CheckSquare,
        accent: "oklch(55% 0.18 260)",
        accentMuted: "oklch(55% 0.18 260 / 0.12)",
        accentBorder: "oklch(55% 0.18 260 / 0.35)",
    },
    internal_task: {
        label: "تیکت همکار",
        icon: Users,
        accent: "oklch(58% 0.16 195)",
        accentMuted: "oklch(58% 0.16 195 / 0.12)",
        accentBorder: "oklch(58% 0.16 195 / 0.35)",
    },
    note: {
        label: "یادداشت ها",
        icon: StickyNote,
        accent: "oklch(62% 0.17 55)",
        accentMuted: "oklch(62% 0.17 55 / 0.12)",
        accentBorder: "oklch(62% 0.17 55 / 0.35)",
    },
} as const;

type EventType = keyof typeof TYPE_CONFIG;

function getLocalISODate(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function parseDateTime(value: string): Date | null {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

function getEventLocalDate(value: string): string | null {
    const date = parseDateTime(value);

    if (!date) {
        return null;
    }

    return getLocalISODate(date);
}

function isSameDay(
    datetime: string,
    targetDate: string
): boolean {
    return getEventLocalDate(datetime) === targetDate;
}

function formatTime(datetime: string): string {
    const date = parseDateTime(datetime);

    if (!date) {
        return "--:--";
    }

    return date.toLocaleTimeString("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

function EventCard({
    event,
}: {
    event: CalendarEvent;
}) {
    const config = TYPE_CONFIG[event.type];
    const Icon = config.icon;

    return (
        <article
            dir="rtl"
            className="relative flex min-w-[260px] flex-1 basis-[280px] items-start gap-3 overflow-hidden rounded-2xl border p-4 transition-all duration-150 hover:brightness-105 hover:shadow-sm"
            style={{
                backgroundColor: config.accentMuted,
                borderColor: config.accentBorder,
            }}
        >
            <span
                className="absolute right-0 top-3 bottom-3 w-[3px] rounded-full"
                style={{
                    backgroundColor: config.accent,
                }}
                aria-hidden="true"
            />

            <span
                className="flex-shrink-0 rounded-xl p-2"
                style={{
                    backgroundColor: config.accentMuted,
                    color: config.accent,
                }}
            >
                <Icon
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                />
            </span>

            <div className="min-w-0 flex-1 text-right">
                <p className="truncate text-[13px] font-medium leading-snug text-gray-900 dark:text-gray-100">
                    {event.title}
                </p>
            </div>

            <span
                className="flex-shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-semibold"
                style={{
                    backgroundColor: config.accentMuted,
                    color: config.accent,
                }}
            >
                {config.label}
            </span>
        </article>
    );
}

export default function TodayEventCards({
    events = [],
    today,
}: Props) {
    const currentDate = today ?? getLocalISODate();

    const todayEvents = useMemo(() => {
        return events.filter((event) =>
            isSameDay(event.start, currentDate)
        );
    }, [events, currentDate]);

    const groupedEvents = useMemo(() => {
        const groups: Record<EventType, CalendarEvent[]> = {
            task: [],
            internal_task: [],
            note: [],
        };

        todayEvents.forEach((event) => {
            if (event.type in groups) {
                groups[event.type].push(event);
            }
        });

        return groups;
    }, [todayEvents]);

    const eventTypes: EventType[] = [
        "task",
        "internal_task",
        "note",
    ];

    return (
        <div
            dir="rtl"
            className="w-full"
            aria-label="رویدادهای امروز"
        >
            {todayEvents.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center dark:border-gray-800 dark:bg-gray-900">
                    <p className="text-[13px] text-gray-500 dark:text-gray-400">
                        برای امروز رویدادی وجود ندارد
                    </p>
                </div>
            ) : (
                <div className="flex w-full flex-wrap gap-3">
                    
                    {eventTypes.map((type) => {
                        const eventsByType = groupedEvents[type];

                        if (eventsByType.length === 0) {
                            return null;
                        }

                        return eventsByType.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                            />
                        ));
                    })}
                </div>
            )}
        </div>
    );
}