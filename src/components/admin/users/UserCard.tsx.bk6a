"use client";

import {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { AnimatePresence } from "framer-motion";
import {
    AlertCircle,
    CalendarDays,
    Camera,
    Crown,
    KeyRound,
    MoreVertical,
    Phone,
    ShieldCheck,
    SlidersHorizontal,
    SquarePen,
    Star,
    Trash2,
} from "lucide-react";
import { accountsApi } from "@/lib/api";
import type { ApiEmployee } from "@/types/users";
import EditUserModal from "./EditUserModal";
import AdjustScoreModal from "./AdjustScoreModal";
import AvatarUploadModal from "./AvatarUploadModal";
import SetPasswordModal from "./SetPasswordModal";
import UserAvatar from "@/components/ui/UserAvatar";
import { useAuthStore } from "@/store/authStore";
import { useAvatarStore } from "@/store/avatarStore";
import { apiMessage } from "@/lib/apiMessage";
import { ActionButton } from "./ActionButton";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { DepartmentManagerModal } from "./DepartmentManagerModal";
import { MobileSheet } from "./MobileSheet";
import { StatusSwitch } from "./StatusSwitch";
import {
    EMPTY_TITLES,
    formatDate,
    getErrorMessage,
    useLoggedUserId,
    useMountedOnce,
    type ActionKey,
    type Placement,
    type UserCardProps,
} from "./userCardUtils";

export type { UserInfo, UserCardProps } from "./userCardUtils";

function UserCard({
    employee,
    departmentName = null,
    activeTaskTitles = EMPTY_TITLES,
    hasActiveTasks = false,
    userInfo = null,
    score = null,
    onDelete,
    onUpdated,
    onScoreChanged,
}: UserCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const aliveRef = useRef(true);

    useEffect(() => {
        aliveRef.current = true;
        return () => {
            aliveRef.current = false;
        };
    }, []);

    const [placement, setPlacement] = useState<Placement>("right");

    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [showEdit, setShowEdit] = useState(false);
    const [showAdjust, setShowAdjust] = useState(false);
    const [showManager, setShowManager] = useState(false);
    const [showMobileSheet, setShowMobileSheet] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const loggedUserType = useAuthStore((state) => state.userType);
    const setMyAvatar = useAvatarStore((state) => state.setMyAvatar);
    const canManageProfile = loggedUserType === 1;

    const editMounted = useMountedOnce(showEdit);

    const phoneNumber = userInfo?.phone ?? null;
    const userId = userInfo?.id ?? employee.user_id ?? employee.user ?? null;

    const [isActive, setIsActive] = useState<boolean>(
        userInfo?.isActive ??
        (employee as unknown as { is_active?: boolean }).is_active ??
        true
    );
    const [togglingActive, setTogglingActive] = useState(false);

    useEffect(() => {
        if (typeof userInfo?.isActive === "boolean") setIsActive(userInfo.isActive);
    }, [userInfo?.isActive]);

    const isRight = placement === "right";

    const checkPosition = useCallback(() => {
        const card = cardRef.current;
        const parent = card?.parentElement;
        if (!card || !parent) return;

        const cardRect = card.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();

        const spaceRight = parentRect.right - cardRect.right;
        const spaceLeft = cardRect.left - parentRect.left;

        setPlacement(spaceRight >= spaceLeft ? "right" : "left");
    }, []);

    const loggedUserId = useLoggedUserId();
    const isSelf = userId !== null && loggedUserId !== null && loggedUserId === userId;

    const isAdmin = employee.type === 1;
    const canDelete = !isAdmin && !isSelf && !hasActiveTasks;

    const deleteTooltipText = useMemo(() => {
        if (isAdmin) return "امکان حذف مدیر سیستم وجود ندارد";
        if (isSelf) return "شما نمی‌توانید حساب خود را حذف کنید";
        if (hasActiveTasks) return "این کاربر دارای تسک فعال است";
        return "حذف کاربر";
    }, [isAdmin, isSelf, hasActiveTasks]);

    const formattedDate = useMemo(
        () => formatDate(employee.created_at),
        [employee.created_at]
    );

    const handleToggleActive = useCallback(async () => {
        if (togglingActive || !userId || isSelf) return;

        const nextState = !isActive;
        setTogglingActive(true);

        try {
            await accountsApi.users.update(userId, {
                username: employee.username,
                phone_number: phoneNumber || "",
                type: employee.type ?? 2,
                is_active: nextState,
            });

            if (aliveRef.current) setIsActive(nextState);
            onUpdated({
                ...employee,
                is_active: nextState,
            } as ApiEmployee);
        } catch (err) {
            console.error("خطا در تغییر وضعیت حساب:", err);
        } finally {
            if (aliveRef.current) setTogglingActive(false);
        }
    }, [togglingActive, userId, isSelf, isActive, employee, phoneNumber, onUpdated]);

    const handleDelete = useCallback(async () => {
        if (!canDelete) return;
        setIsDeleting(true);
        setDeleteError("");

        try {
            const normalizedUsername = (employee.username || "").trim().toLowerCase();

            const [users, matchedEmployee] = await Promise.all([
                accountsApi.users.lookup(normalizedUsername).catch(() => []),
                accountsApi.employees.get(employee.id).catch(() => null),
            ]);

            const matchedUser = users.find(
                (user) => user.username?.trim().toLowerCase() === normalizedUsername
            );

            const employeeDeleteId = matchedEmployee?.id;
            const userDeleteId = matchedUser?.id;

            if (!employeeDeleteId && !userDeleteId) {
                throw new Error("شناسه حذف کاربر پیدا نشد");
            }

            if (employeeDeleteId) {
                await accountsApi.employees.remove(employeeDeleteId);
            }

            if (userDeleteId && matchedUser?.type !== 1) {
                await accountsApi.users.remove(userDeleteId);
            }

            onDelete(employee.id);
            if (aliveRef.current) setShowConfirm(false);
        } catch (err) {
            if (aliveRef.current) {
                setDeleteError(getErrorMessage(err, "حذف کاربر با خطا مواجه شد"));
            }
        } finally {
            if (aliveRef.current) setIsDeleting(false);
        }
    }, [canDelete, employee.id, employee.username, onDelete]);

    const closeSheetThen = useCallback((fn: () => void) => {
        setShowMobileSheet(false);
        fn();
    }, []);

    const actions: {
        key: ActionKey;
        tooltip: string;
        disabled: boolean;
        icon: ReactNode;
        onClick: () => void;
    }[] = [
            {
                key: "toggleActive",
                tooltip: isSelf
                    ? "امکان تغییر وضعیت حساب خود وجود ندارد"
                    : isActive
                        ? "غیرفعال‌سازی کاربر"
                        : "فعال‌سازی کاربر",
                disabled: isSelf,
                icon: null,
                onClick: handleToggleActive,
            },
            {
                key: "edit",
                tooltip: "ویرایش اطلاعات",
                disabled: false,
                icon: <SquarePen size={16} />,
                onClick: () => setShowEdit(true),
            },
            {
                key: "adjustScore",
                tooltip: isAdmin ? "امتیاز مدیر سیستم قابل تغییر نیست" : "تغییر امتیاز",
                disabled: isAdmin,
                icon: <SlidersHorizontal size={16} />,
                onClick: () => setShowAdjust(true),
            },
            {
                key: "manager",
                tooltip: "تعیین مدیر دپارتمان",
                disabled: false,
                icon: <Crown size={16} />,
                onClick: () => setShowManager(true),
            },
            ...(canManageProfile ? [
                {
                    key: "password" as const,
                    tooltip: userId == null ? "شناسه کاربر در دسترس نیست" : "تغییر رمز عبور",
                    disabled: userId == null,
                    icon: <KeyRound size={16} />,
                    onClick: () => setShowPasswordModal(true),
                },
                {
                    key: "avatar" as const,
                    tooltip: userId == null ? "شناسه کاربر در دسترس نیست" : "تغییر عکس پروفایل",
                    disabled: userId == null,
                    icon: <Camera size={16} />,
                    onClick: () => setShowAvatarModal(true),
                },
            ] : []),
            {
                key: "delete",
                tooltip: deleteTooltipText,
                disabled: !canDelete,
                icon: <Trash2 size={16} />,
                onClick: () => setShowConfirm(true),
            },
        ];

    const tooltipPositionClass = isRight
        ? "left-full top-1/2 ml-2.5 -translate-y-1/2"
        : "right-full top-1/2 mr-2.5 -translate-y-1/2";

    return (
        <>
            <div
                ref={cardRef}
                onMouseEnter={checkPosition}
                dir="rtl"
                className="user-card group/card relative z-[1] flex flex-col gap-3 rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 transition-shadow duration-200 hover:z-50 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.35),0_14px_40px_rgba(99,102,241,0.25)] focus-within:z-50 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:shadow-[0_0_0_1px_rgba(129,140,248,0.45),0_14px_44px_rgba(99,102,241,0.35)]"
            >

                <div
                    className={`peer pointer-events-none absolute top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-2.5 opacity-0 transition-opacity duration-150 group-focus-within/card:pointer-events-auto group-focus-within/card:opacity-100 group-hover/card:pointer-events-auto group-hover/card:opacity-100 md:flex ${isRight ? "-right-[59px] pl-6" : "-left-[59px] pr-6"
                        }`}
                >
                    {actions.map((act) => (
                        <div
                            key={act.key}
                            className="group/btn relative flex items-center justify-center"
                        >
                            {act.key === "toggleActive" ? (
                                <StatusSwitch
                                    isActive={isActive}
                                    loading={togglingActive}
                                    disabled={isSelf}
                                    onToggle={handleToggleActive}
                                />
                            ) : (
                                <ActionButton
                                    sweepKey={act.key}
                                    icon={act.icon}
                                    label={act.tooltip}
                                    disabled={act.disabled}
                                    onClick={act.onClick}
                                />
                            )}

                            <span
                                role="tooltip"
                                dir="rtl"
                                className={`pointer-events-none absolute z-[60] whitespace-nowrap rounded-2xl border border-white/[0.08] bg-gray-800 px-3 py-2 text-center text-[11px] font-bold text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover/btn:opacity-100 dark:bg-gray-900 ${tooltipPositionClass}`}
                            >
                                {act.tooltip}
                            </span>
                        </div>
                    ))}
                </div>


                {hasActiveTasks && (
                    <div
                        className={`pointer-events-none absolute top-1/2 z-[70] hidden -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover/card:opacity-100 peer-hover:!opacity-0 md:block ${isRight ? "left-full ml-[70px]" : "right-full mr-[70px]"
                            }`}
                    >
                        <div
                            dir="rtl"
                            className="w-56 rounded-2xl border border-white/[0.08] bg-gray-800 p-3 shadow-xl dark:bg-gray-900"
                        >
                            <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5 text-[11px] font-bold text-rose-400">
                                <AlertCircle size={13} />
                                <span>لیست تسک‌های در حال انجام</span>
                            </div>
                            {activeTaskTitles.length > 0 ? (
                                <ul className="mt-2 space-y-1.5">
                                    {activeTaskTitles.map((title, idx) => (
                                        <li
                                            key={`${title}-${idx}`}
                                            className="flex items-start gap-1.5 text-[10.5px] leading-4 text-gray-300"
                                        >
                                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-400" />
                                            <span className="line-clamp-2 min-w-0 break-words">
                                                {title}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-1.5 text-[10px] text-gray-400">
                                    این کاربر تسک دارد ولی هیچ‌کدام در حال انجام نیست
                                </p>
                            )}
                        </div>
                    </div>
                )}


                <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMobileSheet(true);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-gray-500 transition-transform active:scale-95 dark:bg-white/10 dark:text-gray-300 md:hidden"
                        aria-label="گزینه‌ها"
                    >
                        <MoreVertical size={15} />
                    </button>

                    {score !== null && (
                        <div
                            className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:border-amber-500/25 dark:bg-amber-500/[0.14] dark:text-amber-400"
                            title="امتیاز عملکرد"
                        >
                            <Star size={12} fill="currentColor" />
                            <span>{score}</span>
                        </div>
                    )}
                </div>


                <div className="flex items-center gap-3 pt-1">
                    <UserAvatar src={employee.avatar} name={employee.full_name || "؟"} id={employee.id} />
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="truncate text-[13.5px] font-bold leading-tight text-gray-800 dark:text-gray-100">
                            {employee.full_name || "بدون نام"}
                        </p>
                        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                            @{employee.username}
                        </p>
                    </div>
                </div>


                <div className="flex flex-col gap-2 border-t border-black/5 pt-2.5 dark:border-white/5">
                    {phoneNumber && (
                        <div className="flex items-center gap-2 text-[11.5px] text-gray-400 dark:text-gray-500">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span dir="ltr">{phoneNumber}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-[11.5px] text-gray-400 dark:text-gray-500">
                        <div className="flex min-w-0 items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                                {isAdmin ? "ادمین سیستم" : "کارمند"}
                                {departmentName ? ` • ${departmentName}` : ""}
                            </span>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span>{formattedDate}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span
                            className={`rounded-lg border bg-gradient-to-br px-2 py-0.5 text-[10.5px] font-bold ${isAdmin
                                ? "border-amber-500/25 from-amber-500/[0.18] to-amber-600/[0.18] text-amber-600 dark:text-amber-400"
                                : "border-indigo-500/25 from-indigo-500/[0.18] to-violet-500/[0.18] text-indigo-500 dark:text-indigo-300"
                                }`}
                        >
                            {isAdmin ? "مدیر کل" : "کاربر سامانه"}
                        </span>

                        {hasActiveTasks && (
                            <span className="rounded-lg border border-rose-500/25 bg-rose-50 px-2 py-0.5 text-[10.5px] font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                                {activeTaskTitles.length > 0
                                    ? `${activeTaskTitles.length} تسک فعال`
                                    : "دارای تسک"}
                            </span>
                        )}
                    </div>
                </div>
            </div>


            <AnimatePresence>
                {showMobileSheet && (
                    <MobileSheet
                        key="mobile-sheet"
                        employee={employee}
                        departmentName={departmentName}
                        isActive={isActive}
                        togglingActive={togglingActive}
                        isSelf={isSelf}
                        isAdmin={isAdmin}
                        canDelete={canDelete}
                        deleteTooltipText={deleteTooltipText}
                        onClose={() => setShowMobileSheet(false)}
                        onToggleActive={handleToggleActive}
                        onEdit={() => closeSheetThen(() => setShowEdit(true))}
                        onAdjust={() => {
                            if (!isAdmin) closeSheetThen(() => setShowAdjust(true));
                        }}
                        onManager={() => closeSheetThen(() => setShowManager(true))}
                        onRequestDelete={() => {
                            if (canDelete) closeSheetThen(() => setShowConfirm(true));
                        }}
                        canManageProfile={canManageProfile}
                        userId={userId}
                        onPassword={() => closeSheetThen(() => setShowPasswordModal(true))}
                        onAvatar={() => closeSheetThen(() => setShowAvatarModal(true))}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showConfirm && (
                    <ConfirmDeleteDialog
                        key="confirm-delete"
                        name={employee.full_name || employee.username}
                        isDeleting={isDeleting}
                        error={deleteError}
                        onCancel={() => setShowConfirm(false)}
                        onConfirm={handleDelete}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showManager && (
                    <DepartmentManagerModal
                        key={`manager-modal-${employee.id}`}
                        employeeId={employee.id}
                        employeeName={employee.full_name || employee.username}
                        onClose={() => setShowManager(false)}
                    />
                )}
            </AnimatePresence>


            {editMounted && (
                <EditUserModal
                    isOpen={showEdit}
                    onClose={() => setShowEdit(false)}
                    employee={employee}
                    onUpdated={(updatedEmployee: ApiEmployee) => {
                        onUpdated(updatedEmployee);
                        setShowEdit(false);
                    }}
                />
            )}


            {userId != null && (
                <SetPasswordModal open={showPasswordModal} userId={userId} userName={employee.full_name || employee.username} onClose={() => setShowPasswordModal(false)} />
            )}
            {showAvatarModal && userId != null && (
                <AvatarUploadModal
                    open={showAvatarModal}
                    onClose={() => setShowAvatarModal(false)}
                    userId={userId}
                    userName={employee.full_name || employee.username}
                    current={employee.avatar}
                    onUpload={async (file) => {
                        try {
                            const avatar = await accountsApi.users.uploadAvatar(userId, file);
                            onUpdated({ ...employee, avatar });
                            if (isSelf) setMyAvatar(avatar);
                            else setMyAvatar(useAvatarStore.getState().myAvatar);
                        } catch (error) { throw new Error(apiMessage(error, "آپلود عکس انجام نشد")); }
                    }}
                    onRemove={async () => {
                        try {
                            await accountsApi.users.removeAvatar(userId);
                            onUpdated({ ...employee, avatar: null });
                            if (isSelf) setMyAvatar(null);
                            else setMyAvatar(useAvatarStore.getState().myAvatar);
                        } catch (error) { throw new Error(apiMessage(error, "حذف عکس انجام نشد")); }
                    }}
                />
            )}
            <AdjustScoreModal
                isOpen={showAdjust}
                employeeId={employee.id}
                employeeName={employee.full_name || employee.username}
                currentScore={score}
                onClose={() => setShowAdjust(false)}
                onSuccess={(action, amount) =>
                    onScoreChanged?.(employee.id, action, amount)
                }
            />
        </>
    );
}

export default memo(UserCard);
