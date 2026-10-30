"use client";

import { useState } from "react";
import { Check, Clock, Copy, Link2, Pencil, PenLine, Trash2, UserRound } from "lucide-react";
import type { MeetingStatus, SignerItem } from "@/types/minutes";
import { buildPublicSignLink, formatDateTime } from "@/lib/minutesUtils";
import { ICON_BTN } from "./ui";

interface SignerListProps {
  signers: SignerItem[];
  meetingStatus: MeetingStatus;
  
  canManage: boolean;
  
  mySignerId?: number | null;
  onEdit?: (signer: SignerItem) => void;
  onDelete?: (signer: SignerItem) => void;
  onSign?: (signer: SignerItem) => void;
}

function CopyLinkButton({ token, disabled }: { token: string; disabled: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildPublicSignLink(token));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      disabled={disabled}
      title={disabled ? "لینک پس از ارسال برای امضا فعال می‌شود" : "کپی لینک امضا"}
      aria-label="کپی لینک امضا"
      className={ICON_BTN}
    >
      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
    </button>
  );
}

export default function SignerList({
  signers,
  meetingStatus,
  canManage,
  mySignerId,
  onEdit,
  onDelete,
  onSign,
}: SignerListProps) {
  const sorted = [...signers].sort((a, b) => a.order - b.order || a.id - b.id);

  if (sorted.length === 0) {
    return (
      <p className="rounded-xl bg-black/[0.03] px-4 py-6 text-center text-[12px] text-gray-500 dark:bg-white/5 dark:text-gray-400">
        هنوز امضاکننده‌ای اضافه نشده است.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {sorted.map((signer) => {
        const isMine = mySignerId === signer.id;
        const canSign = isMine && meetingStatus === "pending" && !signer.is_signed;

        return (
          <li
            key={signer.id}
            className={`flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center sm:justify-between ${
              isMine
                ? "border-indigo-500/30 bg-indigo-500/[0.05]"
                : "border-black/[0.06] bg-white dark:border-white/[0.06] dark:bg-white/[0.02]"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  signer.is_signed
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-black/5 text-gray-400 dark:bg-white/5"
                }`}
              >
                {signer.is_signed ? <Check size={16} /> : <UserRound size={16} />}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-[13px] font-extrabold text-gray-800 dark:text-gray-100">
                    {signer.display_name || signer.full_name || signer.username}
                  </p>
                  {isMine && (
                    <span className="rounded-md bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-bold text-indigo-500">
                      شما
                    </span>
                  )}
                  {signer.is_external && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-bold text-violet-500">
                      <Link2 size={10} /> بیرونی
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[11px] text-gray-400 dark:text-gray-500">
                  {signer.role_title || "بدون سمت"}
                  {signer.phone_number ? ` • ${signer.phone_number}` : ""}
                </p>
                <p
                  className={`mt-1 flex items-center gap-1 text-[11px] font-semibold ${
                    signer.is_signed ? "text-emerald-500" : "text-amber-500"
                  }`}
                >
                  {signer.is_signed ? (
                    <>
                      <Check size={11} /> امضا شده در {formatDateTime(signer.signed_at)}
                    </>
                  ) : (
                    <>
                      <Clock size={11} /> امضا نشده
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
              {signer.is_signed && signer.signature_image?.startsWith("data:image/png;base64,") && (
                
                <img
                  src={signer.signature_image}
                  alt={`امضای ${signer.display_name}`}
                  width={80}
                  height={36}
                  loading="lazy"
                  decoding="async"
                  className="h-9 w-20 rounded-lg bg-white object-contain p-0.5"
                />
              )}

              {canSign && (
                <button
                  type="button"
                  onClick={() => onSign?.(signer)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 text-[11.5px] font-bold text-white transition-colors hover:bg-indigo-700"
                >
                  <PenLine size={13} /> امضا کنید
                </button>
              )}

              {signer.is_external && signer.sign_token && meetingStatus !== "canceled" && !signer.is_signed && (
                <CopyLinkButton token={signer.sign_token} disabled={meetingStatus === "draft"} />
              )}

              {canManage && (
                <>
                  <button
                    type="button"
                    onClick={() => onEdit?.(signer)}
                    title="ویرایش"
                    aria-label="ویرایش امضاکننده"
                    className={ICON_BTN}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete?.(signer)}
                    title="حذف"
                    aria-label="حذف امضاکننده"
                    className={`${ICON_BTN} hover:!bg-rose-500/15 hover:!text-rose-500`}
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
