import { describe, expect, it } from 'vitest';
import { contributionSummary, formatSignedValue, signedBarGeometry, strengthDatum } from './player-strength-chart.ts';
import { CAT_KEYS, type RankedPlayer } from '@draft-duck/core';

// Build a typed player with controlled score and raw-rate values for chart helper cases.
function rankedPlayer(overrides: Partial<RankedPlayer> = {}): RankedPlayer {
    return {
        playerId: 'sample',
        name: 'Sample Player',
        team: 'TST',
        pos: 'G',
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
        z: {},
        composite: 0,
        rank: 1,
        fitRank: 1,
        consensusRank: 1,
        ...overrides
    };
}

describe('player strength chart helpers', () => {
    // Verify the fixed signed scale fills exactly one half of the plot at its endpoints.
    it.each([
        [-3, 'negative', 50],
        [-1.5, 'negative', 25],
        [0, 'zero', 0],
        [1.5, 'positive', 25],
        [3, 'positive', 50]
    ] as const)('maps z=%s to a %s bar with %s percent half-height', (z, direction, halfHeightPercent) => {
        expect(signedBarGeometry(z)).toEqual({ direction, halfHeightPercent, clipped: false });
    });

    // Clip only geometry outside the shared domain and keep absent or nonfinite values unavailable.
    it('marks clipped endpoints and rejects unavailable values', () => {
        expect(signedBarGeometry(4)).toEqual({ direction: 'positive', halfHeightPercent: 50, clipped: true });
        expect(signedBarGeometry(-4)).toEqual({ direction: 'negative', halfHeightPercent: 50, clipped: true });
        expect(signedBarGeometry(Number.NaN)).toBeNull();
        expect(signedBarGeometry(undefined)).toBeNull();
    });

    // Preserve zero-attempt and invalid-score states even when the server includes standardized score data.
    it('keeps absent attempt bars separate from zero-valued and nonfinite z-scores', () => {
        expect(strengthDatum(rankedPlayer({ fgPct: 0, z: { fgPct: 0 } }), 'fgPct')).toEqual({
            state: 'scored',
            z: 0,
            geometry: { direction: 'zero', halfHeightPercent: 0, clipped: false }
        });
        expect(strengthDatum(rankedPlayer({ z: { pts: Number.NaN } }), 'pts')).toEqual({ state: 'unavailable' });
    });

    // Do not plot a zero-attempt percentage even when its standardized neutral impact has a score.
    it('labels no-attempt percentages separately and keeps other missing scores unavailable', () => {
        const player = rankedPlayer({ fgPct: null, z: { fgPct: -0.7, pts: Number.NaN } });
        expect(strengthDatum(player, 'fgPct')).toEqual({ state: 'no-attempts' });
        expect(strengthDatum(player, 'pts')).toEqual({ state: 'unavailable' });
    });

    // Resolve summary ties in canonical category order and omit directions with no positive or negative terms.
    it('summarizes contribution extremes with canonical tie order', () => {
        const contributions = Object.fromEntries(CAT_KEYS.map((cat) => [cat, 0])) as RankedPlayer['contributions'];
        contributions!.pts = 1.25;
        contributions!.trb = 1.25;
        contributions!.ast = -0.75;
        contributions!.stl = -0.75;
        const summary = contributionSummary(rankedPlayer({ composite: 0.5, contributions }), CAT_KEYS);

        expect(summary).toEqual({
            largestPositive: { cat: 'pts', value: 1.25 },
            mostNegative: { cat: 'ast', value: -0.75 },
            total: 0.5
        });
        expect(contributionSummary(rankedPlayer({ composite: 0, contributions: { pts: 0 } }), ['pts'])).toEqual({
            largestPositive: undefined,
            mostNegative: undefined,
            total: 0
        });
    });

    // Older or malformed payloads omit the entire contribution explanation rather than showing partial totals.
    it('requires a complete finite contribution map and formats signed values', () => {
        expect(contributionSummary(rankedPlayer({ contributions: { pts: 1 } }), ['pts', 'trb'])).toBeNull();
        expect(
            contributionSummary(rankedPlayer({ contributions: { pts: Number.POSITIVE_INFINITY } }), ['pts'])
        ).toBeNull();
        expect(
            contributionSummary(rankedPlayer({ composite: Number.NaN, contributions: { pts: 1 } }), ['pts'])
        ).toBeNull();
        expect(formatSignedValue(1.236)).toBe('+1.24');
        expect(formatSignedValue(-1.236)).toBe('−1.24');
    });
});
