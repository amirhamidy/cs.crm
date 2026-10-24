import { useEffect, useState } from "react";
import { accountsApi } from "@/lib/api";

interface DirectoryEmployee {
    id: number | string;
    username?: string;
    full_name?: string;
}

async function loadDirectory() {
    const list = await accountsApi.employees.all();
    const m = new Map<string, DirectoryEmployee>();
    list.forEach((emp) => {
        if (emp.username) m.set(emp.username.trim().toLowerCase(), emp);
    });
    return m;
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
