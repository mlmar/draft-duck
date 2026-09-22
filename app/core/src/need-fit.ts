import { formatSignedScore } from './cat-highlight.ts';
import { CAT_LABELS, type CatKey, type DraftProfile, type RankedPlayer } from './types.ts';

const ELITE_Z = 1;
const LIGHT_Z = -0.5;
const POOR_PUNT_Z = -0.75;

export function needCats(profile: DraftProfile): CatKey[] {
    return profile.enabledCats.filter((cat) => (profile.stances[cat] ?? 'neutral') === 'need');
}

export function puntCats(profile: DraftProfile): CatKey[] {
    return profile.enabledCats.filter((cat) => profile.stances[cat] === 'punt');
}

// Display only. Hidden when the profile has no Need cats, including Balanced.
export function needCatFit(player: RankedPlayer, profile: DraftProfile): number | null {
    const cats = needCats(profile);
    if (cats.length === 0) return null;
    const zs = cats.map((cat) => player.z[cat]).filter((z): z is number => typeof z === 'number' && Number.isFinite(z));
    if (zs.length === 0) return null;
    const raw = zs.reduce((sum, z) => sum + z, 0) / zs.length;
    return Math.min(100, Math.max(0, Math.round(50 + 25 * raw)));
}

function zOf(player: RankedPlayer, cat: CatKey): number | null {
    const z = player.z[cat];
    if (typeof z !== 'number' || !Number.isFinite(z)) return null;
    return z;
}

// One honest line from z + stances. No roster-impact fiction.
export function whyCopy(player: RankedPlayer, profile: DraftProfile): string {
    const need = needCats(profile);
    const punt = puntCats(profile);

    const elite = need.filter((cat) => {
        const z = zOf(player, cat);
        return z !== null && z >= ELITE_Z;
    });
    if (elite.length > 0) {
        return `Elite ${elite.map((cat) => CAT_LABELS[cat]).join(', ')} for this build.`;
    }

    const light = need.filter((cat) => {
        const z = zOf(player, cat);
        return z !== null && z <= LIGHT_Z;
    });
    if (light.length > 0) {
        return `Light on ${light.map((cat) => CAT_LABELS[cat]).join(', ')}, which you marked Need.`;
    }

    const poorPunt = punt.find((cat) => {
        const z = zOf(player, cat);
        return z !== null && z <= POOR_PUNT_Z;
    });
    if (poorPunt) {
        return `Poor ${CAT_LABELS[poorPunt]} matches your punt.`;
    }

    const strongestNeed = [...need]
        .map((cat) => ({ cat, z: zOf(player, cat) }))
        .filter((entry): entry is { cat: CatKey; z: number } => entry.z !== null)
        .sort((a, b) => b.z - a.z)[0];
    if (strongestNeed) {
        return `${CAT_LABELS[strongestNeed.cat]} ${formatSignedScore(strongestNeed.z)} for this build.`;
    }

    return 'Fits the board order for this profile.';
}

export type FitMark = {
    text: string;
    muted: boolean;
};

// Need cats first, then punted cats as ignored. Cap at three so a card stays scannable.
export function fitMarks(player: RankedPlayer, profile: DraftProfile): FitMark[] {
    const marks: FitMark[] = [];
    for (const cat of needCats(profile)) {
        if (marks.length >= 3) break;
        marks.push({ text: `${CAT_LABELS[cat]} ${formatSignedScore(zOf(player, cat))}`, muted: false });
    }
    for (const cat of puntCats(profile)) {
        if (marks.length >= 3) break;
        marks.push({ text: `${CAT_LABELS[cat]} ignored`, muted: true });
    }
    return marks;
}
