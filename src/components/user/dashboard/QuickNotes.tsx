"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type NoteColor = "yellow" | "blue" | "green" | "pink" | "purple";

interface Note {
  id: string;
  text: string;
  color: NoteColor;
  createdAt: Date;
  pinned: boolean;
}

const colorMap: Record<NoteColor, { bg: string; border: string; text: string; dot: string }> = {
  yellow: {
    bg: "bg-yellow-500/10 dark:bg-yellow-500/15",
    border: "border-yellow-500/30",
    text: "text-yellow-700 dark:text-yellow-300",
    dot: "bg-yellow-400",
  },
  blue: {
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
    border: "border-blue-500/30",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-400",
  },
  green: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    border: "border-emerald-500/30",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-400",
  },
  pink: {
    bg: "bg-pink-500/10 dark:bg-pink-500/15",
    border: "border-pink-500/30",
    text: "text-pink-700 dark:text-pink-300",
    dot: "bg-pink-400",
  },
  purple: {
    bg: "bg-purple-500/10 dark:bg-purple-500/15",
    border: "border-purple-500/30",
    text: "text-purple-700 dark:text-purple-300",
    dot: "bg-purple-400",
  },
};

const COLORS: NoteColor[] = ["yellow", "blue", "green", "pink", "purple"];

const generateId = () => Math.random().toString(36).slice(2, 9);

const formatTime = (date: Date) =>
  date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });

export default function QuickNotes() {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: generateId(),
      text: "جلسه هماهنگی با تیم فنی رو یادم نره — ساعت ۱۱",
      color: "yellow",
      createdAt: new Date(),
      pinned: true,
    },
    {
      id: generateId(),
      text: "ریپورت هفتگی تا جمعه باید آماده باشه",
      color: "blue",
      createdAt: new Date(),
      pinned: false,
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [selectedColor, setSelectedColor] = useState<NoteColor>("yellow");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addNote = () => {
    if (!inputText.trim()) return;
    const newNote: Note = {
      id: generateId(),
      text: inputText.trim(),
      color: selectedColor,
      createdAt: new Date(),
      pinned: false,
    };
    setNotes((prev) => [newNote, ...prev]);
    setInputText("");
    setIsExpanded(false);
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setDeleteConfirm(null);
  };

  const togglePin = (id: string) => {
    setNotes((prev) =>
      prev
        .map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
        .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
    );
  };

  const pinned = notes.filter((n) => n.pinned);
  const unpinned = notes.filter((n) => !n.pinned);
  const sorted = [...pinned, ...unpinned];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">یادداشت سریع</h3>
            <p className="text-xs text-zinc-400">{notes.length} یادداشت</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => { setIsExpanded(true); setTimeout(() => textareaRef.current?.focus(), 100); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 transition-colors text-white text-xs font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          جدید
        </motion.button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-b border-zinc-100 dark:border-zinc-800"
          >
            <div className="p-4 space-y-3">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) addNote(); }}
                placeholder="یادداشتت رو بنویس... (Ctrl+Enter برای ذخیره)"
                rows={3}
                className="w-full resize-none text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">رنگ:</span>
                  <div className="flex gap-1.5">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`w-5 h-5 rounded-full transition-all ${colorMap[c].dot} ${selectedColor === c ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 ring-zinc-400" : "opacity-60 hover:opacity-100"}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setIsExpanded(false); setInputText(""); }}
                    className="px-3 py-1.5 rounded-xl text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    لغو
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={addNote}
                    disabled={!inputText.trim()}
                    className="px-4 py-1.5 rounded-xl text-xs font-medium bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                  >
                    ذخیره
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 space-y-2.5 max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
        <AnimatePresence mode="popLayout">
          {sorted.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-10 gap-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <svg className="w-6 h-6 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-xs text-zinc-400">هنوز یادداشتی نداری</p>
            </motion.div>
          )}

          {sorted.map((note) => {
            const c = colorMap[note.color];
            return (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, x: 20 }}
                transition={{ duration: 0.2 }}
                className={`group relative rounded-xl border p-3.5 ${c.bg} ${c.border}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${c.text} break-words`}>{note.text}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-zinc-400">{formatTime(note.createdAt)}</span>
                      {note.pinned && (
                        <span className="text-xs text-amber-500 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                          </svg>
                          پین شده
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="absolute top-2.5 left-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${note.pinned ? "bg-amber-100 dark:bg-amber-900/30 text-amber-500" : "bg-white/80 dark:bg-zinc-800 text-zinc-400 hover:text-amber-500"}`}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                    </svg>
                  </button>

                  {deleteConfirm === note.id ? (
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="w-6 h-6 rounded-lg bg-red-500 text-white flex items-center justify-center text-xs font-bold"
                    >
                      ✕
                    </button>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(note.id)}
                      className="w-6 h-6 rounded-lg bg-white/80 dark:bg-zinc-800 text-zinc-400 hover:text-red-500 flex items-center justify-center transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
