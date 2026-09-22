import { QuizShell } from '@/components/onboard/quiz-shell';
import { STEPS } from '@/components/onboard/steps';
import { Button } from '@/components/ui/button';
import { canContinue, DEFAULT_QUIZ_DRAFT, profileToQuizDraft, quizDraftToProfile, type QuizDraft } from '@/lib/quiz';
import { useDraftProfileStore } from '@/stores/draft-profile';
import { draftProfileSchema } from '@waiver-warrior/core';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
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

    const fromSearch = STEPS.findIndex((entry) => entry.id === search.step);
    const stepIndex = fromSearch === -1 ? 0 : fromSearch;

    // Persist hydrates from localStorage after mount. Prefill once that lands.
    useEffect(() => {
        const applySaved = () => {
            const profile = useDraftProfileStore.getState().profile;
            if (profile) {
                setDraft(profileToQuizDraft(profile));
                setHasSavedProfile(true);
            }
        };

        const unsub = useDraftProfileStore.persist.onFinishHydration(applySaved);
        if (useDraftProfileStore.persist.hasHydrated()) applySaved();
        return unsub;
    }, []);

    const step = STEPS[stepIndex] ?? STEPS[0]!;
    const StepComponent = step.Component;
    const isFirst = stepIndex === 0;
    const isReview = stepIndex === STEPS.length - 1;

    function goToStep(index: number) {
        const clamped = Math.min(Math.max(index, 0), STEPS.length - 1);
        const next = STEPS[clamped];
        if (!next) return;
        void navigate({
            search: { step: next.id },
            replace: true
        });
    }

    function goNext(nextDraft: QuizDraft) {
        setParseError(null);
        setDraft(nextDraft);
        goToStep(stepIndex + 1);
    }

    function handleContinue() {
        // Review persists then leaves. Ranking happens on /draft.
        if (step.submit) {
            const parsed = draftProfileSchema.safeParse(quizDraftToProfile(draft));
            if (!parsed.success) {
                setParseError('This profile is not valid yet. Go back and check league size, rounds, and categories.');
                return;
            }
            setParseError(null);
            setProfile(parsed.data);
            void navigate({ to: '/draft', search: { assist: '1' } });
            return;
        }

        const nextDraft = step.applyContinue ? step.applyContinue(draft) : draft;
        goNext(nextDraft);
    }

    function handleSkip() {
        const nextDraft = step.applySkip ? step.applySkip(draft) : draft;
        goNext(nextDraft);
    }

    function handleBack() {
        setParseError(null);
        goToStep(stepIndex - 1);
    }

    function jumpToReview() {
        // One hop. The progress bar eases from the current step to the last, not through each skip.
        setParseError(null);
        goToStep(STEPS.length - 1);
    }

    const restoreBanner =
        hasSavedProfile && !isReview ? (
            <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
                <p className='mb-0 text-muted-foreground'>Editing your last profile</p>
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
                stepCount={STEPS.length}
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
