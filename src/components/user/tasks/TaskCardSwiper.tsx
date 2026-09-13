"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/pagination";
import UserTaskCard from "./UserTaskCard";
import type { UserTask } from "./types";

interface TaskCardSwiperProps {
    tasks: UserTask[];
    accent: string;
    onUpdated: (task: UserTask) => void;
    employeesMap: Record<number, string>;
}

export default function TaskCardSwiper({
    tasks,
    accent,
    onUpdated,
    employeesMap,
}: TaskCardSwiperProps) {
    const [swiper, setSwiper] = useState<SwiperType | null>(null);

    return (
        <div className="relative px-1 pb-1 pt-2">
            <Swiper
                modules={[Pagination]}
                slidesPerView={1}
                spaceBetween={10}
                onSwiper={setSwiper}
                className="!pb-8 [&_.swiper-pagination]:!static [&_.swiper-pagination-bullet]:!h-1.5 [&_.swiper-pagination-bullet]:!w-1.5 [&_.swiper-pagination-bullet]:!rounded-full [&_.swiper-pagination-bullet]:!opacity-100"
                style={
                    {
                        "--swiper-pagination-color": accent,
                        "--swiper-pagination-bullet-inactive-color": `${accent}35`,
                        "--swiper-pagination-bullet-inactive-opacity": 1,
                    } as React.CSSProperties
                }
                pagination={{ clickable: true }}
            >
                {tasks.map((task) => (
                    <SwiperSlide key={task.id}>
                        <UserTaskCard
                            task={task}
                            accent={accent}
                            onUpdated={onUpdated}
                            employeesMap={employeesMap}
                        />
                    </SwiperSlide>
                ))}
            </Swiper>

            {tasks.length > 1 && swiper && (
                <>
                    <button
                        type="button"
                        onClick={() => swiper.slidePrev()}
                        className="absolute right-1 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full shadow-md ring-1 ring-black/[0.04] transition dark:bg-[#1e293b] dark:ring-white/[0.08]"
                        style={{ background: "#ffffff", color: accent }}
                    >
                        <ChevronRight size={15} />
                    </button>
                    <button
                        type="button"
                        onClick={() => swiper.slideNext()}
                        className="absolute left-1 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full shadow-md ring-1 ring-black/[0.04] transition dark:bg-[#1e293b] dark:ring-white/[0.08]"
                        style={{ background: "#ffffff", color: accent }}
                    >
                        <ChevronLeft size={15} />
                    </button>
                </>
            )}
        </div>
    );
}