import {
    CAT_KEYS,
    isNamedBuildId,
    isNamedBuildVisible,
    stancesForArchetype,
    type ArchetypeId,
    type CatKey,
    type CatStance,
    type DraftProfile
} from '@draft-duck/core';

// In-progress quiz shape plus conversions to DraftProfile. Skip intensity omits that field from the saved payload.

export type CatPreset = '9cat' | '8cat' | 'custom';

export type QuizDraft = {
    leagueSize: 8 | 10 | 12 | 14;
    draftRounds: number;
    draftType: 'snake' | 'linear';
    preset: CatPreset;
    enabledCats: CatKey[];
    stances: Partial<Record<CatKey, CatStance>>;
    intensity: Partial<Record<CatKey, number>>;
    // Skip Fine-tune leaves this false so the saved profile omits intensity.
    includeIntensity: boolean;
    draftSlot?: number;
    archetypeId: ArchetypeId | null;
};

export const DEFAULT_QUIZ_DRAFT: QuizDraft = {
    leagueSize: 12,
    draftRounds: 13,
    draftType: 'snake',
    preset: '9cat',
    enabledCats: [...CAT_KEYS],
    stances: {},
    intensity: {},
    includeIntensity: false,
    archetypeId: null
};

const EIGHT_CAT_KEYS = CAT_KEYS.filter((cat) => cat !== 'tov');

export function catsForPreset(preset: CatPreset, customCats: CatKey[] = [...CAT_KEYS]): CatKey[] {
    if (preset === '9cat') return [...CAT_KEYS];
    if (preset === '8cat') return [...EIGHT_CAT_KEYS];
    return customCats.length > 0 ? [...customCats] : [...CAT_KEYS];
}

// Drop stances and intensity for cats the user turned off so they cannot leak into the payload.
function keepEnabled<T>(record: Partial<Record<CatKey, T>>, enabledCats: CatKey[]): Partial<Record<CatKey, T>> {
    const next: Partial<Record<CatKey, T>> = {};
    for (const cat of enabledCats) {
        const value = record[cat];
        if (value !== undefined) next[cat] = value;
    }
    return next;
}

function sameCats(left: readonly CatKey[], right: readonly CatKey[]): boolean {
    if (left.length !== right.length) return false;
    const rightSet = new Set(right);
    return left.every((cat) => rightSet.has(cat));
}

export function applyPreset(draft: QuizDraft, preset: CatPreset, customCats?: CatKey[]): QuizDraft {
    const enabledCats = catsForPreset(preset, customCats ?? draft.enabledCats);
    const next: QuizDraft = {
        ...draft,
        preset,
        enabledCats,
        stances: keepEnabled(draft.stances, enabledCats),
        intensity: keepEnabled(draft.intensity, enabledCats)
    };
    if (next.draftSlot && next.draftSlot > next.leagueSize) {
        next.draftSlot = next.leagueSize;
    }
    if (next.archetypeId && isNamedBuildId(next.archetypeId) && !isNamedBuildVisible(next.archetypeId, enabledCats)) {
        // Keep stance-bar edits unless the named card itself no longer fits the cats.
        return { ...next, archetypeId: null };
    }
    return next;
}

export function setCustomCats(draft: QuizDraft, enabledCats: CatKey[]): QuizDraft {
    return applyPreset({ ...draft, enabledCats }, 'custom', enabledCats);
}

// Overwrite every enabled cat. Named cards skip Fine-tune. Custom is a blank Neutral form.
// Drop intensity so a later Custom Fine-tune cannot revive the previous slider map.
export function applyArchetype(draft: QuizDraft, id: ArchetypeId): QuizDraft {
    return {
        ...draft,
        archetypeId: id,
        stances: stancesForArchetype(id, draft.enabledCats),
        includeIntensity: false,
        intensity: {}
    };
}

export function setDraftSlot(draft: QuizDraft, draftSlot: number): QuizDraft {
    if (!Number.isInteger(draftSlot) || draftSlot < 1) {
        return { ...draft, draftSlot: undefined };
    }
    return { ...draft, draftSlot: Math.min(draftSlot, draft.leagueSize) };
}

// DraftProfile is the persist and API shape. Intensity is omitted unless Fine-tune changed a slider.
export function quizDraftToProfile(draft: QuizDraft): DraftProfile {
    const profile: DraftProfile = {
        leagueSize: draft.leagueSize,
        draftRounds: draft.draftRounds,
        draftType: draft.draftType,
        enabledCats: [...draft.enabledCats],
        stances: keepEnabled(draft.stances, draft.enabledCats)
    };
    if (draft.draftSlot) profile.draftSlot = draft.draftSlot;
    if (draft.archetypeId) profile.archetypeId = draft.archetypeId;
    if (!draft.includeIntensity) return profile;

    const intensity: Partial<Record<CatKey, number>> = {};
    for (const cat of draft.enabledCats) {
        if ((draft.stances[cat] ?? 'neutral') === 'punt') continue;
        intensity[cat] = draft.intensity[cat] ?? 1;
    }
    profile.intensity = intensity;
    return profile;
}

export function profileToQuizDraft(profile: DraftProfile): QuizDraft {
    const enabledCats = [...new Set(profile.enabledCats)];
    let preset: CatPreset = 'custom';
    if (sameCats(enabledCats, CAT_KEYS)) preset = '9cat';
    else if (sameCats(enabledCats, EIGHT_CAT_KEYS)) preset = '8cat';

    return {
        leagueSize: profile.leagueSize,
        draftRounds: profile.draftRounds,
        draftType: profile.draftType,
        preset,
        enabledCats,
        stances: { ...profile.stances },
        intensity: { ...profile.intensity },
        includeIntensity: profile.intensity !== undefined,
        draftSlot: profile.draftSlot,
        archetypeId: profile.archetypeId ?? null
    };
}

export function canContinue(stepId: string, draft: QuizDraft): boolean {
    if (stepId === 'league') {
        return Number.isInteger(draft.draftRounds) && draft.draftRounds > 0;
    }
    return true;
}

// Board edits persist without a slot so old profiles still re-rank from the stance bar.
export function canPersist(draft: QuizDraft): boolean {
    return Number.isInteger(draft.draftRounds) && draft.draftRounds > 0 && draft.enabledCats.length >= 1;
}

// Simple view is slot names. No slot would land on an empty list.
export function boardSearch(profile: Pick<DraftProfile, 'draftSlot'>): {
    assist: '1';
    view?: 'simple';
} {
    return {
        assist: '1',
        view: profile.draftSlot ? 'simple' : undefined
    };
}
