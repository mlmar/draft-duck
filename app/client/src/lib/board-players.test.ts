import { describe, expect, it } from 'vitest';
import { boardPlayerGroups } from './board-players';
import { overallPicksForDraft, type DraftProfile, type RankedPlayer } from '@draft-duck/core';

const profile: DraftProfile = {
    leagueSize: 8,
    draftRounds: 2,
    draftType: 'snake',
    draftSlot: 3,
    enabledCats: ['pts'],
    stances: {}
};
const players = Array.from(
    { length: 24 },
    (_, index) =>
        ({
            playerId: `p${index + 1}`,
            name: index === 22 ? 'Outside Cap' : `Player ${index + 1}`,
            rank: index + 1
        }) as RankedPlayer
);
const options = { query: '', yourPicksOnly: false, assist: false, showRest: false };
const ranks = (result: ReturnType<typeof boardPlayerGroups>) =>
    result.groups.flatMap((group) => group.players.map((player) => player.rank));

describe('shared board player selection', () => {
    it('caps the default board and exposes the remaining count without changing ranks', () => {
        const result = boardPlayerGroups(players, profile, options);
        expect(ranks(result)).toEqual(Array.from({ length: 16 }, (_, index) => index + 1));
        expect(result.hiddenCount).toBe(8);
        expect(ranks(boardPlayerGroups(players, profile, { ...options, showRest: true }))).toHaveLength(24);
    });
    it('searches beyond the display cap and preserves authoritative rank', () => {
        const result = boardPlayerGroups(players, profile, { ...options, query: ' OUTSIDE ' });
        expect(ranks(result)).toEqual([23]);
        expect(result.hiddenCount).toBe(0);
    });
    it('applies the same search to your picks, including snake order', () => {
        const picks = overallPicksForDraft(profile);
        expect(ranks(boardPlayerGroups(players, profile, { ...options, yourPicksOnly: true }))).toEqual(picks);
        expect(
            ranks(boardPlayerGroups(players, profile, { ...options, yourPicksOnly: true, query: `Player ${picks[1]}` }))
        ).toEqual([picks[1]]);
        expect(
            ranks(boardPlayerGroups(players, profile, { ...options, yourPicksOnly: true, query: 'Outside Cap' }))
        ).toEqual([]);
    });
    it('keeps the same players when grouped by round and expands the final round', () => {
        const grouped = boardPlayerGroups(players, profile, { ...options, assist: true });
        expect(ranks(grouped)).toEqual(ranks(boardPlayerGroups(players, profile, options)));
        expect(grouped.groups.map((group) => group.players.length)).toEqual([8, 8]);
        expect(
            boardPlayerGroups(players, profile, { ...options, assist: true, showRest: true }).groups.map(
                (group) => group.players.length
            )
        ).toEqual([8, 16]);
    });
    it('falls back to all players for legacy preferences without a draft slot', () => {
        const { draftSlot: _, ...withoutSlot } = profile;
        expect(ranks(boardPlayerGroups(players, withoutSlot, { ...options, yourPicksOnly: true }))).toEqual(
            ranks(boardPlayerGroups(players, withoutSlot, options))
        );
    });
    it('returns an empty result for a missing name in grouped mode', () => {
        expect(boardPlayerGroups(players, profile, { ...options, assist: true, query: 'Missing name' }).groups).toEqual(
            []
        );
    });
});
