import { describe, expect, it } from 'vitest';
import {
    aggregateTeamStrength,
    appendTeamLabRow,
    applyTeamLabPreview,
    createTeamLabState,
    createTeamRosterRecord,
    displayedTeamLabPlayerIds,
    parseTeamRosterRecord,
    rankTeamLabUniverse,
    resetTeamLabPreview,
    serializeTeamRosterRecord,
    setTeamLabCandidate,
    setTeamLabRosterPlayer,
    swapTeamLabRow,
    toggleTeamLabBulkSwap,
    type PlayerSeason
} from './index.ts';

/** Make compact season fixtures with enough raw counts to verify weighted percentages. */
function season(playerId: string, partial: Partial<PlayerSeason> = {}): PlayerSeason {
    // Default all counting stats to zero so each test changes only the data relevant to its assertion.
    return {
        playerId,
        name: playerId,
        team: 'TST',
        pos: 'G',
        age: 25,
        games: 70,
        mp: 30,
        pts: 10,
        trb: 5,
        ast: 3,
        stl: 1,
        blk: 1,
        fg3: 1,
        fg3a: 3,
        fg: 4,
        fga: 10,
        fgPct: 0.4,
        ft: 2,
        fta: 2,
        ftPct: 1,
        tov: 2,
        ...partial
    };
}

/** Read a row by its stable identity so transition assertions stay independent of array position. */
function row(state: ReturnType<typeof createTeamLabState>, rowId: string) {
    // Fail loudly when a transition unexpectedly drops a row from the workspace.
    const found = state.rows.find((entry) => entry.rowId === rowId);
    if (!found) throw new Error(`Missing row ${rowId}`);
    return found;
}

describe('Team Lab roster and strength contracts', () => {
    it('validates versioned roster data and preserves only roster name snapshots', () => {
        // Valid records round-trip IDs and names while missing and malformed storage remain distinguishable.
        const record = createTeamRosterRecord(['a', 'b'], { a: 'Player A', former: 'Ignored' });
        const serialized = serializeTeamRosterRecord(record);
        expect(parseTeamRosterRecord(serialized)).toEqual({ status: 'valid', record });
        expect(parseTeamRosterRecord(null)).toEqual({ status: 'empty' });
        expect(parseTeamRosterRecord('{')).toEqual({ status: 'invalid', reason: 'invalid-json' });
        expect(parseTeamRosterRecord('{"version":2,"playerIds":[],"playerNames":{}}')).toEqual({
            status: 'invalid',
            reason: 'invalid-record'
        });
        expect(parseTeamRosterRecord('{"version":1,"playerIds":["a","a"],"playerNames":{}}')).toEqual({
            status: 'invalid',
            reason: 'invalid-record'
        });
        expect(() => createTeamRosterRecord(['a', 'a'])).toThrow('unique');
    });

    it('calculates all category z-scores from the fixed universe and aggregates average or total strength', () => {
        // Team ranking reuses the production ranker with all nine categories available, including lower-is-better TOV.
        const ranked = rankTeamLabUniverse([
            season('efficient', { pts: 20, tov: 1, fgPct: 0.6, fga: 10, fg: 6, ftPct: 0.9, fta: 5, ft: 4 }),
            season('ordinary', { pts: 10, tov: 2, fgPct: 0.4, fga: 20, fg: 8, ftPct: 0.8, fta: 10, ft: 8 }),
            season('careless', { pts: 5, tov: 4, fgPct: 0.3, fga: 30, fg: 9, ftPct: 0.7, fta: 20, ft: 14 })
        ]);
        const average = aggregateTeamStrength(ranked, ['efficient', 'ordinary'], 'average');
        const total = aggregateTeamStrength(ranked, ['efficient', 'ordinary'], 'total');

        // Every bar is the unweighted category z-score mean or sum; raw team rates use aggregate makes and attempts.
        expect(average.status).toBe('ready');
        expect(total.status).toBe('ready');
        if (average.status !== 'ready' || total.status !== 'ready') throw new Error('Expected ready aggregates');
        expect(Object.keys(average.strength)).toHaveLength(9);
        expect(average.strength.pts).toBeCloseTo((ranked[0]!.z.pts! + ranked[1]!.z.pts!) / 2);
        expect(total.strength.tov).toBeCloseTo(ranked[0]!.z.tov! + ranked[1]!.z.tov!);
        expect(average.raw.fgPct).toBeCloseTo(14 / 30);
        expect(average.raw.ftPct).toBeCloseTo(12 / 15);
        expect(average.raw.fga).toBe(30);
    });

    it('marks empty and incomplete rosters instead of returning partial category values', () => {
        // Unknown saved IDs, duplicate membership, missing category values, and zero-attempt rates remain explicit.
        const ranked = rankTeamLabUniverse([
            season('one', { fga: 0, fgPct: null, fta: 0, ftPct: null }),
            season('two', { pts: 15 })
        ]);
        expect(aggregateTeamStrength(ranked, [], 'average')).toEqual({ status: 'empty' });
        expect(aggregateTeamStrength(ranked, ['unknown'], 'total')).toEqual({
            status: 'unavailable',
            reason: 'missing-player',
            playerIds: ['unknown']
        });
        expect(aggregateTeamStrength(ranked, ['one', 'one'], 'total')).toEqual({
            status: 'unavailable',
            reason: 'duplicate-player',
            playerIds: ['one']
        });
        const missingScore = aggregateTeamStrength(
            [{ ...ranked.find((player) => player.playerId === 'one')!, z: { pts: 1 } }],
            ['one'],
            'average'
        );
        expect(missingScore).toEqual({ status: 'unavailable', reason: 'missing-score', playerIds: ['one'] });
        const invalidRawStats = aggregateTeamStrength(
            [{ ...ranked.find((player) => player.playerId === 'one')!, pts: Number.NaN }],
            ['one'],
            'average'
        );
        expect(invalidRawStats).toEqual({ status: 'unavailable', reason: 'invalid-stat', playerIds: ['one'] });
        const zeroAttempts = aggregateTeamStrength(ranked, ['one'], 'average');
        expect(zeroAttempts.status).toBe('ready');
        if (zeroAttempts.status === 'ready') {
            expect(zeroAttempts.raw.fgPct).toBeNull();
            expect(zeroAttempts.raw.ftPct).toBeNull();
        }
    });

    it('keeps manual row choices pinned while bulk controls only its captured candidate rows', () => {
        // Row one is pinned before bulk activation; a new row is pinned during the batch and survives restoration.
        let state = createTeamLabState(['saved-a', 'saved-b']);
        state = setTeamLabCandidate(state, 'row-1', 'candidate-a');
        state = setTeamLabCandidate(state, 'row-2', 'candidate-b');
        state = swapTeamLabRow(state, 'row-1');
        state = toggleTeamLabBulkSwap(state);
        expect(state.bulkControlledRowIds).toEqual(['row-2']);
        expect(displayedTeamLabPlayerIds(state, row(state, 'row-1'))).toEqual({
            left: 'candidate-a',
            right: 'saved-a'
        });
        expect(displayedTeamLabPlayerIds(state, row(state, 'row-2'))).toEqual({
            left: 'candidate-b',
            right: 'saved-b'
        });

        // Rows added after activation wait for the next batch, and a manual swap pins their current chosen side.
        state = appendTeamLabRow(state, 'late-row');
        state = setTeamLabCandidate(state, 'late-row', 'candidate-c');
        expect(state.bulkControlledRowIds).toEqual(['row-2']);
        state = swapTeamLabRow(state, 'late-row');
        state = swapTeamLabRow(state, 'row-2');
        state = toggleTeamLabBulkSwap(state);

        // Bulk deactivation restores only its remaining batch-owned rows and leaves every manual choice intact.
        expect(displayedTeamLabPlayerIds(state, row(state, 'row-1'))).toEqual({
            left: 'candidate-a',
            right: 'saved-a'
        });
        expect(displayedTeamLabPlayerIds(state, row(state, 'row-2'))).toEqual({
            left: 'saved-b',
            right: 'candidate-b'
        });
        expect(displayedTeamLabPlayerIds(state, row(state, 'late-row'))).toEqual({ left: 'candidate-c', right: null });
    });

    it('rejects duplicate candidate identities and supports candidate-only additions and roster-only drops', () => {
        // Duplicate exclusion applies across saved and candidate ownership while one-sided rows remain swappable.
        let state = createTeamLabState(['saved']);
        state = appendTeamLabRow(state, 'addition');
        state = setTeamLabCandidate(state, 'addition', 'new');
        expect(() => setTeamLabCandidate(state, 'row-1', 'new')).toThrow('already in the Team Lab workspace');
        state = swapTeamLabRow(state, 'addition');
        expect(displayedTeamLabPlayerIds(state, row(state, 'addition'))).toEqual({ left: 'new', right: null });
        state = swapTeamLabRow(state, 'row-1');
        expect(displayedTeamLabPlayerIds(state, row(state, 'row-1'))).toEqual({ left: null, right: 'saved' });
        expect(() => swapTeamLabRow(state, 'row-2')).toThrow('empty row');
    });

    it('saves teammate edits into empty aligned rows without changing candidate ownership', () => {
        // Actual roster edits can fill or clear one side independently until preview begins.
        let state = createTeamLabState(['saved']);
        state = setTeamLabCandidate(state, 'row-1', 'candidate');
        state = setTeamLabRosterPlayer(state, 'row-2', 'second-saved');
        expect(state.rows.map((entry) => [entry.rosterPlayerId, entry.candidatePlayerId])).toEqual([
            ['saved', 'candidate'],
            ['second-saved', null]
        ]);
        expect(() => setTeamLabRosterPlayer(state, 'row-2', 'candidate')).toThrow('already in the Team Lab workspace');
        state = setTeamLabRosterPlayer(state, 'row-1', null);
        expect(state.rows[0]?.candidatePlayerId).toBe('candidate');
        expect(state.rows[0]?.rosterPlayerId).toBeNull();
    });

    it('resets orientation while retaining candidates and applies the complete displayed left side', () => {
        // Reset drops all swap ownership but keeps candidate selection; Apply saves every left occupant and clears candidates.
        let state = createTeamLabState(['saved-a', 'saved-b']);
        state = setTeamLabCandidate(state, 'row-1', 'candidate-a');
        state = setTeamLabCandidate(state, 'row-2', 'candidate-b');
        state = swapTeamLabRow(state, 'row-1');
        const reset = resetTeamLabPreview(state);
        expect(displayedTeamLabPlayerIds(reset, row(reset, 'row-1'))).toEqual({
            left: 'saved-a',
            right: 'candidate-a'
        });
        expect(row(reset, 'row-1').candidatePlayerId).toBe('candidate-a');

        // Applying a mixed lineup preserves displayed ordering, replaces saved ownership, and clears preview state.
        const applied = applyTeamLabPreview(state);
        expect(applied.rosterPlayerIds).toEqual(['candidate-a', 'saved-b']);
        expect(applied.state.rows.map((entry) => entry.rosterPlayerId)).toEqual(['candidate-a', 'saved-b', null]);
        expect(applied.state.rows.every((entry) => entry.candidatePlayerId === null)).toBe(true);
        expect(applied.state.manualSwaps).toEqual({});
        expect(applied.state.bulkControlledRowIds).toBeNull();
    });
});
