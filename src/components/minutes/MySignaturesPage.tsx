"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Clock, Loader2, PenLine, RefreshCw } from "lucide-react";
import { minutesApi } from "@/lib/minutesApi";
import { formatDateTime, parseApiError } from "@/lib/minutesUtils";
import MeetingStatusBadge from "./MeetingStatusBadge";
import { CARD } from "./ui";
import type { MeetingListItem, SignerItem } from "@/types/minutes";

export default function MySignaturesPage({ basePath }: { basePath: string }) {
  const [signers, setSigners] = useState<SignerItem[]>([]);
  const [meetings, setMeetings] = useState<Map<number, MeetingListItem>>(new Map());
  const [pendingOnly, setPendingOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [mine, list] = await Promise.all([
        minutesApi.mySignatures(pendingOnly),
        minutesApi.listMeetings().catch(() => [] as MeetingListItem[]),
      ]);
      setSigners(mine);
      setMeetings(new Map(list.map((m) => [m.id, m])));
    } catch (err) {
      setError(parseApiError(err, "خطا در دریافت امضاها").message);
      setSigners([]);
    } finally {
      setLoading(false);
    }
  }, [pendingOnly]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={basePath}
            aria-label="بازگشت"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/5 text-slate-600 transition-colors hover:bg-black/10 dark:bg-white/5 dark:text-slate-300"
          >
            <ArrowRight size={16} />
          </Link>
          <div>
            <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">امضاهای من</h1>
            <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">
              {loading ? "در حال بارگذاری..." : `${signers.length.toLocaleString("fa-IR")} مورد`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          title="بارگذاری مجدد"
          aria-label="بارگذاری مجدد"
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/5 text-slate-600 transition-colors hover:bg-black/10 disabled:opacity-50 dark:bg-white/5 dark:text-slate-300"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/5 p-1 dark:bg-white/5 sm:w-72" role="tablist">
        {(
          [
            [true, "در انتظار امضا"],
            [false, "همه"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={pendingOnly === value}
            onClick={() => setPendingOnly(value)}
            className={`h-9 rounded-xl text-[12px] font-bold transition-colors ${
              pendingOnly === value
                ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-300"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-indigo-500" />
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-red-500/10 bg-red-500/[0.03] py-12">
          <p className="text-[12.5px] font-semibold text-red-500">{error}</p>
          <button type="button" onClick={load} className="text-[12px] font-bold text-indigo-500 hover:underline">
            تلاش مجدد
          </button>
        </div>
      )}

      {!loading && !error && signers.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16">
          <PenLine size={28} className="text-gray-300 dark:text-gray-700" />
          <p className="text-[12.5px] text-gray-500 dark:text-gray-400">
            {pendingOnly ? "موردی در انتظار امضای شما نیست" : "هنوز در هیچ صورت‌جلسه‌ای امضاکننده نیستید"}
          </p>
        </div>
      )}

      {!loading && !error && signers.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {signers.map((s) => {
            const meeting = meetings.get(s.meeting);
            return (
              <li key={s.id}>
                <Link
                  href={`${basePath}/${s.meeting}`}
                  className={`${CARD} flex items-center justify-between gap-3 p-4 transition-shadow hover:shadow-[0_0_0_1px_rgba(99,102,241,0.35),0_10px_30px_rgba(99,102,241,0.18)]`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-extrabold text-gray-800 dark:text-gray-100">
                      {meeting?.title ?? `صورت‌جلسه شماره ${s.meeting.toLocaleString("fa-IR")}`}
                    </p>
                    <p className="mt-1 truncate text-[11.5px] text-gray-400">
                      {s.role_title || "بدون سمت"}
                      {meeting ? ` • ${formatDateTime(meeting.held_at)}` : ""}
                    </p>
                    <p
                      className={`mt-1.5 flex items-center gap-1 text-[11px] font-semibold ${
                        s.is_signed ? "text-emerald-500" : "text-amber-500"
                      }`}
                    >
                      {s.is_signed ? (
                        <>
                          <Check size={11} /> امضا شده در {formatDateTime(s.signed_at)}
                        </>
                      ) : (
                        <>
                          <Clock size={11} /> منتظر امضای شما
                        </>
                      )}
                    </p>
                  </div>
                  {meeting && <MeetingStatusBadge status={meeting.status} />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
