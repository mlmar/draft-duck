import { describe, expect, it } from 'vitest';
import {
    applyArchetype,
    DEFAULT_QUIZ_DRAFT,
    quizDraftToProfile,
    setCatStance,
    setCatTuner,
    startWalk
} from './quiz.ts';
import { CAT_KEYS } from '@draft-duck/core';

describe('quizDraftToProfile', () => {
    it('always writes tuners and never copies walk fields', () => {
        const walked = startWalk(DEFAULT_QUIZ_DRAFT, 7);
        const snapped = applyArchetype({ ...walked, walkAnswers: ['left', 'right'], snappedFromWalk: true }, 'puntFt');
        const profile = quizDraftToProfile(snapped);
        expect(profile.archetypeId).toBe('puntFt');
        expect(profile.intensity?.ftPct).toBe(0);
        expect(profile.intensity?.fgPct).toBe(1.5);
        expect(profile).not.toHaveProperty('walkSeed');
        expect(profile).not.toHaveProperty('walkQuestionIds');
        expect(profile).not.toHaveProperty('walkAnswers');
        expect(profile).not.toHaveProperty('snappedFromWalk');
        expect(snapped.walkQuestionIds?.length).toBeGreaterThan(0);
    });
});

describe('setCatStance and setCatTuner', () => {
    it('writes complement 1.25 when Custom punts FT%', () => {
        const custom = applyArchetype(DEFAULT_QUIZ_DRAFT, 'custom');
        const punted = setCatStance(custom, 'ftPct', 'punt');
        expect(punted.intensity.fgPct).toBe(1.25);
        expect(punted.intensity.trb).toBe(1.25);
        expect(punted.stances.ftPct).toBe('punt');
        expect(punted.archetypeId).toBe('custom');
    });

    it('marks a slider override Custom and Neutral snaps back to 1.25', () => {
        const punted = setCatStance(applyArchetype(DEFAULT_QUIZ_DRAFT, 'custom'), 'ftPct', 'punt');
        const dragged = setCatTuner(punted, 'fgPct', 1.4);
        expect(dragged.stances.fgPct).toBe('custom');
        expect(dragged.intensity.fgPct).toBe(1.4);
        const reset = setCatStance(dragged, 'fgPct', 'neutral');
        expect(reset.stances.fgPct).toBe('neutral');
        expect(reset.intensity.fgPct).toBe(1.25);
    });
});

describe('named applyArchetype', () => {
    it('writes Fortress tuners without leftover walk mix', () => {
        const next = applyArchetype(
            { ...DEFAULT_QUIZ_DRAFT, enabledCats: [...CAT_KEYS], walkAnswers: ['left'] },
            'puntFt'
        );
        expect(next.archetypeId).toBe('puntFt');
        expect(next.stances.ftPct).toBe('punt');
        expect(next.intensity.fgPct).toBe(1.5);
        expect(next.intensity.ast).toBe(1);
    });
});
