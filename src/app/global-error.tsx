"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen bg-white text-gray-900">
        <main className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 text-center shadow-sm">
            <h1 className="text-lg font-bold">خطای غیرمنتظره</h1>
            <p className="mt-2 text-sm text-gray-500">
              برنامه با یک خطای جدی مواجه شد. دوباره تلاش کنید.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="mt-6 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white"
            >
              تلاش مجدد
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
