import { describe, expect, it } from 'vitest';
import {
    applyArchetype,
    appendWalkAnswer,
    DEFAULT_QUIZ_DRAFT,
    quizDraftToProfile,
    setCatStance,
    setCatTuner,
    startWalk,
    undoLastWalkAnswer
} from './quiz.ts';
import { CAT_KEYS, previewFromAnswers } from '@draft-duck/core';

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

    it('converts a named build to Custom when its Punt slider is edited', () => {
        const fortress = applyArchetype(DEFAULT_QUIZ_DRAFT, 'puntFt');
        const edited = setCatTuner(fortress, 'ftPct', 0.8);

        expect(edited.stances.ftPct).toBe('custom');
        expect(edited.intensity.ftPct).toBe(0.8);
        expect(edited.stances.fgPct).toBe('need');
        expect(edited.stances.trb).toBe('need');
        expect(edited.intensity.stl).toBe(1);
        expect(edited.archetypeId).toBe('custom');
        expect(quizDraftToProfile(edited).archetypeId).toBe('custom');
    });

    it('keeps an edited zero-weight Punt as Custom', () => {
        const fortress = applyArchetype(DEFAULT_QUIZ_DRAFT, 'puntFt');
        const edited = setCatTuner(fortress, 'ftPct', 0);

        expect(edited.stances.ftPct).toBe('custom');
        expect(edited.intensity.ftPct).toBe(0);
        expect(edited.archetypeId).toBe('custom');
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

describe('Home Custom stays custom', () => {
    it('keeps custom when every chip is Neutral', () => {
        const custom = applyArchetype(DEFAULT_QUIZ_DRAFT, 'custom');
        expect(custom.archetypeId).toBe('custom');
        expect(quizDraftToProfile(custom).archetypeId).toBe('custom');
        const stillCustom = setCatStance(custom, 'pts', 'neutral');
        expect(stillCustom.archetypeId).toBe('custom');
        expect(quizDraftToProfile(stillCustom).archetypeId).toBe('custom');
    });
});

describe('appendWalkAnswer and undoLastWalkAnswer', () => {
    function walkThrough(lastSide: 'left' | 'right' = 'left') {
        let draft = startWalk(DEFAULT_QUIZ_DRAFT, 7);
        const ids = draft.walkQuestionIds ?? [];
        expect(ids.length).toBeGreaterThan(0);
        for (let q = 0; q < ids.length - 1; q++) {
            draft = appendWalkAnswer(draft, 'left', q);
        }
        const beforeSnap = draft;
        const snapped = appendWalkAnswer(beforeSnap, lastSide, ids.length - 1);
        return { ids, beforeSnap, snapped };
    }

    it('Back from League restores the last question and the previous bars', () => {
        const { ids, beforeSnap, snapped } = walkThrough();
        expect(snapped.snappedFromWalk).toBe(true);
        expect(snapped.archetypeId).toBeTruthy();

        const undone = undoLastWalkAnswer(snapped);
        expect(undone.walkAnswers).toEqual(beforeSnap.walkAnswers);
        expect(undone.walkAnswers?.length).toBe(ids.length - 1);
        expect(undone.archetypeId).toBeNull();
        expect(undone.snappedFromWalk).toBe(false);
        expect(undone.stances).toEqual({});
        expect(previewFromAnswers(ids, undone.walkAnswers ?? [], undone.enabledCats)).toEqual(
            previewFromAnswers(ids, beforeSnap.walkAnswers ?? [], beforeSnap.enabledCats)
        );
    });

    it('does not change the snapped build on a second tap', () => {
        const { ids, snapped } = walkThrough('left');
        expect(snapped.snappedFromWalk).toBe(true);
        const firstId = snapped.archetypeId;
        const staleLast = appendWalkAnswer(snapped, 'right', ids.length - 1);
        expect(staleLast).toBe(snapped);
        expect(staleLast.archetypeId).toBe(firstId);
        const staleFirst = appendWalkAnswer(snapped, 'right', 0);
        expect(staleFirst.archetypeId).toBe(firstId);
        expect(staleFirst.walkAnswers).toEqual(snapped.walkAnswers);
    });
});
