"use client";

import { useState, useEffect } from "react";
import DashboardHero from "@/components/user/dashboard/DashboardHero";
import TasksWidget from "@/components/user/dashboard/TasksWidget";
import PersianCalendar from "@/components/user/dashboard/PersianCalendar";
import CalendarNoteModal, { loadAllNotes, type CalendarNote } from "@/components/user/dashboard/CalendarNoteModal";
import QuickNotes from "@/components/user/dashboard/QuickNotes";
import ActivityFeed from "@/components/user/dashboard/ActivityFeed";

type TaskStatus = "done" | "pending_approval" | "not_done";

interface Task {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    tags?: string[];
    status: TaskStatus;
}

interface SelectedDay {
    year: number;
    month: number;
    day: number;
}

const mockTasks: Task[] = [
    {
        id: "1",
        title: "تهیه گزارش فروش هفتگی",
        description: "گزارش کامل فروش هفته جاری رو تا پنجشنبه آماده کن و بفرست.",
        dueDate: "۱۴۰۵/۰۵/۱۵",
        tags: ["گزارش", "فروش"],
        status: "pending_approval",
    },
    {
        id: "2",
        title: "پیگیری مشتریان بالقوه",
        description: "با ۵ مشتری که هفته پیش تماس داشتیم دوباره هماهنگ کن.",
        dueDate: "۱۴۰۵/۰۵/۱۲",
        tags: ["CRM"],
        status: "not_done",
    },
    {
        id: "3",
        title: "به‌روزرسانی اطلاعات پروفایل در سیستم",
        status: "done",
    },
];

export default function EmployeeDashboardPage() {
    const [tasks, setTasks] = useState<Task[]>(mockTasks);
    const [allNotes, setAllNotes] = useState<Record<string, CalendarNote[]>>({});
    const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        setAllNotes(loadAllNotes());
    }, []);

    const handleStatusChange = (taskId: string, status: TaskStatus) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    };

    const handleDayClick = (year: number, month: number, day: number) => {
        setSelectedDay({ year, month, day });
        setIsModalOpen(true);
    };

    const handleNotesChange = (key: string, notes: CalendarNote[]) => {
        setAllNotes(prev => {
            if (notes.length === 0) {
                const next = { ...prev };
                delete next[key];
                return next;
            }
            return { ...prev, [key]: notes };
        });
    };

    const user = { name: "علی رضایی", role: "کارشناس فروش", avatar: null };
    const stats = { total: 24, completed: 14, pending: 6, overdue: 4 };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a12]" dir="rtl">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                <DashboardHero user={user} stats={stats} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <TasksWidget tasks={tasks} onStatusChange={handleStatusChange} />
                        <ActivityFeed />
                    </div>

                    <div className="space-y-6">
                        <PersianCalendar
                            onDayClick={handleDayClick}
                            notes={allNotes}
                        />
                        <QuickNotes />
                    </div>
                </div>
            </div>

            {selectedDay && (
                <CalendarNoteModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    year={selectedDay.year}
                    month={selectedDay.month}
                    day={selectedDay.day}
                    onNotesChange={handleNotesChange}
                />
            )}
        </div>
    );
}