"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Switch } from "@/components/ui/Switch";
import { toast } from "@/components/notifications/toast";
import { tradeOptionsApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import { usePermissions } from "@/hooks/usePermissions";
import type { TradeOption } from "@/types/crm";

type OptionKind = TradeOption["kind"];

function OptionSection({
    kind,
    title,
    items,
    canCreate,
    canEdit,
    canDelete,
    onChanged,
}: {
    kind: OptionKind;
    title: string;
    items: TradeOption[];
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    onChanged: () => void;
}) {
    const [name, setName] = useState("");
    const [usesDeclaredWeight, setUsesDeclaredWeight] = useState(false);
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState("");
    const [deleting, setDeleting] = useState<TradeOption | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);

    async function add() {
        const value = name.trim();
        if (!value || adding) return;
        setAdding(true);
        try {
            await tradeOptionsApi.create({
                kind,
                name: value,
                ...(kind === "load_type" ? { uses_declared_weight: usesDeclaredWeight } : {}),
            });
            setName("");
            setUsesDeclaredWeight(false);
            onChanged();
            toast.success(`${title} اضافه شد`);
        } catch (error) {
            toast.error(apiMessage(error, `افزودن ${title} ناموفق بود`));
        } finally {
            setAdding(false);
        }
    }

    async function update(option: TradeOption, payload: Partial<TradeOption>) {
        setBusyId(option.id);
        try {
            await tradeOptionsApi.update(option.id, payload);
            setEditingId(null);
            onChanged();
        } catch (error) {
            toast.error(apiMessage(error, "ذخیره‌ی تغییرات ناموفق بود"));
        } finally {
            setBusyId(null);
        }
    }

    async function remove() {
        if (!deleting) return;
        setBusyId(deleting.id);
        try {
            await tradeOptionsApi.remove(deleting.id);
            setDeleting(null);
            onChanged();
            toast.success("گزینه حذف شد");
        } catch (error) {
            toast.error(apiMessage(error, "حذف گزینه ناموفق بود؛ ممکن است در معامله‌ای استفاده شده باشد"));
        } finally {
            setBusyId(null);
        }
    }

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.025]">
            <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">{title}</h3>
                <span className="text-[10.5px] font-bold text-gray-400">{items.length} مورد</span>
            </div>

            {canCreate && (
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void add();
                    }}
                    className="mb-3 flex flex-wrap items-center gap-2"
                >
                    <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder={`نام ${title}`}
                        autoComplete="off"
                        maxLength={100}
                        className="h-9 min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 text-[11.5px] font-semibold text-gray-800 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                    />
                    {kind === "load_type" && (
                        <label className="flex items-center gap-2 text-[10.5px] font-semibold text-gray-500 dark:text-gray-300">
                            <input
                                type="checkbox"
                                checked={usesDeclaredWeight}
                                onChange={(event) => setUsesDeclaredWeight(event.target.checked)}
                            />
                            وزن اعلامی
                        </label>
                    )}
                    <Button type="submit" size="sm" disabled={!name.trim() || adding} loading={adding}>
                        <Plus size={13} /> افزودن
                    </Button>
                </form>
            )}

            {items.length === 0 ? (
                <p className="py-4 text-center text-[11.5px] text-gray-400">گزینه‌ای ثبت نشده است</p>
            ) : (
                <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.06]">
                    {items.map((option) => {
                        const editing = editingId === option.id;
                        const busy = busyId === option.id;
                        return (
                            <div key={option.id} className="flex min-w-0 items-center gap-2 py-2.5">
                                <div className="min-w-0 flex-1">
                                    {editing ? (
                                        <input
                                            autoFocus
                                            value={editingName}
                                            onChange={(event) => setEditingName(event.target.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter") void update(option, { name: editingName.trim() });
                                                if (event.key === "Escape") setEditingId(null);
                                            }}
                                            className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-[11.5px] font-bold outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                                        />
                                    ) : (
                                        <>
                                            <p className={`truncate text-[11.5px] font-bold ${option.is_active ? "text-gray-800 dark:text-gray-100" : "text-gray-400 line-through"}`}>
                                                {option.name}
                                            </p>
                                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-gray-400">
                                                <span>{option.is_active ? "فعال" : "غیرفعال"}</span>
                                                {kind === "load_type" && (
                                                    <span>{option.uses_declared_weight ? "وزن اعلامی الزامی" : "بدون وزن اعلامی"}</span>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {kind === "load_type" && canEdit && !editing && (
                                    <label className="flex shrink-0 items-center gap-1.5 text-[10px] text-gray-400">
                                        <span>وزن اعلامی</span>
                                        <Switch
                                            checked={option.uses_declared_weight}
                                            disabled={busy}
                                            onChange={(value) => void update(option, { uses_declared_weight: value })}
                                        />
                                    </label>
                                )}
                                {canEdit && (
                                    editing ? (
                                        <>
                                            <button
                                                type="button"
                                                aria-label="ذخیره نام"
                                                disabled={busy || !editingName.trim()}
                                                onClick={() => void update(option, { name: editingName.trim() })}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 disabled:opacity-40"
                                            >
                                                <Check size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                aria-label="انصراف"
                                                onClick={() => setEditingId(null)}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400"
                                            >
                                                <X size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                aria-label="ویرایش نام"
                                                onClick={() => {
                                                    setEditingId(option.id);
                                                    setEditingName(option.name);
                                                }}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                                            >
                                                <Pencil size={13} />
                                            </button>
                                            <Switch
                                                checked={option.is_active}
                                                disabled={busy}
                                                aria-label={`فعال بودن ${option.name}`}
                                                onChange={(value) => void update(option, { is_active: value })}
                                            />
                                        </>
                                    )
                                )}
                                {canDelete && !editing && (
                                    <button
                                        type="button"
                                        aria-label="حذف گزینه"
                                        disabled={busy}
                                        onClick={() => setDeleting(option)}
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40 dark:hover:bg-red-500/10"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <ConfirmDialog
                open={deleting != null}
                title={`حذف ${title}`}
                message={deleting ? `«${deleting.name}» حذف شود؟ اگر در معامله‌ای استفاده شده باشد، سرور اجازه‌ی حذف نمی‌دهد.` : undefined}
                confirmLabel="حذف"
                danger
                loading={busyId === deleting?.id}
                onConfirm={() => void remove()}
                onCancel={() => setDeleting(null)}
            />
        </section>
    );
}

export default function TradeOptionsPanel() {
    const { can } = usePermissions();
    const [dealTypes, setDealTypes] = useState<TradeOption[]>([]);
    const [loadTypes, setLoadTypes] = useState<TradeOption[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [deals, loads] = await Promise.all([
                tradeOptionsApi.list("deal_type", { all: true }),
                tradeOptionsApi.list("load_type", { all: true }),
            ]);
            setDealTypes(deals);
            setLoadTypes(loads);
        } catch (error) {
            toast.error(apiMessage(error, "دریافت انواع معامله و بار ناموفق بود"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    return (
        <div className="mt-6">
            <div className="mb-3">
                <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">انواع معامله و بار</h2>
                <p className="mt-1 text-[11px] text-gray-400">گزینه‌هایی که هنگام ثبت معامله انتخاب می‌شوند</p>
            </div>
            {loading ? (
                <div className="rounded-2xl border border-gray-200 p-5 text-center text-[11.5px] text-gray-400 dark:border-white/10">
                    در حال دریافت گزینه‌ها...
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <OptionSection
                        kind="deal_type"
                        title="نوع معامله"
                        items={dealTypes}
                        canCreate={can("products", "create")}
                        canEdit={can("products", "edit")}
                        canDelete={can("products", "delete")}
                        onChanged={() => void load()}
                    />
                    <OptionSection
                        kind="load_type"
                        title="نوع بار"
                        items={loadTypes}
                        canCreate={can("products", "create")}
                        canEdit={can("products", "edit")}
                        canDelete={can("products", "delete")}
                        onChanged={() => void load()}
                    />
                </div>
            )}
        </div>
    );
}
