import { heatFromScore } from '@draft-duck/core';
import type { CSSProperties } from 'react';

// Token mix lives here so strategies stay numeric. Intensity is 0-1 on the shared ramp.

export function catHeatStyle(score: number | null): CSSProperties | undefined {
    const ramp = heatFromScore(score);
    if (!ramp) return undefined;
    const token = ramp.sign > 0 ? 'var(--heat-good)' : 'var(--heat-bad)';
    const pct = Math.round(ramp.intensity * 100);
    return { backgroundColor: `color-mix(in oklch, ${token} ${pct}%, transparent)` };
}
