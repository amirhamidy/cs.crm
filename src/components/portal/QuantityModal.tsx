"use client";

import { useEffect, useState } from "react";
import { Loader, ShoppingCart } from "lucide-react";
import { m } from "framer-motion";
import { FloatingInput } from "@/components/ui/FloatingField";
import { ModalShell } from "@/components/ui/ModalShell";

interface QuantityModalProps {
    open: boolean;
    title: string;
    unitLabel: string;
    available: number;
    // Returns an error message, or null when the value was accepted
    onConfirm: (raw: string) => string | null;
    onClose: () => void;
}

export default function QuantityModal({
    open,
    title,
    unitLabel,
    available,
    onConfirm,
    onClose,
}: QuantityModalProps) {
    const [value, setValue] = useState("1");
    const [error, setError] = useState("");

    // Reset the form each time the modal opens
    useEffect(() => {
        if (open) {
            setValue("1");
            setError("");
        }
    }, [open]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const message = onConfirm(value);
        if (message) setError(message);
    };

    return (
        <ModalShell
            open={open}
            onClose={onClose}
            title={title}
            subtitle={`موجودی: ${available.toLocaleString("fa-IR")} ${unitLabel}`}
            icon={<ShoppingCart size={18} />}
            maxWidth="max-w-sm"
        >
            <form autoComplete="off" onSubmit={submit} className="flex flex-col gap-4">
                <FloatingInput
                    id="portal-quantity"
                    label="تعداد"
                    dir="ltr"
                    inputMode="decimal"
                    autoFocus
                    autoComplete="off"
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        setError("");
                    }}
                />
                {error && (
                    <p role="alert" className="text-[11.5px] text-red-500">
                        {error}
                    </p>
                )}
                <m.button
                    type="submit"
                    whileTap={{ scale: 0.97 }}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500"
                >
                    افزودن به سبد خرید
                </m.button>
            </form>
        </ModalShell>
    );
}
