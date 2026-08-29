"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { useAuthStore } from "@/store/authStore";

export default function CompanyNews() {
    const { userId } = useAuthStore();

    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        const cleanDescription = description.trim();

        if (!cleanDescription || !userId || submitting) {
            return;
        }

        setSubmitting(true);

        try {
            await axiosInstance.post("/note/api/v1/create/", {
                user: Number(userId),
                description: cleanDescription,
            });

            setDescription("");
        } catch (error) {
            console.error("Failed to create note:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleKeyDown = (
        event: React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
        if (
            event.key === "Enter" &&
            (event.ctrlKey || event.metaKey) &&
            !event.shiftKey
        ) {
            event.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div
            dir="rtl"
            className="w-full"
        >
            <div className="overflow-hidden rounded-[2rem] border border-zinc-200/70 bg-white/80 p-4 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.15)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-6">
                <div className="relative">
                    <textarea
                        value={description}
                        onChange={(event) =>
                            setDescription(event.target.value)
                        }
                        onKeyDown={handleKeyDown}
                        placeholder=" "
                        rows={4}
                        disabled={submitting || !userId}
                        className="peer w-full resize-none rounded-[2rem] border border-zinc-200 bg-zinc-50/80 px-5 pb-16 pt-8 text-sm leading-7 text-zinc-800 outline-none transition-all focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-70 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-100"
                    />

                    <label className="pointer-events-none absolute right-5 top-5 text-sm text-zinc-400 transition-all peer-focus:top-3 peer-focus:text-[11px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-[11px]">
                        یادداشت جدید
                    </label>

                    <div className="pointer-events-none absolute bottom-5 right-5 text-[10px] text-zinc-400">
                        ثبت با Ctrl + Enter
                    </div>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={
                            submitting ||
                            !description.trim() ||
                            !userId
                        }
                        aria-label="ثبت یادداشت"
                        title="ثبت یادداشت"
                        className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                    >
                        {submitting ? (
                            <Loader2
                                size={18}
                                className="animate-spin"
                            />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}