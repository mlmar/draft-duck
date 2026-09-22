import type { CatKey, DraftProfile, RankedPlayer } from './types.ts';

// Display-only. Strategies turn a player+cat into a signed score for heat and +/-.
// Ranking math stays in ranker.ts. Swap modes here, not in table markup.

export const CAT_HIGHLIGHT_MODES = ['leagueZ', 'teamNeed'] as const;
export type CatHighlightMode = (typeof CAT_HIGHLIGHT_MODES)[number];

export const DEFAULT_CAT_HIGHLIGHT_MODE: CatHighlightMode = 'teamNeed';

export type CatHighlightInput = {
    player: RankedPlayer;
    cat: CatKey;
    profile: DraftProfile;
};

export type CatHighlightResult = {
    score: number | null;
    title: string;
};

export type CatHighlightStrategy = {
    id: CatHighlightMode;
    legend: { worse: string; average: string; better: string };
    score(input: CatHighlightInput): CatHighlightResult;
};

// Ranker z is already vs the filtered universe, with TOV flipped and % as volume-adjusted impact.
export const leagueZHighlight: CatHighlightStrategy = {
    id: 'leagueZ',
    legend: { worse: 'Worse', average: 'Average', better: 'Better' },
    score({ player, cat }) {
        // Null shot rates have no attempts. Do not paint them as a neutral z of 0 impact.
        if ((cat === 'fgPct' || cat === 'ftPct') && player[cat] === null) {
            return { score: null, title: 'No attempts' };
        }
        const z = player.z[cat];
        if (typeof z !== 'number' || !Number.isFinite(z)) {
            return { score: null, title: 'No z' };
        }
        return { score: z, title: `z ${z.toFixed(2)}` };
    }
};

// Same ramp as leagueZ. Punted cats stay uncolored so a Fortress board does not celebrate FT%.
export const teamNeedHighlight: CatHighlightStrategy = {
    id: 'teamNeed',
    legend: { worse: 'Worse', average: 'Average', better: 'Better' },
    score({ player, cat, profile }) {
        if ((profile.stances[cat] ?? 'neutral') === 'punt') {
            return { score: null, title: 'Punted' };
        }
        return leagueZHighlight.score({ player, cat, profile });
    }
};

export const CAT_HIGHLIGHT_STRATEGIES: Record<CatHighlightMode, CatHighlightStrategy> = {
    leagueZ: leagueZHighlight,
    teamNeed: teamNeedHighlight
};

export function catHighlightStrategy(mode: CatHighlightMode = DEFAULT_CAT_HIGHLIGHT_MODE): CatHighlightStrategy {
    return CAT_HIGHLIGHT_STRATEGIES[mode];
}

export const HEAT_DEAD_ZONE = 0.25;
export const HEAT_CLAMP = 2;

export type HeatRamp = {
    sign: 1 | -1;
    intensity: number;
};

// Shared ramp. Strategies return scores on this scale. Average stays uncolored so zebra still reads.
export function heatFromScore(score: number | null): HeatRamp | null {
    if (score === null || !Number.isFinite(score)) return null;
    const abs = Math.abs(score);
    if (abs < HEAT_DEAD_ZONE) return null;
    const clamped = Math.min(HEAT_CLAMP, abs);
    return {
        sign: score > 0 ? 1 : -1,
        intensity: clamped / HEAT_CLAMP
    };
}

// Numeric face of the same signed score the ramp colors. Not NBA box-score plus-minus.
export function formatSignedScore(score: number | null): string {
    if (score === null || !Number.isFinite(score)) return '-';
    const body = Math.abs(score).toFixed(2);
    if (score > 0) return `+${body}`;
    if (score < 0) return `-${body}`;
    return body;
}
