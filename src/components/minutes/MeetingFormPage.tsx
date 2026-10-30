"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Loader2, Plus, Save, Trash2, UserRound } from "lucide-react";
import { minutesApi } from "@/lib/minutesApi";
import { formatDateTime, fromInputValue, parseApiError, toInputValue } from "@/lib/minutesUtils";
import { useUserOptions } from "@/hooks/useUserOptions";
import SignerDraftForm from "./SignerDraftForm";
import { BTN_GHOST, BTN_PRIMARY, CARD, INPUT, INPUT_ERROR, LABEL } from "./ui";
import type { MeetingDetail, SignerInput } from "@/types/minutes";

interface Props {
  basePath: string; 
  mode: "create" | "edit";
}

export default function MeetingFormPage({ basePath, mode }: Props) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const meetingId = mode === "edit" ? Number(params?.id) : null;

  const { options: users, loading: usersLoading } = useUserOptions();

  const [loadingMeeting, setLoadingMeeting] = useState(mode === "edit");
  const [loadError, setLoadError] = useState("");
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);

  const [title, setTitle] = useState("");
  const [heldAt, setHeldAt] = useState("");
  const [location, setLocation] = useState("");
  const [body, setBody] = useState("");
  const [signers, setSigners] = useState<SignerInput[]>([]);
  const [showSignerForm, setShowSignerForm] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  
  useEffect(() => {
    if (mode !== "edit" || !meetingId) return;
    let alive = true;
    (async () => {
      try {
        const data = await minutesApi.getMeeting(meetingId);
        if (!alive) return;
        setMeeting(data);
        setTitle(data.title);
        setHeldAt(toInputValue(data.held_at));
        setLocation(data.location ?? "");
        setBody(data.body ?? "");
      } catch (err) {
        if (alive) setLoadError(parseApiError(err).message);
      } finally {
        if (alive) setLoadingMeeting(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [mode, meetingId]);

  const userLabel = useMemo(() => new Map(users.map((u) => [u.id, u.label])), [users]);
  const takenUserIds = signers.map((s) => s.user).filter((id): id is number => id !== null);
  const nextOrder = signers.reduce((max, s) => Math.max(max, s.order), 0) + 1;

  
  const validate = () => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "عنوان الزامی است.";
    else if (title.length > 200) next.title = "عنوان حداکثر ۲۰۰ کاراکتر باشد.";
    if (!heldAt || Number.isNaN(new Date(heldAt).getTime())) next.held_at = "زمان برگزاری را وارد کنید.";
    if (location.length > 200) next.location = "مکان حداکثر ۲۰۰ کاراکتر باشد.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    setFormError("");

    try {
      if (mode === "create") {
        const created = await minutesApi.createMeeting({
          title: title.trim(),
          held_at: fromInputValue(heldAt),
          location: location.trim(),
          body,
          signers,
        });
        router.push(created?.id ? `${basePath}/${created.id}` : basePath);
      } else if (meetingId) {
        await minutesApi.updateMeeting(meetingId, {
          title: title.trim(),
          held_at: fromInputValue(heldAt),
          location: location.trim(),
          body,
        });
        router.push(`${basePath}/${meetingId}`);
      }
    } catch (err) {
      const parsed = parseApiError(err);
      setFormError(parsed.message);
      setErrors((prev) => ({ ...prev, ...parsed.fields }));
      setSubmitting(false);
    }
  };

  
  if (mode === "edit" && loadingMeeting) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-indigo-500" size={24} />
      </div>
    );
  }

  if (mode === "edit" && (loadError || !meeting)) {
    return (
      <div className="p-6" dir="rtl">
        <div className={`${CARD} flex flex-col items-center gap-3 py-12`}>
          <p className="text-[12.5px] font-semibold text-red-500">{loadError || "صورت‌جلسه پیدا نشد."}</p>
          <Link href={basePath} className="text-[12px] font-bold text-indigo-500 hover:underline">
            بازگشت به فهرست
          </Link>
        </div>
      </div>
    );
  }

  if (mode === "edit" && meeting && meeting.status !== "draft") {
    return (
      <div className="p-6" dir="rtl">
        <div className={`${CARD} flex flex-col items-center gap-3 py-12`}>
          <p className="text-[12.5px] font-semibold text-amber-500">
            فقط صورت‌جلسه‌ی پیش‌نویس قابل ویرایش است.
          </p>
          <Link href={`${basePath}/${meeting.id}`} className="text-[12px] font-bold text-indigo-500 hover:underline">
            بازگشت به جزئیات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Link
          href={mode === "edit" && meetingId ? `${basePath}/${meetingId}` : basePath}
          aria-label="بازگشت"
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/5 text-gray-600 transition-colors hover:bg-black/10 dark:bg-white/5 dark:text-gray-300"
        >
          <ArrowRight size={16} />
        </Link>
        <div>
          <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
            {mode === "create" ? "ایجاد صورت‌جلسه" : "ویرایش صورت‌جلسه"}
          </h1>
          {mode === "edit" && meeting && (
            <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">
              آخرین تغییر: {formatDateTime(meeting.updated_at)}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <section className={`${CARD} flex flex-col gap-4 p-4 sm:p-5`}>
          <div>
            <label htmlFor="m-title" className={LABEL}>عنوان جلسه</label>
            <input
              id="m-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className={`${INPUT} ${errors.title ? INPUT_ERROR : ""}`}
              placeholder="مثلاً جلسه بررسی بودجه"
            />
            {errors.title && <p className="mt-1 text-[11.5px] font-semibold text-red-500">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="m-held" className={LABEL}>زمان برگزاری</label>
              <input
                id="m-held"
                type="datetime-local"
                value={heldAt}
                onChange={(e) => setHeldAt(e.target.value)}
                className={`${INPUT} ${errors.held_at ? INPUT_ERROR : ""}`}
              />
              {errors.held_at && <p className="mt-1 text-[11.5px] font-semibold text-red-500">{errors.held_at}</p>}
            </div>
            <div>
              <label htmlFor="m-loc" className={LABEL}>مکان (اختیاری)</label>
              <input
                id="m-loc"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={200}
                className={`${INPUT} ${errors.location ? INPUT_ERROR : ""}`}
                placeholder="مثلاً سالن جلسات"
              />
              {errors.location && <p className="mt-1 text-[11.5px] font-semibold text-red-500">{errors.location}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="m-body" className={LABEL}>متن صورت‌جلسه</label>
            <textarea
              id="m-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className={`${INPUT} min-h-[260px] resize-y leading-7 ${errors.body ? INPUT_ERROR : ""}`}
              placeholder="موارد مطرح‌شده و تصمیم‌های جلسه..."
            />
            {errors.body && <p className="mt-1 text-[11.5px] font-semibold text-red-500">{errors.body}</p>}
            <p className="mt-1.5 text-[11px] text-gray-400">
              بعد از ارسال برای امضا، متن قفل می‌شود و دیگر قابل ویرایش نیست.
            </p>
          </div>
        </section>

        
        {mode === "create" ? (
          <section className={`${CARD} flex flex-col gap-3 p-4 sm:p-5`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[13px] font-extrabold text-gray-800 dark:text-gray-100">امضاکنندگان</h2>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  می‌توانید بعداً هم، تا زمانی که پیش‌نویس است، اضافه یا حذف کنید.
                </p>
              </div>
              {!showSignerForm && (
                <button type="button" onClick={() => setShowSignerForm(true)} className={BTN_GHOST}>
                  <Plus size={14} /> افزودن
                </button>
              )}
            </div>

            {signers.length > 0 && (
              <ul className="flex flex-col gap-2">
                {[...signers]
                  .sort((a, b) => a.order - b.order)
                  .map((s, idx) => (
                    <li
                      key={`${s.user ?? s.full_name}-${idx}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.06] bg-white px-3 py-2.5 dark:border-white/[0.06] dark:bg-white/[0.02]"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <UserRound size={15} className="shrink-0 text-gray-400" />
                        <div className="min-w-0">
                          <p className="truncate text-[12.5px] font-bold text-gray-800 dark:text-gray-100">
                            {s.user !== null ? userLabel.get(s.user) ?? `کاربر ${s.user}` : s.full_name}
                            {s.user === null && (
                              <span className="mr-1.5 rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-bold text-violet-500">
                                بیرونی
                              </span>
                            )}
                          </p>
                          <p className="truncate text-[11px] text-gray-400">
                            {s.role_title || "بدون سمت"} • ترتیب {s.order}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSigners((prev) => prev.filter((x) => x !== s))}
                        aria-label="حذف امضاکننده"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
              </ul>
            )}

            {errors.signers && <p className="text-[11.5px] font-semibold text-red-500">{errors.signers}</p>}

            {showSignerForm && (
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.03] p-4">
                <SignerDraftForm
                  mode="add"
                  users={users}
                  usersLoading={usersLoading}
                  takenUserIds={takenUserIds}
                  defaultOrder={nextOrder}
                  submitLabel="افزودن به فهرست"
                  onSubmit={(input) => {
                    setSigners((prev) => [...prev, input]);
                    setShowSignerForm(false);
                  }}
                  onCancel={() => setShowSignerForm(false)}
                />
              </div>
            )}
          </section>
        ) : (
          <p className="rounded-xl bg-black/[0.03] px-4 py-3 text-[12px] text-gray-500 dark:bg-white/5 dark:text-gray-400">
            برای تغییر امضاکنندگان به صفحه‌ی جزئیات صورت‌جلسه بروید.
          </p>
        )}

        {formError && (
          <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-[12.5px] font-semibold text-red-500">
            {formError}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <Link href={mode === "edit" && meetingId ? `${basePath}/${meetingId}` : basePath} className={BTN_GHOST}>
            انصراف
          </Link>
          <button type="submit" disabled={submitting} className={BTN_PRIMARY}>
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {mode === "create" ? "ذخیره پیش‌نویس" : "ذخیره تغییرات"}
          </button>
        </div>
      </form>
    </div>
  );
}
