import { describe, expect, it } from 'vitest';
import { routerBasepath, viteBase } from './base-path.ts';

// Pages is /draft-duck/. These cases are the bake-time contract. Do not loosen them.

describe('viteBase', () => {
    it('defaults unset and blank to root with a trailing slash', () => {
        expect(viteBase(undefined)).toBe('/');
        expect(viteBase('')).toBe('/');
        expect(viteBase('   ')).toBe('/');
    });

    it('keeps / as /', () => {
        expect(viteBase('/')).toBe('/');
    });

    it('gives Pages a trailing slash', () => {
        expect(viteBase('/draft-duck')).toBe('/draft-duck/');
        expect(viteBase('/draft-duck/')).toBe('/draft-duck/');
    });

    it('prefixes a missing leading slash so the base is not relative', () => {
        expect(viteBase('draft-duck')).toBe('/draft-duck/');
    });
});

describe('routerBasepath', () => {
    it('treats unset, blank, and / as no basepath', () => {
        expect(routerBasepath(undefined)).toBeUndefined();
        expect(routerBasepath('')).toBeUndefined();
        expect(routerBasepath('/')).toBeUndefined();
    });

    it('strips trailing slashes for the router', () => {
        expect(routerBasepath('/draft-duck')).toBe('/draft-duck');
        expect(routerBasepath('/draft-duck/')).toBe('/draft-duck');
    });

    it('prefixes a missing leading slash', () => {
        expect(routerBasepath('draft-duck')).toBe('/draft-duck');
    });
});
