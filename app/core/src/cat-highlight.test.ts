import { describe, expect, it } from 'vitest';
import {
    catHighlightStrategy,
    formatSignedScore,
    heatFromScore,
    HEAT_CLAMP,
    HEAT_DEAD_ZONE,
    leagueZHighlight,
    teamNeedHighlight
} from './cat-highlight.ts';
import { CAT_KEYS, type DraftProfile, type PlayerSeason, type RankedPlayer } from './types.ts';

function season(partial: Partial<PlayerSeason> & Pick<PlayerSeason, 'playerId'>): PlayerSeason {
    return {
        name: partial.playerId,
        team: 'TST',
        pos: 'F',
        age: 25,
        games: 50,
        mp: 30,
        pts: 10,
        trb: 5,
        ast: 3,
        stl: 1,
        blk: 0.5,
        fg3: 1,
        fg3a: 3,
        fg: 4,
        fga: 8,
        fgPct: 0.5,
        ft: 2,
        fta: 2.5,
        ftPct: 0.8,
        tov: 2,
        ...partial
    };
}

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

function ranked(partial: Partial<RankedPlayer> & Pick<RankedPlayer, 'playerId'>): RankedPlayer {
    return {
        ...season(partial),
        z: {},
        composite: 0,
        rank: 1,
        ...partial
    };
}

describe('catHighlightStrategy', () => {
    it('returns teamNeed by default so the board colors the quiz, not only league z', () => {
        expect(catHighlightStrategy().id).toBe('teamNeed');
        expect(catHighlightStrategy('teamNeed')).toBe(teamNeedHighlight);
        expect(catHighlightStrategy('leagueZ')).toBe(leagueZHighlight);
    });
});

describe('leagueZHighlight', () => {
    const inputProfile = profile();

    it('uses ranker z, not the raw counting stat', () => {
        const player = ranked({ playerId: 'aaa', pts: 40, z: { pts: 1.24 } });
        expect(leagueZHighlight.score({ player, cat: 'pts', profile: inputProfile })).toEqual({
            score: 1.24,
            title: 'z 1.24'
        });
    });

    it('returns null when z is missing for a disabled cat', () => {
        const player = ranked({ playerId: 'aaa', z: { pts: 1 } });
        expect(leagueZHighlight.score({ player, cat: 'tov', profile: inputProfile })).toEqual({
            score: null,
            title: 'No z'
        });
    });

    it('leaves null shot rates uncolored even if impact z is 0', () => {
        const player = ranked({ playerId: 'aaa', fgPct: null, z: { fgPct: 0 } });
        expect(leagueZHighlight.score({ player, cat: 'fgPct', profile: inputProfile })).toEqual({
            score: null,
            title: 'No attempts'
        });
    });
});

describe('heatFromScore', () => {
    it('returns null for missing scores', () => {
        expect(heatFromScore(null)).toBeNull();
        expect(heatFromScore(Number.NaN)).toBeNull();
    });

    it('keeps the dead zone uncolored so average cells keep zebra', () => {
        expect(heatFromScore(0)).toBeNull();
        expect(heatFromScore(HEAT_DEAD_ZONE - 0.01)).toBeNull();
        expect(heatFromScore(-(HEAT_DEAD_ZONE - 0.01))).toBeNull();
    });

    it('maps sign and clamps intensity at +/- 2', () => {
        expect(heatFromScore(HEAT_DEAD_ZONE)).toEqual({
            sign: 1,
            intensity: HEAT_DEAD_ZONE / HEAT_CLAMP
        });
        expect(heatFromScore(-1)).toEqual({ sign: -1, intensity: 0.5 });
        expect(heatFromScore(HEAT_CLAMP)).toEqual({ sign: 1, intensity: 1 });
        expect(heatFromScore(-8)).toEqual({ sign: -1, intensity: 1 });
        expect(heatFromScore(8)).toEqual({ sign: 1, intensity: 1 });
    });
});

describe('teamNeedHighlight', () => {
    it('leaves punted cats uncolored and uses league z on the rest', () => {
        const inputProfile = profile({ stances: { ftPct: 'punt', pts: 'need' } });
        const player = ranked({ playerId: 'aaa', pts: 30, ftPct: 0.9, z: { pts: 1.5, ftPct: 2 } });
        expect(teamNeedHighlight.score({ player, cat: 'ftPct', profile: inputProfile })).toEqual({
            score: null,
            title: 'Punted'
        });
        expect(teamNeedHighlight.score({ player, cat: 'pts', profile: inputProfile })).toEqual({
            score: 1.5,
            title: 'z 1.50'
        });
    });
});

describe('formatSignedScore', () => {
    it('formats the strategy score with an explicit plus, not NBA plus-minus', () => {
        expect(formatSignedScore(1.24)).toBe('+1.24');
        expect(formatSignedScore(-0.4)).toBe('-0.40');
        expect(formatSignedScore(0)).toBe('0.00');
        expect(formatSignedScore(null)).toBe('-');
    });
});
