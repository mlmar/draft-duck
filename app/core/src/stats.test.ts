import { describe, expect, it } from 'vitest';
import { mean, std, zScore } from './stats.ts';

describe('mean / std / zScore', () => {
    it('computes population mean and std on a tiny array', () => {
        const values = [1, 2, 3];
        expect(mean(values)).toBe(2);
        // sqrt(((1-2)² + (2-2)² + (3-2)²) / 3) = sqrt(2/3)
        expect(std(values, 2)).toBeCloseTo(Math.sqrt(2 / 3));
    });

    it('returns z = 0 when std is 0', () => {
        expect(zScore(5, 5, 0)).toBe(0);
        expect(std([4, 4, 4])).toBe(0);
    });

    it('computes z = (x - mean) / std', () => {
        const valuesStd = Math.sqrt(2 / 3);
        expect(zScore(3, 2, valuesStd)).toBeCloseTo(1 / valuesStd);
    });
});
