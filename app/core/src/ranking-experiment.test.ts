import { describe, expect, it } from 'vitest';
import {
    CANDIDATES,
    candidateOrder,
    evaluateCandidate,
    sourceBoards,
    type Outcome,
    type ThreeViews
} from './ranking-experiment.ts';
import type { PlayerSeason } from './types.ts';

function player(playerId: string, pts: number, mp = 30): PlayerSeason {
    return {
        playerId,
        name: playerId,
        team: 'TST',
        pos: 'G',
        age: 25,
        games: 60,
        mp,
        pts,
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
    };
}

const pointsOnly = {
    leagueSize: 12,
    draftRounds: 13,
    draftType: 'snake' as const,
    enabledCats: ['pts' as const],
    stances: {}
};

describe('ranking experiment', () => {
    it('rejects mismatched source player sets before scoring', () => {
        const views: ThreeViews = {
            perGame: [player('a', 3), player('b', 2)],
            per36: [player('a', 3)],
            totals: [player('a', 3), player('b', 2)]
        };
        expect(() => sourceBoards(views, pointsOnly)).toThrow(/Mismatched per36/);
    });

    it('attenuates a low-minute rate-only leader without changing the single-view baseline', () => {
        const views: ThreeViews = {
            perGame: [player('a', 4), player('b', 3), player('c', 2, 6), player('d', 1)],
            per36: [player('c', 4), player('a', 3), player('d', 2), player('b', 1)],
            totals: [player('a', 4), player('c', 3), player('b', 2), player('d', 1)]
        };
        const boards = sourceBoards(views, pointsOnly);
        expect(candidateOrder(boards, CANDIDATES[0]!)).toEqual(['a', 'b', 'c', 'd']);
        const raw = candidateOrder(boards, CANDIDATES[5]!);
        const adjusted = candidateOrder(boards, CANDIDATES[6]!);
        expect(raw.indexOf('c')).toBeLessThan(raw.indexOf('b'));
        expect(adjusted.indexOf('c')).toBeGreaterThan(adjusted.indexOf('b'));
        expect(adjusted[0]).toBe('a');
    });

    it('keeps absent players at zero value and discounts early picks less', () => {
        const outcome: Outcome = {
            values: new Map([
                ['a', 4],
                ['b', 2]
            ]),
            referenceCount: 156,
            playedCount: 2,
            replacement: 0
        };
        const first = evaluateCandidate(['a', 'b', 'missing'], outcome, CANDIDATES[0]!);
        const reversed = evaluateCandidate(['b', 'a', 'missing'], outcome, CANDIDATES[0]!);
        expect(first.primary).toBeGreaterThan(reversed.primary);
        expect(first.missing).toBe(1);
        expect(first.at12).toBeCloseTo(4 + 2 / Math.log2(3));
    });
});
