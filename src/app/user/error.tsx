"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", { error, digest: error.digest });
  }, [error]);

  return (
    <main dir="rtl" className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-slate-950">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">خطایی رخ داد</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          بارگذاری این بخش با مشکل مواجه شد. دوباره تلاش کنید.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-gray-900"
        >
          تلاش مجدد
        </button>
      </div>
    </main>
  );
}
