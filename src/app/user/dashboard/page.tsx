"use client";

import { useState, useEffect } from "react";
import TasksWidget from "@/components/user/dashboard/TasksWidget";
import PersianCalendar from "@/components/user/dashboard/PersianCalendar";
import CalendarNoteModal, { loadAllNotes, type CalendarNote } from "@/components/user/dashboard/CalendarNoteModal";
import CompanyNews from "@/components/user/dashboard/CompanyNews";




interface SelectedDay {
    year: number;
    month: number;
    day: number;
}

export default function EmployeeDashboardPage() {
    const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);



    const handleDayClick = (year: number, month: number, day: number) => {
        setSelectedDay({ year, month, day });
        setIsModalOpen(true);
    };




    return (
        <div className="min-h-screen " dir="rtl">
            <div className="space-y-6">


                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <TasksWidget />
                        <PersianCalendar
                            onDayClick={handleDayClick}
                        />
                    </div>
                    <div className="space-y-6">
                        <CompanyNews />
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
                />
            )}
        </div>
    );
}
