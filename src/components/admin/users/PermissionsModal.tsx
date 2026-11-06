"use client";

import { useEffect, useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { accessApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import { toast } from "@/components/notifications/toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
    PERMISSION_ACTIONS,
    type PermissionAction,
    type PermissionMap,
    type SectionInfo,
} from "@/types/access";

interface Props {
    open: boolean;
    userId: number;
    userName: string;
    onClose: () => void;
}

const DEFAULT_LABELS: Record<PermissionAction, string> = {
    view: "دیدن",
    create: "ساختن",
    edit: "ویرایش",
    delete: "حذف",
};

const COLS = "grid grid-cols-[minmax(0,1fr)_repeat(4,2.75rem)] sm:grid-cols-[minmax(0,1fr)_repeat(4,3.5rem)]";

function Box({
    checked,
    label,
    onClick,
}: {
    checked: boolean;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            aria-label={label}
            onClick={onClick}
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 sm:h-7 sm:w-7"
        >
            <span
                className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${checked
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-300 bg-white dark:border-white/20 dark:bg-white/5"
                    }`}
            >
                {checked && <Check size={13} strokeWidth={3} />}
            </span>
        </button>
    );
}

export default function PermissionsModal({ open, userId, userName, onClose }: Props) {
    const [sections, setSections] = useState<SectionInfo[]>([]);
    const [labels, setLabels] = useState<Record<PermissionAction, string>>(DEFAULT_LABELS);
    const [draft, setDraft] = useState<PermissionMap>({});
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [loadFailed, setLoadFailed] = useState(false);

    useEffect(() => {
        if (!open) return;

        let alive = true;
        setLoading(true);
        setLoadFailed(false);
        setError("");

        Promise.all([accessApi.sections(), accessApi.userPermissions(userId)])
            .then(([meta, current]) => {
                if (!alive) return;
                setSections(meta.sections);
                setLabels({ ...DEFAULT_LABELS, ...meta.action_labels });
                setDraft(current.permissions);
            })
            .catch((e) => {
                if (!alive) return;
                setLoadFailed(true);
                setError(apiMessage(e, "دریافت سطح دسترسی انجام نشد"));
            })
            .finally(() => {
                if (alive) setLoading(false);
            });

        return () => {
            alive = false;
        };
    }, [open, userId]);

    const isOn = (key: string, action: PermissionAction) => Boolean(draft[key]?.[action]);

    const toggle = (section: SectionInfo, action: PermissionAction) => {
        setError("");
        setDraft((prev) => {
            const row = { ...(prev[section.key] ?? {}) };
            const next = !row[action];
            row[action] = next;
            if (action === "view" && !next) {
                for (const a of section.actions) row[a] = false;
            }
            if (action !== "view" && next) row.view = true;

            return { ...prev, [section.key]: row };
        });
    };

    const setRow = (section: SectionInfo, value: boolean) => {
        setError("");
        setDraft((prev) => ({
            ...prev,
            [section.key]: Object.fromEntries(section.actions.map((a) => [a, value])),
        }));
    };

    const preset = (level: "all" | "view" | "none") => {
        setError("");
        setDraft(
            Object.fromEntries(
                sections.map((section) => [
                    section.key,
                    Object.fromEntries(
                        section.actions.map((a) => [
                            a,
                            level === "all" ? true : level === "view" ? a === "view" : false,
                        ]),
                    ),
                ]),
            ),
        );
    };

    const save = async () => {
        if (busy || loading || loadFailed) return;
        setBusy(true);
        setError("");
        try {
            await accessApi.saveUserPermissions(userId, draft);
            toast.success("سطح دسترسی ذخیره شد");
            onClose();
        } catch (e) {
            setError(apiMessage(e, "ذخیره‌ی سطح دسترسی انجام نشد"));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            busy={busy}
            title={`سطح دسترسی ${userName}`}
            subtitle="مشخص کنید این کاربر در هر بخش چه کارهایی بتواند انجام دهد"
            icon={<ShieldCheck size={18} />}
            maxWidth="max-w-xl"
            footer={
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="primary"
                        disabled={busy || loading || loadFailed}
                        loading={busy}
                        onClick={() => void save()}
                        fullWidth
                    >
                        ذخیره
                    </Button>
                    <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
                        انصراف
                    </Button>
                </div>
            }
        >
            {loading ? (
                <div className="flex min-h-40 items-center justify-center text-gray-400">
                    <Spinner size={22} className="animate-spin" />
                </div>
            ) : (
                <>
                    {!loadFailed && (
                        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11.5px]">
                            <span className="font-bold text-gray-500 dark:text-gray-400">تنظیم سریع:</span>
                            {(
                                [
                                    ["all", "دسترسی کامل"],
                                    ["view", "فقط دیدن"],
                                    ["none", "بدون دسترسی"],
                                ] as const
                            ).map(([level, text]) => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => preset(level)}
                                    className="rounded-lg bg-gray-900/5 px-2.5 py-1 font-bold text-gray-600 hover:bg-gray-900/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                                >
                                    {text}
                                </button>
                            ))}
                        </div>
                    )}

                    {!loadFailed && (
                        <div className="overflow-hidden rounded-2xl border border-gray-900/[0.08] dark:border-white/[0.08]">
                            <div
                                className={`${COLS} items-center bg-gray-900/[0.04] px-3 py-2 text-[11.5px] font-bold text-gray-500 dark:bg-white/[0.04] dark:text-gray-400`}
                            >
                                <span>بخش</span>
                                {PERMISSION_ACTIONS.map((action) => (
                                    <span key={action} className="text-center">
                                        {labels[action]}
                                    </span>
                                ))}
                            </div>

                            {sections.map((section) => {
                                const allOn = section.actions.every((a) => isOn(section.key, a));

                                return (
                                    <div
                                        key={section.key}
                                        className={`${COLS} items-center border-t border-gray-900/[0.06] px-3 py-2.5 dark:border-white/[0.06]`}
                                    >
                                        <div className="min-w-0 pe-2">
                                            <div className="text-[13px] font-bold text-gray-900 dark:text-white">
                                                {section.label}
                                            </div>
                                            {section.hint && (
                                                <div className="mt-0.5 text-[10.5px] leading-4 text-amber-600 dark:text-amber-400">
                                                    {section.hint}
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setRow(section, !allOn)}
                                                className="mt-0.5 text-[11px] font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                            >
                                                {allOn ? "برداشتن همه" : "انتخاب همه"}
                                            </button>
                                        </div>

                                        {PERMISSION_ACTIONS.map((action) =>
                                            section.actions.includes(action) ? (
                                                <Box
                                                    key={action}
                                                    checked={isOn(section.key, action)}
                                                    label={`${labels[action]} ${section.label}`}
                                                    onClick={() => toggle(section, action)}
                                                />
                                            ) : (
                                                <span
                                                    key={action}
                                                    aria-hidden
                                                    className="text-center text-gray-300 dark:text-gray-600"
                                                >
                                                    —
                                                </span>
                                            ),
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <p className="mt-3 text-[11.5px] leading-5 text-gray-500 dark:text-gray-400">
                        ساختن، ویرایش و حذف خودکار «دیدن» را هم فعال می‌کنند. تغییرات، بعد از باز کردن
                        دوباره‌ی برنامه (یا برگشتن به تب) برای کاربر اعمال می‌شود؛ ولی سرور از همان لحظه‌ی ذخیره
                        طبق دسترسی جدید جلوی درخواست‌ها را می‌گیرد.
                    </p>

                    {error && (
                        <p
                            role="alert"
                            className="mt-3 rounded-2xl bg-red-50 px-4 py-2.5 text-[11.5px] text-red-600 dark:bg-red-500/10 dark:text-red-400"
                        >
                            {error}
                        </p>
                    )}
                </>
            )}
        </Modal>
    );
}
