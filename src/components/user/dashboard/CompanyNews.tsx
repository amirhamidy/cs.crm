"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Loader2,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { useAuthStore } from "@/store/authStore";

interface Note {
  id: number;
  user?: number;
  description: string;
  created_at?: string;
  updated_at?: string;
}

interface ExtractedNoteInfo {
  cleanDescription: string;
  targetDate: string;
}

const NOTE_DATE_PATTERN =
  /^\[DATE:(\d{4}-\d{2}-\d{2})\]\s*([\s\S]*)$/;

const TEHRAN_TIME_ZONE = "Asia/Tehran";

const getDateKeyInTehran = (date: Date) => {
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TEHRAN_TIME_ZONE,
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) return "";

  return `${year}-${month}-${day}`;
};

const getTodayDateKey = () => {
  return getDateKeyInTehran(new Date());
};

const extractNoteInfo = (
  description: string,
  rawCreatedAt?: string
): ExtractedNoteInfo => {
  const match = description.match(NOTE_DATE_PATTERN);

  if (match) {
    return {
      targetDate: match[1],
      cleanDescription: match[2].trim(),
    };
  }

  const createdAtDate = rawCreatedAt ? new Date(rawCreatedAt) : null;

  return {
    targetDate: createdAtDate
      ? getDateKeyInTehran(createdAtDate)
      : "",
    cleanDescription: description.trim(),
  };
};

const formatDateLabel = (dateKey: string) => {
  if (!dateKey) return "بدون تاریخ";

  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) return "بدون تاریخ";

  const date = new Date(year, month - 1, day, 12, 0, 0);

  if (Number.isNaN(date.getTime())) return "بدون تاریخ";

  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    timeZone: TEHRAN_TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

export default function CompanyNews() {
  const { userId } = useAuthStore();

  const [notes, setNotes] = useState<Note[]>([]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const todayDateKey = getTodayDateKey();

  const todayNotes = useMemo(() => {
    return notes
      .filter((note) => {
        const { targetDate } = extractNoteInfo(
          note.description,
          note.created_at
        );

        return targetDate === todayDateKey;
      })
      .sort((firstNote, secondNote) => {
        const firstTime = firstNote.created_at
          ? new Date(firstNote.created_at).getTime()
          : 0;

        const secondTime = secondNote.created_at
          ? new Date(secondNote.created_at).getTime()
          : 0;

        return secondTime - firstTime;
      });
  }, [notes, todayDateKey]);

  const fetchNotes = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data } = await axiosInstance.get("/note/api/v1/");

      setNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch notes:", error);

      if (!silent) {
        setNotes([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSubmit = async () => {
    const cleanDescription = description.trim();

    if (!cleanDescription || !userId || submitting) return;

    setSubmitting(true);

    try {
      await axiosInstance.post("/note/api/v1/create/", {
        user: Number(userId),
        description: cleanDescription,
      });

      setDescription("");
      await fetchNotes(true);
    } catch (error) {
      console.error("Failed to create note:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (deletingId !== null) return;

    setDeletingId(id);

    try {
      await axiosInstance.delete(`/note/api/v1/${id}/delete/`);

      setNotes((previousNotes) =>
        previousNotes.filter((note) => note.id !== id)
      );
    } catch (error) {
      console.error("Failed to delete note:", error);
    } finally {
      setDeletingId(null);
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
      className="mx-auto w-full max-w-3xl space-y-6"
    >
      <div className="overflow-hidden rounded-[2rem] border border-zinc-200/70 bg-white/80 p-4 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.15)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
              یادداشت‌های امروز
            </h2>

            <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
              <CalendarDays size={14} />

              <span>{formatDateLabel(todayDateKey)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchNotes(true)}
            disabled={loading || refreshing || submitting}
            aria-label="دریافت مجدد یادداشت‌های امروز"
            title="دریافت مجدد"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-blue-900 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
          >
            {refreshing ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <RefreshCw size={17} />
            )}
          </button>
        </div>

        <div className="relative">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder=" "
            rows={4}
            disabled={submitting}
            className="peer w-full resize-none rounded-[2rem] border border-zinc-200 bg-zinc-50/80 px-5 pb-16 pt-8 text-sm leading-7 text-zinc-800 outline-none transition-all focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-70 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-100"
          />

          <label className="pointer-events-none absolute right-5 top-5 text-sm text-zinc-400 transition-all peer-focus:top-3 peer-focus:text-[11px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-[11px]">
            یادداشت جدید برای امروز
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
            aria-label="ثبت یادداشت امروز"
            title="ثبت یادداشت"
            className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2
              size={24}
              className="animate-spin text-zinc-400"
            />
          </div>
        ) : todayNotes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-dashed border-zinc-200 bg-zinc-50/70 px-6 py-14 text-center dark:border-zinc-800 dark:bg-zinc-900/50"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
              <CalendarDays size={21} />
            </div>

            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              برای امروز هنوز یادداشتی ثبت نشده
            </p>
          </motion.div>
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            {todayNotes.map((note) => {
              const { cleanDescription, targetDate } =
                extractNoteInfo(
                  note.description,
                  note.created_at
                );

              return (
                <motion.div
                  key={note.id}
                  layout
                  initial={{
                    opacity: 0,
                    y: 14,
                    scale: 0.98,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    x: -20,
                    scale: 0.98,
                  }}
                  transition={{
                    duration: 0.2,
                    ease: "easeOut",
                  }}
                  className="rounded-[2rem] border border-zinc-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-3">
                      <p className="whitespace-pre-wrap break-words text-sm leading-7 text-zinc-700 dark:text-zinc-200">
                        {cleanDescription}
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <CalendarDays size={14} />

                        <span>
                          {formatDateLabel(targetDate)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(note.id)}
                      disabled={deletingId !== null}
                      aria-label="حذف یادداشت"
                      title="حذف یادداشت"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-red-500 transition-all hover:bg-red-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950/30"
                    >
                      {deletingId === note.id ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
