"use client"

import { useState } from "react"
import { CheckSquare, Plus, Trash2, Circle, CheckCircle2 } from "lucide-react"

type Priority = "high" | "normal" | "low"

interface Task {
    id: number
    title: string
    done: boolean
    priority: Priority
}

const priorityMap: Record<Priority, { label: string; color: string; dot: string }> = {
    high: { label: "مهم", color: "text-red-400", dot: "bg-red-400" },
    normal: { label: "متوسط", color: "text-yellow-400", dot: "bg-yellow-400" },
    low: { label: "کم‌اهمیت", color: "text-blue-400", dot: "bg-blue-400" },
}

const initialTasks: Task[] = [
    { id: 1, title: "تکمیل گزارش هفتگی", done: false, priority: "high" },
    { id: 2, title: "بررسی ایمیل‌های ورودی", done: true, priority: "normal" },
    { id: 3, title: "هماهنگی با تیم فنی", done: false, priority: "high" },
    { id: 4, title: "به‌روزرسانی مستندات", done: false, priority: "low" },
    { id: 5, title: "آپلود فایل‌های پروژه", done: true, priority: "normal" },
]

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [newTask, setNewTask] = useState("")
    const [priority, setPriority] = useState<Priority>("normal")
    const [activeTab, setActiveTab] = useState<"all" | "active" | "done">("all")

    const toggle = (id: number) => {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
    }

    const remove = (id: number) => {
        setTasks((prev) => prev.filter((t) => t.id !== id))
    }

    const addTask = () => {
        if (!newTask.trim()) return
        setTasks((prev) => [
            ...prev,
            { id: Date.now(), title: newTask.trim(), done: false, priority },
        ])
        setNewTask("")
    }

    const filtered = tasks.filter((t) => {
        if (activeTab === "active") return !t.done
        if (activeTab === "done") return t.done
        return true
    })

    const doneCount = tasks.filter((t) => t.done).length
    const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10">
                    <CheckSquare size={22} className="text-purple-400" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">وظایف</h1>
                    <p className="text-sm text-zinc-400">مدیریت وظایف روزانه</p>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">پیشرفت کلی</span>
                    <span className="text-white font-medium">{doneCount} از {tasks.length} وظیفه</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-xs text-zinc-500">{progress}% تکمیل شده</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex gap-3">
                <input
                    type="text"
                    placeholder="وظیفه جدید..."
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                />
                <div className="flex items-center gap-2">
                    {(["high", "normal", "low"] as Priority[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPriority(p)}
                            className={`w-3 h-3 rounded-full transition-transform ${priorityMap[p].dot} ${priority === p ? "scale-125 ring-2 ring-white/30" : "opacity-50"}`}
                        />
                    ))}
                </div>
                <button
                    onClick={addTask}
                    className="flex items-center gap-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs px-3 py-2 rounded-xl transition-colors"
                >
                    <Plus size={14} />
                    افزودن
                </button>
            </div>

            <div className="flex gap-2">
                {[
                    { key: "all", label: "همه" },
                    { key: "active", label: "در جریان" },
                    { key: "done", label: "انجام‌شده" },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as typeof activeTab)}
                        className={`px-4 py-2 rounded-xl text-xs transition-colors ${activeTab === tab.key
                                ? "bg-purple-500 text-white"
                                : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="space-y-2">
                {filtered.length === 0 ? (
                    <div className="text-center text-zinc-500 py-12">وظیفه‌ای یافت نشد</div>
                ) : (
                    filtered.map((task) => {
                        const p = priorityMap[task.priority]
                        return (
                            <div
                                key={task.id}
                                className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex items-center gap-3 group hover:border-zinc-600 transition-colors"
                            >
                                <button onClick={() => toggle(task.id)} className="text-zinc-500 hover:text-purple-400 transition-colors">
                                    {task.done ? <CheckCircle2 size={20} className="text-purple-400" /> : <Circle size={20} />}
                                </button>
                                <p className={`flex-1 text-sm ${task.done ? "line-through text-zinc-600" : "text-white"}`}>
                                    {task.title}
                                </p>
                                <span className={`text-xs ${p.color}`}>{p.label}</span>
                                <button
                                    onClick={() => remove(task.id)}
                                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
