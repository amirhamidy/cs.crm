"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Loader2, Send } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { useAuthStore } from "@/store/authStore";

interface Note {
  id: number;
  description: string;
  created_at?: string;
}

export default function CompanyNews() {
  const { userId } = useAuthStore();

  const [notes, setNotes] = useState<Note[]>([]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get("/note/api/v1/");
      setNotes(data);
    } catch (error) {
      console.error("خطا در دریافت یادداشت‌ها:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSubmit = async () => {
    if (!description.trim() || !userId) return;

    setSubmitting(true);
    try {
      const { data } = await axiosInstance.post("/note/api/v1/create/", {
        user: Number(userId),
        description: description.trim(),
      });
      setNotes((prev) => [data, ...prev]);
      setDescription("");
    } catch (error) {
      console.error("خطا در ثبت یادداشت:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await axiosInstance.delete(`/note/api/v1/${id}/delete/`);
      setNotes((prev) => prev.filter((note) => note.id !== id));
    } catch (error) {
      console.error("خطا در حذف یادداشت:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <div className="relative">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder=" "
          rows={4}
          className="peer w-full rounded-4xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-5 pt-6 pb-4 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
        />
        <label className="absolute right-5 top-4 text-zinc-400 text-sm transition-all pointer-events-none peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs">
          یادداشت جدید...
        </label>

        <button
          onClick={handleSubmit}
          disabled={submitting || !description.trim()}
          className="absolute left-4 bottom-4 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed p-2 transition-all"
        >
          {submitting ? (
            <Loader2 size={18} className="animate-spin text-white" />
          ) : (
            <Send size={18} className="text-white" />
          )}
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-zinc-400" />
          </div>
        ) : notes.length === 0 ? (
          <p className="text-center text-sm text-zinc-400 py-10">
            یادداشتی وجود ندارد
          </p>
        ) : (
          <AnimatePresence>
            {notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-start justify-between gap-3 rounded-4xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-5 py-4"
              >
                <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed">
                  {note.description}
                </p>

                <button
                  onClick={() => handleDelete(note.id)}
                  disabled={deletingId === note.id}
                  className="shrink-0 rounded-full p-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                >
                  {deletingId === note.id ? (
                    <Loader2 size={16} className="animate-spin text-red-500" />
                  ) : (
                    <Trash2 size={16} className="text-red-500" />
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
