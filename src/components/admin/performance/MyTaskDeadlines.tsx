"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard, COLORS, Tip, axisProps } from "./chartKit";
import { useTheme } from "next-themes";
import api from "@/lib/axiosInstance";
import { listAll } from "@/lib/api";

interface Task {
    id: number;
    title: string;
    current_step: number | null;
    current_step_name?: string | null;
    assigned_employee?: number[];
    status: string;
}

interface Employee {
    id: number;
    username?: string;
    full_name?: string;
}

interface ExpiredTask extends Task {
    deadline: string;
    started_at: string | null;
}

export default function MyTaskDeadlines() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [tasks, setTasks] = useState<ExpiredTask[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                
                
                const [source, employeeSource] = await Promise.all([
                    listAll<Task>("/tasks/api/v1/tasks/"),
                    listAll<Employee>("/accounts/api/v1/employee/list/"),
                ]);

                const results = await Promise.all(
                    source
                        .filter((task) => task.current_step)
                        .map(async (task) => {
                            try {
                                const { data } = await api.get(
                                    `/tasks/api/v1/tasks/${task.id}/steps/${task.current_step}/deadline/`
                                );

                                if (!data?.deadline || new Date(data.deadline).getTime() >= Date.now()) {
                                    return null;
                                }

                                return {
                                    ...task,
                                    deadline: data.deadline,
                                    started_at: data.started_at ?? null,
                                };
                            } catch {
                                return null;
                            }
                        })
                );

                if (!cancelled) {
                    setTasks(
                        results
                            .filter((task): task is ExpiredTask => task !== null)
                            .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                    );
                    setEmployees(employeeSource);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const now = Date.now();
    const data = tasks.slice(0, 12).map((t) => ({
        name: t.title.length > 14 ? t.title.slice(0, 14) + "…" : t.title,
        days: Math.max(1, Math.ceil((now - new Date(t.deadline).getTime()) / 86400000)),
    }));

    return (
        <ChartCard
            title="تسک‌های دارای Deadline گذشته"
            hint="هر نقطه یک تسک است؛ هرچه بالاتر باشد، تعداد روزهای تأخیر بیشتر است."
            loading={loading}
            empty={!data.length}
        >
            <ResponsiveContainer>
                <LineChart data={data} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid vertical={false} stroke="rgba(150,150,150,.12)" />
                    <XAxis dataKey="name" {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip content={<Tip dark={isDark} names={{ days: "روز تأخیر" }} />} />
                    <Line type="stepAfter" dataKey="days" stroke={COLORS.purple} strokeWidth={2.5} dot={{ r: 5, fill: COLORS.red, stroke: "none" }} />
                </LineChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
