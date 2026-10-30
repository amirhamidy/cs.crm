"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, Check, CheckCircle2, Clock, FileSignature, Loader2, MapPin, PenLine, ShieldAlert } from "lucide-react";
import { minutesApi } from "@/lib/minutesApi";
import { formatDateTime, parseApiError, validateSignature } from "@/lib/minutesUtils";
import MeetingStatusBadge from "./MeetingStatusBadge";
import SignaturePad from "./SignaturePad";
import { BTN_PRIMARY, CARD } from "./ui";
import type { PublicSigner } from "@/types/minutes";


export default function PublicSignPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [data, setData] = useState<PublicSigner | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signError, setSignError] = useState("");

  useEffect(() => {
    if (!token) return;
    let alive = true;
    (async () => {
      try {
        const res = await minutesApi.getPublicSigner(token);
        if (alive) setData(res);
      } catch (err) {
        if (!alive) return;
        const parsed = parseApiError(err);
        if (parsed.status === 404) setUnavailable(true);
        else setLoadError(parsed.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  const handleSign = async () => {
    if (!token || submitting) return;
    const problem = validateSignature(signature);
    if (problem) {
      setSignError(problem);
      return;
    }
    setSubmitting(true);
    setSignError("");
    try {
      const res = await minutesApi.signPublic(token, signature as string);
      setData(res);
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.status === 404) setUnavailable(true);
      else setSignError(parsed.message);
      setSubmitting(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <main dir="rtl" className="min-h-screen bg-gray-50 px-3 py-8 dark:bg-gray-950 sm:px-4">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">{children}</div>
    </main>
  );

  if (loading) {
    return shell(
      <div className="flex justify-center py-24">
        <Loader2 size={26} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (unavailable) {
    return shell(
      <div className={`${CARD} flex flex-col items-center gap-3 px-6 py-14 text-center`}>
        <ShieldAlert size={30} className="text-gray-400" />
        <h1 className="text-[14px] font-extrabold text-gray-800 dark:text-gray-100">این لینک در دسترس نیست</h1>
        <p className="max-w-sm text-[12.5px] leading-6 text-gray-500 dark:text-gray-400">
          لینک نامعتبر است یا صورت‌جلسه هنوز برای امضا ارسال نشده است. از ارسال‌کننده‌ی لینک بخواهید دوباره بررسی کند.
        </p>
      </div>
    );
  }

  if (loadError || !data) {
    return shell(
      <div className={`${CARD} flex flex-col items-center gap-3 px-6 py-14 text-center`}>
        <p className="text-[12.5px] font-semibold text-red-500">{loadError || "خطا در دریافت اطلاعات"}</p>
        <button type="button" onClick={() => window.location.reload()} className="text-[12px] font-bold text-indigo-500 hover:underline">
          تلاش مجدد
        </button>
      </div>
    );
  }

  const { meeting } = data;
  const canSign = !data.is_signed && meeting.status === "pending";

  return shell(
    <>
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10">
          <FileSignature size={18} className="text-indigo-500" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[16px] font-extrabold leading-7 text-gray-900 dark:text-white">{meeting.title}</h1>
            <MeetingStatusBadge status={meeting.status} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5"><CalendarDays size={13} /> {formatDateTime(meeting.held_at)}</span>
            {meeting.location && <span className="flex items-center gap-1.5"><MapPin size={13} /> {meeting.location}</span>}
          </div>
        </div>
      </header>

      <p className="text-[12.5px] text-gray-600 dark:text-gray-300">
        {data.display_name} عزیز{data.role_title ? ` (${data.role_title})` : ""}، متن زیر را مطالعه و در پایان صفحه امضا کنید.
      </p>

      <section className={`${CARD} p-4 sm:p-5`}>
        <h2 className="mb-3 text-[13px] font-extrabold text-gray-800 dark:text-gray-100">متن صورت‌جلسه</h2>
        <p className="whitespace-pre-wrap break-words text-[13px] leading-8 text-gray-700 dark:text-gray-300">
          {meeting.body}
        </p>
      </section>

      <section className={`${CARD} p-4 sm:p-5`}>
        <h2 className="mb-3 text-[13px] font-extrabold text-gray-800 dark:text-gray-100">شرکت‌کنندگان</h2>
        <ul className="flex flex-col gap-2">
          {data.participants.map((p, idx) => (
            <li key={`${p.display_name}-${idx}`} className="flex items-center justify-between gap-3 text-[12.5px]">
              <span className="min-w-0 truncate text-gray-700 dark:text-gray-200">
                <span className="font-bold">{p.display_name}</span>
                {p.role_title && <span className="text-gray-400"> • {p.role_title}</span>}
              </span>
              <span className={`flex shrink-0 items-center gap-1 text-[11px] font-semibold ${p.is_signed ? "text-emerald-500" : "text-amber-500"}`}>
                {p.is_signed ? <Check size={12} /> : <Clock size={12} />}
                {p.is_signed ? "امضا شده" : "امضا نشده"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {data.is_signed ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
          <CheckCircle2 size={22} className="shrink-0 text-emerald-500" />
          <div>
            <p className="text-[13px] font-extrabold text-emerald-600 dark:text-emerald-400">امضای شما ثبت شد</p>
            <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">{formatDateTime(data.signed_at)}</p>
          </div>
        </div>
      ) : canSign ? (
        <section className={`${CARD} flex flex-col gap-3 p-4 sm:p-5`}>
          <h2 className="text-[13px] font-extrabold text-gray-800 dark:text-gray-100">امضای شما</h2>
          <SignaturePad
            disabled={submitting}
            onChange={(v) => {
              setSignature(v);
              setSignError("");
            }}
          />
          {signError && (
            <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-[12px] font-semibold text-red-500">
              {signError}
            </p>
          )}
          <button type="button" onClick={handleSign} disabled={submitting || !signature} className={`${BTN_PRIMARY} w-full`}>
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <PenLine size={14} />}
            ثبت امضا
          </button>
        </section>
      ) : (
        <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-[12.5px] font-semibold text-amber-600 dark:text-amber-400">
          این صورت‌جلسه در حال حاضر در وضعیت امضا نیست.
        </p>
      )}
    </>
  );
}
