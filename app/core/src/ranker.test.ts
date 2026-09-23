import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CsvProvider } from './csv-provider.ts';
import { stancesForArchetype } from './named-builds.ts';
import { DEFAULT_OPERATOR_WEIGHTS } from './operator-weights.ts';
import { rank } from './ranker.ts';
import { identitySuggestionHook, type SuggestionHook } from './suggestion-hook.ts';
import { CAT_KEYS, type DraftProfile, type PlayerSeason } from './types.ts';

const seasonPath = fileURLToPath(new URL('../../data/25_26_per_game.csv', import.meta.url));

function season(partial: Partial<PlayerSeason> & Pick<PlayerSeason, 'playerId'>): PlayerSeason {
    return {
        name: partial.playerId,
        team: 'TST',
        pos: 'F',
        age: 25,
        games: 50,
        mp: 30,
        pts: 10,
        trb: 5,
        ast: 3,
        stl: 1,
        blk: 0.5,
        fg3: 1,
        fg3a: 3,
        fg: 4,
        fga: 8,
        fgPct: 0.5,
        ft: 2,
        fta: 2.5,
        ftPct: 0.8,
        tov: 2,
        ...partial
    };
}

function profile(overrides: Partial<DraftProfile> = {}): DraftProfile {
    return {
        leagueSize: 12,
        draftRounds: 13,
        draftType: 'snake',
        enabledCats: [...CAT_KEYS],
        stances: {},
        ...overrides
    };
}

function byId(players: ReturnType<typeof rank>, playerId: string) {
    const player = players.find((entry) => entry.playerId === playerId);
    if (!player) throw new Error(`Missing player ${playerId}`);
    return player;
}

describe('rank', () => {
    it('gives unique 1-based ranks and finite composites on an all-neutral 9-cat board', () => {
        const universe = [
            season({ playerId: 'aaa', pts: 20, trb: 4 }),
            season({ playerId: 'bbb', pts: 12, trb: 10 }),
            season({ playerId: 'ccc', pts: 8, trb: 6 })
        ];
        const ranked = rank(universe, profile());
        expect(ranked.map((player) => player.rank)).toEqual([1, 2, 3]);
        expect(new Set(ranked.map((player) => player.playerId)).size).toBe(3);
        expect(ranked.every((player) => Number.isFinite(player.composite))).toBe(true);
        expect(ranked.every((player) => CAT_KEYS.every((cat) => typeof player.z[cat] === 'number'))).toBe(true);
    });

    it('omits disabled cats from z and keeps punted cats at weight 0', () => {
        const universe = [season({ playerId: 'aaa', tov: 4 }), season({ playerId: 'bbb', tov: 1 })];
        const omitted = rank(universe, profile({ enabledCats: CAT_KEYS.filter((cat) => cat !== 'tov') }));
        expect(omitted[0]?.z.tov).toBeUndefined();
        expect(omitted[1]?.z.tov).toBeUndefined();

        const punted = rank(universe, profile({ stances: { tov: 'punt' } }));
        expect(typeof punted[0]?.z.tov).toBe('number');
        expect(punted.map((player) => player.playerId)).toEqual(omitted.map((player) => player.playerId));
        expect(punted[0]?.composite).toBeCloseTo(omitted[0]?.composite ?? NaN);
        expect(punted[1]?.composite).toBeCloseTo(omitted[1]?.composite ?? NaN);
    });

    it('matches punt tov against enabled tov with weight 0', () => {
        const universe = [season({ playerId: 'high', tov: 4, pts: 18 }), season({ playerId: 'low', tov: 1, pts: 12 })];
        const punted = rank(universe, profile({ stances: { tov: 'punt' } }));
        const zeroWeight = rank(universe, profile({ intensity: { tov: 0 } }));
        expect(punted.map((player) => player.playerId)).toEqual(zeroWeight.map((player) => player.playerId));
        expect(punted[0]?.composite).toBeCloseTo(zeroWeight[0]?.composite ?? NaN);
        expect(punted[1]?.composite).toBeCloseTo(zeroWeight[1]?.composite ?? NaN);
    });

    it('gives different fgPct z to equal percentages with different volume', () => {
        const universe = [
            season({ playerId: 'volume', fgPct: 0.5, fga: 20, fg: 10 }),
            season({ playerId: 'lowvol', fgPct: 0.5, fga: 4, fg: 2 }),
            season({ playerId: 'poor', fgPct: 0.4, fga: 10, fg: 4 })
        ];
        const ranked = rank(universe, profile());
        const volume = ranked.find((player) => player.playerId === 'volume');
        const lowvol = ranked.find((player) => player.playerId === 'lowvol');
        expect(volume?.z.fgPct).not.toBe(lowvol?.z.fgPct);
        expect(volume?.z.fgPct ?? 0).toBeGreaterThan(lowvol?.z.fgPct ?? 0);
    });

    it('raises a poor-FG% big when fgPct is punted', () => {
        const shared = { pts: 12, ast: 2, stl: 1, blk: 1, fg3: 1, tov: 2, ftPct: 0.8, fta: 3, ft: 2.4 };
        const universe = [
            season({ ...shared, playerId: 'bigguy01', trb: 10, fgPct: 0.35, fga: 20, fg: 7 }),
            season({ ...shared, playerId: 'shooter1', trb: 7, fgPct: 0.5, fga: 20, fg: 10 }),
            season({ ...shared, playerId: 'avg00001', trb: 6.5, fgPct: 0.49, fga: 20, fg: 9.8 }),
            season({ ...shared, playerId: 'avg00002', trb: 6, fgPct: 0.51, fga: 20, fg: 10.2 })
        ];
        const neutral = rank(universe, profile());
        const punted = rank(universe, profile({ stances: { fgPct: 'punt' } }));
        const bigNeutral = byId(neutral, 'bigguy01');
        const bigPunted = byId(punted, 'bigguy01');
        expect(bigNeutral.rank).toBeGreaterThan(1);
        expect(bigPunted.rank).toBeLessThan(bigNeutral.rank);
    });

    it('doubles stl contribution when the operator weight is doubled', () => {
        const universe = [
            season({ playerId: 'thief01', stl: 3, pts: 10 }),
            season({ playerId: 'plain01', stl: 0.5, pts: 10 })
        ];
        const base = rank(universe, profile());
        const doubled = rank(universe, profile(), {
            operatorWeights: { ...DEFAULT_OPERATOR_WEIGHTS, stl: 2 }
        });
        const baseThief = base.find((player) => player.playerId === 'thief01');
        const doubledThief = doubled.find((player) => player.playerId === 'thief01');
        expect(baseThief && doubledThief).toBeTruthy();
        // Extra operator 1 * profile_w 1 * z_stl is the only composite change.
        expect(doubledThief?.composite).toBeCloseTo((baseThief?.composite ?? 0) + (baseThief?.z.stl ?? 0));
    });

    it('keeps player order when the identity hook annotates', () => {
        const universe = [
            season({ playerId: 'ccc', pts: 8 }),
            season({ playerId: 'aaa', pts: 20 }),
            season({ playerId: 'bbb', pts: 12 })
        ];
        const ranked = rank(universe, profile());
        const annotated = identitySuggestionHook.annotate(ranked);
        expect(annotated.map((player) => player.playerId)).toEqual(ranked.map((player) => player.playerId));
        expect(annotated.map((player) => player.composite)).toEqual(ranked.map((player) => player.composite));
        expect(annotated.map((player) => player.rank)).toEqual(ranked.map((player) => player.rank));
    });

    it('does not let the default hook reorder a sorted board', () => {
        const universe = [season({ playerId: 'b', pts: 10 }), season({ playerId: 'a', pts: 10 })];
        const reversingHook: SuggestionHook = {
            annotate: (players) => [...players].reverse()
        };
        const identityOrder = rank(universe, profile()).map((player) => player.playerId);
        const reversedOrder = rank(universe, profile(), { suggestionHook: reversingHook }).map(
            (player) => player.playerId
        );
        expect(identityOrder).toEqual(['a', 'b']);
        expect(reversedOrder).toEqual(['b', 'a']);
        expect(identityOrder).not.toEqual(reversedOrder);
    });

    it('breaks composite ties by playerId ascending', () => {
        const universe = [season({ playerId: 'b', pts: 10 }), season({ playerId: 'a', pts: 10 })];
        expect(rank(universe, profile()).map((player) => player.playerId)).toEqual(['a', 'b']);
    });

    it('keeps rank, fitRank, and consensusRank aligned on an all-neutral board', () => {
        const universe = [
            season({ playerId: 'aaa', pts: 20, trb: 4 }),
            season({ playerId: 'bbb', pts: 12, trb: 10 }),
            season({ playerId: 'ccc', pts: 8, trb: 6 })
        ];
        const ranked = rank(universe, profile());
        expect(ranked.every((player) => player.rank === player.fitRank && player.rank === player.consensusRank)).toBe(
            true
        );
    });

    it('builds consensus from enabled cats only', () => {
        const universe = [
            season({ playerId: 'turnover', tov: 5, pts: 22 }),
            season({ playerId: 'careful', tov: 0.5, pts: 16 })
        ];
        const nine = rank(universe, profile());
        const eight = rank(universe, profile({ enabledCats: CAT_KEYS.filter((cat) => cat !== 'tov') }));
        expect(byId(nine, 'careful').consensusRank).toBe(1);
        expect(byId(eight, 'turnover').consensusRank).toBe(1);
        expect(eight[0]?.z.tov).toBeUndefined();
    });

    it('promotes a consensus star a punt board would bury and leaves a rising specialist', () => {
        const universe = [
            season({ playerId: 'blkstar1', blk: 4 }),
            season({
                playerId: 'guard001',
                pts: 22,
                ast: 7,
                fg3: 3.2,
                stl: 2.2,
                blk: 0.2,
                ftPct: 0.9,
                fta: 6,
                ft: 5.4
            }),
            ...Array.from({ length: 6 }, (_, index) => season({ playerId: `avg0000${index}` }))
        ];
        const sniper = profile({
            stances: { pts: 'need', fg3: 'need', ftPct: 'need', ast: 'need', stl: 'need', blk: 'punt' }
        });
        const ranked = rank(universe, sniper, { availabilityFloor: true, availabilitySlack: 2 });
        const star = byId(ranked, 'blkstar1');
        const specialist = byId(ranked, 'guard001');
        expect(star.fitRank).toBeGreaterThan(star.consensusRank);
        expect(star.rank).toBeLessThanOrEqual(star.consensusRank + 2);
        expect(star.rank).toBeLessThan(star.fitRank);
        expect(specialist.fitRank).toBe(1);
        expect(specialist.rank).toBe(1);
    });

    it('keeps fit order when the availability floor is off', () => {
        const universe = [
            season({ playerId: 'blkstar1', blk: 4 }),
            season({
                playerId: 'guard001',
                pts: 22,
                ast: 7,
                fg3: 3.2,
                stl: 2.2,
                blk: 0.2,
                ftPct: 0.9,
                fta: 6,
                ft: 5.4
            }),
            ...Array.from({ length: 6 }, (_, index) => season({ playerId: `avg0000${index}` }))
        ];
        const sniper = profile({
            stances: { pts: 'need', fg3: 'need', ftPct: 'need', ast: 'need', stl: 'need', blk: 'punt' }
        });
        const off = rank(universe, sniper);
        const on = rank(universe, sniper, { availabilityFloor: true, availabilitySlack: 2 });
        const starOff = byId(off, 'blkstar1');
        const starOn = byId(on, 'blkstar1');
        expect(off.every((player) => player.rank === player.fitRank)).toBe(true);
        expect(starOff.rank).toBe(starOff.fitRank);
        expect(starOn.rank).toBeLessThan(starOn.fitRank);
        expect(starOff.rank).toBeGreaterThan(starOn.rank);
    });

    it('restores fit order when availability slack covers the whole universe', () => {
        const universe = [
            season({
                playerId: 'ftstar01',
                pts: 28,
                trb: 3,
                blk: 0.2,
                fgPct: 0.41,
                fga: 18,
                fg: 7.4,
                ftPct: 0.94,
                fta: 8,
                ft: 7.5
            }),
            season({
                playerId: 'ftsink1',
                pts: 24,
                trb: 13,
                blk: 2.8,
                fgPct: 0.64,
                fga: 18,
                fg: 11.5,
                ftPct: 0.52,
                fta: 8,
                ft: 4.2
            }),
            season({
                playerId: 'avg00001',
                pts: 12,
                trb: 6,
                blk: 0.8,
                fgPct: 0.48,
                fga: 18,
                fg: 8.6,
                ftPct: 0.78,
                fta: 8,
                ft: 6.2
            })
        ];
        const fortress = profile({
            stances: { fgPct: 'need', trb: 'need', blk: 'need', pts: 'need', ftPct: 'punt' }
        });
        const floored = rank(universe, fortress, { availabilityFloor: true });
        const fitOnly = rank(universe, fortress, { availabilityFloor: true, availabilitySlack: universe.length });
        expect(fitOnly.map((player) => player.playerId)).toEqual(
            [...floored].sort((a, b) => a.fitRank - b.fitRank).map((player) => player.playerId)
        );
        expect(fitOnly.every((player) => player.rank === player.fitRank)).toBe(true);
    });
});

describe('rank season dump', () => {
    it('keeps Fortress rank as fit order while the availability floor is off', async () => {
        const universe = await new CsvProvider(seasonPath).load();
        const fortress = profile({
            stances: stancesForArchetype('puntFt', CAT_KEYS),
            archetypeId: 'puntFt'
        });
        const ranked = rank(universe, fortress);
        const curry = byId(ranked, 'curryst01');
        const harden = byId(ranked, 'hardeja01');
        const giannis = byId(ranked, 'antetgi01');
        expect(curry.rank).toBe(curry.fitRank);
        expect(harden.rank).toBe(harden.fitRank);
        expect(curry.fitRank).toBeGreaterThan(curry.consensusRank);
        expect(harden.fitRank).toBeGreaterThan(harden.consensusRank);
        expect(giannis.rank).toBeLessThan(giannis.consensusRank);
        expect(giannis.rank).toBe(giannis.fitRank);
    });

    it('keeps Fortress consensus stars inside one round of slack when the floor is on', async () => {
        const universe = await new CsvProvider(seasonPath).load();
        const fortress = profile({
            stances: stancesForArchetype('puntFt', CAT_KEYS),
            archetypeId: 'puntFt'
        });
        const ranked = rank(universe, fortress, { availabilityFloor: true });
        const curry = byId(ranked, 'curryst01');
        const harden = byId(ranked, 'hardeja01');
        const giannis = byId(ranked, 'antetgi01');
        expect(curry.fitRank).toBeGreaterThan(curry.consensusRank);
        expect(harden.fitRank).toBeGreaterThan(harden.consensusRank);
        expect(curry.rank).toBeLessThanOrEqual(curry.consensusRank + fortress.leagueSize);
        expect(harden.rank).toBeLessThanOrEqual(harden.consensusRank + fortress.leagueSize);
        expect(curry.rank).toBeLessThan(curry.fitRank);
        expect(harden.rank).toBeLessThan(harden.fitRank);
        expect(giannis.rank).toBeLessThan(giannis.consensusRank);
        expect(giannis.rank).toBe(giannis.fitRank);
    });
});
