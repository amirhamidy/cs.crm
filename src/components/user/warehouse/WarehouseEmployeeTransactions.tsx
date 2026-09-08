"use client";

import { useMemo, useState } from "react";
import {
    ReceiptText,
    Search,
} from "lucide-react";
import { ApiStockTransaction } from "@/types/warehouse";
import WarehouseEmployeeTransactionCard from "./WarehouseEmployeeTransactionCard";
import {
    getTransactionProductName,
    matchesSearch,
    paginate,
    PAGE_SIZE,
} from "@/utils/warehouseEmployee";

interface Props {
    transactions: ApiStockTransaction[];
}

export default function WarehouseEmployeeTransactions({
    transactions,
}: Props) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const filtered = useMemo(
        () =>
            transactions.filter((transaction) => {
                const data =
                    transaction as unknown as Record<string, unknown>;

                return matchesSearch(
                    [
                        data.id,
                        data.type,
                        data.transaction_type,
                        data.operation_type,
                        data.reason,
                        data.note,
                        data.performed_by,
                        data.performed_by_name,
                        getTransactionProductName(transaction),
                    ],
                    search
                );
            }),
        [transactions, search]
    );

    const result = paginate(filtered, page, PAGE_SIZE);

    return (
        <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="flex items-center gap-2 text-base font-bold text-white">
                        <ReceiptText className="h-5 w-5 text-emerald-300" />
                        تراکنش‌های انبار
                    </h2>
                    <p className="mt-1 text-xs text-white/35">
                        آخرین ورود، خروج و اصلاحات موجودی
                    </p>
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                    <input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                        placeholder="جستجو در تراکنش‌ها..."
                        className="h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.03] pr-10 pl-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-400/30"
                    />
                </div>
            </div>

            {result.items.length ? (
                <div className="grid gap-3">
                    {result.items.map((transaction) => (
                        <WarehouseEmployeeTransactionCard
                            key={String(
                                (
                                    transaction as unknown as Record<
                                        string,
                                        unknown
                                    >
                                ).id
                            )}
                            transaction={transaction}
                        />
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#101114] px-6 py-14 text-center">
                    <ReceiptText className="mx-auto h-9 w-9 text-white/15" />
                    <p className="mt-3 text-sm text-white/45">
                        تراکنشی پیدا نشد
                    </p>
                </div>
            )}

            {result.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    {Array.from(
                        { length: result.totalPages },
                        (_, index) => index + 1
                    ).map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => setPage(item)}
                            className={`h-9 min-w-9 rounded-lg px-2 text-xs ${
                                item === result.page
                                    ? "bg-white text-black"
                                    : "bg-white/[0.04] text-white/45 hover:bg-white/[0.08]"
                            }`}
                        >
                            {item.toLocaleString("fa-IR")}
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}