import { useEffect, useState } from 'react';

type ViewportSize = {
    height: number;
    offsetTop: number;
};

/** Track the visible mobile viewport while a keyboard-aware drawer is open. */
export function useMobileDrawerViewport(active: boolean): ViewportSize | null {
    const [viewport, setViewport] = useState<ViewportSize | null>(null);

    useEffect(() => {
        if (!active) {
            setViewport(null);
            return;
        }

        const visualViewport = window.visualViewport;
        let frame = 0;

        const update = () => {
            frame = 0;
            setViewport({
                height: visualViewport?.height ?? window.innerHeight,
                offsetTop: visualViewport?.offsetTop ?? 0
            });
        };

        const scheduleUpdate = () => {
            if (frame === 0) {
                frame = window.requestAnimationFrame(update);
            }
        };

        update();
        visualViewport?.addEventListener('resize', scheduleUpdate);
        visualViewport?.addEventListener('scroll', scheduleUpdate);
        window.addEventListener('resize', scheduleUpdate);

        return () => {
            visualViewport?.removeEventListener('resize', scheduleUpdate);
            visualViewport?.removeEventListener('scroll', scheduleUpdate);
            window.removeEventListener('resize', scheduleUpdate);
            if (frame !== 0) {
                window.cancelAnimationFrame(frame);
            }
        };
    }, [active]);

    return active ? viewport : null;
}
