import { describe, expect, it } from 'vitest';
import {
    competitionRanks,
    formatComparisonValue,
    rankComparison,
    sortComparisonTeams,
    type ComparisonCategory,
    type ComparisonTeam
} from './league-comparison.ts';

const pts: ComparisonCategory = { key: 'pts', label: 'PTS', direction: 'higher', format: 'count' };
const tov: ComparisonCategory = { key: 'tov', label: 'TOV', direction: 'lower', format: 'count' };
const teams: ComparisonTeam[] = [
    { teamKey: '3', name: 'Charlie', isOwned: false, values: { pts: 6, tov: 4 } },
    { teamKey: '2', name: 'Beta', isOwned: true, values: { pts: 8, tov: 4 } },
    { teamKey: '1', name: 'Alpha', isOwned: false, values: { pts: 8, tov: 1 } },
    { teamKey: '4', name: 'Delta', isOwned: false, values: { pts: null, tov: 0 } }
];

describe('weekly comparison helpers', () => {
    it('uses competition ranks, counts zero as data, and leaves missing values unranked', () => {
        expect([...competitionRanks(teams, pts).values()]).toEqual([3, 1, 1, null]);
        expect(competitionRanks(teams, tov).get('4')).toBe(1);
        expect(rankComparison(teams, [pts])[3]!.ranks.pts).toBeNull();
    });
    it('sorts high/low directions and keeps missing values last with stable names', () => {
        expect(sortComparisonTeams(teams, pts).map((team) => team.name)).toEqual(['Alpha', 'Beta', 'Charlie', 'Delta']);
        expect(sortComparisonTeams(teams, tov).map((team) => team.name)).toEqual(['Delta', 'Alpha', 'Beta', 'Charlie']);
    });
    it('formats percentages from Yahoo decimals while preserving count source precision', () => {
        expect(formatComparisonValue(0.45678, 'percentage')).toBe('45.678%');
        expect(formatComparisonValue(2.25, 'count')).toBe('2.25');
        expect(formatComparisonValue(0, 'count')).toBe('0');
        expect(formatComparisonValue(null, 'count')).toBe('—');
    });
});
