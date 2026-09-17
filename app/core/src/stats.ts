// Population mean: Σx / n. Empty list is 0 so callers can skip a length check.
export function mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

// Population std: sqrt(Σ(x - mean)² / n). The filtered universe is the whole set, not a sample.
export function std(values: number[], valuesMean = mean(values)): number {
    if (values.length === 0) return 0;
    const variance = values.reduce((sum, value) => sum + (value - valuesMean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
}

// z = (x - mean) / std. std === 0 => z = 0 so a flat universe does not explode.
export function zScore(x: number, valuesMean: number, valuesStd: number): number {
    if (valuesStd === 0) return 0;
    return (x - valuesMean) / valuesStd;
}
