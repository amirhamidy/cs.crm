// Shared motion constants. Animate only opacity/transform.
export const DURATION = { fast: 0.15, base: 0.2, sheet: 0.28 } as const;
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_SHEET = [0.32, 0.72, 0, 1] as const;

export const fade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: DURATION.base, ease: "easeOut" as const },
};

/** Panel variants: bottom-sheet on mobile, centered card on desktop. */
export function panelMotion(mobile: boolean, reduced: boolean) {
    if (reduced) {
        return {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
            transition: { duration: DURATION.fast },
        };
    }
    if (mobile) {
        return {
            initial: { opacity: 1, y: "100%" },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 1, y: "100%" },
            transition: { duration: DURATION.sheet, ease: EASE_SHEET },
        };
    }
    return {
        initial: { opacity: 0, y: 12, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 8, scale: 0.98 },
        transition: { duration: DURATION.base, ease: EASE_OUT },
    };
}
