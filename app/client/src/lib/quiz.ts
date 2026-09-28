import {
    CAT_KEYS,
    LEAGUE_SIZE_MAX,
    LEAGUE_SIZE_MIN,
    applyCatStance,
    applyCatTuner,
    hasCustomCat,
    isNamedBuildId,
    isNamedBuildVisible,
    nearestNamedBuild,
    pickWalkQuestions,
    previewFromAnswers,
    stancesForArchetype,
    stancesMatchNamed,
    tunersForStances,
    type ArchetypeId,
    type CatKey,
    type CatStance,
    type DraftProfile,
    type WalkChoiceId
} from '@draft-duck/core';

// In-progress quiz shape plus conversions to DraftProfile. Walk fields stay in memory only.

export const STANDARD_LEAGUE_SIZES = [8, 10, 12, 14] as const;

export type CatPreset = '9cat' | '8cat' | 'custom';

export type OnboardPath = 'named' | 'custom' | 'not-sure';

export type QuizDraft = {
    leagueSize: number;
    draftRounds: number;
    draftType: 'snake' | 'linear';
    preset: CatPreset;
    enabledCats: CatKey[];
    stances: Partial<Record<CatKey, CatStance>>;
    intensity: Partial<Record<CatKey, number>>;
    draftSlot?: number;
    archetypeId: ArchetypeId | null;
    walkSeed?: number;
    walkQuestionIds?: string[];
    walkAnswers?: WalkChoiceId[];
    snappedFromWalk?: boolean;
};

export const DEFAULT_QUIZ_DRAFT: QuizDraft = {
    leagueSize: 12,
    draftRounds: 13,
    draftType: 'snake',
    preset: '9cat',
    enabledCats: [...CAT_KEYS],
    stances: {},
    intensity: {},
    archetypeId: null
};

const EIGHT_CAT_KEYS = CAT_KEYS.filter((cat) => cat !== 'tov');

export function catsForPreset(preset: CatPreset, customCats: CatKey[] = [...CAT_KEYS]): CatKey[] {
    if (preset === '9cat') return [...CAT_KEYS];
    if (preset === '8cat') return [...EIGHT_CAT_KEYS];
    return customCats.length > 0 ? [...customCats] : [...CAT_KEYS];
}

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

function withRewrittenTuners(draft: QuizDraft): QuizDraft {
    return {
        ...draft,
        intensity: tunersForStances(draft.stances, draft.enabledCats, draft.intensity)
    };
}

function withArchetypeFromStances(draft: QuizDraft): QuizDraft {
    // Home Custom stays custom even when every chip is Neutral. Do not snap to Balanced.
    if (hasCustomCat(draft.stances, draft.enabledCats)) {
        return { ...draft, archetypeId: 'custom' };
    }
    if (draft.archetypeId && isNamedBuildId(draft.archetypeId)) {
        if (stancesMatchNamed(draft.stances, draft.archetypeId, draft.enabledCats)) return draft;
        return { ...draft, archetypeId: 'custom' };
    }
    return { ...draft, archetypeId: draft.archetypeId ?? 'custom' };
}

export function applyPreset(draft: QuizDraft, preset: CatPreset, customCats?: CatKey[]): QuizDraft {
    const enabledCats = catsForPreset(preset, customCats ?? draft.enabledCats);
    const next: QuizDraft = withRewrittenTuners({
        ...draft,
        preset,
        enabledCats,
        stances: keepEnabled(draft.stances, enabledCats),
        intensity: keepEnabled(draft.intensity, enabledCats)
    });
    if (next.draftSlot && next.draftSlot > next.leagueSize) {
        next.draftSlot = next.leagueSize;
    }
    if (next.archetypeId && isNamedBuildId(next.archetypeId) && !isNamedBuildVisible(next.archetypeId, enabledCats)) {
        return { ...next, archetypeId: null };
    }
    return next;
}

export function setCustomCats(draft: QuizDraft, enabledCats: CatKey[]): QuizDraft {
    return applyPreset({ ...draft, enabledCats }, 'custom', enabledCats);
}

export function applyArchetype(draft: QuizDraft, id: ArchetypeId): QuizDraft {
    const stances = stancesForArchetype(id, draft.enabledCats);
    return {
        ...draft,
        archetypeId: id,
        stances,
        intensity: tunersForStances(stances, draft.enabledCats)
    };
}

export function setCatStance(draft: QuizDraft, cat: CatKey, stance: Exclude<CatStance, 'custom'>): QuizDraft {
    const next = applyCatStance(draft.stances, draft.intensity, cat, stance, draft.enabledCats);
    return withArchetypeFromStances({ ...draft, stances: next.stances, intensity: next.intensity });
}

export function setCatTuner(draft: QuizDraft, cat: CatKey, tuner: number): QuizDraft {
    const next = applyCatTuner(draft.stances, draft.intensity, cat, tuner, draft.enabledCats);
    return withArchetypeFromStances({ ...draft, stances: next.stances, intensity: next.intensity });
}

export function setDraftSlot(draft: QuizDraft, draftSlot: number): QuizDraft {
    if (!Number.isInteger(draftSlot) || draftSlot < 1) {
        return { ...draft, draftSlot: undefined };
    }
    return { ...draft, draftSlot: Math.min(draftSlot, draft.leagueSize) };
}

export function clampLeagueSize(n: number): number {
    if (!Number.isFinite(n)) return 12;
    const even = n % 2 === 0 ? n : n - 1;
    return Math.min(LEAGUE_SIZE_MAX, Math.max(LEAGUE_SIZE_MIN, even));
}

export function setLeagueSize(draft: QuizDraft, leagueSize: number): QuizDraft {
    const size = clampLeagueSize(leagueSize);
    const draftSlot = draft.draftSlot && draft.draftSlot > size ? size : draft.draftSlot;
    return { ...draft, leagueSize: size, draftSlot };
}

export function startWalk(draft: QuizDraft, seed: number): QuizDraft {
    const walkQuestionIds = pickWalkQuestions(draft.enabledCats, seed);
    return {
        ...draft,
        walkSeed: seed,
        walkQuestionIds,
        walkAnswers: [],
        snappedFromWalk: false,
        archetypeId: null,
        stances: {},
        intensity: {}
    };
}

// q must match the current answer count. A stale tap or a mismatched ?q= must not append.
export function appendWalkAnswer(draft: QuizDraft, side: WalkChoiceId, q: number): QuizDraft {
    const ids = draft.walkQuestionIds ?? [];
    const answers = draft.walkAnswers ?? [];
    if (answers.length !== q || q < 0 || q >= ids.length) return draft;

    const nextAnswers = [...answers, side];
    if (nextAnswers.length < ids.length) {
        return { ...draft, walkAnswers: nextAnswers, snappedFromWalk: false };
    }

    const preview = previewFromAnswers(ids, nextAnswers, draft.enabledCats);
    const nearest = nearestNamedBuild(preview, draft.enabledCats);
    return {
        ...applyArchetype({ ...draft, walkAnswers: nextAnswers }, nearest),
        walkSeed: draft.walkSeed,
        walkQuestionIds: ids,
        walkAnswers: nextAnswers,
        snappedFromWalk: true
    };
}

// Pop one answer and fold from Balanced. From League this also clears the snapped named build.
export function undoLastWalkAnswer(draft: QuizDraft): QuizDraft {
    const answers = (draft.walkAnswers ?? []).slice(0, -1);
    return {
        ...draft,
        walkAnswers: answers,
        snappedFromWalk: false,
        archetypeId: null,
        stances: {},
        intensity: {}
    };
}

export function quizDraftToProfile(draft: QuizDraft): DraftProfile {
    const intensity = tunersForStances(draft.stances, draft.enabledCats, draft.intensity);
    const profile: DraftProfile = {
        leagueSize: draft.leagueSize,
        draftRounds: draft.draftRounds,
        draftType: draft.draftType,
        enabledCats: [...draft.enabledCats],
        stances: keepEnabled(draft.stances, draft.enabledCats),
        intensity
    };
    if (draft.draftSlot) profile.draftSlot = draft.draftSlot;
    if (draft.archetypeId) profile.archetypeId = draft.archetypeId;
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
        intensity: tunersForStances(profile.stances, enabledCats, profile.intensity ?? {}),
        draftSlot: profile.draftSlot,
        archetypeId: profile.archetypeId ?? null
    };
}

export function onboardPath(draft: QuizDraft): OnboardPath {
    // In-memory Not sure flag, including []. Keep walk ids after snap so League Back can undo.
    if (draft.walkQuestionIds !== undefined) return 'not-sure';
    if (draft.archetypeId === 'custom') return 'custom';
    return 'named';
}

export function canContinue(stepId: string, draft: QuizDraft): boolean {
    if (stepId === 'league') {
        return Number.isInteger(draft.draftRounds) && draft.draftRounds > 0;
    }
    return true;
}

export function canPersist(draft: QuizDraft): boolean {
    return Number.isInteger(draft.draftRounds) && draft.draftRounds > 0 && draft.enabledCats.length >= 1;
}

export function boardSearch(): { assist: '1' } {
    return { assist: '1' };
}

export function newWalkSeed(): number {
    return Math.floor(Math.random() * 0xffffffff);
}
