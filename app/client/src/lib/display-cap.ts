import type { PlayerTableGroup } from '@/components/draft/player-table';

type DisplayCapOptions = {
    cap: number;
    // Search and "show rest" both lift the cap so a name past the roster can still surface.
    lift: boolean;
    // Assistance: only the last round dump is clipped. Unaided: clip the whole list.
    clipLastGroup: boolean;
};

export function applyDisplayCap(
    groups: PlayerTableGroup[],
    { cap, lift, clipLastGroup }: DisplayCapOptions
): { groups: PlayerTableGroup[]; hiddenCount: number } {
    if (lift || groups.length === 0) {
        return { groups, hiddenCount: 0 };
    }

    if (!clipLastGroup) {
        const [head, ...rest] = groups;
        if (!head) return { groups, hiddenCount: 0 };
        const hiddenCount = Math.max(0, head.players.length - cap);
        if (hiddenCount === 0) return { groups, hiddenCount: 0 };
        return {
            groups: [{ ...head, players: head.players.slice(0, cap) }, ...rest],
            hiddenCount
        };
    }

    const last = groups[groups.length - 1];
    if (!last) return { groups, hiddenCount: 0 };
    const earlier = groups.slice(0, -1);
    const used = earlier.reduce((sum, group) => sum + group.players.length, 0);
    const keep = Math.max(0, cap - used);
    const hiddenCount = Math.max(0, last.players.length - keep);
    return {
        groups: [...earlier, { ...last, players: last.players.slice(0, keep) }],
        hiddenCount
    };
}
