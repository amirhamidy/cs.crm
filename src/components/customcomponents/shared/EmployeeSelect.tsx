"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
    Briefcase,
    Check,
    CheckCircle2,
    ChevronDown,
    Loader2,
    Search,
    User2,
    X,
} from "lucide-react"
import { useTheme } from "next-themes"
import type { Employee } from "@/types/employee"

interface EmployeeSelectProps {
    employees: Employee[]
    value: string
    onChange: (value: string) => void
    disabled?: boolean
    label?: string
}

const AVATAR_GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#3b82f6", "#6366f1"],
    ["#8b5cf6", "#ec4899"],
    ["#06b6d4", "#6366f1"],
    ["#f59e0b", "#ef4444"],
]

function getEmployeeName(employee: Employee) {
    const detail = employee.user_detail

    const fullName =
        employee.full_name ||
        detail?.full_name ||
        [
            employee.first_name,
            employee.last_name,
            detail?.first_name,
            detail?.last_name,
        ]
            .filter(Boolean)
            .join(" ")

    return fullName || `کارمند ${employee.id}`
}

function getEmployeeRole(employee: Employee) {
    const departmentName =
        typeof employee.department === "object" && employee.department
            ? employee.department.name
            : undefined

    return (
        employee.role ||
        employee.position ||
        departmentName ||
        "کارمند سیستم"
    )
}

function getEmployeeId(employee: Employee) {
    return String(employee.employee ?? employee.id)
}

export default function EmployeeSelect({
    employees,
    value,
    onChange,
    disabled,
    label = "مسئول تسک",
}: EmployeeSelectProps) {
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === "dark"

    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [hovered, setHovered] = useState<string | null>(null)

    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false)
            }
        }

        window.addEventListener("mousedown", handleClick)

        return () => {
            window.removeEventListener("mousedown", handleClick)
        }
    }, [])

    const filteredEmployees = useMemo(() => {
        const normalized = search.trim().toLowerCase()

        return employees.filter((employee) => {
            const name = getEmployeeName(employee).toLowerCase()
            const role = getEmployeeRole(employee).toLowerCase()

            return (
                name.includes(normalized) ||
                role.includes(normalized)
            )
        })
    }, [employees, search])

    const selectedEmployee = employees.find(
        (employee) => getEmployeeId(employee) === value
    )

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((prev) => !prev)}
                className="relative flex w-full items-center justify-between rounded-[1.8rem] border px-5 py-3.5 transition-all duration-200 disabled:opacity-50"
                style={{
                    background: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                    borderColor: open
                        ? "#6366f1"
                        : isDark
                            ? "rgba(255,255,255,0.07)"
                            : "rgba(0,0,0,0.07)",
                    boxShadow: open
                        ? isDark
                            ? "0 0 0 4px rgba(99,102,241,0.12)"
                            : "0 0 0 4px rgba(99,102,241,0.08)"
                        : "none",
                }}
            >
                <div className="absolute -top-2 right-4 rounded-lg px-1.5 text-[10px] font-bold"
                    style={{
                        background: isDark ? "#0f172a" : "#ffffff",
                        color: isDark ? "#64748b" : "#94a3b8",
                    }}
                >
                    {label}
                </div>

                <div className="flex min-w-0 items-center gap-3">
                    {selectedEmployee ? (
                        <>
                            <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold text-white"
                                style={{
                                    background: `linear-gradient(135deg, ${AVATAR_GRADIENTS[
                                        Number(getEmployeeId(selectedEmployee)) %
                                        AVATAR_GRADIENTS.length
                                        ][0]
                                        }, ${AVATAR_GRADIENTS[
                                        Number(getEmployeeId(selectedEmployee)) %
                                        AVATAR_GRADIENTS.length
                                        ][1]
                                        })`,
                                }}
                            >
                                {getEmployeeName(selectedEmployee).charAt(0)}
                            </div>

                            <div className="min-w-0 text-right">
                                <p className="truncate text-[12.5px] font-extrabold text-gray-800 dark:text-gray-100">
                                    {getEmployeeName(selectedEmployee)}
                                </p>

                                <p className="truncate text-[11px] text-gray-400 dark:text-gray-500">
                                    {getEmployeeRole(selectedEmployee)}
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div
                                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                                style={{
                                    background: isDark
                                        ? "rgba(99,102,241,0.12)"
                                        : "rgba(99,102,241,0.08)",
                                }}
                            >
                                <User2
                                    size={17}
                                    className="text-indigo-500"
                                />
                            </div>

                            <span className="text-[12.5px] font-bold text-gray-400 dark:text-gray-500">
                                انتخاب کارمند
                            </span>
                        </>
                    )}
                </div>

                <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown
                        size={16}
                        className="text-gray-400"
                    />
                </motion.div>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.97 }}
                        transition={{ duration: 0.18 }}
                        className="absolute z-50 mt-3 w-full overflow-hidden rounded-[2rem] border"
                        style={{
                            background: isDark ? "#0f172a" : "#ffffff",
                            borderColor: isDark
                                ? "rgba(255,255,255,0.07)"
                                : "rgba(0,0,0,0.07)",
                            boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
                        }}
                    >
                        <div
                            className="border-b p-4"
                            style={{
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(0,0,0,0.06)",
                            }}
                        >
                            <div className="relative">
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder=" "
                                    className="peer w-full rounded-3xl border bg-transparent py-3 pl-12 pr-5 text-[12.5px] text-gray-800 outline-none transition-colors focus:border-indigo-500 dark:text-white"
                                    style={{
                                        borderColor: isDark
                                            ? "rgba(255,255,255,0.07)"
                                            : "rgba(0,0,0,0.07)",
                                    }}
                                />

                                <label
                                    className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 rounded px-1 text-[12px] text-gray-400 transition-all duration-200 peer-focus:top-0 peer-focus:text-[10px] peer-focus:text-indigo-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-[10px]"
                                    style={{
                                        background: isDark ? "#0f172a" : "#ffffff",
                                    }}
                                >
                                    جستجوی کارمند
                                </label>

                                <Search
                                    size={15}
                                    className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                            </div>
                        </div>

                        <div className="max-h-[320px] overflow-y-auto p-3">
                            <div className="flex flex-col gap-2">
                                {filteredEmployees.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center gap-2 py-10">
                                        <div
                                            className="flex h-12 w-12 items-center justify-center rounded-2xl"
                                            style={{
                                                background: isDark
                                                    ? "rgba(255,255,255,0.04)"
                                                    : "rgba(0,0,0,0.04)",
                                            }}
                                        >
                                            <Search
                                                size={18}
                                                className="text-gray-400"
                                            />
                                        </div>

                                        <p className="text-[12px] text-gray-400 dark:text-gray-500">
                                            کارمندی پیدا نشد
                                        </p>
                                    </div>
                                ) : (
                                    filteredEmployees.map((employee, index) => {
                                        const employeeId = getEmployeeId(employee)
                                        const isSelected = employeeId === value

                                        const gradient =
                                            AVATAR_GRADIENTS[
                                            Number(employeeId) % AVATAR_GRADIENTS.length
                                            ]

                                        return (
                                            <motion.button
                                                key={employeeId}
                                                type="button"
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    duration: 0.18,
                                                    delay: index * 0.03,
                                                }}
                                                onHoverStart={() => setHovered(employeeId)}
                                                onHoverEnd={() => setHovered(null)}
                                                onClick={() => {
                                                    onChange(employeeId)
                                                    setOpen(false)
                                                }}
                                                className="relative overflow-hidden rounded-[1.6rem] border p-3 text-right transition-all duration-200"
                                                style={{
                                                    background: isSelected
                                                        ? isDark
                                                            ? "rgba(99,102,241,0.12)"
                                                            : "rgba(99,102,241,0.07)"
                                                        : isDark
                                                            ? "rgba(255,255,255,0.025)"
                                                            : "#fafafa",
                                                    borderColor: isSelected
                                                        ? "#6366f1"
                                                        : isDark
                                                            ? "rgba(255,255,255,0.06)"
                                                            : "rgba(0,0,0,0.06)",
                                                }}
                                            >
                                                <svg
                                                    className="pointer-events-none absolute inset-0 h-full w-full"
                                                    style={{ borderRadius: "1.6rem" }}
                                                >
                                                    <defs>
                                                        <linearGradient
                                                            id={`employee-border-${employeeId}`}
                                                            x1="100%"
                                                            y1="100%"
                                                            x2="0%"
                                                            y2="0%"
                                                        >
                                                            <stop offset="0%" stopColor="#6366f1" />
                                                            <stop offset="100%" stopColor="#8b5cf6" />
                                                        </linearGradient>
                                                    </defs>

                                                    <motion.rect
                                                        x="1"
                                                        y="1"
                                                        width="calc(100% - 2px)"
                                                        height="calc(100% - 2px)"
                                                        rx="24"
                                                        ry="24"
                                                        fill="none"
                                                        stroke={`url(#employee-border-${employeeId})`}
                                                        strokeWidth="1.5"
                                                        pathLength="1"
                                                        initial={{ pathLength: 0, opacity: 0 }}
                                                        animate={
                                                            hovered === employeeId || isSelected
                                                                ? { pathLength: 1, opacity: 1 }
                                                                : { pathLength: 0, opacity: 0 }
                                                        }
                                                        transition={{
                                                            duration: 0.45,
                                                            ease: "easeInOut",
                                                        }}
                                                    />
                                                </svg>

                                                <div className="relative z-10 flex items-center justify-between">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <div
                                                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[14px] font-extrabold text-white"
                                                            style={{
                                                                background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                                                            }}
                                                        >
                                                            {getEmployeeName(employee).charAt(0)}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="truncate text-[12.5px] font-extrabold text-gray-800 dark:text-gray-100">
                                                                {getEmployeeName(employee)}
                                                            </p>

                                                            <div className="mt-1 flex items-center gap-1.5">
                                                                <Briefcase
                                                                    size={11}
                                                                    className="text-gray-400"
                                                                />

                                                                <p className="truncate text-[11px] text-gray-400 dark:text-gray-500">
                                                                    {getEmployeeRole(employee)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <AnimatePresence>
                                                        {isSelected && (
                                                            <motion.div
                                                                initial={{ scale: 0.7, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                exit={{ scale: 0.7, opacity: 0 }}
                                                                className="flex h-7 w-7 items-center justify-center rounded-xl"
                                                                style={{
                                                                    background: isDark
                                                                        ? "rgba(99,102,241,0.14)"
                                                                        : "rgba(99,102,241,0.1)",
                                                                }}
                                                            >
                                                                <Check
                                                                    size={14}
                                                                    className="text-indigo-500"
                                                                />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </motion.button>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
