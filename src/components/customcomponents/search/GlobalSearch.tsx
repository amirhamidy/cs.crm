"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Building2,
    CalendarDays,
    CheckSquare,
    FileText,
    Loader2,
    NotebookPen,
    Search,
    User,
    Users,
    X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
    normalizeSearchText,
    searchGlobal,
} from "@/lib/globalSearch";
import type {
    GlobalSearchResult,
} from "@/types/globalSearch";

interface ResultConfig {
    icon: typeof Search;
    label: string;
}

const resultConfig: Record<
    string,
    ResultConfig
> = {
    customer: {
        icon: Users,
        label: "مشتری",
    },
    employee: {
        icon: User,
        label: "کارمند",
    },
    department: {
        icon: Building2,
        label: "دپارتمان",
    },
    case: {
        icon: FileText,
        label: "پرونده",
    },
    task: {
        icon: CheckSquare,
        label: "وظیفه",
    },
    internal_task: {
        icon: CheckSquare,
        label: "تسک درون‌سازمانی",
    },
    note: {
        icon: NotebookPen,
        label: "یادداشت",
    },
    calendar: {
        icon: CalendarDays,
        label: "تقویم",
    },
};

export default function GlobalSearch() {
    const router = useRouter();

    const userType = useAuthStore(
        (state) => state.userType,
    );

    const containerRef =
        useRef<HTMLDivElement | null>(null);

    const inputRef =
        useRef<HTMLInputElement | null>(null);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<
        GlobalSearchResult[]
    >([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] =
        useState(-1);
    const [hasSearched, setHasSearched] =
        useState(false);

    const clearSearch = useCallback(() => {
        setQuery("");
        setResults([]);
        setOpen(false);
        setSelectedIndex(-1);
        setHasSearched(false);
    }, []);

    const handleSearch = useCallback(
        async (value: string) => {
            const normalized =
                normalizeSearchText(value);

            if (normalized.length < 2) {
                setResults([]);
                setLoading(false);
                setHasSearched(false);
                setSelectedIndex(-1);
                return;
            }

            setLoading(true);
            setHasSearched(true);
            setOpen(true);

            const data = await searchGlobal(
                value,
                userType,
            );

            setResults(data);
            setSelectedIndex(-1);
            setLoading(false);
        },
        [userType],
    );

    useEffect(() => {
        const timer = window.setTimeout(() => {
            handleSearch(query);
        }, 300);

        return () => {
            window.clearTimeout(timer);
        };
    }, [query, handleSearch]);

    useEffect(() => {
        const handleKeyDown = (
            event: KeyboardEvent,
        ) => {
            const isShortcut =
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "k";

            if (isShortcut) {
                event.preventDefault();
                inputRef.current?.focus();
                setOpen(true);
                return;
            }

            if (event.key === "Escape") {
                if (open) {
                    event.preventDefault();
                    clearSearch();
                    inputRef.current?.blur();
                }
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown,
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown,
            );
        };
    }, [clearSearch, open]);

    useEffect(() => {
        const handleClickOutside = (
            event: MouseEvent,
        ) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(
                    event.target as Node,
                )
            ) {
                setOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside,
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside,
            );
        };
    }, []);

    const navigateToResult = useCallback(
        (result: GlobalSearchResult) => {
            setOpen(false);
            setSelectedIndex(-1);
            router.push(result.href);
        },
        [router],
    );

    const handleKeyNavigation = (
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (!open || results.length === 0) {
            if (event.key === "Enter") {
                event.preventDefault();
            }

            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();

            setSelectedIndex((current) => {
                if (
                    current >=
                    results.length - 1
                ) {
                    return 0;
                }

                return current + 1;
            });

            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();

            setSelectedIndex((current) => {
                if (current <= 0) {
                    return results.length - 1;
                }

                return current - 1;
            });

            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();

            if (
                selectedIndex >= 0 &&
                selectedIndex < results.length
            ) {
                navigateToResult(
                    results[selectedIndex],
                );
            }
        }
    };

    const handleFocus = () => {
        if (
            query.trim().length >= 2 ||
            results.length > 0
        ) {
            setOpen(true);
        }
    };

    const getConfig = (
        type: string,
    ): ResultConfig => {
        return (
            resultConfig[type] || {
                icon: Search,
                label: "نتیجه",
            }
        );
    };

    return (
        <div
            ref={containerRef}
            className="relative block w-full max-w-[430px]"
            dir="rtl"
        >
            <div
                className={`relative flex h-10 w-full items-center rounded-xl border transition-all duration-200 ${open
                        ? "border-indigo-500/40 bg-white shadow-sm shadow-indigo-500/5 dark:border-indigo-400/30 dark:bg-slate-900"
                        : "border-gray-200/70 bg-white/70 dark:border-white/10 dark:bg-white/[0.04]"
                    }`}
            >
                <Search
                    size={15}
                    className="mr-3 shrink-0 text-gray-400"
                />

                <input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setOpen(true);
                    }}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyNavigation}
                    placeholder="جستجو در CRM..."
                    className="h-full min-w-0 flex-1 bg-transparent px-2 text-[12px] text-gray-800 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
                    autoComplete="off"
                    spellCheck={false}
                />

                {loading && (
                    <Loader2
                        size={15}
                        className="ml-2 shrink-0 animate-spin text-indigo-500"
                    />
                )}

                {!loading &&
                    query.length > 0 && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="ml-1 mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-300"
                            aria-label="پاک کردن جستجو"
                        >
                            <X size={14} />
                        </button>
                    )}

                {!query && (
                    <div className="ml-2 hidden h-6 items-center rounded-md bg-gray-100 px-1.5 text-[9px] text-gray-400 sm:flex dark:bg-white/5 dark:text-gray-500">
                        Ctrl K
                    </div>
                )}
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 6,
                            scale: 0.98,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                        }}
                        exit={{
                            opacity: 0,
                            y: 6,
                            scale: 0.98,
                        }}
                        transition={{
                            duration: 0.16,
                        }}
                        className="absolute right-0 top-[calc(100%+8px)] z-[70] w-full min-w-[280px] overflow-hidden rounded-2xl border border-gray-200/70 bg-white/95 shadow-xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 dark:shadow-black/30"
                    >
                        {loading ? (
                            <div className="flex flex-col items-center justify-center gap-3 px-4 py-10">
                                <Loader2
                                    size={22}
                                    className="animate-spin text-indigo-500"
                                />

                                <span className="text-[11.5px] text-gray-500 dark:text-gray-400">
                                    در حال جستجو...
                                </span>
                            </div>
                        ) : !hasSearched ||
                            normalizeSearchText(
                                query,
                            ).length < 2 ? (
                            <div className="px-5 py-8 text-center">
                                <Search
                                    size={22}
                                    className="mx-auto mb-2 text-gray-300 dark:text-gray-700"
                                />

                                <p className="text-[11.5px] text-gray-500 dark:text-gray-400">
                                    حداقل دو حرف وارد کنید
                                </p>
                            </div>
                        ) : results.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 px-5 py-10">
                                <Search
                                    size={24}
                                    className="text-gray-300 dark:text-gray-700"
                                />

                                <p className="text-[12px] font-medium text-gray-600 dark:text-gray-300">
                                    نتیجه‌ای پیدا نشد
                                </p>

                                <p className="text-[10.5px] text-gray-400 dark:text-gray-500">
                                    عبارت دیگری را امتحان کنید
                                </p>
                            </div>
                        ) : (
                            <div className="max-h-[min(520px,calc(100vh-100px))] overflow-y-auto p-2">
                                <div className="mb-1 flex items-center justify-between px-2 py-1.5">
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                                        نتایج جستجو
                                    </span>

                                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                        {results.length} نتیجه
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    {results.map(
                                        (
                                            result,
                                            index,
                                        ) => {
                                            const config =
                                                getConfig(
                                                    result.type,
                                                );

                                            const Icon =
                                                config.icon;

                                            const isSelected =
                                                index ===
                                                selectedIndex;

                                            return (
                                                <button
                                                    key={`${result.type}-${result.id}-${index}`}
                                                    type="button"
                                                    onClick={() =>
                                                        navigateToResult(
                                                            result,
                                                        )
                                                    }
                                                    onMouseEnter={() =>
                                                        setSelectedIndex(
                                                            index,
                                                        )
                                                    }
                                                    className={`flex w-full items-start gap-3 rounded-xl p-2.5 text-right transition-colors ${isSelected
                                                            ? "bg-indigo-50 dark:bg-indigo-500/10"
                                                            : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                                                        }`}
                                                >
                                                    <div
                                                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isSelected
                                                                ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
                                                                : "bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400"
                                                            }`}
                                                    >
                                                        <Icon
                                                            size={
                                                                15
                                                            }
                                                            strokeWidth={
                                                                1.7
                                                            }
                                                        />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="truncate text-[12px] font-bold text-gray-800 dark:text-gray-100">
                                                                {
                                                                    result.title
                                                                }
                                                            </p>

                                                            <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-400 dark:bg-white/[0.06] dark:text-gray-500">
                                                                {
                                                                    result.typeLabel
                                                                }
                                                            </span>
                                                        </div>

                                                        {result.subtitle && (
                                                            <p className="mt-1 truncate text-[10.5px] text-gray-500 dark:text-gray-400">
                                                                {
                                                                    result.subtitle
                                                                }
                                                            </p>
                                                        )}

                                                        {result.description && (
                                                            <p className="mt-1 line-clamp-2 text-[10.5px] leading-5 text-gray-400 dark:text-gray-500">
                                                                {
                                                                    result.description
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        },
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}