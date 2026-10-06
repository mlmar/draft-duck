import { overallPicksForDraft, partitionByRound, type DraftProfile, type RankedPlayer } from '@draft-duck/core';
import { applyDisplayCap } from '@/lib/display-cap';

// Retain authoritative rank and round order when filtering board players.
export function boardPlayerGroups(
    players: RankedPlayer[],
    profile: DraftProfile,
    options: { query: string; yourPicksOnly: boolean; assist: boolean; showRest: boolean }
) {
    const query = options.query.trim().toLowerCase();
    const filter = (rows: RankedPlayer[]) =>
        rows.filter((player) => !query || player.name.toLowerCase().includes(query));
    if (options.yourPicksOnly && profile.draftSlot) {
        const picks = overallPicksForDraft(profile).flatMap((overall) => {
            const player = players[overall - 1];
            return player ? [player] : [];
        });
        return { groups: [{ id: 'picks', players: filter(picks) }], hiddenCount: 0 };
    }
    const groups = options.assist
        ? partitionByRound(players, profile.leagueSize, profile.draftRounds)
              .map((section) => ({
                  id: `round-${section.round}`,
                  label: `Round ${section.round}`,
                  players: filter(section.players)
              }))
              .filter((group) => group.players.length > 0)
        : [{ id: 'board', players: filter(players) }];
    return applyDisplayCap(groups, {
        cap: profile.leagueSize * profile.draftRounds,
        lift: Boolean(query) || options.showRest,
        clipLastGroup: options.assist
    });
}
