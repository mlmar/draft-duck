import { isNamedBuildVisible, NAMED_BUILD_IDS, type NamedBuildId } from './named-builds.ts';
import { TUNER_NEUTRAL, tunersForArchetype } from './tuners.ts';
import type { CatKey } from './types.ts';

export const WALK_LERP_ALPHA = 0.4;

export type WalkChoiceId = 'left' | 'right';

export type WalkChoice = {
    id: WalkChoiceId;
    label: string;
    toward: NamedBuildId;
};

export type WalkQuestion = {
    id: string;
    prompt: string;
    left: WalkChoice;
    right: WalkChoice;
};

function choice(id: WalkChoiceId, label: string, toward: NamedBuildId): WalkChoice {
    return { id, label, toward };
}

function question(id: string, prompt: string, left: WalkChoice, right: WalkChoice): WalkQuestion {
    return { id, prompt, left, right };
}

export const STATIC_WALK_IDS = [
    'bigs-or-guards',
    'points-or-stocks',
    'dunks-or-free-throws',
    'and-ones-or-post-ups',
    'inside-or-roaming',
    'lock-down-or-all-around'
] as const;

export const PLAYER_WALK_IDS = [
    'jokic-or-shai',
    'giannis-or-embiid',
    'ad-or-draymond',
    'jokic-or-ad',
    'embiid-or-shai',
    'giannis-or-draymond'
] as const;

export const WALK_QUESTIONS: Record<string, WalkQuestion> = {
    'bigs-or-guards': question(
        'bigs-or-guards',
        'Bigs or guards?',
        choice('left', 'Bigs', 'puntFt'),
        choice('right', 'Guards', 'guards')
    ),
    'points-or-stocks': question(
        'points-or-stocks',
        'Points or stocks?',
        choice('left', 'Points', 'guards'),
        choice('right', 'Stocks', 'stocks')
    ),
    'dunks-or-free-throws': question(
        'dunks-or-free-throws',
        'Dunks or free throws?',
        choice('left', 'Dunks', 'puntFt'),
        choice('right', 'Free throws', 'puntFg')
    ),
    'and-ones-or-post-ups': question(
        'and-ones-or-post-ups',
        'And-ones or post-ups?',
        choice('left', 'And-ones', 'puntFg'),
        choice('right', 'Post-ups', 'puntAst')
    ),
    'inside-or-roaming': question(
        'inside-or-roaming',
        'Inside or roaming?',
        choice('left', 'Inside', 'puntAst'),
        choice('right', 'Roaming', 'balanced')
    ),
    'lock-down-or-all-around': question(
        'lock-down-or-all-around',
        'Lock down or all-around?',
        choice('left', 'Lock down', 'stocks'),
        choice('right', 'All-around', 'balanced')
    ),
    'jokic-or-shai': question(
        'jokic-or-shai',
        'Jokic or Shai?',
        choice('left', 'Jokic', 'balanced'),
        choice('right', 'Shai', 'guards')
    ),
    'giannis-or-embiid': question(
        'giannis-or-embiid',
        'Giannis or Embiid?',
        choice('left', 'Giannis', 'puntFt'),
        choice('right', 'Embiid', 'puntFg')
    ),
    'ad-or-draymond': question(
        'ad-or-draymond',
        'AD or Draymond?',
        choice('left', 'AD', 'puntAst'),
        choice('right', 'Draymond', 'stocks')
    ),
    'jokic-or-ad': question(
        'jokic-or-ad',
        'Jokic or AD?',
        choice('left', 'Jokic', 'balanced'),
        choice('right', 'AD', 'puntAst')
    ),
    'embiid-or-shai': question(
        'embiid-or-shai',
        'Embiid or Shai?',
        choice('left', 'Embiid', 'puntFg'),
        choice('right', 'Shai', 'guards')
    ),
    'giannis-or-draymond': question(
        'giannis-or-draymond',
        'Giannis or Draymond?',
        choice('left', 'Giannis', 'puntFt'),
        choice('right', 'Draymond', 'stocks')
    )
};

export function walkQuestion(id: string): WalkQuestion | undefined {
    return WALK_QUESTIONS[id];
}

export function tunerVector(id: NamedBuildId, enabledCats: readonly CatKey[]): Partial<Record<CatKey, number>> {
    return tunersForArchetype(id, enabledCats);
}

export function lerpTuners(
    from: Partial<Record<CatKey, number>>,
    toward: Partial<Record<CatKey, number>>,
    t: number,
    enabledCats: readonly CatKey[]
): Partial<Record<CatKey, number>> {
    const next: Partial<Record<CatKey, number>> = {};
    for (const cat of enabledCats) {
        const a = from[cat] ?? TUNER_NEUTRAL;
        const b = toward[cat] ?? TUNER_NEUTRAL;
        next[cat] = a + (b - a) * t;
    }
    return next;
}

function balancedTuners(enabledCats: readonly CatKey[]): Partial<Record<CatKey, number>> {
    return tunerVector('balanced', enabledCats);
}

// Fold from Balanced every time so Back is exact, not an inverse lerp.
export function previewFromAnswers(
    questionIds: readonly string[],
    answers: readonly WalkChoiceId[],
    enabledCats: readonly CatKey[]
): Partial<Record<CatKey, number>> {
    let preview = balancedTuners(enabledCats);
    const count = Math.min(questionIds.length, answers.length);
    for (let index = 0; index < count; index++) {
        const question = walkQuestion(questionIds[index]!);
        const side = answers[index];
        if (!question || (side !== 'left' && side !== 'right')) continue;
        preview = lerpTuners(preview, tunerVector(question[side].toward, enabledCats), WALK_LERP_ALPHA, enabledCats);
    }
    return preview;
}

function distanceSq(
    left: Partial<Record<CatKey, number>>,
    right: Partial<Record<CatKey, number>>,
    enabledCats: readonly CatKey[]
): number {
    let sum = 0;
    for (const cat of enabledCats) {
        const delta = (left[cat] ?? TUNER_NEUTRAL) - (right[cat] ?? TUNER_NEUTRAL);
        sum += delta * delta;
    }
    return sum;
}

// Keep the first gallery card on a tie. `<` plus slack, not `<=`, so Balanced vs Sniper does not flip.
const NEAREST_TIE_EPS = 1e-12;

export function nearestNamedBuild(
    preview: Partial<Record<CatKey, number>>,
    enabledCats: readonly CatKey[]
): NamedBuildId {
    // Balanced is always visible. Used if every other card is hidden.
    let best: NamedBuildId = 'balanced';
    let bestDist = Number.POSITIVE_INFINITY;
    for (const id of NAMED_BUILD_IDS) {
        if (!isNamedBuildVisible(id, enabledCats)) continue;
        const dist = distanceSq(preview, tunerVector(id, enabledCats), enabledCats);
        if (dist + NEAREST_TIE_EPS < bestDist) {
            best = id;
            bestDist = dist;
        }
    }
    return best;
}

export function isWalkQuestionEligible(question: WalkQuestion, enabledCats: readonly CatKey[]): boolean {
    return (
        isNamedBuildVisible(question.left.toward, enabledCats) &&
        isNamedBuildVisible(question.right.toward, enabledCats)
    );
}

function mulberry32(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state += 0x6d2b79f5;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Seeded draw so Back does not reshuffle the player extra.
export function pickWalkQuestions(enabledCats: readonly CatKey[], seed: number): string[] {
    const staticIds = STATIC_WALK_IDS.filter((id) => {
        const question = WALK_QUESTIONS[id];
        return question !== undefined && isWalkQuestionEligible(question, enabledCats);
    });
    const pool = PLAYER_WALK_IDS.filter((id) => {
        const question = WALK_QUESTIONS[id];
        return question !== undefined && isWalkQuestionEligible(question, enabledCats);
    });
    if (pool.length === 0) return [...staticIds];
    const rand = mulberry32(seed);
    const extra = pool[Math.floor(rand() * pool.length)]!;
    return [...staticIds, extra];
}
