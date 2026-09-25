"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Loader2,
    Plus,
    Search,
    Users,
} from "lucide-react";
import HumanResourceCard from "./HumanResourceCard";
import HumanResourceForm from "./HumanResourceForm";
import HumanResourceStepsModal from "./HumanResourceStepsModal";
import {
    Department,
    DepartmentEmployee,
    HumanResource,
    getDepartmentEmployees,
    getDepartments,
    getDocuments,
    getEmployees,
    getMe,
    deleteDocument,
} from "./humanResourceApi";

interface Props {
    canManage?: boolean;
}

export default function HumanResourcesPage({
    canManage = false,
}: Props) {
    const [documents, setDocuments] = useState<HumanResource[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [departmentEmployees, setDepartmentEmployees] =
        useState<DepartmentEmployee[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] =
        useState<HumanResource | null>(null);
    const [stepsDocument, setStepsDocument] =
        useState<HumanResource | null>(null);
    const [currentEmployeeId, setCurrentEmployeeId] =
        useState<number | null>(null);

    const load = async () => {
        try {
            setLoading(true);

            const [documentsResponse, departmentsResponse] =
                await Promise.all([
                    getDocuments(),
                    getDepartments(),
                ]);

            setDocuments(documentsResponse.data);
            setDepartments(departmentsResponse.data);

            if (!canManage) {
                const [
                    meResponse,
                    employeesResponse,
                    departmentEmployeesResponse,
                ] = await Promise.all([
                    getMe(),
                    getEmployees(),
                    getDepartmentEmployees(),
                ]);

                const employee = employeesResponse.data.find(
                    (item) =>
                        item.username === meResponse.data.username
                );

                setDepartmentEmployees(
                    departmentEmployeesResponse.data
                );
                setCurrentEmployeeId(employee?.id ?? null);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [canManage]);

    const currentDepartmentIds = useMemo(() => {
        if (!currentEmployeeId) return [];

        return departmentEmployees
            .filter(
                (item) => item.employee === currentEmployeeId
            )
            .map((item) => item.department);
    }, [currentEmployeeId, departmentEmployees]);

    const visibleDocuments = useMemo(() => {
        const filtered = canManage
            ? documents
            : documents.filter((document) => {
                const matchedDepartment = departments.find(
                    (department) =>
                        department.name === document.title
                );

                if (!matchedDepartment) return true;

                return currentDepartmentIds.includes(
                    matchedDepartment.id
                );
            });

        const query = search.trim().toLowerCase();

        if (!query) return filtered;

        return filtered.filter((document) =>
            document.title.toLowerCase().includes(query)
        );
    }, [
        canManage,
        documents,
        departments,
        currentDepartmentIds,
        search,
    ]);

    const handleDelete = async (
        document: HumanResource
    ) => {
        if (
            !confirm(
                `آیا از حذف «${document.title}» مطمئن هستید؟`
            )
        ) {
            return;
        }

        await deleteDocument(document.id);
        await load();
    };

    const handleEdit = (document: HumanResource) => {
        setEditing(document);
        setFormOpen(true);
    };

    const handleCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Users className="h-5 w-5" />
                        </div>

                        <div>
                            <h1 className="text-xl font-bold sm:text-2xl">
                                منابع انسانی
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                اطلاعات و فرآیندهای منابع انسانی
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                        <input
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            placeholder="جستجوی منابع انسانی..."
                            className="h-11 w-full rounded-xl border bg-background pr-10 pl-4 text-sm outline-none transition focus:border-primary sm:w-64"
                        />
                    </div>

                    {canManage && (
                        <button
                            onClick={handleCreate}
                            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                        >
                            <Plus className="h-4 w-4" />
                            ایجاد منبع انسانی
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : visibleDocuments.length === 0 ? (
                <div className="rounded-3xl border border-dashed p-12 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                        <Users className="h-7 w-7 text-muted-foreground" />
                    </div>

                    <h3 className="font-semibold">
                        منبع انسانی‌ای پیدا نشد
                    </h3>

                    <p className="mt-2 text-sm text-muted-foreground">
                        {search
                            ? "نتیجه‌ای مطابق جستجوی شما وجود ندارد."
                            : "هنوز منبع انسانی‌ای ثبت نشده است."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {visibleDocuments.map((document) => (
                        <HumanResourceCard
                            key={document.id}
                            document={document}
                            departments={departments}
                            canManage={canManage}
                            onEdit={() => handleEdit(document)}
                            onDelete={() => handleDelete(document)}
                            onSteps={() =>
                                setStepsDocument(document)
                            }
                            onChange={load}
                        />
                    ))}
                </div>
            )}

            {canManage && (
                <HumanResourceForm
                    open={formOpen}
                    document={editing}
                    departments={departments}
                    onClose={() => {
                        setFormOpen(false);
                        setEditing(null);
                    }}
                    onSaved={load}
                />
            )}

            <HumanResourceStepsModal
                open={!!stepsDocument}
                document={stepsDocument}
                canManage={canManage}
                onClose={() => setStepsDocument(null)}
                onChange={load}
            />
        </div>
    );
}