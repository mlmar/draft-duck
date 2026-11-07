import { describe, expect, it } from 'vitest';
import type { ComparisonCategory, ComparisonTeam, LeagueComparison } from '@draft-duck/core';
import { comparisonHeat, formatLeagueValue, orderLeagueTeams } from './league-table.ts';

const pts: ComparisonCategory = { key: 'pts', label: 'PTS', direction: 'higher', format: 'count' };
const tov: ComparisonCategory = { key: 'tov', label: 'TOV', direction: 'lower', format: 'count' };
const teams: ComparisonTeam[] = [
    { teamKey: 'b', name: 'Beta', isOwned: true, values: { pts: 12, tov: 2 } },
    { teamKey: 'a', name: 'Alpha', isOwned: false, values: { pts: 12, tov: 5 } },
    { teamKey: 'c', name: 'Charlie', isOwned: false, values: { pts: 4, tov: 0 } },
    { teamKey: 'd', name: 'Delta', isOwned: false, values: { pts: null, tov: null } }
];
const comparison: LeagueComparison = {
    league: { leagueKey: 'nba.2026.l.1', name: 'League', season: 2026, teamCount: 4, currentWeek: 2, weeks: [1, 2] },
    week: 2,
    inProgress: true,
    fetchedAt: '2026-11-06T12:00:00Z',
    categories: [pts, tov],
    teams
};

describe('League comparison table helpers', () => {
    it('defaults alphabetically and sorts best or worst with ties stable in either direction', () => {
        expect(orderLeagueTeams(teams).map((team) => team.name)).toEqual(['Alpha', 'Beta', 'Charlie', 'Delta']);
        expect(orderLeagueTeams(teams, pts, true).map((team) => team.name)).toEqual([
            'Alpha',
            'Beta',
            'Charlie',
            'Delta'
        ]);
        expect(orderLeagueTeams(teams, pts, false).map((team) => team.name)).toEqual([
            'Charlie',
            'Alpha',
            'Beta',
            'Delta'
        ]);
        expect(orderLeagueTeams(teams, tov, true).map((team) => team.name)).toEqual([
            'Charlie',
            'Beta',
            'Alpha',
            'Delta'
        ]);
        expect(orderLeagueTeams(teams, tov, false).map((team) => team.name)).toEqual([
            'Alpha',
            'Beta',
            'Charlie',
            'Delta'
        ]);
    });
    it('colors distinct category values while keeping ties equal and missing or all-tied values neutral', () => {
        expect(comparisonHeat(comparison, teams[0]!, pts)).toStrictEqual(comparisonHeat(comparison, teams[1]!, pts));
        expect(comparisonHeat(comparison, teams[0]!, pts)?.backgroundColor).toContain('var(--heat-good)');
        expect(comparisonHeat(comparison, teams[2]!, pts)?.backgroundColor).toContain('var(--heat-bad)');
        expect(comparisonHeat(comparison, teams[3]!, pts)).toBeUndefined();
        expect(comparisonHeat(comparison, teams[2]!, tov)?.backgroundColor).toContain('var(--heat-good)');
        const tied = { ...comparison, teams: teams.slice(0, 2).map((team) => ({ ...team, values: { pts: 10 } })) };
        expect(comparisonHeat(tied, tied.teams[0]!, pts)).toBeUndefined();
        const sparseTeams: ComparisonTeam[] = [
            { teamKey: 'best', name: 'Best', isOwned: false, values: { pts: 9 } },
            { teamKey: 'worst', name: 'Worst', isOwned: false, values: { pts: 1 } },
            ...Array.from({ length: 6 }, (_, index) => ({
                teamKey: `missing-${index}`,
                name: `Missing ${index}`,
                isOwned: false,
                values: { pts: null }
            }))
        ];
        const sparse = { ...comparison, teams: sparseTeams };
        expect(comparisonHeat(sparse, sparseTeams[0]!, pts)?.backgroundColor).toContain('var(--heat-good)');
        expect(comparisonHeat(sparse, sparseTeams[1]!, pts)?.backgroundColor).toContain('var(--heat-bad)');
    });
    it('keeps source precision for counts and percentages and renders missing values clearly', () => {
        expect(formatLeagueValue(10.125, 'count')).toBe('10.125');
        expect(formatLeagueValue(0.45678, 'percentage')).toBe('45.678%');
        expect(formatLeagueValue(0, 'count')).toBe('0');
        expect(formatLeagueValue(null, 'count')).toBe('—');
    });
});
