"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, FileSignature, MapPin, PenLine, Plus, UserRound } from "lucide-react";
import PageHeader, { HEADER_BTN_PRIMARY, HEADER_BTN_SECONDARY } from "@/components/ui/PageHeader";
import { ListSkeleton } from "@/components/ui/skeletons";
import { minutesApi } from "@/lib/minutesApi";
import { STATUS_FILTERS, formatDateTime, parseApiError } from "@/lib/minutesUtils";
import MeetingStatusBadge from "./MeetingStatusBadge";
import { CARD } from "./ui";
import type { MeetingListItem, MeetingStatus } from "@/types/minutes";

export default function MinutesListPage({ basePath }: { basePath: string }) {
  const [items, setItems] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<MeetingStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await minutesApi.listMeetings({ status, search }));
    } catch (err) {
      setError(parseApiError(err, "خطا در دریافت صورت‌جلسه‌ها").message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = status !== "" || search !== "";

  return (
    <div className="flex flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
      
      <PageHeader
        icon={FileSignature}
        title="صورت‌جلسه‌ها"
        subtitle={loading ? "در حال بارگذاری..." : `${items.length} صورت‌جلسه`}
        search={{ value: searchInput, onChange: setSearchInput, placeholder: "جست‌وجو در عنوان یا متن..." }}
        onRefresh={load}
        refreshing={loading}
        leading={
          <Link href={`${basePath}/my-signatures`} className={HEADER_BTN_SECONDARY}>
            <PenLine size={15} /> امضاهای من
          </Link>
        }
      >
        <Link href={`${basePath}/create`} className={HEADER_BTN_PRIMARY}>
          <Plus size={15} /> صورت‌جلسه جدید
        </Link>
      </PageHeader>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="فیلتر وضعیت">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value || "all"}
              type="button"
              onClick={() => setStatus(f.value)}
              aria-pressed={status === f.value}
              className={`h-8 rounded-xl px-3 text-[11.5px] font-bold transition-colors ${
                status === f.value
                  ? "bg-indigo-600 text-white"
                  : "bg-black/5 text-gray-600 hover:bg-black/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      
      {loading && <ListSkeleton rows={5} />}

      {!loading && error && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-red-500/10 bg-red-500/[0.03] py-12">
          <p className="text-[12.5px] font-semibold text-red-500">{error}</p>
          <button type="button" onClick={load} className="text-[12px] font-bold text-indigo-500 hover:underline">
            تلاش مجدد
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-16">
          <FileSignature size={28} className="text-gray-300 dark:text-gray-700" />
          <p className="text-[12.5px] text-gray-500 dark:text-gray-400">
            {filtered ? "صورت‌جلسه‌ای با این فیلتر پیدا نشد" : "هنوز صورت‌جلسه‌ای ثبت نشده"}
          </p>
          {!filtered && (
            <Link href={`${basePath}/create`} className="mt-1 text-[12px] font-bold text-indigo-500 hover:underline">
              اولین صورت‌جلسه را بسازید
            </Link>
          )}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((m) => {
            const percent = m.signers_count > 0 ? Math.round((m.signed_count / m.signers_count) * 100) : 0;
            return (
              <Link
                key={m.id}
                href={`${basePath}/${m.id}`}
                className={`${CARD} group flex flex-col gap-3 p-4 transition-shadow hover:shadow-[0_0_0_1px_rgba(99,102,241,0.35),0_10px_30px_rgba(99,102,241,0.18)]`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="line-clamp-2 text-[13.5px] font-extrabold leading-6 text-gray-800 dark:text-gray-100">
                    {m.title}
                  </h2>
                  <MeetingStatusBadge status={m.status} />
                </div>

                <div className="flex flex-col gap-1.5 text-[11.5px] text-gray-400 dark:text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={13} /> {formatDateTime(m.held_at)}
                  </span>
                  {m.location && (
                    <span className="flex items-center gap-1.5 truncate">
                      <MapPin size={13} /> {m.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <UserRound size={13} /> {m.created_by_username}
                  </span>
                </div>

                <div className="mt-auto border-t border-black/5 pt-3 dark:border-white/5">
                  <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    <span>امضاها</span>
                    <span>
                      {m.signed_count.toLocaleString("fa-IR")} از {m.signers_count.toLocaleString("fa-IR")}
                    </span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10"
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${percent === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
