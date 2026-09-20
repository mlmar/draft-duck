// Slice a ranked board into draft-round buckets. Width is league size, not the user's slot.

export type RoundSection<T> = {
    round: number;
    players: T[];
};

export function partitionByRound<T>(ranked: T[], leagueSize: number, draftRounds: number): RoundSection<T>[] {
    if (draftRounds < 1 || leagueSize < 1) return [];

    const sections: RoundSection<T>[] = [];
    // Rounds 1..N-1 are equal BPA windows. Snake vs linear does not change who sits in a round on this board.
    for (let round = 1; round < draftRounds; round++) {
        const start = (round - 1) * leagueSize;
        sections.push({ round, players: ranked.slice(start, start + leagueSize) });
    }
    // Last round keeps everyone past a full roster so late names are not dropped.
    sections.push({
        round: draftRounds,
        players: ranked.slice((draftRounds - 1) * leagueSize)
    });
    return sections;
}
