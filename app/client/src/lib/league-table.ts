import {
    formatComparisonValue,
    type ComparisonCategory,
    type ComparisonTeam,
    type LeagueComparison
} from '@draft-duck/core';
import type { CSSProperties } from 'react';

/** Reverse category strength without reversing alphabetical ties or moving missing values above scored teams. */
export function orderLeagueTeams(
    teams: ComparisonTeam[],
    category?: ComparisonCategory,
    bestFirst = true
): ComparisonTeam[] {
    return [...teams].sort((a, b) => {
        if (!category) return stableName(a, b);
        const aValue = a.values[category.key],
            bValue = b.values[category.key];
        if (typeof aValue !== 'number') return typeof bValue === 'number' ? 1 : stableName(a, b);
        if (typeof bValue !== 'number') return -1;
        const delta = category.direction === 'higher' ? aValue - bValue : bValue - aValue;
        return (bestFirst ? -delta : delta) || stableName(a, b);
    });
}

/** Use distinct-value positions for color so tied values match without changing displayed competition ranks. */
export function comparisonHeat(
    comparison: LeagueComparison,
    team: ComparisonTeam,
    category: ComparisonCategory
): CSSProperties | undefined {
    const value = team.values[category.key];
    if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
    const distinctValues = [
        ...new Set(
            comparison.teams
                .map((entry) => entry.values[category.key])
                .filter((entry): entry is number => typeof entry === 'number' && Number.isFinite(entry))
        )
    ].sort((a, b) => (category.direction === 'higher' ? b - a : a - b));
    if (distinctValues.length < 2) return undefined;
    const positionIndex = distinctValues.indexOf(value);
    if (positionIndex < 0) return undefined;
    const position = positionIndex / (distinctValues.length - 1);
    const signed = 1 - 2 * position;
    if (signed === 0) return undefined;
    const token = signed > 0 ? 'var(--heat-good)' : 'var(--heat-bad)';
    const intensity = Math.round(Math.abs(signed) * 72);
    return { backgroundColor: `color-mix(in oklch, ${token} ${intensity}%, transparent)` };
}

export function formatLeagueValue(value: number | null | undefined, format: ComparisonCategory['format']): string {
    return formatComparisonValue(value, format);
}

function stableName(a: ComparisonTeam, b: ComparisonTeam): number {
    return a.name.localeCompare(b.name) || a.teamKey.localeCompare(b.teamKey);
}
