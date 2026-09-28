import { describe, expect, it } from 'vitest';
import { stancesForArchetype } from './named-builds.ts';
import { CsvProvider } from './csv-provider.ts';
import { fileURLToPath } from 'node:url';
import { rank } from './ranker.ts';
import {
    applyCatStance,
    applyCatTuner,
    complementCats,
    migrateDraftProfile,
    presetTuner,
    tunersForStances
} from './tuners.ts';
import { CAT_KEYS, type DraftProfile } from './types.ts';

const seasonPath = fileURLToPath(new URL('../../data/25_26_per_game.csv', import.meta.url));

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

describe('presetTuner', () => {
    it('bumps Neutral complements to 1.25 when FT% is punted', () => {
        const stances = { ftPct: 'punt' as const };
        expect(presetTuner('fgPct', stances, CAT_KEYS)).toBe(1.25);
        expect(presetTuner('trb', stances, CAT_KEYS)).toBe(1.25);
        expect(presetTuner('blk', stances, CAT_KEYS)).toBe(1.25);
        expect(presetTuner('pts', stances, CAT_KEYS)).toBe(1.25);
        expect(presetTuner('fg3', stances, CAT_KEYS)).toBe(1);
        expect(presetTuner('ftPct', stances, CAT_KEYS)).toBe(0);
    });

    it('keeps Fortress Need at 1.5 over the complement default', () => {
        const stances = stancesForArchetype('puntFt', CAT_KEYS);
        expect(presetTuner('fgPct', stances, CAT_KEYS)).toBe(1.5);
        expect(presetTuner('ftPct', stances, CAT_KEYS)).toBe(0);
        expect(presetTuner('ast', stances, CAT_KEYS)).toBe(1);
    });

    it('unions complements across two punts and drops punted cats', () => {
        const stances = { ftPct: 'punt' as const, fgPct: 'punt' as const };
        const complements = complementCats(stances, CAT_KEYS);
        expect(complements.has('fgPct')).toBe(false);
        expect(complements.has('ftPct')).toBe(false);
        expect(complements.has('trb')).toBe(true);
        expect(complements.has('blk')).toBe(true);
        expect(presetTuner('trb', stances, CAT_KEYS)).toBe(1.25);
    });
});

describe('applyCatTuner and applyCatStance', () => {
    it('marks a cat Custom when the slider leaves the preset', () => {
        const stances = { ftPct: 'punt' as const };
        const intensity = tunersForStances(stances, CAT_KEYS);
        const next = applyCatTuner(stances, intensity, 'fgPct', 1.4, CAT_KEYS);
        expect(next.stances.fgPct).toBe('custom');
        expect(next.intensity.fgPct).toBe(1.4);
    });

    it('writes Neutral 1.25 when FT% is punted and snaps Custom back', () => {
        const started = applyCatTuner(
            { ftPct: 'punt' },
            tunersForStances({ ftPct: 'punt' }, CAT_KEYS),
            'fgPct',
            1.4,
            CAT_KEYS
        );
        const reset = applyCatStance(started.stances, started.intensity, 'fgPct', 'neutral', CAT_KEYS);
        expect(reset.stances.fgPct).toBe('neutral');
        expect(reset.intensity.fgPct).toBe(1.25);
    });

    it('leaves Custom tuners alone when another cat is unpunted', () => {
        let stances: DraftProfile['stances'] = { ftPct: 'punt' };
        let intensity = tunersForStances(stances, CAT_KEYS);
        const dragged = applyCatTuner(stances, intensity, 'trb', 3, CAT_KEYS);
        stances = dragged.stances;
        intensity = dragged.intensity;
        const unpunted = applyCatStance(stances, intensity, 'ftPct', 'neutral', CAT_KEYS);
        expect(unpunted.stances.trb).toBe('custom');
        expect(unpunted.intensity.trb).toBe(3);
        expect(unpunted.intensity.fgPct).toBe(1);
        expect(unpunted.intensity.pts).toBe(1);
    });
});

describe('migrateDraftProfile', () => {
    it('turns old Need times intensity 2 into tuner 3 Custom', () => {
        const migrated = migrateDraftProfile(
            profile({
                stances: { pts: 'need' },
                intensity: { pts: 2 }
            })
        );
        expect(migrated.weightModel).toBe('tuner');
        expect(migrated.stances.pts).toBe('custom');
        expect(migrated.intensity?.pts).toBe(3);
    });

    it('fills gallery Fortress without old intensity using Need 1.5', () => {
        const migrated = migrateDraftProfile(
            profile({
                stances: stancesForArchetype('puntFt', CAT_KEYS),
                archetypeId: 'puntFt'
            })
        );
        expect(migrated.intensity?.fgPct).toBe(1.5);
        expect(migrated.intensity?.ftPct).toBe(0);
        expect(migrated.intensity?.ast).toBe(1);
        expect(migrated.stances.fgPct).toBe('need');
    });

    it('applies Neutral 1.25 on old punt-only profiles that omitted intensity', () => {
        const migrated = migrateDraftProfile(profile({ stances: { ftPct: 'punt' } }));
        expect(migrated.intensity?.fgPct).toBe(1.25);
        expect(migrated.stances.fgPct ?? 'neutral').toBe('neutral');
        expect(migrated.intensity?.fg3).toBe(1);
    });
});

describe('rank goldens for G tuners', () => {
    it('keeps all-neutral order when every tuner is 1', async () => {
        const universe = await new CsvProvider(seasonPath).load();
        const today = rank(universe, profile());
        const explicit = rank(
            universe,
            profile({
                intensity: Object.fromEntries(CAT_KEYS.map((cat) => [cat, 1])),
                weightModel: 'tuner'
            })
        );
        expect(explicit.map((player) => player.playerId)).toEqual(today.map((player) => player.playerId));
    });

    it('matches gallery Fortress with no stored intensity to written Need 1.5 tuners', async () => {
        const universe = await new CsvProvider(seasonPath).load();
        const fortressStances = stancesForArchetype('puntFt', CAT_KEYS);
        const implied = rank(universe, profile({ stances: fortressStances, archetypeId: 'puntFt' }));
        const written = rank(
            universe,
            profile({
                stances: fortressStances,
                intensity: tunersForStances(fortressStances, CAT_KEYS),
                archetypeId: 'puntFt',
                weightModel: 'tuner'
            })
        );
        expect(written.map((player) => player.playerId)).toEqual(implied.map((player) => player.playerId));
    });

    it('lifts Gobert when custom punt FT% writes complement 1.25', async () => {
        const universe = await new CsvProvider(seasonPath).load();
        const leftover = CAT_KEYS.filter((cat) => cat !== 'ftPct');
        const flat = rank(
            universe,
            profile({
                stances: { ftPct: 'punt' },
                intensity: { ftPct: 0, ...Object.fromEntries(leftover.map((cat) => [cat, 1])) },
                weightModel: 'tuner'
            })
        );
        const bumped = rank(universe, profile({ stances: { ftPct: 'punt' } }));
        const gobertFlat = flat.find((player) => player.playerId === 'goberru01');
        const gobertBumped = bumped.find((player) => player.playerId === 'goberru01');
        expect(gobertFlat && gobertBumped).toBeTruthy();
        expect(gobertBumped!.composite).toBeGreaterThan(gobertFlat!.composite);
        expect(presetTuner('fgPct', { ftPct: 'punt' }, CAT_KEYS)).toBe(1.25);
    });
});
