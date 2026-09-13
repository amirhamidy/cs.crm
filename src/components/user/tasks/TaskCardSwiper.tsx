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

interface Props {
    tasks: UserTask[];
    accent: string;
    isLastStage: boolean;
    onUpdated: (task: UserTask) => void;
    employeesMap: Record<number, string>;
}

export default function TaskCardSwiper({ tasks, accent, isLastStage, onUpdated, employeesMap }: Props) {
    const [swiper, setSwiper] = useState<SwiperType | null>(null);

    return (
        <div className="relative px-1 pb-1 pt-1">
            <Swiper
                modules={[Pagination]}
                slidesPerView={1}
                spaceBetween={8}
                onSwiper={setSwiper}
                className="!pb-7 [&_.swiper-pagination]:!static [&_.swiper-pagination-bullet]:!h-1.5 [&_.swiper-pagination-bullet]:!w-1.5"
                style={{ "--swiper-pagination-color": accent, "--swiper-pagination-bullet-inactive-color": `${accent}35` } as React.CSSProperties}
                pagination={{ clickable: true }}
            >
                {tasks.map((task) => (
                    <SwiperSlide key={task.id}>
                        <UserTaskCard task={task} accent={accent} isLastStage={isLastStage} onUpdated={onUpdated} employeesMap={employeesMap} />
                    </SwiperSlide>
                ))}
            </Swiper>

            {tasks.length > 1 && swiper && (
                <>
                    <button type="button" onClick={() => swiper.slidePrev()} className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/[.05] dark:bg-[#1e293b] dark:ring-white/[.08]" style={{ color: accent }}>
                        <ChevronRight size={17} />
                    </button>
                    <button type="button" onClick={() => swiper.slideNext()} className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/[.05] dark:bg-[#1e293b] dark:ring-white/[.08]" style={{ color: accent }}>
                        <ChevronLeft size={17} />
                    </button>
                </>
            )}
        </div>
    );
}