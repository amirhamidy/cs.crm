"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import type { ReactNode } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { listAll } from "@/lib/api";
import {
    parseBackendError,
    type EmployeeItem,
    type Machine,
    type Option,
    type ProductionLog,
} from "@/components/admin/production/shared";

export type DataKey = "machines" | "employees";

const ENDPOINTS: Record<DataKey, string> = {
    machines: "/production/api/v1/machine/",
    employees: "/accounts/api/v1/employee/list/",
};

interface ProductionContextValue {
    machines: Machine[];
    employees: EmployeeItem[];
    loaded: Record<DataKey, boolean>;
    refreshVersion: number;
    pageError: string;
    setPageError: (v: string) => void;
    togglingId: number | null;
    machineModal: { open: boolean; machine: Machine | null };
    setMachineModal: (v: { open: boolean; machine: Machine | null }) => void;
    showLogModal: boolean;
    setShowLogModal: (v: boolean) => void;
    logToDelete: ProductionLog | null;
    setLogToDelete: (v: ProductionLog | null) => void;
    logToEdit: ProductionLog | null;
    setLogToEdit: (v: ProductionLog | null) => void;
    logToView: ProductionLog | null;
    setLogToView: (v: ProductionLog | null) => void;
    ensure: (keys: DataKey[]) => void;
    refresh: () => Promise<void>;
    handleToggleActive: (m: Machine) => Promise<void>;
    handleDeleteMachine: (m: Machine) => Promise<void>;
}

const Ctx = createContext<ProductionContextValue | null>(null);

export function ProductionProvider({ children }: { children: ReactNode }) {
    const [machines, setMachines] = useState<Machine[]>([]);
    const [employees, setEmployees] = useState<EmployeeItem[]>([]);
    const [loaded, setLoaded] = useState<Record<DataKey, boolean>>({
        machines: false,
        employees: false,
    });
    const requested = useRef<Set<DataKey>>(new Set());

    const [pageError, setPageError] = useState("");
    const [refreshVersion, setRefreshVersion] = useState(0);
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [machineModal, setMachineModal] = useState<{ open: boolean; machine: Machine | null }>({
        open: false,
        machine: null,
    });
    const [showLogModal, setShowLogModal] = useState(false);
    const [logToDelete, setLogToDelete] = useState<ProductionLog | null>(null);
    const [logToEdit, setLogToEdit] = useState<ProductionLog | null>(null);
    const [logToView, setLogToView] = useState<ProductionLog | null>(null);

    const loadKey = useCallback(async (key: DataKey) => {
        try {
            if (key === "machines") {
                setMachines(await listAll<Machine>(ENDPOINTS[key]));
            } else {
                setEmployees(await listAll<EmployeeItem>(ENDPOINTS[key]));
            }
        } catch (err) {
            setPageError(parseBackendError(err, "دریافت اطلاعات تولید با خطا مواجه شد"));
        } finally {
            setLoaded((prev) => ({ ...prev, [key]: true }));
        }
    }, []);

    const ensure = useCallback(
        (keys: DataKey[]) => {
            keys.forEach((key) => {
                if (requested.current.has(key)) return;
                requested.current.add(key);
                loadKey(key);
            });
        },
        [loadKey]
    );

    const refresh = useCallback(async () => {
        setRefreshVersion((version) => version + 1);
        await Promise.all(Array.from(requested.current).map((k) => loadKey(k)));
    }, [loadKey]);

    const handleToggleActive = useCallback(
        async (m: Machine) => {
            if (togglingId !== null) return;
            setTogglingId(m.id);
            setPageError("");
            try {
                await axiosInstance.patch(`/production/api/v1/machine/${m.id}/update/`, {
                    is_active: !m.is_active,
                });
                setMachines((prev) =>
                    prev.map((item) => (item.id === m.id ? { ...item, is_active: !m.is_active } : item))
                );
            } catch (err) {
                setPageError(parseBackendError(err, "خطا در تغییر وضعیت ماشین"));
            } finally {
                setTogglingId(null);
            }
        },
        [togglingId]
    );

    const handleDeleteMachine = useCallback(
        async (m: Machine) => {
            setPageError("");
            try {
                await axiosInstance.delete(`/production/api/v1/machine/${m.id}/delete/`);
                await loadKey("machines");
            } catch (err) {
                setPageError(
                    parseBackendError(
                        err,
                        `حذف ماشین «${m.name}» ممکن نیست. اگر این ماشین سابقه تولید دارد، به‌جای حذف، آن را غیرفعال کنید.`
                    )
                );
            }
        },
        [loadKey]
    );

    const value: ProductionContextValue = {
        machines,
        employees,
        loaded,
        refreshVersion,
        pageError,
        setPageError,
        togglingId,
        machineModal,
        setMachineModal,
        showLogModal,
        setShowLogModal,
        logToDelete,
        setLogToDelete,
        logToEdit,
        setLogToEdit,
        logToView,
        setLogToView,
        ensure,
        refresh,
        handleToggleActive,
        handleDeleteMachine,
    };

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProductionContext() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("useProductionContext must be used inside ProductionProvider");
    return ctx;
}

/** Each page declares which datasets it needs; only those are fetched (once, then shared). */
export function useProductionData(needs: DataKey[]) {
    const ctx = useProductionContext();
    const { ensure, loaded, employees, machines } = ctx;
    const key = needs.join(",");

    useEffect(() => {
        ensure(needs);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, ensure]);

    const loading = needs.some((n) => !loaded[n]);

    const employeeOptions = useMemo<Option[]>(
        () =>
            employees.map((e) => ({
                id: e.id,
                label: e.full_name || e.username,
                sub: `@${e.username}`,
            })),
        [employees]
    );

    const machineOptions = useMemo<Option[]>(
        () =>
            machines.map((m) => ({
                id: m.id,
                label: m.name,
                sub: `کد: ${m.code}${m.is_active ? "" : " (غیرفعال)"}`,
            })),
        [machines]
    );

    return { ...ctx, loading, employeeOptions, machineOptions };
}
