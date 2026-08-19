"use client";

import { useEffect, useState } from "react";
import TasksWidget from "@/components/user/dashboard/TasksWidget";
import PersianCalendar from "@/components/user/dashboard/PersianCalendar";
import CompanyNews from "@/components/user/dashboard/CompanyNews";
import ScoreCard from "@/components/user/dashboard/ScoreCard";

export default function EmployeeDashboardPage() {
    const [employeeId, setEmployeeId] = useState<number | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("crm-user-id");
        if (stored) {
            const parsed = parseInt(stored, 10);
            if (!isNaN(parsed)) setEmployeeId(parsed);
        }
    }, []);

    return (
        <div className="min-h-screen" dir="rtl">
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <TasksWidget />
                        <PersianCalendar />
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