import { ChevronLeft, ChevronRight, Loader } from "lucide-react";
import { useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/pagination";
import TaskCard from "@/components/admin/departments/TaskCard";
import type { Task } from "@/components/admin/departments/types";

interface TaskSwiperProps {
    tasks: Task[];
    loading?: boolean;
}

export default function TaskSwiper({ tasks, loading = false }: TaskSwiperProps) {
    const [swiper, setSwiper] = useState<SwiperType | null>(null);

    const slidesPerView = useMemo(() => {
        if (typeof window === "undefined") return 1;
        if (window.innerWidth >= 1536) return 3;
        if (window.innerWidth >= 1024) return 2;
        if (window.innerWidth >= 640) return 2;
        return 1;
    }, []);

    if (loading) {
        return (
            <div className="flex h-24 items-center justify-center">
                <Loader size={18} className="animate-spin text-indigo-500" />
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="flex h-24 items-center justify-center rounded-[1.4rem] border border-dashed border-gray-200 dark:border-white/[0.07]">
                <p className="text-[11.5px] text-gray-400">وظیفه‌ای برای این فرآیند وجود ندارد</p>
            </div>
        );
    }

    return (
        <div className="relative">
            <Swiper
                modules={[Pagination]}
                slidesPerView={slidesPerView}
                spaceBetween={12}
                onSwiper={setSwiper}
                className="!pb-9 [&_.swiper-pagination]:!static [&_.swiper-pagination-bullet]:!h-1.5 [&_.swiper-pagination-bullet]:!w-1.5 [&_.swiper-pagination-bullet]:!rounded-full [&_.swiper-pagination-bullet]:!bg-indigo-400/40 [&_.swiper-pagination-bullet-active]:!bg-indigo-500"
                pagination={{ clickable: true }}
            >
                {tasks.map((task) => (
                    <SwiperSlide key={task.id}>
                        <TaskCard task={task} />
                    </SwiperSlide>
                ))}
            </Swiper>

            {tasks.length > slidesPerView && swiper && (
                <>
                    <button
                        type="button"
                        onClick={() => swiper.slidePrev()}
                        className="absolute right-0 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-100 text-gray-500 transition hover:text-indigo-500 dark:bg-[#1e293b] dark:ring-white/[0.08]"
                    >
                        <ChevronRight size={15} />
                    </button>
                    <button
                        type="button"
                        onClick={() => swiper.slideNext()}
                        className="absolute left-0 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-100 text-gray-500 transition hover:text-indigo-500 dark:bg-[#1e293b] dark:ring-white/[0.08]"
                    >
                        <ChevronLeft size={15} />
                    </button>
                </>
            )}
        </div>
    );
}
