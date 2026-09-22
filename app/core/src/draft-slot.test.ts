import { describe, expect, it } from 'vitest';
import { ordinal, overallPick, overallPicksForDraft } from './draft-slot.ts';
import { CAT_KEYS, type DraftProfile } from './types.ts';

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

describe('overallPick', () => {
    it('maps pick 7 in a 12-team snake to 7, 18, 31, 42', () => {
        const input = { slot: 7, leagueSize: 12, draftType: 'snake' as const };
        expect(overallPick({ ...input, round: 1 })).toBe(7);
        expect(overallPick({ ...input, round: 2 })).toBe(18);
        expect(overallPick({ ...input, round: 3 })).toBe(31);
        expect(overallPick({ ...input, round: 4 })).toBe(42);
    });

    it('keeps linear order the same every round', () => {
        const input = { slot: 7, leagueSize: 12, draftType: 'linear' as const };
        expect(overallPick({ ...input, round: 1 })).toBe(7);
        expect(overallPick({ ...input, round: 2 })).toBe(19);
        expect(overallPick({ ...input, round: 3 })).toBe(31);
    });
});

describe('overallPicksForDraft', () => {
    it('returns no picks when the slot is missing so old profiles stay unlabeled', () => {
        expect(overallPicksForDraft(profile())).toEqual([]);
    });

    it('emits one overall pick per round when the slot is set', () => {
        expect(overallPicksForDraft(profile({ draftSlot: 7 })).slice(0, 4)).toEqual([7, 18, 31, 42]);
    });
});

describe('ordinal', () => {
    it('handles first, second, third, and the teens', () => {
        expect(ordinal(1)).toBe('1st');
        expect(ordinal(2)).toBe('2nd');
        expect(ordinal(7)).toBe('7th');
        expect(ordinal(11)).toBe('11th');
        expect(ordinal(22)).toBe('22nd');
    });
});
