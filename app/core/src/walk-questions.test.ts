import { describe, expect, it } from 'vitest';
import { NAMED_BUILD_IDS } from './named-builds.ts';
import { CAT_KEYS, type CatKey } from './types.ts';
import {
    PLAYER_WALK_IDS,
    STATIC_WALK_IDS,
    WALK_QUESTIONS,
    lerpTuners,
    nearestNamedBuild,
    buildFromWalkAnswers,
    pickWalkQuestions,
    previewFromAnswers,
    tunerVector,
    walkQuestion
} from './walk-questions.ts';

const EIGHT_CAT = CAT_KEYS.filter((cat) => cat !== 'tov');
const NO_FT = CAT_KEYS.filter((cat) => cat !== 'ftPct');

describe('walk question bank', () => {
    it('has twelve unique ids, named-build sides, and no overlap between static and player pools', () => {
        const ids = Object.keys(WALK_QUESTIONS);
        expect(ids).toHaveLength(12);
        expect(new Set(ids).size).toBe(12);
        expect(STATIC_WALK_IDS).toHaveLength(6);
        expect(PLAYER_WALK_IDS).toHaveLength(6);
        expect(STATIC_WALK_IDS.some((id) => (PLAYER_WALK_IDS as readonly string[]).includes(id))).toBe(false);
        for (const question of Object.values(WALK_QUESTIONS)) {
            expect(NAMED_BUILD_IDS).toContain(question.left.toward);
            expect(NAMED_BUILD_IDS).toContain(question.right.toward);
            expect(question.left.id).toBe('left');
            expect(question.right.id).toBe('right');
        }
    });
});

describe('pickWalkQuestions', () => {
    it('keeps the six static ids then one player id on 9-cat', () => {
        const picked = pickWalkQuestions(CAT_KEYS, 1);
        expect(picked.slice(0, 6)).toEqual([...STATIC_WALK_IDS]);
        expect(PLAYER_WALK_IDS).toContain(picked[6]);
        expect(picked).toHaveLength(7);
    });

    it('returns the same seven ids for the same seed and can change only the last id', () => {
        expect(pickWalkQuestions(CAT_KEYS, 42)).toEqual(pickWalkQuestions(CAT_KEYS, 42));
        const lastIds = new Set(Array.from({ length: 40 }, (_, index) => pickWalkQuestions(CAT_KEYS, index + 1)[6]));
        expect(lastIds.size).toBeGreaterThan(1);
    });

    it('drops Fortress questions when FT% is off and still draws one player pair', () => {
        const picked = pickWalkQuestions(NO_FT, 7);
        expect(picked.includes('bigs-or-guards')).toBe(false);
        expect(picked.includes('dunks-or-free-throws')).toBe(false);
        expect(picked.slice(0, 4)).toEqual([
            'points-or-stocks',
            'and-ones-or-post-ups',
            'inside-or-roaming',
            'lock-down-or-all-around'
        ]);
        expect(PLAYER_WALK_IDS.filter((id) => id !== 'giannis-or-embiid' && id !== 'giannis-or-draymond')).toContain(
            picked[4]
        );
        expect(picked.includes('giannis-or-embiid')).toBe(false);
        expect(picked.includes('giannis-or-draymond')).toBe(false);
    });
});

describe('walk lerp and nearest', () => {
    it('matches the Fortress 0.4 step from Balanced', () => {
        const after = lerpTuners(tunerVector('balanced', CAT_KEYS), tunerVector('puntFt', CAT_KEYS), 0.4, CAT_KEYS);
        const expected: Record<CatKey, number> = {
            pts: 1.2,
            trb: 1.2,
            ast: 1,
            stl: 1,
            blk: 1.2,
            fg3: 1,
            fgPct: 1.2,
            ftPct: 0.6,
            tov: 1
        };
        for (const cat of CAT_KEYS) {
            expect(after[cat]).toBeCloseTo(expected[cat], 8);
        }
    });

    it('recomputes from Balanced so Back to no answers is all 1s', () => {
        const ids = ['bigs-or-guards'];
        const one = previewFromAnswers(ids, ['left'], CAT_KEYS);
        expect(one.pts).toBeCloseTo(1.2);
        const none = previewFromAnswers(ids, [], CAT_KEYS);
        for (const cat of CAT_KEYS) {
            expect(none[cat]).toBe(1);
        }
    });

    it('snaps the Fortress vector to puntFt and all 1s to balanced', () => {
        expect(nearestNamedBuild(tunerVector('puntFt', CAT_KEYS), CAT_KEYS)).toBe('puntFt');
        expect(nearestNamedBuild(tunerVector('balanced', CAT_KEYS), CAT_KEYS)).toBe('balanced');
    });

    it('breaks equal distance with gallery order', () => {
        const enabled: CatKey[] = ['stl', 'blk'];
        const midpoint = { stl: 1.25, blk: 0.5 };
        expect(nearestNamedBuild(midpoint, enabled)).toBe('balanced');
    });

    it('omits TOV from 8-cat vectors', () => {
        const vector = tunerVector('puntFt', EIGHT_CAT);
        expect(vector.tov).toBeUndefined();
        expect(vector.ftPct).toBe(0);
        expect(nearestNamedBuild(vector, EIGHT_CAT)).toBe('puntFt');
    });
});

describe('walk recommendation considers every answer', () => {
    it('does not always return Balanced for the Jokic/Shai question set', () => {
        const ids = pickWalkQuestions(CAT_KEYS, 7);
        expect(ids.at(-1)).toBe('jokic-or-shai');
        const results = new Set();
        for (let mask = 0; mask < 2 ** ids.length; mask++) {
            const answers = ids.map((_, index) => (mask & (1 << index) ? ('left' as const) : ('right' as const)));
            results.add(buildFromWalkAnswers(ids, answers, CAT_KEYS));
        }
        expect(results).toContain('puntFt');
        expect(results).toContain('guards');
        expect(results.size).toBeGreaterThan(2);
    });
    it('keeps repeated Fortress choices despite a final Balanced answer', () => {
        expect(
            buildFromWalkAnswers(
                ['bigs-or-guards', 'dunks-or-free-throws', 'jokic-or-shai'],
                ['left', 'left', 'left'],
                CAT_KEYS
            )
        ).toBe('puntFt');
    });
    it('returns Balanced when answers explicitly favor Balanced', () => {
        expect(
            buildFromWalkAnswers(
                ['inside-or-roaming', 'lock-down-or-all-around', 'jokic-or-shai'],
                ['right', 'right', 'left'],
                CAT_KEYS
            )
        ).toBe('balanced');
    });
});
