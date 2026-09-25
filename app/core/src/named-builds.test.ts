import { describe, expect, it } from 'vitest';
import {
    isNamedBuildVisible,
    namedBuildHelper,
    profileHeadline,
    restoreSummary,
    stanceSummary,
    stancesForArchetype
} from './named-builds.ts';
import { draftProfileSchema } from './profile.ts';
import { CAT_KEYS, type DraftProfile } from './types.ts';

const EIGHT_CAT = CAT_KEYS.filter((cat) => cat !== 'tov');

function profile(overrides: Partial<DraftProfile> = {}): DraftProfile {
    return {
        leagueSize: 12,
        draftRounds: 13,
        draftType: 'snake',
        enabledCats: [...CAT_KEYS],
        stances: {},
        ...overrides
    };
}

describe('stancesForArchetype', () => {
    it('writes Fortress Need and Punt on every enabled cat', () => {
        expect(stancesForArchetype('puntFt', CAT_KEYS)).toEqual({
            pts: 'need',
            trb: 'need',
            ast: 'neutral',
            stl: 'neutral',
            blk: 'need',
            fg3: 'neutral',
            fgPct: 'need',
            ftPct: 'punt',
            tov: 'neutral'
        });
    });

    it('resets Custom and Balanced to Neutral', () => {
        expect(stancesForArchetype('custom', ['pts', 'trb'])).toEqual({ pts: 'neutral', trb: 'neutral' });
        expect(stancesForArchetype('balanced', ['pts', 'ftPct'])).toEqual({ pts: 'neutral', ftPct: 'neutral' });
    });

    it('skips disabled cats so 8-cat never writes TOV', () => {
        const stances = stancesForArchetype('puntFt', EIGHT_CAT);
        expect(stances.tov).toBeUndefined();
        expect(stances.ftPct).toBe('punt');
    });
});

describe('isNamedBuildVisible', () => {
    it('keeps every named card on 8-cat because none punt TOV', () => {
        for (const id of ['balanced', 'puntFg', 'puntFt', 'guards', 'stocks', 'puntAst'] as const) {
            expect(isNamedBuildVisible(id, EIGHT_CAT)).toBe(true);
        }
    });

    it('hides a card whose punt cat is off', () => {
        expect(
            isNamedBuildVisible(
                'puntFt',
                CAT_KEYS.filter((cat) => cat !== 'ftPct')
            )
        ).toBe(false);
        expect(isNamedBuildVisible('puntFt', CAT_KEYS)).toBe(true);
    });

    it('hides a card when none of its Need cats are enabled', () => {
        expect(isNamedBuildVisible('stocks', ['pts', 'trb'])).toBe(false);
        expect(isNamedBuildVisible('balanced', ['pts'])).toBe(true);
    });
});

describe('namedBuildHelper', () => {
    it('matches gallery copy for Fortress and Balanced', () => {
        expect(namedBuildHelper('puntFt', CAT_KEYS)).toBe('Need FG%, REB, BLK, PTS · Punt FT%');
        expect(namedBuildHelper('balanced', CAT_KEYS)).toBe('All cats Neutral');
        expect(namedBuildHelper('guards', CAT_KEYS)).toBe('Need PTS, 3PM, FT%, AST, STL · Punt BLK');
    });
});

describe('profile chrome copy', () => {
    it('uses the one-word label and omits a guessed name on old profiles', () => {
        expect(profileHeadline(profile({ archetypeId: 'puntFt', draftSlot: 7 }))).toBe(
            'Fortress · 12-team snake · pick 7'
        );
        expect(profileHeadline(profile())).toBe('12-team snake');
        expect(restoreSummary(profile({ archetypeId: 'puntFt', stances: { ftPct: 'punt' } }))).toBe(
            'Fortress · punt FT%'
        );
    });

    it('reads live stances so a Fortress edit still updates the summary', () => {
        expect(stanceSummary(profile({ stances: { trb: 'need', blk: 'need', ftPct: 'punt' } }))).toBe(
            'Need REB, BLK · Punt FT%'
        );
        expect(stanceSummary(profile())).toBe('All cats Neutral');
    });
});

describe('draftProfileSchema', () => {
    it('parses a pre-slot profile and rejects a slot past league size', () => {
        const parsed = draftProfileSchema.parse({
            leagueSize: 12,
            draftRounds: 13,
            draftType: 'snake',
            enabledCats: [...CAT_KEYS],
            stances: { ftPct: 'punt' }
        });
        expect(parsed.draftSlot).toBeUndefined();
        expect(parsed.archetypeId).toBeUndefined();
        expect(
            draftProfileSchema.safeParse({
                leagueSize: 12,
                draftRounds: 13,
                draftType: 'snake',
                enabledCats: [...CAT_KEYS],
                draftSlot: 14
            }).success
        ).toBe(false);
    });

    it('accepts even custom sizes and rejects odds', () => {
        const base = {
            draftRounds: 13,
            draftType: 'snake' as const,
            enabledCats: [...CAT_KEYS]
        };
        expect(draftProfileSchema.safeParse({ ...base, leagueSize: 12 }).success).toBe(true);
        expect(draftProfileSchema.safeParse({ ...base, leagueSize: 16 }).success).toBe(true);
        expect(draftProfileSchema.safeParse({ ...base, leagueSize: 13 }).success).toBe(false);
    });
});
