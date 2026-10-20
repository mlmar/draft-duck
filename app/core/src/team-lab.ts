import { rank } from './ranker.ts';
import type { CatKey, PlayerSeason, RankedPlayer } from './types.ts';
import { CAT_KEYS } from './types.ts';

/** Keep the saved roster format separate from draft-profile persistence. */
export const TEAM_ROSTER_STORAGE_KEY = 'dd.teamRoster';

/** Version saved roster records so future changes can be migrated safely. */
export const TEAM_ROSTER_VERSION = 1 as const;

/** Persist IDs and display-name snapshots only; all scores are recalculated from the loaded player universe. */
export type TeamRosterRecord = {
    version: typeof TEAM_ROSTER_VERSION;
    playerIds: string[];
    playerNames: Record<string, string>;
};

/** Provide a small parse result that lets the UI distinguish missing data from invalid saved data. */
export type TeamRosterParseResult =
    | { status: 'empty' }
    | { status: 'valid'; record: TeamRosterRecord }
    | { status: 'invalid'; reason: 'invalid-json' | 'invalid-record' };

/** A stable row keeps saved ownership and a hypothetical candidate independent of their displayed sides. */
export type TeamLabRow = {
    rowId: string;
    rosterPlayerId: string | null;
    candidatePlayerId: string | null;
};

/** Manual orientations override a captured bulk batch, while null means bulk is inactive. */
export type TeamLabState = {
    rows: TeamLabRow[];
    manualSwaps: Record<string, boolean>;
    bulkControlledRowIds: string[] | null;
};

/** Describe whether a roster aggregate is ready, empty, or incomplete for an explicit reason. */
export type TeamStrengthResult =
    | { status: 'empty' }
    | {
          status: 'unavailable';
          reason: 'duplicate-player' | 'missing-player' | 'missing-score' | 'invalid-stat';
          playerIds: string[];
      }
    | { status: 'ready'; playerCount: number; strength: Record<CatKey, number>; raw: TeamRawTotals };

/** Store summed counting stats and attempt-weighted team percentages for display below the chart. */
export type TeamRawTotals = {
    pts: number;
    trb: number;
    ast: number;
    stl: number;
    blk: number;
    fg3: number;
    tov: number;
    fg: number;
    fga: number;
    ft: number;
    fta: number;
    fg3a: number;
    fgPct: number | null;
    ftPct: number | null;
};

/** Validate the serialized local roster and keep corrupt storage recoverable by reporting a typed reason. */
export function parseTeamRosterRecord(serialized: string | null): TeamRosterParseResult {
    // Missing storage is a first-class empty state and does not need to pass JSON parsing.
    if (serialized === null) return { status: 'empty' };

    let decoded: unknown;
    // Catch malformed JSON without making storage recovery a rendering exception.
    try {
        decoded = JSON.parse(serialized) as unknown;
    } catch {
        return { status: 'invalid', reason: 'invalid-json' };
    }

    // Validate structure, version, unique IDs, and name-snapshot ownership before accepting state.
    if (!isTeamRosterRecord(decoded)) return { status: 'invalid', reason: 'invalid-record' };
    return { status: 'valid', record: decoded };
}

/** Build a validated version-one roster record from selected IDs and any known player-name snapshots. */
export function createTeamRosterRecord(
    playerIds: string[],
    playerNames: Record<string, string> = {}
): TeamRosterRecord {
    // Reject duplicate or blank identities early so invalid saved membership never reaches the UI.
    if (playerIds.some((id) => !id.trim()) || new Set(playerIds).size !== playerIds.length) {
        throw new Error('Roster player IDs must be non-empty and unique');
    }

    // Keep only snapshots for roster members and validate each display name before persisting it.
    const names = Object.fromEntries(Object.entries(playerNames).filter(([id]) => playerIds.includes(id)));
    if (Object.values(names).some((name) => !name.trim())) throw new Error('Roster name snapshots must be non-empty');
    return { version: TEAM_ROSTER_VERSION, playerIds: [...playerIds], playerNames: names };
}

/** Serialize only a valid roster record so the local-storage adapter can remain a thin boundary. */
export function serializeTeamRosterRecord(record: TeamRosterRecord): string {
    // Reuse the same invariant check used during hydration before writing persistent state.
    if (!isTeamRosterRecord(record)) throw new Error('Invalid team roster record');
    return JSON.stringify(record);
}

/** Rank the fixed loaded player universe with all nine neutral categories for Team Lab scoring. */
export function rankTeamLabUniverse(universe: PlayerSeason[]): RankedPlayer[] {
    // This neutral profile requests all z-scores while leaving the existing ranker formulas untouched.
    return rank(
        universe,
        {
            leagueSize: 12,
            draftRounds: 13,
            draftType: 'snake',
            enabledCats: [...CAT_KEYS],
            stances: {}
        },
        { availabilityFloor: false }
    );
}

/** Aggregate a saved or proposed lineup without weighting categories or silently dropping unavailable data. */
export function aggregateTeamStrength(
    universe: RankedPlayer[],
    playerIds: string[],
    mode: 'average' | 'total'
): TeamStrengthResult {
    // An empty lineup has its own state rather than a misleading all-zero strength line.
    if (playerIds.length === 0) return { status: 'empty' };

    // Duplicate selected IDs make the roster invalid even when the data universe itself is otherwise usable.
    const duplicateSelectedIds = duplicates(playerIds);
    if (duplicateSelectedIds.length > 0) {
        return { status: 'unavailable', reason: 'duplicate-player', playerIds: duplicateSelectedIds };
    }

    // Resolve every requested identity once and reject incomplete data instead of presenting partial sums.
    const playersById = new Map<string, RankedPlayer>();
    for (const player of universe) {
        if (playersById.has(player.playerId)) {
            return { status: 'unavailable', reason: 'duplicate-player', playerIds: [player.playerId] };
        }
        playersById.set(player.playerId, player);
    }
    const missingPlayerIds = playerIds.filter((playerId) => !playersById.has(playerId));
    if (missingPlayerIds.length > 0) {
        return { status: 'unavailable', reason: 'missing-player', playerIds: missingPlayerIds };
    }
    const players = playerIds.map((playerId) => playersById.get(playerId)!);

    // Every category must have a finite z-score for every member so all chart bars use a complete lineup.
    const missingScores = players
        .filter((player) => CAT_KEYS.some((cat) => !Number.isFinite(player.z[cat])))
        .map((player) => player.playerId);
    if (missingScores.length > 0) {
        return { status: 'unavailable', reason: 'missing-score', playerIds: missingScores };
    }

    // Raw output sums per-game counting stats and combines makes with attempts for accurate team percentages.
    const raw = aggregateRawTotals(players);
    if (!raw)
        return { status: 'unavailable', reason: 'invalid-stat', playerIds: players.map((player) => player.playerId) };

    // Sum category z-scores first, then divide only in average mode; profile weights never enter this calculation.
    const strength = Object.fromEntries(
        CAT_KEYS.map((cat) => {
            const total = players.reduce((sum, player) => sum + player.z[cat]!, 0);
            return [cat, mode === 'average' ? total / players.length : total];
        })
    ) as Record<CatKey, number>;
    return { status: 'ready', playerCount: players.length, strength, raw };
}

/** Create aligned rows from saved membership and leave one empty row ready for the next candidate. */
export function createTeamLabState(rosterPlayerIds: string[]): TeamLabState {
    // Saved membership must be unique before each ID is given a stable row identity.
    if (rosterPlayerIds.some((id) => !id.trim()) || new Set(rosterPlayerIds).size !== rosterPlayerIds.length) {
        throw new Error('Roster player IDs must be non-empty and unique');
    }

    // Keep one trailing slot available even when no players have been selected yet.
    const rows: TeamLabRow[] = rosterPlayerIds.map((playerId, index) => ({
        rowId: `row-${index + 1}`,
        rosterPlayerId: playerId,
        candidatePlayerId: null
    }));
    rows.push({ rowId: `row-${rows.length + 1}`, rosterPlayerId: null, candidatePlayerId: null });
    return { rows, manualSwaps: {}, bulkControlledRowIds: null };
}

/** Append a stable blank row without altering any existing row or swap ownership. */
export function appendTeamLabRow(state: TeamLabState, rowId: string): TeamLabState {
    // Stable row identity is required so manual and bulk ownership remain attached across updates.
    if (!rowId.trim() || state.rows.some((row) => row.rowId === rowId))
        throw new Error('Row ID must be non-empty and unique');
    return {
        ...state,
        rows: [...state.rows, { rowId, rosterPlayerId: null, candidatePlayerId: null }]
    };
}

/** Select or clear one row's candidate while rejecting duplicate ownership across the whole workspace. */
export function setTeamLabCandidate(
    state: TeamLabState,
    rowId: string,
    candidatePlayerId: string | null
): TeamLabState {
    // Resolve the target before checking identity so a typo cannot silently mutate another row.
    const rowIndex = state.rows.findIndex((row) => row.rowId === rowId);
    if (rowIndex < 0) throw new Error(`Unknown Team Lab row: ${rowId}`);

    // A player can appear only once across saved and candidate ownership, including within one row.
    if (
        candidatePlayerId !== null &&
        state.rows.some(
            (row) =>
                row.rowId !== rowId &&
                (row.rosterPlayerId === candidatePlayerId || row.candidatePlayerId === candidatePlayerId)
        )
    ) {
        throw new Error(`Player is already in the Team Lab workspace: ${candidatePlayerId}`);
    }
    const target = state.rows[rowIndex]!;
    if (candidatePlayerId !== null && target.rosterPlayerId === candidatePlayerId) {
        throw new Error(`Player is already on the saved roster: ${candidatePlayerId}`);
    }

    // Candidate edits preserve the row's current manual or bulk orientation and never join a captured batch.
    const rows = [...state.rows];
    rows[rowIndex] = { ...target, candidatePlayerId };
    return { ...state, rows };
}

/** Select or clear a saved teammate in one row while preserving any candidate assigned beside it. */
export function setTeamLabRosterPlayer(
    state: TeamLabState,
    rowId: string,
    rosterPlayerId: string | null
): TeamLabState {
    // Resolve the target before checking ownership so a stale row control cannot update a different slot.
    const rowIndex = state.rows.findIndex((row) => row.rowId === rowId);
    if (rowIndex < 0) throw new Error(`Unknown Team Lab row: ${rowId}`);

    // Keep every non-empty identity unique across roster and candidate ownership, including on the target row.
    if (
        rosterPlayerId !== null &&
        state.rows.some(
            (row) =>
                row.rowId !== rowId &&
                (row.rosterPlayerId === rosterPlayerId || row.candidatePlayerId === rosterPlayerId)
        )
    ) {
        throw new Error(`Player is already in the Team Lab workspace: ${rosterPlayerId}`);
    }
    const target = state.rows[rowIndex]!;
    if (rosterPlayerId !== null && target.candidatePlayerId === rosterPlayerId) {
        throw new Error(`Player is already a candidate: ${rosterPlayerId}`);
    }

    // Roster changes replace only saved ownership; candidate identity and row ordering remain stable.
    const rows = [...state.rows];
    rows[rowIndex] = { ...target, rosterPlayerId };
    return { ...state, rows };
}

/** Toggle one non-empty row and pin its new orientation against any active bulk batch. */
export function swapTeamLabRow(state: TeamLabState, rowId: string): TeamLabState {
    // Unknown or completely empty rows cannot produce a meaningful side change.
    const row = state.rows.find((entry) => entry.rowId === rowId);
    if (!row) throw new Error(`Unknown Team Lab row: ${rowId}`);
    if (row.rosterPlayerId === null && row.candidatePlayerId === null) throw new Error('Cannot swap an empty row');

    // A manual desired orientation takes precedence over bulk membership and survives bulk restoration.
    const desiredOrientation = !isTeamLabRowSwapped(state, rowId);
    const manualSwaps = { ...state.manualSwaps, [rowId]: desiredOrientation };
    const bulkControlledRowIds = state.bulkControlledRowIds?.filter((controlledId) => controlledId !== rowId) ?? null;
    return { ...state, manualSwaps, bulkControlledRowIds };
}

/** Capture eligible rows on activation and clear only batch-owned orientation on deactivation. */
export function toggleTeamLabBulkSwap(state: TeamLabState): TeamLabState {
    // Deactivation drops the captured set; individually pinned orientations remain unchanged.
    if (state.bulkControlledRowIds !== null) return { ...state, bulkControlledRowIds: null };

    // Capture only rows with candidates and no manual pin; later candidate rows wait for a future activation.
    const bulkControlledRowIds = state.rows
        .filter((row) => row.candidatePlayerId !== null && !Object.hasOwn(state.manualSwaps, row.rowId))
        .map((row) => row.rowId);
    return { ...state, bulkControlledRowIds };
}

/** Reset orientations to the saved baseline while retaining all selected candidates. */
export function resetTeamLabPreview(state: TeamLabState): TeamLabState {
    // Clearing both ownership layers restores each row's initial saved-left/candidate-right orientation.
    return { ...state, manualSwaps: {}, bulkControlledRowIds: null };
}

/** Apply the displayed left side as saved membership, then start a clean workspace with no candidates. */
export function applyTeamLabPreview(state: TeamLabState): { rosterPlayerIds: string[]; state: TeamLabState } {
    // Preserve row order while collecting the complete proposed lineup, including unchanged roster players.
    const leftPlayers = state.rows
        .map((row) => displayedTeamLabPlayerIds(state, row).left)
        .filter((playerId): playerId is string => playerId !== null);

    // Reuse surviving row IDs where possible and add one trailing empty row for subsequent search.
    const rows: TeamLabRow[] = state.rows
        .map((row) => ({ row, playerId: displayedTeamLabPlayerIds(state, row).left }))
        .filter((entry): entry is { row: TeamLabRow; playerId: string } => entry.playerId !== null)
        .map(({ row, playerId }) => ({ rowId: row.rowId, rosterPlayerId: playerId, candidatePlayerId: null }));
    const nextRowId = nextAvailableRowId(state.rows.map((row) => row.rowId));
    rows.push({ rowId: nextRowId, rosterPlayerId: null, candidatePlayerId: null });
    return { rosterPlayerIds: leftPlayers, state: { rows, manualSwaps: {}, bulkControlledRowIds: null } };
}

/** Return current row occupants on the left and right without conflating their saved ownership. */
export function displayedTeamLabPlayerIds(
    state: TeamLabState,
    row: TeamLabRow
): { left: string | null; right: string | null } {
    // Manual orientation takes precedence; otherwise only captured bulk rows are swapped.
    const swapped = isTeamLabRowSwapped(state, row.rowId);
    return swapped
        ? { left: row.candidatePlayerId, right: row.rosterPlayerId }
        : { left: row.rosterPlayerId, right: row.candidatePlayerId };
}

/** Read a row's effective orientation from its manual pin or captured bulk membership. */
export function isTeamLabRowSwapped(state: TeamLabState, rowId: string): boolean {
    // Manual entries are intentionally stored as desired booleans so a false pin can override bulk-on state.
    if (Object.hasOwn(state.manualSwaps, rowId)) return state.manualSwaps[rowId]!;
    return state.bulkControlledRowIds?.includes(rowId) ?? false;
}

/** Check a decoded record's version, ID uniqueness, snapshot names, and snapshot-to-roster membership. */
function isTeamRosterRecord(value: unknown): value is TeamRosterRecord {
    // Reject nulls, arrays, and primitives before inspecting versioned record properties.
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const candidate = value as Partial<TeamRosterRecord>;
    if (candidate.version !== TEAM_ROSTER_VERSION || !Array.isArray(candidate.playerIds)) return false;
    if (!candidate.playerIds.every((id) => typeof id === 'string' && id.trim().length > 0)) return false;
    if (new Set(candidate.playerIds).size !== candidate.playerIds.length) return false;
    if (
        typeof candidate.playerNames !== 'object' ||
        candidate.playerNames === null ||
        Array.isArray(candidate.playerNames)
    ) {
        return false;
    }
    const rosterIds = new Set(candidate.playerIds);
    return Object.entries(candidate.playerNames).every(
        ([id, name]) => rosterIds.has(id) && typeof name === 'string' && name.trim().length > 0
    );
}

/** Sum raw per-game counts and calculate team percentages from total makes over total attempts. */
function aggregateRawTotals(players: RankedPlayer[]): TeamRawTotals | null {
    // Validate all raw count inputs before arithmetic so NaN or infinity cannot become a plausible bar tooltip.
    const countKeys = ['pts', 'trb', 'ast', 'stl', 'blk', 'fg3', 'tov', 'fg', 'fga', 'ft', 'fta', 'fg3a'] as const;
    if (players.some((player) => countKeys.some((key) => !Number.isFinite(player[key])))) return null;

    // Sum attempts and makes across players before deriving field-goal rates, avoiding unweighted average errors.
    const totals = Object.fromEntries(
        countKeys.map((key) => [key, players.reduce((sum, player) => sum + player[key], 0)])
    ) as Pick<TeamRawTotals, (typeof countKeys)[number]>;
    return {
        ...totals,
        fgPct: totals.fga > 0 ? totals.fg / totals.fga : null,
        ftPct: totals.fta > 0 ? totals.ft / totals.fta : null
    };
}

/** Return sorted duplicate identities for stable error output. */
function duplicates(values: string[]): string[] {
    // Keep only repeated values and sort them so callers can render or test the result deterministically.
    const seen = new Set<string>();
    const repeated = new Set<string>();
    for (const value of values) {
        if (seen.has(value)) repeated.add(value);
        else seen.add(value);
    }
    return [...repeated].sort();
}

/** Choose a deterministic unused row key for the trailing slot after Apply. */
function nextAvailableRowId(existingIds: string[]): string {
    // Generated IDs are local to the temporary workspace and avoid collisions with retained stable row IDs.
    let suffix = existingIds.length + 1;
    while (existingIds.includes(`row-${suffix}`)) suffix += 1;
    return `row-${suffix}`;
}
