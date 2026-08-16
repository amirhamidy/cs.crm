import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";

interface DirectoryEmployee {
    id: number | string;
    username?: string;
    full_name?: string;
}

interface PaginatedResponse<T> {
    results?: T[];
    next?: string | null;
}

async function fetchAllPages<T>(url: string): Promise<T[]> {
    const results: T[] = [];
    let nextUrl: string | null = url;

    while (nextUrl) {
        const res = await axiosInstance.get(nextUrl);
        const data = res.data as T[] | PaginatedResponse<T>;
        const items = Array.isArray(data) ? data : (data.results ?? []);
        results.push(...items);

        if (!Array.isArray(data) && data.next) {
            const parsed = new URL(data.next);
            nextUrl = parsed.pathname + parsed.search;
        } else {
            nextUrl = null;
        }
    }

    return results;
}

let directoryPromise: Promise<Map<string, DirectoryEmployee>> | null = null;

function loadDirectory() {
    if (!directoryPromise) {
        directoryPromise = fetchAllPages<DirectoryEmployee>(apiRoutes.employees)
            .then((list) => {
                const m = new Map<string, DirectoryEmployee>();
                list.forEach((emp) => {
                    if (emp.username) m.set(emp.username.trim().toLowerCase(), emp);
                });
                return m;
            })
            .catch((e) => {
                directoryPromise = null;
                throw e;
            });
    }
    return directoryPromise;
}

export function useEmployeeDirectory() {
    const [map, setMap] = useState<Map<string, DirectoryEmployee> | null>(null);

    useEffect(() => {
        let cancelled = false;
        loadDirectory()
            .then((m) => {
                if (!cancelled) setMap(m);
            })
            .catch(() => {
                if (!cancelled) setMap(new Map());
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const resolveName = (username?: string | null, fallback?: string | null) => {
        if (!username) return fallback ?? "نامشخص";
        const emp = map?.get(username.trim().toLowerCase());
        return emp?.full_name || fallback || username;
    };

    return { loading: map === null, resolveName };
}