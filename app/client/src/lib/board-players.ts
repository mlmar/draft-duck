import {
    CAT_LABELS,
    fitMarks,
    formatSignedScore,
    overallPicksForDraft,
    partitionByRound,
    type DraftProfile,
    type RankedPlayer
} from '@draft-duck/core';
import { applyDisplayCap } from '@/lib/display-cap';

// Both presentations consume the same filtered players, retaining authoritative rank and round order.
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

// Neutral builds still get a useful preview of their two strongest enabled categories.
export function playerPreviewMarks(player: RankedPlayer, profile: DraftProfile): string[] {
    const marks = fitMarks(player, profile);
    if (marks.length) return marks.map((mark) => mark.text);
    return profile.enabledCats
        .filter((cat) => !((cat === 'fgPct' || cat === 'ftPct') && player[cat] === null))
        .map((cat) => ({ cat, z: player.z[cat] }))
        .filter(
            (entry): entry is { cat: (typeof profile.enabledCats)[number]; z: number } =>
                typeof entry.z === 'number' && Number.isFinite(entry.z)
        )
        .sort((a, b) => b.z - a.z)
        .slice(0, 2)
        .map(({ cat, z }) => `${CAT_LABELS[cat]} ${formatSignedScore(z)}`);
}
