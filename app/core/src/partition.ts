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
        const players = ranked.slice(start, start + leagueSize);
        // High draftRounds runs past the universe. Later windows are empty too.
        if (players.length === 0) break;
        sections.push({ round, players });
    }
    // Last round keeps everyone past a full roster so late names are not dropped.
    const last = ranked.slice((draftRounds - 1) * leagueSize);
    if (last.length > 0) {
        sections.push({
            round: draftRounds,
            players: last
        });
    }
    return sections;
}
