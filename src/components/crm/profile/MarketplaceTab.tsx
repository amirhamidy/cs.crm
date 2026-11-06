"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Eye, EyeOff, KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState } from "@/components/ui/Feedback";
import { FloatingInput, FloatingTextarea } from "@/components/ui/FloatingField";
import { Modal } from "@/components/ui/Modal";
import { ListSkeleton } from "@/components/ui/skeletons";
import { toast } from "@/components/notifications/toast";
import { marketplaceApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import { formatJalaliDateTime } from "@/lib/crm/format";
import type { MarketplaceAccount } from "@/types/crm";
import { Card, SectionTitle } from "../ui";

const REVEAL_SECONDS = 30;

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} کپی شد`);
  } catch {
    toast.error("کپی انجام نشد؛ دستی کپی کنید");
  }
}

function AccountForm({
  open,
  customerId,
  account,
  onClose,
  onSaved,
}: {
  open: boolean;
  customerId: number;
  account: MarketplaceAccount | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("بازارگاه");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(account?.marketplace_name ?? "بازارگاه");
    setUsername(account?.username ?? "");
    setPassword("");
    setUrl(account?.url ?? "");
    setNotes(account?.notes ?? "");
    setError("");
    setSaving(false);
  }, [open, account]);

  const valid = username.trim() !== "" && (account != null || password !== "");

  async function submit() {
    if (!valid) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        marketplace_name: name.trim() || "بازارگاه",
        username: username.trim(),
        url: url.trim(),
        notes: notes.trim(),
        ...(password ? { password } : {}),
      };
      if (account) await marketplaceApi.update(account.id, payload);
      else await marketplaceApi.create(customerId, payload);
      onSaved();
      onClose();
    } catch (e) {
      setError(apiMessage(e, "ذخیره ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={saving}
      title={account ? "ویرایش حساب" : "حساب جدید"}
      icon={<KeyRound size={18} />}
      footer={
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving} className="flex-1">
            انصراف
          </Button>
          <Button onClick={submit} disabled={!valid} loading={saving} className="flex-[2]">
            ذخیره
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 px-1 pb-1">
        <FloatingInput id="mp_name" label="نام سامانه" value={name} onChange={(e) => setName(e.target.value)} />
        <FloatingInput
          id="mp_user"
          label="نام کاربری"
          dir="ltr"
          autoComplete="off"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <FloatingInput
          id="mp_pass"
          label={account ? "رمز جدید (خالی = بدون تغییر)" : "رمز"}
          dir="ltr"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FloatingInput
          id="mp_url"
          label="آدرس سامانه (اختیاری)"
          dir="ltr"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <FloatingTextarea
          id="mp_notes"
          label="توضیحات (اختیاری)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <p className="text-[11px] leading-5 text-gray-400">
          رمز به‌صورت رمزگذاری‌شده ذخیره می‌شود و فقط کسانی که دسترسی «دیدن» این بخش را دارند
          می‌توانند آن را ببینند؛ هر بار نمایش رمز ثبت می‌شود.
        </p>
        {error && (
          <p role="alert" className="rounded-2xl bg-red-50 px-3.5 py-3 text-[12px] font-semibold text-red-500 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

export default function MarketplaceTab({ customerId }: { customerId: number }) {
  const { can } = usePermissions();
  const [accounts, setAccounts] = useState<MarketplaceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MarketplaceAccount | null>(null);
  const [toDelete, setToDelete] = useState<MarketplaceAccount | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [shown, setShown] = useState<Record<number, string>>({});
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      setAccounts(await marketplaceApi.list(customerId, signal));
    } catch (e) {
      if (!signal?.aborted) setError(apiMessage(e, "دریافت حساب‌ها ناموفق بود"));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const current = timers.current;
    return () => {
      controller.abort();
      Object.values(current).forEach(clearTimeout);
    };
  }, [load]);

  const hide = (id: number) => {
    clearTimeout(timers.current[id]);
    setShown((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  async function reveal(account: MarketplaceAccount) {
    try {
      const password = await marketplaceApi.reveal(account.id);
      setShown((prev) => ({ ...prev, [account.id]: password }));
      clearTimeout(timers.current[account.id]);
      timers.current[account.id] = setTimeout(() => hide(account.id), REVEAL_SECONDS * 1000);
    } catch (e) {
      toast.error(apiMessage(e, "نمایش رمز ناموفق بود"));
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await marketplaceApi.remove(toDelete.id);
      setToDelete(null);
      void load();
      toast.success("حساب حذف شد");
    } catch (e) {
      toast.error(apiMessage(e, "حذف ناموفق بود"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card>
      <SectionTitle
        icon={<KeyRound size={16} />}
        title="حساب بازارگاه مشتری"
        actions={
          can("customer_credentials", "create") ? (
            <Button
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              حساب جدید
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <ListSkeleton rows={2} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : accounts.length === 0 ? (
        <EmptyState
          title="حسابی ثبت نشده است"
          description="نام کاربری و رمز مشتری را اینجا نگه دارید تا برای هر خرید لازم نباشد دوباره از او بگیرید."
          icon={<KeyRound size={26} />}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {accounts.map((a) => {
            const password = shown[a.id];
            return (
              <li
                key={a.id}
                className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.03]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                      {a.marketplace_name}
                    </div>
                    {a.url && (
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        dir="ltr"
                        className="block truncate text-[11px] text-brand hover:underline"
                      >
                        {a.url}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {can("customer_credentials", "edit") && (
                      <button
                        type="button"
                        aria-label="ویرایش"
                        onClick={() => {
                          setEditing(a);
                          setFormOpen(true);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {can("customer_credentials", "delete") && (
                      <button
                        type="button"
                        aria-label="حذف"
                        onClick={() => setToDelete(a)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <dl className="mt-3 grid gap-2 text-[12px] sm:grid-cols-2">
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 dark:bg-white/[0.04]">
                    <div className="min-w-0">
                      <dt className="text-[10.5px] text-gray-400">نام کاربری</dt>
                      <dd dir="ltr" className="truncate text-start font-bold text-gray-800 dark:text-gray-100">
                        {a.username}
                      </dd>
                    </div>
                    <button
                      type="button"
                      aria-label="کپی نام کاربری"
                      onClick={() => void copy(a.username, "نام کاربری")}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                      <Copy size={14} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 dark:bg-white/[0.04]">
                    <div className="min-w-0">
                      <dt className="text-[10.5px] text-gray-400">رمز</dt>
                      <dd dir="ltr" className="truncate text-start font-bold text-gray-800 dark:text-gray-100">
                        {password ?? "••••••••"}
                      </dd>
                    </div>
                    <div className="flex shrink-0 items-center">
                      {password && (
                        <button
                          type="button"
                          aria-label="کپی رمز"
                          onClick={() => void copy(password, "رمز")}
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                        >
                          <Copy size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label={password ? "پنهان کردن رمز" : "نمایش رمز"}
                        onClick={() => (password ? hide(a.id) : void reveal(a))}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                      >
                        {password ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </dl>

                {a.notes && (
                  <p className="mt-2 text-[11.5px] leading-5 text-gray-500 dark:text-gray-400">{a.notes}</p>
                )}
                {a.last_revealed_at && (
                  <p className="mt-2 text-[10.5px] text-gray-400">
                    آخرین نمایش رمز: {formatJalaliDateTime(a.last_revealed_at)}
                    {a.last_revealed_by_username ? ` توسط ${a.last_revealed_by_username}` : ""}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <AccountForm
        open={formOpen}
        customerId={customerId}
        account={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
              toast.success("ذخیره شد");
        }}
      />

      <ConfirmDialog
        open={toDelete != null}
        title="حذف حساب"
        message="این حساب و رمز ذخیره‌شده‌اش حذف می‌شود. ادامه می‌دهید؟"
        confirmLabel="حذف"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </Card>
  );
}
