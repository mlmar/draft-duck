// Fixture covers the edge cases. Season dump is a sanity check against the real CSV.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CsvProvider } from './csv-provider.ts';

const fixturePath = fileURLToPath(new URL('./fixtures/blank-pct.csv', import.meta.url));
const seasonPath = fileURLToPath(new URL('../../data/25_26_per_game.csv', import.meta.url));

describe('CsvProvider fixture', () => {
    it('drops league average, collapse trades, filters min games, and nulls empty percents', async () => {
        const players = await new CsvProvider(fixturePath).load();
        const ids = players.map((player) => player.playerId);

        expect(ids).toEqual(['noshots01', 'tradegu01']);
        expect(ids).not.toContain('-9999');
        expect(ids).not.toContain('benchpl01');

        const noShots = players.find((player) => player.playerId === 'noshots01');
        expect(noShots?.fgPct).toBeNull();
        expect(noShots?.ftPct).toBeNull();
        expect(noShots?.fga).toBe(0);
        expect(noShots?.fta).toBe(0);

        const traded = players.find((player) => player.playerId === 'tradegu01');
        expect(traded?.team).toBe('2TM');
        expect(traded?.games).toBe(40);
        expect(traded?.fgPct).toBe(0.5);
    });

    it('honors an overridden min-games floor', async () => {
        const players = await new CsvProvider(fixturePath, { minGames: 10 }).load();
        expect(players.map((player) => player.playerId)).toEqual(['noshots01', 'tradegu01', 'benchpl01']);
    });
});

describe('CsvProvider season dump', () => {
    it('yields unique Basketball-Reference ids with no league average or trade duplicates', async () => {
        const players = await new CsvProvider(seasonPath).load();
        const ids = players.map((player) => player.playerId);

        expect(ids.length).toBeGreaterThan(0);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).not.toContain('-9999');
        expect(players.every((player) => player.games >= 20)).toBe(true);

        // Harden was traded, so the dump should keep the 2TM combined line.
        const harden = players.find((player) => player.playerId === 'hardeja01');
        expect(harden?.team).toBe('2TM');
        expect(harden?.name).toBe('James Harden');

        // Trae is under the 20-game floor in this dump.
        expect(ids).not.toContain('youngtr01');
    });
});
