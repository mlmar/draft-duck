import {
    CAT_KEYS,
    CAT_LABELS,
    type CatKey,
    type ComparisonCategory,
    type ComparisonTeam,
    type LeagueComparison
} from '@draft-duck/core';

const API_ROOT = 'https://fantasysports.yahooapis.com/fantasy/v2';
const CATEGORY_MAP: Record<string, CatKey> = {
    pts: 'pts',
    points: 'pts',
    reb: 'trb',
    rebounds: 'trb',
    ast: 'ast',
    assists: 'ast',
    stl: 'stl',
    steals: 'stl',
    blk: 'blk',
    blocks: 'blk',
    '3pm': 'fg3',
    '3ptm': 'fg3',
    threes: 'fg3',
    'three-pointers made': 'fg3',
    '3-point shots made': 'fg3',
    'fg%': 'fgPct',
    'field goal percentage': 'fgPct',
    'ft%': 'ftPct',
    'free throw percentage': 'ftPct',
    to: 'tov',
    tov: 'tov',
    turnovers: 'tov'
};
const categoryStatIds = new WeakMap<ComparisonCategory, string>();

export class YahooError extends Error {
    constructor(
        public code: 'upstream' | 'throttled' | 'unauthorized' | 'forbidden' | 'unsupported' | 'not_found' | 'invalid',
        message: string
    ) {
        super(message);
    }
}

export type YahooLeague = {
    leagueKey: string;
    name: string;
    season: number;
    teamCount: number;
    currentWeek: number;
    weeks: number[];
    supported: boolean;
    unsupportedReason?: string;
    startWeek: number;
    endWeek: number;
    scoringType: string;
    isFinished: boolean;
};

type YahooGame = { gameKey: string; season: number; gameCode: string; isCurrent: boolean };

export class YahooClient {
    constructor(
        private readonly token: string,
        private readonly fetcher: typeof fetch = fetch,
        private readonly timeoutMs = 12_000
    ) {}

    async listLeagues(): Promise<YahooLeague[]> {
        const game = await this.currentGame();
        const raw: Record<string, unknown>[] = [];
        for (let start = 0; start < 500; start += 25) {
            const doc = await this.get(
                `/users;use_login=1/games;game_keys=${encodeURIComponent(game.gameKey)}/leagues;start=${start};count=25?format=json`
            );
            validateLeagueDiscoveryEnvelope(doc, game.gameKey);
            const page = yahooResources(doc, 'league_key');
            raw.push(
                ...page.filter(
                    (item) =>
                        String(item.league_key).startsWith(`${game.gameKey}.l.`) && Number(item.season) === game.season
                )
            );
            if (page.length < 25) break;
        }

        const seen = new Set<string>();
        return raw
            .filter((item) => {
                const key = String(item.league_key);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .map((item) => normalizeLeague(item, game));
    }

    async comparison(league: YahooLeague, week: number): Promise<LeagueComparison> {
        if (!league.weeks.includes(week)) throw new YahooError('invalid', 'Week is outside this league season.');
        const [settingsDoc, teamsDoc] = await Promise.all([
            this.get(`/league/${encodeURIComponent(league.leagueKey)}/settings?format=json`),
            this.get(`/league/${encodeURIComponent(league.leagueKey)}/teams/stats;type=week;week=${week}?format=json`)
        ]);
        const settings =
            yahooResources(settingsDoc, 'league_key').find((item) => item.stat_categories !== undefined) ??
            findObjects(settingsDoc, (item) => item.stat_categories !== undefined)[0];
        if (!settings) throw new YahooError('upstream', 'Yahoo returned malformed league settings.');
        const categories = parseCategories(settings, league.scoringType);
        if (!categories.length)
            throw new YahooError('unsupported', 'This league has no supported basketball categories.');
        const teams = parseTeams(teamsDoc, categories, week, league.leagueKey, league.teamCount);
        const isFinished = league.isFinished;
        return {
            league: {
                leagueKey: league.leagueKey,
                name: league.name,
                season: league.season,
                teamCount: league.teamCount,
                currentWeek: league.currentWeek,
                weeks: league.weeks,
                isFinished
            },
            week,
            inProgress: week === league.currentWeek && !isFinished,
            fetchedAt: new Date().toISOString(),
            categories,
            teams
        };
    }

    /** Resolve the live NBA game first so league reads cannot include another season. */
    private async currentGame(): Promise<YahooGame> {
        const doc = await this.get('/game/nba?format=json');
        if (!isRecord(doc) || !isRecord(doc.fantasy_content) || !Object.hasOwn(doc.fantasy_content, 'game')) {
            throw new YahooError('upstream', 'Yahoo returned malformed NBA game data.');
        }
        const games = yahooResources(doc, 'game_key')
            .map((item) => ({
                gameKey: String(item.game_key),
                season: intOr(item.season, 0),
                gameCode: stringOr(item.code, stringOr(item.game_code, 'nba')).toLowerCase(),
                isCurrent: isTruthy(item.is_current)
            }))
            .filter((game) => game.gameKey && game.season > 0 && game.gameCode === 'nba');
        if (!games.length) throw new YahooError('upstream', 'Yahoo did not return the current NBA game.');
        const explicitCurrent = games.filter((game) => game.isCurrent);
        const candidates = explicitCurrent.length ? explicitCurrent : games;
        candidates.sort((a, b) => b.season - a.season || a.gameKey.localeCompare(b.gameKey));
        return candidates[0]!;
    }

    private async get(path: string): Promise<unknown> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await this.fetcher(`${API_ROOT}${path}`, {
                headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json' },
                signal: controller.signal
            });
            if (response.status === 401)
                throw new YahooError('unauthorized', 'Yahoo authorization is no longer valid.');
            if (response.status === 403)
                throw new YahooError(
                    'forbidden',
                    'Yahoo denied access to Fantasy Sports data. Check this application’s Fantasy Sports Read permission and API access approval.'
                );
            if (response.status === 429) throw new YahooError('throttled', 'Yahoo is temporarily throttling requests.');
            if (!response.ok) throw new YahooError('upstream', 'Yahoo request failed.');
            const data: unknown = await response.json().catch(() => null);
            if (!data || typeof data !== 'object') throw new YahooError('upstream', 'Yahoo returned malformed data.');
            return data;
        } catch (error) {
            if (error instanceof YahooError) throw error;
            throw new YahooError(
                'upstream',
                error instanceof Error && error.name === 'AbortError'
                    ? 'Yahoo request timed out.'
                    : 'Yahoo request failed.'
            );
        } finally {
            clearTimeout(timeout);
        }
    }
}

/** Require Yahoo's user → game → leagues envelope, while accepting an explicit empty leagues collection. */
function validateLeagueDiscoveryEnvelope(doc: unknown, gameKey: string): void {
    if (!isRecord(doc) || !isRecord(doc.fantasy_content) || !Object.hasOwn(doc.fantasy_content, 'users')) {
        throw new YahooError('upstream', 'Yahoo returned malformed league membership data.');
    }
    const users = readYahooCollection(doc.fantasy_content.users, 'user');
    for (const user of users.items) {
        if (!Object.hasOwn(user, 'games')) throw malformedMembership();
        const games = readYahooCollection(user.games, 'game');
        for (const game of games.items) {
            if (typeof game.game_key !== 'string' || !game.game_key) throw malformedMembership();
        }
        const matchingGames = games.items.filter((game) => game.game_key === gameKey);
        if (!matchingGames.length) {
            if (games.items.length) throw malformedMembership();
            continue;
        }
        if (matchingGames.length !== 1 || !Object.hasOwn(matchingGames[0]!, 'leagues')) throw malformedMembership();
        const leagues = readYahooCollection(matchingGames[0]!.leagues, 'league');
        for (const league of leagues.items) {
            if (typeof league.league_key !== 'string' || !league.league_key) throw malformedMembership();
        }
    }
}

/** Parse one Yahoo numeric-keyed collection and check its declared count against its resource rows. */
function readYahooCollection(value: unknown, itemName: string): { items: Record<string, unknown>[] } {
    const items: Record<string, unknown>[] = [];
    let recognized = false;
    let declaredCount: number | undefined;
    if (Array.isArray(value)) {
        if (value.length) throw malformedMembership();
        recognized = true;
    } else if (isRecord(value)) {
        if (Object.hasOwn(value, 'count')) {
            const count = value.count;
            let parsed: number;
            if (typeof count === 'number') parsed = count;
            else if (typeof count === 'string' && count.trim()) parsed = Number(count);
            else parsed = NaN;
            if (!Number.isInteger(parsed) || parsed < 0) throw malformedMembership();
            declaredCount = parsed;
            recognized = true;
        }
        if (Object.hasOwn(value, itemName)) {
            recognized = true;
            const item = mergeYahooResource(value[itemName]);
            if (item) items.push(item);
            else if (!Array.isArray(value[itemName]) || value[itemName].length) throw malformedMembership();
        }
        for (const [key, child] of Object.entries(value)) {
            if (key === 'count' || key === itemName) continue;
            if (!/^\d+$/.test(key)) continue;
            if (!isRecord(child) || !Object.hasOwn(child, itemName)) throw malformedMembership();
            recognized = true;
            const item = mergeYahooResource(child[itemName]);
            if (!item) throw malformedMembership();
            items.push(item);
        }
    }
    if (!recognized) throw malformedMembership();
    if (declaredCount !== undefined && declaredCount !== items.length) throw malformedMembership();
    return { items };
}

function mergeYahooResource(value: unknown): Record<string, unknown> | null {
    if (isRecord(value)) return value;
    if (!Array.isArray(value)) return null;
    const merged: Record<string, unknown> = {};
    for (const fragment of value) {
        if (Array.isArray(fragment)) {
            for (const nestedFragment of fragment) {
                if (!isRecord(nestedFragment)) return null;
                Object.assign(merged, nestedFragment);
            }
        } else if (isRecord(fragment)) Object.assign(merged, fragment);
        else return null;
    }
    return Object.keys(merged).length ? merged : null;
}

function malformedMembership(): YahooError {
    return new YahooError('upstream', 'Yahoo returned malformed league membership data.');
}

function normalizeLeague(item: Record<string, unknown>, game: YahooGame): YahooLeague {
    const hasWeekBounds = [item.start_week, item.end_week, item.current_week].every(
        (value) => value !== undefined && Number.isInteger(Number(value)) && Number(value) > 0
    );
    const startWeek = intOr(item.start_week, 1);
    const endWeek = intOr(item.end_week, 1);
    const currentWeek = intOr(item.current_week, startWeek);
    const teamCount = intOr(item.num_teams, 0);
    const scoringType = stringOr(item.scoring_type, '').toLowerCase();
    const isFinished = isTruthy(item.is_finished);
    const weeks =
        hasWeekBounds && endWeek >= startWeek
            ? Array.from({ length: endWeek - startWeek + 1 }, (_, index) => startWeek + index).filter(
                  (week) => week <= currentWeek
              )
            : [];
    const scoringSupported = ['head', 'roto'].includes(scoringType);
    let reason: string | undefined;
    if (!teamCount) reason = 'Yahoo did not provide the league team count.';
    else if (!hasWeekBounds || endWeek < startWeek) reason = 'Yahoo did not provide valid current-season week bounds.';
    else if (!weeks.length) reason = 'No league weeks have started yet.';
    else if (!scoringSupported && scoringType.includes('point')) reason = 'Points-scoring leagues are not supported.';
    else if (!scoringSupported) reason = 'Yahoo returned an unsupported league scoring format.';
    return {
        leagueKey: String(item.league_key),
        name: stringOr(item.name, 'Yahoo league'),
        season: game.season,
        teamCount,
        currentWeek,
        startWeek,
        endWeek,
        weeks,
        scoringType,
        isFinished,
        supported: teamCount > 1 && hasWeekBounds && endWeek >= startWeek && weeks.length > 0 && scoringSupported,
        ...(reason ? { unsupportedReason: reason } : {})
    };
}

/** Keep categories tied to their documented metadata IDs and ignore only explicit display/disabled rows. */
export function parseCategories(settings: Record<string, unknown>, scoringType?: string): ComparisonCategory[] {
    const format = String(scoringType ?? settings.scoring_type ?? '').toLowerCase();
    if (!['head', 'roto'].includes(format)) {
        throw new YahooError(
            'unsupported',
            format.includes('point')
                ? 'Points-scoring leagues are not supported.'
                : 'Yahoo returned an unsupported league scoring format.'
        );
    }
    const stats = findObjects(settings.stat_categories, (item) => item.stat_id !== undefined);
    const modifiers = findObjects(settings.stat_modifiers, (item) => item.stat_id !== undefined);
    const scoredModifiers = modifiers.filter((item) => Number(item.value ?? item.modifier_value ?? 0) !== 0);
    if (scoredModifiers.length)
        throw new YahooError('unsupported', 'This league uses stat modifiers that are not supported.');

    const categories: ComparisonCategory[] = [];
    for (const stat of stats) {
        if (isTruthy(stat.is_only_display_stat) || isExplicitlyDisabled(stat)) continue;
        const label = stringOr(stat.display_name, stringOr(stat.name, ''));
        const normalized = normalizeLabel(label);
        const name = normalizeLabel(stringOr(stat.name, ''));
        const key = CATEGORY_MAP[normalized] ?? CATEGORY_MAP[name];
        if (!key) throw new YahooError('unsupported', `Unsupported scored category: ${label || 'unknown'}.`);
        if (!CAT_KEYS.includes(key)) continue;
        const type = stringOr(stat.stat_type, '').toLowerCase();
        if (type && !['integer', 'decimal', 'percent', 'percentage'].includes(type)) {
            throw new YahooError('unsupported', `Unsupported category format for ${label}.`);
        }
        const category = {
            key,
            label: CAT_LABELS[key],
            direction: key === 'tov' ? 'lower' : 'higher',
            format: key === 'fgPct' || key === 'ftPct' ? 'percentage' : 'count'
        } as ComparisonCategory;
        categoryStatIds.set(category, String(stat.stat_id));
        categories.push(category);
    }
    if (new Set(categories.map((category) => category.key)).size !== categories.length) {
        throw new YahooError('unsupported', 'Yahoo returned duplicate category metadata.');
    }
    return categories;
}

/** Validate every team belongs to the requested league and period before normalizing stats. */
export function parseTeams(
    doc: unknown,
    categories: ComparisonCategory[],
    requestedWeek?: number,
    leagueKey?: string,
    expectedTeams?: number
): ComparisonTeam[] {
    const rawTeams = yahooResources(doc, 'team_key');
    const teams: ComparisonTeam[] = [];
    const seen = new Set<string>();
    for (const raw of rawTeams) {
        const teamKey = String(raw.team_key);
        if (seen.has(teamKey)) throw new YahooError('upstream', 'Yahoo returned duplicate league team data.');
        if (leagueKey && !teamKey.startsWith(`${leagueKey}.t.`))
            throw new YahooError('upstream', 'Yahoo returned a team outside this league.');
        seen.add(teamKey);

        const coverage = findObjects(
            raw.team_stats,
            (item) => item.coverage_type !== undefined || item.week !== undefined
        )[0];
        if (
            requestedWeek !== undefined &&
            (!coverage ||
                String(coverage.coverage_type ?? '').toLowerCase() !== 'week' ||
                Number(coverage.week) !== requestedWeek)
        ) {
            throw new YahooError(
                'unsupported',
                'Yahoo did not return weekly credited team results for the requested week.'
            );
        }
        const stats = findObjects(raw.team_stats, (item) => item.stat_id !== undefined);
        const values: Partial<Record<CatKey, number | null>> = {};
        for (const category of categories) {
            const statId = categoryStatIds.get(category);
            if (!statId) throw new YahooError('upstream', 'Yahoo category metadata was incomplete.');
            const stat = stats.find((item) => String(item.stat_id) === statId);
            if (!stat) {
                values[category.key] = null;
                continue;
            }
            const rawValue = stat.value;
            if (
                rawValue === null ||
                rawValue === undefined ||
                (typeof rawValue === 'string' && isMissingStat(rawValue))
            ) {
                values[category.key] = null;
                continue;
            }
            if (typeof rawValue !== 'string' && typeof rawValue !== 'number') {
                throw new YahooError('upstream', 'Yahoo returned an invalid team statistic.');
            }
            const value = Number(rawValue);
            if (!Number.isFinite(value)) throw new YahooError('upstream', 'Yahoo returned an invalid team statistic.');
            values[category.key] = value;
        }
        const ownership = findObjects(raw, (item) => item.is_owned_by_current_login !== undefined)[0];
        teams.push({
            teamKey,
            name: stringOr(raw.name, 'Yahoo team'),
            isOwned: isTruthy(ownership?.is_owned_by_current_login),
            values
        });
    }
    if (teams.length < 2 || (expectedTeams !== undefined && teams.length !== expectedTeams)) {
        throw new YahooError('upstream', 'Yahoo returned an incomplete set of league teams.');
    }
    return teams;
}

/** Yahoo encodes resources as sibling fragments; merge only fragments in that resource tuple. */
export function yahooResources(value: unknown, identityKey: string): Record<string, unknown>[] {
    const found: Record<string, unknown>[] = [];
    const visit = (input: unknown): void => {
        if (Array.isArray(input)) {
            const identityFragments = input.flatMap((item) => directIdentityObjects(item, identityKey));
            if (identityFragments.length === 1) {
                const merged: Record<string, unknown> = {};
                for (const fragment of input) {
                    if (Array.isArray(fragment)) {
                        for (const part of fragment) if (isRecord(part)) Object.assign(merged, part);
                    } else if (isRecord(fragment)) {
                        Object.assign(merged, fragment);
                    }
                }
                found.push(merged);
                for (const [key, child] of Object.entries(merged)) if (key !== identityKey) visit(child);
                return;
            }
            for (const child of input) visit(child);
            return;
        }
        if (!isRecord(input)) return;
        if (Object.hasOwn(input, identityKey)) {
            found.push(input);
            for (const [key, child] of Object.entries(input)) if (key !== identityKey) visit(child);
            return;
        }
        for (const child of Object.values(input)) visit(child);
    };
    visit(value);
    return found;
}

function directIdentityObjects(value: unknown, identityKey: string): Record<string, unknown>[] {
    if (isRecord(value)) return Object.hasOwn(value, identityKey) ? [value] : [];
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is Record<string, unknown> => isRecord(item) && Object.hasOwn(item, identityKey));
}

function findObjects(
    value: unknown,
    predicate: (item: Record<string, unknown>) => boolean,
    found: Record<string, unknown>[] = []
): Record<string, unknown>[] {
    if (Array.isArray(value)) {
        for (const item of value) findObjects(item, predicate, found);
        return found;
    }
    if (!isRecord(value)) return found;
    if (predicate(value)) found.push(value);
    for (const child of Object.values(value)) findObjects(child, predicate, found);
    return found;
}

function isExplicitlyDisabled(stat: Record<string, unknown>): boolean {
    return (
        (stat.enabled !== undefined && !isTruthy(stat.enabled)) ||
        (stat.is_enabled !== undefined && !isTruthy(stat.is_enabled))
    );
}
function normalizeLabel(value: string): string {
    return value.trim().toLowerCase().replace(/[.]/g, '').replace(/\s+/g, ' ');
}
function isMissingStat(value: string): boolean {
    return ['', '-', '--', '—', '–'].includes(value.trim());
}
function isTruthy(value: unknown): boolean {
    return (
        value === true || value === 1 || String(value).toLowerCase() === '1' || String(value).toLowerCase() === 'true'
    );
}
function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function intOr(value: unknown, fallback: number): number {
    const number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : fallback;
}
function stringOr(value: unknown, fallback: string): string {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
}
