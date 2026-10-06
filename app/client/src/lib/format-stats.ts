import type { CatKey, DataMode, PlayerSeason, RankedPlayer } from '@draft-duck/core';

// Percents are stored 0-1. Null shot rates have no attempts.

export function formatCatStat(player: Pick<PlayerSeason, CatKey>, cat: CatKey): string {
    if (cat === 'fgPct' || cat === 'ftPct') {
        const rate = player[cat];
        if (rate === null) return '-';
        return `${(rate * 100).toFixed(1)}%`;
    }
    return player[cat].toFixed(1);
}

export function formatDisplayedCatStat(
    player: RankedPlayer,
    cat: CatKey,
    mode: DataMode,
    rankingMode: DataMode
): string {
    const stats =
        player.rawStatsByMode?.[mode] ??
        (player.rawStatsByMode === undefined && mode === rankingMode ? player : undefined);
    return stats ? formatCatStat(stats, cat) : '-';
}
