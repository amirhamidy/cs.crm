"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Pencil, Trash2, Send, X, Check } from "lucide-react";
import { commentsApi } from "@/lib/api/comments";
import type { CustomerComment } from "@/types/comment";
import { extractFieldErrors } from "@/lib/parseApiErrors";
import { formatJalaliDateTime } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ListSkeleton } from "@/components/ui/skeletons";
import { toast } from "@/components/notifications/toast";

const PAGE_SIZE = 10;
const areaCls =
    "w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-800 outline-none focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-gray-100";

interface Props {
    customerId: number;
}

export default function CustomerComments({ customerId }: Props) {
    const [items, setItems] = useState<CustomerComment[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [reload, setReload] = useState(0);

    const [text, setText] = useState("");
    const [textError, setTextError] = useState("");
    const [saving, setSaving] = useState(false);

    const [editId, setEditId] = useState<number | null>(null);
    const [editText, setEditText] = useState("");
    const [editError, setEditError] = useState("");
    const [editSaving, setEditSaving] = useState(false);

    const [deleting, setDeleting] = useState<CustomerComment | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const seq = useRef(0);

    useEffect(() => {
        const t = setTimeout(() => setQuery(search.trim()), 300);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        const id = ++seq.current;
        const ctrl = new AbortController();
        setLoading(true);
        setError("");
        commentsApi
            .list(customerId, { page: 1, page_size: PAGE_SIZE, search: query || undefined }, ctrl.signal)
            .then((res) => {
                if (id !== seq.current) return;
                setItems(res.results);
                setPage(1);
                setHasMore(!!res.next);
            })
            .catch(() => {
                if (id === seq.current && !ctrl.signal.aborted) setError("دریافت نظرات با خطا مواجه شد.");
            })
            .finally(() => {
                if (id === seq.current) setLoading(false);
            });
        return () => ctrl.abort();
    }, [customerId, query, reload]);

    const loadMore = useCallback(async () => {
        setLoadingMore(true);
        try {
            const res = await commentsApi.list(customerId, {
                page: page + 1,
                page_size: PAGE_SIZE,
                search: query || undefined,
            });
            setItems((prev) => [...prev, ...res.results.filter((r) => !prev.some((p) => p.id === r.id))]);
            setPage((p) => p + 1);
            setHasMore(!!res.next);
        } catch {
            toast.error("دریافت نظرات بیشتر با خطا مواجه شد.");
        } finally {
            setLoadingMore(false);
        }
    }, [customerId, page, query]);

    const submit = async () => {
        const value = text.trim();
        if (!value) {
            setTextError("متن نظر نمی‌تواند خالی باشد.");
            return;
        }
        setSaving(true);
        setTextError("");
        try {
            await commentsApi.create(customerId, value);
            setText("");
            toast.success("نظر ثبت شد.");
            setReload((n) => n + 1);
        } catch (e) {
            const errs = extractFieldErrors(e, ["text"]);
            setTextError(errs.text || errs.general || "ثبت نظر با خطا مواجه شد.");
        } finally {
            setSaving(false);
        }
    };

    const saveEdit = async (c: CustomerComment) => {
        const value = editText.trim();
        if (!value) {
            setEditError("متن نظر نمی‌تواند خالی باشد.");
            return;
        }
        setEditSaving(true);
        setEditError("");
        try {
            const updated = await commentsApi.update(customerId, c.id, value);
            setItems((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
            setEditId(null);
            toast.success("نظر ویرایش شد.");
        } catch (e) {
            const errs = extractFieldErrors(e, ["text"]);
            setEditError(errs.text || errs.general || "ویرایش نظر با خطا مواجه شد.");
        } finally {
            setEditSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleting) return;
        setDeleteBusy(true);
        setDeleteError("");
        try {
            await commentsApi.remove(customerId, deleting.id);
            setItems((prev) => prev.filter((x) => x.id !== deleting.id));
            setDeleting(null);
            toast.success("نظر حذف شد.");
        } catch (e) {
            setDeleteError(extractFieldErrors(e, []).general || "حذف نظر با خطا مواجه شد.");
        } finally {
            setDeleteBusy(false);
        }
    };

    return (
        <section className="space-y-3" aria-label="نظرات">
            <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-black text-gray-900 dark:text-white">
                    <MessageCircle size={16} /> نظرات
                </h3>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="جستجو در نظرات"
                    aria-label="جستجو در نظرات"
                    className="h-9 w-44 rounded-xl border border-gray-200 bg-white px-3 text-[13px] outline-none focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
                />
            </div>

            <div>
                <textarea
                    rows={3}
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        setTextError("");
                    }}
                    placeholder="نظر خود را بنویسید..."
                    aria-label="متن نظر"
                    aria-invalid={!!textError}
                    className={areaCls}
                />
                {textError && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{textError}</p>}
                <div className="mt-2 flex justify-end">
                    <Button size="sm" loading={saving} icon={<Send size={14} />} onClick={submit}>
                        ثبت نظر
                    </Button>
                </div>
            </div>

            {loading ? (
                <ListSkeleton rows={2} />
            ) : error ? (
                <div className="rounded-2xl bg-rose-50 p-4 text-center text-sm font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                    {error}
                    <div className="mt-2">
                        <Button size="sm" variant="secondary" onClick={() => setReload((n) => n + 1)}>
                            تلاش مجدد
                        </Button>
                    </div>
                </div>
            ) : !items.length ? (
                <p className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
                    {query ? "نظری با این جستجو یافت نشد." : "هنوز نظری ثبت نشده است."}
                </p>
            ) : (
                <ul className="space-y-3">
                    {items.map((c) => (
                        <li
                            key={c.id}
                            className="rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/[0.035]"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-black text-gray-900 dark:text-white">
                                        {c.created_by_name || "کاربر ناشناس"}
                                    </p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                        {formatJalaliDateTime(c.created_at)}
                                        {c.updated_at !== c.created_at && " (ویرایش‌شده)"}
                                    </p>
                                </div>
                                {c.can_edit && editId !== c.id && (
                                    <div className="flex shrink-0 gap-1">
                                        <button
                                            type="button"
                                            aria-label="ویرایش نظر"
                                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10"
                                            onClick={() => {
                                                setEditId(c.id);
                                                setEditText(c.text);
                                                setEditError("");
                                            }}
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            type="button"
                                            aria-label="حذف نظر"
                                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/10"
                                            onClick={() => {
                                                setDeleting(c);
                                                setDeleteError("");
                                            }}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            {editId === c.id ? (
                                <div className="mt-2">
                                    <textarea
                                        rows={3}
                                        value={editText}
                                        onChange={(e) => {
                                            setEditText(e.target.value);
                                            setEditError("");
                                        }}
                                        aria-label="ویرایش متن نظر"
                                        className={areaCls}
                                    />
                                    {editError && (
                                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{editError}</p>
                                    )}
                                    <div className="mt-2 flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            icon={<X size={14} />}
                                            onClick={() => setEditId(null)}
                                        >
                                            انصراف
                                        </Button>
                                        <Button
                                            size="sm"
                                            loading={editSaving}
                                            icon={<Check size={14} />}
                                            onClick={() => saveEdit(c)}
                                        >
                                            ذخیره
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-gray-700 dark:text-gray-300">
                                    {c.text}
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {hasMore && !loading && (
                <div className="flex justify-center">
                    <Button size="sm" variant="secondary" loading={loadingMore} onClick={loadMore}>
                        نمایش نظرات بیشتر
                    </Button>
                </div>
            )}

            <ConfirmDialog
                open={!!deleting}
                title="حذف نظر"
                message="این نظر برای همیشه حذف می‌شود. ادامه می‌دهید؟"
                confirmLabel="حذف"
                danger
                loading={deleteBusy}
                error={deleteError || null}
                onConfirm={confirmDelete}
                onCancel={() => !deleteBusy && setDeleting(null)}
            />
        </section>
    );
}
