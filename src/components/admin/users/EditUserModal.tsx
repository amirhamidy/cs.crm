"use client";

import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { accountsApi } from "@/lib/api";
import type { ApiEmployee, ApiUser } from "@/types/users";
import { Modal } from "@/components/ui/Modal";
import { FloatingInput } from "@/components/ui/FloatingField";
import { Button } from "@/components/ui/Button";

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: ApiEmployee;
    onUpdated: (updatedEmployee: ApiEmployee) => void;
}

function getErrorMessage(err: unknown, fallback: string) {
    const error = err as { response?: { data?: Record<string, unknown> } };
    const data = error.response?.data;
    if (!data) return fallback;
    const keys = ["detail", "phone_number", "full_name", "user", "username", "message", "error", "non_field_errors"];
    for (const key of keys) {
        const val = data[key];
        if (typeof val === "string") return val;
        if (Array.isArray(val) && typeof val[0] === "string") return val[0];
    }
    return fallback;
}

export default function EditUserModal({
    isOpen,
    onClose,
    employee,
    onUpdated,
}: EditUserModalProps) {
    const [fullName, setFullName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [matchedUser, setMatchedUser] = useState<ApiUser | null>(null);
    const [fetchingUser, setFetchingUser] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;

        setFullName(employee.full_name || "");
        setPhoneNumber("");
        setError("");
        setMatchedUser(null);

        let mounted = true;
        setFetchingUser(true);

        const fetchUserData = async () => {
            try {
                const users = await accountsApi.users.lookup(employee.username?.trim() ?? "");
                if (!mounted) return;

                const targetUsername = employee.username?.trim().toLowerCase();
                const found = users.find(
                    (u) => u.username?.trim().toLowerCase() === targetUsername
                );

                if (found) {
                    setMatchedUser(found);
                    setPhoneNumber(found.phone_number || "");
                }
            } catch {
                if (mounted) {
                    setError("خطا در دریافت اطلاعات کاربر");
                }
            } finally {
                if (mounted) {
                    setFetchingUser(false);
                }
            }
        };

        fetchUserData();

        return () => {
            mounted = false;
        };
    }, [isOpen, employee]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!fullName.trim()) {
            setError("نام و نام خانوادگی الزامی است");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const employeePayload: Record<string, unknown> = {
                full_name: fullName.trim(),
            };
            if ("user" in employee && employee.user !== undefined) {
                employeePayload.user = employee.user;
            }

            const employeePromise = accountsApi.employees.update(employee.id, employeePayload);

            let userPromise: Promise<unknown> = Promise.resolve();

            if (matchedUser?.id) {
                const userPayload = {
                    username: matchedUser.username,
                    phone_number: phoneNumber.trim(),
                    type: matchedUser.type,
                    is_active: matchedUser.is_active,
                };
                userPromise = accountsApi.users.update(matchedUser.id, userPayload);
            }

            const [updatedData] = await Promise.all([employeePromise, userPromise]);

            onUpdated({
                ...employee,
                ...updatedData,
                full_name: updatedData?.full_name ?? fullName.trim(),
            });
            onClose();
        } catch (err) {
            setError(getErrorMessage(err, "خطا در ویرایش اطلاعات"));
        } finally {
            setLoading(false);
        }
    }

    const busy = loading || fetchingUser;

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            busy={busy}
            title="ویرایش کارمند"
            subtitle="ویرایش نام و شماره موبایل"
            icon={<User size={18} />}
            maxWidth="max-w-sm"
        >
            <form
                onSubmit={handleSubmit}
                autoComplete="off"
                className="flex flex-col gap-6"
            >
                <FloatingInput
                    label="نام و نام خانوادگی"
                    id="edit_full_name"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                        setFullName(e.target.value);
                        setError("");
                    }}
                    dir="rtl"
                />

                <FloatingInput
                    label="شماره موبایل"
                    id="edit_phone_number"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        setError("");
                    }}
                    dir="ltr"
                    autoComplete="new-password"
                />

                {error && (
                    <p
                        role="alert"
                        className="-mt-2 text-center text-[11.5px] font-bold text-red-500"
                    >
                        {error}
                    </p>
                )}

                <Button
                    type="submit"
                    variant="primary"
                    disabled={busy}
                    loading={busy}
                    fullWidth
                    className="rounded-full py-3"
                >
                    ذخیره تغییرات
                </Button>
            </form>
        </Modal>
    );
}
