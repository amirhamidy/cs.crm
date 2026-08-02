"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    Circle,
    Clock,
    ListTodo,
    Calendar,
    ChevronLeft,
    ChevronRight,
    X,
} from "lucide-react";

type TaskStatus = "done" | "pending_approval" | "not_done";

interface Task {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    status: TaskStatus;
}

interface TasksWidgetProps {
    tasks?: Task[];
}

const statusConfig: Record<TaskStatus, { label: string; icon: React.ReactNode; className: string }> = {
    done: {
        label: "انجام شده",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        className: "text-emerald-500 dark:text-emerald-400",
    },
    pending_approval: {
        label: "در انتظار تایید",
        icon: <Clock className="w-3.5 h-3.5" />,
        className: "text-amber-500 dark:text-amber-400",
    },
    not_done: {
        label: "انجام نشده",
        icon: <Circle className="w-3.5 h-3.5" />,
        className: "text-gray-400 dark:text-gray-500",
    },
};

const statusBar: Record<TaskStatus, string> = {
    done: "bg-emerald-500",
    pending_approval: "bg-amber-500",
    not_done: "bg-gray-300 dark:bg-gray-700",
};

function DescriptionModal({
    open,
    title,
    description,
    onClose,
}: {
    open: boolean;
    title: string;
    description: string;
    onClose: () => void;
}) {
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 12 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md rounded-2xl border dark:border-white/[0.07] border-gray-100 dark:bg-[#111118] bg-white p-6 shadow-2xl"
                    >
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <h3 className="text-base font-bold dark:text-white text-gray-900 leading-relaxed">
                                {title}
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg shrink-0 dark:hover:bg-white/5 hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                            </button>
                        </div>
                        <p className="text-sm leading-7 dark:text-gray-400 text-gray-600 whitespace-pre-wrap">
                            {description}
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function TruncatedText({
    text,
    onExpand,
}: {
    text: string;
    onExpand: () => void;
}) {
    const ref = useRef<HTMLParagraphElement>(null);
    const [isClamped, setIsClamped] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        setIsClamped(el.scrollHeight > el.clientHeight + 1);
    }, [text]);

    return (
        <div>
            <p
                ref={ref}
                className="text-sm leading-6 dark:text-gray-400 text-gray-500 line-clamp-2"
            >
                {text}
            </p>
            {isClamped && (
                <button
                    onClick={onExpand}
                    className="text-xs font-medium dark:text-violet-400 text-violet-500 mt-1 hover:underline"
                >
                    بیشتر...
                </button>
            )}
        </div>
    );
}

export default function TasksWidget({ tasks = [] }: TasksWidgetProps) {
    const recent = tasks.slice(0, 5);
    const [index, setIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);

    const task = recent[index] ?? null;
    const total = recent.length;

    useEffect(() => {
        setIndex(0);
    }, [tasks]);

    function go(dir: 1 | -1) {
        const next = index + dir;
        if (next < 0 || next >= total) return;
        setDirection(dir);
        setIndex(next);
    }

    const variants = {
        enter: (d: number) => ({ opacity: 0, x: d > 0 ? -24 : 24 }),
        center: { opacity: 1, x: 0 },
        exit: (d: number) => ({ opacity: 0, x: d > 0 ? 24 : -24 }),
    };

    const s = task ? statusConfig[task.status] : null;

    return (
        <>
            {task && (
                <DescriptionModal
                    open={modalOpen}
                    title={task.title}
                    description={task.description ?? ""}
                    onClose={() => setModalOpen(false)}
                />
            )}

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="rounded-2xl border dark:border-white/[0.07] border-gray-100 dark:bg-[#111118] bg-white overflow-hidden flex flex-col"
                style={{ height: 240 }}
            >
                <div className="flex items-center justify-between px-5 py-4 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg dark:bg-violet-500/10 bg-violet-50">
                            <ListTodo className="w-4 h-4 dark:text-violet-400 text-violet-500" />
                        </div>
                        <span className="text-sm font-bold dark:text-white text-gray-900">
                            وظایف من
                        </span>
                    </div>

                    {total > 0 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => go(1)}
                                disabled={index >= total - 1}
                                className="p-1 rounded-lg transition-colors disabled:opacity-25 dark:hover:bg-white/5 hover:bg-gray-100"
                            >
                                <ChevronRight className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                            </button>
                            <span className="text-xs tabular-nums dark:text-gray-500 text-gray-400 min-w-[32px] text-center">
                                {index + 1}/{total}
                            </span>
                            <button
                                onClick={() => go(-1)}
                                disabled={index <= 0}
                                className="p-1 rounded-lg transition-colors disabled:opacity-25 dark:hover:bg-white/5 hover:bg-gray-100"
                            >
                                <ChevronLeft className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1 px-5 overflow-hidden">
                    <AnimatePresence mode="wait" custom={direction}>
                        {!task ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center h-full gap-2"
                            >
                                <ListTodo className="w-8 h-8 dark:text-gray-700 text-gray-200" />
                                <p className="text-sm dark:text-gray-600 text-gray-400">
                                    وظیفه‌ای ثبت نشده
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={task.id}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.22, ease: "easeInOut" }}
                                className="flex flex-col gap-2.5 h-full"
                            >
                                <div className={`h-0.5 w-full rounded-full shrink-0 ${statusBar[task.status]}`} />

                                <p className="text-base font-bold leading-relaxed dark:text-white text-gray-900 line-clamp-1">
                                    {task.title}
                                </p>

                                <div className="flex-1 min-h-0">
                                    {task.description ? (
                                        <TruncatedText
                                            text={task.description}
                                            onExpand={() => setModalOpen(true)}
                                        />
                                    ) : (
                                        <p className="text-sm dark:text-gray-600 text-gray-300 italic">
                                            توضیحاتی ثبت نشده
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pb-3 shrink-0">
                                    {task.dueDate ? (
                                        <span className="flex items-center gap-1.5 text-xs font-medium dark:text-gray-500 text-gray-400">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {task.dueDate}
                                        </span>
                                    ) : (
                                        <span />
                                    )}

                                    <span className={`flex items-center gap-1.5 text-xs font-bold ${s!.className}`}>
                                        {s!.icon}
                                        {s!.label}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {total > 1 && (
                    <div className="flex items-center justify-center gap-1 pb-3 shrink-0">
                        {recent.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setDirection(i > index ? 1 : -1);
                                    setIndex(i);
                                }}
                                className={`rounded-full transition-all duration-200 ${i === index
                                        ? "w-4 h-1.5 dark:bg-violet-400 bg-violet-500"
                                        : "w-1.5 h-1.5 dark:bg-white/10 bg-gray-200"
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </motion.div>
        </>
    );
}
