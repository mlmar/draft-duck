import { CAT_LABELS, type ArchetypeId, type CatKey, type CatStance, type DraftProfile } from './types.ts';

export type NamedBuildId = Exclude<ArchetypeId, 'custom'>;

export type NamedBuild = {
    id: NamedBuildId;
    label: string;
    need: CatKey[];
    punt: CatKey[];
};

// Gallery order. Custom is not a seventh map. It is a blank form after this list.
export const NAMED_BUILD_IDS: NamedBuildId[] = ['balanced', 'puntFg', 'puntFt', 'guards', 'stocks', 'puntAst'];

export const NAMED_BUILDS: Record<NamedBuildId, NamedBuild> = {
    balanced: { id: 'balanced', label: 'Balanced', need: [], punt: [] },
    puntFg: { id: 'puntFg', label: 'Bricks', need: ['trb', 'blk', 'ftPct'], punt: ['fgPct'] },
    puntFt: { id: 'puntFt', label: 'Fortress', need: ['fgPct', 'trb', 'blk', 'pts'], punt: ['ftPct'] },
    guards: { id: 'guards', label: 'Sniper', need: ['pts', 'fg3', 'ftPct', 'ast', 'stl'], punt: ['blk'] },
    stocks: { id: 'stocks', label: 'Stocks', need: ['stl', 'blk'], punt: ['pts'] },
    puntAst: { id: 'puntAst', label: 'Post', need: ['pts', 'trb', 'blk', 'fgPct'], punt: ['ast'] }
};

export const ARCHETYPE_LABELS: Record<ArchetypeId, string> = {
    balanced: 'Balanced',
    puntFg: 'Bricks',
    puntFt: 'Fortress',
    guards: 'Sniper',
    stocks: 'Stocks',
    puntAst: 'Post',
    custom: 'Custom'
};

export function isNamedBuildId(id: string): id is NamedBuildId {
    return id in NAMED_BUILDS;
}

// Hide a card whose punt cat is off, or whose Need cats are all off. Balanced always shows.
export function isNamedBuildVisible(id: NamedBuildId, enabledCats: readonly CatKey[]): boolean {
    const enabled = new Set(enabledCats);
    const build = NAMED_BUILDS[id];
    if (build.punt.some((cat) => !enabled.has(cat))) return false;
    if (build.need.length > 0 && build.need.every((cat) => !enabled.has(cat))) return false;
    return true;
}

export function namedBuildHelper(id: NamedBuildId, enabledCats: readonly CatKey[]): string {
    const build = NAMED_BUILDS[id];
    if (build.need.length === 0 && build.punt.length === 0) return 'All cats Neutral';
    const enabled = new Set(enabledCats);
    const need = build.need.filter((cat) => enabled.has(cat)).map((cat) => CAT_LABELS[cat]);
    const punt = build.punt.filter((cat) => enabled.has(cat)).map((cat) => CAT_LABELS[cat]);
    const parts: string[] = [];
    if (need.length > 0) parts.push(`Need ${need.join(', ')}`);
    if (punt.length > 0) parts.push(`Punt ${punt.join(', ')}`);
    return parts.join(' · ');
}

// Overwrite stances for every enabled cat. Disabled keys stay out of the map.
export function stancesForArchetype(
    id: ArchetypeId,
    enabledCats: readonly CatKey[]
): Partial<Record<CatKey, CatStance>> {
    const stances: Partial<Record<CatKey, CatStance>> = {};
    if (id === 'custom' || id === 'balanced') {
        for (const cat of enabledCats) stances[cat] = 'neutral';
        return stances;
    }
    const need = new Set(NAMED_BUILDS[id].need);
    const punt = new Set(NAMED_BUILDS[id].punt);
    for (const cat of enabledCats) {
        if (need.has(cat)) stances[cat] = 'need';
        else if (punt.has(cat)) stances[cat] = 'punt';
        else stances[cat] = 'neutral';
    }
    return stances;
}

export function archetypeLabel(id: ArchetypeId | undefined): string | null {
    if (!id) return null;
    return ARCHETYPE_LABELS[id];
}

// Board chrome. Old profiles omit the name rather than guessing from chips.
export function profileHeadline(profile: DraftProfile): string {
    const parts: string[] = [];
    const label = archetypeLabel(profile.archetypeId);
    if (label) parts.push(label);
    parts.push(`${profile.leagueSize}-team ${profile.draftType}`);
    if (profile.draftSlot) parts.push(`pick ${profile.draftSlot}`);
    return parts.join(' · ');
}

export function restoreSummary(profile: DraftProfile): string {
    const label = archetypeLabel(profile.archetypeId) ?? 'Custom';
    const punts = profile.enabledCats.filter((cat) => profile.stances[cat] === 'punt').map((cat) => CAT_LABELS[cat]);
    if (punts.length === 0) return label;
    return `${label} · punt ${punts.join(', ')}`;
}
