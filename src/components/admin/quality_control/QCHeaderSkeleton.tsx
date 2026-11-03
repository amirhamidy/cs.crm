import { Skeleton } from "../../ui/Skeleton";

const box = "rounded-[1.45rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111827]";

/** اسکلت هدر صفحه (عنوان + جستجو + آمار)؛ ابعاد مطابق هدر واقعی */
export default function HeaderSkeleton({ search = false }: { search?: boolean }) {
    return (
        <div aria-hidden="true" className={`${box} animate-pulse p-3`}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-28 rounded-md" />
                        <Skeleton className="h-3 w-56 max-w-full rounded-md" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {search && <Skeleton className="h-9 flex-1 rounded-full sm:w-64 sm:flex-none" />}
                    <Skeleton className="hidden h-9 w-24 rounded-full md:block" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-3 py-3 dark:bg-white/[0.03]">
                        <Skeleton className="h-8 w-8 rounded-xl" />
                        <div className="flex-1 space-y-2"><Skeleton className="h-3 w-2/3" /><Skeleton className="h-4 w-1/3" /></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
