import { QuizShell } from '@/components/onboard/quiz-shell';
import {
    currentStepDef,
    currentWalkQuestionId,
    nextOnboardStepId,
    previousOnboardStepId,
    stepProgress
} from '@/components/onboard/steps';
import { WeightChartPanel } from '@/components/onboard/weight-chart';
import {
    applyArchetype,
    appendWalkAnswer,
    boardSearch,
    canContinue,
    DEFAULT_QUIZ_DRAFT,
    newWalkSeed,
    onboardPath,
    profileToQuizDraft,
    quizDraftToProfile,
    startWalk,
    undoLastWalkAnswer,
    type QuizDraft
} from '@/lib/quiz';
import { useDraftProfileStore } from '@/stores/draft-profile';
import {
    ARCHETYPE_LABELS,
    draftProfileSchema,
    isNamedBuildId,
    previewFromAnswers,
    restoreSummary,
    tunersForStances,
    type WalkChoiceId
} from '@draft-duck/core';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

export function OnboardQuiz() {
    const search = useSearch({ from: '/onboard' });
    const navigate = useNavigate({ from: '/onboard' });
    const setProfile = useDraftProfileStore((state) => state.setProfile);
    const [draft, setDraft] = useState<QuizDraft>(DEFAULT_QUIZ_DRAFT);
    const [parseError, setParseError] = useState<string | null>(null);
    const [hasSavedProfile, setHasSavedProfile] = useState(false);
    const [savedSummary, setSavedSummary] = useState<string | null>(null);

    const path = onboardPath(draft);
    const q = Number.parseInt(search.q ?? '0', 10) || 0;
    const step = currentStepDef(path, draft, search.step ?? '', q);
    const progress = stepProgress(path, draft, step.id, q);
    const StepComponent = step.Component;
    const isWalk = step.id === 'walk';
    const isFirst = progress.index === 0;
    const isReview = Boolean(step.submit);

    function goTo(next: { step: string; q?: number }) {
        void navigate({
            search: {
                step: next.step,
                q: next.step === 'walk' ? String(next.q ?? 0) : undefined
            },
            replace: true
        });
    }

    function goHome() {
        void navigate({ to: '/', replace: true });
    }

    useEffect(() => {
        const entryBuild = search.build;
        const entryStart = search.start;
        const applySaved = () => {
            const profile = useDraftProfileStore.getState().profile;
            if (!profile && !entryBuild && entryStart !== 'not-sure') {
                goHome();
                return;
            }
            let next = profile ? profileToQuizDraft(profile) : DEFAULT_QUIZ_DRAFT;
            if (entryStart === 'not-sure') {
                // Fresh Balanced walk. Keep league size from the saved board. Do not name the old build.
                next = startWalk(next, newWalkSeed());
                setDraft(next);
                if ((next.walkQuestionIds?.length ?? 0) === 0) {
                    next = { ...applyArchetype(next, 'balanced'), snappedFromWalk: true };
                    setDraft(next);
                    goTo({ step: 'league' });
                    return;
                }
                goTo({ step: 'walk', q: 0 });
                return;
            }
            if (entryBuild === 'custom') {
                next = applyArchetype(next, 'custom');
                if (profile) {
                    setHasSavedProfile(true);
                    setSavedSummary(restoreSummary(profile));
                }
                setDraft(next);
                goTo({ step: 'stances' });
                return;
            }
            if (entryBuild) {
                next = applyArchetype(next, entryBuild);
                if (profile) {
                    setHasSavedProfile(true);
                    setSavedSummary(restoreSummary(profile));
                }
                setDraft(next);
                goTo({ step: 'league' });
                return;
            }
            if (profile) {
                setHasSavedProfile(true);
                setSavedSummary(restoreSummary(profile));
                setDraft(next);
            }
        };

        const unsub = useDraftProfileStore.persist.onFinishHydration(applySaved);
        if (useDraftProfileStore.persist.hasHydrated()) applySaved();
        return unsub;
    }, []);

    function finishQuiz() {
        const parsed = draftProfileSchema.safeParse(quizDraftToProfile(draft));
        if (!parsed.success) {
            setParseError('This profile is not valid yet. Go back and check league size, rounds, and categories.');
            return;
        }
        setParseError(null);
        setProfile(parsed.data);
        void navigate({ to: '/draft', search: boardSearch() });
    }

    function handleContinue() {
        if (step.submit || (step.id === 'league' && !draft.draftSlot)) {
            finishQuiz();
            return;
        }
        setParseError(null);
        const nextId = nextOnboardStepId(path, draft, step.id);
        if (nextId) goTo({ step: nextId });
    }

    function handleWalkAnswer(side: WalkChoiceId) {
        const next = appendWalkAnswer(draft, side, q);
        if (next === draft) return;
        setParseError(null);
        setDraft(next);
        if (next.snappedFromWalk) {
            goTo({ step: 'league' });
            return;
        }
        goTo({ step: 'walk', q: next.walkAnswers?.length ?? 0 });
    }

    function handleBack() {
        setParseError(null);
        if (isWalk) {
            if ((draft.walkAnswers ?? []).length === 0) {
                goHome();
                return;
            }
            const next = undoLastWalkAnswer(draft);
            setDraft(next);
            goTo({ step: 'walk', q: next.walkAnswers?.length ?? 0 });
            return;
        }
        if (step.id === 'league' && (draft.walkQuestionIds?.length ?? 0) > 0) {
            const next = undoLastWalkAnswer(draft);
            setDraft(next);
            goTo({ step: 'walk', q: next.walkAnswers?.length ?? 0 });
            return;
        }
        const prevId = previousOnboardStepId(path, draft, step.id);
        if (prevId) {
            goTo({ step: prevId });
            return;
        }
        goHome();
    }

    const restoreBanner =
        hasSavedProfile && !isReview ? (
            <p className='mb-0 text-muted-foreground'>
                {savedSummary ? `Editing ${savedSummary}` : 'Editing your last profile'}
            </p>
        ) : null;

    const walkTuners = isWalk
        ? previewFromAnswers(draft.walkQuestionIds ?? [], draft.walkAnswers ?? [], draft.enabledCats)
        : null;
    const chartTuners = walkTuners ?? tunersForStances(draft.stances, draft.enabledCats, draft.intensity);
    const snapCaption =
        draft.snappedFromWalk && draft.archetypeId && isNamedBuildId(draft.archetypeId)
            ? `Closest build: ${ARCHETYPE_LABELS[draft.archetypeId]}`
            : null;

    const question = (
        <StepComponent
            value={draft}
            onChange={(next) => {
                setDraft(next);
                setParseError(null);
            }}
            parseError={parseError}
            questionId={isWalk ? currentWalkQuestionId(draft, q) : undefined}
            onWalkAnswer={handleWalkAnswer}
        />
    );
    const chart = (
        <WeightChartPanel
            draft={{ ...draft, intensity: chartTuners }}
            tuners={chartTuners}
            editable={!isWalk}
            caption={isWalk ? 'Your priorities so far' : snapCaption}
            onChange={(next) => {
                setDraft(next);
                setParseError(null);
            }}
        />
    );

    return (
        <QuizShell
            title={step.title}
            description={step.description}
            stepIndex={progress.index}
            stepCount={progress.count}
            onBack={isFirst ? goHome : handleBack}
            onContinue={step.hideContinue ? undefined : handleContinue}
            continueLabel={step.id === 'league' && !draft.draftSlot ? 'See full board' : step.continueLabel}
            continueDisabled={!canContinue(step.id, draft)}
            banner={restoreBanner}
        >
            <div
                className={`mt-6 grid gap-6 lg:items-start lg:gap-8 ${isWalk ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]'}`}
            >
                {isWalk ? (
                    <>
                        {chart}
                        {question}
                    </>
                ) : (
                    <>
                        {question}
                        {chart}
                    </>
                )}
            </div>
        </QuizShell>
    );
}
