import { NAMED_BUILD_IDS, NAMED_BUILDS, stancesForArchetype, type NamedBuildId } from './named-builds.ts';
import type { ArchetypeId, CatKey, CatStance, DraftProfile } from './types.ts';

export const TUNER_MAX = 3;
export const TUNER_PUNT = 0;
export const TUNER_NEUTRAL = 1;
export const TUNER_COMPLEMENT = 1.25;
export const TUNER_NEED = 1.5;

const TUNER_EPS = 1e-6;

export function clampTuner(value: number): number {
    if (!Number.isFinite(value)) return TUNER_NEUTRAL;
    return Math.min(TUNER_MAX, Math.max(TUNER_PUNT, value));
}

export function sameTuner(left: number, right: number): boolean {
    return Math.abs(left - right) < TUNER_EPS;
}

export function formatTuner(value: number): string {
    const rounded = Math.round(clampTuner(value) * 100) / 100;
    if (Number.isInteger(rounded)) return rounded.toFixed(1);
    const tenth = Math.round(rounded * 10) / 10;
    if (sameTuner(tenth, rounded)) return tenth.toFixed(1);
    return rounded.toFixed(2);
}

// Invert named-build Need lists. Punt FT% borrows Fortress Need, and so on.
export function complementsOfPunt(puntCat: CatKey): CatKey[] {
    const cats = new Set<CatKey>();
    for (const id of NAMED_BUILD_IDS) {
        const build = NAMED_BUILDS[id];
        if (!build.punt.includes(puntCat)) continue;
        for (const cat of build.need) cats.add(cat);
    }
    return [...cats];
}

export function complementCats(
    stances: Partial<Record<CatKey, CatStance>>,
    enabledCats: readonly CatKey[]
): Set<CatKey> {
    const enabled = new Set(enabledCats);
    const union = new Set<CatKey>();
    for (const cat of enabledCats) {
        if ((stances[cat] ?? 'neutral') !== 'punt') continue;
        for (const complement of complementsOfPunt(cat)) {
            if (!enabled.has(complement)) continue;
            if ((stances[complement] ?? 'neutral') === 'punt') continue;
            union.add(complement);
        }
    }
    return union;
}

// Custom has no preset. Callers pass Need / Neutral / Punt when writing a chip.
export function presetTuner(
    cat: CatKey,
    stances: Partial<Record<CatKey, CatStance>>,
    enabledCats: readonly CatKey[],
    stance: CatStance = stances[cat] ?? 'neutral'
): number {
    if (stance === 'punt') return TUNER_PUNT;
    if (stance === 'need') return TUNER_NEED;
    const asNeutral: Partial<Record<CatKey, CatStance>> = { ...stances, [cat]: 'neutral' };
    return complementCats(asNeutral, enabledCats).has(cat) ? TUNER_COMPLEMENT : TUNER_NEUTRAL;
}

export function tunersForStances(
    stances: Partial<Record<CatKey, CatStance>>,
    enabledCats: readonly CatKey[],
    intensity: Partial<Record<CatKey, number>> = {}
): Partial<Record<CatKey, number>> {
    const next: Partial<Record<CatKey, number>> = {};
    for (const cat of enabledCats) {
        const stance = stances[cat] ?? 'neutral';
        if (stance === 'custom') {
            next[cat] = clampTuner(intensity[cat] ?? presetTuner(cat, stances, enabledCats, 'neutral'));
        } else {
            next[cat] = presetTuner(cat, stances, enabledCats, stance);
        }
    }
    return next;
}

export function tunersForArchetype(id: ArchetypeId, enabledCats: readonly CatKey[]): Partial<Record<CatKey, number>> {
    return tunersForStances(stancesForArchetype(id, enabledCats), enabledCats);
}

export function resolveTuner(
    profile: Pick<DraftProfile, 'enabledCats' | 'stances' | 'intensity'>,
    cat: CatKey
): number {
    const stored = profile.intensity?.[cat];
    if (typeof stored === 'number' && Number.isFinite(stored)) return clampTuner(stored);
    return presetTuner(cat, profile.stances, profile.enabledCats);
}

export function applyCatStance(
    stances: Partial<Record<CatKey, CatStance>>,
    intensity: Partial<Record<CatKey, number>>,
    cat: CatKey,
    stance: Exclude<CatStance, 'custom'>,
    enabledCats: readonly CatKey[]
): { stances: Partial<Record<CatKey, CatStance>>; intensity: Partial<Record<CatKey, number>> } {
    const nextStances = { ...stances, [cat]: stance };
    return { stances: nextStances, intensity: tunersForStances(nextStances, enabledCats, intensity) };
}

export function applyCatTuner(
    stances: Partial<Record<CatKey, CatStance>>,
    intensity: Partial<Record<CatKey, number>>,
    cat: CatKey,
    tuner: number,
    enabledCats: readonly CatKey[]
): { stances: Partial<Record<CatKey, CatStance>>; intensity: Partial<Record<CatKey, number>> } {
    if ((stances[cat] ?? 'neutral') === 'punt') {
        return { stances, intensity: { ...intensity, [cat]: TUNER_PUNT } };
    }
    const value = clampTuner(tuner);
    const stance = stances[cat] ?? 'neutral';
    let nextStances = stances;
    if (stance !== 'custom' && !sameTuner(value, presetTuner(cat, stances, enabledCats, stance))) {
        nextStances = { ...stances, [cat]: 'custom' };
    }
    return { stances: nextStances, intensity: { ...intensity, [cat]: value } };
}

export function hasCustomCat(stances: Partial<Record<CatKey, CatStance>>, enabledCats: readonly CatKey[]): boolean {
    return enabledCats.some((cat) => stances[cat] === 'custom');
}

export function stancesMatchNamed(
    stances: Partial<Record<CatKey, CatStance>>,
    id: NamedBuildId,
    enabledCats: readonly CatKey[]
): boolean {
    const expected = stancesForArchetype(id, enabledCats);
    return enabledCats.every((cat) => (stances[cat] ?? 'neutral') === (expected[cat] ?? 'neutral'));
}
