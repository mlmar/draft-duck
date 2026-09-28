import { describe, expect, it } from 'vitest';
import { nextOnboardStepId, previousOnboardStepId, stepsForPath } from '@/components/onboard/steps';
import { applyArchetype, DEFAULT_QUIZ_DRAFT, startWalk } from '@/lib/quiz';

describe('stepsForPath Continue and Back', () => {
    it('named Continue is league then review', () => {
        const draft = applyArchetype(DEFAULT_QUIZ_DRAFT, 'puntFt');
        expect(stepsForPath('named', draft).map((step) => step.id)).toEqual(['league', 'review']);
        expect(nextOnboardStepId('named', draft, 'league')).toBe('review');
        expect(nextOnboardStepId('named', draft, 'review')).toBeUndefined();
        expect(previousOnboardStepId('named', draft, 'league')).toBeUndefined();
        expect(previousOnboardStepId('named', draft, 'review')).toBe('league');
    });

    it('custom Continue is stances then league then review', () => {
        const draft = applyArchetype(DEFAULT_QUIZ_DRAFT, 'custom');
        expect(stepsForPath('custom', draft).map((step) => step.id)).toEqual(['stances', 'league', 'review']);
        expect(nextOnboardStepId('custom', draft, 'stances')).toBe('league');
        expect(nextOnboardStepId('custom', draft, 'league')).toBe('review');
        expect(previousOnboardStepId('custom', draft, 'league')).toBe('stances');
    });

    it('Not sure Continue after snap is league then review', () => {
        const draft = startWalk(DEFAULT_QUIZ_DRAFT, 7);
        expect(stepsForPath('not-sure', draft).map((step) => step.id)).toEqual(['walk', 'league', 'review']);
        expect(nextOnboardStepId('not-sure', draft, 'walk')).toBe('league');
        expect(nextOnboardStepId('not-sure', draft, 'league')).toBe('review');
        expect(previousOnboardStepId('not-sure', draft, 'league')).toBe('walk');
    });
});
