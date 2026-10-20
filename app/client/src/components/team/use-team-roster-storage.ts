import {
    createTeamRosterRecord,
    parseTeamRosterRecord,
    serializeTeamRosterRecord,
    TEAM_ROSTER_STORAGE_KEY
} from '@draft-duck/core';
import { useCallback, useEffect, useState } from 'react';

type StorageStatus = 'loading' | 'ready' | 'saved' | 'unavailable';

/** Own Team Lab local-storage hydration, validation, save feedback, and session fallback state. */
export function useTeamRosterStorage() {
    const [playerIds, setPlayerIds] = useState<string[]>([]);
    const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
    const [status, setStatus] = useState<StorageStatus>('loading');
    const [message, setMessage] = useState<string | null>(null);
    const [hydrated, setHydrated] = useState(false);

    // Read the isolated roster key after mount so browser storage never runs during server rendering.
    useEffect(() => {
        if (hydrated || typeof window === 'undefined') {
            return;
        }

        try {
            const parsed = parseTeamRosterRecord(window.localStorage.getItem(TEAM_ROSTER_STORAGE_KEY));
            if (parsed.status === 'valid') {
                setPlayerIds(parsed.record.playerIds);
                setPlayerNames(parsed.record.playerNames);
                setStatus('saved');
            } else {
                setPlayerIds([]);
                setPlayerNames({});
                setStatus('ready');
                if (parsed.status === 'invalid') {
                    setMessage('The saved roster could not be read. Add players to create a fresh roster.');
                }
            }
        } catch {
            setPlayerIds([]);
            setPlayerNames({});
            setStatus('unavailable');
            setMessage('Browser storage is unavailable. Your roster will work for this visit only.');
        }

        setHydrated(true);
    }, [hydrated]);

    // Update session state even when browser persistence is blocked, then expose a clear save status.
    const saveRoster = useCallback((nextPlayerIds: string[], nextPlayerNames: Record<string, string>) => {
        const record = createTeamRosterRecord(nextPlayerIds, nextPlayerNames);
        setPlayerIds(record.playerIds);
        setPlayerNames(record.playerNames);

        if (typeof window === 'undefined') {
            setStatus('unavailable');
            setMessage('Browser storage is unavailable. Your roster will work for this visit only.');
            return;
        }

        try {
            window.localStorage.setItem(TEAM_ROSTER_STORAGE_KEY, serializeTeamRosterRecord(record));
            setStatus('saved');
            setMessage(null);
        } catch {
            setStatus('unavailable');
            setMessage('Browser storage is unavailable. Your roster will work for this visit only.');
        }
    }, []);

    return { playerIds, playerNames, status, message, hydrated, saveRoster };
}
