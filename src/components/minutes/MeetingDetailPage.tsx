"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Hash,
  Loader2,
  MapPin,
  Pencil,
  PenLine,
  Plus,
  Send,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";
import { minutesApi } from "@/lib/minutesApi";
import { formatDateTime, parseApiError } from "@/lib/minutesUtils";
import MeetingStatusBadge from "./MeetingStatusBadge";
import SignerList from "./SignerList";
import SignerModal from "./SignerModal";
import SignModal from "./SignModal";
import ConfirmDialog from "./ConfirmDialog";
import { BTN_GHOST, BTN_PRIMARY, CARD } from "./ui";
import type { MeetingDetail, SignerItem } from "@/types/minutes";

type Confirm = null | "send" | "cancel" | "delete" | { type: "deleteSigner"; signer: SignerItem };

export default function MeetingDetailPage({ basePath }: { basePath: string }) {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const meetingId = Number(params?.id);

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [mySignerId, setMySignerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [confirm, setConfirm] = useState<Confirm>(null);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState("");

  const [signerModal, setSignerModal] = useState<null | { editing: SignerItem | null }>(null);
  const [signingSigner, setSigningSigner] = useState<SignerItem | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError("");
      try {
        const [detail, mine] = await Promise.all([
          minutesApi.getMeeting(meetingId),
          minutesApi.mySignatures(false).catch(() => []),
        ]);
        setMeeting(detail);
        const mineForThis = mine.find((s) => s.meeting === meetingId && !s.is_signed);
        setMySignerId(mineForThis?.id ?? null);
      } catch (err) {
        setError(parseApiError(err, "خطا در دریافت صورت‌جلسه").message);
      } finally {
        setLoading(false);
      }
    },
    [meetingId]
  );

  useEffect(() => {
    if (!Number.isFinite(meetingId)) {
      setError("شناسه‌ی صورت‌جلسه نامعتبر است.");
      setLoading(false);
      return;
    }
    load();
  }, [meetingId, load]);

  const closeConfirm = () => {
    if (acting) return;
    setConfirm(null);
    setActionError("");
  };

  const runConfirmed = async () => {
    if (!meeting || !confirm) return;
    setActing(true);
    setActionError("");
    try {
      if (confirm === "send") {
        await minutesApi.sendMeeting(meeting.id);
        setNotice("صورت‌جلسه برای امضا ارسال شد.");
      } else if (confirm === "cancel") {
        await minutesApi.cancelMeeting(meeting.id);
        setNotice("صورت‌جلسه لغو شد.");
      } else if (confirm === "delete") {
        await minutesApi.deleteMeeting(meeting.id);
        router.push(basePath);
        return;
      } else {
        await minutesApi.deleteSigner(confirm.signer.id);
        setNotice("امضاکننده حذف شد.");
      }
      setConfirm(null);
      await load(true);
    } catch (err) {
      setActionError(parseApiError(err).message);
    } finally {
      setActing(false);
    }
  };

  const handleInternalSign = async (signatureImage: string): Promise<string | void> => {
    if (!signingSigner) return;
    try {
      await minutesApi.signInternal(signingSigner.id, signatureImage);
      setSigningSigner(null);
      setNotice("امضای شما ثبت شد.");
      await load(true);
    } catch (err) {
      return parseApiError(err).message;
    }
  };

  /* ---------- render guards ---------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-indigo-500" size={24} />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="p-6" dir="rtl">
        <div className={`${CARD} flex flex-col items-center gap-3 py-12`}>
          <p className="text-[12.5px] font-semibold text-red-500">{error || "صورت‌جلسه پیدا نشد."}</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => load()} className="text-[12px] font-bold text-indigo-500 hover:underline">
              تلاش مجدد
            </button>
            <Link href={basePath} className="text-[12px] font-bold text-gray-500 hover:underline">
              بازگشت به فهرست
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const signedCount = meeting.signers.filter((s) => s.is_signed).length;
  const total = meeting.signers.length;
  const percent = total > 0 ? Math.round((signedCount / total) * 100) : 0;
  const isDraft = meeting.status === "draft";
  const canCancel = meeting.status === "draft" || meeting.status === "pending";
  const canDelete = meeting.status === "draft" || meeting.status === "canceled";
  const mySigner = meeting.signers.find((s) => s.id === mySignerId) ?? null;

  const confirmConfig =
    confirm === "send"
      ? {
          title: "ارسال برای امضا",
          description:
            "بعد از ارسال، متن صورت‌جلسه قفل می‌شود و دیگر قابل ویرایش نیست و امضاکنندگان می‌توانند امضا کنند. ادامه می‌دهید؟",
          confirmLabel: "ارسال برای امضا",
          tone: "primary" as const,
        }
      : confirm === "cancel"
        ? {
            title: "لغو صورت‌جلسه",
            description: "با لغو صورت‌جلسه، امضاکنندگان دیگر نمی‌توانند آن را امضا کنند. این کار قابل بازگشت نیست.",
            confirmLabel: "لغو صورت‌جلسه",
            tone: "danger" as const,
          }
        : confirm === "delete"
          ? {
              title: "حذف صورت‌جلسه",
              description: "این صورت‌جلسه برای همیشه حذف می‌شود. ادامه می‌دهید؟",
              confirmLabel: "حذف",
              tone: "danger" as const,
            }
          : confirm && typeof confirm === "object"
            ? {
                title: "حذف امضاکننده",
                description: `«${confirm.signer.display_name}» از فهرست امضاکنندگان حذف شود؟`,
                confirmLabel: "حذف",
                tone: "danger" as const,
              }
            : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href={basePath}
            aria-label="بازگشت به فهرست"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black/5 text-slate-600 transition-colors hover:bg-black/10 dark:bg-white/5 dark:text-slate-300"
          >
            <ArrowRight size={16} />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[16px] font-extrabold leading-7 text-gray-900 dark:text-white">{meeting.title}</h1>
              <MeetingStatusBadge status={meeting.status} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5"><CalendarDays size={13} /> {formatDateTime(meeting.held_at)}</span>
              {meeting.location && <span className="flex items-center gap-1.5"><MapPin size={13} /> {meeting.location}</span>}
              <span className="flex items-center gap-1.5"><UserRound size={13} /> {meeting.created_by_username}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDraft && (
            <>
              <Link href={`${basePath}/${meeting.id}/edit`} className={BTN_GHOST}>
                <Pencil size={14} /> ویرایش
              </Link>
              <button
                type="button"
                onClick={() => setConfirm("send")}
                disabled={total === 0}
                title={total === 0 ? "برای ارسال حداقل یک امضاکننده لازم است" : undefined}
                className={BTN_PRIMARY}
              >
                <Send size={14} /> ارسال برای امضا
              </button>
            </>
          )}
          {canCancel && (
            <button type="button" onClick={() => setConfirm("cancel")} className={BTN_GHOST}>
              <XCircle size={14} /> لغو
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => setConfirm("delete")}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-rose-500/10 px-4 text-[12.5px] font-bold text-rose-600 transition-colors hover:bg-rose-500/20 dark:text-rose-400"
            >
              <Trash2 size={14} /> حذف
            </button>
          )}
        </div>
      </div>

      {notice && (
        <p
          role="status"
          className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-4 py-2.5 text-[12.5px] font-semibold text-emerald-600 dark:text-emerald-400"
        >
          {notice}
          <button type="button" onClick={() => setNotice("")} className="text-[11px] opacity-70 hover:opacity-100">
            بستن
          </button>
        </p>
      )}

      {/* Sign call-to-action */}
      {mySigner && meeting.status === "pending" && (
        <div className="flex flex-col gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-extrabold text-indigo-600 dark:text-indigo-300">امضای شما در انتظار است</p>
            <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">
              متن را مطالعه کنید و سپس امضا کنید.
            </p>
          </div>
          <button type="button" onClick={() => setSigningSigner(mySigner)} className={BTN_PRIMARY}>
            <PenLine size={14} /> امضا کنید
          </button>
        </div>
      )}

      {/* Body */}
      <section className={`${CARD} p-4 sm:p-5`}>
        <h2 className="mb-3 text-[13px] font-extrabold text-gray-800 dark:text-gray-100">متن صورت‌جلسه</h2>
        {meeting.body?.trim() ? (
          <p className="whitespace-pre-wrap break-words text-[13px] leading-8 text-gray-700 dark:text-gray-300">
            {meeting.body}
          </p>
        ) : (
          <p className="text-[12px] text-gray-400">متنی ثبت نشده است.</p>
        )}
        {meeting.content_hash && meeting.status !== "draft" && (
          <p className="mt-4 flex items-center gap-1.5 border-t border-black/5 pt-3 text-[10.5px] text-gray-400 dark:border-white/5" dir="ltr">
            <Hash size={11} />
            <span className="truncate font-mono">{meeting.content_hash}</span>
          </p>
        )}
      </section>

      {/* Signers */}
      <section className={`${CARD} p-4 sm:p-5`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[13px] font-extrabold text-gray-800 dark:text-gray-100">امضاکنندگان</h2>
            <p className="mt-0.5 text-[11px] text-gray-400">
              {signedCount.toLocaleString("fa-IR")} از {total.toLocaleString("fa-IR")} نفر امضا کرده‌اند
            </p>
          </div>
          {isDraft && (
            <button type="button" onClick={() => setSignerModal({ editing: null })} className={BTN_GHOST}>
              <Plus size={14} /> افزودن
            </button>
          )}
        </div>

        {total > 0 && (
          <div
            className="mb-4 h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10"
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
        )}

        <SignerList
          signers={meeting.signers}
          meetingStatus={meeting.status}
          canManage={isDraft}
          mySignerId={mySignerId}
          onEdit={(signer) => setSignerModal({ editing: signer })}
          onDelete={(signer) => setConfirm({ type: "deleteSigner", signer })}
          onSign={(signer) => setSigningSigner(signer)}
        />
      </section>

      <AnimatePresence>
        {confirm && confirmConfig && (
          <ConfirmDialog
            key="confirm"
            {...confirmConfig}
            loading={acting}
            error={actionError}
            onConfirm={runConfirmed}
            onCancel={closeConfirm}
          />
        )}

        {signerModal && (
          <SignerModal
            key="signer-modal"
            meetingId={meeting.id}
            existingSigners={meeting.signers}
            editing={signerModal.editing}
            onClose={() => setSignerModal(null)}
            onSaved={() => {
              setSignerModal(null);
              load(true);
            }}
          />
        )}

        {signingSigner && (
          <SignModal key="sign-modal" onSubmit={handleInternalSign} onClose={() => setSigningSigner(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
