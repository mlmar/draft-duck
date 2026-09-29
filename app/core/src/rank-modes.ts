import { rank } from './ranker.ts';
import type { DataMode, DraftProfile, PlayerSeason, RankedPlayer } from './types.ts';

export type PlayerUniverses = Record<DataMode, PlayerSeason[]>;

const MODES: DataMode[] = ['perGame', 'per36', 'totals'];

/** Ranks the selected universe and annotates large per-36 versus realized-rank gaps. */
export function rankWithDataModeSignals(universes: PlayerUniverses, profile: DraftProfile): RankedPlayer[] {
    const selectedMode = profile.dataMode ?? 'perGame';
    const rankings = Object.fromEntries(MODES.map((mode) => [mode, rank(universes[mode], profile)])) as Record<
        DataMode,
        RankedPlayer[]
    >;
    const lookup = Object.fromEntries(
        MODES.map((mode) => [mode, new Map(rankings[mode].map((player) => [player.playerId, player]))])
    ) as Record<DataMode, Map<string, RankedPlayer>>;

    return rankings[selectedMode].map((player) => {
        const rate = lookup.per36.get(player.playerId);
        const perGame = lookup.perGame.get(player.playerId);
        const totals = lookup.totals.get(player.playerId);
        if (!rate || !perGame || !totals) return player;

        const sleeper =
            inTopQuarter(rate, rankings.per36.length) &&
            belowMedian(perGame, rankings.perGame.length) &&
            belowMedian(totals, rankings.totals.length);
        const dud =
            inBottomQuarter(rate, rankings.per36.length) &&
            inTopHalf(perGame, rankings.perGame.length) &&
            inTopHalf(totals, rankings.totals.length);
        if (!sleeper && !dud) return player;
        return { ...player, upsideSignal: sleeper ? 'sleeper' : 'dud' };
    });
}

function inTopQuarter(player: RankedPlayer, count: number): boolean {
    return count > 0 && player.rank <= Math.ceil(count / 4);
}

function inBottomQuarter(player: RankedPlayer, count: number): boolean {
    return count > 0 && player.rank > count - Math.ceil(count / 4);
}

function inTopHalf(player: RankedPlayer, count: number): boolean {
    return count > 0 && player.rank <= Math.ceil(count / 2);
}

function belowMedian(player: RankedPlayer, count: number): boolean {
    return count > 0 && player.rank > Math.ceil(count / 2);
}
