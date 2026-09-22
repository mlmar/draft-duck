import type { DraftProfile } from './types.ts';

export type OverallPickInput = {
    round: number;
    slot: number;
    leagueSize: number;
    draftType: 'snake' | 'linear';
};

// 1-based overall pick if everyone took BPA off this board. Slot does not feed the ranker.
export function overallPick({ round, slot, leagueSize, draftType }: OverallPickInput): number {
    if (draftType === 'linear' || round % 2 === 1) {
        return (round - 1) * leagueSize + slot;
    }
    return round * leagueSize - slot + 1;
}

export function overallPicksForDraft(profile: DraftProfile): number[] {
    if (!profile.draftSlot) return [];
    const picks: number[] = [];
    for (let round = 1; round <= profile.draftRounds; round++) {
        picks.push(
            overallPick({
                round,
                slot: profile.draftSlot,
                leagueSize: profile.leagueSize,
                draftType: profile.draftType
            })
        );
    }
    return picks;
}

export function ordinal(n: number): string {
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
    switch (n % 10) {
        case 1:
            return `${n}st`;
        case 2:
            return `${n}nd`;
        case 3:
            return `${n}rd`;
        default:
            return `${n}th`;
    }
}
