import { CAT_KEYS, type CatKey, type RankedPlayer } from '@draft-duck/core';

// Use one shared endpoint so every player's signed chart can be compared on the same scale.
export const PLAYER_STRENGTH_LIMIT = 3;

// Describe bar direction and height separately from exact score text and clipping state.
export type SignedBarGeometry = {
    direction: 'positive' | 'negative' | 'zero';
    halfHeightPercent: number;
    clipped: boolean;
};

// Keep raw-rate, unavailable, and scored states distinct so the UI never invents a missing bar.
export type StrengthDatum =
    { state: 'scored'; z: number; geometry: SignedBarGeometry } | { state: 'no-attempts' } | { state: 'unavailable' };

// Store summary extremes and authoritative composite for the below-chart contribution explanation.
export type ContributionSummary = {
    largestPositive?: { cat: CatKey; value: number };
    mostNegative?: { cat: CatKey; value: number };
    total: number;
};

// Build a fixed symmetric signed bar while retaining whether its exact value exceeds the visible scale.
export function signedBarGeometry(z: number | null | undefined): SignedBarGeometry | null {
    if (z === null || z === undefined || !Number.isFinite(z)) return null;

    const clippedZ = Math.min(PLAYER_STRENGTH_LIMIT, Math.max(-PLAYER_STRENGTH_LIMIT, z));
    return {
        direction: clippedZ > 0 ? 'positive' : clippedZ < 0 ? 'negative' : 'zero',
        halfHeightPercent: (Math.abs(clippedZ) / PLAYER_STRENGTH_LIMIT) * 50,
        clipped: Math.abs(z) > PLAYER_STRENGTH_LIMIT
    };
}

// Treat missing attempts separately from missing z-scores so a null rate never draws a misleading bar.
export function strengthDatum(player: RankedPlayer, cat: CatKey): StrengthDatum {
    if ((cat === 'fgPct' || cat === 'ftPct') && player[cat] === null) return { state: 'no-attempts' };

    const z = player.z[cat];
    const geometry = signedBarGeometry(z);
    return geometry && typeof z === 'number' ? { state: 'scored', z, geometry } : { state: 'unavailable' };
}

// Require one finite server contribution for each displayed category before showing any score breakdown.
export function contributionSummary(
    player: Pick<RankedPlayer, 'composite' | 'contributions'>,
    enabledCats: readonly CatKey[]
): ContributionSummary | null {
    const cats = CAT_KEYS.filter((cat) => enabledCats.includes(cat));
    const contributions = player.contributions;
    if (!contributions || cats.length === 0 || !Number.isFinite(player.composite)) return null;
    if (cats.some((cat) => !Number.isFinite(contributions[cat]))) return null;

    let largestPositive: ContributionSummary['largestPositive'];
    let mostNegative: ContributionSummary['mostNegative'];
    for (const cat of cats) {
        const value = contributions[cat]!;
        if (value > 0 && (!largestPositive || value > largestPositive.value)) largestPositive = { cat, value };
        if (value < 0 && (!mostNegative || value < mostNegative.value)) mostNegative = { cat, value };
    }

    return { largestPositive, mostNegative, total: player.composite };
}

// Keep signed values readable in prose while distinguishing positive, negative, and zero values.
export function formatSignedValue(value: number): string {
    return `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(2)}`;
}
