import { describe, expect, it } from 'vitest';
import { assertPublicApiUrl } from './assert-public-api-url.mjs';

// Production bake. Local http://localhost:3300 is .env only, never this check.

describe('assertPublicApiUrl', () => {
    it('accepts a Cloud Run origin', () => {
        expect(assertPublicApiUrl('https://draft-duck-api-123.run.app')).toBe('https://draft-duck-api-123.run.app');
        expect(assertPublicApiUrl('  https://draft-duck-api-123.run.app  ')).toBe('https://draft-duck-api-123.run.app');
    });

    it('rejects empty, http, trailing slash, loopback, and paths', () => {
        expect(() => assertPublicApiUrl('')).toThrow(/Cloud Run origin/);
        expect(() => assertPublicApiUrl(undefined)).toThrow(/Cloud Run origin/);
        expect(() => assertPublicApiUrl('http://localhost:3300')).toThrow(/https/);
        expect(() => assertPublicApiUrl('https://draft-duck-api-123.run.app/')).toThrow(/slash/);
        expect(() => assertPublicApiUrl('https://localhost')).toThrow(/loopback/);
        expect(() => assertPublicApiUrl('https://127.0.0.1')).toThrow(/loopback/);
        expect(() => assertPublicApiUrl('https://draft-duck-api-123.run.app/rank')).toThrow(/origin only/);
    });
});
