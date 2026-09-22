import { useDraftProfileStore } from '@/stores/draft-profile';
import { useEffect, useState } from 'react';

// Persist hydrates after mount. Callers should treat hydrated=false as "still first-run chrome."
export function useHydratedProfile() {
    const profile = useDraftProfileStore((state) => state.profile);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        const mark = () => setHydrated(true);
        const unsub = useDraftProfileStore.persist.onFinishHydration(mark);
        if (useDraftProfileStore.persist.hasHydrated()) mark();
        return unsub;
    }, []);

    return { hydrated, profile };
}
