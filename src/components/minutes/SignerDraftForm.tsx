"use client";

import { useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import type { SignerInput, UserOption } from "@/types/minutes";
import { PHONE_REGEX, toEnglishDigits } from "@/lib/minutesUtils";
import { BTN_GHOST, BTN_PRIMARY, INPUT, INPUT_ERROR, LABEL } from "./ui";

interface SignerDraftFormProps {
  mode: "add" | "edit";
  users: UserOption[];
  usersLoading?: boolean;
  
  takenUserIds: number[];
  defaultOrder: number;
  
  initial?: Partial<SignerInput> & { displayName?: string; isExternal?: boolean };
  submitLabel: string;
  submitting?: boolean;
  serverError?: string;
  serverFieldErrors?: Record<string, string>;
  onSubmit: (input: SignerInput) => void | Promise<void>;
  onCancel: () => void;
}

export default function SignerDraftForm({
  mode,
  users,
  usersLoading = false,
  takenUserIds,
  defaultOrder,
  initial,
  submitLabel,
  submitting = false,
  serverError,
  serverFieldErrors = {},
  onSubmit,
  onCancel,
}: SignerDraftFormProps) {
  const isEdit = mode === "edit";
  const [kind, setKind] = useState<"internal" | "external">(
    isEdit ? (initial?.isExternal ? "external" : "internal") : "internal"
  );
  const [userId, setUserId] = useState<number | null>(initial?.user ?? null);
  const [query, setQuery] = useState("");
  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [phone, setPhone] = useState(initial?.phone_number ?? "");
  const [role, setRole] = useState(initial?.role_title ?? "");
  const [order, setOrder] = useState(String(initial?.order ?? defaultOrder));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) => !q || u.label.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
    );
  }, [users, query]);

  const fieldError = (name: string) => errors[name] || serverFieldErrors[name];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const phoneValue = toEnglishDigits(phone.trim());
    const orderNumber = Number(order);

    if (!isEdit && kind === "internal") {
      if (userId === null) next.user = "یک کاربر انتخاب کنید.";
      else if (takenUserIds.includes(userId)) next.user = "این کاربر قبلاً در این جلسه اضافه شده است.";
    }
    if (kind === "external" && !fullName.trim()) next.full_name = "نام امضاکننده الزامی است.";
    if (kind === "external" && phoneValue && !PHONE_REGEX.test(phoneValue)) {
      next.phone_number = "شماره موبایل باید مثل 09123456789 باشد.";
    }
    if (!Number.isInteger(orderNumber) || orderNumber < 0) next.order = "ترتیب باید عدد صحیح و نامنفی باشد.";

    setErrors(next);
    if (Object.keys(next).length) return;

    onSubmit({
      user: kind === "internal" ? userId : null,
      full_name: kind === "external" ? fullName.trim() : "",
      phone_number: kind === "external" ? phoneValue : "",
      role_title: role.trim(),
      order: orderNumber,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {!isEdit && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/5 p-1 dark:bg-white/5" role="tablist">
          {(
            [
              ["internal", "کاربر سامانه"],
              ["external", "شخص بیرونی"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={kind === value}
              onClick={() => setKind(value)}
              className={`h-9 rounded-xl text-[12px] font-bold transition-colors ${
                kind === value
                  ? "bg-white text-indigo-600 shadow-sm dark:bg-gray-800 dark:text-indigo-300"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {kind === "internal" && !isEdit && (
        <div>
          <span className={LABEL}>کاربر</span>
          <div className="relative mb-2">
            <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جست‌وجوی نام یا نام کاربری"
              className={`${INPUT} pr-9`}
              aria-label="جست‌وجوی کاربر"
            />
          </div>
          <div
            role="listbox"
            aria-label="فهرست کاربران"
            className="max-h-44 overflow-y-auto rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/[0.03]"
          >
            {usersLoading && (
              <p className="flex items-center gap-2 p-3 text-[12px] text-gray-500">
                <Loader2 size={13} className="animate-spin" /> در حال دریافت کاربران...
              </p>
            )}
            {!usersLoading && filtered.length === 0 && (
              <p className="p-3 text-[12px] text-gray-500">کاربری پیدا نشد.</p>
            )}
            {filtered.map((u) => {
              const taken = takenUserIds.includes(u.id);
              const selected = userId === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={taken}
                  onClick={() => setUserId(u.id)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-right text-[12.5px] transition-colors disabled:opacity-40 ${
                    selected
                      ? "bg-indigo-500/10 font-bold text-indigo-600 dark:text-indigo-300"
                      : "text-gray-700 hover:bg-black/[0.03] dark:text-gray-200 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="truncate">{u.label}</span>
                  <span className="shrink-0 text-[11px] text-gray-400" dir="ltr">
                    {taken ? "اضافه شده" : `@${u.username}`}
                  </span>
                </button>
              );
            })}
          </div>
          {fieldError("user") && <p className="mt-1 text-[11.5px] font-semibold text-red-500">{fieldError("user")}</p>}
        </div>
      )}

      {isEdit && !initial?.isExternal && (
        <div className="rounded-xl bg-black/[0.03] px-3 py-2.5 text-[12.5px] text-gray-600 dark:bg-white/5 dark:text-gray-300">
          امضاکننده: <span className="font-bold">{initial?.displayName}</span>
          <span className="mr-2 text-[11px] text-gray-400">(تغییر کاربر ممکن نیست)</span>
        </div>
      )}

      {kind === "external" && (
        <>
          <div>
            <label htmlFor="signer-name" className={LABEL}>نام و نام خانوادگی</label>
            <input
              id="signer-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={200}
              className={`${INPUT} ${fieldError("full_name") ? INPUT_ERROR : ""}`}
            />
            {fieldError("full_name") && <p className="mt-1 text-[11.5px] font-semibold text-red-500">{fieldError("full_name")}</p>}
          </div>
          <div>
            <label htmlFor="signer-phone" className={LABEL}>شماره موبایل (اختیاری)</label>
            <input
              id="signer-phone"
              dir="ltr"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09123456789"
              maxLength={11}
              className={`${INPUT} text-left ${fieldError("phone_number") ? INPUT_ERROR : ""}`}
            />
            {fieldError("phone_number") && <p className="mt-1 text-[11.5px] font-semibold text-red-500">{fieldError("phone_number")}</p>}
          </div>
        </>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
        <div>
          <label htmlFor="signer-role" className={LABEL}>سمت (اختیاری)</label>
          <input
            id="signer-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="مثلاً مدیر مالی"
            className={`${INPUT} ${fieldError("role_title") ? INPUT_ERROR : ""}`}
          />
          {fieldError("role_title") && <p className="mt-1 text-[11.5px] font-semibold text-red-500">{fieldError("role_title")}</p>}
        </div>
        <div>
          <label htmlFor="signer-order" className={LABEL}>ترتیب</label>
          <input
            id="signer-order"
            type="number"
            min={0}
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className={`${INPUT} ${fieldError("order") ? INPUT_ERROR : ""}`}
          />
          {fieldError("order") && <p className="mt-1 text-[11.5px] font-semibold text-red-500">{fieldError("order")}</p>}
        </div>
      </div>

      {serverError && (
        <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-[12px] font-semibold text-red-500">
          {serverError}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={submitting} className={BTN_GHOST}>
          انصراف
        </button>
        <button type="submit" disabled={submitting} className={BTN_PRIMARY}>
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
