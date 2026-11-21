export type CalendarEventType = "task" | "internal_task" | "note";

export type CalendarPerson = {
    id: number;
    full_name: string;
};

export type CalendarEvent = {
    id: number;
    title: string;
    start: string; 
    end: string;
    type: CalendarEventType;
    people: {
        assigned_employee?: CalendarPerson[];
        assigned_to?: CalendarPerson[];
        created_by?: CalendarPerson;
    };
};

export type CalendarResponse = {
    start: string;
    end: string;
    events: CalendarEvent[];
};
