import { afterAll, describe, expect, it } from 'vitest';
import { CAT_KEYS } from '@draft-duck/core';
import { buildApp } from './app.ts';

const app = await buildApp({});
afterAll(() => app.close());

describe('CSV API', () => {
    it('starts without connection credentials and serves season players', async () => {
        expect((await app.inject('/health')).json()).toEqual({ ok: true });
        const response = await app.inject('/players');
        expect(response.statusCode).toBe(200);
        expect(response.json().players.length).toBeGreaterThan(0);
    });
    it('returns complete finite CSV rankings for a manual punt build', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/rank',
            payload: {
                profile: {
                    leagueSize: 12,
                    draftRounds: 13,
                    draftType: 'snake',
                    enabledCats: [...CAT_KEYS],
                    stances: { ftPct: 'punt' }
                }
            }
        });
        expect(response.statusCode).toBe(200);
        const players = response.json().players;
        expect(players.length).toBeGreaterThan(0);
        expect(players.every((player: { composite: number }) => Number.isFinite(player.composite))).toBe(true);
        expect(new Set(players.map((player: { playerId: string }) => player.playerId)).size).toBe(players.length);
    });
    it('validates rank requests and has no league workspace endpoint', async () => {
        expect((await app.inject({ method: 'POST', url: '/rank', payload: {} })).statusCode).toBe(400);
        expect((await app.inject('/league')).statusCode).toBe(404);
    });
});
