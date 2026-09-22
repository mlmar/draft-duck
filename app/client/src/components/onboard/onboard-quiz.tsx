import { QuizShell } from '@/components/onboard/quiz-shell';
import { visibleSteps } from '@/components/onboard/steps';
import { Button } from '@/components/ui/button';
import {
    applyArchetype,
    canContinue,
    DEFAULT_QUIZ_DRAFT,
    profileToQuizDraft,
    quizDraftToProfile,
    type QuizDraft
} from '@/lib/quiz';
import { useDraftProfileStore } from '@/stores/draft-profile';
import { draftProfileSchema, restoreSummary } from '@waiver-warrior/core';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

const SIMPLE_BOARD_SEARCH = { assist: '1', view: 'simple' } as const;

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

    const path = visibleSteps(draft, search.step);
    const fromSearch = path.findIndex((entry) => entry.id === search.step);
    const stepIndex = fromSearch === -1 ? 0 : fromSearch;

    // Persist hydrates from localStorage after mount. Prefill once that lands.
    // search.build is an entry hint from home. Continue drops it from the URL; do not re-run.
    useEffect(() => {
        const entryBuild = search.build;
        const applySaved = () => {
            const profile = useDraftProfileStore.getState().profile;
            let next = profile ? profileToQuizDraft(profile) : DEFAULT_QUIZ_DRAFT;
            if (entryBuild) next = applyArchetype(next, entryBuild);
            if (profile) {
                setHasSavedProfile(true);
                setSavedSummary(restoreSummary(profile));
            }
            if (profile || entryBuild) setDraft(next);
        };

        const unsub = useDraftProfileStore.persist.onFinishHydration(applySaved);
        if (useDraftProfileStore.persist.hasHydrated()) applySaved();
        return unsub;
        // Mount-only. search.build is the landing hint; Continue drops it from the URL.
    }, []);

    const step = path[stepIndex] ?? path[0]!;
    const StepComponent = step.Component;
    const isFirst = stepIndex === 0;
    const isReview = Boolean(step.submit);

    function goToStepId(id: string) {
        void navigate({
            search: { step: id },
            replace: true
        });
    }

    function handleContinue() {
        if (step.submit) {
            const parsed = draftProfileSchema.safeParse(quizDraftToProfile(draft));
            if (!parsed.success) {
                setParseError('This profile is not valid yet. Go back and check league size, rounds, and categories.');
                return;
            }
            setParseError(null);
            setProfile(parsed.data);
            void navigate({ to: '/draft', search: SIMPLE_BOARD_SEARCH });
            return;
        }

        const nextDraft = step.applyContinue ? step.applyContinue(draft) : draft;
        setParseError(null);
        setDraft(nextDraft);
        const nextPath = visibleSteps(nextDraft, step.id);
        const current = nextPath.findIndex((entry) => entry.id === step.id);
        const next = nextPath[current + 1] ?? nextPath[nextPath.length - 1];
        if (next) goToStepId(next.id);
    }

    function handleSkip() {
        const nextDraft = step.applySkip ? step.applySkip(draft) : draft;
        setDraft(nextDraft);
        const nextPath = visibleSteps(nextDraft, step.id);
        const current = nextPath.findIndex((entry) => entry.id === step.id);
        const next = nextPath[current + 1] ?? nextPath[nextPath.length - 1];
        if (next) goToStepId(next.id);
    }

    function handleBack() {
        setParseError(null);
        const prev = path[stepIndex - 1];
        if (prev) goToStepId(prev.id);
    }

    function jumpToReview() {
        setParseError(null);
        const review = path[path.length - 1];
        if (review) goToStepId(review.id);
    }

    const restoreBanner =
        hasSavedProfile && !isReview ? (
            <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
                <p className='mb-0 text-muted-foreground'>
                    {savedSummary ? `Editing ${savedSummary}` : 'Editing your last profile'}
                </p>
                <Button type='button' variant='ghost' onClick={jumpToReview}>
                    Jump to review
                </Button>
            </div>
        ) : null;

    return (
        <>
            <p className='mb-4'>
                <Link to='/' className='text-muted-foreground hover:text-foreground'>
                    Waiver Warrior
                </Link>
            </p>
            <QuizShell
                title={step.title}
                description={step.description}
                stepIndex={stepIndex}
                stepCount={path.length}
                optional={step.optional}
                onBack={isFirst ? undefined : handleBack}
                onContinue={handleContinue}
                onSkip={step.optional ? handleSkip : undefined}
                skipLabel={step.skipLabel}
                continueLabel={step.continueLabel}
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
        </>
    );
}
