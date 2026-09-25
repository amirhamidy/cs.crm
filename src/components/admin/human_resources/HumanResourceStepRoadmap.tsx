"use client";

import { motion } from "framer-motion";
import { Check, GitBranch } from "lucide-react";
import { HumanResourceStep } from "./humanResourceApi";

interface Props {
    steps: HumanResourceStep[];
}

export default function HumanResourceStepRoadmap({
    steps,
}: Props) {
    const orderedSteps = [...steps].sort(
        (a, b) => a.order - b.order
    );

    if (!orderedSteps.length) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                    <GitBranch className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="font-medium">هنوز مرحله‌ای ثبت نشده است</p>
                <p className="mt-1 text-sm text-muted-foreground">
                    مراحل این منبع انسانی در این قسمت نمایش داده می‌شوند.
                </p>
            </div>
        );
    }

    return (
        <div className="relative mx-auto max-w-3xl py-4">
            <div className="absolute bottom-8 left-1/2 top-8 hidden w-px -translate-x-1/2 bg-border md:block" />

            <div className="space-y-8">
                {orderedSteps.map((step, index) => {
                    const isLeft = index % 2 === 0;
                    const isLast = index === orderedSteps.length - 1;

                    return (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.35,
                                delay: index * 0.07,
                            }}
                            className="relative flex items-center justify-center"
                        >
                            <div
                                className={`w-full md:w-[46%] ${isLeft
                                        ? "md:mr-auto md:text-right"
                                        : "md:ml-auto md:text-left"
                                    }`}
                            >
                                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                                    <div
                                        className={`mb-2 flex items-center gap-3 ${isLeft
                                                ? "md:flex-row"
                                                : "md:flex-row-reverse"
                                            }`}
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                                            {isLast ? (
                                                <Check className="h-5 w-5" />
                                            ) : (
                                                step.order
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-xs text-muted-foreground">
                                                مرحله {step.order}
                                            </p>
                                            <p className="font-semibold">
                                                {step.title}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute left-1/2 hidden h-4 w-4 -translate-x-1/2 rounded-full border-4 border-background bg-primary md:block" />
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}