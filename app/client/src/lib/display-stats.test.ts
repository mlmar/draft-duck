import { describe, expect, it } from 'vitest';
import { formatDisplayedCatStat } from './format-stats';
import { readDisplayStatsMode, writeDisplayStatsMode } from './display-stats';
import type { RankedPlayer } from '@draft-duck/core';

function player(overrides: Partial<RankedPlayer> = {}): RankedPlayer {
    return {
        playerId: 'a',
        name: 'A',
        team: 'TST',
        pos: 'G',
        age: 25,
        games: 82,
        mp: 2000,
        pts: 10,
        trb: 4,
        ast: 2,
        stl: 1,
        blk: 1,
        fg3: 2,
        fg3a: 4,
        fg: 5,
        fga: 10,
        fgPct: 0.5,
        ft: 1,
        fta: 2,
        ftPct: 0.5,
        tov: 1,
        z: { pts: 0 },
        composite: 0,
        rank: 1,
        fitRank: 1,
        consensusRank: 1,
        ...overrides
    };
}

describe('display stats preference', () => {
    it('defaults missing and invalid values to per game', () => {
        expect(readDisplayStatsMode({ getItem: () => null })).toBe('perGame');
        expect(readDisplayStatsMode({ getItem: () => 'per-minute' })).toBe('perGame');
    });

    it('reads and writes each supported mode', () => {
        const values = new Map<string, string>();
        const storage = {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value)
        };
        for (const mode of ['perGame', 'per36', 'totals'] as const) {
            writeDisplayStatsMode(mode, storage);
            expect(readDisplayStatsMode(storage)).toBe(mode);
        }
    });

    it('falls back when storage is unavailable', () => {
        expect(
            readDisplayStatsMode({
                getItem: () => {
                    throw new Error('denied');
                }
            })
        ).toBe('perGame');
        expect(() =>
            writeDisplayStatsMode('totals', {
                setItem: () => {
                    throw new Error('denied');
                }
            })
        ).not.toThrow();
    });

    it('formats percentages and uses a legacy raw line only for its ranking mode', () => {
        const legacy = player();
        expect(formatDisplayedCatStat(legacy, 'fgPct', 'perGame', 'perGame')).toBe('50.0%');
        expect(formatDisplayedCatStat(legacy, 'pts', 'per36', 'perGame')).toBe('-');
        expect(formatDisplayedCatStat(legacy, 'pts', 'perGame', 'totals')).toBe('-');
    });

    it('formats the selected mode raw values independently of ranking values', () => {
        const ranked = player({
            pts: 99,
            rawStatsByMode: {
                perGame: { pts: 10, trb: 4, ast: 2, stl: 1, blk: 1, fg3: 2, fgPct: 0.5, ftPct: 0.5, tov: 1 },
                per36: { pts: 18, trb: 7, ast: 4, stl: 2, blk: 2, fg3: 3, fgPct: 0.5, ftPct: 0.5, tov: 2 },
                totals: { pts: 820, trb: 328, ast: 164, stl: 82, blk: 82, fg3: 164, fgPct: 0.5, ftPct: 0.5, tov: 82 }
            }
        });
        expect(formatDisplayedCatStat(ranked, 'pts', 'perGame', 'totals')).toBe('10.0');
        expect(formatDisplayedCatStat(ranked, 'pts', 'per36', 'totals')).toBe('18.0');
        expect(formatDisplayedCatStat(ranked, 'pts', 'totals', 'totals')).toBe('820.0');
        expect(ranked.pts).toBe(99);
    });
});
