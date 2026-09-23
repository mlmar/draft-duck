import { useEffect, useState } from 'react';

// First paint is false, then the query. Callers should treat that as the phone layout.
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        const apply = () => setMatches(media.matches);
        apply();
        media.addEventListener('change', apply);
        return () => media.removeEventListener('change', apply);
    }, [query]);

    return matches;
}
