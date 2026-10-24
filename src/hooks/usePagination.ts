import { useEffect, useMemo, useState } from "react";

export function usePagination<T>(items: T[], pageSize: number, resetKey = "") {
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

    useEffect(() => {
        setPage(1);
    }, [resetKey]);

    const current = Math.min(page, totalPages);

    const pageItems = useMemo(
        () => items.slice((current - 1) * pageSize, current * pageSize),
        [items, current, pageSize]
    );

    return { page: current, setPage, totalPages, pageItems };
}
