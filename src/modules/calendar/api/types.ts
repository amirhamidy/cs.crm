export type CalendarEventType = "task" | "internal_task" | "internal_task_routine" | "note";

export type CalendarPerson = {
    id: number;
    full_name: string;
};

export type CalendarEvent = {
    id: number;
    title: string;
    start: string;
    end: string | null;
    type: CalendarEventType;
    people: {
        assigned_employee?: CalendarPerson[];
        assigned_to?: CalendarPerson[];
        created_by?: CalendarPerson;
    } | null;
};

export type CalendarResponse = {
    start: string;
    end: string;
    events: CalendarEvent[];
};
