import { describe, expect, it } from 'vitest';
import { fitMarks, needCatFit, whyCopy } from './need-fit.ts';
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

function ranked(partial: Partial<RankedPlayer> & Pick<RankedPlayer, 'playerId'>): RankedPlayer {
    return {
        ...season(partial),
        z: {},
        composite: 0,
        rank: 1,
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

describe('needCatFit', () => {
    const fortress = profile({
        stances: { fgPct: 'need', trb: 'need', blk: 'need', pts: 'need', ftPct: 'punt' }
    });

    it('hides the number when there are no Need cats', () => {
        expect(needCatFit(ranked({ playerId: 'aaa', z: { pts: 2 } }), profile())).toBeNull();
    });

    it('maps about +2z Need average to 100 and 0z to 50', () => {
        expect(needCatFit(ranked({ playerId: 'aaa', z: { pts: 2, trb: 2, blk: 2, fgPct: 2 } }), fortress)).toBe(100);
        expect(needCatFit(ranked({ playerId: 'bbb', z: { pts: 0, trb: 0, blk: 0, fgPct: 0 } }), fortress)).toBe(50);
        expect(needCatFit(ranked({ playerId: 'ccc', z: { pts: -2, trb: -2, blk: -2, fgPct: -2 } }), fortress)).toBe(0);
    });
});

describe('whyCopy', () => {
    it('uses the allowed elite, light-Need, and punt lines', () => {
        const fortress = profile({
            stances: { fgPct: 'need', trb: 'need', ast: 'need', ftPct: 'punt' }
        });
        expect(whyCopy(ranked({ playerId: 'aaa', z: { trb: 1.4, ast: 1.1, fgPct: 1.2, ftPct: 0.2 } }), fortress)).toBe(
            'Elite REB, AST, FG% for this build.'
        );
        expect(whyCopy(ranked({ playerId: 'bbb', z: { fg3: -0.8 } }), profile({ stances: { fg3: 'need' } }))).toBe(
            'Light on 3PM, which you marked Need.'
        );
        expect(whyCopy(ranked({ playerId: 'ccc', z: { ftPct: -1 } }), profile({ stances: { ftPct: 'punt' } }))).toBe(
            'Poor FT% matches your punt.'
        );
    });
});

describe('fitMarks', () => {
    it('lists Need cats first and punted cats as ignored', () => {
        const marks = fitMarks(
            ranked({ playerId: 'aaa', z: { stl: 1.4, blk: 0.9, pts: 2 } }),
            profile({ stances: { stl: 'need', blk: 'need', pts: 'punt' } })
        );
        expect(marks).toEqual([
            { text: 'STL +1.40', muted: false },
            { text: 'BLK +0.90', muted: false },
            { text: 'PTS ignored', muted: true }
        ]);
    });
});
