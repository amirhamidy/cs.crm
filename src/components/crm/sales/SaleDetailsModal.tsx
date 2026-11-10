"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileText, Paperclip, Plus, Trash2, TriangleAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FloatingInput, FloatingTextarea } from "@/components/ui/FloatingField";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/notifications/toast";
import { attachmentsApi, issuesApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import {
    cleanDecimal,
    formatJalaliDate,
    formatMoney,
    formatWeight,
    isPositiveNumber,
    todayIso,
} from "@/lib/crm/format";
import type { IssueStatus, IssueType, LoadIssue, SaleAttachment } from "@/types/crm";
import JalaliDateField from "../shared/JalaliDateField";
import { Segmented } from "../shared/Segmented";

const ISSUE_TYPES: { value: IssueType; label: string }[] = [
    { value: "shortage", label: "کسری بار" },
    { value: "spillage", label: "سرک بار" },
    { value: "returned", label: "بار برگشتی" },
];

const STATUSES: { value: IssueStatus; label: string }[] = [
    { value: "open", label: "باز" },
    { value: "in_progress", label: "در حال پیگیری" },
    { value: "resolved", label: "حل‌شده" },
];

const ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt";

const sizeLabel = (bytes: number) =>
    bytes >= 1024 * 1024
        ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
        : `${Math.max(1, Math.round(bytes / 1024))} KB`;

interface Props {
    open: boolean;
    saleId: number | null;
    title: string;
    onClose: () => void;

    onChanged?: () => void;
}

export default function SaleDetailsModal({ open, saleId, title, onClose, onChanged }: Props) {
    const { can } = usePermissions();
    const [files, setFiles] = useState<SaleAttachment[]>([]);
    const [issues, setIssues] = useState<LoadIssue[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [uploading, setUploading] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);
    const [type, setType] = useState<IssueType>("shortage");
    const [qty, setQty] = useState("");
    const [date, setDate] = useState(todayIso());
    const [desc, setDesc] = useState("");
    const [saving, setSaving] = useState(false);

    const load = useCallback(
        async (signal?: AbortSignal) => {
            if (saleId == null) return;
            setLoading(true);
            setError("");
            try {
                const [f, i] = await Promise.all([
                    attachmentsApi.list(saleId, signal),
                    issuesApi.forSale(saleId, signal),
                ]);
                setFiles(f);
                setIssues(i);
            } catch (e) {
                if (!signal?.aborted) setError(apiMessage(e, "دریافت اطلاعات ناموفق بود"));
            } finally {
                if (!signal?.aborted) setLoading(false);
            }
        },
        [saleId],
    );

    useEffect(() => {
        if (!open) return;
        const controller = new AbortController();
        setQty("");
        setDesc("");
        setDate(todayIso());
        void load(controller.signal);
        return () => controller.abort();
    }, [open, load]);

    async function run(fn: () => Promise<unknown>, failMessage: string) {
        setError("");
        try {
            await fn();
            await load();
            onChanged?.();
        } catch (e) {
            setError(apiMessage(e, failMessage));
        }
    }

    async function onPick(list: FileList | null) {
        if (!list || saleId == null) return;
        setUploading(true);
        setError("");
        try {
            for (const file of Array.from(list)) {
                await attachmentsApi.upload(saleId, file);
            }
            await load();
            onChanged?.();
            toast.success("فایل ذخیره شد");
        } catch (e) {
            setError(apiMessage(e, "آپلود فایل ناموفق بود"));
        } finally {
            setUploading(false);
            if (fileInput.current) fileInput.current.value = "";
        }
    }

    async function addIssue() {
        if (saleId == null || !isPositiveNumber(qty)) return;
        setSaving(true);
        setError("");
        try {
            await issuesApi.create(saleId, {
                issue_type: type,
                quantity_kg: cleanDecimal(qty),
                issue_date: date,
                description: desc.trim(),
            });
            setQty("");
            setDesc("");
            await load();
            onChanged?.();
        } catch (e) {
            setError(apiMessage(e, "ثبت ناموفق بود"));
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="فایل‌ها و پیگیری بار"
            subtitle={title}
            icon={<Paperclip size={18} />}
            maxWidth="max-w-2xl"
        >
            {loading && files.length === 0 && issues.length === 0 ? (
                <div className="flex min-h-40 items-center justify-center text-gray-400">
                    <Spinner size={22} className="animate-spin" />
                </div>
            ) : (
                <div className="flex flex-col gap-6 px-1 pb-1">
                    {}
                    <section>
                        <div className="mb-2 flex items-center justify-between">
                            <h3 className="text-[13px] font-extrabold text-gray-800 dark:text-gray-100">
                                فایل‌های معامله
                            </h3>
                            {can("sales", "create") && (
                                <>
                                    <input
                                        ref={fileInput}
                                        type="file"
                                        multiple
                                        accept={ACCEPT}
                                        className="hidden"
                                        onChange={(e) => void onPick(e.target.files)}
                                    />
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        icon={<Plus size={14} />}
                                        loading={uploading}
                                        onClick={() => fileInput.current?.click()}
                                    >
                                        افزودن فایل
                                    </Button>
                                </>
                            )}
                        </div>
                        <p className="mb-2 text-[11px] text-gray-400">
                            فاکتور، بارنامه، قرارداد، رسید، عکس بار و ... (pdf، word، excel، تصویر؛
                            حداکثر ۱۰ مگابایت)
                        </p>

                        {files.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 py-5 text-center text-[12px] text-gray-400 dark:border-white/10">
                                هنوز فایلی ثبت نشده است
                            </div>
                        ) : (
                            <ul className="flex flex-col gap-1.5">
                                {files.map((f) => (
                                    <li
                                        key={f.id}
                                        className="flex items-center gap-2.5 rounded-2xl border border-gray-100 bg-white shadow-sm px-3 py-2 dark:border-white/[0.06] dark:bg-white/[0.03]"
                                    >
                                        <FileText size={16} className="shrink-0 text-gray-400" />
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-[12.5px] font-bold text-gray-800 dark:text-gray-100">
                                                {f.title || f.original_name}
                                            </div>
                                            <div className="text-[10.5px] text-gray-400">
                                                {sizeLabel(f.size)} · {f.uploaded_by_username} ·{" "}
                                                {formatJalaliDate(f.created_at)}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            aria-label="دانلود"
                                            onClick={() =>
                                                void attachmentsApi
                                                    .download(f)
                                                    .catch((e) =>
                                                        setError(
                                                            apiMessage(e, "دانلود ناموفق بود"),
                                                        ),
                                                    )
                                            }
                                            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10"
                                        >
                                            <Download size={14} />
                                        </button>
                                        {can("sales", "delete") && (
                                            <button
                                                type="button"
                                                aria-label="حذف فایل"
                                                onClick={() =>
                                                    void run(
                                                        () => attachmentsApi.remove(f.id),
                                                        "حذف فایل ناموفق بود",
                                                    )
                                                }
                                                className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {}
                    <section>
                        <h3 className="mb-2 flex items-center gap-1.5 text-[13px] font-extrabold text-gray-800 dark:text-gray-100">
                            <TriangleAlert size={14} className="text-amber-500" />
                            کسری بار، سرک بار و بار برگشتی
                        </h3>

                        {issues.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 py-5 text-center text-[12px] text-gray-400 dark:border-white/10">
                                موردی ثبت نشده است
                            </div>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {issues.map((i) => (
                                    <li
                                        key={i.id}
                                        className="rounded-2xl border border-gray-100 bg-white shadow-sm p-3 dark:border-white/[0.06] dark:bg-white/[0.03]"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <span className="text-[12.5px] font-extrabold text-gray-900 dark:text-white">
                                                    {i.issue_type_display}
                                                </span>
                                                <span className="ms-2 text-[12px] text-gray-600 dark:text-gray-300">
                                                    {formatWeight(i.quantity_kg)} · ارزش{" "}
                                                    {formatMoney(i.loss_amount)}
                                                </span>
                                                <div className="text-[10.5px] text-gray-400">
                                                    {formatJalaliDate(i.issue_date)} ·{" "}
                                                    {i.created_by_username}
                                                </div>
                                            </div>
                                            {can("sales", "delete") && (
                                                <button
                                                    type="button"
                                                    aria-label="حذف"
                                                    onClick={() =>
                                                        void run(
                                                            () => issuesApi.remove(i.id),
                                                            "حذف ناموفق بود",
                                                        )
                                                    }
                                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                        {i.description && (
                                            <p className="mt-1 text-[11.5px] leading-5 text-gray-500 dark:text-gray-400">
                                                {i.description}
                                            </p>
                                        )}
                                        <div className="mt-2">
                                            <Segmented
                                                size="sm"
                                                options={STATUSES}
                                                value={i.status}
                                                disabled={!can("sales", "edit")}
                                                onChange={(status) =>
                                                    void run(
                                                        () => issuesApi.update(i.id, { status }),
                                                        "تغییر وضعیت ناموفق بود",
                                                    )
                                                }
                                            />
                                        </div>
                                        {can("sales", "edit") && (
                                            <input
                                                key={`${i.id}-${i.updated_at}`}
                                                defaultValue={i.resolution_note}
                                                placeholder="نتیجه‌ی پیگیری (با خروج از کادر ذخیره می‌شود)"
                                                onBlur={(e) => {
                                                    const value = e.target.value.trim();
                                                    if (value !== i.resolution_note) {
                                                        void run(
                                                            () =>
                                                                issuesApi.update(i.id, {
                                                                    resolution_note: value,
                                                                }),
                                                            "ذخیره‌ی نتیجه ناموفق بود",
                                                        );
                                                    }
                                                }}
                                                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] outline-none focus:border-brand dark:border-white/10 dark:bg-white/[0.04]"
                                            />
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {can("sales", "create") && (
                            <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-gray-100 p-3 dark:border-white/[0.06]">
                                <Segmented options={ISSUE_TYPES} value={type} onChange={setType} />
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <FloatingInput
                                        id="issue_qty"
                                        label="مقدار (کیلوگرم)"
                                        inputMode="decimal"
                                        value={qty}
                                        onChange={(e) => setQty(e.target.value)}
                                    />
                                    <JalaliDateField
                                        label="تاریخ"
                                        value={date}
                                        onChange={setDate}
                                    />
                                </div>
                                <FloatingTextarea
                                    id="issue_desc"
                                    label="توضیحات (اختیاری)"
                                    value={desc}
                                    onChange={(e) => setDesc(e.target.value)}
                                />
                                <Button
                                    size="sm"
                                    icon={<Plus size={14} />}
                                    disabled={!isPositiveNumber(qty)}
                                    loading={saving}
                                    onClick={() => void addIssue()}
                                >
                                    ثبت {ISSUE_TYPES.find((t) => t.value === type)?.label}
                                </Button>
                            </div>
                        )}
                    </section>

                    {error && (
                        <p
                            role="alert"
                            className="rounded-2xl bg-red-50 px-4 py-2.5 text-[12px] font-semibold text-red-500 dark:bg-red-500/10 dark:text-red-400"
                        >
                            {error}
                        </p>
                    )}
                </div>
            )}
        </Modal>
    );
}
