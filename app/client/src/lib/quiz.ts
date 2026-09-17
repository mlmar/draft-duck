import { CAT_KEYS, type CatKey, type CatStance, type DraftProfile } from '@waiver-warrior/core';

// In-progress quiz shape plus conversions to DraftProfile. Skip intensity omits that field from the saved payload.

export type CatPreset = '9cat' | '8cat' | 'custom';
export type ArchetypeChoice = 'stocks' | 'points';

export type QuizDraft = {
    leagueSize: 8 | 10 | 12 | 14;
    draftRounds: number;
    draftType: 'snake' | 'linear';
    preset: CatPreset;
    enabledCats: CatKey[];
    stances: Partial<Record<CatKey, CatStance>>;
    intensity: Partial<Record<CatKey, number>>;
    // Skip leaves this false so the saved profile omits intensity.
    includeIntensity: boolean;
    // Session-only. Not part of DraftProfile.
    archetype: ArchetypeChoice | null;
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
    archetype: null
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

function sameCats(left: CatKey[], right: CatKey[]): boolean {
    if (left.length !== right.length) return false;
    const rightSet = new Set(right);
    return left.every((cat) => rightSet.has(cat));
}

export function applyPreset(draft: QuizDraft, preset: CatPreset, customCats?: CatKey[]): QuizDraft {
    // Switching preset should not leave punt chips on cats that are no longer enabled.
    const enabledCats = catsForPreset(preset, customCats ?? draft.enabledCats);
    return {
        ...draft,
        preset,
        enabledCats,
        stances: keepEnabled(draft.stances, enabledCats),
        intensity: keepEnabled(draft.intensity, enabledCats)
    };
}

export function setCustomCats(draft: QuizDraft, enabledCats: CatKey[]): QuizDraft {
    return applyPreset({ ...draft, enabledCats }, 'custom', enabledCats);
}

// Stocks => need STL/BLK. Points => need PTS. Leave an existing punt alone.
export function applyArchetypeNudge(draft: QuizDraft, choice: ArchetypeChoice): QuizDraft {
    const cats: CatKey[] = choice === 'stocks' ? ['stl', 'blk'] : ['pts'];
    const stances = { ...draft.stances };
    for (const cat of cats) {
        if (!draft.enabledCats.includes(cat)) continue;
        if (stances[cat] === 'punt') continue;
        stances[cat] = 'need';
    }
    return { ...draft, stances, archetype: choice };
}

// DraftProfile is the persist and API shape. Intensity is omitted unless the user continued on that screen.
export function quizDraftToProfile(draft: QuizDraft): DraftProfile {
    const profile: DraftProfile = {
        leagueSize: draft.leagueSize,
        draftRounds: draft.draftRounds,
        draftType: draft.draftType,
        enabledCats: [...draft.enabledCats],
        stances: keepEnabled(draft.stances, draft.enabledCats)
    };
    if (!draft.includeIntensity) return profile;

    const intensity: Partial<Record<CatKey, number>> = {};
    for (const cat of draft.enabledCats) {
        if ((draft.stances[cat] ?? 'neutral') === 'punt') continue;
        intensity[cat] = draft.intensity[cat] ?? 1;
    }
    profile.intensity = intensity;
    return profile;
}

// Archetype is session-only. Restore cannot recover which card they tapped, only the resulting stances.
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
        archetype: null
    };
}

// Most steps always continue. League rounds and custom cats can be empty or invalid.
export function canContinue(stepId: string, draft: QuizDraft): boolean {
    if (stepId === 'league') return Number.isInteger(draft.draftRounds) && draft.draftRounds > 0;
    if (stepId === 'preset') return draft.enabledCats.length >= 1;
    return true;
}
