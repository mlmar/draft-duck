import { QuizShell } from '@/components/onboard/quiz-shell';
import { STEPS } from '@/components/onboard/steps';
import {
    applyArchetype,
    boardSearch,
    canContinue,
    DEFAULT_QUIZ_DRAFT,
    profileToQuizDraft,
    quizDraftToProfile,
    type QuizDraft
} from '@/lib/quiz';
import { useDraftProfileStore } from '@/stores/draft-profile';
import { draftProfileSchema, restoreSummary } from '@draft-duck/core';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

// Quiz for /onboard. Owns the in-progress draft and persist hydrate. The current screen is ?step=.
export function OnboardQuiz() {
    const search = useSearch({ from: '/onboard' });
    const navigate = useNavigate({ from: '/onboard' });
    const setProfile = useDraftProfileStore((state) => state.setProfile);
    const [draft, setDraft] = useState<QuizDraft>(DEFAULT_QUIZ_DRAFT);
    const [parseError, setParseError] = useState<string | null>(null);
    // Snapshot at hydrate so a first-time rank does not suddenly show the restore banner.
    const [hasSavedProfile, setHasSavedProfile] = useState(false);
    const [savedSummary, setSavedSummary] = useState<string | null>(null);

    const fromSearch = STEPS.findIndex((entry) => entry.id === search.step);
    const stepIndex = fromSearch === -1 ? 0 : fromSearch;
    const step = STEPS[stepIndex] ?? STEPS[0]!;
    const StepComponent = step.Component;
    const isFirst = stepIndex === 0;
    const isReview = Boolean(step.submit);

    function goToStepId(id: string) {
        void navigate({
            search: { step: id },
            replace: true
        });
    }

    function goHome() {
        void navigate({ to: '/', replace: true });
    }

    // Persist hydrates from localStorage after mount. Prefill once that lands.
    // Home ?build= is picking an archetype from the gallery. Land on league, drop build from the URL.
    // No build and no saved profile: home is the stance picker, so bounce back.
    useEffect(() => {
        const entryBuild = search.build;
        const applySaved = () => {
            const profile = useDraftProfileStore.getState().profile;
            if (!profile && !entryBuild) {
                goHome();
                return;
            }
            let next = profile ? profileToQuizDraft(profile) : DEFAULT_QUIZ_DRAFT;
            if (entryBuild) next = applyArchetype(next, entryBuild);
            if (profile) {
                setHasSavedProfile(true);
                setSavedSummary(restoreSummary(profile));
            }
            if (profile || entryBuild) setDraft(next);
            if (entryBuild) goToStepId('league');
        };

        const unsub = useDraftProfileStore.persist.onFinishHydration(applySaved);
        if (useDraftProfileStore.persist.hasHydrated()) applySaved();
        return unsub;
        // Mount-only. search.build is the landing hint; going to league drops it from the URL.
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
        // No slot: review would be empty. Persist and open the assisted full board.
        if (step.submit || (step.id === 'league' && !draft.draftSlot)) {
            finishQuiz();
            return;
        }

        setParseError(null);
        const next = STEPS[stepIndex + 1] ?? STEPS[STEPS.length - 1];
        if (next) goToStepId(next.id);
    }

    function handleBack() {
        setParseError(null);
        const prev = STEPS[stepIndex - 1];
        if (prev) goToStepId(prev.id);
    }

    const restoreBanner =
        hasSavedProfile && !isReview ? (
            <p className='mb-0 text-muted-foreground'>
                {savedSummary ? `Editing ${savedSummary}` : 'Editing your last profile'}
            </p>
        ) : null;

    return (
        <QuizShell
            title={step.title}
            description={step.description}
            stepIndex={stepIndex}
            stepCount={STEPS.length}
            onBack={isFirst ? goHome : handleBack}
            onContinue={handleContinue}
            continueLabel={step.id === 'league' && !draft.draftSlot ? 'See full board' : step.continueLabel}
            continueDisabled={!canContinue(step.id, draft)}
            banner={restoreBanner}
        >
            <StepComponent
                value={draft}
                onChange={(next) => {
                    setDraft(next);
                    setParseError(null);
                }}
                parseError={parseError}
            />
        </QuizShell>
    );
}
