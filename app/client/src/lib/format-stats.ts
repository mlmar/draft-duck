import type { CatKey, RankedPlayer } from '@waiver-warrior/core';

// Percents are stored 0-1. Counting stats stay per-game. Null shot rates have no attempts.

export function formatCatStat(player: RankedPlayer, cat: CatKey): string {
    if (cat === 'fgPct' || cat === 'ftPct') {
        const rate = player[cat];
        if (rate === null) return '-';
        return `${(rate * 100).toFixed(1)}%`;
    }
    return player[cat].toFixed(1);
}
