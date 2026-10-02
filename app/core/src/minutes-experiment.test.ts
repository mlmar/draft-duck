import { describe, expect, it } from 'vitest';
import {
    candidateDecision,
    candidateOrder,
    fitAndPredict,
    MINUTES_CANDIDATES,
    minutesAdjustedSignals,
    minutesSourceBoards,
    mpQuartileSummary,
    existingSignals,
    signalEventMetrics,
    transitionTargets
} from './minutes-experiment.ts';
import type { PlayerSeason } from './types.ts';

function player(playerId: string, pts: number, mp: number, games = 60, age = 25): PlayerSeason {
    return {
        playerId,
        name: playerId,
        team: 'TST',
        pos: 'G',
        age,
        games,
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

const profile = {
    leagueSize: 12,
    draftRounds: 13,
    draftType: 'snake' as const,
    enabledCats: ['pts' as const],
    stances: {}
};

describe('minutes experiment', () => {
    it('uses average MPG percentiles for ties and leaves per-game ordering unchanged', () => {
        const views = {
            perGame: [player('a', 10, 10), player('b', 20, 20), player('c', 30, 20)],
            per36: [player('a', 30, 10), player('b', 20, 20), player('c', 10, 20)],
            totals: [player('a', 10, 10), player('b', 20, 20), player('c', 30, 20)]
        };
        const boards = minutesSourceBoards(views, profile);
        expect(boards.mpgPercentile.get('b')).toBe(0.75);
        expect(boards.mpgPercentile.get('c')).toBe(0.75);
        expect(candidateOrder(boards, 'per-game')).toEqual(['c', 'b', 'a']);
        expect(candidateOrder(boards, 'mp-added-per-game-10')).toEqual(['c', 'b', 'a']);
    });

    it('adjusts the per-36 sleeper signal toward per-game ranks at low MPG', () => {
        const views = {
            perGame: [player('a', 1, 8), player('b', 2, 30), player('c', 3, 30), player('d', 4, 30)],
            per36: [player('a', 4, 8), player('b', 3, 30), player('c', 2, 30), player('d', 1, 30)],
            totals: [player('a', 1, 8), player('b', 2, 30), player('c', 3, 30), player('d', 4, 30)]
        };
        const boards = minutesSourceBoards(views, profile);
        const signals = minutesAdjustedSignals(boards);
        expect(existingSignals(views, profile).get('a')).toBe('sleeper');
        expect(signals.get('a')).not.toBe('sleeper');
        expect(signals.size).toBe(4);
    });

    it('uses full source MP distribution for volatility quartiles and reports future attrition', () => {
        const source = [player('a', 1, 10), player('b', 2, 20), player('c', 3, 30), player('d', 4, 40)];
        const result = mpQuartileSummary(
            source,
            new Map([
                ['a', 0.1],
                ['b', -0.2],
                ['c', 0.3]
            ])
        );
        expect(result.sourceEligible).toBe(4);
        expect(result.matched).toBe(3);
        expect(result.missingFuture).toBe(1);
        expect(result.cutPoints).toEqual([17.5, 25, 32.5]);
        expect(result.groups.map((group) => group.count)).toEqual([1, 1, 1, 0]);
    });

    it('keeps low-game future season value but excludes it from per-game and volatility targets', () => {
        const current = [player('played', 10, 20), player('absent', 10, 20)];
        const future = [player('played', 12, 20, 15)];
        const outcome = {
            values: new Map([
                ['played', 2],
                ['absent', 0]
            ]),
            referenceCount: 156,
            playedCount: 1,
            replacement: 0
        };
        const targets = transitionTargets(current, { players: future, outcome }, profile);
        expect(targets.find((row) => row.id === 'played')?.futureSeasonValue).toBe(2);
        expect(targets.find((row) => row.id === 'played')?.futurePerGameComposite).toBeNull();
        expect(targets.find((row) => row.id === 'played')?.futureVolatility).toBeNull();
        expect(targets.find((row) => row.id === 'absent')?.futureSeasonValue).toBe(0);
    });

    it('reports breakout and decline precision and recall against matched outcomes', () => {
        const signals = new Map<string, 'sleeper' | 'dud' | null>([
            ['a', 'sleeper'],
            ['b', 'sleeper'],
            ['c', 'dud'],
            ['d', null]
        ]);
        const metrics = signalEventMetrics(
            signals,
            new Set(signals.keys()),
            new Map([
                ['a', 0.2],
                ['b', 0],
                ['c', -0.3],
                ['d', -0.2]
            ])
        );
        expect(metrics.sleeperBreakout).toMatchObject({
            taggedMatched: 2,
            eventCount: 1,
            truePositive: 1,
            precision: 0.5,
            recall: 1
        });
        expect(metrics.dudDecline).toMatchObject({
            taggedMatched: 1,
            eventCount: 2,
            truePositive: 1,
            precision: 1,
            recall: 0.5
        });
    });

    it('requires a positive mean and three positive transitions for candidate support', () => {
        const rows = ['a', 'b', 'c', 'd'].map((transition, index) => ({
            transition,
            scores: MINUTES_CANDIDATES.map((candidate) => ({
                id: candidate.id,
                primary: candidate.id === 'mp-added-per-game-10' ? (index < 3 ? 2 : 0) : 1
            }))
        }));
        const decision = candidateDecision(rows).find((candidate) => candidate.id === 'mp-added-per-game-10');
        expect(decision).toMatchObject({ positiveTransitions: 3, meanDifference: 0.5, retrospectivelyPromising: true });
    });

    it('records expanding chronological training transitions and evaluates the next transition', () => {
        const row = (id: string, games: number, mp: number, composite: number, outcome: number) => ({
            id,
            player: player(id, composite, mp, games, 22 + (Number(id.slice(-1)) % 7)),
            sourceComposite: composite,
            futurePerGameComposite: outcome,
            futureSeasonValue: (outcome * games) / 82,
            futureVolatility: Math.abs(outcome - composite),
            signedCompositeChange: outcome - composite
        });
        const train = [
            Array.from({ length: 12 }, (_, i) => row(`t${i}`, 35 + ((i * 7) % 13), 12 + ((i * 5) % 17), i, i * 2))
        ];
        const test = Array.from({ length: 5 }, (_, i) =>
            row(`v${i}`, 40 + ((i * 9) % 11), 15 + ((i * 4) % 16), i + 1, (i + 1) * 2)
        );
        const record = fitAndPredict(train, test, 'futurePerGameComposite', '23_24-to-24_25', ['21_22-to-22_23']);
        expect(record.testTransition).toBe('23_24-to-24_25');
        expect(record.trainTransitions).toEqual(['21_22-to-22_23']);
        expect(record.baseline.n).toBe(5);
        expect(record.withMp.n).toBe(5);
        expect(Number.isFinite(record.withMp.mae)).toBe(true);
    });
});
