import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { rankComparison, type ComparisonCategory, type LeagueComparison, type ComparisonTeam } from '@draft-duck/core';
import { ComparisonTable } from './league-workspace.tsx';

const categories: ComparisonCategory[] = [
    { key: 'pts', label: 'PTS', direction: 'higher', format: 'count' },
    { key: 'tov', label: 'TOV', direction: 'lower', format: 'count' }
];
const teams: ComparisonTeam[] = [
    { teamKey: 'nba.2026.l.1.t.1', name: 'Owned A', isOwned: true, values: { pts: 10, tov: 2 } },
    { teamKey: 'nba.2026.l.1.t.2', name: 'Rival B', isOwned: false, values: { pts: 0, tov: null } }
];
const comparison: LeagueComparison = {
    league: {
        leagueKey: 'nba.2026.l.1',
        name: 'League',
        season: 2026,
        teamCount: 2,
        currentWeek: 4,
        weeks: [1, 2, 3, 4]
    },
    week: 4,
    inProgress: true,
    fetchedAt: '2026-11-06T12:00:00.000Z',
    categories,
    teams
};

describe('league table markup', () => {
    it('renders semantic sort controls, readable team ownership, raw values, and ranks', () => {
        const markup = renderToStaticMarkup(
            createElement(ComparisonTable, {
                comparison,
                teams,
                ranksByTeam: new Map(rankComparison(teams, categories).map((team) => [team.teamKey, team.ranks])),
                sortState: { key: 'pts', bestFirst: true },
                onSort: vi.fn()
            })
        );
        expect(markup).toContain('role="region"');
        expect(markup).toContain('aria-label="Weekly league category results"');
        expect(markup).toContain('aria-sort="descending"');
        expect(markup).toContain('aria-label="Sort by PTS, worst first"');
        expect(markup).toContain('bg-secondary');
        expect(markup).toContain('Your team');
        expect(markup).toContain('>10<');
        expect(markup).toContain('#1');
        expect(markup).toContain('>0<');
        expect(markup).toContain('unranked');
    });
});
