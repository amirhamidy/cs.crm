"use client";

import { useState } from "react";
import { MessageSquarePlus, Pencil, Send, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, SearchInput } from "@/components/ui/Feedback";
import Pagination from "@/components/ui/Pagination";
import { ListSkeleton } from "@/components/ui/skeletons";
import { toast } from "@/components/notifications/toast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { commentsApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import { formatJalaliDateTime } from "@/lib/crm/format";
import type { CustomerComment } from "@/types/crm";
import { Card, SectionTitle } from "../ui";

const MAX_LENGTH = 2000;

function CommentItem({
  comment,
  onEdit,
  onDelete,
}: {
  comment: CustomerComment;
  onEdit: (c: CustomerComment, text: string) => Promise<void>;
  onDelete: (c: CustomerComment) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.text);
  const [saving, setSaving] = useState(false);

  const edited = comment.updated_at !== comment.created_at &&
    new Date(comment.updated_at).getTime() - new Date(comment.created_at).getTime() > 2000;

  async function save() {
    const value = text.trim();
    if (!value || value === comment.text) {
      setEditing(false);
      setText(comment.text);
      return;
    }
    setSaving(true);
    try {
      await onEdit(comment, value);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-black text-brand">
              {comment.created_by_name.trim().charAt(0) || "؟"}
            </span>
            <span className="truncate text-[12.5px] font-extrabold text-gray-800 dark:text-gray-100">
              {comment.created_by_name}
            </span>
          </div>
          <div className="mt-0.5 pr-9 text-[10.5px] text-gray-400">
            {formatJalaliDateTime(comment.created_at)}
            {edited && " • ویرایش‌شده"}
          </div>
        </div>

        {comment.can_edit && !editing && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label="ویرایش نظر"
              onClick={() => {
                setText(comment.text);
                setEditing(true);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              aria-label="حذف نظر"
              onClick={() => onDelete(comment)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-2.5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX_LENGTH}
            rows={3}
            autoFocus
            className="w-full resize-none rounded-2xl border border-gray-200 bg-white p-3 text-[12.5px] leading-6 text-gray-900 outline-none focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={<X size={13} />}
              disabled={saving}
              onClick={() => {
                setEditing(false);
                setText(comment.text);
              }}
            >
              انصراف
            </Button>
            <Button size="sm" icon={<Check size={13} />} loading={saving} disabled={!text.trim()} onClick={save}>
              ذخیره
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-2.5 whitespace-pre-wrap break-words text-[12.5px] leading-7 text-gray-700 dark:text-gray-200">
          {comment.text}
        </p>
      )}
    </li>
  );
}

export default function CommentsTab({
  customerId,
  onChanged,
}: {
  customerId: number;
  onChanged?: () => void;
}) {
  const list = usePaginatedList<CustomerComment>(
    (params, signal) => commentsApi.page(customerId, params, signal),
    { pageSize: 10 },
  );

  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [toDelete, setToDelete] = useState<CustomerComment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function post() {
    const text = draft.trim();
    if (!text) return;
    setPosting(true);
    try {
      await commentsApi.create(customerId, text);
      setDraft("");
      list.setPage(1);
      list.refetch();
      onChanged?.();
      toast.success("نظر شما ثبت شد");
    } catch (e) {
      toast.error(apiMessage(e, "ثبت نظر ناموفق بود"));
    } finally {
      setPosting(false);
    }
  }

  async function edit(comment: CustomerComment, text: string) {
    try {
      await commentsApi.update(customerId, comment.id, text);
      list.refetch();
      toast.success("نظر ویرایش شد");
    } catch (e) {
      toast.error(apiMessage(e, "ویرایش نظر ناموفق بود"));
      throw e;
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await commentsApi.remove(customerId, toDelete.id);
      setToDelete(null);
      list.refetch();
      onChanged?.();
      toast.success("نظر حذف شد");
    } catch (e) {
      setDeleteError(apiMessage(e, "حذف نظر ناموفق بود"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SectionTitle icon={<MessageSquarePlus size={16} />} title="نظر جدید درباره این مشتری" />
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={MAX_LENGTH}
          rows={3}
          placeholder="مثلاً: پرداخت‌ها به موقع است، ترجیح می‌دهد تحویل درب کارخانه باشد..."
          className="w-full resize-none rounded-2xl border border-gray-200 bg-white p-3 text-[12.5px] leading-6 text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[10.5px] text-gray-400">
            {draft.length.toLocaleString("fa-IR")} / {MAX_LENGTH.toLocaleString("fa-IR")}
          </span>
          <Button icon={<Send size={14} />} loading={posting} disabled={!draft.trim()} onClick={post}>
            ثبت نظر
          </Button>
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[13.5px] font-extrabold text-gray-800 dark:text-gray-100">
            نظرات کارکنان
            {list.count > 0 && (
              <span className="mr-2 text-[11px] font-bold text-gray-400">
                ({list.count.toLocaleString("fa-IR")})
              </span>
            )}
          </h2>
          <SearchInput
            value={list.search}
            onChange={list.setSearch}
            placeholder="جستجو در نظرات..."
            className="w-full sm:w-64"
          />
        </div>

        {list.loading ? (
          <ListSkeleton rows={3} />
        ) : list.error ? (
          <ErrorState message="دریافت نظرات ناموفق بود" onRetry={list.refetch} />
        ) : list.data.length === 0 ? (
          <EmptyState
            title={list.search ? "نظری با این عبارت پیدا نشد" : "هنوز نظری ثبت نشده است"}
            icon={<MessageSquarePlus size={26} />}
          />
        ) : (
          <>
            <ul className="flex flex-col gap-2.5">
              {list.data.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  onEdit={edit}
                  onDelete={(item) => {
                    setDeleteError(null);
                    setToDelete(item);
                  }}
                />
              ))}
            </ul>
            {list.totalPages > 1 && (
              <div className="mt-3">
                <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} compact />
              </div>
            )}
          </>
        )}
      </Card>

      <ConfirmDialog
        open={toDelete != null}
        title="حذف نظر"
        message="این نظر برای همیشه حذف می‌شود. ادامه می‌دهید؟"
        confirmLabel="حذف"
        danger
        loading={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
