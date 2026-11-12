"use client";

import { useCallback, useState } from "react";

/** Stack of views inside ONE modal (replaces nested modals). */
export function useModalFlow<K extends string>(root: K) {
    const [stack, setStack] = useState<K[]>([root]);
    const push = useCallback((k: K) => setStack((s) => [...s, k]), []);
    const back = useCallback(
        () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
        [],
    );
    const reset = useCallback(() => setStack([root]), [root]);
    return { view: stack[stack.length - 1], canGoBack: stack.length > 1, push, back, reset };
}
