import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_DELAY_MS = 200;

type Debounced<Args extends unknown[]> = ((...args: Args) => void) & { cancel: () => void };

// Callable debounce. Intensity sliders use this so a drag is not one persist per tick.
// cancel() lets a discrete chip persist immediately without a stale slider write landing after it.
export function useDebounce<Args extends unknown[]>(
    fn: (...args: Args) => void,
    delayMs: number = DEFAULT_DELAY_MS
): Debounced<Args> {
    const fnRef = useRef(fn);
    fnRef.current = fn;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancel = useCallback(() => {
        if (timerRef.current === null) return;
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
    }, []);

    useEffect(() => cancel, [cancel]);

    const run = useCallback(
        (...args: Args) => {
            cancel();
            timerRef.current = window.setTimeout(() => {
                timerRef.current = null;
                fnRef.current(...args);
            }, delayMs);
        },
        [cancel, delayMs]
    );

    return Object.assign(run, { cancel });
}

// Value debounce. Updates after delayMs when `value` changes, including on mount. Not used on the board yet.
export function useDebouncedValue<T>(value: T, delayMs: number = DEFAULT_DELAY_MS): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = window.setTimeout(() => setDebounced(value), delayMs);
        return () => window.clearTimeout(timer);
    }, [value, delayMs]);

    return debounced;
}
