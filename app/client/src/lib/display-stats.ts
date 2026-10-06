import { DATA_MODES, type DataMode } from '@draft-duck/core';

const KEY = 'dd.displayStatsMode';

export function readDisplayStatsMode(storage?: Pick<Storage, 'getItem'>): DataMode {
    try {
        const value = (storage ?? localStorage).getItem(KEY);
        return DATA_MODES.find((mode) => mode === value) ?? 'perGame';
    } catch {
        return 'perGame';
    }
}

export function writeDisplayStatsMode(mode: DataMode, storage?: Pick<Storage, 'setItem'>): void {
    try {
        (storage ?? localStorage).setItem(KEY, mode);
    } catch {
        // Storage can be unavailable in private mode. The selected mode still works for this visit.
    }
}
