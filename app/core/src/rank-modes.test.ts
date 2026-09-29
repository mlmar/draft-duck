import { describe, expect, it } from 'vitest';
import { draftProfileSchema } from './profile.ts';
import { rankWithDataModeSignals, type PlayerUniverses } from './rank-modes.ts';
import type { PlayerSeason } from './types.ts';

const profile = draftProfileSchema.parse({
    leagueSize: 12,
    draftRounds: 13,
    draftType: 'snake',
    enabledCats: ['pts']
});

function universe(order: string[]): PlayerSeason[] {
    return order.map((playerId, index) => ({
        playerId,
        name: playerId,
        team: 'TST',
        pos: 'G',
        age: 25,
        games: 82,
        mp: 2000,
        pts: order.length - index,
        trb: 0,
        ast: 0,
        stl: 0,
        blk: 0,
        fg3: 0,
        fg3a: 0,
        fg: 0,
        fga: 0,
        fgPct: null,
        ft: 0,
        fta: 0,
        ftPct: null,
        tov: 0
    }));
}

function universes(per36: string[], perGame: string[], totals: string[]): PlayerUniverses {
    return { perGame: universe(perGame), per36: universe(per36), totals: universe(totals) };
}

describe('rankWithDataModeSignals', () => {
    it('defaults legacy profiles to per-game mode', () => {
        expect(profile.dataMode).toBe('perGame');
    });

    it('rejects an unsupported data mode', () => {
        expect(draftProfileSchema.safeParse({ ...profile, dataMode: 'per-minute' }).success).toBe(false);
    });

    it('uses the selected dataset for the board order', () => {
        const players = universes(['a', 'b', 'c', 'd'], ['d', 'c', 'b', 'a'], ['b', 'c', 'a', 'd']);
        const totalsProfile = { ...profile, dataMode: 'totals' as const };

        expect(rankWithDataModeSignals(players, totalsProfile)[0]?.playerId).toBe('b');
    });

    it('flags sleeper and dud signals at the quarter and median boundaries', () => {
        const players = universes(
            ['sleeper', 'a', 'b', 'c', 'd', 'e', 'f', 'dud'],
            ['dud', 'a', 'b', 'c', 'sleeper', 'e', 'f', 'g'],
            ['dud', 'a', 'b', 'c', 'sleeper', 'e', 'f', 'g']
        );

        const ranked = rankWithDataModeSignals(players, profile);
        expect(ranked.find((player) => player.playerId === 'sleeper')?.upsideSignal).toBe('sleeper');
        expect(ranked.find((player) => player.playerId === 'dud')?.upsideSignal).toBe('dud');
    });

    it('does not signal a player missing from a comparison dataset', () => {
        const players = universes(
            ['sleeper', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
            ['sleeper', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
            ['a', 'b', 'c', 'd', 'e', 'f', 'g']
        );

        expect(
            rankWithDataModeSignals(players, profile).find((player) => player.playerId === 'sleeper')
        ).not.toHaveProperty('upsideSignal');
    });
});
