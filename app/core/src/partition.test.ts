import { describe, expect, it } from 'vitest';
import { partitionByRound } from './partition.ts';

describe('partitionByRound', () => {
    it('uses league-size windows and dumps the tail into the last round', () => {
        const ranked = Array.from({ length: 200 }, (_, index) => index + 1);
        const sections = partitionByRound(ranked, 12, 13);

        expect(sections).toHaveLength(13);
        expect(sections.slice(0, 12).every((section) => section.players.length === 12)).toBe(true);
        expect(sections[0]?.players).toEqual(ranked.slice(0, 12));
        // Round 5 is ranks 49-60 on a 12-team board.
        expect(sections[4]).toEqual({ round: 5, players: ranked.slice(48, 60) });
        expect(sections[12]).toEqual({ round: 13, players: ranked.slice(144) });
        expect(sections[12]?.players).toHaveLength(56);
    });

    it('keeps the whole board in round 1 when there is only one round', () => {
        expect(partitionByRound([1, 2, 3], 12, 1)).toEqual([{ round: 1, players: [1, 2, 3] }]);
    });

    it('emits empty subsections when the universe is shorter than a full draft', () => {
        const ranked = [1, 2, 3];
        const sections = partitionByRound(ranked, 12, 13);
        expect(sections).toHaveLength(13);
        expect(sections[0]?.players).toEqual([1, 2, 3]);
        expect(sections[1]?.players).toEqual([]);
        expect(sections[12]?.players).toEqual([]);
    });

    it('returns no sections for empty rounds or size', () => {
        expect(partitionByRound([1], 12, 0)).toEqual([]);
        expect(partitionByRound([1], 0, 13)).toEqual([]);
    });
});
