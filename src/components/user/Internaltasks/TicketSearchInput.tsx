"use client";

import SearchField from "@/components/ui/SearchField";

export default function TicketSearchInput({
    value,
    onChange,
    placeholder = "جستجو بر اساس عنوان، شماره یا نام فرد",
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    return <SearchField value={value} onChange={onChange} placeholder={placeholder} />;
}
