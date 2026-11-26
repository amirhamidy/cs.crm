"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listAll } from "@/lib/api";
import type { HumanResource } from "../humanResourceApi";
import { Check, Eye, Trash2, X, Loader2, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { gradientOf, initialOf } from "../hrUtils";
import { useDialogs } from "@/components/ui/useDialogs";
import { useHrList } from "./useHrList";
import Pager from "./Pager";
import { Badge, EmptyState, ErrorBox, Field, PrimaryButton, Select, TextInput } from "./hrUi";
import WasteSummaryPanel from "./WasteSummaryPanel";
import { hrApi, errorMessage, fmtDate, fmtNum, type WasteDeduction, type WasteStatus } from "./hrApi";
import { todayJalali } from "@/lib/jalali";
import SearchInput from "@/components/ui/SearchInput";

const DOC_URL = "/document/api/v1/";

const LABEL: Record<WasteStatus, string> = { pending: "در انتظار تصمیم", approved: "تأیید‌شده", waived: "کسر نشد" };
const CLS: Record<WasteStatus, string> = {
  pending: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  approved: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  waived: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300",
};

function WasteCard({ doc, onClick }: { doc: HumanResource; onClick: () => void }) {
  const [summary, setSummary] = useState<{ pending: string; approved: string; count: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const [y] = todayJalali();
    hrApi.wasteDeductions.summary(doc.id, { group_by: "year", year: y })
      .then((r) => {
        if (alive) {
          setSummary({
            pending: r.totals.pending_amount,
            approved: r.totals.approved_amount,
            count: r.totals.count,
          });
        }
      })
      .catch(() => alive && setSummary(null))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [doc.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col gap-3 rounded-[2rem] border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-xl hover:shadow-black/[0.04] dark:border-white/[0.06] dark:bg-[#111827]"
      dir="rtl"
    >
      <button
        type="button"
        onClick={onClick}
        className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10"
      >
        <Pencil size={14} />
      </button>
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientOf(doc.id)} text-[14px] font-extrabold text-white`}>
          {initialOf(doc.employee_name || doc.title, "م")}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">{doc.employee_name || doc.title}</h3>
          <p className="mt-0.5 truncate text-[10.5px] font-semibold text-gray-400">{doc.employee_name ? doc.title : "شخصی تعیین نشده"}</p>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-indigo-500" /></div>
      ) : summary ? (
        <div className="space-y-2">
          <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-500/10">
            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">در انتظار تصمیم</p>
            <p className="mt-1 text-[13px] font-extrabold text-amber-700 dark:text-amber-300">{fmtNum(summary.pending)}</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-3 dark:bg-rose-500/10">
            <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400">تأییدشده (قطعی)</p>
            <p className="mt-1 text-[13px] font-extrabold text-rose-700 dark:text-rose-300">{fmtNum(summary.approved)}</p>
          </div>
          <p className="text-center text-[10.5px] text-gray-400">تعداد کل: {summary.count} مورد</p>
        </div>
      ) : (
        <p className="py-2 text-center text-[10.5px] text-gray-400">کسری ثبت نشده</p>
      )}
    </motion.div>
  );
}

export default function WasteTab({ canManage }: { canManage: boolean }) {
  const [docs, setDocs] = useState<HumanResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    listAll<HumanResource>(DOC_URL).then(setDocs).catch(() => setDocs([])).finally(() => setLoading(false));
  }, []);

  const filtered = docs.filter((d) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (d.employee_name?.toLowerCase().includes(q) || d.title.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-4" dir="rtl">
      <div className="rounded-[2rem] border border-gray-100 bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#111827]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">کسر ضایعات</h1>
            <p className="mt-0.5 text-[11px] text-gray-400">کسرهای ضایعات تولید به تفکیک پرسنل</p>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="جستجو..." className="w-full sm:w-72" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-indigo-500" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="موردی پیدا نشد" icon={<Trash2 size={20} />} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((d) => (
            <WasteCard key={d.id} doc={d} onClick={() => router.push(`/admin/human-resources/waste/personnel?${new URLSearchParams({ documentId: String(d.id), employeeName: d.employee_name || d.title, canManage: String(canManage) })}`)} />
          ))}
        </div>
      )}

    </div>
  );
}
